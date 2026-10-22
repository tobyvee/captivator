// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "@/lib/store";
import { SPONSOR } from "@/lib/templates";
import { UndoRedo } from "./UndoRedo";

const NEW_BG = { type: "colour", colour: "#123456" } as const;

const undoButton = () => screen.getByRole("button", { name: "Undo" });
const redoButton = () => screen.getByRole("button", { name: "Redo" });
const background = () => useStore.getState().design.background;
const changeDesign = () => act(() => void useStore.getState().updateBackground(NEW_BG));

function Harness() {
  return (
    <>
      <UndoRedo />
      <input type="text" aria-label="Design name" />
      <textarea aria-label="Terms body" />
      <div contentEditable suppressContentEditableWarning aria-label="Rich text">
        <span>text</span>
      </div>
      <input type="range" aria-label="Darken" />
    </>
  );
}

beforeEach(() => {
  localStorage.clear();
  useStore.setState(useStore.getInitialState(), true);
  useStore.persist.clearStorage();
  useStore.temporal.getState().clear();
});

describe("UndoRedo buttons", () => {
  it("carries the labels and shortcut hints", () => {
    render(<UndoRedo />);
    expect(undoButton()).toHaveAttribute("title", "Undo (Cmd+Z or Ctrl+Z)");
    expect(redoButton()).toHaveAttribute("title", "Redo (Shift+Cmd+Z or Ctrl+Y)");
  });

  it("are disabled while history is empty", () => {
    render(<UndoRedo />);
    expect(undoButton()).toBeDisabled();
    expect(redoButton()).toBeDisabled();
  });

  it("undo and redo a design change, enabling each as history allows", async () => {
    const user = userEvent.setup();
    render(<UndoRedo />);
    changeDesign();
    expect(undoButton()).toBeEnabled();
    expect(redoButton()).toBeDisabled();

    await user.click(undoButton());
    expect(background()).toBe(SPONSOR.design.background);
    expect(undoButton()).toBeDisabled();
    expect(redoButton()).toBeEnabled();

    await user.click(redoButton());
    expect(background()).toEqual(NEW_BG);
    expect(undoButton()).toBeEnabled();
    expect(redoButton()).toBeDisabled();
  });
});

describe("UndoRedo shortcuts", () => {
  it.each([
    ["Cmd+Z", "{Meta>}z{/Meta}"],
    ["Ctrl+Z", "{Control>}z{/Control}"],
  ])("%s undoes the design", async (_name, keys) => {
    const user = userEvent.setup();
    render(<UndoRedo />);
    changeDesign();
    await user.keyboard(keys);
    expect(background()).toBe(SPONSOR.design.background);
  });

  it.each([
    ["Shift+Cmd+Z", "{Shift>}{Meta>}z{/Meta}{/Shift}"],
    ["Shift+Ctrl+Z", "{Shift>}{Control>}z{/Control}{/Shift}"],
    ["Ctrl+Y", "{Control>}y{/Control}"],
  ])("%s redoes the design", async (_name, keys) => {
    const user = userEvent.setup();
    render(<UndoRedo />);
    changeDesign();
    act(() => useStore.temporal.getState().undo());
    await user.keyboard(keys);
    expect(background()).toEqual(NEW_BG);
  });

  it("prevents the browser default only for the shortcuts", () => {
    render(<UndoRedo />);
    changeDesign();
    expect(fireEvent.keyDown(window, { key: "z", metaKey: true })).toBe(false);
    expect(fireEvent.keyDown(window, { key: "s", metaKey: true })).toBe(true);
    expect(fireEvent.keyDown(window, { key: "z" })).toBe(true);
  });

  it.each([
    ["the design-name input", "Design name"],
    ["a textarea", "Terms body"],
    ["contenteditable text", "Rich text"],
  ])("leaves Cmd+Z in %s to native text undo", async (_name, label) => {
    const user = userEvent.setup();
    render(<Harness />);
    changeDesign();
    const field = screen.getByLabelText(label);
    act(() => field.focus());
    expect(fireEvent.keyDown(field, { key: "z", metaKey: true })).toBe(true); // not prevented
    await user.keyboard("{Control>}y{/Control}");
    expect(background()).toEqual(NEW_BG);
    expect(useStore.temporal.getState().pastStates).toHaveLength(1);
  });

  it("still undoes the design from a range slider, which has no text undo", () => {
    render(<Harness />);
    changeDesign();
    const slider = screen.getByLabelText("Darken");
    act(() => slider.focus());
    act(() => void fireEvent.keyDown(slider, { key: "z", metaKey: true }));
    expect(background()).toBe(SPONSOR.design.background);
  });

  it("stops listening when unmounted", () => {
    const { unmount } = render(<UndoRedo />);
    changeDesign();
    unmount();
    expect(fireEvent.keyDown(window, { key: "z", metaKey: true })).toBe(true);
    expect(background()).toEqual(NEW_BG);
  });
});
