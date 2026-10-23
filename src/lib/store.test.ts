import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BLANK, Template, type Design } from "./design-schema";
import { STORAGE_KEY, useStore } from "./store";
import { PLACEHOLDER_LOGO, SPONSOR } from "./templates";
import type { ImageBackground } from "./types";

const fakeStorage = () => {
  const data = new Map<string, string>();
  const storage = {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: vi.fn((key: string, value: string) => void data.set(key, value)),
    removeItem: (key: string) => void data.delete(key),
  };
  return storage;
};

let storage: ReturnType<typeof fakeStorage>;
const state = () => useStore.getState();
const writeStored = (value: unknown, version = 2) =>
  storage.data.set(STORAGE_KEY, JSON.stringify({ state: value, version }));
const readStored = () => JSON.parse(storage.data.get(STORAGE_KEY) ?? "null");

const UPLOAD = "data:image/png;base64,QUJD";
const UPLOAD_2 = "data:image/webp;base64,REVG";

const fixture = (id: string, design: Partial<Design>): Template =>
  Template.parse({ id, name: id, description: "", design: { ...BLANK.design, ...design } });

// Sponsor's background is a photo; this gives it a new src (and optional credit).
const sponsorPhoto = (patch: Partial<ImageBackground>): ImageBackground => {
  const bg = SPONSOR.design.background;
  if (bg.type !== "image") throw new Error("Sponsor's background is expected to be a photo");
  return { ...bg, ...patch };
};

const blockIds = () => state().design.blocks.map((b) => b.id);
const textBlockId = () => state().design.blocks.find((b) => b.kind === "text")!.id; // Sponsor has text blocks

beforeEach(() => {
  vi.useFakeTimers();
  storage = fakeStorage();
  vi.stubGlobal("localStorage", storage);
  useStore.setState(useStore.getInitialState(), true);
  useStore.persist.clearStorage(); // drop the write the reset scheduled
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("initial state", () => {
  it("starts from Sponsor with no name, background selected, on the mobile landing screen", () => {
    expect(state()).toMatchObject({
      design: SPONSOR.design,
      name: "",
      selection: { kind: "background" },
      device: "mobile",
      screen: "landing",
      logoPalette: [],
      hasHydrated: false,
      hasSaved: false,
      restoreFailed: false,
      saveFailed: false,
    });
  });
});

describe("addBlock", () => {
  it("appends a block with a new id and selects it", () => {
    const id = state().addBlock({
      kind: "text",
      text: "Hello",
      role: "body",
      colour: "#FFFFFF",
      size: 16,
    });
    expect(id).toEqual(expect.any(String));
    expect(state().design.blocks.at(-1)).toMatchObject({ id, kind: "text", text: "Hello" });
    expect(state().selection).toEqual({ kind: "block", id });
  });

  it("refuses a third image and leaves the design unchanged", () => {
    const before = state().design;
    expect(before.blocks.filter((b) => b.kind === "image")).toHaveLength(2);
    expect(state().addBlock({ kind: "image", src: UPLOAD, alt: "Logo", size: "sm" })).toBeNull();
    expect(state().design).toBe(before);
    expect(state().selection).toEqual({ kind: "background" });
  });

  it("refuses a block that fails the schema", () => {
    const before = state().design;
    expect(
      state().addBlock({ kind: "text", text: "Hi", role: "body", colour: "white", size: 16 }),
    ).toBeNull();
    expect(state().design).toBe(before);
  });

  it("returns to the landing screen from the terms screen", () => {
    state().setSelection({ kind: "terms" });
    state().addBlock({ kind: "text", text: "Hi", role: "body", colour: "#FFFFFF", size: 16 });
    expect(state().screen).toBe("landing");
  });
});

describe("updateBlock", () => {
  it("merges a patch into the block", () => {
    const id = textBlockId();
    expect(state().updateBlock(id, { text: "Welcome", size: 40 })).toBe(true);
    expect(state().design.blocks.find((b) => b.id === id)).toMatchObject({
      text: "Welcome",
      size: 40,
      role: "heading",
    });
  });

  it("raises a 12–15px size to the 16px floor and refuses anything smaller", () => {
    const id = textBlockId();
    expect(state().updateBlock(id, { size: 12 })).toBe(true);
    expect(state().design.blocks.find((b) => b.id === id)).toMatchObject({ size: 16 });
    expect(state().updateBlock(id, { size: 11 })).toBe(false);
  });

  it.each([
    ["text over 120 characters", { text: "x".repeat(121) }],
    ["a bad hex", { colour: "#FFF" }],
    ["an image size on a text block", { size: "sm" as const }],
  ])("refuses %s and leaves the design unchanged", (_, patch) => {
    const before = state().design;
    expect(state().updateBlock(textBlockId(), patch)).toBe(false);
    expect(state().design).toBe(before);
  });

  it("refuses an emptied image alt and a javascript: src", () => {
    const image = state().design.blocks.find((b) => b.kind === "image")!; // Sponsor has a logo
    expect(state().updateBlock(image.id, { alt: "" })).toBe(false);
    expect(state().updateBlock(image.id, { src: "javascript:alert(1)" })).toBe(false);
    expect(state().design.blocks.find((b) => b.id === image.id)).toEqual(image);
  });

  it("returns false for an unknown id", () => {
    expect(state().updateBlock("nope", { text: "Hi" })).toBe(false);
  });
});

describe("removeBlock", () => {
  it("clears a stale selection to the background", () => {
    const id = textBlockId();
    state().setSelection({ kind: "block", id });
    state().removeBlock(id);
    expect(blockIds()).not.toContain(id);
    expect(state().selection).toEqual({ kind: "background" });
  });

  it("keeps a selection that still exists", () => {
    const [first, second] = blockIds();
    state().setSelection({ kind: "block", id: second });
    state().removeBlock(first);
    expect(state().selection).toEqual({ kind: "block", id: second });
  });

  it("does nothing for an unknown id", () => {
    const before = state().design;
    state().removeBlock("nope");
    expect(state().design).toBe(before);
  });
});

describe("moveBlock", () => {
  it("stops at the ends", () => {
    const ids = blockIds();
    state().moveBlock(ids[0], -1);
    state().moveBlock(ids.at(-1)!, 1); // Sponsor has blocks
    expect(blockIds()).toEqual(ids);
  });

  it("swaps a block with its neighbour", () => {
    const [a, b, c, d] = blockIds();
    state().moveBlock(b, 1);
    expect(blockIds()).toEqual([a, c, b, d]);
    state().moveBlock(b, -1);
    expect(blockIds()).toEqual([a, b, c, d]);
  });
});

describe("updateForm", () => {
  it("caps fields at 2", () => {
    expect(state().updateForm({ fields: ["name", "email", "phone"] })).toBe(false);
    expect(state().design.form.fields).toEqual(["name", "email"]);
  });

  it("refuses a duplicate field", () => {
    expect(state().updateForm({ fields: ["email", "email"] })).toBe(false);
    expect(state().design.form.fields).toEqual(["name", "email"]);
  });

  it("merges terms and button one level deep", () => {
    expect(state().updateForm({ terms: { label: "I accept the" }, button: { bg: "#000000" } })).toBe(
      true,
    );
    const { terms, button } = state().design.form;
    expect(terms).toEqual({ ...SPONSOR.design.form.terms, label: "I accept the" });
    expect(button).toEqual({ ...SPONSOR.design.form.button, bg: "#000000" });
  });

  it("refuses an emptied button label", () => {
    expect(state().updateForm({ button: { label: "" } })).toBe(false);
    expect(state().design.form.button.label).toBe("CONNECT");
  });

  it("returns to landing when terms are switched off on the terms screen", () => {
    state().setSelection({ kind: "terms" });
    expect(state().screen).toBe("terms");
    state().updateForm({ terms: { mode: "off" } });
    expect(state().screen).toBe("landing");
  });

  it("returns to landing from the error screen only when nothing can fail", () => {
    state().setScreen("error");
    state().updateForm({ terms: { mode: "off" } });
    expect(state().screen).toBe("error"); // fields can still fail
    state().updateForm({ fields: [] });
    expect(state().screen).toBe("landing");
  });
});

describe("updateBackground", () => {
  it("replaces the whole background", () => {
    expect(state().updateBackground({ type: "colour", colour: "#123456" })).toBe(true);
    expect(state().design.background).toEqual({ type: "colour", colour: "#123456" });
  });

  it("refuses a javascript: image src", () => {
    const before = state().design;
    expect(state().updateBackground(sponsorPhoto({ src: "javascript:alert(1)" }))).toBe(false);
    expect(state().design).toBe(before);
  });
});

describe("setSelection", () => {
  it("shows the terms screen when terms are selected and on, and leaves it for anything else", () => {
    state().setSelection({ kind: "terms" });
    expect(state().screen).toBe("terms");
    state().setSelection({ kind: "block", id: textBlockId() });
    expect(state().screen).toBe("landing");
  });

  it("leaves the screen alone when terms are off", () => {
    state().updateForm({ terms: { mode: "off" } });
    state().setSelection({ kind: "terms" });
    expect(state()).toMatchObject({ selection: { kind: "terms" }, screen: "landing" });
  });

  it("doesn't leave the connected screen for another selection", () => {
    state().setScreen("connected");
    state().setSelection({ kind: "button" });
    expect(state().screen).toBe("connected");
  });
});

describe("UI state", () => {
  it("cuts the name to 60 characters", () => {
    state().setName("x".repeat(70));
    expect(state().name).toHaveLength(60);
  });

  it("sets device, screen and logo palette without touching the design", () => {
    const before = state().design;
    state().setDevice("desktop");
    state().setScreen("connected");
    state().setLogoPalette(["#112233"]);
    expect(state()).toMatchObject({
      device: "desktop",
      screen: "connected",
      logoPalette: ["#112233"],
    });
    expect(state().design).toBe(before);
  });
});

describe("loadTemplate", () => {
  const target = fixture("target", {
    background: {
      type: "image",
      src: "/templates/target.jpg",
      fit: "fit",
      zoom: 1.5,
      focus: { x: 20, y: 80 },
      backdrop: "#000000",
      overlay: null,
    },
    blocks: [
      { id: "t-image", kind: "image", src: PLACEHOLDER_LOGO, alt: "Target logo", size: "lg" },
      { id: "t-h", kind: "text", text: "Target heading", role: "heading", colour: "#ABCDEF", size: 40 },
      { id: "t-s", kind: "text", text: "Target sub", role: "subheading", colour: "#FEDCBA", size: 18 },
    ],
  });

  it("carries the customer's text and uploaded image by position, not template defaults", () => {
    const [logo, heading] = state().design.blocks; // Sponsor: logo, heading, subheading, sponsor logo
    state().updateBlock(logo.id, { src: UPLOAD, alt: "Bob's logo" });
    state().updateBlock(heading.id, { text: "Welcome to Bob's" });
    state().setSelection({ kind: "terms" });

    state().loadTemplate(target);

    const { design } = state();
    expect(design.blocks).toEqual([
      { id: "t-image", kind: "image", src: UPLOAD, alt: "Bob's logo", size: "lg" },
      { id: "t-h", kind: "text", text: "Welcome to Bob's", role: "heading", colour: "#ABCDEF", size: 40 },
      // "Proudly sponsored by" is Sponsor's default, so the target keeps its own.
      { id: "t-s", kind: "text", text: "Target sub", role: "subheading", colour: "#FEDCBA", size: 18 },
    ]);
    // Sponsor's photo is a template default, so the target's photo stays.
    expect(design.background).toEqual(target.design.background);
    expect(design.form).toEqual(target.design.form);
    expect(state()).toMatchObject({ selection: { kind: "background" }, screen: "landing" });
  });

  it("doesn't carry a template's placeholder image", () => {
    state().loadTemplate(target);
    expect(state().design.blocks[0]).toMatchObject({ src: PLACEHOLDER_LOGO, alt: "Target logo" });
  });

  it("carries a customer photo background into a photo template, with the template's settings", () => {
    const credit = {
      name: "Ann",
      profileUrl: "https://unsplash.com/@ann",
      downloadLocation: "https://api.unsplash.com/photos/1/download",
    };
    state().updateBackground(sponsorPhoto({ src: "https://images.unsplash.com/photo-1", credit }));
    state().loadTemplate(target);
    expect(state().design.background).toEqual({
      ...target.design.background,
      src: "https://images.unsplash.com/photo-1",
      credit,
    });
  });

  it("doesn't carry a photo into a template without one", () => {
    state().updateBackground(sponsorPhoto({ src: UPLOAD_2 }));
    state().loadTemplate(BLANK);
    expect(state().design).toEqual(BLANK.design);
  });

  it("doesn't carry an extra image when the template has fewer image blocks", () => {
    const [logo] = state().design.blocks;
    state().updateBlock(logo.id, { src: UPLOAD });
    state().loadTemplate(BLANK);
    expect(state().design.blocks).toEqual([]);
  });

  it("security: leaves the design unchanged for a template that fails the schema", () => {
    const bad = "http://example.com/logo.png"; // not on the image src allowlist
    const invalid = {
      ...target,
      design: {
        ...target.design,
        blocks: [{ id: "bad", kind: "image", src: bad, alt: "Logo", size: "sm" }],
      },
    } as Template; // bypasses Template.parse, as a hand-built template could
    state().loadTemplate(invalid);
    expect(state().design).toBe(SPONSOR.design);
    vi.advanceTimersByTime(300);
    expect(storage.data.get(STORAGE_KEY) ?? "").not.toContain(bad);
  });
});

describe("persistence", () => {
  const customDesign: Design = {
    ...SPONSOR.design,
    blocks: [{ id: "x", kind: "text", text: "Saved", role: "body", colour: "#FFFFFF", size: 16 }],
  };

  it("keeps Sponsor when nothing is stored", async () => {
    await useStore.persist.rehydrate();
    expect(state()).toMatchObject({
      design: SPONSOR.design,
      hasHydrated: true,
      hasSaved: false,
      restoreFailed: false,
    });
  });

  it("restores a valid saved design and name", async () => {
    writeStored({ design: customDesign, name: "Bob's Cafe" });
    await useStore.persist.rehydrate();
    expect(state()).toMatchObject({
      design: customDesign,
      name: "Bob's Cafe",
      hasHydrated: true,
      hasSaved: true,
      restoreFailed: false,
    });
  });

  it("restores a design saved with 14px text, raised to the 16px floor", async () => {
    writeStored({ design: { ...customDesign, blocks: [{ ...customDesign.blocks[0], size: 14 }] }, name: "Old" });
    await useStore.persist.rehydrate();
    expect(state()).toMatchObject({ design: customDesign, hasSaved: true, restoreFailed: false });
  });

  it("falls back to Sponsor on corrupt JSON without throwing", async () => {
    storage.data.set(STORAGE_KEY, "{not json");
    await expect(useStore.persist.rehydrate()).resolves.toBeUndefined();
    expect(state()).toMatchObject({
      design: SPONSOR.design,
      hasHydrated: true,
      hasSaved: false,
      restoreFailed: true,
    });
  });

  it("migrates an older version to Sponsor and reports the restore as failed", async () => {
    writeStored({ design: customDesign, name: "Old" }, 1);
    await useStore.persist.rehydrate();
    expect(state()).toMatchObject({
      design: SPONSOR.design,
      name: "",
      hasHydrated: true,
      hasSaved: false,
      restoreFailed: true,
    });
  });

  it("security: ignores a stored design with a javascript: image src and sets restoreFailed", async () => {
    const evil = {
      ...customDesign,
      blocks: [{ id: "x", kind: "image", src: "javascript:alert(1)", alt: "x", size: "sm" }],
    };
    writeStored({ design: evil, name: "" });
    await useStore.persist.rehydrate();
    expect(state()).toMatchObject({
      design: SPONSOR.design,
      hasHydrated: true,
      hasSaved: false,
      restoreFailed: true,
    });
    state().dismissRestoreFailed();
    expect(state().restoreFailed).toBe(false);
  });

  it("ignores a stored name that isn't a string of at most 60 characters", async () => {
    writeStored({ design: customDesign, name: "x".repeat(61) });
    await useStore.persist.rehydrate();
    expect(state().name).toBe("");
    writeStored({ design: customDesign, name: 42 });
    await useStore.persist.rehydrate();
    expect(state().name).toBe("");
  });

  describe("writes only when the design or name changes", () => {
    it("writes nothing when hydrating with nothing stored", async () => {
      await useStore.persist.rehydrate();
      vi.advanceTimersByTime(300);
      expect(storage.setItem).not.toHaveBeenCalled();
      expect(storage.data.has(STORAGE_KEY)).toBe(false);
    });

    it("leaves a restored design in storage as it was", async () => {
      writeStored({ design: customDesign, name: "Bob's Cafe" });
      await useStore.persist.rehydrate();
      vi.advanceTimersByTime(300);
      expect(storage.setItem).not.toHaveBeenCalled();
    });

    it("counts the design as saved once an edit after hydration is written, not before", async () => {
      await useStore.persist.rehydrate();
      state().setDevice("desktop");
      expect(state().hasSaved).toBe(false);

      state().setName("Harbourside");
      expect(state().hasSaved).toBe(true);
    });

    it("writes nothing for UI state alone", () => {
      state().setDevice("desktop");
      state().setScreen("connected");
      state().setSelection({ kind: "button" });
      state().setLogoPalette(["#112233"]);
      state().dismissRestoreFailed();
      vi.advanceTimersByTime(300);
      expect(storage.setItem).not.toHaveBeenCalled();
    });

    it("keeps a stored design that failed to restore until the customer edits", async () => {
      const invalid = JSON.stringify({ state: { design: { version: 2 }, name: "" }, version: 2 });
      storage.data.set(STORAGE_KEY, invalid);
      await useStore.persist.rehydrate();
      expect(state().restoreFailed).toBe(true);
      vi.advanceTimersByTime(300);
      expect(storage.data.get(STORAGE_KEY)).toBe(invalid);

      state().updateForm({ button: { label: "GO" } });
      vi.advanceTimersByTime(300);
      expect(readStored().state.design.form.button.label).toBe("GO");
    });

    it("keeps corrupt JSON in storage until the customer edits", async () => {
      storage.data.set(STORAGE_KEY, "{not json");
      await useStore.persist.rehydrate();
      vi.advanceTimersByTime(300);
      expect(storage.data.get(STORAGE_KEY)).toBe("{not json");
    });

    it("keeps an older version in storage until the customer edits", async () => {
      writeStored({ design: customDesign, name: "Old" }, 1);
      await useStore.persist.rehydrate();
      vi.advanceTimersByTime(300);
      expect(readStored().version).toBe(1);
    });

    it("writes a real edit", () => {
      expect(state().updateBlock(textBlockId(), { text: "Edited" })).toBe(true);
      vi.advanceTimersByTime(300);
      expect(storage.setItem).toHaveBeenCalledTimes(1);
      expect(readStored().state.design).toEqual(state().design);
    });
  });

  it("writes only { design, name }, debounced", () => {
    state().setName("Bob's Cafe");
    state().setSelection({ kind: "terms" });
    state().setDevice("desktop");
    state().setLogoPalette(["#112233"]);
    expect(storage.setItem).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    const written = readStored();
    expect(written.version).toBe(2);
    expect(Object.keys(written.state).sort()).toEqual(["design", "name"]);
    expect(written.state).toEqual({ design: SPONSOR.design, name: "Bob's Cafe" });
  });

  it("sets saveFailed on a QuotaExceededError instead of crashing, and clears it after a good save", () => {
    storage.setItem.mockImplementation(() => {
      throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
    });
    state().setName("A");
    expect(() => vi.advanceTimersByTime(300)).not.toThrow();
    expect(state().saveFailed).toBe(true);
    // Setting the flag changes neither design nor name, so it doesn't retry the write.
    vi.advanceTimersByTime(3000);
    expect(storage.setItem).toHaveBeenCalledTimes(1);

    storage.setItem.mockImplementation((key, value) => void storage.data.set(key, value));
    state().setName("B");
    vi.advanceTimersByTime(300);
    expect(state().saveFailed).toBe(false);
    expect(readStored().state.name).toBe("B");
  });
});
