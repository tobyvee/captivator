import { describe, expect, it } from "vitest";
import { Design } from "./design-schema";
import {
  BLANK,
  PLACEHOLDER_LOGO,
  PLACEHOLDER_SPONSOR,
  SPONSOR,
  TEMPLATE_CREDITS,
  TEMPLATES,
} from "./templates";

// Every paragraph (blank lines split them) is a bracketed prompt, never legal wording.
const isBracketedPrompts = (body: string) =>
  body.split(/\n\s*\n/).every((p) => /^\[[^\[\]]+\]$/.test(p.trim()));

const pngSize = (dataUrl: string) => {
  const bytes = Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ""), "base64");
  return {
    signature: bytes.subarray(1, 4).toString("ascii"),
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    bytes: bytes.length,
  };
};

describe("templates", () => {
  it.each(TEMPLATES.map((t) => [t.id, t] as const))("%s passes Design.safeParse", (_, t) => {
    expect(Design.safeParse(t.design).success).toBe(true);
  });

  it("has unique ids", () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("lists Sponsor first and Blank last", () => {
    expect(TEMPLATES[0]).toBe(SPONSOR);
    expect(TEMPLATES.at(-1)).toBe(BLANK);
  });

  it("starts Blank with no blocks and terms off", () => {
    expect(BLANK.design.blocks).toEqual([]);
    expect(BLANK.design.form.terms.mode).toBe("off");
  });

  it("switches Sponsor's terms checkbox on with a bracketed-prompt body", () => {
    const { terms } = SPONSOR.design.form;
    expect(terms.mode).toBe("checkbox");
    expect(isBracketedPrompts(terms.body)).toBe(true);
  });

  it("gives every template a terms body of bracketed prompts only", () => {
    for (const t of TEMPLATES) expect(isBracketedPrompts(t.design.form.terms.body)).toBe(true);
  });

  it("uses the bundled photo for Sponsor's background, with no guest-page credit", () => {
    const bg = SPONSOR.design.background;
    expect(bg.type).toBe("image");
    if (bg.type !== "image") return;
    expect(bg.src).toBe("/templates/sponsor.jpg");
    expect(bg.credit).toBeUndefined();
  });

  it("credits every template that has a bundled photo", () => {
    for (const t of TEMPLATES) {
      if (t.design.background.type !== "image") continue;
      expect(TEMPLATE_CREDITS[t.id]?.profileUrl).toMatch(/^https:\/\/unsplash\.com\/@/);
    }
  });

  it("uses a /templates/ photo or a raster data URL for every image", () => {
    const allowed = /^(\/templates\/[\w-]+\.(jpg|jpeg|webp)|data:image\/(png|jpeg|webp);base64,)/;
    for (const t of TEMPLATES) {
      const { background, blocks } = t.design;
      if (background.type === "image") expect(background.src).toMatch(allowed);
      for (const b of blocks) if (b.kind === "image") expect(b.src).toMatch(allowed);
    }
  });

  it("ships small, well-formed PNG placeholders", () => {
    expect(pngSize(PLACEHOLDER_LOGO)).toMatchObject({ signature: "PNG", width: 240, height: 240 });
    expect(pngSize(PLACEHOLDER_SPONSOR)).toMatchObject({
      signature: "PNG",
      width: 336,
      height: 128,
    });
    for (const url of [PLACEHOLDER_LOGO, PLACEHOLDER_SPONSOR]) {
      expect(url.length).toBeLessThan(3 * 1024);
    }
  });
});
