// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "@/lib/store";
import { SplashPage } from "@/splash/SplashPage";
import { ButtonPanel } from "./ButtonPanel";

beforeEach(() => {
  localStorage.clear();
  useStore.setState(useStore.getInitialState(), true);
  useStore.persist.clearStorage(); // drop the write the reset scheduled
});

const button = () => useStore.getState().design.form.button;
const labelInput = () => screen.getByRole("textbox", { name: "Label" });
const styleGroup = () => screen.getByRole("group", { name: "Style" });
/** The Connect button as the preview renders it. */
const previewConnect = () => {
  const { container } = render(<SplashPage design={useStore.getState().design} screen="landing" mode="preview" />);
  return within(container).getByRole("button", { name: button().label });
};

describe("ButtonPanel", () => {
  it("shows the stored label with its counter, colours and style", () => {
    render(<ButtonPanel />); // Sponsor: CONNECT, orange with dark text, solid
    expect(labelInput()).toHaveValue("CONNECT");
    expect(labelInput()).toHaveAttribute("maxLength", "24");
    expect(labelInput()).toHaveAccessibleDescription("7 of 24");
    expect(screen.getByRole("textbox", { name: "Button colour" })).toHaveValue("#F97316");
    expect(screen.getByRole("textbox", { name: "Text colour" })).toHaveValue("#111111");
    expect(within(styleGroup()).getByRole("button", { name: "Solid" })).toHaveAttribute("aria-pressed", "true");
  });

  it("saves the label as typed, counts it and stops at 24 characters", async () => {
    render(<ButtonPanel />);
    const user = userEvent.setup();
    await user.clear(labelInput());
    await user.type(labelInput(), "Get online");
    expect(button().label).toBe("Get online");
    expect(screen.getByText("10 of 24")).toBeInTheDocument();
    expect(previewConnect()).toHaveTextContent("Get online");

    await user.type(labelInput(), " with free WiFi today!!");
    expect(labelInput()).toHaveValue("Get online with free WiF"); // typing stops at 24
    expect(button().label).toBe("Get online with free WiF");
    expect(screen.getByText("24 of 24")).toBeInTheDocument();
  });

  it("shows Required and keeps the stored label while the input is empty", async () => {
    render(<ButtonPanel />);
    const user = userEvent.setup();

    await user.clear(labelInput());
    expect(screen.getByText("Required")).toHaveAttribute("role", "alert");
    expect(labelInput()).toHaveAccessibleDescription(/Required/);
    expect(labelInput()).toHaveAttribute("aria-invalid", "true");
    expect(button().label).toBe("CONNECT");
    expect(screen.getByText("0 of 24")).toBeInTheDocument();

    await user.type(labelInput(), "Go");
    expect(screen.queryByText("Required")).not.toBeInTheDocument();
    expect(labelInput()).not.toHaveAttribute("aria-invalid");
    expect(button().label).toBe("Go");
  });

  it("treats a spaces-only label as empty", () => {
    render(<ButtonPanel />);
    fireEvent.change(labelInput(), { target: { value: "   " } });
    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(button().label).toBe("CONNECT");
  });

  it("follows a label change made outside the panel, such as undo", () => {
    render(<ButtonPanel />);
    fireEvent.change(labelInput(), { target: { value: "" } });
    act(() => {
      useStore.getState().updateForm({ button: { label: "Join" } });
    });
    expect(labelInput()).toHaveValue("Join");
    expect(screen.queryByText("Required")).not.toBeInTheDocument();
  });

  it.each([
    ["Button colour", "bg", "backgroundColor"],
    ["Text colour", "fg", "color"],
  ] as const)("%s sets %s and shows in the preview", async (label, key, style) => {
    render(<ButtonPanel />);
    const user = userEvent.setup();
    const hex = screen.getByRole("textbox", { name: label });
    await user.clear(hex);
    await user.type(hex, "#123456{Enter}");
    expect(button()[key]).toBe("#123456");
    expect(previewConnect()).toHaveStyle({ [style]: "#123456" });
  });

  it("switches between Solid and Outline, with the button colour as the outline's border", async () => {
    render(<ButtonPanel />);
    const user = userEvent.setup();

    await user.click(within(styleGroup()).getByRole("button", { name: "Outline" }));
    expect(button().variant).toBe("outline");
    expect(within(styleGroup()).getByRole("button", { name: "Outline" })).toHaveAttribute("aria-pressed", "true");
    expect(previewConnect()).toHaveStyle({ border: "2px solid #F97316", color: "#111111" });

    await user.click(within(styleGroup()).getByRole("button", { name: "Solid" }));
    expect(button().variant).toBe("solid");
  });

  it("reaches every control by keyboard, in order", async () => {
    render(<ButtonPanel />);
    const user = userEvent.setup();
    await user.tab();
    expect(labelInput()).toHaveFocus();
    await user.tab(); // Button colour swatch
    await user.tab(); // its hex input
    expect(screen.getByRole("textbox", { name: "Button colour" })).toHaveFocus();
  });
});
