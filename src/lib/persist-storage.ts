import type { PersistStorage, StorageValue } from "zustand/middleware";

export type DebouncedStorageOptions = {
  /** How long a write waits for further writes, in ms. */
  delay?: number;
  /** Called when a write fails (QuotaExceededError included). Writes never throw. */
  onError: (error: unknown) => void;
  /** Called after each successful write. */
  onSuccess?: () => void;
  getStorage?: () => Storage;
  /** Flush on `pagehide` and on `visibilitychange` to hidden. Defaults to the page's own. */
  events?: { window: EventTarget; document: EventTarget & { visibilityState: string } };
};

export type DebouncedStorage<S> = PersistStorage<S, void> & { flush(): void };

const pageEvents = (): DebouncedStorageOptions["events"] =>
  typeof window !== "undefined" && typeof document !== "undefined"
    ? { window, document }
    : undefined;

/**
 * A Zustand `PersistStorage` that holds the latest value per key and serialises and writes it
 * after `delay` ms of quiet, so a slider drag is one `JSON.stringify` and one localStorage write
 * rather than dozens. A pending write is flushed when the page is hidden or closed, so the last
 * edit isn't lost.
 */
export function createDebouncedStorage<S>({
  delay = 300,
  onError,
  onSuccess,
  getStorage = () => globalThis.localStorage,
  events = pageEvents(),
}: DebouncedStorageOptions): DebouncedStorage<S> {
  const pending = new Map<string, StorageValue<S>>();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const flush = () => {
    clearTimeout(timer);
    timer = undefined;
    const writes = [...pending];
    pending.clear();
    for (const [key, value] of writes) {
      try {
        getStorage().setItem(key, JSON.stringify(value));
        onSuccess?.();
      } catch (error) {
        onError(error);
      }
    }
  };

  events?.window.addEventListener("pagehide", flush);
  events?.document.addEventListener("visibilitychange", () => {
    if (events.document.visibilityState === "hidden") flush();
  });

  return {
    getItem: (key) => {
      const value = pending.get(key);
      if (value) return value;
      const raw = getStorage().getItem(key);
      // Corrupt JSON throws here, which persist reports to onRehydrateStorage. The shape is
      // unchecked: persist only reads `state` and a numeric `version`, and the store's `merge`
      // validates `state` against the schema.
      return raw === null ? null : (JSON.parse(raw) as StorageValue<S>);
    },
    setItem: (key, value) => {
      pending.set(key, value);
      clearTimeout(timer);
      timer = setTimeout(flush, delay);
    },
    removeItem: (key) => {
      pending.delete(key);
      getStorage().removeItem(key);
    },
    flush,
  };
}
