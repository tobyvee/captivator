// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { BLANK, Design } from "../lib/design-schema";
import type { ImageBlockSpec, RenderMode, Screen, TextBlockSpec } from "../lib/types";
import { Form } from "./Form";
import { SplashPage } from "./SplashPage";

// Form keeps its real implementation; one test swaps in a clickable child for a single render.
vi.mock("./Form", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./Form")>();
  return { ...actual, Form: vi.fn(actual.Form) };
});

const PNG = "data:image/png;base64,iVBORw0KGgo=";

const text = (id: string, role: TextBlockSpec["role"], value = id): TextBlockSpec => ({
  id,
  kind: "text",
  text: value,
  role,
  colour: "#111111",
  size: 20,
});

const image = (id: string): ImageBlockSpec => ({ id, kind: "image", src: PNG, alt: `Alt ${id}`, size: "md" });

const design = (blocks: Design["blocks"], terms: "off" | "checkbox" = "off"): Design => {
  const d = structuredClone(BLANK.design);
  d.blocks = blocks;
  d.form.terms.mode = terms;
  return Design.parse(d);
};

const MIXED = design([
  text("intro", "body"),
  text("title", "heading"),
  image("logo"),
  text("tagline", "subheading"),
  text("second", "heading"),
]);

describe("SplashPage blocks", () => {
  it("renders text blocks in array order: first heading h1, later headings h2, others p", () => {
    const { container } = render(<SplashPage design={MIXED} screen="landing" mode="preview" />);
    const rendered = [...container.querySelectorAll("h1, h2, p")].map(
      (el) => `${el.tagName.toLowerCase()}:${el.textContent}`,
    );
    expect(rendered).toEqual(["p:intro", "h1:title", "p:tagline", "h2:second"]);
  });

  it("renders an image block as an img with its src and alt", () => {
    render(<SplashPage design={MIXED} screen="landing" mode="export" />);
    expect(screen.getByAltText("Alt logo")).toHaveAttribute("src", PNG);
  });

  it("renders markup in a text block as text, creating no element", () => {
    const attack = "<img src=x onerror=alert(1)>";
    const { container } = render(
      <SplashPage design={design([text("x", "heading", attack)])} screen="landing" mode="edit" />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(attack);
    expect(container.querySelector("img")).toBeNull();
  });
});

describe("SplashPage render modes", () => {
  it.each<RenderMode>(["edit", "preview"])("%s mode renders no class names", (mode) => {
    const { container } = render(<SplashPage design={MIXED} screen="landing" mode={mode} />);
    expect(container.querySelector(".cv-root")).toBeNull();
    expect(container.querySelectorAll("[class]")).toHaveLength(0);
  });

  it("inFrame lets the root grow from the frame's full height, with no scrolling of its own", () => {
    const { container } = render(<SplashPage design={MIXED} screen="landing" mode="edit" inFrame />);
    const root = container.firstElementChild as HTMLElement; // the render's only root element
    expect(root.style.minHeight).toBe("100%");
    expect(root.style.height).toBe("");
    expect(root.style.overflow).toBe("");
    expect(root.style.overflowY).toBe("");
    expect(root.style.position).toBe("relative");
  });

  it.each<RenderMode>(["edit", "preview", "export"])(
    "%s: the root isolates its own stacking context",
    (mode) => {
      const { container } = render(<SplashPage design={MIXED} screen="landing" mode={mode} />);
      expect(container.firstElementChild?.getAttribute("style")).toContain("isolation: isolate");
    },
  );

  it("without inFrame the root takes its natural content height", () => {
    const { container } = render(<SplashPage design={MIXED} screen="landing" mode="preview" />);
    expect((container.firstElementChild as HTMLElement).style.minHeight).toBe("");
  });

  it("export mode puts cv-root on the root and no other class anywhere", () => {
    const { container } = render(<SplashPage design={MIXED} screen="landing" mode="export" />);
    expect(container.firstElementChild).toHaveAttribute("class", "cv-root");
    expect(container.querySelectorAll("[class]")).toHaveLength(1);
  });

  // cv-terms is the export's only other class (T-021-cv-terms-second-export-class).
  it("export mode with terms on adds only cv-terms, on section#terms", () => {
    const { container } = render(
      <SplashPage design={design(MIXED.blocks, "checkbox")} screen="landing" mode="export" />,
    );
    const classed = [...container.querySelectorAll("[class]")];
    expect(classed.map((el) => `${el.tagName.toLowerCase()}#${el.id}.${el.className}`)).toEqual([
      "div#.cv-root",
      "section#terms.cv-terms",
    ]);
    expect(classed[0]).toBe(container.firstElementChild);
  });

  it.each<RenderMode>(["edit", "preview"])(
    "%s mode with the terms sheet open renders no class names",
    (mode) => {
      const { container } = render(
        <SplashPage design={design(MIXED.blocks, "checkbox")} screen="terms" mode={mode} />,
      );
      expect(container.querySelector('[role="dialog"]')).not.toBeNull();
      expect(container.querySelectorAll("[class]")).toHaveLength(0);
    },
  );
});

describe("SplashPage edit-mode selection", () => {
  it("clicking a block selects that block only", () => {
    const onSelect = vi.fn();
    render(<SplashPage design={MIXED} screen="landing" mode="edit" onSelect={onSelect} />);
    fireEvent.click(screen.getByText("tagline"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith({ kind: "block", id: "tagline" });
  });

  it("clicking the page outside a block selects the background", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <SplashPage design={MIXED} screen="landing" mode="edit" onSelect={onSelect} />,
    );
    fireEvent.click(container.firstElementChild!);
    expect(onSelect).toHaveBeenCalledWith({ kind: "background" });
  });

  it("clicking the empty column or the spacer selects the background", () => {
    const onSelect = vi.fn();
    render(<SplashPage design={MIXED} screen="landing" mode="edit" onSelect={onSelect} />);
    // text element -> block wrapper -> column
    const column = screen.getByText("title").parentElement?.parentElement;
    const spacer = column?.querySelector(':scope > [aria-hidden="true"]');
    if (!column || !spacer) throw new Error("column or spacer not found");
    fireEvent.click(column);
    fireEvent.click(spacer);
    expect(onSelect.mock.calls).toEqual([[{ kind: "background" }], [{ kind: "background" }]]);
  });

  it("a click inside a non-block child does not select the background", () => {
    vi.mocked(Form).mockImplementationOnce(() => (
      <button type="button">
        <span>Connect</span>
      </button>
    ));
    const onSelect = vi.fn();
    render(<SplashPage design={MIXED} screen="landing" mode="edit" onSelect={onSelect} />);
    fireEvent.click(screen.getByText("Connect"));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows a name chip on the selected block only", () => {
    render(
      <SplashPage
        design={MIXED}
        screen="landing"
        mode="edit"
        selection={{ kind: "block", id: "logo" }}
      />,
    );
    expect(screen.getByText("Image")).toBeInTheDocument();
    expect(screen.queryByText("Heading")).toBeNull();
    expect(screen.queryByText("Subheading")).toBeNull();
  });

  it.each<RenderMode>(["preview", "export"])("%s mode ignores clicks and selection", (mode) => {
    const onSelect = vi.fn();
    render(
      <SplashPage
        design={MIXED}
        screen="landing"
        mode={mode}
        selection={{ kind: "block", id: "title" }}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByText("title"));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.queryByText("Heading")).toBeNull();
  });
});

describe("SplashPage screens", () => {
  it("renders the landing page under the open terms sheet but hides it and makes it inert", () => {
    render(
      <SplashPage
        design={design([text("t", "heading", "Welcome")], "checkbox")}
        screen="terms"
        mode="preview"
      />,
    );
    const heading = screen.getByRole("heading", { level: 1, hidden: true });
    expect(heading).toHaveTextContent("Welcome");
    expect(screen.queryByRole("heading", { name: "Welcome" })).toBeNull();
    expect(heading.closest('[aria-hidden="true"]')).toHaveAttribute("inert");
  });

  it("edit: clicking the dim layer closes the sheet without selecting the background", () => {
    const onSelect = vi.fn();
    const onScreenChange = vi.fn();
    const { container } = render(
      <SplashPage
        design={design([text("t", "heading")], "checkbox")}
        screen="terms"
        mode="edit"
        onSelect={onSelect}
        onScreenChange={onScreenChange}
      />,
    );
    const dim = container.querySelector('[role="dialog"] > [aria-hidden="true"]');
    if (!dim) throw new Error("dim layer not found");
    fireEvent.click(dim);
    expect(onScreenChange).toHaveBeenCalledWith("landing");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("renders plain landing on the terms screen when terms are off", () => {
    render(<SplashPage design={design([text("t", "heading")])} screen="terms" mode="preview" />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("replaces the content column on the connected screen", () => {
    render(<SplashPage design={MIXED} screen="connected" mode="preview" />);
    expect(screen.queryByText("title")).toBeNull();
  });
});

describe("SplashPage photo credit", () => {
  const withCredit = (terms: "off" | "checkbox" = "checkbox"): Design => {
    const d = design([text("t", "heading", "Welcome")], terms);
    d.background = {
      type: "image",
      src: PNG,
      credit: {
        name: "Alex S.",
        profileUrl: "https://unsplash.com/@santsec24",
        downloadLocation: "https://api.unsplash.com/photos/abc/download",
      },
      fit: "fill",
      zoom: 1,
      focus: { x: 50, y: 50 },
      backdrop: "#000000",
      overlay: null,
    };
    return Design.parse(d);
  };
  const creditLine = (container: HTMLElement) => {
    const line = [...container.querySelectorAll("p")].find((p) => p.textContent?.startsWith("Photo:"));
    if (!line) throw new Error("credit line not found");
    return line;
  };
  const follows = (later: Node, earlier: Node) =>
    Boolean(earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING);

  it.each<RenderMode>(["edit", "preview", "export"])(
    "%s: comes after the heading and the form in document order",
    (mode) => {
      const { container } = render(<SplashPage design={withCredit()} screen="landing" mode={mode} />);
      const line = creditLine(container);
      const heading = container.querySelector("h1");
      const form = container.querySelector("form");
      if (!heading || !form) throw new Error("heading or form not found");
      expect(follows(line, heading)).toBe(true);
      expect(follows(line, form)).toBe(true);
      expect(form.contains(line)).toBe(false);
      // The mode reaches the credit: plain text in the export (T-006-export-credit-plain-text).
      expect(line.querySelectorAll("a")).toHaveLength(mode === "export" ? 0 : 2);
    },
  );

  it.each<Screen>(["landing", "error", "connected"])(
    "%s: is not inside any click-through (pointer-events: none) element",
    (s) => {
      const { container } = render(<SplashPage design={withCredit()} screen={s} mode="edit" />);
      for (let el: HTMLElement | null = creditLine(container); el; el = el.parentElement) {
        expect(el.style.pointerEvents).not.toBe("none");
      }
    },
  );

  it("stays in the hidden, inert landing page under the open terms sheet", () => {
    const { container } = render(<SplashPage design={withCredit()} screen="terms" mode="preview" />);
    expect(creditLine(container).closest('[aria-hidden="true"]')).toHaveAttribute("inert");
  });

  it("renders on the connected screen too", () => {
    const { container } = render(<SplashPage design={withCredit()} screen="connected" mode="export" />);
    expect(creditLine(container)).toHaveTextContent("Photo: Alex S. / Unsplash");
  });

  it("export with terms on carries the #terms sheet after the credit", () => {
    const { container } = render(<SplashPage design={withCredit()} screen="landing" mode="export" />);
    const sheet = container.querySelector("#terms");
    if (!sheet) throw new Error("#terms not found");
    expect(follows(sheet, creditLine(container))).toBe(true);
  });

  it("export with terms off has no #terms sheet", () => {
    const { container } = render(
      <SplashPage design={withCredit("off")} screen="landing" mode="export" />,
    );
    expect(container.querySelector("#terms")).toBeNull();
  });

  it("is absent for a photo without a credit", () => {
    const d = withCredit();
    if (d.background.type !== "image") throw new Error("expected a photo background");
    d.background.credit = undefined;
    const { container } = render(<SplashPage design={d} screen="landing" mode="preview" />);
    expect(container.textContent).not.toContain("Photo:");
  });
});

describe("src/splash stays portable", () => {
  const dir = import.meta.dirname;
  const sources = (readdirSync(dir, { recursive: true }) as string[])
    .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))
    .map((f) => [f, readFileSync(join(dir, f), "utf8")] as const);

  it("finds the splash sources", () => {
    expect(sources.map(([f]) => f)).toContain("SplashPage.tsx");
  });

  it.each(sources)("%s never injects HTML", (_, src) => {
    expect(src).not.toMatch(/dangerouslySetInnerHTML|innerHTML|srcDoc/);
  });

  // Static, side-effect, dynamic and require imports, including index imports like "../editor".
  it.each(sources)("%s imports nothing from next, the editor, the store or CSS", (_, src) => {
    const imports = [
      ...src.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g),
      ...src.matchAll(/require\(\s*["']([^"']+)/g),
    ].map((m) => m[1]);
    for (const path of imports) {
      expect(path).not.toMatch(/^next(\/|$)|(^|\/)editor(\/|$)|(^|\/)lib\/store(\/|$)/);
      expect(path).not.toMatch(/\.css$/);
    }
  });
});
