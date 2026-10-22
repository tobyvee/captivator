import { afterEach, describe, expect, it, vi } from "vitest";
import {
  LONG_EDGE,
  MAX_UPLOAD_BYTES,
  MSG_TOO_BIG,
  MSG_UNREADABLE,
  MSG_WRONG_TYPE,
  UploadError,
  encodeAt,
  inlineFromUrl,
  processUpload,
  reencodeToFit,
  sniffImageType,
  targetSize,
} from "./images";

const bytes = (...parts: (number[] | string)[]) =>
  new Uint8Array(parts.flatMap((p) => (typeof p === "string" ? Array.from(p, (c) => c.charCodeAt(0)) : p)));

const PNG = bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], [0, 0, 0, 13]);
const JPEG = bytes([0xff, 0xd8, 0xff, 0xe0, 0, 0x10], "JFIF");
const WEBP = bytes("RIFF", [0x24, 0, 0, 0], "WEBPVP8 ");
const SVG = bytes('<svg xmlns="http://www.w3.org/2000/svg"/>');
const MB = 1024 * 1024;

/** Asserts a customer-facing UploadError with exactly this message, not just any Error. */
async function expectUploadError(promise: Promise<unknown>, message: string) {
  const err = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(UploadError);
  expect(err).toHaveProperty("message", message);
}

describe("targetSize", () => {
  it("caps the long edge of a landscape image and keeps its aspect ratio", () => {
    expect(targetSize(4000, 3000, LONG_EDGE.image)).toEqual({ width: 600, height: 450 });
  });

  it("caps the long edge of a portrait image at the background size", () => {
    expect(targetSize(3024, 4032, LONG_EDGE.background)).toEqual({ width: 1200, height: 1600 });
  });

  it("never upscales a small image", () => {
    expect(targetSize(320, 200, LONG_EDGE.background)).toEqual({ width: 320, height: 200 });
    expect(targetSize(600, 600, LONG_EDGE.image)).toEqual({ width: 600, height: 600 });
  });

  it("keeps a very thin image at least 1px on its short edge", () => {
    expect(targetSize(10000, 2, 600)).toEqual({ width: 600, height: 1 });
  });
});

describe("sniffImageType", () => {
  it("recognises PNG, JPEG, WebP and SVG from their bytes", () => {
    expect(sniffImageType(PNG)).toBe("png");
    expect(sniffImageType(JPEG)).toBe("jpeg");
    expect(sniffImageType(WEBP)).toBe("webp");
    expect(sniffImageType(SVG)).toBe("svg");
  });

  it("recognises SVG after a BOM and whitespace, and with an XML declaration", () => {
    expect(sniffImageType(bytes([0xef, 0xbb, 0xbf], " \r\n\t<svg>"))).toBe("svg");
    expect(sniffImageType(bytes('<?xml version="1.0"?><svg/>'))).toBe("svg");
  });

  it("returns null for HTML, GIF, a RIFF that isn't WebP, and empty input", () => {
    expect(sniffImageType(bytes("<!DOCTYPE html><html>"))).toBeNull();
    expect(sniffImageType(bytes("<html><script>alert(1)</script>"))).toBeNull();
    expect(sniffImageType(bytes("GIF89a", [1, 0, 1, 0]))).toBeNull();
    expect(sniffImageType(bytes("RIFF", [0x24, 0, 0, 0], "WAVEfmt "))).toBeNull();
    expect(sniffImageType(new Uint8Array())).toBeNull();
  });
});

describe("processUpload", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // Every decoder the pipeline could reach. None exists in Node, so each is a spy.
  function stubDecoders() {
    const createImageBitmap = vi.fn(() => Promise.reject(new Error("cannot decode")));
    const Image = vi.fn();
    const createObjectURL = vi.fn(() => "blob:fake");
    vi.stubGlobal("createImageBitmap", createImageBitmap);
    vi.stubGlobal("Image", Image);
    vi.spyOn(URL, "createObjectURL").mockImplementation(createObjectURL);
    return { createImageBitmap, Image, createObjectURL };
  }

  function expectNoDecoding(d: ReturnType<typeof stubDecoders>) {
    expect(d.createImageBitmap).not.toHaveBeenCalled();
    expect(d.Image).not.toHaveBeenCalled();
    expect(d.createObjectURL).not.toHaveBeenCalled();
  }

  it("rejects a file over 10 MB with the size message before any decoding", async () => {
    const decoders = stubDecoders();
    const big = new File([PNG, new Uint8Array(MAX_UPLOAD_BYTES)], "photo.png", { type: "image/png" });
    const slice = vi.spyOn(big, "slice");

    await expectUploadError(processUpload(big, "background"), MSG_TOO_BIG);
    expect(slice).not.toHaveBeenCalled();
    expectNoDecoding(decoders);
  });

  it("accepts a file of exactly 10 MB as far as decoding", async () => {
    const decoders = stubDecoders();
    const file = new File([PNG, new Uint8Array(MAX_UPLOAD_BYTES - PNG.length)], "photo.png");

    await expectUploadError(processUpload(file, "image"), MSG_UNREADABLE);
    expect(decoders.createImageBitmap).toHaveBeenCalledOnce();
  });

  it("rejects HTML bytes even when the file claims to be a PNG", async () => {
    const decoders = stubDecoders();
    const file = new File([bytes("<html><script>alert(1)</script></html>")], "logo.png", { type: "image/png" });

    await expectUploadError(processUpload(file, "image"), MSG_WRONG_TYPE);
    expectNoDecoding(decoders);
  });

  it("rejects GIF bytes named as a JPEG", async () => {
    const decoders = stubDecoders();
    const file = new File([bytes("GIF89a", [1, 0, 1, 0])], "photo.jpg", { type: "image/jpeg" });

    await expectUploadError(processUpload(file, "background"), MSG_WRONG_TYPE);
    expectNoDecoding(decoders);
  });

  it("decodes bytes that sniff as an allowed type whatever the file claims", async () => {
    const decoders = stubDecoders();
    const file = new File([JPEG], "notes.txt", { type: "text/plain" });

    // The fake decoder fails, so the customer sees the unreadable message.
    await expectUploadError(processUpload(file, "image"), MSG_UNREADABLE);
    expect(decoders.createImageBitmap).toHaveBeenCalledOnce();
  });
});

// A stand-in for the browser's decoders, canvas and FileReader, so the pipeline's choices
// (which encoder wins, what comes out) run in Node. It draws nothing.
function fakeBrowser(opts: {
  encodes: string[];
  sizes: Record<string, number>;
  alpha?: number;
  svgSize?: { width: number; height: number };
}) {
  const drawn: { width: number; height: number }[] = [];
  const requested: [type: string, quality: number | undefined][] = [];
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({
      drawImage: (_img: unknown, _x: number, _y: number, width: number, height: number) => drawn.push({ width, height }),
      getImageData: () => ({ data: new Uint8ClampedArray([0, 0, 0, opts.alpha ?? 255]) }),
    }),
    // Like Safari, an encoder the browser lacks quietly returns PNG.
    toBlob: (cb: (b: Blob | null) => void, type: string, quality?: number) => {
      requested.push([type, quality]);
      const real = opts.encodes.includes(type) ? type : "image/png";
      cb(new Blob([new Uint8Array(opts.sizes[real] ?? 1)], { type: real }));
    },
  };
  vi.stubGlobal("document", { createElement: () => canvas });
  vi.stubGlobal("createImageBitmap", async () => ({ width: 4000, height: 3000, close: () => {} }));
  vi.stubGlobal(
    "Image",
    class {
      src = "";
      naturalWidth = opts.svgSize?.width ?? 0;
      naturalHeight = opts.svgSize?.height ?? 0;
      decode = async () => {};
    },
  );
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  vi.stubGlobal(
    "FileReader",
    class {
      result: string | null = null;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      readAsDataURL(blob: Blob) {
        blob.arrayBuffer().then((buf) => {
          this.result = `data:${blob.type};base64,${Buffer.from(buf).toString("base64")}`;
          this.onload?.();
        });
      }
    },
  );
  return { drawn, requested };
}

const sizes = { "image/webp": 300, "image/jpeg": 400, "image/png": 900 };

describe("processUpload encoding", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("draws a photo at the target size and returns WebP 0.8 with its size", async () => {
    const { drawn, requested } = fakeBrowser({ encodes: ["image/webp", "image/jpeg", "image/png"], sizes });
    const result = await processUpload(new File([JPEG], "photo.jpg"), "background");
    expect(drawn).toEqual([{ width: 1600, height: 1200 }]);
    expect(requested).toEqual([["image/webp", 0.8]]);
    expect(result.dataUrl).toMatch(/^data:image\/webp;base64,/);
    expect(result).toMatchObject({ bytes: result.dataUrl.length, tooLarge: false });
  });

  it("falls back to JPEG when the browser can't encode WebP", async () => {
    fakeBrowser({ encodes: ["image/jpeg", "image/png"], sizes });
    const { dataUrl } = await processUpload(new File([JPEG], "photo.jpg"), "image");
    expect(dataUrl).toMatch(/^data:image\/jpeg;base64,/);
  });

  it("keeps PNG for an image from a PNG when it's smaller than the WebP", async () => {
    fakeBrowser({ encodes: ["image/webp", "image/png"], sizes: { "image/webp": 500, "image/png": 200 } });
    const { dataUrl } = await processUpload(new File([PNG], "logo.png"), "image");
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it("uses PNG, never JPEG, for a transparent logo when WebP is unavailable", async () => {
    const { requested } = fakeBrowser({ encodes: ["image/jpeg", "image/png"], sizes, alpha: 0 });
    const { dataUrl } = await processUpload(new File([PNG], "logo.png"), "image");
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(requested.map(([type]) => type)).not.toContain("image/jpeg");
  });

  it("rasterises an SVG to a canvas and never returns SVG", async () => {
    const { drawn } = fakeBrowser({ encodes: ["image/webp", "image/png"], sizes, svgSize: { width: 2400, height: 2400 } });
    const { dataUrl } = await processUpload(new File([SVG], "logo.svg", { type: "image/svg+xml" }), "image");
    expect(drawn).toEqual([{ width: 600, height: 600 }]);
    expect(dataUrl).toMatch(/^data:image\/webp;base64,/);
    expect(dataUrl).not.toContain("svg");
  });

  it("draws a small SVG at the cap rather than its declared size", async () => {
    const { drawn } = fakeBrowser({ encodes: ["image/webp", "image/png"], sizes, svgSize: { width: 160, height: 48 } });
    await processUpload(new File([SVG], "logo.svg"), "image");
    expect(drawn).toEqual([{ width: 600, height: 180 }]);
  });

  it("never upscales a small raster", async () => {
    const { drawn } = fakeBrowser({ encodes: ["image/webp"], sizes });
    vi.stubGlobal("createImageBitmap", async () => ({ width: 160, height: 48, close: () => {} }));
    await processUpload(new File([PNG], "logo.png"), "image");
    expect(drawn).toEqual([{ width: 160, height: 48 }]);
  });

  it("draws an SVG with no intrinsic size at 600 x 600", async () => {
    const { drawn } = fakeBrowser({ encodes: ["image/webp"], sizes });
    await processUpload(new File([SVG], "logo.svg"), "background");
    expect(drawn).toEqual([{ width: 600, height: 600 }]);
  });

  it("flags a result over 150 KB as too large", async () => {
    fakeBrowser({ encodes: ["image/webp"], sizes: { "image/webp": 160 * 1024 } });
    const result = await processUpload(new File([JPEG], "photo.jpg"), "background");
    expect(result.tooLarge).toBe(true);
    expect(result.bytes).toBeGreaterThan(150 * 1024);
  });
});

// A fetch stub whose body is pulled one chunk at a time, so a test can see how much was read.
function streamedFetch(opts: { chunks: number; chunkBytes: number; head?: Uint8Array; headers?: HeadersInit }) {
  const body = { pulls: 0, cancelled: false };
  const stream = new ReadableStream<Uint8Array>(
    {
      pull(controller) {
        if (body.pulls === opts.chunks) return controller.close();
        const chunk = new Uint8Array(opts.chunkBytes);
        if (body.pulls === 0 && opts.head) chunk.set(opts.head);
        body.pulls++;
        controller.enqueue(chunk);
      },
      cancel() {
        body.cancelled = true;
      },
    },
    { highWaterMark: 0 },
  );
  const response = new Response(stream, { headers: opts.headers });
  vi.stubGlobal("fetch", vi.fn(async () => response));
  return { body, response };
}

function stubFetchedBody(body: BodyInit, init?: ResponseInit) {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(body, init)));
}

describe("inlineFromUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("resizes a fetched JPEG to the kind's cap", async () => {
    const { drawn } = fakeBrowser({ encodes: ["image/webp"], sizes });
    stubFetchedBody(new Blob([JPEG]));
    const dataUrl = await inlineFromUrl("/templates/cafe.jpg", "image");
    expect(drawn).toEqual([{ width: 600, height: 450 }]);
    expect(dataUrl).toMatch(/^data:image\/webp;base64,/);
  });

  it("rejects a fetched HTML body before decoding", async () => {
    const { drawn } = fakeBrowser({ encodes: ["image/webp"], sizes });
    stubFetchedBody("<!DOCTYPE html><html><body>Not found</body></html>", {
      headers: { "content-type": "image/jpeg" },
    });
    await expectUploadError(inlineFromUrl("/templates/cafe.jpg", "background"), MSG_WRONG_TYPE);
    expect(drawn).toEqual([]);
  });

  it("rejects a response that isn't OK", async () => {
    fakeBrowser({ encodes: ["image/webp"], sizes });
    stubFetchedBody(new Blob([JPEG]), { status: 404 });
    await expectUploadError(inlineFromUrl("/templates/missing.jpg", "background"), MSG_UNREADABLE);
  });

  it("stops reading a body with no Content-Length once it passes 10 MB, before decoding", async () => {
    const decode = vi.fn();
    vi.stubGlobal("createImageBitmap", decode);
    const { body } = streamedFetch({ chunks: 64, chunkBytes: MB, head: PNG });

    await expectUploadError(inlineFromUrl("https://images.unsplash.com/photo", "background"), MSG_TOO_BIG);
    // The 11th megabyte crosses the limit; nothing after it is requested.
    expect(body.pulls).toBe(11);
    expect(body.cancelled).toBe(true);
    expect(decode).not.toHaveBeenCalled();
  });

  it("refuses a declared Content-Length over 10 MB without reading the body", async () => {
    const decode = vi.fn();
    vi.stubGlobal("createImageBitmap", decode);
    const { body, response } = streamedFetch({
      chunks: 20,
      chunkBytes: MB,
      head: PNG,
      headers: { "content-length": "20000000" },
    });

    await expectUploadError(inlineFromUrl("https://images.unsplash.com/photo", "background"), MSG_TOO_BIG);
    expect(body.pulls).toBe(0);
    expect(response.bodyUsed).toBe(false);
    expect(decode).not.toHaveBeenCalled();
  });
});

describe("encodeAt", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("requests WebP at the given quality and long edge", async () => {
    const { drawn, requested } = fakeBrowser({ encodes: ["image/webp", "image/jpeg"], sizes });
    stubFetchedBody(new Blob([JPEG]));
    const dataUrl = await encodeAt("data:image/jpeg;base64,", 1000, 0.6);
    expect(drawn).toEqual([{ width: 1000, height: 750 }]);
    expect(requested).toEqual([["image/webp", 0.6]]);
    expect(dataUrl).toMatch(/^data:image\/webp;base64,/);
  });

  it("falls back to JPEG at the same quality when WebP comes back as another type", async () => {
    const { requested } = fakeBrowser({ encodes: ["image/jpeg"], sizes });
    stubFetchedBody(new Blob([PNG]));
    const dataUrl = await encodeAt("data:image/png;base64,", 800, 0.5);
    expect(requested).toEqual([
      ["image/webp", 0.5],
      ["image/jpeg", 0.5],
    ]);
    expect(dataUrl).toMatch(/^data:image\/jpeg;base64,/);
  });

  it("rejects SVG bytes without decoding them", async () => {
    const { drawn } = fakeBrowser({ encodes: ["image/webp"], sizes });
    stubFetchedBody(new Blob([SVG]));
    await expectUploadError(encodeAt("/templates/logo.svg", 1000, 0.7), MSG_UNREADABLE);
    expect(drawn).toEqual([]);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("rejects an image over 10 MB before decoding", async () => {
    const decode = vi.fn();
    vi.stubGlobal("createImageBitmap", decode);
    stubFetchedBody(new Blob([PNG, new Uint8Array(11 * MB)]));
    await expectUploadError(encodeAt("/templates/huge.png", 1000, 0.7), MSG_TOO_BIG);
    expect(decode).not.toHaveBeenCalled();
  });
});

describe("reencodeToFit", () => {
  // A fake encoder whose output length falls as size and quality fall.
  function fakeEncoder(lengthFor: (edge: number, q: number) => number) {
    const calls: [number, number][] = [];
    const encode = async (edge: number, q: number) => {
      calls.push([edge, q]);
      return "x".repeat(lengthFor(edge, q));
    };
    return { encode, calls };
  }
  const shrinking = (edge: number, q: number) => Math.round(edge * q * 100);

  it("steps quality down at 1000px, then the same at 800px", async () => {
    const { encode, calls } = fakeEncoder(shrinking);
    await reencodeToFit(encode, 0);
    expect(calls).toEqual([
      [1000, 0.7],
      [1000, 0.6],
      [1000, 0.5],
      [1000, 0.4],
      [800, 0.7],
      [800, 0.6],
      [800, 0.5],
      [800, 0.4],
    ]);
  });

  it("stops at the first attempt that fits the allowance", async () => {
    const { encode, calls } = fakeEncoder(shrinking);
    // 1000px at 0.5 is 50,000 characters.
    const result = await reencodeToFit(encode, 50_000);
    expect(result).toEqual({ dataUrl: "x".repeat(50_000), fits: true });
    expect(calls).toEqual([
      [1000, 0.7],
      [1000, 0.6],
      [1000, 0.5],
    ]);
  });

  it("moves on to 800px when no quality fits at 1000px", async () => {
    const { encode, calls } = fakeEncoder(shrinking);
    // 1000px at 0.4 is 40,000; 800px at 0.6 is 48,000 and 800px at 0.4 is 32,000.
    const result = await reencodeToFit(encode, 35_000);
    expect(result).toEqual({ dataUrl: "x".repeat(32_000), fits: true });
    expect(calls.at(-1)).toEqual([800, 0.4]);
  });

  it("returns the smallest attempt with fits: false when none fits", async () => {
    // Not monotonic, so the smallest isn't simply the last attempt.
    const lengths: Record<string, number> = { "1000:0.4": 900, "800:0.4": 1200 };
    const { encode, calls } = fakeEncoder((edge, q) => lengths[`${edge}:${q}`] ?? 5_000);
    const result = await reencodeToFit(encode, 100);
    expect(result).toEqual({ dataUrl: "x".repeat(900), fits: false });
    expect(calls).toHaveLength(8);
  });
});
