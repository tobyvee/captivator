// @vitest-environment jsdom
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "@/lib/store";
import type { FieldKindSpec } from "@/lib/types";
import { ScreenSwitcher } from "./ScreenSwitcher";

beforeEach(() => {
  localStorage.clear();
  useStore.setState(useStore.getInitialState(), true);
  useStore.persist.clearStorage(); // drop the write the reset scheduled
});

const state = () => useStore.getState();
const group = () => screen.getByRole("group", { name: "Preview screen" });
const labels = () => within(group()).getAllByRole("button").map((b) => b.textContent);
const pressed = () =>
  within(group())
    .getAllByRole("button")
    .filter((b) => b.getAttribute("aria-pressed") === "true")
    .map((b) => b.textContent);

function setForm(fields: FieldKindSpec[], terms: "off" | "checkbox") {
  act(() => {
    state().updateForm({ fields, terms: { mode: terms } });
  });
}

describe("ScreenSwitcher", () => {
  it("offers all four screens in order while something can fail and terms are on", () => {
    setForm(["name", "email"], "checkbox");
    render(<ScreenSwitcher />);
    expect(labels()).toEqual(["Landing", "Terms", "Error", "Connected"]);
    expect(pressed()).toEqual(["Landing"]);
  });

  it("offers Error for fields alone, and hides it when nothing can fail", () => {
    setForm(["email"], "off");
    render(<ScreenSwitcher />);
    expect(labels()).toEqual(["Landing", "Error", "Connected"]);

    setForm([], "off");
    expect(labels()).toEqual(["Landing", "Connected"]);
  });

  it("switches to Error and Connected with exactly one segment pressed", async () => {
    const user = userEvent.setup();
    setForm(["email"], "checkbox");
    render(<ScreenSwitcher />);

    await user.click(within(group()).getByRole("button", { name: "Error" }));
    expect(state().screen).toBe("error");
    expect(pressed()).toEqual(["Error"]);

    await user.click(within(group()).getByRole("button", { name: "Connected" }));
    expect(state().screen).toBe("connected");
    expect(pressed()).toEqual(["Connected"]);
  });

  it("falls back to Landing, still pressed, when Error goes away while it is shown", async () => {
    const user = userEvent.setup();
    setForm(["email"], "off");
    render(<ScreenSwitcher />);
    await user.click(within(group()).getByRole("button", { name: "Error" }));

    setForm([], "off");
    expect(state().screen).toBe("landing");
    expect(pressed()).toEqual(["Landing"]);
  });
});
