// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BLANK, Design } from "@/lib/design-schema";
import { useStore } from "@/lib/store";
import { ColourField, designColours } from "./ColourField";

const HEX = /^#[0-9A-F]{6}$/;

beforeEach(() => {
  localStorage.clear();
  useStore.setState(useStore.getInitialState(), true);
  useStore.persist.clearStorage(); // drop the write the reset scheduled
});

/** A copy of Blank with `edit` applied, checked against the schema. */
const design = (edit?: (d: Design) => void): Design => {
  const d = structuredClone(BLANK.design);
  edit?.(d);
  return Design.parse(d);
};

const seed = (d: Design) => act(() => useStore.setState({ design: d }));

const renderField = (value = "#112233", onChange = vi.fn()) => {
  render(<ColourField label="Text colour" value={value} onChange={onChange} />);
  return onChange;
};

const hexInput = () => screen.getByRole("textbox", { name: "Text colour" });
const swatch = () => screen.getByRole("button", { name: "Open colour picker" });
const designRow = () => screen.getByRole("group", { name: "In this design" });
const swatchLabels = (row: HTMLElement) =>
  within(row)
    .getAllByRole("button")
    .map((b) => b.getAttribute("aria-label"));

/** Types into the hex input the way a user would: focus, replace the text. */
const typeHex = (text: string) => {
  const input = hexInput();
  act(() => input.focus());
  fireEvent.change(input, { target: { value: text } });
  return input;
};

describe("designColours", () => {
  it("lists a colour background, text block colours, then the form colours in page order", () => {
    const d = design((d) => {
      d.background = { type: "colour", colour: "#0A0A0A" };
      d.blocks = [
        { id: "h", kind: "text", text: "Hi", role: "heading", colour: "#AA0000", size: 32 },
        { id: "b", kind: "text", text: "Body", role: "body", colour: "#00AA00", size: 16 },
      ];
      d.form.inputBg = "#111111";
      d.form.inputText = "#222222";
      d.form.terms.textColour = "#333333";
      d.form.button = { ...d.form.button, bg: "#444444", fg: "#555555" };
    });
    expect(designColours(d)).toEqual([
      "#0A0A0A",
      "#AA0000",
      "#00AA00",
      "#111111",
      "#222222",
      "#333333",
      "#444444",
      "#555555",
    ]);
  });

  it("takes both gradient stops", () => {
    const d = design((d) => {
      d.background = { type: "gradient", from: "#123456", to: "#654321", direction: "down" };
    });
    expect(designColours(d).slice(0, 2)).toEqual(["#123456", "#654321"]);
  });

  it("takes only the backdrop from a photo background, not its overlay", () => {
    const d = design((d) => {
      d.background = {
        type: "image",
        src: "/templates/hero.jpg",
        fit: "fit",
        zoom: 1,
        focus: { x: 50, y: 50 },
        backdrop: "#ABCDEF",
        overlay: { from: "#FEDCBA", to: "#0F0F0F", opacity: 0.5 },
      };
    });
    const colours = designColours(d);
    expect(colours[0]).toBe("#ABCDEF");
    expect(colours).not.toContain("#FEDCBA");
    expect(colours).not.toContain("#0F0F0F");
  });

  it("skips image blocks", () => {
    const d = design((d) => {
      d.blocks = [{ id: "i", kind: "image", src: "/templates/logo.webp", alt: "Logo", size: "md" }];
    });
    expect(designColours(d)).toEqual(designColours(BLANK.design));
  });

  it("uppercases and deduplicates case-insensitively, keeping the first occurrence's place", () => {
    const d = design((d) => {
      d.background = { type: "colour", colour: "#abcdef" };
      d.blocks = [{ id: "h", kind: "text", text: "Hi", role: "heading", colour: "#ABCDEF", size: 32 }];
      d.form.inputBg = "#AbCdEf";
      d.form.inputText = "#ffffff";
      d.form.terms.textColour = "#FFFFFF";
      d.form.button = { ...d.form.button, bg: "#ffffff", fg: "#000000" };
    });
    expect(designColours(d)).toEqual(["#ABCDEF", "#FFFFFF", "#000000"]);
  });

  it("returns at most 8, dropping the last colours on the page", () => {
    const d = design((d) => {
      d.background = { type: "gradient", from: "#000001", to: "#000002", direction: "right" };
      d.blocks = ["#000003", "#000004", "#000005", "#000006"].map((colour, i) => ({
        id: `t${i}`,
        kind: "text" as const,
        text: "x",
        role: "body" as const,
        colour,
        size: 16,
      }));
      d.form.inputBg = "#000007";
      d.form.inputText = "#000008";
      d.form.terms.textColour = "#000009";
      d.form.button = { ...d.form.button, bg: "#00000A", fg: "#00000B" };
    });
    const colours = designColours(d);
    expect(colours).toHaveLength(8);
    expect(colours).toEqual([1, 2, 3, 4, 5, 6, 7, 8].map((n) => `#00000${n}`));
  });
});

describe("ColourField picker", () => {
  it("opens a dialog from the swatch and focuses the picker", () => {
    renderField();
    expect(swatch()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(swatch());
    const dialog = screen.getByRole("dialog", { name: "Text colour picker" });
    expect(swatch()).toHaveAttribute("aria-expanded", "true");
    expect(swatch()).toHaveAttribute("aria-controls", dialog.id);
    expect(within(dialog).getByRole("slider", { name: "Color" })).toHaveFocus();
  });

  it("calls onChange on every picker move with an uppercase #RRGGBB, so the preview updates live", () => {
    const onChange = vi.fn();
    function Harness() {
      const [value, setValue] = useState("#336699");
      return (
        <ColourField
          label="Text colour"
          value={value}
          onChange={(c) => {
            onChange(c);
            setValue(c);
          }}
        />
      );
    }
    render(<Harness />);
    fireEvent.click(swatch());
    const dialog = screen.getByRole("dialog");
    const saturation = within(dialog).getByRole("slider", { name: "Color" });
    const hue = within(dialog).getByRole("slider", { name: "Hue" });

    // react-colorful reads keyCode, not key.
    fireEvent.keyDown(saturation, { key: "ArrowRight", keyCode: 39 });
    fireEvent.keyDown(saturation, { key: "ArrowRight", keyCode: 39 });
    fireEvent.keyDown(hue, { key: "ArrowRight", keyCode: 39 });

    expect(onChange).toHaveBeenCalledTimes(3);
    const colours = onChange.mock.calls.map(([c]) => c as string);
    for (const c of colours) expect(c).toMatch(HEX);
    expect(new Set(colours).size).toBe(3);
    // The field follows the caller's value.
    expect(hexInput()).toHaveValue(colours[2]);
  });

  it("closes on Escape from the picker and returns focus to the swatch", () => {
    renderField();
    fireEvent.click(swatch());
    fireEvent.keyDown(screen.getByRole("slider", { name: "Color" }), { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(swatch()).toHaveAttribute("aria-expanded", "false");
    expect(swatch()).toHaveFocus();
  });

  it("closes on Escape from the hex input and returns focus to the swatch", () => {
    renderField();
    fireEvent.click(swatch());
    act(() => hexInput().focus());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(hexInput(), { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(swatch()).toHaveFocus();
  });

  it("cancels a draft typed in the hex input when Escape closes the popover", () => {
    const onChange = renderField("#112233");
    fireEvent.click(swatch());
    const input = typeHex("abc123");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(swatch()).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveValue("#112233");
  });

  it("describes the swatch by the field's label", () => {
    renderField();
    expect(swatch()).toHaveAccessibleName("Open colour picker");
    expect(swatch()).toHaveAccessibleDescription("Text colour");
  });

  it("closes on a press outside without moving focus to the swatch", () => {
    render(
      <>
        <ColourField label="Text colour" value="#112233" onChange={vi.fn()} />
        <button type="button">Elsewhere</button>
      </>,
    );
    fireEvent.click(swatch());
    const elsewhere = screen.getByRole("button", { name: "Elsewhere" });

    // A press inside the popover leaves it open.
    fireEvent.pointerDown(screen.getByRole("slider", { name: "Hue" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.pointerDown(elsewhere);
    act(() => elsewhere.focus());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(elsewhere).toHaveFocus();
  });

  it("tabs swatch, picker, hex input, then every suggestion, closing the popover on the way out", async () => {
    const user = userEvent.setup();
    seed(
      design((d) => {
        d.background = { type: "colour", colour: "#0A0A0A" };
      }),
    );
    act(() => useStore.getState().setLogoPalette(["#FF0000"]));
    renderField();

    await user.tab();
    expect(swatch()).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("slider", { name: "Color" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("slider", { name: "Hue" })).toHaveFocus();
    await user.tab();
    expect(hexInput()).toHaveFocus();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const suggestions = [
      ...within(designRow()).getAllByRole("button"),
      ...within(screen.getByRole("group", { name: "From your logo" })).getAllByRole("button"),
    ];
    for (const s of suggestions) {
      await user.tab();
      expect(s).toHaveFocus();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    }
  });
});

describe("ColourField hex input", () => {
  it("is labelled by the field label, shows the value uppercased and takes at most 9 characters", () => {
    renderField("#a1b2c3");
    expect(hexInput()).toHaveValue("#A1B2C3");
    // #RRGGBB plus room for a space either side of a pasted colour.
    expect(hexInput()).toHaveAttribute("maxLength", "9");
  });

  it("commits a pasted colour with surrounding spaces, trimmed", async () => {
    const user = userEvent.setup();
    const onChange = renderField();
    const input = hexInput();
    await user.click(input);
    await user.clear(input);
    await user.paste(" #abc123 ");
    expect(input).toHaveValue(" #abc123 ");
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledExactlyOnceWith("#ABC123");
  });

  it("commits abc123 on Enter as #ABC123", () => {
    const onChange = renderField();
    const input = typeHex("abc123");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledExactlyOnceWith("#ABC123");
    expect(input).toHaveValue("#ABC123");
  });

  it("commits #00ff00 on blur as #00FF00", () => {
    const onChange = renderField();
    const input = typeHex("#00ff00");
    act(() => input.blur());
    expect(onChange).toHaveBeenCalledExactlyOnceWith("#00FF00");
  });

  it.each(["#12345", "zzzzzz", "#12345G", ""])(
    "reverts %j to the value on blur without calling onChange",
    (text) => {
      const onChange = renderField("#112233");
      const input = typeHex(text);
      act(() => input.blur());
      expect(onChange).not.toHaveBeenCalled();
      expect(input).toHaveValue("#112233");
    },
  );

  it("reverts invalid text on Enter without calling onChange", () => {
    const onChange = renderField("#112233");
    const input = typeHex("nope");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveValue("#112233");
  });

  it("doesn't call onChange when the typed colour is the current one", () => {
    const onChange = renderField("#ABC123");
    const input = typeHex("abc123");
    act(() => input.blur());
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("ColourField suggestions", () => {
  it("shows the design's colours under In this design, uppercased and deduplicated", () => {
    seed(
      design((d) => {
        d.background = { type: "gradient", from: "#abcdef", to: "#ABCDEF", direction: "down" };
        d.blocks = [{ id: "h", kind: "text", text: "Hi", role: "heading", colour: "#00aa00", size: 32 }];
      }),
    );
    renderField();
    expect(swatchLabels(designRow())).toEqual(["#ABCDEF", "#00AA00", "#FFFFFF", "#111111"]);
  });

  it("follows the store when the design changes", () => {
    renderField();
    expect(swatchLabels(designRow())).not.toContain("#C0FFEE");
    seed(
      design((d) => {
        d.background = { type: "colour", colour: "#C0FFEE" };
      }),
    );
    expect(swatchLabels(designRow())[0]).toBe("#C0FFEE");
  });

  it("calls onChange with a suggestion's colour when it is pressed", () => {
    const onChange = renderField();
    fireEvent.click(within(designRow()).getByRole("button", { name: "#111111" }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith("#111111");
  });

  it("doesn't call onChange when the selected suggestion is pressed again", () => {
    const onChange = renderField("#111111");
    const selected = within(designRow()).getByRole("button", { name: "#111111" });
    expect(selected).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(selected);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("marks the suggestion matching the value as pressed, whatever its case", () => {
    renderField("#ffffff");
    const row = designRow();
    expect(within(row).getByRole("button", { name: "#FFFFFF" })).toHaveAttribute("aria-pressed", "true");
    expect(within(row).getByRole("button", { name: "#111111" })).toHaveAttribute("aria-pressed", "false");
  });

  it("hides From your logo until setLogoPalette fills it, then shows its swatches", () => {
    const onChange = renderField("#ff0000");
    expect(screen.queryByRole("group", { name: "From your logo" })).not.toBeInTheDocument();
    expect(screen.queryByText("From your logo")).not.toBeInTheDocument();

    act(() => useStore.getState().setLogoPalette(["#ff0000", "#FF0000", "not-a-colour", "#00ff00"]));
    const row = screen.getByRole("group", { name: "From your logo" });
    expect(swatchLabels(row)).toEqual(["#FF0000", "#00FF00"]);
    expect(within(row).getByRole("button", { name: "#FF0000" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(within(row).getByRole("button", { name: "#00FF00" }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith("#00FF00");
    // Suggestions only: the design is untouched.
    expect(designColours(useStore.getState().design)).not.toContain("#00FF00");

    act(() => useStore.getState().setLogoPalette([]));
    expect(screen.queryByRole("group", { name: "From your logo" })).not.toBeInTheDocument();
  });
});
