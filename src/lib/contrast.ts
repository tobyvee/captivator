// WCAG contrast helpers. Pure: no DOM, no store. Colours are 6-digit hex (the schema enforces it).
import type { BackgroundSpec } from "./types";

const DARK_TEXT = "#111111";
const BLACK = "#000000";
const LIGHT_TEXT = "#FFFFFF";
type TextColour = typeof DARK_TEXT | typeof LIGHT_TEXT;
const LIGHT_ERROR = "#FECACA";
const DARK_ERROR = "#B91C1C";

function channels(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function toHex(rgb: number[]): string {
  return "#" + rgb.map((c) => c.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function linear(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const [r, g, b] = channels(hex);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** WCAG contrast ratio, 1 to 21, independent of argument order. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Large text is 24px and up, or 18.66px and up when bold (T-003-large-text-includes-bold.md). */
export function isLargeText(sizePx: number, weight: number): boolean {
  return sizePx >= 24 || (sizePx >= 18.66 && weight >= 700);
}

export function requiredRatio(sizePx: number, weight: number): 3 | 4.5 {
  return isLargeText(sizePx, weight) ? 3 : 4.5;
}

/** `over` composited on `base` at `alpha` (0–1), as uppercase hex. */
export function blend(base: string, over: string, alpha: number): string {
  const b = channels(base);
  const o = channels(over);
  return toHex(b.map((c, i) => Math.round(o[i] * alpha + c * (1 - alpha))));
}

/**
 * The colours text may sit on for a background. Photos use their average colour (or the
 * backdrop when none is known yet) blended with both overlay stops (T-006-overlay-two-stop-wash.md).
 * Photo results are approximate (general-photo-contrast-approximate.md).
 */
export function backgroundColours(bg: BackgroundSpec, photoAverage?: string): string[] {
  switch (bg.type) {
    case "colour":
      return [bg.colour];
    case "gradient":
      return [bg.from, bg.to];
    case "image": {
      const base = photoAverage ?? bg.backdrop;
      const { overlay } = bg;
      if (!overlay) return [base];
      return [blend(base, overlay.from, overlay.opacity), blend(base, overlay.to, overlay.opacity)];
    }
  }
}

/**
 * The background's main colour: its colour, the gradient's first stop or the photo's backdrop.
 * The terms sheet's colour and the Connected screen's tick use it (general-guest-screen-fallbacks.md).
 */
export function mainBackgroundColour(bg: BackgroundSpec): string {
  switch (bg.type) {
    case "colour":
      return bg.colour;
    case "gradient":
      return bg.from;
    case "image":
      return bg.backdrop;
  }
}

/** The lowest ratio of `fg` against any of `bgs`, which must be non-empty (`backgroundColours` always is). */
export function worstRatio(fg: string, bgs: string[]): number {
  return Math.min(...bgs.map((bg) => contrastRatio(fg, bg)));
}

function better<T extends string>(a: T, b: T, bg: string | string[]): T {
  const bgs = Array.isArray(bg) ? bg : [bg];
  return worstRatio(a, bgs) >= worstRatio(b, bgs) ? a : b;
}

/** Near-black or white, whichever reads better against every colour in `bg`. */
export function bestTextColour(bg: string | string[]): TextColour {
  return better<TextColour>(DARK_TEXT, LIGHT_TEXT, bg);
}

/**
 * `bestTextColour` where it reaches 4.5:1 on every colour in `bg`, otherwise pure black when that
 * reads better: on mid-tones such as #777777 neither near-black nor white reaches 4.5:1, but black
 * reaches at least 4.58:1 on any single colour (T-021-sheet-text-black-fallback.md).
 */
export function readableTextColour(bg: string | string[]): string {
  const best = bestTextColour(bg);
  const bgs = Array.isArray(bg) ? bg : [bg];
  return worstRatio(best, bgs) >= 4.5 ? best : better<string>(BLACK, best, bgs);
}

/** Light red on dark backgrounds, dark red on light ones, by the better worst-case ratio. */
export function bestErrorColour(bg: string | string[]): string {
  return better(LIGHT_ERROR, DARK_ERROR, bg);
}

/**
 * One decimal, e.g. "2.1:1". Rounds down, so a failing 4.48 shows as "4.4:1", never as a
 * passing-looking "4.5:1" (T-003-format-ratio-rounds-down.md).
 */
export function formatRatio(r: number): string {
  return `${(Math.floor(r * 10 + 1e-9) / 10).toFixed(1)}:1`;
}
