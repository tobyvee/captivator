// Browser image pipeline: every image is downscaled and re-encoded here before it reaches
// the store or the exported page. Uploaded files are untrusted, SVG included, so the size
// and type checks run before any decoding, and only raster data URLs ever come out.

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const STORED_WARN_BYTES = 150 * 1024;

export type ImageKind = "image" | "background";
export const LONG_EDGE: Record<ImageKind, number> = { image: 600, background: 1600 };

/** An error whose message is shown to the customer as is. */
export class UploadError extends Error {}

export const MSG_TOO_BIG = "That file is over 10 MB. Try a smaller image.";
export const MSG_WRONG_TYPE = "Use a PNG, JPEG, WebP or SVG image.";
export const MSG_UNREADABLE = "We couldn't read that image.";

type SniffedType = "png" | "jpeg" | "webp" | "svg";

const SNIFF_BYTES = 32;
/** An SVG with no intrinsic size is drawn at this size. */
const SVG_FALLBACK_SIZE = 600;
const WEBP_QUALITY = 0.8;
const JPEG_QUALITY = 0.82;
const RASTER_DATA_URL = /^data:image\/(png|jpeg|webp);base64,/;

function startsWith(bytes: Uint8Array, prefix: number[], offset = 0): boolean {
  return prefix.every((b, i) => bytes[offset + i] === b);
}

const ascii = (s: string) => Array.from(s, (c) => c.charCodeAt(0));

/** Identifies an allowed image type from its leading bytes, ignoring any claimed type or extension. */
export function sniffImageType(bytes: Uint8Array): SniffedType | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47])) return "png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpeg";
  if (startsWith(bytes, ascii("RIFF")) && startsWith(bytes, ascii("WEBP"), 8)) return "webp";

  let i = startsWith(bytes, [0xef, 0xbb, 0xbf]) ? 3 : 0;
  while (i < bytes.length && [0x20, 0x09, 0x0a, 0x0d].includes(bytes[i])) i++;
  if (startsWith(bytes, ascii("<svg"), i) || startsWith(bytes, ascii("<?xml"), i)) return "svg";
  return null;
}

/** Scales (w, h) so the long edge is at most `longEdge`, keeping the aspect ratio. Never upscales. */
export function targetSize(w: number, h: number, longEdge: number): { width: number; height: number } {
  const scale = Math.min(1, longEdge / Math.max(w, h));
  return {
    width: Math.max(1, Math.round(w * scale)),
    height: Math.max(1, Math.round(h * scale)),
  };
}

/**
 * Downscales and re-encodes an uploaded file. Rejects oversized files and unrecognised bytes
 * before decoding. `bytes` is the length of the returned data URL, which is what the store
 * and the exported page carry.
 */
export async function processUpload(
  file: File,
  kind: ImageKind,
): Promise<{ dataUrl: string; bytes: number; tooLarge: boolean }> {
  const dataUrl = await processBlob(file, kind);
  return { dataUrl, bytes: dataUrl.length, tooLarge: dataUrl.length > STORED_WARN_BYTES };
}

/** Fetches an image (a template photo or an Unsplash URL) and runs it through the upload pipeline. */
export async function inlineFromUrl(src: string, kind: ImageKind): Promise<string> {
  return processBlob(await fetchBlob(src), kind);
}

/** Re-encodes a stored image as WebP (JPEG where WebP can't be encoded) at the given size and quality. */
export async function encodeAt(src: string, longEdge: number, quality: number): Promise<string> {
  const blob = await fetchBlob(src);
  const type = sniffImageType(new Uint8Array(await blob.slice(0, SNIFF_BYTES).arrayBuffer()));
  if (!type || type === "svg") throw new UploadError(MSG_UNREADABLE);
  const source = await decode(blob, type);
  try {
    const canvas = drawScaled(source, longEdge);
    const out =
      (await encodeIfType(canvas, "image/webp", quality)) ??
      (await encodeIfType(canvas, "image/jpeg", quality));
    if (!out) throw new UploadError(MSG_UNREADABLE);
    return await toRasterDataUrl(out);
  } catch (err) {
    throw err instanceof UploadError ? err : new UploadError(MSG_UNREADABLE);
  } finally {
    source.close();
  }
}

const REENCODE_SIZES = [1000, 800];
const REENCODE_QUALITIES = [0.7, 0.6, 0.5, 0.4];

/**
 * The export's background re-encode: steps quality down at 1000px, then at 800px, and stops at
 * the first data URL whose length fits `allowance`. When none fits, returns the smallest attempt.
 */
export async function reencodeToFit(
  encode: (longEdge: number, quality: number) => Promise<string>,
  allowance: number,
): Promise<{ dataUrl: string; fits: boolean }> {
  let smallest: string | null = null;
  for (const size of REENCODE_SIZES) {
    for (const quality of REENCODE_QUALITIES) {
      const dataUrl = await encode(size, quality);
      if (dataUrl.length <= allowance) return { dataUrl, fits: true };
      if (smallest === null || dataUrl.length < smallest.length) smallest = dataUrl;
    }
  }
  return { dataUrl: smallest as string, fits: false };
}

// ---------------------------------------------------------------------------
// Browser-only internals (canvas, createImageBitmap, FileReader).

async function fetchBlob(src: string): Promise<Blob> {
  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.blob();
  } catch {
    throw new UploadError(MSG_UNREADABLE);
  }
}

type Decoded = { image: CanvasImageSource; width: number; height: number; close: () => void };

async function processBlob(blob: Blob, kind: ImageKind): Promise<string> {
  if (blob.size > MAX_UPLOAD_BYTES) throw new UploadError(MSG_TOO_BIG);
  const type = sniffImageType(new Uint8Array(await blob.slice(0, SNIFF_BYTES).arrayBuffer()));
  if (!type) throw new UploadError(MSG_WRONG_TYPE);

  const source = await decode(blob, type);
  try {
    const canvas = drawScaled(source, LONG_EDGE[kind]);
    const mayBeTransparent = kind === "image" && type !== "jpeg";
    return await toRasterDataUrl(await encodeBest(canvas, mayBeTransparent));
  } catch (err) {
    // A tainted canvas or a failed encode: the customer only needs to know it didn't work.
    throw err instanceof UploadError ? err : new UploadError(MSG_UNREADABLE);
  } finally {
    source.close();
  }
}

async function decode(blob: Blob, type: SniffedType): Promise<Decoded> {
  try {
    if (type !== "svg") {
      const bitmap = await createImageBitmap(blob);
      return { image: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    }
    // SVG is rasterised through an <img>, which runs no scripts and loads nothing external.
    // The blob is re-typed so the browser treats the sniffed bytes as SVG whatever the file claimed.
    const url = URL.createObjectURL(new Blob([blob], { type: "image/svg+xml" }));
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const sized = img.naturalWidth > 0 && img.naturalHeight > 0;
      return {
        image: img,
        width: sized ? img.naturalWidth : SVG_FALLBACK_SIZE,
        height: sized ? img.naturalHeight : SVG_FALLBACK_SIZE,
        close: () => URL.revokeObjectURL(url),
      };
    } catch (err) {
      URL.revokeObjectURL(url);
      throw err;
    }
  } catch {
    throw new UploadError(MSG_UNREADABLE);
  }
}

function drawScaled(source: Decoded, longEdge: number): HTMLCanvasElement {
  const { width, height } = targetSize(source.width, source.height, longEdge);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new UploadError(MSG_UNREADABLE);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source.image, 0, 0, width, height);
  return canvas;
}

/**
 * WebP 0.8, else JPEG 0.82. A source that may be transparent (an image from PNG, WebP or SVG)
 * also tries PNG and keeps the smaller, and never falls back to JPEG when it has transparent
 * pixels, because JPEG would turn them black.
 */
async function encodeBest(canvas: HTMLCanvasElement, mayBeTransparent: boolean): Promise<Blob> {
  let best = await encodeIfType(canvas, "image/webp", WEBP_QUALITY);
  if (!best && !(mayBeTransparent && hasTransparency(canvas))) {
    best = await encodeIfType(canvas, "image/jpeg", JPEG_QUALITY);
  }
  if (mayBeTransparent || !best) {
    const png = await encodeIfType(canvas, "image/png");
    if (png && (!best || png.size < best.size)) best = png;
  }
  if (!best) throw new UploadError(MSG_UNREADABLE);
  return best;
}

/** Resolves to the blob only when the browser really produced `type` (Safari returns PNG for WebP). */
function encodeIfType(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => resolve(blob && blob.size > 0 && blob.type === type ? blob : null), type, quality);
    } catch (err) {
      reject(err);
    }
  });
}

function hasTransparency(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext("2d");
  if (!ctx) return true;
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 3; i < data.length; i += 4) if (data[i] < 255) return true;
  return false;
}

/** Reads a blob as a data URL and refuses anything but a raster type, so SVG markup can never leave here. */
function toRasterDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result;
      if (typeof url === "string" && RASTER_DATA_URL.test(url)) resolve(url);
      else reject(new UploadError(MSG_UNREADABLE));
    };
    reader.onerror = () => reject(new UploadError(MSG_UNREADABLE));
    reader.readAsDataURL(blob);
  });
}
