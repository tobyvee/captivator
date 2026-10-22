// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Slider } from "./Slider";

describe("Slider", () => {
  it("renders a labelled range input with min, max and step", () => {
    render(<Slider label="Size" value={24} min={12} max={56} step={2} unit="px" onChange={vi.fn()} />);
    const slider = screen.getByRole("slider", { name: "Size" });
    expect(slider).toHaveAttribute("type", "range");
    expect(slider).toHaveAttribute("min", "12");
    expect(slider).toHaveAttribute("max", "56");
    expect(slider).toHaveAttribute("step", "2");
    expect(slider).toHaveValue("24");
  });

  it("defaults step to 1", () => {
    render(<Slider label="Zoom" value={5} min={0} max={10} onChange={vi.fn()} />);
    expect(screen.getByRole("slider", { name: "Zoom" })).toHaveAttribute("step", "1");
  });

  it("shows the value with its unit and exposes the same text as aria-valuetext", () => {
    render(<Slider label="Size" value={24} min={12} max={56} unit="px" onChange={vi.fn()} />);
    expect(screen.getByText("24px")).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Size" })).toHaveAttribute("aria-valuetext", "24px");
  });

  it("shows the bare value when there is no unit", () => {
    render(<Slider label="Count" value={3} min={0} max={10} onChange={vi.fn()} />);
    expect(screen.getByRole("slider", { name: "Count" })).toHaveAttribute("aria-valuetext", "3");
  });

  it("uses format over the unit for both the shown value and aria-valuetext", () => {
    render(
      <Slider
        label="Overlay"
        value={0.4}
        min={0}
        max={0.85}
        step={0.05}
        unit="px"
        format={(v) => `${Math.round(v * 100)}%`}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Overlay" })).toHaveAttribute("aria-valuetext", "40%");
  });

  it("calls onChange with a number", () => {
    const onChange = vi.fn();
    render(<Slider label="Size" value={24} min={12} max={56} unit="px" onChange={onChange} />);
    fireEvent.change(screen.getByRole("slider", { name: "Size" }), { target: { value: "30" } });
    expect(onChange).toHaveBeenCalledExactlyOnceWith(30);
    expect(typeof onChange.mock.calls[0][0]).toBe("number");
  });

  it("updates the shown value and aria-valuetext when the value prop changes", () => {
    const { rerender } = render(<Slider label="Size" value={24} min={12} max={56} unit="px" onChange={vi.fn()} />);
    rerender(<Slider label="Size" value={32} min={12} max={56} unit="px" onChange={vi.fn()} />);
    expect(screen.getByText("32px")).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Size" })).toHaveAttribute("aria-valuetext", "32px");
  });
});
