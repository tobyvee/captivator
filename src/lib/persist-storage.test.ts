import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDebouncedStorage, type DebouncedStorageOptions } from "./persist-storage";

class FakeStorage implements Storage {
  data = new Map<string, string>();
  setItem = vi.fn((key: string, value: string) => void this.data.set(key, value));
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}

const quotaError = () => new DOMException("The quota has been exceeded.", "QuotaExceededError");

const fakeEvents = () => ({
  window: new EventTarget(),
  document: Object.assign(new EventTarget(), { visibilityState: "visible" }),
});

let storage: FakeStorage;
let onError: ReturnType<typeof vi.fn<(e: unknown) => void>>;
let onSuccess: ReturnType<typeof vi.fn<() => void>>;

const make = (options: Partial<DebouncedStorageOptions> = {}) =>
  createDebouncedStorage({ onError, onSuccess, getStorage: () => storage, ...options });

beforeEach(() => {
  vi.useFakeTimers();
  storage = new FakeStorage();
  onError = vi.fn();
  onSuccess = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createDebouncedStorage", () => {
  it("writes only the latest value, once, after 300ms", () => {
    const s = make();
    s.setItem("k", "1");
    s.setItem("k", "2");
    vi.advanceTimersByTime(299);
    expect(storage.setItem).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(storage.getItem("k")).toBe("2");
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("restarts the timer on each write", () => {
    const s = make();
    s.setItem("k", "1");
    vi.advanceTimersByTime(200);
    s.setItem("k", "2");
    vi.advanceTimersByTime(200);
    expect(storage.setItem).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(storage.getItem("k")).toBe("2");
  });

  it("honours a custom delay", () => {
    const s = make({ delay: 50 });
    s.setItem("k", "1");
    vi.advanceTimersByTime(50);
    expect(storage.getItem("k")).toBe("1");
  });

  it("reads a pending value before storage, and storage otherwise", () => {
    storage.data.set("k", "stored");
    const s = make();
    expect(s.getItem("k")).toBe("stored");
    s.setItem("k", "pending");
    expect(s.getItem("k")).toBe("pending");
    expect(s.getItem("missing")).toBeNull();
  });

  it("removeItem cancels a pending write and removes the stored value", () => {
    storage.data.set("k", "stored");
    const s = make();
    s.setItem("k", "pending");
    s.removeItem("k");
    vi.advanceTimersByTime(300);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.getItem("k")).toBeNull();
  });

  it("flush writes the pending value now, and only once", () => {
    const s = make();
    s.setItem("k", "1");
    s.flush();
    expect(storage.getItem("k")).toBe("1");
    vi.advanceTimersByTime(300);
    s.flush();
    expect(storage.setItem).toHaveBeenCalledTimes(1);
  });

  it("reports a QuotaExceededError from the timer instead of throwing", () => {
    storage.setItem.mockImplementation(() => {
      throw quotaError();
    });
    const s = make();
    s.setItem("k", "1");
    expect(() => vi.advanceTimersByTime(300)).not.toThrow();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toMatchObject({ name: "QuotaExceededError" });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("reports a QuotaExceededError from flush instead of throwing", () => {
    storage.setItem.mockImplementation(() => {
      throw quotaError();
    });
    const s = make();
    s.setItem("k", "1");
    expect(() => s.flush()).not.toThrow();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toMatchObject({ name: "QuotaExceededError" });
  });

  it("reports a storage that can't be opened instead of throwing", () => {
    const s = make({
      getStorage: () => {
        throw new DOMException("Access denied", "SecurityError");
      },
    });
    s.setItem("k", "1");
    expect(() => s.flush()).not.toThrow();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("flushes a pending write on pagehide", () => {
    const events = fakeEvents();
    const s = make({ events });
    s.setItem("k", "1");
    events.window.dispatchEvent(new Event("pagehide"));
    expect(storage.getItem("k")).toBe("1");
  });

  it("flushes a pending write when the page becomes hidden, not when it becomes visible", () => {
    const events = fakeEvents();
    const s = make({ events });
    s.setItem("k", "1");
    events.document.dispatchEvent(new Event("visibilitychange"));
    expect(storage.setItem).not.toHaveBeenCalled();
    events.document.visibilityState = "hidden";
    events.document.dispatchEvent(new Event("visibilitychange"));
    expect(storage.getItem("k")).toBe("1");
  });

  it("works without page events (server and tests)", () => {
    expect(typeof window).toBe("undefined");
    const s = make();
    s.setItem("k", "1");
    vi.advanceTimersByTime(300);
    expect(storage.getItem("k")).toBe("1");
  });
});
