import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BLANK as SCHEMA_BLANK, Design } from "./design-schema";
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

  it("has unique block ids within each template", () => {
    for (const t of TEMPLATES) {
      const ids = t.design.blocks.map((b) => b.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("re-exports the schema's Blank as the same object", () => {
    expect(BLANK).toBe(SCHEMA_BLANK);
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

  // Template.parse has already applied the schema's allowlist; templates also never hotlink.
  const imageSrcs = (t: (typeof TEMPLATES)[number]) => [
    ...(t.design.background.type === "image" ? [t.design.background.src] : []),
    ...t.design.blocks.flatMap((b) => (b.kind === "image" ? [b.src] : [])),
  ];

  it("never hotlinks an https: image", () => {
    for (const t of TEMPLATES) for (const src of imageSrcs(t)) expect(src).not.toMatch(/^https:/);
  });

  it("points every /templates/ src at a file in public/", () => {
    for (const t of TEMPLATES) {
      for (const src of imageSrcs(t).filter((s) => s.startsWith("/templates/"))) {
        expect(existsSync(path.join("public", src)), src).toBe(true);
      }
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
