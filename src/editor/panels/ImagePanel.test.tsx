// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { processUpload } from "@/lib/images";
import { extractPalette } from "@/lib/palette";
import { useStore } from "@/lib/store";
import type { ImageBlockSpec } from "@/lib/types";
import { SplashPage } from "@/splash/SplashPage";
import { ImagePanel } from "./ImagePanel";

// The real pipeline needs a browser canvas; the panel only cares about what it hands back.
vi.mock("@/lib/images", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/images")>()),
  processUpload: vi.fn(),
}));
vi.mock("@/lib/palette", () => ({ extractPalette: vi.fn() }));

const LOGO_ID = "sponsor-logo";
const NEW_SRC = "data:image/png;base64,AAAA";

beforeEach(() => {
  localStorage.clear();
  useStore.setState(useStore.getInitialState(), true);
  useStore.persist.clearStorage(); // drop the write the reset scheduled
  vi.mocked(processUpload).mockReset();
  vi.mocked(extractPalette).mockReset();
});

const PNG = new File(["x"], "logo.png", { type: "image/png" });
const logo = () => useStore.getState().design.blocks.find((b) => b.id === LOGO_ID) as ImageBlockSpec;
const altInput = () => screen.getByRole("textbox", { name: "Alt text" });
const sizeGroup = () => screen.getByRole("group", { name: "Size" });

describe("ImagePanel", () => {
  it("shows the stored image, alt text and size", () => {
    const { container } = render(<ImagePanel id={LOGO_ID} />);
    expect(container.querySelector("img")).toHaveAttribute("src", logo().src);
    expect(altInput()).toHaveValue("Your logo");
    expect(within(sizeGroup()).getByRole("button", { name: "Small" })).toHaveAttribute("aria-pressed", "true");
  });

  it("replaces the image, keeps alt and size, and fills the logo palette", async () => {
    vi.mocked(processUpload).mockResolvedValue({ dataUrl: NEW_SRC, bytes: NEW_SRC.length, tooLarge: false });
    vi.mocked(extractPalette).mockResolvedValue(["#112233", "#445566"]);
    const { container } = render(<ImagePanel id={LOGO_ID} />);
    const before = logo();

    await userEvent.setup().upload(screen.getByLabelText("Replace image"), PNG);

    expect(processUpload).toHaveBeenCalledWith(expect.any(File), "image");
    expect(logo()).toEqual({ ...before, src: NEW_SRC });
    expect(container.querySelector("img")).toHaveAttribute("src", NEW_SRC);
    expect(useStore.getState().logoPalette).toEqual(["#112233", "#445566"]);
  });

  // The upload applies a patch when the shrink finishes, so changes made meanwhile survive
  // (the stale-closure bug T-016-with-photo-helper fixed for backgrounds).
  it("keeps alt and size changed while the upload shrinks, and drops it if the block is removed", async () => {
    const user = userEvent.setup();
    for (const removeFirst of [false, true]) {
      let finish!: (r: Awaited<ReturnType<typeof processUpload>>) => void;
      vi.mocked(processUpload).mockReturnValue(new Promise((r) => (finish = r)));
      useStore.setState(useStore.getInitialState(), true);
      const { unmount } = render(<ImagePanel id={LOGO_ID} />);
      await user.upload(screen.getByLabelText("Replace image"), PNG);
      act(() => {
        if (removeFirst) useStore.getState().removeBlock(LOGO_ID);
        else useStore.getState().updateBlock(LOGO_ID, { alt: "Changed", size: "lg" });
      });
      const before = useStore.getState().design;
      await act(async () => finish({ dataUrl: NEW_SRC, bytes: NEW_SRC.length, tooLarge: false }));
      if (removeFirst) expect(useStore.getState().design).toBe(before);
      else expect(logo()).toMatchObject({ src: NEW_SRC, alt: "Changed", size: "lg" });
      unmount();
    }
  });

  it("keeps the stored alt while the input is empty, then saves it again", async () => {
    render(<ImagePanel id={LOGO_ID} />);
    const user = userEvent.setup();

    await user.clear(altInput());
    expect(screen.getByText("Describe the image")).toHaveAttribute("role", "alert");
    expect(altInput()).toHaveAccessibleDescription(/Describe the image/);
    expect(altInput()).toHaveAttribute("aria-invalid", "true");
    expect(logo().alt).toBe("Your logo");

    await user.type(altInput(), "Harbourside logo");
    expect(screen.queryByText("Describe the image")).not.toBeInTheDocument();
    expect(altInput()).toHaveAccessibleDescription("Read aloud to guests who use a screen reader.");
    expect(altInput()).not.toHaveAttribute("aria-invalid");
    expect(logo().alt).toBe("Harbourside logo");
  });

  it("treats spaces-only alt text as empty", () => {
    render(<ImagePanel id={LOGO_ID} />);
    fireEvent.change(altInput(), { target: { value: "   " } });
    expect(screen.getByText("Describe the image")).toBeInTheDocument();
    expect(logo().alt).toBe("Your logo");
  });

  it("follows an alt change made outside the panel, such as undo", () => {
    render(<ImagePanel id={LOGO_ID} />);
    fireEvent.change(altInput(), { target: { value: "" } });
    act(() => {
      useStore.getState().updateBlock(LOGO_ID, { alt: "Restored logo" });
    });
    expect(altInput()).toHaveValue("Restored logo");
    expect(screen.queryByText("Describe the image")).not.toBeInTheDocument();
  });

  it.each([
    ["Small", "sm", 72],
    ["Medium", "md", 120],
    ["Large", "lg", 168],
  ] as const)("%s sets size %s and the rendered height to %ipx", async (label, size, height) => {
    render(<ImagePanel id={LOGO_ID} />);
    // Start away from the target so every case is a real change.
    act(() => {
      useStore.getState().updateBlock(LOGO_ID, { size: size === "md" ? "lg" : "md" });
    });

    await userEvent.setup().click(within(sizeGroup()).getByRole("button", { name: label }));
    expect(logo().size).toBe(size);
    expect(within(sizeGroup()).getByRole("button", { name: label })).toHaveAttribute("aria-pressed", "true");

    const preview = render(<SplashPage design={useStore.getState().design} screen="landing" mode="preview" />);
    expect(within(preview.container).getByRole("img", { name: logo().alt })).toHaveStyle({ height: `${height}px` });
  });
});
