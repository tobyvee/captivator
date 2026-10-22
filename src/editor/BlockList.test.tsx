// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { backgroundColours, bestTextColour } from "@/lib/contrast";
import { BLANK, type Design, MAX_IMAGES } from "@/lib/design-schema";
import { useStore } from "@/lib/store";
import { PHOTO_HERO, SPONSOR } from "@/lib/templates";
import { SplashPage } from "@/splash/SplashPage";
import { BlockList } from "./BlockList";

const UPLOADED = "data:image/png;base64,iVBORw0KGgo=";

vi.mock("@/lib/images", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/images")>()),
  processUpload: vi.fn(async () => ({ dataUrl: UPLOADED, bytes: UPLOADED.length, tooLarge: false })),
}));

beforeEach(() => {
  localStorage.clear();
  useStore.setState(useStore.getInitialState(), true);
  useStore.persist.clearStorage();
});

const load = (design: Design) => act(() => useStore.getState().loadTemplate({ ...BLANK, design }));
const blocks = () => useStore.getState().design.blocks;

/** The block list beside a live preview of the store's design, as the editor shows them. */
function Editor() {
  const design = useStore((s) => s.design);
  const current = useStore((s) => s.screen);
  return (
    <>
      <BlockList />
      <section aria-label="Preview">
        <SplashPage design={design} screen={current} mode="preview" />
      </section>
    </>
  );
}

const preview = () => within(screen.getByRole("region", { name: "Preview" }));
const row = (name: RegExp) => screen.getByRole("button", { name });
const imageInput = () => screen.getByLabelText("+ Image");

async function upload() {
  const file = new File(["x"], "logo.png", { type: "image/png" });
  fireEvent.change(imageInput(), { target: { files: [file] } });
  await waitFor(() => expect(imageInput().closest("label")).not.toHaveAttribute("aria-busy"));
}

describe("BlockList", () => {
  it("lists the background, the blocks in order, then fields, terms and the button", () => {
    render(<BlockList />);
    const list = screen.getByRole("complementary", { name: "Blocks" });
    expect(within(list).getByRole("heading", { name: "Blocks" })).toBeInTheDocument();

    const rows = within(list)
      .getAllByRole("button")
      .filter((b) => !b.getAttribute("aria-label") && b.textContent !== "+ Text")
      .map((b) => b.querySelector(".font-semibold")?.textContent);
    expect(rows).toEqual(["Background", "Image", "Heading", "Subheading", "Image", "Fields", "Terms", "Connect button"]);
    expect(screen.getByText("Tip: tap anything in the preview to edit it.")).toBeInTheDocument();
  });

  it("selects a row on click and marks only that row as current", async () => {
    render(<BlockList />);
    const heading = row(/^Heading/);
    expect(row(/^Background/)).toHaveAttribute("aria-current", "true");

    await userEvent.click(heading);
    expect(useStore.getState().selection).toEqual({ kind: "block", id: "sponsor-heading" });
    expect(heading).toHaveAttribute("aria-current", "true");
    expect(row(/^Background/)).not.toHaveAttribute("aria-current");

    await userEvent.click(row(/^Fields/));
    expect(useStore.getState().selection).toEqual({ kind: "fields" });
    await userEvent.click(row(/^Connect button/));
    expect(useStore.getState().selection).toEqual({ kind: "button" });
  });

  describe("summaries", () => {
    it("describes each background type", () => {
      const design = structuredClone(BLANK.design);
      design.background = { type: "colour", colour: "#0f2a44" };
      load(design);
      render(<BlockList />);
      expect(row(/^Background/)).toHaveTextContent("Colour, #0F2A44");

      act(() => {
        useStore.getState().updateBackground({ type: "gradient", from: "#0F2A44", to: "#0E5E6F", direction: "down" });
      });
      expect(row(/^Background/)).toHaveTextContent("Gradient, #0F2A44 to #0E5E6F");

      const photo = structuredClone(PHOTO_HERO.design.background);
      if (photo.type !== "image") throw new Error("Photo hero has a photo background");
      act(() => {
        useStore.getState().updateBackground({ ...photo, overlay: null });
      });
      expect(row(/^Background/)).toHaveTextContent(/Photo$/);
      act(() => {
        useStore.getState().updateBackground({ ...photo, overlay: { from: "#000000", to: "#000000", opacity: 0 } });
      });
      expect(row(/^Background/)).toHaveTextContent(/Photo$/);
      act(() => {
        useStore.getState().updateBackground({ ...photo, overlay: { from: "#000000", to: "#000000", opacity: 0.4 } });
      });
      expect(row(/^Background/)).toHaveTextContent("Photo, darkened");
    });

    it("shows text, image alt, fields, terms and the button label", () => {
      render(<BlockList />);
      expect(row(/^Heading/)).toHaveTextContent("FREE WIFI");
      expect(row(/^Image.*Your logo/)).toBeInTheDocument();
      expect(row(/^Fields/)).toHaveTextContent("Name, Email");
      expect(row(/^Terms/)).toHaveTextContent("Optional, shown");
      expect(row(/^Connect button/)).toHaveTextContent("CONNECT");

      act(() => {
        useStore.getState().updateBlock("sponsor-heading", { text: "A".repeat(30) + "BEYOND" });
        useStore.getState().updateForm({ fields: [], terms: { mode: "off" } });
      });
      expect(row(/^Heading/).textContent).toBe("Heading" + "A".repeat(30));
      expect(row(/^Fields/)).toHaveTextContent("None, guests just tap Connect");
      expect(row(/^Terms/)).toHaveTextContent("Off");
    });
  });

  describe("+ Text", () => {
    it("appends a text block coloured for the background, selects it and shows it in the preview", async () => {
      render(<Editor />);
      const before = blocks().length;

      await userEvent.click(screen.getByRole("button", { name: "+ Text" }));

      const added = blocks().at(-1);
      expect(blocks()).toHaveLength(before + 1);
      expect(added).toMatchObject({
        kind: "text",
        text: "New text",
        role: "body",
        size: 16,
        colour: bestTextColour(backgroundColours(SPONSOR.design.background)),
      });
      expect(useStore.getState().selection).toEqual({ kind: "block", id: added?.id });
      expect(row(/^Text\s*New text/)).toHaveAttribute("aria-current", "true");
      expect(preview().getByText("New text")).toBeInTheDocument();
    });
  });

  describe("+ Image", () => {
    it("adds a Logo, then a Sponsor logo, then disables itself with the count", async () => {
      load(structuredClone(BLANK.design));
      render(<BlockList />);
      expect(imageInput()).toBeEnabled();
      expect(screen.queryByText(/images used/)).not.toBeInTheDocument();

      await upload();
      expect(blocks().at(-1)).toMatchObject({ kind: "image", src: UPLOADED, alt: "Logo", size: "md" });
      expect(useStore.getState().selection).toEqual({ kind: "block", id: blocks().at(-1)?.id });

      await upload();
      expect(blocks().at(-1)).toMatchObject({ kind: "image", alt: "Sponsor logo" });
      expect(blocks().filter((b) => b.kind === "image")).toHaveLength(MAX_IMAGES);

      const limit = screen.getByText("2 of 2 images used.");
      expect(limit).toHaveAttribute("id", "image-limit");
      expect(imageInput()).toBeDisabled();
      expect(imageInput().getAttribute("aria-describedby")).toContain("image-limit");
    });

    it("is disabled from the start when the design already has two images", () => {
      render(<BlockList />);
      expect(imageInput()).toBeDisabled();
      expect(screen.getByText("2 of 2 images used.")).toBeInTheDocument();
    });
  });

  describe("move up and down", () => {
    it("disables Up on the first block and Down on the last", () => {
      render(<BlockList />);
      const ups = screen.getAllByRole("button", { name: /^Move .* up$/ });
      const downs = screen.getAllByRole("button", { name: /^Move .* down$/ });
      expect(ups).toHaveLength(4);
      expect(ups[0]).toBeDisabled();
      expect(downs[3]).toBeDisabled();
      expect(ups.slice(1).every((b) => !(b as HTMLButtonElement).disabled)).toBe(true);
      expect(downs.slice(0, 3).every((b) => !(b as HTMLButtonElement).disabled)).toBe(true);
    });

    it("reorders blocks in the store and the preview, keeping focus on the moved block", async () => {
      render(<Editor />);
      const order = () => blocks().map((b) => b.id);
      const textOrder = () => preview().getAllByText(/FREE WIFI|Proudly sponsored by/).map((el) => el.textContent);
      expect(textOrder()).toEqual(["FREE WIFI", "Proudly sponsored by"]);

      await userEvent.click(screen.getByRole("button", { name: "Move Subheading up" }));
      expect(order()).toEqual(["sponsor-logo", "sponsor-subheading", "sponsor-heading", "sponsor-partner-logo"]);
      expect(textOrder()).toEqual(["Proudly sponsored by", "FREE WIFI"]);
      expect(screen.getByRole("button", { name: "Move Subheading up" })).toHaveFocus();

      // Reaching the top disables Up, so focus moves to the same block's Down.
      await userEvent.click(screen.getByRole("button", { name: "Move Subheading up" }));
      expect(order()[0]).toBe("sponsor-subheading");
      expect(screen.getByRole("button", { name: "Move Subheading up" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Move Subheading down" })).toHaveFocus();
    });
  });

  describe("Terms switch", () => {
    it("is a sibling of the Terms row button and toggles the terms row in the preview", async () => {
      render(<Editor />);
      const toggle = screen.getByRole("switch", { name: "Show terms checkbox" });
      const termsRow = row(/^Terms/);
      expect(termsRow).not.toContainElement(toggle);
      expect(termsRow.parentElement).toContainElement(toggle);
      expect(toggle).toHaveAttribute("aria-checked", "true");
      expect(preview().getByRole("checkbox")).toBeInTheDocument();

      await userEvent.click(toggle);
      expect(useStore.getState().design.form.terms.mode).toBe("off");
      expect(toggle).toHaveAttribute("aria-checked", "false");
      expect(termsRow).toHaveTextContent("Off");
      expect(preview().queryByRole("checkbox")).not.toBeInTheDocument();
      // Toggling doesn't select the row.
      expect(useStore.getState().selection).toEqual({ kind: "background" });

      await userEvent.click(toggle);
      expect(toggle).toHaveAttribute("aria-checked", "true");
      expect(preview().getByRole("checkbox")).toBeInTheDocument();
    });
  });

  it("reaches every row and control with Tab", async () => {
    load(structuredClone(BLANK.design));
    act(() => {
      useStore.getState().addBlock({ kind: "text", text: "One", role: "heading", colour: "#111111", size: 32 });
      useStore.getState().addBlock({ kind: "text", text: "Two", role: "body", colour: "#111111", size: 16 });
    });
    render(<BlockList />);
    const list = screen.getByRole("complementary", { name: "Blocks" });
    const controls = Array.from(list.querySelectorAll<HTMLElement>("button, input")).filter(
      (el) => !(el as HTMLButtonElement).disabled,
    );

    const reached: Element[] = [];
    for (let i = 0; i < controls.length; i++) {
      await userEvent.tab();
      reached.push(document.activeElement as Element);
    }
    expect(reached).toEqual(controls);
    // Every control is a real button or the upload's file input inside its label.
    expect(controls.every((el) => el.tagName === "BUTTON" || el.closest("label"))).toBe(true);
  });
});
