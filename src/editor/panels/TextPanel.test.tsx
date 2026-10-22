// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "@/lib/store";
import type { BackgroundSpec, TextBlockSpec } from "@/lib/types";
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
const verdict = () => screen.getByRole("status");

function setBackground(background: BackgroundSpec) {
  expect(useStore.getState().updateBackground(background)).toBe(true);
}

function setHeading(patch: Partial<TextBlockSpec>) {
  expect(useStore.getState().updateBlock(HEADING_ID, patch)).toBe(true);
}

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
    expect(sizeSlider()).toHaveValue("36");
    expect(sizeSlider()).toHaveAttribute("aria-valuetext", "36 px");
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

  it("adjusts the size within 12–56 after a preset, keeping the role, and the preview follows", async () => {
    const user = userEvent.setup();
    const preview = renderWithPreview();
    await user.click(within(styleGroup()).getByRole("button", { name: "Body" }));
    expect(sizeSlider()).toHaveAttribute("min", "12");
    expect(sizeSlider()).toHaveAttribute("max", "56");

    fireEvent.change(sizeSlider(), { target: { value: "30" } });
    expect(heading()).toMatchObject({ role: "body", size: 30 });
    expect(sizeSlider()).toHaveAttribute("aria-valuetext", "30 px");
    expect(preview.getByText("FREE WIFI")).toHaveStyle({ fontSize: "30px" });
  });

  it("sets the colour from the hex input", async () => {
    const user = userEvent.setup();
    render(<TextPanel id={HEADING_ID} />);
    await user.clear(colourInput());
    await user.type(colourInput(), "#123abc{Enter}");
    expect(heading().colour).toBe("#123ABC");
  });

  it("asks to check readability over a photo instead of claiming a pass", () => {
    render(<TextPanel id={HEADING_ID} />);
    expect(verdict()).toHaveTextContent("Check readability over your photo");
    expect(screen.queryByText(/against the background/)).not.toBeInTheDocument();
  });

  it("shows white text on a white background as hard to read", () => {
    setBackground({ type: "colour", colour: "#FFFFFF" });
    setHeading({ colour: "#FFFFFF" });
    render(<TextPanel id={HEADING_ID} />);
    expect(verdict()).toHaveTextContent("Hard to read");
    // A 36px heading is large text, so it needs 3:1.
    expect(screen.getByText("1.0:1, needs 3:1.")).toBeInTheDocument();
  });

  it("passes on a plain colour without mentioning a gradient", () => {
    setBackground({ type: "colour", colour: "#FFFFFF" });
    setHeading({ colour: "#000000" });
    render(<TextPanel id={HEADING_ID} />);
    expect(verdict()).toHaveTextContent("Easy to read");
    expect(screen.getByText("21.0:1 against the background.")).toBeInTheDocument();
  });

  it("checks both ends of a gradient and reports the worse one", () => {
    setBackground({ type: "gradient", from: "#000000", to: "#0F2A44", direction: "down" });
    setHeading({ colour: "#FFFFFF" });
    render(<TextPanel id={HEADING_ID} />);
    expect(verdict()).toHaveTextContent("Easy to read");
    // White on #0F2A44 is the worse stop (about 14.3:1), not white on black (21:1).
    expect(screen.getByText(/^14\.\d:1 against the background\. Checked at both ends of the gradient\.$/)).toBeInTheDocument();
  });

  it("uses the role's weight: #777777 on white passes as a 20px heading but not as a 20px subheading", async () => {
    const user = userEvent.setup();
    setBackground({ type: "colour", colour: "#FFFFFF" });
    setHeading({ colour: "#777777" });
    render(<TextPanel id={HEADING_ID} />);
    fireEvent.change(sizeSlider(), { target: { value: "20" } });
    expect(verdict()).toHaveTextContent("Easy to read"); // 800 weight from 18.66px is large text

    await user.click(within(styleGroup()).getByRole("button", { name: "Subheading" }));
    expect(heading()).toMatchObject({ role: "subheading", size: 20 });
    expect(verdict()).toHaveTextContent("Hard to read");
    expect(screen.getByText("4.4:1, needs 4.5:1.")).toBeInTheDocument();
  });

  it("updates the verdict in place when the colour changes", async () => {
    const user = userEvent.setup();
    setBackground({ type: "colour", colour: "#FFFFFF" });
    setHeading({ colour: "#000000" });
    render(<TextPanel id={HEADING_ID} />);
    const status = verdict();
    await user.clear(colourInput());
    await user.type(colourInput(), "#FFFFFF{Enter}");
    // The same live region, so assistive tech announces the change.
    expect(verdict()).toBe(status);
    expect(status).toHaveTextContent("Hard to read");
  });

  it("labels every control with a tap target of at least 44px", () => {
    render(<TextPanel id={HEADING_ID} />);
    for (const el of [textArea(), sizeSlider(), colourInput(), ...within(styleGroup()).getAllByRole("button")]) {
      expect(el.className).toMatch(/min-h-11|h-11/);
    }
    expect(screen.getByRole("button", { name: "Open colour picker" })).toBeInTheDocument();
  });
});
