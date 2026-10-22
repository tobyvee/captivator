// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BLANK, type Design } from "@/lib/design-schema";
import { useStore } from "@/lib/store";
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

const photo = (src: string, backdrop = "#1E293B", fit: "fill" | "fit" = "fill"): BackgroundSpec => ({
  type: "image",
  src,
  fit,
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

describe("ReadabilityCheck Fix", () => {
  const WHITE = { type: "colour", colour: "#FFFFFF" } as const;
  const NAVY = { type: "colour", colour: "#0F172A" } as const;
  const state = () => useStore.getState();
  const history = () => useStore.temporal.getState();
  const anyFix = () => screen.queryByRole("button", { name: /^Fix / });

  // The editor passes the store's design, so a Fix shows up in the line straight away.
  function Harness() {
    return <ReadabilityCheck design={useStore((s) => s.design)} />;
  }

  // Starts from `d` with empty history, so each Fix is the only change.
  const start = (d: Design) => {
    localStorage.clear();
    useStore.setState({ ...useStore.getInitialState(), design: d }, true);
    useStore.persist.clearStorage();
    history().clear();
    render(<Harness />);
  };

  // Undo history folds design changes under 400ms apart into one step, so tests move the clock.
  let now = 0;
  beforeEach(() => {
    now = 1_000_000;
    vi.spyOn(Date, "now").mockImplementation(() => now);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("turns white text on white near-black, and the line then reads all text is readable", async () => {
    const user = userEvent.setup();
    start(design(WHITE, [heading("#FFFFFF")]));
    expect(screen.getByRole("status")).toHaveTextContent("Heading is hard to read");

    await user.click(screen.getByRole("button", { name: "Fix Heading" }));
    expect(state().design.blocks[0]).toMatchObject({ colour: "#111111" });
    expect(screen.getByRole("status")).toHaveTextContent("All text is readable");
    expect(anyFix()).not.toBeInTheDocument();
  });

  it("makes each Fix one undo step when Fixes are at least 400ms apart", async () => {
    const user = userEvent.setup();
    const d = design(WHITE, [heading("#FFFFFF")]);
    start({ ...d, form: { ...d.form, terms: { ...d.form.terms, mode: "checkbox", textColour: "#FFFFFF" } } });

    await user.click(screen.getByRole("button", { name: "Fix Heading" }));
    now += 1000;
    await user.click(screen.getByRole("button", { name: "Fix Terms checkbox" }));
    expect(state().design.form.terms.textColour).toBe("#111111");
    expect(history().pastStates).toHaveLength(2);

    act(() => history().undo());
    expect(state().design.form.terms.textColour).toBe("#FFFFFF");
    expect(state().design.blocks[0]).toMatchObject({ colour: "#111111" });
    act(() => history().undo());
    expect(state().design.blocks[0]).toMatchObject({ colour: "#FFFFFF" });
  });

  it("applies one Fix for a double-click, though the next failure's Fix takes its place", async () => {
    const user = userEvent.setup();
    const d = design(WHITE, [heading("#FFFFFF")]);
    start({ ...d, form: { ...d.form, terms: { ...d.form.terms, mode: "checkbox", textColour: "#FFFFFF" } } });

    await user.dblClick(screen.getByRole("button", { name: "Fix Heading" }));
    expect(state().design.blocks[0]).toMatchObject({ colour: "#111111" });
    expect(state().design.form.terms.textColour).toBe("#FFFFFF");
    expect(screen.getByRole("button", { name: "Fix Terms checkbox" })).toBeInTheDocument();
  });

  it("applies the Fix from the keyboard", async () => {
    const user = userEvent.setup();
    start(design(WHITE, [heading("#FFFFFF")]));

    await user.tab();
    expect(screen.getByRole("button", { name: "Fix Heading" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(state().design.blocks[0]).toMatchObject({ colour: "#111111" });
  });

  it("fixes a solid button's label against the button's own fill", async () => {
    const user = userEvent.setup();
    const d = design(WHITE);
    start({ ...d, form: { ...d.form, button: { ...d.form.button, bg: "#1E3A8A", fg: "#1E40AF" } } });

    await user.click(screen.getByRole("button", { name: "Fix Connect button" }));
    expect(state().design.form.button.fg).toBe("#FFFFFF");
    expect(history().pastStates).toHaveLength(1);
  });

  it("fixes an outline button's label against the page", async () => {
    const user = userEvent.setup();
    const d = design(NAVY);
    start({ ...d, form: { ...d.form, button: { ...d.form.button, variant: "outline", bg: "#FFFFFF", fg: "#111111" } } });

    await user.click(screen.getByRole("button", { name: "Fix Connect button" }));
    expect(state().design.form.button.fg).toBe("#FFFFFF");
  });

  it("fixes the field text against the field", async () => {
    const user = userEvent.setup();
    const d = design(NAVY);
    start({ ...d, form: { ...d.form, fields: ["email"], inputBg: "#F1F5F9", inputText: "#CBD5E1" } });

    expect(screen.getByText(/^Field text: /)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fix Field text" }));
    expect(state().design.form.inputText).toBe("#111111");
  });

  it("offers no Fix when the fields' edge blends into the page", () => {
    // Blank with a field: white inputs on a white page, with readable text inside them.
    start({ ...BLANK.design, form: { ...BLANK.design.form, fields: ["email"] } });
    expect(screen.getByText(/^Fields: 1\.0:1 on the background$/)).toBeInTheDocument();
    expect(anyFix()).not.toBeInTheDocument();
  });

  it("offers no Fix when the text already has the best colour it can get", () => {
    // Black to white: no colour reads on both stops, and near-black is already the best pick.
    const d = design({ type: "gradient", from: "#000000", to: "#FFFFFF", direction: "down" });
    start({ ...d, form: { ...d.form, terms: { ...d.form.terms, mode: "checkbox", textColour: "#111111" } } });
    expect(screen.getByText(/^Terms checkbox: /)).toBeInTheDocument();
    expect(anyFix()).not.toBeInTheDocument();
  });

  it("offers no Fix when every colour it could pick reads worse than the current one", () => {
    // #777777 reads at 4.48:1 on the white stop; near-black and black would read about 1:1 on the
    // black one, so a Fix would make the text harder to read.
    const d = design({ type: "gradient", from: "#000000", to: "#FFFFFF", direction: "down" }, [
      { ...heading("#777777"), role: "body", size: 16 },
    ]);
    start(d);
    expect(screen.getByText("Text: 4.4:1 on the background")).toBeInTheDocument();
    expect(anyFix()).not.toBeInTheDocument();
  });

  it("offers the Fix for a later failure when the first has none, and names what it fixes", async () => {
    const user = userEvent.setup();
    // No colour reads better than the heading's on black to white, but the button's label can be fixed.
    const d = design({ type: "gradient", from: "#000000", to: "#FFFFFF", direction: "down" }, [heading("#111111")]);
    start({ ...d, form: { ...d.form, button: { ...d.form.button, bg: "#1E3A8A", fg: "#1E40AF" } } });
    expect(screen.getByText(/^Heading: 1\.1:1 on the background$/)).toBeInTheDocument();

    const fix = screen.getByRole("button", { name: "Fix Connect button" });
    expect(fix).toHaveTextContent(/^Fix Connect button$/);
    await user.click(fix);
    expect(state().design.form.button.fg).toBe("#FFFFFF");
    expect(state().design.blocks[0]).toMatchObject({ colour: "#111111" });
  });

  it("picks for a fitted photo's backdrop as well as its average", async () => {
    getColorAsync.mockResolvedValue({ hex: "#333333" });
    const user = userEvent.setup();
    // On the dark average alone white reads best (so there'd be no Fix), but white fails on the
    // white backdrop around it. Neither near-black nor white reaches 4.5:1 on both, so black wins.
    start(design(photo("/templates/fitted.jpg", "#FFFFFF", "fit"), [heading("#FFFFFF")]));
    await screen.findByText(/^Heading: 1\.0:1 on the background$/);

    await user.click(screen.getByRole("button", { name: "Fix Heading" }));
    expect(state().design.blocks[0]).toMatchObject({ colour: "#000000" });
    // Black is the best there is, but at 1.6:1 on the dark average the line still warns.
    expect(screen.getByRole("status")).toHaveTextContent("Heading is hard to read");
    expect(screen.getByText("Heading: 1.6:1 on the background")).toBeInTheDocument();
    expect(anyFix()).not.toBeInTheDocument();
  });
});
