// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStore } from "@/lib/store";
import type { BackgroundSpec, ImageBackground } from "@/lib/types";
import { BackgroundPanel, withPhoto } from "./BackgroundPanel";

// jsdom has no canvas, so the shrink pipeline is replaced; the rest of ImageUpload runs as is.
const { UPLOADED, processUpload } = vi.hoisted(() => {
  const UPLOADED = "data:image/webp;base64,UPLOADED";
  return {
    UPLOADED,
    processUpload: vi.fn<typeof import("@/lib/images").processUpload>(async () => ({
      dataUrl: UPLOADED,
      bytes: UPLOADED.length,
      tooLarge: false,
    })),
  };
});
vi.mock("@/lib/images", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/images")>()),
  processUpload,
}));

const PHOTO: ImageBackground = {
  type: "image",
  src: "data:image/webp;base64,OLD",
  credit: {
    name: "Alex S.",
    profileUrl: "https://unsplash.com/@alex",
    downloadLocation: "https://api.unsplash.com/photos/x/download",
  },
  fit: "fit",
  zoom: 1.5,
  focus: { x: 20, y: 80 },
  backdrop: "#223344",
  overlay: { from: "#000000", to: "#111111", opacity: 0.6 },
};

beforeEach(() => {
  localStorage.clear();
  useStore.setState(useStore.getInitialState(), true);
  useStore.persist.clearStorage(); // drop the write the reset scheduled
  processUpload.mockClear();
});

const setBackground = (bg: BackgroundSpec) => act(() => void useStore.getState().updateBackground(bg));
const background = () => useStore.getState().design.background;
const tab = (name: string) => screen.getByRole("button", { name });

function upload() {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error("no file input");
  fireEvent.change(input, { target: { files: [new File(["x"], "photo.jpg", { type: "image/jpeg" })] } });
}

describe("BackgroundPanel", () => {
  it("opens on the tab matching the background's type", () => {
    setBackground({ type: "gradient", from: "#000000", to: "#FFFFFF", direction: "right" });
    render(<BackgroundPanel />);
    expect(tab("Gradient")).toHaveAttribute("aria-pressed", "true");
    expect(tab("Colour")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("textbox", { name: "From" })).toHaveValue("#000000");
    expect(screen.getByRole("textbox", { name: "To" })).toHaveValue("#FFFFFF");
    expect(screen.getByRole("button", { name: /Left to right/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("edits a colour background through its ColourField", () => {
    setBackground({ type: "colour", colour: "#123456" });
    render(<BackgroundPanel />);
    const hex = screen.getByRole("textbox", { name: "Colour" });
    fireEvent.focus(hex);
    fireEvent.change(hex, { target: { value: "#abcdef" } });
    fireEvent.blur(hex);
    expect(background()).toEqual({ type: "colour", colour: "#ABCDEF" });
  });

  it("converts a colour to a gradient that starts from it", () => {
    setBackground({ type: "colour", colour: "#123456" });
    render(<BackgroundPanel />);
    fireEvent.click(tab("Gradient"));
    expect(background()).toEqual({ type: "gradient", from: "#123456", to: "#0E5E6F", direction: "down" });
    expect(tab("Gradient")).toHaveAttribute("aria-pressed", "true");
  });

  it("sets each gradient stop and all three directions", () => {
    setBackground({ type: "gradient", from: "#000000", to: "#FFFFFF", direction: "down" });
    render(<BackgroundPanel />);
    for (const [label, value] of [
      ["From", "#111111"],
      ["To", "#222222"],
    ]) {
      const hex = screen.getByRole("textbox", { name: label });
      fireEvent.focus(hex);
      fireEvent.change(hex, { target: { value } });
      fireEvent.blur(hex);
    }
    expect(background()).toMatchObject({ from: "#111111", to: "#222222" });

    for (const [label, direction] of [
      ["Diagonal", "diagonal"],
      ["Left to right", "right"],
      ["Top to bottom", "down"],
    ]) {
      fireEvent.click(screen.getByRole("button", { name: new RegExp(label) }));
      expect(background()).toMatchObject({ type: "gradient", direction });
    }
  });

  it("shows the gradient directions as icons only, named and titled by their labels", () => {
    setBackground({ type: "gradient", from: "#000000", to: "#FFFFFF", direction: "down" });
    render(<BackgroundPanel />);
    const group = screen.getByRole("group", { name: "Gradient direction" });
    for (const label of ["Top to bottom", "Diagonal", "Left to right"]) {
      const button = within(group).getByRole("button", { name: label });
      expect(button).toHaveAttribute("title", label);
      expect(button).toHaveTextContent("");
      expect(button.querySelector("svg")).not.toBeNull();
    }
    // The tabs above keep their text.
    expect(tab("Gradient")).toHaveTextContent("Gradient");
  });

  it("converts a gradient to a colour using its first stop", () => {
    setBackground({ type: "gradient", from: "#0F2A44", to: "#0E5E6F", direction: "diagonal" });
    render(<BackgroundPanel />);
    fireEvent.click(tab("Colour"));
    expect(background()).toEqual({ type: "colour", colour: "#0F2A44" });
    expect(screen.getByRole("textbox", { name: "Colour" })).toHaveValue("#0F2A44");
  });

  it("converts a photo to a colour using its backdrop", () => {
    setBackground(PHOTO);
    render(<BackgroundPanel />);
    fireEvent.click(tab("Colour"));
    expect(background()).toEqual({ type: "colour", colour: "#223344" });
  });

  it("leaves the store alone when Photo is chosen without a photo, and shows the upload prompt", () => {
    setBackground({ type: "colour", colour: "#123456" });
    render(<BackgroundPanel />);
    const before = useStore.getState().design;
    fireEvent.click(tab("Photo"));
    expect(useStore.getState().design).toBe(before);
    expect(tab("Photo")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/Upload a photo/)).toBeInTheDocument();
    expect(screen.getByLabelText("Upload your own")).toHaveAccessibleDescription(/Upload a photo/);
  });

  it("uploading on a colour background creates a photo with the colour as backdrop", async () => {
    setBackground({ type: "colour", colour: "#123456" });
    render(<BackgroundPanel />);
    fireEvent.click(tab("Photo"));
    upload();
    await waitFor(() => expect(background().type).toBe("image"));
    expect(processUpload).toHaveBeenCalledWith(expect.any(File), "background");
    expect(background()).toEqual({
      type: "image",
      src: UPLOADED,
      fit: "fill",
      zoom: 1,
      focus: { x: 50, y: 50 },
      backdrop: "#123456",
      overlay: { from: "#000000", to: "#000000", opacity: 0.4 },
    });
    expect(tab("Photo")).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText(/Upload a photo/)).not.toBeInTheDocument();
  });

  it("uploading over a photo replaces only the src and drops the credit", async () => {
    setBackground(PHOTO);
    render(<BackgroundPanel />);
    upload();
    await waitFor(() => expect(background()).toMatchObject({ src: UPLOADED }));
    expect(background()).toEqual({ ...PHOTO, src: UPLOADED, credit: undefined });
  });

  it("converts a photo to a gradient that starts from its backdrop", () => {
    setBackground(PHOTO);
    render(<BackgroundPanel />);
    fireEvent.click(tab("Gradient"));
    expect(background()).toEqual({ type: "gradient", from: "#223344", to: "#0E5E6F", direction: "down" });
  });

  it("uploading on a gradient uses its first stop as the backdrop", async () => {
    setBackground({ type: "gradient", from: "#0F2A44", to: "#0E5E6F", direction: "right" });
    render(<BackgroundPanel />);
    fireEvent.click(tab("Photo"));
    upload();
    await waitFor(() => expect(background().type).toBe("image"));
    expect(background()).toMatchObject({ src: UPLOADED, backdrop: "#0F2A44" });
  });

  it("applies an upload to the background as it is when the upload finishes", async () => {
    setBackground(PHOTO);
    render(<BackgroundPanel />);
    let finish: () => void = () => {};
    processUpload.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = () => resolve({ dataUrl: UPLOADED, bytes: UPLOADED.length, tooLarge: false });
        }),
    );
    upload();
    setBackground({ ...PHOTO, zoom: 2 }); // e.g. an undo while the photo shrinks
    await act(async () => finish());
    expect(background()).toEqual({ ...PHOTO, zoom: 2, src: UPLOADED, credit: undefined });
  });

  it("shows the Unsplash credit with referral links when the photo has one", () => {
    setBackground(PHOTO);
    render(<BackgroundPanel />);
    expect(tab("Photo")).toHaveAttribute("aria-pressed", "true");
    const name = screen.getByRole("link", { name: "Alex S." });
    expect(name.getAttribute("href")).toBe(
      "https://unsplash.com/@alex?utm_source=captivator&utm_medium=referral",
    );
    expect(name).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("link", { name: "Unsplash" })).toBeInTheDocument();
    expect(screen.getByText(/Photo by/)).toHaveTextContent("Photo by Alex S. on Unsplash");
  });

  it("shows no credit for an uploaded photo", () => {
    setBackground({ ...PHOTO, credit: undefined });
    render(<BackgroundPanel />);
    expect(screen.queryByText(/Photo by/)).not.toBeInTheDocument();
  });

  it("leaves Photo for the new type when the background changes while Photo has no photo yet", () => {
    setBackground({ type: "colour", colour: "#123456" });
    render(<BackgroundPanel />);
    fireEvent.click(tab("Photo"));
    setBackground({ type: "gradient", from: "#000000", to: "#FFFFFF", direction: "down" });
    expect(tab("Gradient")).toHaveAttribute("aria-pressed", "true");
  });

  it("follows the background's type when it changes outside the panel (undo, templates)", () => {
    setBackground({ type: "colour", colour: "#123456" });
    render(<BackgroundPanel />);
    setBackground({ type: "gradient", from: "#000000", to: "#FFFFFF", direction: "down" });
    expect(tab("Gradient")).toHaveAttribute("aria-pressed", "true");
    setBackground(PHOTO);
    expect(tab("Photo")).toHaveAttribute("aria-pressed", "true");
  });
});

describe("withPhoto", () => {
  const CREDIT = PHOTO.credit;

  it.each<[string, BackgroundSpec, string]>([
    ["a colour", { type: "colour", colour: "#123456" }, "#123456"],
    ["a gradient", { type: "gradient", from: "#0F2A44", to: "#0E5E6F", direction: "down" }, "#0F2A44"],
  ])("turns %s into a fresh photo over its main colour", (_, bg, backdrop) => {
    expect(withPhoto(bg, UPLOADED)).toEqual({
      type: "image",
      src: UPLOADED,
      credit: undefined,
      fit: "fill",
      zoom: 1,
      focus: { x: 50, y: 50 },
      backdrop,
      overlay: { from: "#000000", to: "#000000", opacity: 0.4 },
    });
    expect(withPhoto(bg, UPLOADED, CREDIT).credit).toEqual(CREDIT);
  });

  it("keeps a photo's settings and swaps its src and credit", () => {
    expect(withPhoto(PHOTO, UPLOADED)).toEqual({ ...PHOTO, src: UPLOADED, credit: undefined });
    const credit = { ...CREDIT!, name: "Sam" };
    expect(withPhoto(PHOTO, UPLOADED, credit)).toEqual({ ...PHOTO, src: UPLOADED, credit });
  });
});
