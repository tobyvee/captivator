// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Design } from "@/lib/design-schema";
import { SPONSOR } from "@/lib/templates";
import type { SplashPageProps } from "@/splash/SplashPage";
import { useFitCheck } from "./useFitCheck";

// jsdom has no layout, so SplashPage is replaced by a bare root whose props the tests read, and
// ResizeObserver by a stub the tests fire. Real measurement is on the manual checklist (T-029).
const rendered = vi.hoisted(() => ({ props: null as SplashPageProps | null }));
vi.mock("@/splash/SplashPage", () => ({
  SplashPage: (props: SplashPageProps) => {
    rendered.props = props;
    return <div data-testid="splash-root" />;
  },
}));

let observed: Element[] = [];
let fire: () => void = () => {};
const disconnect = vi.fn();

beforeEach(() => {
  observed = [];
  disconnect.mockReset();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: ResizeObserverCallback) {
        fire = () => act(() => callback([], this as never));
      }
      observe(el: Element) {
        observed.push(el);
      }
      unobserve() {}
      disconnect = disconnect;
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function Harness({ design }: { design: Design }) {
  const fit = useFitCheck(design);
  return (
    <>
      <output data-testid="result">{`${fit.tooTall} ${fit.height}`}</output>
      {fit.probe}
    </>
  );
}

const result = () => screen.getByTestId("result").textContent;

function setContentHeight(px: number) {
  Object.defineProperty(screen.getByTestId("splash-root"), "scrollHeight", {
    configurable: true,
    value: px,
  });
  fire();
}

describe("useFitCheck", () => {
  it("renders the landing page compact in preview mode, outside a frame", () => {
    render(<Harness design={SPONSOR.design} />);
    expect(rendered.props).toMatchObject({ design: SPONSOR.design, screen: "landing", mode: "preview", compact: true });
    expect(rendered.props?.inFrame).toBeUndefined();
  });

  it("keeps the probe off screen, hidden from screen readers and out of clicks and focus", () => {
    render(<Harness design={SPONSOR.design} />);
    const probe = screen.getByTestId("splash-root").parentElement!;
    expect(probe).toHaveAttribute("aria-hidden", "true");
    expect(probe).toHaveAttribute("inert");
    expect(probe).toHaveStyle({
      position: "absolute",
      left: "-10000px",
      top: "0px",
      width: "375px",
      height: "0px",
      overflow: "hidden",
      visibility: "hidden",
      pointerEvents: "none",
    });
  });

  it("observes the splash root and warns only once its content passes 600px", () => {
    render(<Harness design={SPONSOR.design} />);
    expect(observed).toEqual([screen.getByTestId("splash-root")]);
    expect(result()).toBe("false null");

    setContentHeight(600);
    expect(result()).toBe("false 600");
    setContentHeight(601);
    expect(result()).toBe("true 601");
    setContentHeight(420);
    expect(result()).toBe("false 420");
  });

  it("passes design changes to the probe without re-observing", () => {
    const { rerender } = render(<Harness design={SPONSOR.design} />);
    const taller: Design = {
      ...SPONSOR.design,
      blocks: [...SPONSOR.design.blocks, { id: "extra", kind: "text", text: "More", role: "body", colour: "#000000", size: 16 }],
    };
    rerender(<Harness design={taller} />);
    expect(rendered.props?.design).toBe(taller);
    expect(observed).toHaveLength(1);
  });

  it("stops observing on unmount", () => {
    const { unmount } = render(<Harness design={SPONSOR.design} />);
    unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("never warns where ResizeObserver is missing", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    render(<Harness design={SPONSOR.design} />);
    expect(result()).toBe("false null");
  });
});
