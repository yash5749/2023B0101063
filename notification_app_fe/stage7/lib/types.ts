export type NotificationType = "Event" | "Result" | "Placement";

export type RawNotification = {
  ID?: string;
  id?: string;
  Type?: NotificationType | string;
  type?: NotificationType | string;
  Message?: string;
  message?: string;
  Timestamp?: string;
  timestamp?: string;
  Read?: boolean;
  IsRead?: boolean;
  isRead?: boolean;
  Title?: string;
  title?: string;
  [key: string]: unknown;
};

export type NormalizedNotification = {
  id: string;
  type: NotificationType | string;
  message: string;
  timestamp: string;
  isRead: boolean;
  title: string;
};
