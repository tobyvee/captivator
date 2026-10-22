import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { BLANK, Design } from "../lib/design-schema";
import type { BackgroundSpec, RenderMode, TextBlockSpec } from "../lib/types";
import { TermsSheet } from "./TermsSheet";

const heading = (colour: string): TextBlockSpec => ({
  id: "h",
  kind: "text",
  text: "Welcome",
  role: "heading",
  colour,
  size: 32,
});

const design = (
  opts: {
    body?: string;
    background?: BackgroundSpec;
    blocks?: Design["blocks"];
    outline?: boolean;
  } = {},
): Design => {
  const d = structuredClone(BLANK.design);
  d.form.terms.mode = "checkbox";
  d.form.terms.version = 3;
  if (opts.body !== undefined) d.form.terms.body = opts.body;
  if (opts.background) d.background = opts.background;
  if (opts.blocks) d.blocks = opts.blocks;
  if (opts.outline)
    d.form.button = { label: "Go", bg: "#F97316", fg: "#111111", variant: "outline" };
  return Design.parse(d);
};

const html = (d: Design, mode: RenderMode = "preview") =>
  renderToStaticMarkup(<TermsSheet design={d} mode={mode} />);

// The `color` in an inline style attribute's value (not `background-color` or similar).
const colourIn = (style = "") => style.match(/(?:^|;)color:(#[0-9A-Fa-f]{6})/)?.[1];
const titleColour = (markup: string) => colourIn(markup.match(/<h2[^>]*style="([^"]*)"/)?.[1]);
// The scrollable area wrapping the paragraphs carries the body colour.
const bodyColour = (markup: string) => colourIn(markup.match(/style="([^"]*)"><p[ >]/)?.[1]);

// TermsSheet uses no hooks, so its element tree can be walked to reach the click handlers.
function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [node, ...elements(node.props.children as ReactNode)];
}

describe("TermsSheet body", () => {
  it('splits "A\\n\\nB" into two paragraphs', () => {
    const markup = html(design({ body: "A\n\nB" }));
    expect(markup.match(/<p[ >]/g)).toHaveLength(2);
    expect(markup).toMatch(/>A<\/p>/);
    expect(markup).toMatch(/>B<\/p>/);
  });

  it("keeps a single line break inside one pre-line paragraph and drops empty paragraphs", () => {
    const markup = html(design({ body: "\n\nLine one\nLine two\n \n\n" }));
    expect(markup.match(/<p[ >]/g)).toHaveLength(1);
    expect(markup).toContain("white-space:pre-line");
    expect(markup).toContain("Line one\nLine two");
  });

  it.each<RenderMode>(["edit", "preview", "export"])(
    "%s mode renders markup in the body as escaped text",
    (mode) => {
      const markup = html(
        design({ body: "<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>" }),
        mode,
      );
      expect(markup).not.toMatch(/<script/i);
      expect(markup).not.toMatch(/<img/i);
      expect(markup).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    },
  );

  it("shows the title and the terms version", () => {
    const markup = html(design());
    expect(markup).toMatch(/<h2 id="cv-terms-title"[^>]*>Terms of use<\/h2>/);
    expect(markup).toContain("Version 3");
  });
});

describe("TermsSheet colours", () => {
  const navy: BackgroundSpec = {
    type: "gradient",
    from: "#0F2A44",
    to: "#0E5E6F",
    direction: "down",
  };

  it("uses the gradient's first stop for the sheet and a passing first heading for the text", () => {
    const markup = html(
      design({ background: navy, blocks: [heading("#C6F432"), heading("#FF0000")] }),
    );
    expect(markup).toContain("background:#0F2A44");
    expect(titleColour(markup)).toBe("#C6F432");
    expect(bodyColour(markup)).toBe("#C6F432");
  });

  it("falls back to bestTextColour for the title and body when the first heading fails 4.5:1", () => {
    const markup = html(
      design({ background: { type: "colour", colour: "#FFFFFF" }, blocks: [heading("#EEEEEE")] }),
    );
    expect(markup).toContain("background:#FFFFFF");
    expect(titleColour(markup)).toBe("#111111");
    expect(bodyColour(markup)).toBe("#111111");
  });

  it("falls back to bestTextColour when there is no heading", () => {
    const markup = html(design({ background: { type: "colour", colour: "#000000" } }));
    expect(titleColour(markup)).toBe("#FFFFFF");
    expect(bodyColour(markup)).toBe("#FFFFFF");
  });

  it("uses a photo's backdrop as the sheet colour", () => {
    const photo: BackgroundSpec = {
      type: "image",
      src: "data:image/png;base64,iVBORw0KGgo=",
      fit: "fill",
      zoom: 1,
      focus: { x: 50, y: 50 },
      backdrop: "#1A1A2E",
      overlay: null,
    };
    const markup = html(design({ background: photo }));
    expect(markup).toContain("background:#1A1A2E");
    expect(titleColour(markup)).toBe("#FFFFFF");
  });

  it("styles CLOSE like an outline Connect button: bg border, fg text, no fill", () => {
    const markup = html(design({ outline: true }));
    const close = markup.match(/<button[^>]*>CLOSE<\/button>/)?.[0] ?? "";
    expect(close).toContain("border:2px solid #F97316");
    expect(close).toContain("background:transparent");
    expect(close).toContain("color:#111111");
    expect(close).toContain("width:66%");
  });
});

describe("TermsSheet render modes", () => {
  it.each<RenderMode>(["edit", "preview"])(
    "%s mode renders a modal dialog with × and CLOSE buttons, not links",
    (mode) => {
      const markup = html(design(), mode);
      expect(markup).toMatch(/role="dialog" aria-modal="true" aria-labelledby="cv-terms-title"/);
      expect(markup.match(/<button type="button"/g)).toHaveLength(2);
      expect(markup).toContain('aria-label="Close terms"');
      expect(markup).toMatch(/>CLOSE<\/button>/);
      expect(markup).not.toContain("<a ");
      expect(markup).not.toContain("class=");
    },
  );

  it.each<RenderMode>(["edit", "preview"])(
    "%s mode: ×, CLOSE and the dim layer call onClose",
    (mode) => {
      const onClose = vi.fn();
      const tree = elements(TermsSheet({ design: design(), mode, onClose }));
      const clickable = tree.filter((el) => typeof el.props.onClick === "function");
      const dim = tree.find(
        (el) =>
          (el.props.style as { background?: string } | undefined)?.background ===
          "rgba(0,0,0,0.55)",
      );
      expect(clickable).toHaveLength(3);
      expect(clickable).toContain(dim);
      for (const el of clickable) (el.props.onClick as () => void)();
      expect(onClose).toHaveBeenCalledTimes(3);
    },
  );

  it("export mode renders a #terms section with cv-terms, # close links and no inline display", () => {
    const markup = html(design(), "export");
    const section = markup.match(/^<section[^>]*>/)?.[0] ?? "";
    expect(section).toContain('id="terms"');
    expect(section).toContain('class="cv-terms"');
    expect(section).toContain('role="dialog"');
    expect(section).toContain('aria-labelledby="cv-terms-title"');
    expect(section).toMatch(/style="position:fixed;inset:0;z-index:10"/);
    expect(section).not.toMatch(/display/);
    expect(markup.match(/<a href="#"/g)).toHaveLength(2);
    expect(markup).toMatch(/<a href="#" aria-label="Close terms"/);
    expect(markup).toMatch(/>CLOSE<\/a>/);
    expect(markup).not.toContain("<button");
    expect(markup.match(/class="/g)).toEqual(['class="']);
  });

  it("export mode attaches no click handlers", () => {
    const tree = elements(TermsSheet({ design: design(), mode: "export", onClose: vi.fn() }));
    expect(tree.some((el) => "onClick" in el.props)).toBe(false);
  });
});
