// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "@/lib/store";
import type { BackgroundSpec } from "@/lib/types";
import { SplashPage } from "@/splash/SplashPage";
import { TermsPanel } from "./TermsPanel";

// Sponsor: terms on, "I agree to the" / "terms of use", white text, version 1, over a photo.
beforeEach(() => {
  localStorage.clear();
  useStore.setState(useStore.getInitialState(), true);
  useStore.persist.clearStorage(); // drop the write the reset scheduled
});

const terms = () => useStore.getState().design.form.terms;
const labelInput = () => screen.getByRole("textbox", { name: "Before the link" });
const linkInput = () => screen.getByRole("textbox", { name: "Link text" });
const bodyInput = () => screen.getByRole("textbox", { name: "Terms text" });
const colourInput = () => screen.getByRole("textbox", { name: "Checkbox text colour" });
// The panel's own sample; the preview's terms row is the only other checkbox, and isn't disabled.
function sample() {
  const disabled = screen.getAllByRole("checkbox").filter((c) => c.hasAttribute("disabled"));
  expect(disabled).toHaveLength(1);
  return disabled[0];
}
const verdict = () => screen.getByRole("status");

function setBackground(background: BackgroundSpec) {
  expect(useStore.getState().updateBackground(background)).toBe(true);
}

// The editor preview reads the same store, so this shows what the customer sees as they edit.
function Preview() {
  const design = useStore((s) => s.design);
  return <SplashPage design={design} screen="landing" mode="preview" />;
}

/** Renders the panel beside a live preview, and returns the preview's terms row. */
function renderWithPreview() {
  const preview = document.createElement("div");
  document.body.appendChild(preview);
  render(<Preview />, { container: preview });
  render(<TermsPanel />);
  return () => within(preview).getByRole("checkbox").closest("label");
}

describe("TermsPanel", () => {
  it("shows the stored wording, sample, body, colour, version and marketing reminder", () => {
    render(<TermsPanel />);
    expect(labelInput()).toHaveValue("I agree to the");
    expect(labelInput()).toHaveAttribute("maxLength", "60");
    expect(linkInput()).toHaveValue("terms of use");
    expect(linkInput()).toHaveAttribute("maxLength", "30");
    expect(bodyInput()).toHaveValue(terms().body);
    expect(bodyInput()).toHaveAttribute("maxLength", "8000");
    expect(bodyInput()).toHaveAccessibleDescription(
      `${terms().body.length} of 8,000 Type or paste your terms. A blank line starts a new paragraph. They open inside the login page, because guests are not online yet and links to websites would not load.`,
    );
    expect(colourInput()).toHaveValue("#FFFFFF");
    expect(screen.getByText("How guests see it. The box always starts unticked.")).toBeInTheDocument();
    expect(screen.getByText("Version 1")).toBeInTheDocument();
    expect(screen.getByText(/Changing the text after you publish starts a new version/)).toBeInTheDocument();
    expect(
      screen.getByText("Collecting emails for marketing? That needs its own opt-in. It can't share this checkbox."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Terms are off/)).not.toBeInTheDocument();
  });

  it("shows the sample as an unticked, disabled checkbox with the stored wording", () => {
    render(<TermsPanel />);
    expect(sample()).toHaveAccessibleName("I agree to the terms of use");
    expect(sample()).not.toBeChecked();
    expect(sample()).toBeDisabled();
    expect(sample().closest("label")).toHaveStyle({ color: "#FFFFFF" });
  });

  it.each([
    ["Before the link", "label", "By connecting I accept the"],
    ["Link text", "linkText", "house rules"],
  ] as const)("%s updates the store, the preview row and the sample on each keystroke", async (name, key, typed) => {
    const previewRow = renderWithPreview();
    const user = userEvent.setup();
    const input = screen.getByRole("textbox", { name });
    await user.clear(input);
    await user.type(input, typed.slice(0, 2));
    expect(terms()[key]).toBe(typed.slice(0, 2));
    expect(previewRow()).toHaveTextContent(typed.slice(0, 2));
    await user.type(input, typed.slice(2));
    expect(terms()[key]).toBe(typed);
    expect(previewRow()).toHaveTextContent(typed);
    expect(sample().closest("label")).toHaveTextContent(typed);
  });

  it.each([
    ["Before the link", "label", "I agree to the"],
    ["Link text", "linkText", "terms of use"],
  ] as const)("emptying %s shows Required and keeps the stored value", async (name, key, stored) => {
    render(<TermsPanel />);
    const user = userEvent.setup();
    const input = screen.getByRole("textbox", { name });

    await user.clear(input);
    expect(screen.getByText("Required")).toHaveAttribute("role", "alert");
    expect(input).toHaveAccessibleDescription("Required");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(terms()[key]).toBe(stored);
    expect(sample()).toHaveAccessibleName("I agree to the terms of use"); // the sample shows what's stored

    await user.type(input, "x");
    expect(screen.queryByText("Required")).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(terms()[key]).toBe("x");
  });

  it("treats spaces-only wording as empty", () => {
    render(<TermsPanel />);
    fireEvent.change(linkInput(), { target: { value: "   " } });
    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(terms().linkText).toBe("terms of use");
  });

  it("edits the body in a plain textarea with a live counter, and keeps it while empty", async () => {
    render(<TermsPanel />);
    const user = userEvent.setup();
    expect(bodyInput().tagName).toBe("TEXTAREA"); // no rich text

    await user.clear(bodyInput());
    expect(screen.getByText("0 of 8,000")).toBeInTheDocument();
    expect(screen.getByText("Required")).toHaveAttribute("role", "alert");
    expect(bodyInput()).toHaveAttribute("aria-invalid", "true");
    expect(bodyInput()).toHaveAccessibleDescription(/Required$/);
    expect(terms().body).toBe(useStore.getInitialState().design.form.terms.body);

    await user.type(bodyInput(), "[[Who provides the WiFi]"); // "[[" types "["
    expect(terms().body).toBe("[Who provides the WiFi]");
    expect(screen.getByText("23 of 8,000")).toBeInTheDocument();
    expect(screen.queryByText("Required")).not.toBeInTheDocument();
  });

  it("stops the body at 8,000 characters, with thousands in the counter", async () => {
    render(<TermsPanel />);
    const user = userEvent.setup();
    await user.clear(bodyInput());
    await user.click(bodyInput());
    await user.paste("x".repeat(8001));
    expect(bodyInput()).toHaveValue("x".repeat(8000));
    expect(terms().body).toHaveLength(8000);
    expect(screen.getByText("8,000 of 8,000")).toBeInTheDocument();
  });

  it("turns a blank line into a new paragraph in the Terms sheet", async () => {
    render(<TermsPanel />);
    const user = userEvent.setup();
    await user.clear(bodyInput());
    await user.type(bodyInput(), "[[First part]{Enter}{Enter}[[Second part]");
    expect(terms().body).toBe("[First part]\n\n[Second part]");

    const { container } = render(<SplashPage design={useStore.getState().design} screen="terms" mode="preview" />);
    expect(within(container).getByText("[First part]").tagName).toBe("P");
    expect(within(container).getByText("[Second part]").tagName).toBe("P");
  });

  it("follows wording changed outside the panel, such as undo", () => {
    render(<TermsPanel />);
    fireEvent.change(labelInput(), { target: { value: "" } });
    act(() => {
      useStore.getState().updateForm({ terms: { label: "I accept the", body: "[New terms]" } });
    });
    expect(labelInput()).toHaveValue("I accept the");
    expect(bodyInput()).toHaveValue("[New terms]");
    expect(screen.queryByText("Required")).not.toBeInTheDocument();
  });

  it("sets the checkbox text colour, shown in the preview row and the sample", async () => {
    const previewRow = renderWithPreview();
    const user = userEvent.setup();
    await user.clear(colourInput());
    await user.type(colourInput(), "#123456{Enter}");
    expect(terms().textColour).toBe("#123456");
    expect(previewRow()).toHaveStyle({ color: "#123456" });
    expect(sample().closest("label")).toHaveStyle({ color: "#123456" });
  });

  it("never rates contrast over a photo", () => {
    render(<TermsPanel />);
    expect(verdict()).toHaveTextContent("Check readability over your photo");
    expect(screen.queryByText(/:1/)).not.toBeInTheDocument();
  });

  it("rates the checkbox text against the background, needing 4.5:1", () => {
    setBackground({ type: "colour", colour: "#0F2A44" });
    render(<TermsPanel />);
    expect(verdict()).toHaveTextContent("Easy to read");
    expect(verdict().parentElement).toHaveTextContent(/^Easy to read: \d+\.\d:1 on the background$/);

    // White on a mid grey is 4.48:1, just short of 4.5:1.
    act(() => {
      setBackground({ type: "colour", colour: "#777777" });
    });
    expect(verdict()).toHaveTextContent("Hard to read");
    expect(verdict().parentElement).toHaveTextContent("Hard to read: 4.4:1, needs 4.5:1");
  });

  it.each([
    ["#000000", "#FFFFFF"],
    ["#FFFFFF", "#000000"],
  ])("checks both ends of a gradient from %s to %s", (from, to) => {
    setBackground({ type: "gradient", from, to, direction: "down" });
    render(<TermsPanel />);
    expect(verdict().parentElement).toHaveTextContent("Hard to read: 1.0:1, needs 4.5:1");
  });

  it("keeps the wording editable and explains how to show it when terms are off", async () => {
    useStore.getState().updateForm({ terms: { mode: "off" } });
    render(<TermsPanel />);
    expect(screen.getByText("Terms are off. Turn them on with the switch above to show the checkbox.")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.type(linkInput(), "!");
    expect(terms().linkText).toBe("terms of use!");
  });

  it("reaches every control by keyboard, in order, skipping the sample", async () => {
    render(<TermsPanel />);
    const user = userEvent.setup();
    const expectNext = async (control: HTMLElement) => {
      await user.tab();
      expect(control).toHaveFocus();
    };

    await expectNext(labelInput());
    await expectNext(linkInput());
    await expectNext(bodyInput());
    await expectNext(screen.getByRole("button", { name: "Open colour picker" }));
    await expectNext(colourInput());
    const suggestions = within(screen.getByRole("group", { name: "In this design" })).getAllByRole("button");
    expect(suggestions.length).toBeGreaterThan(0);
    for (const suggestion of suggestions) await expectNext(suggestion);

    await user.tab(); // past the last control
    expect(document.body).toHaveFocus();
  });
});
