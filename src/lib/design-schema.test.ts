import { describe, expect, it } from "vitest";
import { BLANK, Design } from "./design-schema";
import type { ImageBackground, ImageBlockSpec, TextBlockSpec } from "./types";

const PNG = "data:image/png;base64,iVBORw0KGgo=";
const UNSPLASH_PHOTO = "https://images.unsplash.com/photo-1?w=1600";

const blank = (): Design => structuredClone(BLANK.design);
const valid = (design: Design) => Design.safeParse(design).success;

const image = (id: string, src = PNG): ImageBlockSpec => ({
  id,
  kind: "image",
  src,
  alt: "Logo",
  size: "md",
});

const text = (id: string, value: string): TextBlockSpec => ({
  id,
  kind: "text",
  text: value,
  role: "body",
  colour: "#111111",
  size: 16,
});

const photo = (src = PNG): ImageBackground => ({
  type: "image",
  src,
  fit: "fill",
  zoom: 1,
  focus: { x: 50, y: 50 },
  backdrop: "#000000",
  overlay: null,
});

describe("Design schema", () => {
  it("accepts Blank, the smallest valid design", () => {
    expect(valid(blank())).toBe(true);
  });

  describe("blocks", () => {
    it("accepts two images and rejects a third", () => {
      const design = blank();
      design.blocks = [image("a"), image("b")];
      expect(valid(design)).toBe(true);

      design.blocks.push(image("c"));
      expect(valid(design)).toBe(false);
    });

    it("accepts 120 characters of text and rejects 121", () => {
      const design = blank();
      design.blocks = [text("a", "x".repeat(120))];
      expect(valid(design)).toBe(true);

      design.blocks = [text("a", "x".repeat(121))];
      expect(valid(design)).toBe(false);
    });
  });

  describe("form fields", () => {
    it("accepts two different fields", () => {
      const design = blank();
      design.form.fields = ["name", "email"];
      expect(valid(design)).toBe(true);
    });

    it("rejects a third field", () => {
      const design = blank();
      design.form.fields = ["name", "email", "phone"];
      expect(valid(design)).toBe(false);
    });

    it("rejects a duplicate field", () => {
      const design = blank();
      design.form.fields = ["email", "email"];
      expect(valid(design)).toBe(false);
    });
  });

  it.each(["#FFF", "red"])("rejects %s as a colour", (colour) => {
    const design = blank();
    design.background = { type: "colour", colour };
    expect(valid(design)).toBe(false);
  });

  // The schema is the trust boundary: a stored design can be hand-edited in localStorage.
  describe.each([
    [
      "an image block",
      (src: string) => {
        const design = blank();
        design.blocks = [image("a", src)];
        return design;
      },
    ],
    [
      "a photo background",
      (src: string) => {
        const design = blank();
        design.background = photo(src);
        return design;
      },
    ],
  ])("image src on %s", (_, withSrc) => {
    it.each([
      PNG,
      "data:image/jpeg;base64,/9j/4AAQ",
      "data:image/webp;base64,UklGRg==",
      "/templates/sponsor.jpg",
      UNSPLASH_PHOTO,
    ])("accepts %s", (src) => {
      expect(valid(withSrc(src))).toBe(true);
    });

    it.each([
      "javascript:alert(1)",
      "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
      "data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+",
      "http://example.com/photo.jpg",
      "/templates/../evil.jpg",
    ])("rejects %s", (src) => {
      expect(valid(withSrc(src))).toBe(false);
    });
  });

  describe("Unsplash credit", () => {
    const credit = {
      name: "Jane Doe",
      profileUrl: "https://unsplash.com/@jane?utm_source=captivator&utm_medium=referral",
      downloadLocation: "https://api.unsplash.com/photos/abc/download?ixid=1",
    };

    const withCredit = (overrides: Partial<typeof credit>) => {
      const design = blank();
      design.background = { ...photo(UNSPLASH_PHOTO), credit: { ...credit, ...overrides } };
      return design;
    };

    it("accepts a profile on unsplash.com and a download on api.unsplash.com", () => {
      expect(valid(withCredit({}))).toBe(true);
    });

    it.each([
      "https://evil.example/@jane",
      "https://unsplash.com.evil.example/@jane",
      "http://unsplash.com/@jane",
      "javascript:alert(1)",
    ])("rejects a profileUrl of %s", (profileUrl) => {
      expect(valid(withCredit({ profileUrl }))).toBe(false);
    });

    it.each([
      "https://unsplash.com/photos/abc/download",
      "https://api.unsplash.com.evil.example/download",
      "https://evil.example/download",
    ])("rejects a downloadLocation of %s", (downloadLocation) => {
      expect(valid(withCredit({ downloadLocation }))).toBe(false);
    });
  });
});
