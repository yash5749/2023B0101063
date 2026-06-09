import type { RawNotification } from "./types";

type ApiResponse = {
  notifications?: RawNotification[];
  data?: RawNotification[];
  items?: RawNotification[];
  message?: string;
};

export type FetchNotificationsArgs = {
  userId: string;
  limit: number;
  page: number;
  notificationType?: string;
};

export const fetchNotifications = async ({
  userId,
  limit,
  page,
  notificationType
}: FetchNotificationsArgs) => {
  const params = new URLSearchParams({
    limit: String(limit),
    page: String(page)
  });

  if (notificationType && notificationType !== "All") {
    params.set("notification_type", notificationType);
  }

  const response = await fetch(`/api/notifications?${params.toString()}`, {
    headers: {
      "X-User-Id": userId
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const payload = (await response.json()) as ApiResponse;
  const raw = payload.notifications ?? payload.data ?? payload.items ?? [];
  return raw;
};
