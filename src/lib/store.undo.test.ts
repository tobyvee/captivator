import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEY, useStore } from "./store";
import { SPONSOR } from "./templates";

const fakeStorage = () => {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: vi.fn((key: string, value: string) => void data.set(key, value)),
    removeItem: (key: string) => void data.delete(key),
  };
};

let storage: ReturnType<typeof fakeStorage>;
const state = () => useStore.getState();
const history = () => useStore.temporal.getState();
const readStored = () => JSON.parse(storage.data.get(STORAGE_KEY) ?? "null");

const colour = (n: number) => `#${n.toString(16).padStart(6, "0")}`;
const setColour = (hex: string) => state().updateBackground({ type: "colour", colour: hex });
const background = () => state().design.background;

// One "drag": `count` colour updates, `gap` ms apart, starting now.
const drag = (count: number, gap = 100, from = 1) => {
  for (let i = 0; i < count; i++) {
    if (i > 0) vi.advanceTimersByTime(gap);
    setColour(colour(from + i));
  }
};

beforeEach(() => {
  vi.useFakeTimers();
  storage = fakeStorage();
  vi.stubGlobal("localStorage", storage);
  useStore.setState(useStore.getInitialState(), true);
  useStore.persist.clearStorage(); // drop the write the reset scheduled
  history().clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("undo history", () => {
  it("starts empty", () => {
    expect(history().pastStates).toEqual([]);
    expect(history().futureStates).toEqual([]);
  });

  it("makes one step of 20 colour updates spread over 2 seconds, and undo restores the original", () => {
    const original = background();
    drag(20); // 100ms apart: a 400ms throttle would record about 5 steps here
    expect(background()).toEqual({ type: "colour", colour: colour(20) });
    expect(history().pastStates).toHaveLength(1);

    history().undo();
    expect(background()).toBe(original);
    expect(history().pastStates).toHaveLength(0);
  });

  it("makes two steps of two bursts separated by a 500ms pause", () => {
    const original = background();
    drag(5);
    vi.advanceTimersByTime(500);
    drag(5, 100, 10);
    expect(history().pastStates).toHaveLength(2);

    history().undo();
    expect(background()).toEqual({ type: "colour", colour: colour(5) });
    history().undo();
    expect(background()).toBe(original);
  });

  it("keeps changes 399ms apart in one step", () => {
    drag(4, 399);
    expect(history().pastStates).toHaveLength(1);
  });

  it("doesn't record selection, device, screen, name or palette changes", () => {
    state().setSelection({ kind: "fields" });
    state().setDevice("desktop");
    state().setScreen("error");
    state().setName("Harbourside");
    state().setLogoPalette(["#112233"]);
    expect(history().pastStates).toEqual([]);
  });

  it("restores only the design, leaving selection, device and screen as they are", () => {
    setColour("#123456");
    state().setSelection({ kind: "button" });
    state().setDevice("desktop");
    history().undo();
    expect(state()).toMatchObject({
      design: SPONSOR.design,
      selection: { kind: "button" },
      device: "desktop",
    });
  });

  it("doesn't record a change the schema rejects", () => {
    expect(setColour("not a colour")).toBe(false);
    expect(history().pastStates).toEqual([]);
  });

  it("caps history at 100 steps, dropping the oldest", () => {
    for (let i = 1; i <= 150; i++) {
      vi.advanceTimersByTime(500);
      setColour(colour(i));
    }
    expect(history().pastStates).toHaveLength(100);
    history().undo(100);
    expect(background()).toEqual({ type: "colour", colour: colour(50) });
  });

  it("redoes an undone step", () => {
    setColour("#123456");
    history().undo();
    expect(history().futureStates).toHaveLength(1);
    history().redo();
    expect(background()).toEqual({ type: "colour", colour: "#123456" });
    expect(history().futureStates).toHaveLength(0);
  });

  it("records a change straight after an undo as a new step and drops the redo states", () => {
    drag(3);
    vi.advanceTimersByTime(500);
    drag(3, 100, 10);
    history().undo();
    vi.advanceTimersByTime(100); // inside the 400ms window of the last drag
    setColour("#abcdef");
    expect(history().futureStates).toEqual([]);
    expect(history().pastStates).toHaveLength(2);
    history().undo();
    expect(background()).toEqual({ type: "colour", colour: colour(3) });
  });

  it("isn't persisted: storage holds only the design and name", () => {
    setColour("#123456");
    vi.advanceTimersByTime(300);
    expect(Object.keys(readStored().state).sort()).toEqual(["design", "name"]);
  });

  it("saves the earlier design after an undo", () => {
    setColour("#123456");
    vi.advanceTimersByTime(300);
    expect(readStored().state.design.background).toEqual({ type: "colour", colour: "#123456" });

    history().undo();
    vi.advanceTimersByTime(300);
    expect(readStored().state.design).toEqual(SPONSOR.design);
  });
});

describe("rehydration", () => {
  it("clears history, so restoring a saved design isn't an undo step", async () => {
    setColour("#123456");
    vi.advanceTimersByTime(300); // nothing pending, so rehydrate reads storage
    const saved = { ...SPONSOR.design, background: { type: "colour", colour: "#654321" } };
    storage.data.set(STORAGE_KEY, JSON.stringify({ state: { design: saved, name: "" }, version: 2 }));
    expect(history().pastStates).toHaveLength(1);

    await useStore.persist.rehydrate();
    expect(state()).toMatchObject({ hasSaved: true, hasHydrated: true });
    expect(background()).toEqual({ type: "colour", colour: "#654321" });
    expect(history().pastStates).toEqual([]);
    expect(history().futureStates).toEqual([]);
  });

  it("clears history when there's nothing to restore", async () => {
    setColour("#123456");
    useStore.persist.clearStorage();
    await useStore.persist.rehydrate();
    expect(history().pastStates).toEqual([]);
  });
});

describe("updateForm with Terms selected", () => {
  it("shows the Terms screen when terms are turned on", () => {
    state().updateForm({ terms: { mode: "off" } });
    state().setSelection({ kind: "terms" });
    expect(state().screen).toBe("landing");

    state().updateForm({ terms: { mode: "checkbox" } });
    expect(state().screen).toBe("terms");
  });

  it("leaves the screen alone when something else is selected", () => {
    state().updateForm({ terms: { mode: "off" } });
    state().setSelection({ kind: "button" });
    state().updateForm({ terms: { mode: "checkbox" } });
    expect(state().screen).toBe("landing");
  });

  it("leaves the screen alone when terms were already on", () => {
    state().setSelection({ kind: "terms" });
    state().setScreen("landing");
    state().updateForm({ terms: { mode: "checkbox", label: "I accept the" } });
    expect(state().screen).toBe("landing");
  });
});

describe("undo and redo keep the screen valid", () => {
  it("returns to Landing when undo turns terms off on the Terms screen", () => {
    state().updateForm({ terms: { mode: "off" } });
    vi.advanceTimersByTime(500);
    state().setSelection({ kind: "terms" });
    state().updateForm({ terms: { mode: "checkbox" } });
    expect(state().screen).toBe("terms");
    expect(history().pastStates).toHaveLength(2);

    history().undo();
    expect(state().design.form.terms.mode).toBe("off");
    expect(state().screen).toBe("landing");
    // The screen fix-up isn't an undo step of its own.
    expect(history().pastStates).toHaveLength(1);
    expect(history().futureStates).toHaveLength(1);
  });

  it("shows the Terms screen again when redo turns terms back on with Terms selected", () => {
    state().updateForm({ terms: { mode: "off" } });
    vi.advanceTimersByTime(500);
    state().setSelection({ kind: "terms" });
    state().updateForm({ terms: { mode: "checkbox" } });
    history().undo();

    history().redo();
    expect(state().design.form.terms.mode).toBe("checkbox");
    expect(state().screen).toBe("terms");
    expect(history().pastStates).toHaveLength(2);
    expect(history().futureStates).toEqual([]);
  });

  it("returns to Landing when undo leaves nothing to fail on the Error screen", () => {
    state().updateForm({ terms: { mode: "off" }, fields: [] });
    vi.advanceTimersByTime(500);
    state().updateForm({ fields: ["email"] });
    state().setScreen("error");

    history().undo();
    expect(state().design.form.fields).toEqual([]);
    expect(state().screen).toBe("landing");
    expect(history().pastStates).toHaveLength(1);
  });

  it("keeps the Error screen when something can still fail", () => {
    state().updateForm({ terms: { mode: "off" }, fields: ["email"] });
    vi.advanceTimersByTime(500);
    state().updateForm({ fields: ["email", "name"] });
    state().setScreen("error");

    history().undo();
    expect(state().screen).toBe("error");
  });

  it("writes the undone design to storage once", () => {
    state().setSelection({ kind: "terms" });
    state().updateForm({ terms: { mode: "off" } });
    vi.advanceTimersByTime(500);
    state().updateForm({ terms: { mode: "checkbox" } });
    vi.advanceTimersByTime(300);
    storage.setItem.mockClear();

    history().undo();
    vi.advanceTimersByTime(300);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(readStored().state.design.form.terms.mode).toBe("off");
  });
});
