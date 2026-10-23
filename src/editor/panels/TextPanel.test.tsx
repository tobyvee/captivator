// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "@/lib/store";
import type { TextBlockSpec } from "@/lib/types";
import { SplashPage } from "@/splash/SplashPage";
import { TextPanel } from "./TextPanel";

const HEADING_ID = "sponsor-heading"; // "FREE WIFI", heading, #C6F432, 36px, over a photo

beforeEach(() => {
  localStorage.clear();
  useStore.setState(useStore.getInitialState(), true);
  useStore.persist.clearStorage(); // drop the write the reset scheduled
});

const heading = () => useStore.getState().design.blocks.find((b) => b.id === HEADING_ID) as TextBlockSpec;
const textArea = () => screen.getByRole("textbox", { name: "Text" });
const styleGroup = () => screen.getByRole("group", { name: "Style" });
const sizeSlider = () => screen.getByRole("slider", { name: "Size" });
const colourInput = () => screen.getByRole("textbox", { name: "Colour" });

// The editor preview reads the same store, so this shows what the customer sees as they edit.
function Preview() {
  const design = useStore((s) => s.design);
  return <SplashPage design={design} screen="landing" mode="preview" />;
}

function renderWithPreview() {
  const preview = document.createElement("div");
  document.body.appendChild(preview);
  render(<Preview />, { container: preview });
  render(<TextPanel id={HEADING_ID} />);
  return within(preview);
}

describe("TextPanel", () => {
  it("shows the block's text, counter, style, size and colour", () => {
    render(<TextPanel id={HEADING_ID} />);
    expect(textArea()).toHaveValue("FREE WIFI");
    expect(screen.getByText("9 of 120 characters")).toBeInTheDocument();
    expect(within(styleGroup()).getByRole("button", { name: "Heading" })).toHaveAttribute("aria-pressed", "true");
    expect(sizeSlider()).toHaveValue("34");
    expect(sizeSlider()).toHaveAttribute("aria-valuetext", "34 px");
    expect(colourInput()).toHaveValue("#C6F432");
    expect(screen.getByText(/Want a two-colour headline\?/)).toBeInTheDocument();
  });

  it("updates the store, counter and preview on every keystroke", async () => {
    const user = userEvent.setup();
    const preview = renderWithPreview();
    await user.clear(textArea());
    expect(heading().text).toBe("");
    expect(screen.getByText("0 of 120 characters")).toBeInTheDocument();

    await user.type(textArea(), "Hi");
    expect(heading().text).toBe("Hi");
    expect(screen.getByText("2 of 120 characters")).toBeInTheDocument();
    expect(preview.getByRole("heading", { level: 1 })).toHaveTextContent("Hi");
  });

  it("describes the textarea with the counter", () => {
    render(<TextPanel id={HEADING_ID} />);
    expect(textArea()).toHaveAccessibleDescription("9 of 120 characters");
  });

  it("stops the textarea at 120 characters", async () => {
    const user = userEvent.setup();
    render(<TextPanel id={HEADING_ID} />);
    expect(textArea()).toHaveAttribute("maxLength", "120");
    await user.clear(textArea());
    await user.type(textArea(), "x".repeat(125));
    expect(heading().text).toHaveLength(120);
    expect(screen.getByText("120 of 120 characters")).toBeInTheDocument();
  });

  it.each([
    ["Body", "body", 16],
    ["Subheading", "subheading", 20],
    ["Heading", "heading", 40],
  ] as const)("the %s preset sets role %s and size %i", async (label, role, size) => {
    const user = userEvent.setup();
    render(<TextPanel id={HEADING_ID} />);
    await user.click(within(styleGroup()).getByRole("button", { name: label }));
    expect(heading()).toMatchObject({ role, size });
    expect(within(styleGroup()).getByRole("button", { name: label })).toHaveAttribute("aria-pressed", "true");
    expect(sizeSlider()).toHaveValue(String(size));
  });

  it("adjusts the size within 16–56 after a preset, keeping the role, and the preview follows", async () => {
    const user = userEvent.setup();
    const preview = renderWithPreview();
    await user.click(within(styleGroup()).getByRole("button", { name: "Body" }));
    expect(sizeSlider()).toHaveAttribute("min", "16");
    expect(sizeSlider()).toHaveAttribute("max", "56");

    fireEvent.change(sizeSlider(), { target: { value: "30" } });
    expect(heading()).toMatchObject({ role: "body", size: 30 });
    expect(sizeSlider()).toHaveAttribute("aria-valuetext", "30 px");
    expect(preview.getByText("FREE WIFI")).toHaveStyle({ fontSize: "30px" });

    // The slider can't go below 16px (T-043-text-size-floor-16.md).
    fireEvent.change(sizeSlider(), { target: { value: "12" } });
    expect(heading().size).toBe(16);
  });

  it("sets the colour from the hex input", async () => {
    const user = userEvent.setup();
    render(<TextPanel id={HEADING_ID} />);
    await user.clear(colourInput());
    await user.type(colourInput(), "#123abc{Enter}");
    expect(heading().colour).toBe("#123ABC");
  });

  it("shows no contrast rating: the customer judges readability themselves", () => {
    render(<TextPanel id={HEADING_ID} />);
    expect(screen.queryByText(/Easy to read|Hard to read|Check readability/)).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("labels every control with a tap target of at least 44px", () => {
    render(<TextPanel id={HEADING_ID} />);
    for (const el of [textArea(), sizeSlider(), colourInput(), ...within(styleGroup()).getAllByRole("button")]) {
      expect(el.className).toMatch(/min-h-11|h-11/);
    }
    expect(screen.getByRole("button", { name: "Open colour picker" })).toBeInTheDocument();
  });
});
