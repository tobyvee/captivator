// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { BLANK, Design } from "../lib/design-schema";
import type { FieldKindSpec, RenderMode, Screen, Selection } from "../lib/types";
import { Form } from "./Form";
import { TERMS_LINK_ID } from "./TermsSheet";

const LIGHT_ERROR = "rgb(254, 202, 202)"; // #FECACA
const DARK_ERROR = "rgb(185, 28, 28)"; // #B91C1C

const design = (
  fields: FieldKindSpec[],
  terms: "off" | "checkbox" = "checkbox",
  background = "#FFFFFF",
): Design => {
  const d = structuredClone(BLANK.design);
  d.form.fields = fields;
  d.form.terms.mode = terms;
  d.background = { type: "colour", colour: background };
  return Design.parse(d);
};

const checkbox = () => screen.getByRole("checkbox");

// Holds the screen the way the store does, so Connect's screen change re-renders the Form.
function Harness(props: {
  design: Design;
  onSelect?: (s: Selection) => void;
  start?: Screen;
  expose?: (set: (s: Screen) => void) => void;
}) {
  const [current, setCurrent] = useState<Screen>(props.start ?? "landing");
  props.expose?.(setCurrent);
  return (
    <>
      <output data-testid="screen">{current}</output>
      <Form
        design={props.design}
        mode="edit"
        screen={current}
        onSelect={props.onSelect}
        onScreenChange={setCurrent}
      />
    </>
  );
}

const shownScreen = () => screen.getByTestId("screen").textContent;

describe("Form export terms link", () => {
  it("carries the id the terms sheet's close links return to", () => {
    const html = renderToStaticMarkup(
      <Form design={design(["email"])} mode="export" screen="landing" />,
    );
    expect(TERMS_LINK_ID).toBe("cv-terms-link");
    expect(html).toContain('<a id="cv-terms-link" href="#terms"');
  });

  it.each<RenderMode>(["edit", "preview"])("%s mode's link button has no id", (mode) => {
    render(<Form design={design(["email"])} mode={mode} screen="landing" />);
    expect(screen.getByRole("button", { name: "terms of use" })).not.toHaveAttribute("id");
  });
});

describe("Form Error screen", () => {
  it.each<RenderMode>(["edit", "preview"])(
    "%s: the first field shows an example invalid value and its message, and terms are flagged",
    (mode) => {
      render(<Form design={design(["email", "name"])} mode={mode} screen="error" />);
      const email = screen.getByRole("textbox", { name: "Email" });
      expect(email).toHaveValue("sam@");
      expect(email).toHaveAttribute("aria-invalid", "true");
      expect(email).toHaveAccessibleDescription("Enter a valid email");
      expect(email).toHaveStyle({ border: "2px solid #B91C1C" });

      const name = screen.getByRole("textbox", { name: "Name" });
      expect(name).not.toHaveAttribute("aria-invalid");
      expect(name).not.toHaveAccessibleDescription();

      expect(checkbox()).not.toBeChecked();
      expect(checkbox()).toHaveAttribute("aria-invalid", "true");
      expect(checkbox()).toHaveAccessibleDescription("Please accept the terms");
      expect(checkbox()).toHaveStyle({ outline: "2px solid #b91c1c" });
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("Please accept the terms");
      expect(alert.style.color).toBe(DARK_ERROR);
      expect(alert).toHaveStyle({ fontSize: "14px", fontWeight: "500" });
      expect(alert.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    },
  );

  it.each([
    ["name", "", "Enter your name"],
    ["phone", "12", "Enter a valid phone number"],
  ] as const)("a first %s field shows %j with %j", (kind, value, copy) => {
    render(<Form design={design([kind], "off")} mode="preview" screen="error" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue(value);
    expect(input).toHaveAccessibleDescription(copy);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("uses light red on a dark background and dark red on a light one", () => {
    const { unmount } = render(
      <Form design={design(["email"], "checkbox", "#0F2A44")} mode="preview" screen="error" />,
    );
    expect(screen.getByRole("alert").style.color).toBe(LIGHT_ERROR);
    expect(screen.getByRole("textbox")).toHaveStyle({ border: "2px solid #FECACA" });
    unmount();

    render(
      <Form design={design(["email"], "checkbox", "#FFFFFF")} mode="preview" screen="error" />,
    );
    expect(screen.getByRole("alert").style.color).toBe(DARK_ERROR);
  });

  it("with no fields, flags only the terms", () => {
    render(<Form design={design([])} mode="preview" screen="error" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Please accept the terms");
    expect(screen.getByText("Please accept the terms")).toBeInTheDocument();
  });

  it("never reaches the export markup", () => {
    const html = renderToStaticMarkup(
      <Form design={design(["email"])} mode="export" screen="error" />,
    );
    expect(html).not.toContain("aria-invalid");
    expect(html).not.toContain("Enter a valid email");
    expect(html).not.toContain('value="sam@"');
  });

  it("shows no error state on the landing screen", () => {
    render(<Form design={design(["email"])} mode="edit" screen="landing" />);
    expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("Form edit-mode Connect", () => {
  it("with empty inputs, selects the button and shows Error", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Harness design={design(["name", "email"])} onSelect={onSelect} />);
    await user.click(screen.getByRole("button", { name: "Connect" }));
    expect(onSelect.mock.calls).toEqual([[{ kind: "button" }]]);
    expect(shownScreen()).toBe("error");
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveAccessibleDescription(
      "Enter your name",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Please accept the terms");
  });

  it("with valid inputs and terms ticked, shows Connected", async () => {
    const user = userEvent.setup();
    render(<Harness design={design(["name", "email"])} />);
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Sam");
    await user.type(screen.getByRole("textbox", { name: "Email" }), "sam@example.com");
    await user.click(checkbox());
    await user.click(screen.getByRole("button", { name: "Connect" }));
    expect(shownScreen()).toBe("connected");
  });

  it("with nothing that can fail, shows Connected", async () => {
    const user = userEvent.setup();
    render(<Harness design={design([], "off")} />);
    await user.click(screen.getByRole("button", { name: "Connect" }));
    expect(shownScreen()).toBe("connected");
  });

  it("flags the field that actually failed and keeps what was typed", async () => {
    const user = userEvent.setup();
    render(<Harness design={design(["name", "email"])} />);
    const name = screen.getByRole("textbox", { name: "Name" });
    const email = screen.getByRole("textbox", { name: "Email" });
    await user.type(name, "Sam");
    await user.type(email, "bob@");
    await user.click(checkbox());
    await user.click(screen.getByRole("button", { name: "Connect" }));

    expect(shownScreen()).toBe("error");
    // Same elements: entering the Error screen remounts nothing.
    expect(screen.getByRole("textbox", { name: "Name" })).toBe(name);
    expect(name).toHaveValue("Sam");
    expect(name).not.toHaveAttribute("aria-invalid");
    expect(email).toHaveValue("bob@");
    expect(email).toHaveAccessibleDescription("Enter a valid email");
    expect(checkbox()).toBeChecked();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("flags only the terms when the fields pass", async () => {
    const user = userEvent.setup();
    render(<Harness design={design(["phone"])} />);
    await user.type(screen.getByRole("textbox", { name: "Phone" }), "+61 400 000 000");
    await user.click(screen.getByRole("button", { name: "Connect" }));
    expect(shownScreen()).toBe("error");
    expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-invalid");
    expect(screen.getByRole("alert")).toHaveTextContent("Please accept the terms");
  });

  it("fixing the inputs on the Error screen and connecting again shows Connected", async () => {
    const user = userEvent.setup();
    render(<Harness design={design(["email"], "off")} />);
    await user.click(screen.getByRole("button", { name: "Connect" }));
    expect(shownScreen()).toBe("error");
    await user.type(screen.getByRole("textbox"), "sam@example.com");
    await user.click(screen.getByRole("button", { name: "Connect" }));
    expect(shownScreen()).toBe("connected");
  });

  it("forgets a real failure once the screen moves on, so Error shows the example again", async () => {
    const user = userEvent.setup();
    let setScreen: (s: Screen) => void = () => {};
    render(<Harness design={design(["name", "email"])} expose={(set) => (setScreen = set)} />);
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Sam");
    await user.click(checkbox());
    await user.click(screen.getByRole("button", { name: "Connect" }));
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute("aria-invalid", "true");

    await act(() => setScreen("landing"));
    expect(screen.getByRole("textbox", { name: "Email" })).not.toHaveAttribute("aria-invalid");

    await act(() => setScreen("error"));
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("textbox", { name: "Email" })).not.toHaveAttribute("aria-invalid");
    expect(screen.getByRole("alert")).toHaveTextContent("Please accept the terms");
  });

  it("preview: Connect does nothing", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onScreenChange = vi.fn();
    render(
      <Form
        design={design(["email"])}
        mode="preview"
        screen="landing"
        onSelect={onSelect}
        onScreenChange={onScreenChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Connect" }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(onScreenChange).not.toHaveBeenCalled();
  });
});
