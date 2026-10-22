// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BLANK, type Design } from "@/lib/design-schema";
import type { BackgroundSpec, TextBlockSpec } from "@/lib/types";
import { ReadabilityCheck } from "./ReadabilityCheck";

// jsdom can't draw images, so the photo sampler is faked. Each test uses its own `src`,
// because the component caches averages by `src` for the life of the module.
const getColorAsync = vi.hoisted(() => vi.fn());
vi.mock("fast-average-color", () => ({
  FastAverageColor: class {
    getColorAsync = getColorAsync;
  },
}));

beforeEach(() => {
  getColorAsync.mockReset();
});

const heading = (colour: string): TextBlockSpec => ({
  id: "h",
  kind: "text",
  text: "Free WiFi",
  role: "heading",
  colour,
  size: 32,
});

const photo = (src: string, backdrop = "#1E293B"): BackgroundSpec => ({
  type: "image",
  src,
  fit: "fill",
  zoom: 1,
  focus: { x: 50, y: 50 },
  backdrop,
  overlay: null,
});

const design = (background: BackgroundSpec, blocks: Design["blocks"] = []): Design => ({
  ...BLANK.design,
  background,
  blocks,
});

describe("ReadabilityCheck", () => {
  it("says all text is readable for Blank", () => {
    render(<ReadabilityCheck design={BLANK.design} />);
    expect(screen.getByRole("status")).toHaveTextContent("All text is readable");
  });

  it("names the first failure and what it needs", () => {
    const d = design(BLANK.design.background, [heading("#FFFFFF")]);
    render(<ReadabilityCheck design={{ ...d, form: { ...d.form, fields: ["email"] } }} />);
    expect(screen.getByRole("status")).toHaveTextContent(/^Heading is hard to read$/);
    expect(screen.getByText("Heading: 1.0:1 on the background")).toBeInTheDocument();
    expect(screen.getByText("Needs 3:1. 1 more to fix.")).toBeInTheDocument();
  });

  it("announces only the verdict, so a colour drag that keeps failing stays quiet", () => {
    const { rerender } = render(<ReadabilityCheck design={design(BLANK.design.background, [heading("#FFFFFF")])} />);
    const status = screen.getByRole("status");
    rerender(<ReadabilityCheck design={design(BLANK.design.background, [heading("#EEEEEE")])} />);
    expect(screen.getByText(/^Heading: 1\.\d:1 on the background$/)).not.toHaveTextContent("1.0:1");
    expect(status).toHaveTextContent(/^Heading is hard to read$/);
  });

  it("keeps one status region mounted as the verdict changes", () => {
    const { rerender } = render(<ReadabilityCheck design={BLANK.design} />);
    const status = screen.getByRole("status");
    rerender(<ReadabilityCheck design={design(BLANK.design.background, [heading("#FFFFFF")])} />);
    expect(screen.getByRole("status")).toBe(status);
    expect(status).toHaveTextContent("Heading is hard to read");
  });

  it("rates a photo by its average colour once sampled", async () => {
    getColorAsync.mockResolvedValue({ hex: "#f5f5f5" });
    render(<ReadabilityCheck design={design(photo("/templates/light.jpg"), [heading("#FFFFFF")])} />);
    // Before sampling finishes, the dark backdrop stands in for the photo.
    expect(screen.getByRole("status")).toHaveTextContent("Check readability over your photo");
    expect(await screen.findByText(/^Heading: 1\.\d:1 on the background$/)).toBeInTheDocument();
    expect(getColorAsync).toHaveBeenCalledWith("/templates/light.jpg", expect.objectContaining({ algorithm: "simple" }));
  });

  it("samples each photo once", async () => {
    getColorAsync.mockResolvedValue({ hex: "#f5f5f5" });
    const d = design(photo("/templates/once.jpg"), [heading("#FFFFFF")]);
    const { unmount } = render(<ReadabilityCheck design={d} />);
    await screen.findByText(/^Heading: 1\.\d:1/);
    unmount();
    render(<ReadabilityCheck design={d} />);
    expect(screen.getByText(/^Heading: 1\.\d:1/)).toBeInTheDocument();
    expect(getColorAsync).toHaveBeenCalledTimes(1);
  });

  it("stays on the backdrop when sampling throws, and doesn't sample that photo again", async () => {
    getColorAsync.mockRejectedValue(new Error("network"));
    const d = design(photo("/templates/broken.jpg", "#F5F5F5"), [heading("#111111")]);
    const { unmount } = render(<ReadabilityCheck design={d} />);
    await act(async () => {});
    // Rated on the light backdrop, where dark text passes.
    expect(screen.getByRole("status")).toHaveTextContent("Check readability over your photo");
    unmount();
    render(<ReadabilityCheck design={d} />);
    await act(async () => {});
    expect(getColorAsync).toHaveBeenCalledTimes(1);
  });

  it("ignores the colour of a sample that reports an error (a tainted canvas)", async () => {
    getColorAsync.mockResolvedValue({ hex: "#000000", error: new Error("tainted") });
    // Dark text on a light backdrop passes; it would fail if the black hex were used.
    const d = design(photo("/templates/tainted.jpg", "#F5F5F5"), [heading("#111111")]);
    render(<ReadabilityCheck design={d} />);
    await act(async () => {});
    expect(getColorAsync).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent("Check readability over your photo");
  });
});
