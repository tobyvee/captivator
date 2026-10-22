// Logo palette extraction: a few distinct swatches suggested from an uploaded logo or image.
// The result goes to the store's `logoPalette` only and is never written into `Design`.
// Sampling needs a browser canvas; everything after the pixel read is pure and unit-tested.

import { FastAverageColor } from "fast-average-color";

export type Rgb = [number, number, number];

const SAMPLE_SIZE = 32;
const CLUSTERS = 4;
const ITERATIONS = 8;
/** Pixels less opaque than this are background, not logo, and are left out of the sample. */
const MIN_ALPHA = 128;
/** Colours closer than this (CIE76 ΔE in Lab) count as the same swatch. */
const MIN_DELTA_E = 10;

const HEX6 = /^#([0-9a-f]{6})$/i;
const HEX3 = /^#([0-9a-f]{3})$/i;

let fac: FastAverageColor | undefined;

/** Up to 4 distinct `#RRGGBB` swatches from an image data URL. Any failure gives `[]`. */
export async function extractPalette(dataUrl: string): Promise<string[]> {
  try {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];
    ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    return paletteFromPixels(ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data);
  } catch {
    return [];
  }
}

/**
 * The palette for RGBA pixel data: fast-average-color's dominant colour, then the k-means
 * centres, deduplicated. Pixels with alpha below 128 are skipped by both.
 */
export function paletteFromPixels(data: ArrayLike<number>): string[] {
  const pixels: Rgb[] = [];
  for (let i = 0; i + 3 < data.length; i += 4) {
    if (data[i + 3] >= MIN_ALPHA) pixels.push([data[i], data[i + 1], data[i + 2]]);
  }
  if (pixels.length === 0) return [];

  // fast-average-color weights by alpha and counts transparent pixels toward the dominant
  // bucket, so it gets the same opaque-only sample as k-means.
  const opaque = new Uint8ClampedArray(pixels.length * 4);
  pixels.forEach(([r, g, b], i) => opaque.set([r, g, b, 255], i * 4));
  fac ??= new FastAverageColor();
  const [r, g, b] = fac.getColorFromArray4(opaque, { algorithm: "dominant" });

  return dedupePalette([toHex([r, g, b]), ...kmeans(pixels, CLUSTERS).map(toHex)]);
}

/**
 * Groups pixels into at most `k` clusters and returns their centres, largest cluster first.
 * Seeds are evenly spaced pixels, so the result is deterministic. Empty clusters are dropped,
 * so fewer than `k` centres come back when the pixels have fewer distinct colours.
 */
export function kmeans(pixels: Rgb[], k: number, iterations = ITERATIONS): Rgb[] {
  if (pixels.length === 0 || k < 1) return [];
  const n = Math.min(k, pixels.length);
  let centres: Rgb[] = Array.from({ length: n }, (_, i) => [...pixels[Math.floor((i * pixels.length) / n)]]);
  let sizes: number[] = [];

  for (let iter = 0; iter < iterations; iter++) {
    const sums = centres.map(() => [0, 0, 0]);
    sizes = centres.map(() => 0);
    for (const p of pixels) {
      const c = nearest(p, centres);
      sums[c][0] += p[0];
      sums[c][1] += p[1];
      sums[c][2] += p[2];
      sizes[c]++;
    }
    const next = centres.map((c, i): Rgb =>
      sizes[i] ? [sums[i][0] / sizes[i], sums[i][1] / sizes[i], sums[i][2] / sizes[i]] : c,
    );
    const settled = next.every((c, i) => distSq(c, centres[i]) === 0);
    centres = next;
    if (settled) break;
  }

  return centres
    .map((c, i) => ({ c, size: sizes[i] }))
    .filter(({ size }) => size > 0)
    .sort((a, b) => b.size - a.size)
    .map(({ c }) => c.map(Math.round) as Rgb);
}

/**
 * Uppercase `#RRGGBB` colours in their original order, dropping invalid hex and any colour
 * within ΔE 10 (CIE76) of one already kept, capped at `max`.
 */
export function dedupePalette(colours: string[], max = CLUSTERS): string[] {
  const kept: { hex: string; lab: Rgb }[] = [];
  for (const colour of colours) {
    if (kept.length >= max) break;
    const rgb = parseHex(colour);
    if (!rgb) continue;
    const lab = toLab(rgb);
    if (kept.some((k) => Math.sqrt(distSq(k.lab, lab)) < MIN_DELTA_E)) continue;
    kept.push({ hex: toHex(rgb), lab });
  }
  return kept.map((k) => k.hex);
}

function nearest(p: Rgb, centres: Rgb[]): number {
  let best = 0;
  let bestDist = Infinity;
  centres.forEach((c, i) => {
    const d = distSq(p, c);
    if (d < bestDist) {
      best = i;
      bestDist = d;
    }
  });
  return best;
}

function distSq(a: Rgb, b: Rgb): number {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}

function parseHex(colour: string): Rgb | null {
  const s = colour.trim();
  const six = HEX6.exec(s)?.[1] ?? HEX3.exec(s)?.[1].replace(/./g, "$&$&");
  if (!six) return null;
  return [0, 2, 4].map((i) => parseInt(six.slice(i, i + 2), 16)) as Rgb;
}

function toHex(rgb: Rgb): string {
  const byte = (v: number) => Math.min(255, Math.max(0, Math.round(v)));
  return "#" + rgb.map((v) => byte(v).toString(16).padStart(2, "0")).join("").toUpperCase();
}

/** sRGB to CIE Lab (D65). */
function toLab(rgb: Rgb): Rgb {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116);
  const [fx, fy, fz] = [f(x), f(y), f(z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
