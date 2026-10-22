// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEY, useHydrated, useStore } from "./store";
import { SPONSOR } from "./templates";

const renderHydrated = () => renderHook(() => useHydrated(), { wrapper: StrictMode });

beforeEach(() => {
  localStorage.clear();
  useStore.setState(useStore.getInitialState(), true);
  useStore.persist.clearStorage(); // drop the write the reset scheduled
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useHydrated", () => {
  it("rehydrates once across Strict Mode's double effect and a remount", () => {
    const rehydrate = vi.spyOn(useStore.persist, "rehydrate");
    const first = renderHydrated();
    expect(first.result.current).toBe(true);
    first.unmount();
    const second = renderHydrated();
    expect(second.result.current).toBe(true);
    expect(rehydrate).toHaveBeenCalledTimes(1);
  });

  it("doesn't bring back a dismissed restore notice on remount", () => {
    const invalid = { design: { version: 2 }, name: "" };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: invalid, version: 2 }));
    const first = renderHydrated();
    expect(useStore.getState()).toMatchObject({ design: SPONSOR.design, restoreFailed: true });

    act(() => useStore.getState().dismissRestoreFailed());
    first.unmount();
    renderHydrated();
    expect(useStore.getState().restoreFailed).toBe(false);
  });
});
