// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { BLANK, Design } from "../lib/design-schema";
import type { ImageBlockSpec, RenderMode, TextBlockSpec } from "../lib/types";
import { SplashPage } from "./SplashPage";

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

  it("export mode puts cv-root on the root and no other class anywhere", () => {
    const { container } = render(<SplashPage design={MIXED} screen="landing" mode="export" />);
    expect(container.firstElementChild).toHaveAttribute("class", "cv-root");
    expect(container.querySelectorAll("[class]")).toHaveLength(1);
  });
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
  it("hides the landing page from assistive tech under the open terms sheet", () => {
    render(<SplashPage design={design([text("t", "heading")], "checkbox")} screen="terms" mode="preview" />);
    expect(screen.queryByRole("heading")).toBeNull();
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

describe("src/splash stays portable", () => {
  const dir = import.meta.dirname;
  const sources = (readdirSync(dir, { recursive: true }) as string[])
    .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))
    .map((f) => [f, readFileSync(join(dir, f), "utf8")] as const);

  it("finds the splash sources", () => {
    expect(sources.map(([f]) => f)).toContain("SplashPage.tsx");
  });

  it.each(sources)("%s never injects HTML", (_, src) => {
    expect(src).not.toMatch(/dangerouslySetInnerHTML|innerHTML/);
  });

  it.each(sources)("%s imports nothing from next, the editor or the store", (_, src) => {
    const imports = [...src.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
    for (const path of imports) {
      expect(path).not.toMatch(/^next(\/|$)|editor\/|lib\/store/);
    }
  });
});
