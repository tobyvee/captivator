---
title: "Security review: T-011 image upload pipeline"
type: review
project: captivator
updated: 2026-10-22
tags: [project, captivator, review, security, images]
---
# Security review: T-011 image upload pipeline

`security-auditor` reviewed T-011 after it merged (`a5e7a35..07e60fd`): `src/lib/images.ts`, its tests, the `palette.ts` stub and `src/editor/controls/ImageUpload.tsx`. Uploaded files, SVG included, are untrusted. Their output goes into the stored design, the editor preview and the exported guest page. The audit found 1 issue, low: 0 critical, 0 high, 0 medium. A second audit of the fix commit confirmed it was resolved and found nothing new.

## Findings

| # | Severity | Finding | Outcome |
|---|---|---|---|
| SEC-1 | low | Unbounded reads on the export's image path. `fetchBlob` read a whole response into memory before the 10 MB check, and `encodeAt` had no size check at all. A design whose image points at a very large or endless `https:` response could exhaust memory in the customer's own tab on Export. No script runs and nothing leaks, and the editor's own `<img>` already loads the same URL. | **Fixed in `3911e94`.** `fetchBlob` refuses a declared `Content-Length` over 10 MB without reading the body. It also counts streamed bytes and cancels the read once they pass the limit. A single `withDecoded` helper now runs the size check, type sniff, decode and close for both uploads and `encodeAt`. Regression tests cover a streamed body with no length, an oversized declared length, and an oversized `encodeAt` source. None of them decodes. |

## Checked and passed
- **Order of checks:** an upload's size is checked before any bytes are read, and its type is sniffed from its bytes before any decoder runs. `File.type`, the extension and `accept` are ignored. The tests prove no decoder runs for an oversized file or for renamed HTML or GIF bytes.
- **SVG is only rasterised:**
  - It is decoded through an `<img>` from a same-origin blob URL, so no script runs and nothing external loads.
  - It is drawn to a canvas. A tainted canvas fails safely with "couldn't read".
  - Only `data:image/(png|jpeg|webp);base64,` output can leave the module, and `encodeAt` refuses SVG input.
  - The fix commit draws SVGs at the long-edge cap (`T-011-svg-rasterised-at-cap.md`), so the canvas is never larger than 1600×1600.
- **Errors:** only fixed `UploadError` messages reach the UI, rendered as React text.
- **Persistence:** only the raster data URL is passed on.

## For later tickets
- **T-023:** when `inline` rejects (CORS refused, not an image, over 10 MB), the export must never fall back to the original `src`. T-023 now has a security criterion for this.
- **T-023, optional:** `fetchBlob` has no timeout, so a slow host in a tampered design could hang that customer's own export. An `AbortSignal.timeout` would bound it.
