// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  // jsdom has no pointer capture; the dot only needs the call to succeed.
  HTMLElement.prototype.setPointerCapture = vi.fn();
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
const dot = () => screen.getByRole("button", { name: /^Focus point, / });

// The dot travels over its parent, the box inset by the dot's radius: here 200×100px at (10, 20).
const stubTrack = () =>
  vi.spyOn(dot().parentElement!, "getBoundingClientRect").mockReturnValue(new DOMRect(10, 20, 200, 100));
const pointer = (type: "pointerDown" | "pointerMove" | "pointerUp", clientX: number, clientY: number) =>
  fireEvent[type](dot(), { pointerId: 1, button: 0, clientX, clientY });
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
    expect(dot()).toHaveAccessibleName("Focus point, 100% across, 100% down");
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

  describe("dragging the focus dot", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("moves the focus live and makes one undo step of a long drag", () => {
      setBackground(PHOTO);
      render(<PhotoAdjustments />);
      stubTrack();
      vi.advanceTimersByTime(1000); // the photo's own step is past
      useStore.temporal.getState().clear();

      pointer("pointerDown", 110, 70);
      for (let i = 1; i <= 20; i++) {
        vi.advanceTimersByTime(100); // 2 seconds in all: a throttle would make several steps
        pointer("pointerMove", 110 - i * 4, 70 + i);
        expect(photo().focus).toEqual({ x: 50 - i * 2, y: 50 + i });
        expect(dot()).toHaveAccessibleName(`Focus point, ${50 - i * 2}% across, ${50 + i}% down`);
      }
      pointer("pointerUp", 30, 90);

      expect(useStore.temporal.getState().pastStates).toHaveLength(1);
      act(() => useStore.temporal.getState().undo());
      expect(photo().focus).toEqual(PHOTO.focus);
    });
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

  it("draws the dot at the exact focus point, described by the drag help line", () => {
    render(<FocusGrid value={{ x: 37, y: 62 }} onChange={vi.fn()} />);
    expect(dot()).toHaveAccessibleName("Focus point, 37% across, 62% down");
    expect(dot()).toHaveStyle({ left: "37%", top: "62%" });
    expect(dot()).toHaveAccessibleDescription("Drag the dot for fine control, or tap a square.");
  });

  it("drags the dot with rounded percentages, clamped to the photo, until the pointer lifts", () => {
    const onChange = vi.fn();
    render(<FocusGrid value={{ x: 50, y: 50 }} onChange={onChange} />);
    stubTrack();
    pointer("pointerDown", 110, 70);
    expect(HTMLElement.prototype.setPointerCapture).toHaveBeenCalledWith(1);
    expect(onChange).not.toHaveBeenCalled();

    pointer("pointerMove", 10 + 200 * 0.333, 20 + 100 * 0.756);
    pointer("pointerMove", -40, 500); // past the left edge and the bottom
    pointer("pointerMove", 110, 70); // back on the current point: no change to report
    expect(onChange.mock.calls.map(([v]) => v)).toEqual([
      { x: 33, y: 76 },
      { x: 0, y: 100 },
    ]);

    pointer("pointerUp", 110, 70);
    pointer("pointerMove", 210, 120);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("ignores pointer moves that didn't start on the dot with the main button", () => {
    const onChange = vi.fn();
    render(<FocusGrid value={{ x: 50, y: 50 }} onChange={onChange} />);
    stubTrack();
    pointer("pointerMove", 10, 20);
    fireEvent.pointerDown(dot(), { pointerId: 1, button: 2, clientX: 110, clientY: 70 }); // right button
    pointer("pointerMove", 10, 20);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("moves the dot 5% per arrow key, clamped at the edges, and announces where it is", async () => {
    const onChange = vi.fn();
    const { rerender } = render(<FocusGrid value={{ x: 50, y: 50 }} onChange={onChange} />);
    const status = screen.getByRole("status");
    expect(status).toBeEmptyDOMElement();

    const user = userEvent.setup();
    act(() => dot().focus());
    for (const [key, x, y] of [
      ["{ArrowLeft}", 45, 50],
      ["{ArrowRight}", 55, 50],
      ["{ArrowUp}", 50, 45],
      ["{ArrowDown}", 50, 55],
    ] as const) {
      await user.keyboard(key);
      expect(onChange).toHaveBeenLastCalledWith({ x, y });
      expect(status).toHaveTextContent(`Focus point, ${x}% across, ${y}% down`);
    }

    rerender(<FocusGrid value={{ x: 98, y: 2 }} onChange={onChange} />);
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith({ x: 100, y: 2 });
    await user.keyboard("{ArrowUp}");
    expect(onChange).toHaveBeenLastCalledWith({ x: 98, y: 0 });

    rerender(<FocusGrid value={{ x: 100, y: 0 }} onChange={onChange} />);
    onChange.mockClear();
    await user.keyboard("{ArrowRight}{ArrowUp}");
    expect(onChange).not.toHaveBeenCalled(); // already at the corner
    expect(status).toHaveTextContent("Focus point, 100% across, 0% down");

    await user.click(button("Focus centre"));
    expect(status).toBeEmptyDOMElement();
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
