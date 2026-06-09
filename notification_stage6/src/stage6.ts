import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import {
  Log,
  initializeLogger
} from "../../logging_middleware/dist/index.js";

type Level = "debug" | "info" | "warn" | "error" | "fatal";
type BackendPackage =
  | "cache"
  | "controller"
  | "cron_job"
  | "db"
  | "domain"
  | "handler"
  | "repository"
  | "route"
  | "service"
  | "auth"
  | "config"
  | "middleware"
  | "utils";

const NOTIFICATIONS_URL =
  "http://4.224.186.213/evaluation-service/notifications";
const OUTPUT_JSON_PATH = path.resolve(__dirname, "../stage6_output.json");
const OUTPUT_TEXT_PATH = path.resolve(__dirname, "../stage6_output.txt");
const DEFAULT_TOP_COUNT = 10;
const ENV_PATHS = [
  path.resolve(__dirname, ".env"),
  path.resolve(__dirname, "../.env"),
  path.resolve(__dirname, "../../logging_middleware/src/.env")
];

type NotificationType = "Placement" | "Result" | "Event";

type ApiNotification = {
  ID: string;
  Type: NotificationType;
  Message: string;
  Timestamp: string;
  Read?: boolean;
  IsRead?: boolean;
};

type NotificationsApiResponse = {
  notifications: ApiNotification[];
};

type RankedNotification = ApiNotification & {
  timestampMs: number;
  weight: number;
};

const PRIORITY_WEIGHTS: Record<NotificationType, number> = {
  Placement: 3,
  Result: 2,
  Event: 1
};

const loadEnvFromFile = () => {
  for (const envPath of ENV_PATHS) {
    try {
      const contents = readFileSync(envPath, "utf8");

      for (const line of contents.split(/\r?\n/)) {
        const trimmedLine = line.trim();

        if (!trimmedLine || trimmedLine.startsWith("#")) {
          continue;
        }

        const separatorIndex = trimmedLine.indexOf("=");

        if (separatorIndex === -1) {
          continue;
        }

        const key = trimmedLine.slice(0, separatorIndex).trim();
        const value = trimmedLine.slice(separatorIndex + 1).trim();

        if (!(key in process.env)) {
          process.env[key] = value;
        }
      }

      return;
    } catch {
      // Try the next fallback env file path.
    }
  }
};

const logSafely = async (
  level: Level,
  packageName: BackendPackage,
  message: string
) => {
  try {
    await Log("backend", level, packageName, message);
  } catch {
    // Remote logging should not prevent Stage 6 output generation.
  }
};

const ensureToken = () => {
  const token = process.env.BEARER_TOKEN?.trim();

  if (!token || token === "replace-with-valid-token") {
    throw new Error(
      "Set BEARER_TOKEN in notification_stage6/.env or logging_middleware/src/.env before running Stage 6."
    );
  }

  return token;
};

const getErrorMessage = async (response: Response) => {
  const text = await response.text();
  return text || response.statusText;
};

const parseTimestamp = (value: string) => {
  const normalized = value.includes("T")
    ? value
    : value.replace(" ", "T");
  const parsed = Date.parse(normalized);

  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid notification timestamp: ${value}`);
  }

  return parsed;
};

const isUnread = (notification: ApiNotification) => {
  if (typeof notification.Read === "boolean") {
    return !notification.Read;
  }

  if (typeof notification.IsRead === "boolean") {
    return !notification.IsRead;
  }

  return true;
};

class MinHeap<T> {
  private readonly items: T[] = [];

  public constructor(
    private readonly compare: (left: T, right: T) => number
  ) {}

  public get size() {
    return this.items.length;
  }

  public peek() {
    return this.items[0];
  }

  public push(value: T) {
    this.items.push(value);
    this.bubbleUp(this.items.length - 1);
  }

  public replaceRoot(value: T) {
    if (this.items.length === 0) {
      this.items.push(value);
      return;
    }

    this.items[0] = value;
    this.bubbleDown(0);
  }

  public toArray() {
    return [...this.items];
  }

  private bubbleUp(index: number) {
    let currentIndex = index;

    while (currentIndex > 0) {
      const parentIndex = Math.floor((currentIndex - 1) / 2);

      if (
        this.compare(
          this.items[currentIndex] as T,
          this.items[parentIndex] as T
        ) >= 0
      ) {
        break;
      }

      this.swap(currentIndex, parentIndex);
      currentIndex = parentIndex;
    }
  }

  private bubbleDown(index: number) {
    let currentIndex = index;

    while (true) {
      const leftChild = currentIndex * 2 + 1;
      const rightChild = currentIndex * 2 + 2;
      let smallest = currentIndex;

      if (
        leftChild < this.items.length &&
        this.compare(
          this.items[leftChild] as T,
          this.items[smallest] as T
        ) < 0
      ) {
        smallest = leftChild;
      }

      if (
        rightChild < this.items.length &&
        this.compare(
          this.items[rightChild] as T,
          this.items[smallest] as T
        ) < 0
      ) {
        smallest = rightChild;
      }

      if (smallest === currentIndex) {
        break;
      }

      this.swap(currentIndex, smallest);
      currentIndex = smallest;
    }
  }

  private swap(left: number, right: number) {
    const current = this.items[left];
    this.items[left] = this.items[right] as T;
    this.items[right] = current as T;
  }
}

const compareRank = (
  left: RankedNotification,
  right: RankedNotification
) => {
  if (left.weight !== right.weight) {
    return left.weight - right.weight;
  }

  return left.timestampMs - right.timestampMs;
};

const rankNotifications = (
  notifications: ApiNotification[],
  topCount: number
) => {
  const heap = new MinHeap<RankedNotification>(compareRank);

  for (const notification of notifications) {
    if (!isUnread(notification)) {
      continue;
    }

    const rankedNotification: RankedNotification = {
      ...notification,
      timestampMs: parseTimestamp(notification.Timestamp),
      weight: PRIORITY_WEIGHTS[notification.Type]
    };

    if (heap.size < topCount) {
      heap.push(rankedNotification);
      continue;
    }

    const lowestRanked = heap.peek();

    if (lowestRanked && compareRank(rankedNotification, lowestRanked) > 0) {
      heap.replaceRoot(rankedNotification);
    }
  }

  return heap
    .toArray()
    .sort((left, right) => compareRank(right, left));
};

const fetchNotifications = async (token: string) => {
  const response = await fetch(NOTIFICATIONS_URL, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await getErrorMessage(response)}`);
  }

  const data = await response.json() as NotificationsApiResponse;
  return data.notifications;
};

const toTextReport = (notifications: RankedNotification[]) => {
  const lines = [
    "Priority Inbox - Top 10 Notifications",
    `Generated At: ${new Date().toISOString()}`,
    ""
  ];

  notifications.forEach((notification, index) => {
    lines.push(`Rank ${index + 1}`);
    lines.push(`ID: ${notification.ID}`);
    lines.push(`Type: ${notification.Type}`);
    lines.push(`Message: ${notification.Message}`);
    lines.push(`Timestamp: ${notification.Timestamp}`);
    lines.push(`Weight: ${notification.weight}`);
    lines.push("");
  });

  return lines.join("\n");
};

async function main() {
  loadEnvFromFile();

  const token = ensureToken();
  initializeLogger(token);

  await logSafely("info", "service", "Stage 6 priority inbox run started");

  const notifications = await fetchNotifications(token);

  await logSafely(
    "info",
    "service",
    `Fetched ${notifications.length} notifications from protected API`
  );

  const topNotifications = rankNotifications(
    notifications,
    DEFAULT_TOP_COUNT
  );

  await writeFile(
    OUTPUT_JSON_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalFetched: notifications.length,
        topCount: topNotifications.length,
        topNotifications: topNotifications.map((notification, index) => ({
          rank: index + 1,
          id: notification.ID,
          type: notification.Type,
          message: notification.Message,
          timestamp: notification.Timestamp,
          weight: notification.weight
        }))
      },
      null,
      2
    )
  );

  await writeFile(
    OUTPUT_TEXT_PATH,
    toTextReport(topNotifications)
  );

  await logSafely(
    "info",
    "service",
    `Stage 6 priority inbox completed with ${topNotifications.length} ranked notifications`
  );
}

main().catch(async (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  await logSafely("error", "service", `Stage 6 priority inbox failed: ${message}`);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
