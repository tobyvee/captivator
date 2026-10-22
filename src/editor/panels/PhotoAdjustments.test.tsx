// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStore } from "@/lib/store";
import type { BackgroundSpec, ImageBackground } from "@/lib/types";
import { FocusGrid } from "./FocusGrid";
import { PhotoAdjustments } from "./PhotoAdjustments";

const PHOTO: ImageBackground = {
  type: "image",
  src: `data:image/webp;base64,${"A".repeat(40960)}`, // 40 KB of the page as base64
  fit: "fill",
  zoom: 1.15,
  focus: { x: 50, y: 50 },
  backdrop: "#223344",
  overlay: { from: "#000000", to: "#111111", opacity: 0.55 },
};

beforeEach(() => {
  localStorage.clear();
  useStore.setState(useStore.getInitialState(), true);
  useStore.persist.clearStorage(); // drop the write the reset scheduled
});

const setBackground = (bg: BackgroundSpec) => act(() => void useStore.getState().updateBackground(bg));
const photo = () => {
  const bg = useStore.getState().design.background;
  if (bg.type !== "image") throw new Error("background is not a photo");
  return bg;
};
const button = (name: string) => screen.getByRole("button", { name });
const pressedFocus = () =>
  within(screen.getByRole("group", { name: "Focus point" }))
    .getAllByRole("button")
    .filter((b) => b.getAttribute("aria-pressed") === "true")
    .map((b) => b.getAttribute("aria-label"));

describe("PhotoAdjustments", () => {
  it("renders nothing unless the background is a photo", () => {
    setBackground({ type: "colour", colour: "#123456" });
    const { container } = render(<PhotoAdjustments />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows Fill screen with a Zoom slider and no backdrop colour for a filled photo", () => {
    setBackground(PHOTO);
    render(<PhotoAdjustments />);
    expect(button("Fill screen")).toHaveAttribute("aria-pressed", "true");
    expect(button("Show whole photo")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("slider", { name: "Zoom" })).toHaveAttribute("aria-valuetext", "115%");
    expect(screen.queryByRole("textbox", { name: "Colour around the photo" })).not.toBeInTheDocument();
    expect(
      screen.getByText("Show whole photo leaves space around it; you then pick the colour of that space."),
    ).toBeInTheDocument();
  });

  it("switches to Show whole photo, which swaps Zoom for the backdrop colour and keeps the rest", async () => {
    setBackground(PHOTO);
    render(<PhotoAdjustments />);
    await userEvent.setup().click(button("Show whole photo"));
    expect(photo()).toEqual({ ...PHOTO, fit: "fit" });
    expect(screen.queryByRole("slider", { name: "Zoom" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Colour around the photo" })).toHaveValue("#223344");
  });

  it("edits the backdrop colour of a whole photo", () => {
    setBackground({ ...PHOTO, fit: "fit" });
    render(<PhotoAdjustments />);
    const hex = screen.getByRole("textbox", { name: "Colour around the photo" });
    fireEvent.focus(hex);
    fireEvent.change(hex, { target: { value: "#abcdef" } });
    fireEvent.blur(hex);
    expect(photo().backdrop).toBe("#ABCDEF");
  });

  it("maps the Zoom slider's 100–200% to a zoom of 1–2", () => {
    setBackground(PHOTO);
    render(<PhotoAdjustments />);
    const zoom = screen.getByRole("slider", { name: "Zoom" });
    expect(zoom).toHaveAttribute("min", "100");
    expect(zoom).toHaveAttribute("max", "200");
    fireEvent.change(zoom, { target: { value: "175" } });
    expect(photo().zoom).toBe(1.75);
    fireEvent.change(zoom, { target: { value: "200" } });
    expect(photo().zoom).toBe(2);
    expect(photo().focus).toEqual(PHOTO.focus);
  });

  it("moves the focus point to the preset that is tapped", async () => {
    setBackground(PHOTO);
    render(<PhotoAdjustments />);
    expect(pressedFocus()).toEqual(["Focus centre"]);
    await userEvent.setup().click(button("Focus bottom right"));
    expect(photo().focus).toEqual({ x: 100, y: 100 });
    expect(pressedFocus()).toEqual(["Focus bottom right"]);
    expect(screen.getByRole("group", { name: "Focus point" })).toHaveAccessibleDescription(
      "Tap the part of the photo that must stay visible on every screen.",
    );
  });

  it("maps the darken slider's 0–85% to the overlay opacity, keeping its colours", () => {
    setBackground(PHOTO);
    render(<PhotoAdjustments />);
    const darken = screen.getByRole("slider", { name: "Darken for readability" });
    expect(darken).toHaveAttribute("aria-valuetext", "55%");
    expect(darken).toHaveAttribute("max", "85");
    fireEvent.change(darken, { target: { value: "85" } });
    expect(photo().overlay).toEqual({ from: "#000000", to: "#111111", opacity: 0.85 });
    fireEvent.change(darken, { target: { value: "0" } });
    expect(photo().overlay).toEqual({ from: "#000000", to: "#111111", opacity: 0 });
  });

  it("creates a black overlay when the photo has none", () => {
    setBackground({ ...PHOTO, overlay: null });
    render(<PhotoAdjustments />);
    const darken = screen.getByRole("slider", { name: "Darken for readability" });
    expect(darken).toHaveAttribute("aria-valuetext", "0%");
    fireEvent.change(darken, { target: { value: "40" } });
    expect(photo().overlay).toEqual({ from: "#000000", to: "#000000", opacity: 0.4 });
  });

  it("shows an uploaded photo's share of the budget", () => {
    setBackground(PHOTO);
    render(<PhotoAdjustments />);
    expect(screen.getByText("Photo is 40 KB of your budget")).toBeInTheDocument();
  });

  it("shows no budget note for a template or https photo", () => {
    setBackground({ ...PHOTO, src: "/templates/sponsor.jpg" });
    const { rerender } = render(<PhotoAdjustments />);
    expect(screen.queryByText(/of your budget/)).not.toBeInTheDocument();
    setBackground({ ...PHOTO, src: "https://images.unsplash.com/photo-1" });
    rerender(<PhotoAdjustments />);
    expect(screen.queryByText(/of your budget/)).not.toBeInTheDocument();
  });
});

describe("FocusGrid", () => {
  const LABELS = [
    "Focus top left",
    "Focus top centre",
    "Focus top right",
    "Focus middle left",
    "Focus centre",
    "Focus middle right",
    "Focus bottom left",
    "Focus bottom centre",
    "Focus bottom right",
  ];

  it("renders nine preset buttons in reading order, each calling onChange with its point", async () => {
    const onChange = vi.fn();
    render(<FocusGrid value={{ x: 50, y: 50 }} onChange={onChange} />);
    const buttons = within(screen.getByRole("group", { name: "Focus point" })).getAllByRole("button");
    expect(buttons.map((b) => b.getAttribute("aria-label"))).toEqual(LABELS);
    const user = userEvent.setup();
    for (const b of buttons) await user.click(b);
    expect(onChange.mock.calls.map(([v]) => v)).toEqual(
      [0, 50, 100].flatMap((y) => [0, 50, 100].map((x) => ({ x, y }))),
    );
  });

  it.each([
    [{ x: 20, y: 80 }, "Focus bottom left"],
    [{ x: 76, y: 24 }, "Focus top right"],
    [{ x: 50, y: 0 }, "Focus top centre"],
    [{ x: 100, y: 50 }, "Focus middle right"],
  ])("presses only the preset nearest %o", (value, label) => {
    render(<FocusGrid value={value} onChange={vi.fn()} />);
    expect(pressedFocus()).toEqual([label]);
  });
});
