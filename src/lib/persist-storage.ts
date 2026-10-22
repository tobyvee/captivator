import type { StateStorage } from "zustand/middleware";

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

export type DebouncedStorage = StateStorage<void> & { flush(): void };

const pageEvents = (): DebouncedStorageOptions["events"] =>
  typeof window !== "undefined" && typeof document !== "undefined"
    ? { window, document }
    : undefined;

/**
 * A Zustand `StateStorage` that holds the latest value per key and writes it after `delay` ms
 * of quiet, so a slider drag is one localStorage write rather than dozens. A pending write is
 * flushed when the page is hidden or closed, so the last edit isn't lost.
 */
export function createDebouncedStorage({
  delay = 300,
  onError,
  onSuccess,
  getStorage = () => globalThis.localStorage,
  events = pageEvents(),
}: DebouncedStorageOptions): DebouncedStorage {
  const pending = new Map<string, string>();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const flush = () => {
    clearTimeout(timer);
    timer = undefined;
    const writes = [...pending];
    pending.clear();
    for (const [key, value] of writes) {
      try {
        getStorage().setItem(key, value);
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
    getItem: (key) => pending.get(key) ?? getStorage().getItem(key),
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
