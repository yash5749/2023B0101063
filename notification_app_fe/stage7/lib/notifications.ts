import type {
  NormalizedNotification,
  NotificationType,
  RawNotification
} from "./types";

const TYPE_ORDER: NotificationType[] = ["Placement", "Result", "Event"];

export const typeOptions = ["All", ...TYPE_ORDER] as const;

export const normalizeNotification = (
  item: RawNotification
): NormalizedNotification => {
  const id = String(item.ID ?? item.id ?? "");
  const type = String(item.Type ?? item.type ?? "Event");
  const message = String(item.Message ?? item.message ?? "");
  const timestamp = String(item.Timestamp ?? item.timestamp ?? "");
  const title = String(item.Title ?? item.title ?? type);

  const readValue =
    typeof item.Read === "boolean"
      ? item.Read
      : typeof item.IsRead === "boolean"
        ? item.IsRead
        : typeof item.isRead === "boolean"
          ? item.isRead
          : false;

  return {
    id,
    type,
    message,
    timestamp,
    isRead: readValue,
    title
  };
};

export const typeRank = (value: string) => {
  const index = TYPE_ORDER.indexOf(value as NotificationType);
  return index === -1 ? TYPE_ORDER.length : index;
};

export const sortNotifications = (items: NormalizedNotification[]) =>
  [...items].sort((left, right) => {
    const typeDelta = typeRank(left.type) - typeRank(right.type);

    if (typeDelta !== 0) {
      return typeDelta;
    }

    return Date.parse(right.timestamp) - Date.parse(left.timestamp);
  });

export const filterByType = (
  items: NormalizedNotification[],
  selectedType: string
) => {
  if (selectedType === "All") {
    return items;
  }

  return items.filter((item) => item.type === selectedType);
};

export const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
