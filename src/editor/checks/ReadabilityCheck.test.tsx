// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
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

const photo = (src: string): BackgroundSpec => ({
  type: "image",
  src,
  fit: "fill",
  zoom: 1,
  focus: { x: 50, y: 50 },
  backdrop: "#1E293B",
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
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Heading: 1.0:1 on the background");
    expect(status).toHaveTextContent("Needs 3:1. 1 more to fix.");
  });

  it("keeps one status region mounted as the verdict changes", () => {
    const { rerender } = render(<ReadabilityCheck design={BLANK.design} />);
    const status = screen.getByRole("status");
    rerender(<ReadabilityCheck design={design(BLANK.design.background, [heading("#FFFFFF")])} />);
    expect(screen.getByRole("status")).toBe(status);
    expect(status).toHaveTextContent("Heading: 1.0:1");
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
    expect(screen.getByRole("status")).toHaveTextContent(/^Heading: 1\.\d:1/);
    expect(getColorAsync).toHaveBeenCalledTimes(1);
  });

  it("stays approximate when the photo can't be sampled", async () => {
    getColorAsync.mockRejectedValue(new Error("tainted canvas"));
    render(<ReadabilityCheck design={design(photo("/templates/broken.jpg"), [heading("#FFFFFF")])} />);
    await vi.waitFor(() => expect(getColorAsync).toHaveBeenCalled());
    await Promise.resolve();
    expect(screen.getByRole("status")).toHaveTextContent("Check readability over your photo");
  });
});
