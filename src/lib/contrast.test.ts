import { describe, expect, it } from "vitest";
import {
  backgroundColours,
  bestErrorColour,
  bestTextColour,
  blend,
  contrastRatio,
  formatRatio,
  isLargeText,
  luminance,
  requiredRatio,
  worstRatio,
} from "./contrast";
import type { BackgroundSpec, ImageBackground } from "./types";

const NAVY = "#0F2A44";
const YELLOW = "#FACC15";

const photo = (overlay: ImageBackground["overlay"]): ImageBackground => ({
  type: "image",
  src: "data:image/png;base64,iVBORw0KGgo=",
  fit: "fill",
  zoom: 1,
  focus: { x: 50, y: 50 },
  backdrop: "#808080",
  overlay,
});

describe("luminance", () => {
  it("is 1 for white and 0 for black", () => {
    expect(luminance("#FFFFFF")).toBe(1);
    expect(luminance("#000000")).toBe(0);
  });

  it("accepts lowercase hex", () => {
    expect(luminance("#ffffff")).toBe(1);
  });
});

describe("contrastRatio", () => {
  it("is 21:1 for black on white, in either order", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#FFFFFF", "#000000")).toBeCloseTo(21, 5);
  });

  it("fails 4.5:1 for #777777 on white", () => {
    const r = contrastRatio("#777777", "#FFFFFF");
    expect(r).toBeCloseTo(4.48, 2);
    expect(r).toBeLessThan(4.5);
  });
});

describe("large text", () => {
  it("passes at 3:1 from 24px regular", () => {
    expect(isLargeText(24, 400)).toBe(true);
    expect(requiredRatio(24, 400)).toBe(3);
  });

  it("passes at 3:1 from 18.66px bold", () => {
    expect(requiredRatio(19, 800)).toBe(3);
    expect(requiredRatio(18.66, 700)).toBe(3);
  });

  it("needs 4.5:1 below the thresholds", () => {
    expect(requiredRatio(19, 400)).toBe(4.5);
    expect(requiredRatio(18, 800)).toBe(4.5);
    expect(requiredRatio(23, 600)).toBe(4.5);
  });
});

describe("worstRatio", () => {
  it("takes the worse gradient stop: white on white→black is about 1:1", () => {
    const bg: BackgroundSpec = { type: "gradient", from: "#FFFFFF", to: "#000000", direction: "down" };
    expect(worstRatio("#FFFFFF", backgroundColours(bg))).toBeCloseTo(1, 5);
  });
});

describe("blend", () => {
  it("returns the base at 0 and the overlay at 1", () => {
    expect(blend("#336699", "#000000", 0)).toBe("#336699");
    expect(blend("#336699", "#000000", 1)).toBe("#000000");
  });

  it("mixes channels at partial alpha", () => {
    expect(blend("#FFFFFF", "#000000", 0.5)).toBe("#808080");
  });
});

describe("backgroundColours", () => {
  it("returns the fill for a colour background", () => {
    expect(backgroundColours({ type: "colour", colour: NAVY })).toEqual([NAVY]);
  });

  it("returns both stops for a gradient", () => {
    expect(backgroundColours({ type: "gradient", from: NAVY, to: YELLOW, direction: "diagonal" })).toEqual([
      NAVY,
      YELLOW,
    ]);
  });

  it("blends the backdrop with both overlay stops when there is no photo average", () => {
    const bg = photo({ from: "#FFFFFF", to: "#000000", opacity: 0.5 });
    expect(backgroundColours(bg)).toEqual([blend("#808080", "#FFFFFF", 0.5), blend("#808080", "#000000", 0.5)]);
  });

  it("prefers the photo average over the backdrop", () => {
    const bg = photo({ from: "#000000", to: "#000000", opacity: 0.5 });
    expect(backgroundColours(bg, "#FFFFFF")).toEqual(["#808080", "#808080"]);
  });

  it("returns the base alone when there is no overlay", () => {
    expect(backgroundColours(photo(null))).toEqual(["#808080"]);
    expect(backgroundColours(photo(null), "#123456")).toEqual(["#123456"]);
  });
});

describe("bestTextColour", () => {
  it("gives white on navy and near-black on yellow", () => {
    expect(bestTextColour(NAVY)).toBe("#FFFFFF");
    expect(bestTextColour(YELLOW)).toBe("#111111");
  });

  it("uses the worst case across several colours", () => {
    // Near-black loses badly on navy, white only moderately on yellow.
    expect(bestTextColour([NAVY, YELLOW])).toBe("#FFFFFF");
  });
});

describe("bestErrorColour", () => {
  it("gives light red on navy and dark red on white", () => {
    expect(bestErrorColour(NAVY)).toBe("#FECACA");
    expect(bestErrorColour("#FFFFFF")).toBe("#B91C1C");
  });
});

describe("formatRatio", () => {
  it("shows one decimal", () => {
    expect(formatRatio(2.14)).toBe("2.1:1");
    expect(formatRatio(21)).toBe("21.0:1");
    expect(formatRatio(4.5)).toBe("4.5:1");
  });

  it("never rounds a failing ratio up to a passing-looking one", () => {
    expect(formatRatio(contrastRatio("#777777", "#FFFFFF"))).toBe("4.4:1");
  });
});
