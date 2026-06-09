const STORAGE_PREFIX = "notification-stage7:viewed:";

const storageKey = (userId: string) => `${STORAGE_PREFIX}${userId}`;

export const loadViewedIds = (userId: string) => {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(parsed);
  } catch {
    return new Set<string>();
  }
};

export const saveViewedIds = (userId: string, ids: Set<string>) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    storageKey(userId),
    JSON.stringify(Array.from(ids))
  );
};
