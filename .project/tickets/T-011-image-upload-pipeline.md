---
title: "T-011: Image upload pipeline and ImageUpload control"
type: ticket
project: captivator
status: done
priority: P0
milestone: 3
estimate: 20
depends_on: [T-001]
touches:
  - src/lib/images.ts
  - src/lib/images.test.ts
  - src/lib/palette.ts
  - src/editor/controls/ImageUpload.tsx
cut_rank:
updated: 2026-10-22
tags: [project, captivator, ticket, lib, security]
---
# T-011: Image upload pipeline and ImageUpload control

## Context
Build step 3, "Image (upload pipeline)" ([spec → Images and Unsplash → Upload pipeline, Export re-encode](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md), *Unit tests* → `images`). Every image is downscaled in the browser before it reaches the store. This is a trust boundary: uploaded files, SVG included, are untrusted. `images.ts` also holds the export's image helpers (inline a URL, re-encode to fit the budget), so T-023 doesn't need its own encoder. Palette extraction lives in `palette.ts`, created here as a stub and filled by T-026 (cut 4). Canvas artboard: `DesktopPreview` ("Upload your own"). Decisions: [`general-export-background-reencode.md`](../decisions/general-export-background-reencode.md), [`general-export-inlines-all-images.md`](../decisions/general-export-inlines-all-images.md), [`general-new-modules-beyond-project-structure.md`](../decisions/general-new-modules-beyond-project-structure.md).

## Scope
- **`src/lib/images.ts`** (API in Notes): type sniffing, size limits, `targetSize`, the browser downscale and encode pipeline, `inlineFromUrl`, `encodeAt` and the pure `reencodeToFit` loop.
- **`src/lib/palette.ts`** (stub → T-026): `export async function extractPalette(_dataUrl: string): Promise<string[]> { return []; }`.
- **`src/editor/controls/ImageUpload.tsx`:** `ImageUpload({ kind, label, onUploaded, onPalette?, disabled?, describedBy?, className? })`.
  - A button-styled `<label>` wrapping a visually hidden `<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml">`.
  - On pick: `processUpload(file, kind)`, then `onUploaded(dataUrl)`. For `kind === "image"`, also `extractPalette(dataUrl).then(onPalette)` when `onPalette` is given.
  - Busy state while processing. Errors show in `role="alert"`. When the result is over 150 KB, show "This image is {n} KB after shrinking. A simpler image keeps the page fast."
  - Reset the input's value after each pick, so the same file can be chosen again.
- **`src/lib/images.test.ts`** (node environment; pure parts only).
- **Out of scope:** where uploads go (T-012 block list, T-014 image panel, T-016 background panel); real palette extraction (T-026); calling `inlineFromUrl` and `reencodeToFit` (T-023).

## Acceptance criteria
- [x] `targetSize` keeps the aspect ratio, caps the long edge at 600 (`image`) or 1600 (`background`), and never upscales (tests).
- [x] With a fake encoder, `reencodeToFit` steps quality down (0.7, 0.6, 0.5, 0.4) at 1000px, then the same at 800px; stops at the first attempt that fits the allowance; and returns the smallest attempt with `fits: false` when none fits (tests).
- [x] **Security:** a `File` over 10 MB is rejected with the size message before any decoding (test: decoding functions are never called).
- [x] **Security:** `sniffImageType` recognises PNG, JPEG, WebP and SVG from their bytes and returns `null` for HTML or GIF bytes; `processUpload` rejects a file whose bytes don't sniff as an allowed type, whatever its `type` or extension (tests).
- [x] **Security:** SVG is drawn to a canvas and re-encoded; no code path returns `data:image/svg+xml` or stores SVG markup.
- [ ] Manual: a 4 MB phone photo uploads and lands under 150 KB (spec checklist; recorded in T-029).
- [x] `npm test` and `npx tsc --noEmit` pass.

## Dependencies
- T-001: Vitest and the shared types.

## Notes
```ts
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const STORED_WARN_BYTES = 150 * 1024;
export type ImageKind = "image" | "background";
export const LONG_EDGE: Record<ImageKind, number> = { image: 600, background: 1600 };
export class UploadError extends Error {}  // message is shown to the customer
export function sniffImageType(bytes: Uint8Array): "png" | "jpeg" | "webp" | "svg" | null;
export function targetSize(w: number, h: number, longEdge: number): { width: number; height: number };
export async function processUpload(file: File, kind: ImageKind): Promise<{ dataUrl: string; bytes: number; tooLarge: boolean }>;
export async function inlineFromUrl(src: string, kind: ImageKind): Promise<string>;      // fetch → same pipeline
export async function encodeAt(src: string, longEdge: number, quality: number): Promise<string>; // WebP re-encode
export async function reencodeToFit(
  encode: (longEdge: number, quality: number) => Promise<string>, allowance: number,
): Promise<{ dataUrl: string; fits: boolean }>;
```

**Pipeline** (spec *Upload pipeline*):
1. Reject files over 10 MB, then sniff the first ~32 bytes. Both checks happen before decoding.
2. Decode with `createImageBitmap`. For SVG, use an `<img>` from an object URL; if it has no intrinsic size, draw at 600×600.
3. Draw to a canvas at `targetSize`.
4. `toBlob("image/webp", 0.8)`. Fall back to `image/jpeg` at 0.82 when the blob is empty or not WebP (older Safari).
5. For `kind === "image"` from a PNG, WebP or SVG source (it may be transparent), also encode PNG and keep the smaller.
6. Return the data URL, its byte size, and `tooLarge` when it's over 150 KB.

**Customer messages:** "That file is over 10 MB. Try a smaller image." / "Use a PNG, JPEG, WebP or SVG image." / "We couldn't read that image."

**Magic bytes:**
- PNG: `89 50 4E 47`.
- JPEG: `FF D8 FF`.
- WebP: `RIFF` at bytes 0–3 and `WEBP` at bytes 8–11.
- SVG: after optional BOM and whitespace, the text starts with `<svg` or `<?xml`.

`reencodeToFit` measures `dataUrl.length` (base64 characters ≈ bytes on the page) against `allowance`.

**Outcome (2026-10-22):**
- **Code review:** approved with six should-fixes and two nits, all fixed in `3911e94`:
  - SVGs are drawn at the long-edge cap, not their small declared size ([`T-011-svg-rasterised-at-cap.md`](../decisions/T-011-svg-rasterised-at-cap.md)).
  - One `withDecoded` guard now does the size check, sniff and decode for both uploads and `encodeAt`.
  - `inlineFromUrl` and `encodeAt` have contract tests for T-023.
  - Error tests now check the error's class as well as its message.
  - The file input keeps keyboard focus while busy.
  - The live regions are always mounted, so screen readers announce them.
- **Security audit:** one low finding (SEC-1, unbounded reads on the export fetch path), fixed in the same commit and confirmed by a second audit ([`2026-10-22-security-T-011-review.md`](../review/2026-10-22-security-T-011-review.md)).
- **The 4 MB phone-photo check stays unticked.** It needs a real browser and is part of T-029's checklist, which now names the data-URL measure.
- **Not handled:** a PNG under 10 MB with huge pixel dimensions is decoded at full size before it's downscaled, which could exhaust memory in the customer's own tab. Fixing it means reading the dimensions from the file header first.
- **Canvas:** the "Upload your own" button is 44px tall, where the canvas has 40px, to meet the tap-target rule.

## Decisions
- [`T-011-manual-upload-check-in-t029.md`](../decisions/T-011-manual-upload-check-in-t029.md): T-011's manual 4 MB upload check is left to T-029's real-phone checklist
- [`T-011-svg-rasterised-at-cap.md`](../decisions/T-011-svg-rasterised-at-cap.md): An SVG with a declared size is rasterised at the kind's cap, not at its own size
- [`T-011-transparent-image-skips-jpeg.md`](../decisions/T-011-transparent-image-skips-jpeg.md): A transparent image falls back to PNG, not JPEG, when the browser can't encode WebP
- [`T-011-upload-size-measures-data-url.md`](../decisions/T-011-upload-size-measures-data-url.md): processUpload measures an upload's size as its data URL length, not its binary size
- [`general-export-background-reencode.md`](../decisions/general-export-background-reencode.md): The export re-encodes the background to fit the 100 KB budget
- [`general-export-inlines-all-images.md`](../decisions/general-export-inlines-all-images.md): Export inlines every image that isn't already a data URL
- [`general-new-modules-beyond-project-structure.md`](../decisions/general-new-modules-beyond-project-structure.md): Planning adds small modules to the spec's project structure so each ticket owns its own files
