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

  it("drops invalid entries and expands short hex", () => {
    expect(dedupePalette(["not-a-colour", "#abc", "#12345", "#AABBCC"])).toEqual(["#AABBCC"]);
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

  it("is deterministic and returns nothing for no pixels", () => {
    const pixels: Rgb[] = Array.from({ length: 64 }, (_, i) => [i * 4, 255 - i * 4, (i * 37) % 256]);
    expect(kmeans(pixels, 4)).toEqual(kmeans(pixels, 4));
    expect(kmeans([], 4)).toEqual([]);
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
