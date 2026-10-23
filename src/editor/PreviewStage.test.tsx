// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStore } from "@/lib/store";
import type { Selection } from "@/lib/types";
import type { FitCheck } from "./checks/useFitCheck";
import { PreviewStage } from "./PreviewStage";

// The fit check is a stub until T-028, so tests drive its result directly.
const fit = vi.hoisted(() => ({ current: null as FitCheck | null }));
vi.mock("./checks/useFitCheck", () => ({
  useFitCheck: () => fit.current ?? { tooTall: false, height: null, probe: null },
}));

const HEADING_ID = "sponsor-heading";

beforeEach(() => {
  localStorage.clear();
  useStore.setState(useStore.getInitialState(), true);
  useStore.persist.clearStorage(); // drop the write the reset scheduled
  fit.current = null;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const state = () => useStore.getState();
const stage = () => screen.getByRole("region", { name: "Preview" });
const switcher = () => screen.getByRole("group", { name: "Preview screen" });
const heading = () => screen.getByRole("heading", { level: 1 });
// SplashPage's root, the only element in the stage that isolates its own stacking context. It
// sits directly in the frame's scroller.
const splashRoot = () => {
  const root = stage().querySelector<HTMLElement>("[style*='isolation']");
  if (!root) throw new Error("no splash root");
  return root;
};

function setTermsMode(mode: "checkbox" | "off") {
  act(() => {
    state().updateForm({ terms: { mode } });
  });
}

describe("PreviewStage", () => {
  it("shows no contrast check, even for white text on white (T-046)", () => {
    state().updateBackground({ type: "colour", colour: "#FFFFFF" });
    state().updateBlock(HEADING_ID, { colour: "#FFFFFF" });
    render(<PreviewStage />);
    expect(screen.queryByText(/readab|hard to read|\d:1/i)).not.toBeInTheDocument();
    // The stage's only live region holds no notice: the fit check is stubbed off and nothing failed.
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("renders the design in the phone frame and follows every store change", () => {
    render(<PreviewStage />);
    expect(heading()).toHaveTextContent("FREE WIFI");
    expect(screen.getByText("375 × 740, iPhone login sheet")).toBeInTheDocument();

    act(() => {
      state().updateBlock(HEADING_ID, { text: "HELLO" });
    });
    expect(heading()).toHaveTextContent("HELLO");
  });

  it("renders the design in the browser frame with the design name in its bar", () => {
    act(() => state().setDevice("desktop"));
    render(<PreviewStage />);
    expect(heading()).toHaveTextContent("FREE WIFI");
    expect(
      screen.getByText(
        "1280 × 800 laptop browser. The content column stays 420 px wide; the photo fills the window.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("375 × 740, iPhone login sheet")).not.toBeInTheDocument();
    expect(screen.getByText("Sign in to Guest WiFi")).toBeInTheDocument();

    act(() => {
      state().setName("Harbourside WiFi");
      state().updateBlock(HEADING_ID, { text: "WELCOME" });
    });
    expect(screen.getByText("Sign in to Harbourside WiFi")).toBeInTheDocument();
    expect(heading()).toHaveTextContent("WELCOME");
  });

  it("selects a block clicked in the preview, and the background when the page itself is clicked", () => {
    render(<PreviewStage />);
    fireEvent.click(heading());
    expect(state().selection).toEqual<Selection>({ kind: "block", id: HEADING_ID });
    expect(screen.getByText("Heading")).toBeInTheDocument(); // the name chip

    fireEvent.click(splashRoot());
    expect(state().selection).toEqual<Selection>({ kind: "background" });
    expect(screen.queryByText("Heading")).not.toBeInTheDocument();
  });

  it("offers all four screens while terms are on, and switches the screen", () => {
    render(<PreviewStage />);
    const buttons = within(switcher()).getAllByRole("button");
    expect(buttons.map((b) => b.textContent)).toEqual(["Landing", "Terms", "Error", "Connected"]);
    expect(within(switcher()).getByRole("button", { name: "Landing" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(within(switcher()).getByRole("button", { name: "Terms" }));
    expect(state().screen).toBe("terms");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(within(switcher()).getByRole("button", { name: "Terms" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(within(switcher()).getByRole("button", { name: "Landing" }));
    expect(state().screen).toBe("landing");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("hides Terms from the switcher while terms are off", () => {
    setTermsMode("off");
    render(<PreviewStage />);
    const buttons = within(switcher()).getAllByRole("button");
    // Sponsor still has fields, so Error stays.
    expect(buttons.map((b) => b.textContent)).toEqual(["Landing", "Error", "Connected"]);

    setTermsMode("checkbox");
    expect(within(switcher()).getByRole("button", { name: "Terms" })).toBeInTheDocument();
  });

  it("keeps the phone's terms sheet inside a non-scrolling shell that contains fixed descendants", () => {
    act(() => state().setScreen("terms"));
    render(<PreviewStage />);
    const scroller = splashRoot().parentElement;
    const shell = scroller?.parentElement;
    expect(scroller).toHaveClass("overflow-y-auto");
    expect(shell).toHaveClass("overflow-hidden", "h-[740px]", "w-[375px]");
    expect(shell).not.toHaveClass("overflow-y-auto");
    // jsdom has no layout, so this pins the style that makes the shell the sheet's containing block.
    expect(shell?.getAttribute("style")).toContain("contain: layout");
  });

  it("scales the 1280×800 page to the frame's measured width on a transformed, non-scrolling shell", () => {
    let report: (width: number) => void = () => {};
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: ResizeObserverCallback) {
          report = (width) =>
            callback([{ contentRect: { width } } as ResizeObserverEntry], this as never);
        }
        observe = observe;
        unobserve() {}
        disconnect = disconnect;
      },
    );
    act(() => state().setDevice("desktop"));
    const { unmount } = render(<PreviewStage />);
    expect(observe).toHaveBeenCalledTimes(1);

    act(() => report(640));
    const scroller = splashRoot().parentElement;
    const shell = scroller?.parentElement;
    const box = shell?.parentElement;
    expect(scroller).toHaveClass("overflow-y-auto");
    expect(shell).toHaveStyle({ width: "1280px", height: "800px", transform: "scale(0.5)" });
    expect(box).toHaveStyle({ height: "400px" });

    // Never scaled up past 1280px.
    act(() => report(2000));
    expect(shell).toHaveStyle({ transform: "scale(1)" });
    expect(box).toHaveStyle({ height: "800px" });

    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it("shows the save-failure notice while saveFailed is set", () => {
    render(<PreviewStage />);
    const notice = "Couldn't save locally. Your changes stay in this tab only.";
    expect(screen.queryByText(notice)).not.toBeInTheDocument();
    act(() => useStore.setState({ saveFailed: true }));
    expect(screen.getByText(notice)).toBeInTheDocument();
    act(() => useStore.setState({ saveFailed: false }));
    expect(screen.queryByText(notice)).not.toBeInTheDocument();
  });

  it("shows the restore-failure notice until it's dismissed", () => {
    act(() => useStore.setState({ restoreFailed: true }));
    render(<PreviewStage />);
    expect(screen.getByText("Couldn't restore your saved design.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(state().restoreFailed).toBe(false);
    expect(screen.queryByText("Couldn't restore your saved design.")).not.toBeInTheDocument();
  });

  it("draws the fold and the amber note when the fit check says the design is too tall", () => {
    fit.current = { tooTall: true, height: 720, probe: <div data-probe="fit" /> };
    const { container } = render(<PreviewStage />);
    expect(screen.getByText("Too tall for small phones")).toBeInTheDocument();
    expect(screen.getByText(/guests have to scroll to reach Connect/)).toBeInTheDocument();
    const fold = screen.getByText("Small-phone fold");
    // The fold sits in the scroller, so it moves with the page.
    expect(splashRoot().parentElement).toContainElement(fold);
    expect(container.querySelector("[data-probe='fit']")).toBeInTheDocument();

    // Not over the terms sheet.
    act(() => state().setScreen("terms"));
    expect(screen.queryByText("Small-phone fold")).not.toBeInTheDocument();
  });

  it("shows neither fold nor note while the design fits", () => {
    render(<PreviewStage />);
    expect(stage()).toBeInTheDocument();
    expect(screen.queryByText("Small-phone fold")).not.toBeInTheDocument();
    expect(screen.queryByText("Too tall for small phones")).not.toBeInTheDocument();
  });
});
