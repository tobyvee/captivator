import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { backgroundColours, worstRatio } from "./contrast";
import { BLANK as SCHEMA_BLANK, Design } from "./design-schema";
import {
  BLANK,
  MINIMAL,
  PHOTO_HERO,
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

// Compact (fit-check) content height by T-002's arithmetic: column padding 56 + 40 and gap 18
// between column children; images by size; text at its line height per explicit line (wrapping
// isn't modelled); the form as one child (48px inputs with gap 10, then gap 12 to the 44px terms
// row and the 50px button). The measured check is the fit check (T-028).
const IMAGE_HEIGHT = { sm: 72, md: 120, lg: 168 } as const;
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const compactHeight = ({ blocks, form }: Design) => {
  const blockHeights = blocks.map((b) =>
    b.kind === "image"
      ? IMAGE_HEIGHT[b.size]
      : b.text.split("\n").length * b.size * (b.role === "heading" ? 1.15 : 1.4),
  );
  const inputs = form.fields.length * 48 + Math.max(0, form.fields.length - 1) * 10;
  const formParts = [inputs, form.terms.mode === "checkbox" ? 44 : 0, 50].filter(Boolean);
  const children = [...blockHeights, sum(formParts) + (formParts.length - 1) * 12];
  return 96 + sum(children) + (children.length - 1) * 18;
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

  it("lists Sponsor, Photo hero, Minimal, then Blank", () => {
    expect(TEMPLATES).toEqual([SPONSOR, PHOTO_HERO, MINIMAL, BLANK]);
    expect(TEMPLATES.map((t) => t.id)).toEqual(["sponsor", "photo-hero", "minimal", "blank"]);
  });

  // Fields need a 3:1 edge against the page (T-027-input-edge-contrast), judged on the backdrop
  // and overlay before a photo's average colour is known.
  it.each(TEMPLATES.filter((t) => t.design.form.fields.length > 0).map((t) => [t.id, t] as const))(
    "%s: its fields stand out from the page at 3:1",
    (_id, t) => {
      expect(worstRatio(t.design.form.inputBg, backgroundColours(t.design.background))).toBeGreaterThanOrEqual(3);
    },
  );

  it("keeps every template's compact content within the 600px login sheet", () => {
    expect(compactHeight(SPONSOR.design)).toBeCloseTo(598, 0);
    for (const t of TEMPLATES) expect(compactHeight(t.design), t.id).toBeLessThanOrEqual(600);
  });

  it("starts Photo hero and Minimal with the placeholder logo", () => {
    for (const t of [PHOTO_HERO, MINIMAL]) {
      expect(t.design.blocks[0]).toMatchObject({
        kind: "image",
        src: PLACEHOLDER_LOGO,
        alt: "Your logo",
      });
    }
  });

  it("collects email with terms on in Photo hero, and name and email in Minimal", () => {
    expect(PHOTO_HERO.design.form.fields).toEqual(["email"]);
    expect(PHOTO_HERO.design.form.terms.mode).toBe("checkbox");
    expect(MINIMAL.design.form.fields).toEqual(["name", "email"]);
    expect(MINIMAL.design.form.terms.mode).toBe("off");
    expect(MINIMAL.design.form.button.variant).toBe("outline");
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

  it("uses the bundled photo for Sponsor's background", () => {
    expect(SPONSOR.design.background).toMatchObject({ type: "image", src: "/templates/sponsor.jpg" });
  });

  it("puts no guest-page credit on any template photo", () => {
    for (const { design } of TEMPLATES) {
      if (design.background.type === "image") expect(design.background.credit).toBeUndefined();
    }
  });

  it("uses each template's own bundled photo", () => {
    expect(PHOTO_HERO.design.background).toMatchObject({ src: "/templates/photo-hero.jpg" });
    expect(MINIMAL.design.background).toMatchObject({ src: "/templates/minimal.jpg" });
  });

  it("credits Photo hero's and Minimal's photographers", () => {
    expect(TEMPLATE_CREDITS["photo-hero"]?.name).toBe("Miguel Dominguez");
    expect(TEMPLATE_CREDITS.minimal?.name).toBe("Woliul Hasan");
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
