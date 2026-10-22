// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BLANK, Design, FIELD_SPEC } from "../lib/design-schema";
import type { FieldKindSpec, RenderMode } from "../lib/types";
import { Form } from "./Form";

const MODES: RenderMode[] = ["edit", "preview", "export"];

const design = (
  fields: FieldKindSpec[],
  terms: "off" | "checkbox" = "checkbox",
  edit?: (d: Design) => void,
): Design => {
  const d = structuredClone(BLANK.design);
  d.form.fields = fields;
  d.form.terms.mode = terms;
  edit?.(d);
  return Design.parse(d);
};

const renderForm = (
  d: Design,
  mode: RenderMode,
  props: Partial<Parameters<typeof Form>[0]> = {},
) => {
  const { container } = render(<Form design={d} mode={mode} screen="landing" {...props} />);
  const form = container.querySelector("form");
  if (!form) throw new Error("no form rendered");
  return form;
};

const checkbox = (form: HTMLFormElement) =>
  form.querySelector<HTMLInputElement>('input[type="checkbox"]');

describe("Form fields", () => {
  it.each(Object.keys(FIELD_SPEC) as FieldKindSpec[])(
    "renders %s with type, autocomplete and inputmode from FIELD_SPEC",
    (kind) => {
      renderForm(design([kind]), "export");
      const input = screen.getByRole("textbox", { name: FIELD_SPEC[kind].placeholder });
      expect(input).toHaveAttribute("name", kind);
      expect(input).toHaveAttribute("type", FIELD_SPEC[kind].type);
      expect(input).toHaveAttribute("autocomplete", FIELD_SPEC[kind].autoComplete);
      expect(input).toHaveAttribute("inputmode", FIELD_SPEC[kind].inputMode);
      expect(input).toHaveAttribute("placeholder", FIELD_SPEC[kind].placeholder);
    },
  );

  it("renders fields in the design's order, 16px text and 48px tall", () => {
    const form = renderForm(design(["phone", "name"]), "preview");
    const inputs = [...form.querySelectorAll<HTMLInputElement>("input:not([type=checkbox])")];
    expect(inputs.map((i) => i.name)).toEqual(["phone", "name"]);
    for (const input of inputs) {
      expect(input.style.fontSize).toBe("16px");
      expect(input.style.height).toBe("48px");
    }
  });

  it("renders no fields group when there are no fields", () => {
    const form = renderForm(design([], "off"), "preview");
    expect(form.querySelectorAll("input")).toHaveLength(0);
  });
});

describe("Form terms row", () => {
  it.each(MODES)("%s mode renders no terms row when terms are off", (mode) => {
    const form = renderForm(design(["email"], "off"), mode);
    expect(checkbox(form)).toBeNull();
    expect(form.querySelector("label")).toBeNull();
    expect(screen.queryByText(/terms of use/)).toBeNull();
  });

  it.each(MODES)("%s mode never pre-checks the terms checkbox", (mode) => {
    const box = checkbox(renderForm(design(["email"]), mode));
    expect(box).not.toBeNull();
    expect(box).not.toBeChecked();
    expect(box).not.toHaveAttribute("checked");
  });

  it("posts the terms version with the checkbox and is at least 44px tall", () => {
    const form = renderForm(
      design([], "checkbox", (d) => (d.form.terms.version = 3)),
      "export",
    );
    expect(checkbox(form)).toHaveAttribute("name", "accept_terms");
    expect(checkbox(form)).toHaveAttribute("value", "3");
    expect(form.querySelector("label")?.style.minHeight).toBe("44px");
  });

  it("uses the button colour as the checkbox accent and the terms colour for the text", () => {
    const form = renderForm(
      design([], "checkbox", (d) => {
        d.form.button.bg = "#F97316";
        d.form.terms.textColour = "#FFFFFF";
      }),
      "preview",
    );
    expect(checkbox(form)?.style.accentColor).toBe("rgb(249, 115, 22)");
    expect(form.querySelector("label")?.style.color).toBe("rgb(255, 255, 255)");
  });
});

describe("Form render modes", () => {
  it.each<RenderMode>(["edit", "preview"])(
    "%s mode renders no required, action, method or command",
    (mode) => {
      const form = renderForm(design(["name", "email"]), mode);
      expect(form.querySelectorAll("[required]")).toHaveLength(0);
      expect(form).not.toHaveAttribute("action");
      expect(form).not.toHaveAttribute("method");
      expect(form.querySelector('[name="command"]')).toBeNull();
      expect(form.querySelector("a")).toBeNull();
      expect(screen.getByRole("button", { name: "Connect" })).toHaveAttribute("type", "button");
    },
  );

  it.each<RenderMode>(["edit", "preview"])("%s mode never submits the form", (mode) => {
    const form = renderForm(design(["name"]), mode);
    const submit = new Event("submit", { bubbles: true, cancelable: true });
    form.dispatchEvent(submit);
    expect(submit.defaultPrevented).toBe(true);
  });

  it("export renders required on every input and the checkbox, method post and an #terms link", () => {
    const form = renderForm(design(["name", "phone"]), "export");
    const visible = [...form.querySelectorAll("input:not([type=hidden])")];
    expect(visible).toHaveLength(3);
    for (const input of visible) expect(input).toBeRequired();
    expect(form).toHaveAttribute("method", "post");
    expect(screen.getByRole("link", { name: "terms of use" })).toHaveAttribute("href", "#terms");
    expect(screen.getByRole("button", { name: "Connect" })).toHaveAttribute("type", "submit");
  });

  it("export with fields posts to the portal placeholder with no command input", () => {
    const form = renderForm(design(["email"]), "export");
    expect(form.getAttribute("action")).toBe("[PORTAL_SUBMIT_URL]");
    expect(form.querySelector('[name="command"]')).toBeNull();
  });

  it("export with no fields posts to the router placeholder with command=login", () => {
    const form = renderForm(design([], "off"), "export");
    expect(form.getAttribute("action")).toBe("[ROUTER_FORM_ACTION]");
    const command = form.querySelector('input[name="command"]');
    expect(command).toHaveAttribute("type", "hidden");
    expect(command).toHaveAttribute("value", "login");
  });

  it("export action is always a placeholder literal, never design data", () => {
    const hostile = "https://evil.example/collect";
    for (const fields of [[], ["name"]] as FieldKindSpec[][]) {
      const form = renderForm(
        design(fields, "checkbox", (d) => {
          d.form.button.label = hostile.slice(0, 24);
          d.form.terms.label = hostile;
          d.form.terms.linkText = "javascript:alert(1)";
        }),
        "export",
      );
      expect(["[PORTAL_SUBMIT_URL]", "[ROUTER_FORM_ACTION]"]).toContain(
        form.getAttribute("action"),
      );
      expect(screen.getByRole("link", { name: "javascript:alert(1)" })).toHaveAttribute(
        "href",
        "#terms",
      );
      cleanup();
    }
  });

  it.each(MODES)("%s mode renders label, link and button text as text, never markup", (mode) => {
    const attack = "<img src=x onerror=alert(1)>";
    const form = renderForm(
      design(["name"], "checkbox", (d) => {
        d.form.terms.label = attack;
        d.form.terms.linkText = "<b>x</b>";
        d.form.button.label = "<i>Go</i>";
      }),
      mode,
    );
    expect(form.querySelector("img, b, i")).toBeNull();
    expect(form.querySelector("label")).toHaveTextContent(`${attack} <b>x</b>`);
    expect(screen.getByRole("button", { name: "<i>Go</i>" })).toBeInTheDocument();
  });

  it("renders no class names in any mode", () => {
    for (const mode of MODES) {
      expect(renderForm(design(["email"]), mode).querySelectorAll("[class]")).toHaveLength(0);
    }
  });
});

describe("Form Connect button", () => {
  it("is solid by default: filled with bg, text in fg, no border", () => {
    renderForm(
      design(
        [],
        "off",
        (d) => (d.form.button = { ...d.form.button, bg: "#F97316", fg: "#111111" }),
      ),
      "preview",
    );
    const connect = screen.getByRole("button", { name: "Connect" });
    expect(connect.style.background).toBe("rgb(249, 115, 22)");
    expect(connect.style.color).toBe("rgb(17, 17, 17)");
    expect(connect.style.minHeight).toBe("50px");
  });

  it("outline is transparent with a 2px bg border and fg text", () => {
    renderForm(
      design(
        [],
        "off",
        (d) => (d.form.button = { label: "Go", bg: "#F97316", fg: "#111111", variant: "outline" }),
      ),
      "preview",
    );
    const connect = screen.getByRole("button", { name: "Go" });
    expect(connect.style.background).toBe("transparent");
    expect(connect.style.border).toBe("2px solid rgb(249, 115, 22)");
    expect(connect.style.color).toBe("rgb(17, 17, 17)");
  });
});

describe("Form edit and preview interactions", () => {
  it("edit: the terms link is a button that selects Terms once and does not tick the box", () => {
    const onSelect = vi.fn();
    const onScreenChange = vi.fn();
    const form = renderForm(design(["email"]), "edit", { onSelect, onScreenChange });
    const link = screen.getByRole("button", { name: "terms of use" });
    expect(link).toHaveAttribute("type", "button");
    fireEvent.click(link);
    expect(onSelect.mock.calls).toEqual([[{ kind: "terms" }]]);
    expect(onScreenChange).not.toHaveBeenCalled();
    expect(checkbox(form)).not.toBeChecked();
  });

  it("edit: clicking the terms label text selects Terms once without ticking the box", () => {
    const onSelect = vi.fn();
    const form = renderForm(design([]), "edit", { onSelect });
    fireEvent.click(screen.getByText(/I agree to the/));
    expect(onSelect.mock.calls).toEqual([[{ kind: "terms" }]]);
    expect(checkbox(form)).not.toBeChecked();
  });

  it("edit: the checkbox itself still ticks, for a test value, without selecting", () => {
    const onSelect = vi.fn();
    const form = renderForm(design([]), "edit", { onSelect });
    fireEvent.click(checkbox(form)!);
    expect(checkbox(form)).toBeChecked();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("edit: Connect selects the button", () => {
    const onSelect = vi.fn();
    renderForm(design(["email"]), "edit", { onSelect });
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));
    expect(onSelect.mock.calls).toEqual([[{ kind: "button" }]]);
  });

  it("edit: clicking a field selects the fields and leaves it typeable", () => {
    const onSelect = vi.fn();
    renderForm(design(["name", "email"]), "edit", { onSelect });
    const email = screen.getByRole("textbox", { name: "Email" });
    fireEvent.click(email);
    fireEvent.change(email, { target: { value: "sam@example.com" } });
    expect(onSelect.mock.calls).toEqual([[{ kind: "fields" }]]);
    expect(email).toHaveValue("sam@example.com");
  });

  it("preview: the terms link opens the Terms sheet and nothing selects", () => {
    const onSelect = vi.fn();
    const onScreenChange = vi.fn();
    renderForm(design(["email"]), "preview", { onSelect, onScreenChange });
    fireEvent.click(screen.getByRole("button", { name: "terms of use" }));
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));
    fireEvent.click(screen.getByRole("textbox", { name: "Email" }));
    expect(onScreenChange.mock.calls).toEqual([["terms"]]);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
