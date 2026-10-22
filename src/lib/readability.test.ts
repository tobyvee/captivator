import { describe, expect, it } from "vitest";
import { BLANK, type Design } from "./design-schema";
import { checkDesign, rateText } from "./readability";
import { TEMPLATES } from "./templates";
import type { BackgroundSpec, FormSpec, TextBlockSpec } from "./types";

const text = (over: Partial<TextBlockSpec> = {}): TextBlockSpec => ({
  id: "t1",
  kind: "text",
  text: "Free WiFi",
  role: "heading",
  colour: "#111111",
  size: 32,
  ...over,
});

const PHOTO: BackgroundSpec = {
  type: "image",
  src: "/templates/photo.jpg",
  fit: "fill",
  zoom: 1,
  focus: { x: 50, y: 50 },
  backdrop: "#1E293B",
  overlay: null,
};

/** Blank with the given background, blocks and form changes. */
function design({
  background = BLANK.design.background,
  blocks = [],
  form = {},
}: { background?: BackgroundSpec; blocks?: Design["blocks"]; form?: Partial<FormSpec> } = {}): Design {
  return { ...BLANK.design, background, blocks, form: { ...BLANK.design.form, ...form } };
}

describe("checkDesign", () => {
  it("reports Blank as readable", () => {
    expect(checkDesign(BLANK.design)).toEqual({ status: "ok", message: "All text is readable", failures: [] });
  });

  it("names white text on a white background", () => {
    const result = checkDesign(design({ blocks: [text({ colour: "#FFFFFF" })] }));
    expect(result.status).toBe("fail");
    expect(result.message).toBe("Heading: 1.0:1 on the background");
    expect(result.failures).toEqual([{ label: "Heading", ratio: 1, required: 3, target: { kind: "block", id: "t1" } }]);
  });

  it("checks a gradient at its worse stop", () => {
    // White text passes on navy but fails on the yellow end.
    const background: BackgroundSpec = { type: "gradient", from: "#0F2A44", to: "#FACC15", direction: "down" };
    const result = checkDesign(design({ background, blocks: [text({ colour: "#FFFFFF", size: 16, role: "body" })] }));
    expect(result.status).toBe("fail");
    expect(result.message).toMatch(/^Text: 1\.\d:1 on the background$/);
  });

  it("reports a passing photo design as approximate", () => {
    const result = checkDesign(design({ background: PHOTO, blocks: [text({ colour: "#FFFFFF" })] }), "#202020");
    expect(result).toEqual({ status: "approximate", message: "Check readability over your photo", failures: [] });
  });

  it("rates a photo by its average colour once known, and by its backdrop before", () => {
    const d = design({ background: PHOTO, blocks: [text({ colour: "#FFFFFF" })] });
    expect(checkDesign(d).status).toBe("approximate"); // dark backdrop
    expect(checkDesign(d, "#F5F5F5").message).toMatch(/^Heading: 1\.\d:1 on the background$/);
  });

  it("checks a fitted photo against its backdrop as well as its average", () => {
    // Dark text reads on the light photo but not on the dark backdrop around it.
    const blocks = [text({ colour: "#111111" })];
    expect(checkDesign(design({ background: PHOTO, blocks }), "#F5F5F5").status).toBe("approximate");
    const result = checkDesign(design({ background: { ...PHOTO, fit: "fit" }, blocks }), "#F5F5F5");
    expect(result.status).toBe("fail");
    expect(result.message).toMatch(/^Heading: 1\.\d:1 on the background$/);
  });

  it("blends a photo's average with its overlay", () => {
    const background: BackgroundSpec = { ...PHOTO, overlay: { from: "#000000", to: "#000000", opacity: 0.85 } };
    expect(checkDesign(design({ background, blocks: [text({ colour: "#FFFFFF" })] }), "#F5F5F5").status).toBe(
      "approximate",
    );
  });

  it("counts large bold text at 3:1 and small text at 4.5:1", () => {
    const grey = "#949494"; // about 3.0:1 on white
    expect(checkDesign(design({ blocks: [text({ colour: grey, size: 19 })] })).status).toBe("ok");
    expect(checkDesign(design({ blocks: [text({ colour: grey, size: 19, role: "body" })] })).status).toBe("fail");
  });

  it("numbers repeats of the same role", () => {
    const blocks = [
      text({ id: "a" }),
      text({ id: "b", role: "body", size: 16 }),
      text({ id: "c", colour: "#FFFFFF" }),
      text({ id: "d", role: "subheading", size: 18, colour: "#FFFFFF" }),
    ];
    const result = checkDesign(design({ blocks }));
    expect(result.failures.map((f) => f.label)).toEqual(["Heading 2", "Subheading"]);
    expect(result.message).toBe("Heading 2: 1.0:1 on the background");
  });

  it("ignores image blocks", () => {
    const logo = { id: "logo", kind: "image", src: "/templates/logo.webp", alt: "Logo", size: "sm" } as const;
    expect(checkDesign(design({ blocks: [logo] })).status).toBe("ok");
  });

  it("checks the terms label only when terms are on", () => {
    const terms = { ...BLANK.design.form.terms, textColour: "#FFFFFF" };
    expect(checkDesign(design({ form: { terms } })).status).toBe("ok");
    const result = checkDesign(design({ form: { terms: { ...terms, mode: "checkbox" } } }));
    expect(result.message).toBe("Terms checkbox: 1.0:1 on the background");
    expect(result.failures[0]).toMatchObject({ required: 4.5, target: { kind: "terms" } });
  });

  it("checks a solid button's label on its fill", () => {
    const button = { ...BLANK.design.form.button, bg: "#FFFFFF", fg: "#FFFFFF" };
    const result = checkDesign(design({ background: { type: "colour", colour: "#000000" }, form: { button } }));
    expect(result.message).toBe("Connect button: 1.0:1 on the button");
    expect(result.failures[0]).toMatchObject({ required: 4.5, target: { kind: "button" } });
  });

  it("checks an outline button's label on the page, not its border colour", () => {
    // Minimal's style: the same dark colour for border and text. On its fill it would read 1:1.
    const outline = { label: "Connect", bg: "#111111", fg: "#111111", variant: "outline" } as const;
    expect(checkDesign(design({ form: { button: outline } })).status).toBe("ok");
    const dark = checkDesign(design({ background: { type: "colour", colour: "#000000" }, form: { button: outline } }));
    expect(dark.message).toBe("Connect button: 1.1:1 on the background");
    expect(dark.failures[0]).toMatchObject({ required: 4.5, target: { kind: "button" } });
  });

  it("checks input text on the field when there are fields", () => {
    const form = { inputBg: "#18181B", inputText: "#18181B" };
    expect(checkDesign(design({ form })).status).toBe("ok");
    const result = checkDesign(design({ form: { ...form, fields: ["email"] } }));
    expect(result.message).toBe("Field text: 1.0:1 on the field");
    expect(result.failures[0]).toMatchObject({ required: 4.5, target: { kind: "inputs" } });
  });

  it("warns when the fields blend into the page, after any text failure", () => {
    const result = checkDesign(design({ form: { fields: ["name"] } })); // Blank's white fields on white
    expect(result.message).toBe("Fields: 1.0:1 on the background");
    expect(result.failures).toEqual([
      { label: "Fields", ratio: 1, required: 3, target: { kind: "inputs" } },
    ]);
    const both = checkDesign(design({ form: { fields: ["name"], inputText: "#FFFFFF" } }));
    expect(both.failures.map((f) => f.label)).toEqual(["Field text", "Fields"]);
  });

  it("lists failures in reading order with a target for each kind", () => {
    const result = checkDesign(
      design({
        blocks: [text({ colour: "#FFFFFF" })],
        form: {
          fields: ["email"],
          inputText: "#FFFFFF",
          terms: { ...BLANK.design.form.terms, mode: "checkbox", textColour: "#FFFFFF" },
          button: { ...BLANK.design.form.button, bg: "#FFFFFF" },
        },
      }),
    );
    expect(result.failures.map((f) => [f.label, f.target])).toEqual([
      ["Heading", { kind: "block", id: "t1" }],
      ["Terms checkbox", { kind: "terms" }],
      ["Connect button", { kind: "button" }],
      ["Field text", { kind: "inputs" }],
      ["Fields", { kind: "inputs" }],
    ]);
  });

  it("fails only on the unrounded ratio", () => {
    // #777777 on white is about 4.48:1: fails 4.5:1, and shows as 4.4:1, never 4.5:1.
    const result = checkDesign(design({ blocks: [text({ role: "body", size: 16, colour: "#777777" })] }));
    expect(result.message).toBe("Text: 4.4:1 on the background");
  });

  it("passes every template's text with its photo's backdrop", () => {
    for (const t of TEMPLATES) expect(checkDesign(t.design).status, t.name).not.toBe("fail");
  });
});

describe("rateText", () => {
  it("passes or fails on the unrounded ratio", () => {
    expect(rateText("#FFFFFF", 16, 400, { type: "colour", colour: "#000000" })).toEqual({
      kind: "pass",
      ratio: 21,
      required: 4.5,
    });
    // #777777 on white is 4.48:1: shown as 4.4, and a fail against 4.5.
    const grey = rateText("#777777", 16, 400, { type: "colour", colour: "#FFFFFF" });
    expect(grey).toMatchObject({ kind: "fail", required: 4.5 });
  });

  it.each([
    ["#000000", "#FFFFFF"],
    ["#FFFFFF", "#000000"],
  ])("rates a gradient from %s to %s at its worse stop", (from, to) => {
    expect(rateText("#FFFFFF", 16, 400, { type: "gradient", from, to, direction: "down" })).toMatchObject({
      kind: "fail",
      ratio: 1,
    });
  });

  it("uses the large-text threshold", () => {
    expect(rateText("#000000", 24, 400, { type: "colour", colour: "#000000" })).toMatchObject({ required: 3 });
  });

  it("never rates a photo", () => {
    expect(rateText("#FFFFFF", 16, 400, PHOTO)).toEqual({ kind: "photo" });
  });
});
