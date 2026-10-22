// @vitest-environment jsdom
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "@/lib/store";
import { SplashPage } from "@/splash/SplashPage";
import { FieldsPanel } from "./FieldsPanel";

const LIMIT_NOTE = "Up to two fields. Untick one to choose another.";
const NONE_NOTE = "No fields: guests just tap Connect.";

beforeEach(() => {
  localStorage.clear();
  useStore.setState(useStore.getInitialState(), true);
  useStore.persist.clearStorage(); // drop the write the reset scheduled
});

const form = () => useStore.getState().design.form;
const box = (name: string) => screen.getByRole("checkbox", { name });
const setFields = (fields: ("name" | "email" | "phone")[]) =>
  act(() => {
    useStore.getState().updateForm({ fields });
  });
/** The guest inputs the preview renders, in page order, by their accessible names. */
const previewFields = () => {
  const { container, unmount } = render(
    <SplashPage design={useStore.getState().design} screen="landing" mode="preview" />,
  );
  const names = Array.from(container.querySelectorAll("input:not([type=checkbox])")).map((i) =>
    i.getAttribute("aria-label"),
  );
  unmount();
  return names;
};

describe("FieldsPanel", () => {
  it("shows the stored fields ticked, in a group named Fields", () => {
    render(<FieldsPanel />); // Sponsor: Name, Email
    const group = screen.getByRole("group", { name: "Fields" });
    expect(within(group).getAllByRole("checkbox")).toHaveLength(3);
    expect(box("Name")).toBeChecked();
    expect(box("Email")).toBeChecked();
    expect(box("Phone")).not.toBeChecked();
  });

  it("disables the third box once two are ticked, and explains why", async () => {
    render(<FieldsPanel />);
    expect(box("Phone")).toBeDisabled();
    expect(box("Phone")).toHaveAccessibleDescription(LIMIT_NOTE);
    expect(screen.getByRole("status")).toHaveTextContent(LIMIT_NOTE);

    await userEvent.setup().click(box("Phone"));
    expect(form().fields).toEqual(["name", "email"]);
  });

  it("unticking re-enables the third box and removes the field", async () => {
    render(<FieldsPanel />);
    await userEvent.setup().click(box("Name"));
    expect(form().fields).toEqual(["email"]);
    expect(box("Phone")).toBeEnabled();
    expect(box("Phone")).not.toHaveAttribute("aria-describedby");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("adds fields in tick order, and the preview follows that order", async () => {
    setFields([]);
    render(<FieldsPanel />);
    const user = userEvent.setup();

    await user.click(box("Phone"));
    await user.click(box("Name"));
    expect(form().fields).toEqual(["phone", "name"]);
    expect(previewFields()).toEqual(["Phone", "Name"]);
    expect(box("Email")).toBeDisabled();
  });

  it("says guests just tap Connect when no field is ticked", async () => {
    setFields(["email"]);
    render(<FieldsPanel />);
    expect(screen.queryByText(NONE_NOTE)).not.toBeInTheDocument();

    await userEvent.setup().click(box("Email"));
    expect(form().fields).toEqual([]);
    expect(screen.getByRole("status")).toHaveTextContent(NONE_NOTE);
    expect(previewFields()).toEqual([]);
  });

  it("is reachable by keyboard: Space ticks the focused box", async () => {
    setFields([]);
    render(<FieldsPanel />);
    const user = userEvent.setup();
    await user.tab();
    expect(box("Name")).toHaveFocus();
    await user.keyboard(" ");
    expect(form().fields).toEqual(["name"]);
  });

  it("follows a field change made outside the panel, such as undo", () => {
    render(<FieldsPanel />);
    setFields(["phone"]);
    expect(box("Phone")).toBeChecked();
    expect(box("Name")).not.toBeChecked();
    expect(box("Email")).toBeEnabled();
  });

  it.each([
    ["Input background", "inputBg", "backgroundColor"],
    ["Input text", "inputText", "color"],
  ] as const)("%s sets %s and shows in the preview", async (label, key, style) => {
    render(<FieldsPanel />);
    const user = userEvent.setup();
    const hex = screen.getByRole("textbox", { name: label });
    await user.clear(hex);
    await user.type(hex, "#123456{Enter}");
    expect(form()[key]).toBe("#123456");

    const preview = render(<SplashPage design={useStore.getState().design} screen="landing" mode="preview" />);
    expect(within(preview.container).getByRole("textbox", { name: "Name" })).toHaveStyle({ [style]: "#123456" });
  });
});
