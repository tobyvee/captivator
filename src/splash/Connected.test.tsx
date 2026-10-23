// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BLANK, Design } from "../lib/design-schema";
import type { ImageBlockSpec, TextBlockSpec } from "../lib/types";
import { Connected } from "./Connected";
import { SplashPage } from "./SplashPage";

const PNG = "data:image/png;base64,iVBORw0KGgo=";

const image = (id: string): ImageBlockSpec => ({
  id,
  kind: "image",
  src: PNG,
  alt: `Alt ${id}`,
  size: "md",
});
const heading = (colour: string): TextBlockSpec => ({
  id: "h",
  kind: "text",
  text: "FREE WIFI",
  role: "heading",
  colour,
  size: 36,
});

const design = (blocks: Design["blocks"], edit?: (d: Design) => void): Design => {
  const d = structuredClone(BLANK.design);
  d.blocks = blocks;
  edit?.(d);
  return Design.parse(d);
};

const title = () => screen.getByRole("heading", { level: 1, name: "You're online" });

const badge = () => {
  const el = screen.getByRole("status").previousElementSibling as HTMLElement | null;
  if (!el?.querySelector("svg")) throw new Error("no badge before the heading");
  return el;
};

describe("Connected", () => {
  it('shows the logo, then a tick badge and "You\'re online" as a heading in a status region', () => {
    render(<Connected design={design([image("logo")])} mode="preview" />);
    const status = screen.getByRole("status");
    expect(status.tagName).toBe("DIV");
    expect(status).toHaveTextContent("You're online");
    expect(status.children).toHaveLength(1);
    expect(status.firstElementChild).toBe(title());
    expect(title()).toHaveStyle({ fontSize: "40px", fontWeight: "800" });
    expect(screen.getByRole("img", { name: "Alt logo" })).toBeInTheDocument();
    expect(badge()).toHaveAttribute("aria-hidden", "true");
    expect(badge()).toHaveStyle({ width: "72px", height: "72px" });
  });

  it("colours the badge and heading like the first heading, and the tick like the page", () => {
    const d = design([heading("#C6F432")], (x) => {
      x.background = { type: "gradient", from: "#0F2A44", to: "#0E5E6F", direction: "down" };
    });
    render(<Connected design={d} mode="preview" />);
    expect(badge().style.background).toBe("rgb(198, 244, 50)");
    expect(badge().style.color).toBe("rgb(15, 42, 68)");
    expect(title().style.color).toBe("rgb(198, 244, 50)");
  });

  it("without a heading, uses the best text colour for the page", () => {
    const d = design([], (x) => (x.background = { type: "colour", colour: "#0B1220" }));
    render(<Connected design={d} mode="preview" />);
    expect(badge().style.background).toBe("rgb(255, 255, 255)");
    expect(badge().style.color).toBe("rgb(11, 18, 32)");
    expect(title().style.color).toBe("rgb(255, 255, 255)");
  });

  it.each([
    [
      "fails 3:1 on a plain page",
      "#1E293B",
      { type: "colour", colour: "#0F2A44" },
      "rgb(255, 255, 255)",
    ],
    [
      "fails 3:1 on one gradient stop",
      "#FFFFFF",
      { type: "gradient", from: "#94A3B8", to: "#FDE68A", direction: "down" },
      "rgb(17, 17, 17)",
    ],
  ] as const)(
    "falls back to the best text colour when the heading colour %s",
    (_, colour, bg, want) => {
      render(
        <Connected
          design={design([heading(colour)], (x) => (x.background = { ...bg }))}
          mode="preview"
        />,
      );
      expect(title().style.color).toBe(want);
      expect(badge().style.background).toBe(want);
    },
  );

  it("keeps a heading colour that passes 3:1 though not 4.5:1, as 40px/800 is large text", () => {
    const d = design(
      [heading("#FFFFFF")],
      (x) => (x.background = { type: "colour", colour: "#777777" }),
    );
    render(<Connected design={d} mode="preview" />);
    expect(title().style.color).toBe("rgb(255, 255, 255)");
  });

  it("thanks the sponsor and shows the second image only when there is one", () => {
    const { unmount } = render(<Connected design={design([image("logo")])} mode="preview" />);
    expect(screen.queryByText("Thanks to our sponsor")).toBeNull();
    expect(screen.getAllByRole("img")).toHaveLength(1);
    unmount();

    render(<Connected design={design([image("logo"), image("sponsor")])} mode="preview" />);
    expect(screen.getByText("Thanks to our sponsor")).toBeInTheDocument();
    const images = screen.getAllByRole("img");
    expect(images.map((i) => i.getAttribute("alt"))).toEqual(["Alt logo", "Alt sponsor"]);
  });

  it("keeps the sponsor line at 4.5:1 on a mid grey, where white falls just short", () => {
    const d = design([image("logo"), image("sponsor")], (d) => {
      d.background = { type: "colour", colour: "#777777" };
    });
    render(<Connected design={d} mode="preview" />);
    expect(screen.getByText("Thanks to our sponsor")).toHaveStyle({ color: "#000000" });
  });

  it("styles CONTINUE like Connect and calls onContinue", async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    const d = design([], (x) => {
      x.form.button = { label: "GO", bg: "#F97316", fg: "#111111", variant: "solid" };
    });
    render(<Connected design={d} mode="edit" onContinue={onContinue} />);
    const button = screen.getByRole("button", { name: "CONTINUE" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveStyle({ minHeight: "50px", width: "66%" });
    expect(button.style.background).toBe("rgb(249, 115, 22)");
    expect(button.style.color).toBe("rgb(17, 17, 17)");
    await user.click(button);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("keeps 40px plus the bottom safe area below CONTINUE for the photo credit", () => {
    render(<Connected design={design([])} mode="preview" />);
    const column = screen.getByRole("button", { name: "CONTINUE" }).parentElement!;
    expect(column.lastElementChild).toBe(screen.getByRole("button", { name: "CONTINUE" }));
    // jsdom drops env(), so read the rendered style attribute.
    expect(renderToStaticMarkup(<Connected design={design([])} mode="preview" />)).toContain(
      "padding-bottom:calc(40px + env(safe-area-inset-bottom, 0px))",
    );
  });

  it("renders the design's text as text, never markup", () => {
    const d = design([{ ...image("logo"), alt: "<b>x</b>" }]);
    render(<Connected design={d} mode="preview" />);
    expect(screen.getByRole("img")).toHaveAttribute("alt", "<b>x</b>");
    expect(document.querySelector("b")).toBeNull();
  });
});

describe("Connected in SplashPage edit mode", () => {
  it("lets clicks on empty space fall through to the root, selecting the background", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onScreenChange = vi.fn();
    const { container } = render(
      <SplashPage
        design={design([image("logo"), heading("#111111")])}
        screen="connected"
        mode="edit"
        onSelect={onSelect}
        onScreenChange={onScreenChange}
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    const button = screen.getByRole("button", { name: "CONTINUE" });
    const column = button.parentElement!;

    expect(column).toHaveStyle({ pointerEvents: "none" });
    expect(button).toHaveStyle({ pointerEvents: "auto" });
    // user-event honours pointer-events, as a browser's hit test does.
    await expect(user.click(screen.getByRole("status"))).rejects.toThrow(/pointer-events/);

    await user.click(root);
    expect(onSelect.mock.calls).toEqual([[{ kind: "background" }]]);

    await user.click(button);
    expect(onScreenChange.mock.calls).toEqual([["landing"]]);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("export mode sets no pointer-events and no click handlers", () => {
    render(<Connected design={design([])} mode="export" onContinue={vi.fn()} />);
    const button = screen.getByRole("button", { name: "CONTINUE" });
    expect(button.style.pointerEvents).toBe("");
    expect(button.parentElement!.style.pointerEvents).toBe("");
  });
});
