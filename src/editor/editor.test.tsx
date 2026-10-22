// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import EditorPage from "@/app/editor/page";
import { STORAGE_KEY, useStore } from "@/lib/store";
import { SPONSOR } from "@/lib/templates";
import type { Selection } from "@/lib/types";
import { Inspector } from "./Inspector";
import { TopBar } from "./TopBar";

const HEADING_ID = "sponsor-heading";
const LOGO_ID = "sponsor-logo";

beforeEach(() => {
  localStorage.clear();
  useStore.setState(useStore.getInitialState(), true);
  useStore.persist.clearStorage(); // drop the write the reset scheduled
});

afterEach(() => {
  vi.restoreAllMocks();
});

const select = (selection: Selection) => act(() => useStore.getState().setSelection(selection));
const heading = () => screen.getByRole("heading", { level: 2 });

describe("EditorPage", () => {
  it("renders the skeleton on the server and hydrates without a mismatch", () => {
    const html = renderToString(<EditorPage />);
    expect(html).toContain("Loading your design");
    expect(html).not.toContain("Design name");

    // React 19 reports a hydration mismatch through onRecoverableError, not console.error.
    const mismatch = vi.fn();
    const errors = vi.spyOn(console, "error");
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container); // append() is retyped by the Workers globals
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      act(() => {
        root = hydrateRoot(container, <EditorPage />, { onRecoverableError: mismatch });
      });

      expect(mismatch).not.toHaveBeenCalled();
      expect(errors).not.toHaveBeenCalled();
      expect(within(container).getByRole("textbox", { name: "Design name" })).toBeInTheDocument();
      expect(within(container).queryByText("Loading your design…")).not.toBeInTheDocument();
    } finally {
      act(() => root?.unmount());
      container.remove();
    }
  });

  it("restores the saved name and design after mount", () => {
    const design = structuredClone(SPONSOR.design);
    design.blocks = design.blocks.filter((b) => b.id !== LOGO_ID);
    const state = { design, name: "Harbourside Summit" };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, version: 2 }));

    render(<EditorPage />);

    expect(screen.getByRole("textbox", { name: "Design name" })).toHaveValue("Harbourside Summit");
    expect(useStore.getState().design.blocks.map((b) => b.id)).not.toContain(LOGO_ID);
  });

  it("lays out the block list, the preview in main and the inspector as sibling landmarks", () => {
    render(<EditorPage />);
    const main = screen.getByRole("main");
    const blocks = screen.getByRole("complementary", { name: "Blocks" });
    const inspector = screen.getByRole("complementary", { name: "Background settings" });
    expect(within(main).getByRole("region", { name: "Preview" })).toBeInTheDocument();
    expect(main).not.toContainElement(blocks);
    expect(main).not.toContainElement(inspector);
    // Each landmark sits in its own column of the same row, in reading order.
    const columns = [blocks.parentElement, main, inspector.parentElement];
    expect(new Set(columns.map((column) => column?.parentElement)).size).toBe(1);
    expect(Array.from(main.parentElement?.children ?? [])).toEqual(columns);
  });
});

describe("TopBar", () => {
  it("names the app in the page's top-level heading", () => {
    render(<TopBar />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Captivator");
  });

  it("edits the design name through the store, capped at 60 characters", () => {
    render(<TopBar />);
    const input = screen.getByRole("textbox", { name: "Design name" });
    expect(input).toHaveAttribute("maxLength", "60");

    fireEvent.change(input, { target: { value: "Harbourside Summit guest WiFi" } });
    expect(useStore.getState().name).toBe("Harbourside Summit guest WiFi");
    expect(input).toHaveValue("Harbourside Summit guest WiFi");
  });

  it("announces and switches the preview device", () => {
    render(<TopBar />);
    const group = screen.getByRole("group", { name: "Preview device" });
    const mobile = within(group).getByRole("button", { name: "Mobile" });
    const desktop = within(group).getByRole("button", { name: "Desktop" });
    expect(mobile).toHaveAttribute("aria-pressed", "true");
    expect(desktop).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(desktop);
    expect(useStore.getState().device).toBe("desktop");
    expect(desktop).toHaveAttribute("aria-pressed", "true");
    expect(mobile).toHaveAttribute("aria-pressed", "false");
  });

  it("links back to the template picker without a confirm", () => {
    const confirm = vi.spyOn(window, "confirm");
    render(<TopBar />);
    const templates = screen.getByRole("link", { name: "Templates" });
    expect(templates).toHaveAttribute("href", "/");
    fireEvent.click(templates);
    expect(confirm).not.toHaveBeenCalled();
  });

  it("shows undo, redo and Export HTML as disabled until their tickets land", () => {
    render(<TopBar />);
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Redo" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Export HTML" })).toBeDisabled();
  });
});

describe("Inspector", () => {
  it.each<[Selection, string, string | null]>([
    [{ kind: "background" }, "Background", "Fills the whole screen behind your content"],
    [{ kind: "block", id: HEADING_ID }, "Heading", "Text block"],
    [{ kind: "block", id: "sponsor-subheading" }, "Subheading", "Text block"],
    [{ kind: "block", id: LOGO_ID }, "Image", "Image block"],
    [{ kind: "fields" }, "Fields", "Up to two"],
    [{ kind: "terms" }, "Terms", "Checkbox above the Connect button"],
    [{ kind: "button" }, "Connect button", null],
  ])("shows the header and panel for %o", (selection, title, subtitle) => {
    render(<Inspector />);
    select(selection);
    expect(heading()).toHaveTextContent(title);
    expect(screen.getByRole("complementary", { name: `${title} settings` })).toBeInTheDocument();
    // The subtitle is the paragraph right after the heading; the Connect button has none.
    const next = heading().nextElementSibling;
    if (subtitle) expect(next).toHaveTextContent(subtitle);
    else expect(next).toBeNull();
    expect(screen.getByText(/settings are coming soon/)).toBeInTheDocument();
  });

  it("titles a body text block as Text", () => {
    act(() => {
      useStore.getState().updateBlock(HEADING_ID, { role: "body" });
    });
    render(<Inspector />);
    select({ kind: "block", id: HEADING_ID });
    expect(heading()).toHaveTextContent("Text");
  });

  it("passes the selected block's id to its panel", () => {
    render(<Inspector />);
    select({ kind: "block", id: LOGO_ID });
    expect(screen.getByText("Image settings are coming soon.")).toHaveAttribute("data-block-id", LOGO_ID);
  });

  it("falls back to Background when the selected block doesn't exist", () => {
    render(<Inspector />);
    select({ kind: "block", id: "gone" });
    expect(heading()).toHaveTextContent("Background");
    expect(screen.queryByRole("button", { name: "Delete block" })).not.toBeInTheDocument();
  });

  it("deletes the selected block and falls back to Background", () => {
    render(<Inspector />);
    select({ kind: "block", id: HEADING_ID });
    fireEvent.click(screen.getByRole("button", { name: "Delete block" }));

    expect(useStore.getState().design.blocks.map((b) => b.id)).not.toContain(HEADING_ID);
    expect(useStore.getState().selection).toEqual({ kind: "background" });
    expect(heading()).toHaveTextContent("Background");
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Background" }));
  });

  it("offers Delete only for blocks", () => {
    render(<Inspector />);
    for (const kind of ["background", "fields", "terms", "button"] as const) {
      select({ kind });
      expect(screen.queryByRole("button", { name: "Delete block" })).not.toBeInTheDocument();
    }
  });

  it("toggles the terms checkbox from the Terms header switch", () => {
    render(<Inspector />);
    select({ kind: "terms" });
    const toggle = screen.getByRole("switch", { name: "Show terms checkbox" });
    expect(toggle).toHaveAttribute("aria-checked", "true");

    fireEvent.click(toggle);
    expect(useStore.getState().design.form.terms.mode).toBe("off");
    expect(toggle).toHaveAttribute("aria-checked", "false");

    fireEvent.click(toggle);
    expect(useStore.getState().design.form.terms.mode).toBe("checkbox");
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });
});
