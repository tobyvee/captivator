import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { BLANK, Design } from "../lib/design-schema";
import type { BackgroundSpec, RenderMode, TextBlockSpec } from "../lib/types";
import { connectButtonStyle } from "./Form";
import { TERMS_LINK_ID, TermsSheet } from "./TermsSheet";

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
    fg?: string;
  } = {},
): Design => {
  const d = structuredClone(BLANK.design);
  d.form.terms.mode = "checkbox";
  d.form.terms.version = 3;
  if (opts.body !== undefined) d.form.terms.body = opts.body;
  if (opts.background) d.background = opts.background;
  if (opts.blocks) d.blocks = opts.blocks;
  if (opts.outline)
    d.form.button = { label: "Go", bg: "#F97316", fg: opts.fg ?? "#111111", variant: "outline" };
  return Design.parse(d);
};

const html = (d: Design, mode: RenderMode = "preview") =>
  renderToStaticMarkup(<TermsSheet design={d} mode={mode} />);

// The `color` in an inline style attribute's value (not `background-color` or similar).
const colourIn = (style = "") => style.match(/(?:^|;)color:(#[0-9A-Fa-f]{6})/)?.[1];
// The sheet sets the text colour once; the title, body and version inherit it.
const textColour = (markup: string) =>
  colourIn(markup.match(/style="([^"]*border-radius:22px 22px 0 0[^"]*)"/)?.[1]);
const titleStyle = (markup: string) => markup.match(/<h2[^>]*style="([^"]*)"/)?.[1] ?? "";
// The scrollable area wrapping the paragraphs.
const bodyStyle = (markup: string) => markup.match(/style="([^"]*)"><p[ >]/)?.[1] ?? "";
const closeStyle = (markup: string) => markup.match(/<button[^>]*style="([^"]*)"[^>]*>CLOSE</)?.[1] ?? "";

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
    expect(textColour(markup)).toBe("#C6F432");
  });

  it("sets the text colour on the sheet only, so the title and body inherit it", () => {
    const markup = html(design({ background: navy, blocks: [heading("#C6F432")] }));
    expect(colourIn(titleStyle(markup))).toBeUndefined();
    expect(colourIn(bodyStyle(markup))).toBeUndefined();
  });

  it("falls back to bestTextColour for the title and body when the first heading fails 4.5:1", () => {
    const markup = html(
      design({ background: { type: "colour", colour: "#FFFFFF" }, blocks: [heading("#EEEEEE")] }),
    );
    expect(markup).toContain("background:#FFFFFF");
    expect(textColour(markup)).toBe("#111111");
  });

  it("falls back to black on a mid-grey sheet where neither #111111 nor white reaches 4.5:1", () => {
    // White heading on #777777 is 4.48:1, and bestTextColour's #FFFFFF is too.
    const markup = html(
      design({ background: { type: "colour", colour: "#777777" }, blocks: [heading("#FFFFFF")] }),
    );
    expect(markup).toContain("background:#777777");
    expect(textColour(markup)).toBe("#000000");
  });

  it("falls back to bestTextColour when there is no heading", () => {
    const markup = html(design({ background: { type: "colour", colour: "#000000" } }));
    expect(textColour(markup)).toBe("#FFFFFF");
  });

  const photo: BackgroundSpec = {
    type: "image",
    src: "data:image/png;base64,iVBORw0KGgo=",
    fit: "fill",
    zoom: 1,
    focus: { x: 50, y: 50 },
    backdrop: "#1A1A2E",
    overlay: null,
  };

  it("uses a photo's backdrop as the sheet colour", () => {
    const markup = html(design({ background: photo }));
    expect(markup).toContain("background:#1A1A2E");
    expect(textColour(markup)).toBe("#FFFFFF");
  });

  it("styles CLOSE like an outline Connect button: bg border, fg text, no fill", () => {
    const close = closeStyle(html(design({ outline: true })));
    expect(close).toContain("border:2px solid #F97316");
    expect(close).toContain("background:transparent");
    expect(colourIn(close)).toBe("#111111");
    expect(close).toContain("width:66%");
  });

  it("draws an outline CLOSE in the sheet's text colour when fg fails 4.5:1 on the sheet", () => {
    const markup = html(design({ background: photo, outline: true, fg: "#111111" }));
    const close = closeStyle(markup);
    expect(textColour(markup)).toBe("#FFFFFF");
    expect(colourIn(close)).toBe("#FFFFFF");
    expect(close).toContain("border:2px solid #FFFFFF");
    expect(close).toContain("background:transparent");
  });

  it.each([false, true])("CLOSE carries Connect's own style (outline: %s)", (outline) => {
    const d = design({ outline });
    const close = elements(TermsSheet({ design: d, mode: "preview" })).find(
      (el) => el.props.children === "CLOSE",
    );
    expect(close?.props.style).toMatchObject(connectButtonStyle(d.form.button));
  });
});

describe("TermsSheet render modes", () => {
  it.each<RenderMode>(["edit", "preview"])(
    "%s mode renders a non-modal dialog with × and CLOSE buttons, not links",
    (mode) => {
      const markup = html(design(), mode);
      expect(markup).toMatch(/role="dialog" aria-labelledby="cv-terms-title"/);
      expect(markup).not.toContain("aria-modal");
      expect(markup.match(/<button type="button"/g)).toHaveLength(2);
      expect(markup).toContain('aria-label="Close terms"');
      expect(markup).toMatch(/>CLOSE<\/button>/);
      expect(markup).not.toContain("<a ");
      expect(markup).not.toContain("class=");
      // Nothing that moves focus on its own in the editor.
      expect(markup).not.toMatch(/tabindex="-1"|autofocus/i);
    },
  );

  it.each<RenderMode>(["edit", "preview", "export"])(
    "%s mode: the sheet sits in a fixed, viewport-sized overlay",
    (mode) => {
      const markup = html(design(), mode);
      expect(markup).toMatch(/^<section[^>]*style="position:fixed;inset:0;z-index:10"/);
      expect(markup).toMatch(/style="position:absolute;left:0;right:0;bottom:0;height:82%/);
    },
  );

  it.each<RenderMode>(["edit", "preview", "export"])(
    "%s mode: the scrolling body is a labelled, keyboard-focusable region",
    (mode) => {
      expect(html(design(), mode)).toMatch(
        /<div role="region" aria-label="Terms text" tabindex="0" style="[^"]*overflow-y:auto[^"]*"><p/,
      );
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

  it("export mode renders a focusable modal #terms section with cv-terms and no inline display", () => {
    const markup = html(design(), "export");
    const section = markup.match(/^<section[^>]*>/)?.[0] ?? "";
    expect(section).toContain('id="terms"');
    expect(section).toContain('class="cv-terms"');
    expect(section).toContain('role="dialog"');
    expect(section).toContain('aria-modal="true"');
    expect(section).toContain('aria-labelledby="cv-terms-title"');
    expect(section).toContain('tabindex="-1"');
    expect(section).toMatch(/style="position:fixed;inset:0;z-index:10"/);
    expect(section).not.toMatch(/display/);
    expect(markup).not.toContain("<button");
    expect(markup.match(/class="/g)).toEqual(['class="']);
  });

  it("export mode: ×, CLOSE and the dim layer link back to the terms link, never to #", () => {
    const markup = html(design(), "export");
    const href = `href="#${TERMS_LINK_ID}"`;
    expect(TERMS_LINK_ID).toBe("cv-terms-link");
    expect(markup.match(/href="[^"]*"/g)).toEqual([href, href, href]);
    expect(markup).toMatch(
      new RegExp(`^<section[^>]*><a ${href} aria-hidden="true" tabindex="-1" style="position:absolute;inset:0;background:rgba\\(0,0,0,0.55\\)"></a>`),
    );
    expect(markup).toContain(`<a ${href} aria-label="Close terms"`);
    expect(markup).toMatch(/>CLOSE<\/a>/);
  });

  it("export mode attaches no click handlers", () => {
    const tree = elements(TermsSheet({ design: design(), mode: "export", onClose: vi.fn() }));
    expect(tree.some((el) => "onClick" in el.props)).toBe(false);
  });
});
