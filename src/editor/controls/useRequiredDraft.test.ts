// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useRequiredDraft } from "./useRequiredDraft";

const setup = (stored = "CONNECT") => {
  const commit = vi.fn<(value: string) => void>();
  const hook = renderHook(({ stored }) => useRequiredDraft(stored, commit), { initialProps: { stored } });
  return { commit, ...hook };
};

describe("useRequiredDraft", () => {
  it("starts from the stored value and isn't missing", () => {
    const { result } = setup();
    expect(result.current.draft).toBe("CONNECT");
    expect(result.current.missing).toBe(false);
  });

  it("commits a non-empty draft as typed, untrimmed", () => {
    const { result, commit } = setup();
    act(() => result.current.onChange("Get online "));
    expect(result.current.draft).toBe("Get online ");
    expect(result.current.missing).toBe(false);
    expect(commit).toHaveBeenCalledExactlyOnceWith("Get online ");
  });

  it.each(["", "   "])("marks %j as missing and doesn't commit it", (value) => {
    const { result, commit } = setup();
    act(() => result.current.onChange(value));
    expect(result.current.draft).toBe(value);
    expect(result.current.missing).toBe(true);
    expect(commit).not.toHaveBeenCalled();
  });

  it("follows the stored value when it changes from outside, replacing an empty draft", () => {
    const { result, rerender } = setup();
    act(() => result.current.onChange(""));
    rerender({ stored: "Join" });
    expect(result.current.draft).toBe("Join");
    expect(result.current.missing).toBe(false);
  });

  it("keeps the draft while the stored value stays the same", () => {
    const { result, rerender } = setup();
    act(() => result.current.onChange(""));
    rerender({ stored: "CONNECT" });
    expect(result.current.draft).toBe("");
  });
});
