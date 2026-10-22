import { describe, expect, it } from "vitest";
import { dedupePalette, extractPalette, kmeans, paletteFromPixels, type Rgb } from "./palette";

const repeat = (rgb: Rgb, n: number): Rgb[] => Array.from({ length: n }, () => [...rgb] as Rgb);
const rgba = (pixels: [number, number, number, number][]) => new Uint8ClampedArray(pixels.flat());

describe("dedupePalette", () => {
  it("drops near-identical colours", () => {
    expect(dedupePalette(["#FF0000", "#FE0101"])).toEqual(["#FF0000"]);
  });

  it("keeps distinct colours in their original order, uppercased", () => {
    expect(dedupePalette(["#0f2a44", "#facc15", "#ffffff"])).toEqual(["#0F2A44", "#FACC15", "#FFFFFF"]);
  });

  it("keeps the first of a near-duplicate pair wherever the pair falls", () => {
    expect(dedupePalette(["#00FF00", "#FF0000", "#01FE00", "#0000FF"])).toEqual(["#00FF00", "#FF0000", "#0000FF"]);
  });

  it("returns at most 4, or at most max", () => {
    const colours = ["#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", "#FFFF00"];
    expect(dedupePalette(colours)).toEqual(["#000000", "#FFFFFF", "#FF0000", "#00FF00"]);
    expect(dedupePalette(colours, 2)).toEqual(["#000000", "#FFFFFF"]);
  });

  it.each(["not-a-colour", "#abc", "#12345", "#1234567", "aabbcc", "#ggggggg"])("drops %j, which isn't 6-digit hex", (colour) => {
    expect(dedupePalette([colour])).toEqual([]);
  });

  it("keeps a valid colour after invalid ones, uppercased", () => {
    expect(dedupePalette(["#abc", "#12345", "#aabbcc"])).toEqual(["#AABBCC"]);
  });
});

describe("kmeans", () => {
  it("returns the centres of two well-separated groups", () => {
    const pixels: Rgb[] = [
      [250, 10, 10],
      [254, 0, 4],
      [246, 6, 0],
      [0, 10, 240],
      [10, 0, 250],
      [5, 5, 245],
      [5, 5, 245],
    ];
    expect(kmeans(pixels, 2)).toEqual([
      [5, 5, 245],
      [250, 5, 5],
    ]);
  });

  it("drops empty clusters, so two colours give two centres even with k = 4", () => {
    const pixels = [...repeat([255, 0, 0], 10), ...repeat([0, 0, 255], 6)];
    expect(kmeans(pixels, 4)).toEqual([
      [255, 0, 0],
      [0, 0, 255],
    ]);
  });

  it("seeds from evenly spaced pixels, so a spread of colours gives fixed centres", () => {
    const pixels: Rgb[] = Array.from({ length: 64 }, (_, i) => [i * 4, 255 - i * 4, (i * 37) % 256]);
    expect(kmeans(pixels, 4)).toEqual([
      [176, 79, 62],
      [76, 179, 176],
      [200, 55, 197],
      [43, 212, 52],
    ]);
  });

  it("returns nothing for no pixels", () => {
    expect(kmeans([], 4)).toEqual([]);
  });

  it("still assigns pixels once when asked for zero iterations", () => {
    const pixels: Rgb[] = [
      [200, 0, 0],
      [1, 2, 3],
      [1, 2, 3],
    ];
    expect(kmeans(pixels, 2, 0)).toEqual([
      [1, 2, 3],
      [200, 0, 0],
    ]);
  });
});

describe("paletteFromPixels", () => {
  it("puts the dominant colour first and skips pixels with alpha below 128", () => {
    const data = rgba([
      ...Array.from({ length: 30 }, (): [number, number, number, number] => [0, 0, 0, 0]),
      ...Array.from({ length: 10 }, (): [number, number, number, number] => [15, 42, 68, 255]),
      ...Array.from({ length: 4 }, (): [number, number, number, number] => [250, 204, 21, 200]),
      ...Array.from({ length: 6 }, (): [number, number, number, number] => [0, 255, 0, 100]),
    ]);
    expect(paletteFromPixels(data)).toEqual(["#0F2A44", "#FACC15"]);
  });

  it("puts the dominant colour first even when it isn't the largest k-means cluster", () => {
    // fast-average-color buckets the two identical reds together, while k-means groups the
    // seven blues into clusters and the largest of those is blue.
    const rgb: Rgb[] = [
      [220, 30, 30],
      [220, 30, 30],
      [0, 0, 100],
      [0, 0, 125],
      [0, 0, 150],
      [0, 0, 175],
      [0, 0, 200],
      [0, 0, 225],
      [0, 0, 250],
    ];
    expect(kmeans(rgb, 4)[0]).not.toEqual([220, 30, 30]);
    expect(paletteFromPixels(new Uint8ClampedArray(rgb.flatMap((p) => [...p, 255])))[0]).toBe("#DC1E1E");
  });

  it("returns nothing for a fully transparent image", () => {
    expect(paletteFromPixels(rgba([[255, 0, 0, 0], [0, 0, 0, 0]]))).toEqual([]);
  });
});

describe("extractPalette", () => {
  it("returns [] when the image can't be sampled", async () => {
    // Node has no Image or canvas, so this exercises the failure path.
    await expect(extractPalette("data:image/png;base64,AAAA")).resolves.toEqual([]);
  });
});
