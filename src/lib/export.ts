// Export HTML: turns a Design into one standalone guest page with no JavaScript and no network
// requests. Guests load it on open WiFi, so this is a trust boundary. Every image is inlined as
// a raster data URL *before* rendering (React 19's static renderer emits <link rel="preload">
// for any other <img> src), inlining fails closed, and the finished page is checked once more.

import { createElement } from "react";
import { SplashPage } from "../splash/SplashPage";
import type { Design } from "./design-schema";
import { encodeAt, inlineFromUrl, reencodeToFit, type ImageKind } from "./images";

export const PAGE_BUDGET = 100 * 1024;

export type ExportDeps = {
  inline(src: string, kind: ImageKind): Promise<string>;
  reencode(src: string, allowance: number): Promise<{ dataUrl: string; fits: boolean }>;
};

export type ExportResult = { html: string; bytes: number; overBudget: boolean; reencoded: boolean };

/** An export failure whose message can be shown to the customer as is. */
export class ExportError extends Error {}

export const MSG_IMAGE_FAILED = "We couldn't load one of the images. Try again, or replace it.";
export const MSG_UNSAFE_OUTPUT = "The page couldn't be built safely. Try again, or replace your images.";

/** One slow host can't hang the export: each image step gives up after this long. */
export const IMAGE_TIMEOUT_MS = 20_000;

const DEFAULT_DEPS: ExportDeps = {
  inline: inlineFromUrl,
  reencode: (src, allowance) => reencodeToFit((edge, q) => encodeAt(src, edge, q), allowance),
};

// The file's only <style> block: rules inline styles can't express.
const EXPORT_CSS = [
  'body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}',
  ".cv-root{min-height:100vh;min-height:100dvh}",
  ".cv-terms{display:none}.cv-terms:target{display:block}",
  ".cv-root :focus-visible{outline:3px solid #FFFFFF;box-shadow:0 0 0 5px #111111}",
  ".cv-root ::placeholder{color:inherit;opacity:.65}",
].join("");

// Fixed text placed before the form. Never built from design data.
const PORTAL_COMMENT =
  "<!-- Guest details go to your portal service first, never straight to the router. " +
  "Replace [PORTAL_SUBMIT_URL] with the portal service's submit address. It records the details, " +
  "then posts a second form, with no personal data, to the router's form_action (command=login) " +
  "to let the guest online. -->";
const ROUTER_COMMENT =
  "<!-- Click-through form: no guest details are collected. Replace [ROUTER_FORM_ACTION] with " +
  "the form_action address the Peplink router passes to its external captive portal; the hidden " +
  "command=login logs the guest in. -->";

/** A 1x1 transparent PNG: stands in for the background while the rest of the page is measured. */
const PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

const RASTER_DATA_URL = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]*$/;
const isRasterDataUrl = (s: string) => RASTER_DATA_URL.test(s);

const byteLength = (s: string) => new TextEncoder().encode(s).length;

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** A safe download name: "Café / WiFi!" becomes "cafe-wifi.html"; an empty name "wifi-login.html". */
export function exportFileName(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
  return `${slug || "wifi-login"}.html`;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("timed out")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Returns `src` as a raster data URL. Anything else goes through `inline`, and a rejection, a
 * timeout or a result that isn't a raster data URL fails the export: the original `src` is
 * never kept.
 */
async function toDataUrl(src: string, kind: ImageKind, inline: ExportDeps["inline"]): Promise<string> {
  if (isRasterDataUrl(src)) return src;
  let out: unknown;
  try {
    out = await withTimeout(Promise.resolve().then(() => inline(src, kind)), IMAGE_TIMEOUT_MS);
  } catch {
    throw new ExportError(MSG_IMAGE_FAILED);
  }
  if (typeof out !== "string" || !isRasterDataUrl(out)) throw new ExportError(MSG_IMAGE_FAILED);
  return out;
}

/** The design with every image `src` replaced by a raster data URL. */
async function inlineImages(design: Design, inline: ExportDeps["inline"]): Promise<Design> {
  const cache = new Map<string, Promise<string>>();
  const get = (src: string, kind: ImageKind) => {
    const key = `${kind} ${src}`;
    let p = cache.get(key);
    if (!p) cache.set(key, (p = toDataUrl(src, kind, inline)));
    return p;
  };

  const bg = design.background;
  const [background, blocks] = await Promise.all([
    bg.type === "image" ? get(bg.src, "background").then((src) => ({ ...bg, src })) : bg,
    Promise.all(
      design.blocks.map((b) => (b.kind === "image" ? get(b.src, "image").then((src) => ({ ...b, src })) : b)),
    ),
  ]);
  return { ...design, background, blocks };
}

/** Where the form must post: guest details go to the portal service, never to the router. */
const formAction = (design: Design) =>
  design.form.fields.length > 0 ? "[PORTAL_SUBMIT_URL]" : "[ROUTER_FORM_ACTION]";

// The only URL-bearing attribute values the export may carry; srcset, formaction, poster, ping,
// background and data none. `[\s:]` also catches namespaced forms such as xlink:href.
const safeAttr = (action: string): Record<string, (value: string) => boolean> => ({
  src: isRasterDataUrl,
  href: (v) => v.startsWith("#"),
  action: (v) => v === action,
});
const URL_ATTR = /[\s:](src|srcset|href|action|formaction|poster|ping|background|data)="([^"]*)"/gi;

// Elements that load, redirect or carry their own CSS. The wrapper adds the page's only <style>.
const UNSAFE_TAG = /<(link|script|style|iframe|object|embed|base|meta|image|use|feimage)\b/i;

// CSS that can load something. A backslash covers CSS escapes; hex colours never contain one.
const UNSAFE_CSS = /url\(|image-set\(|@import|\\/i;

/**
 * The last line of defence, run on the rendered body before it's wrapped: no element that loads
 * or redirects, every src a raster data URL, every href an in-page fragment, every form action
 * `action` (and no command input when that's the portal service) and no inline style that can
 * fetch. Text content isn't checked, so
 * terms that mention a web address still export as inert text.
 */
function assertSelfContained(markup: string, action: string): void {
  if (UNSAFE_TAG.test(markup)) throw new ExportError(MSG_UNSAFE_OUTPUT);
  const safe = safeAttr(action);
  for (const [, attr, value] of markup.matchAll(URL_ATTR)) {
    if (!safe[attr.toLowerCase()]?.(value)) throw new ExportError(MSG_UNSAFE_OUTPUT);
  }
  if (action === "[PORTAL_SUBMIT_URL]" && /\sname="command"/i.test(markup)) {
    throw new ExportError(MSG_UNSAFE_OUTPUT);
  }
  for (const [, css] of markup.matchAll(/\sstyle="([^"]*)"/gi)) {
    if (UNSAFE_CSS.test(css)) throw new ExportError(MSG_UNSAFE_OUTPUT);
  }
}

async function renderPage(design: Design, name: string): Promise<string> {
  const { renderToStaticMarkup } = await import("react-dom/server");
  let markup = renderToStaticMarkup(createElement(SplashPage, { design, screen: "landing", mode: "export" }));

  const formAt = markup.indexOf("<form");
  if (formAt >= 0) {
    const comment = design.form.fields.length > 0 ? PORTAL_COMMENT : ROUTER_COMMENT;
    markup = markup.slice(0, formAt) + comment + markup.slice(formAt);
  }
  assertSelfContained(markup, formAction(design));

  const html =
    '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    `<title>${escapeHtml(name.trim() || "WiFi login")}</title>` +
    `<style>${EXPORT_CSS}</style></head><body>${markup}</body></html>`;
  // The wrapper's fixed head adds exactly one <style>, and the body was checked to have none.
  if (html.match(/<style\b/gi)?.length !== 1) throw new ExportError(MSG_UNSAFE_OUTPUT);
  return html;
}

/**
 * Builds the standalone guest page. Every image is inlined first; a photo background is then
 * re-encoded to fit what's left of PAGE_BUDGET. Rejects with an ExportError (a message for the
 * customer) when an image can't be inlined; over budget only sets `overBudget`.
 */
export async function buildExportHtml(
  design: Design,
  name: string,
  deps: Partial<ExportDeps> = {},
): Promise<ExportResult> {
  const { inline, reencode } = { ...DEFAULT_DEPS, ...deps };
  let page = await inlineImages(design, inline);
  let reencoded = false;

  const bg = page.background;
  if (bg.type === "image") {
    // The rest of the page, measured with the background reduced to a 1x1 pixel.
    const without = byteLength(await renderPage({ ...page, background: { ...bg, src: PIXEL } }, name));
    const allowance = Math.max(0, PAGE_BUDGET - (without - PIXEL.length));
    try {
      const { dataUrl } = await withTimeout(
        Promise.resolve().then(() => reencode(bg.src, allowance)),
        IMAGE_TIMEOUT_MS,
      );
      if (isRasterDataUrl(dataUrl)) {
        page = { ...page, background: { ...bg, src: dataUrl } };
        reencoded = true;
      }
    } catch {
      // Keep the inlined background, which is already a raster data URL; the size toast warns.
    }
  }

  const html = await renderPage(page, name);
  const bytes = byteLength(html);
  return { html, bytes, overBudget: bytes > PAGE_BUDGET, reencoded };
}

/** Downloads `html` as `exportFileName(name)` through a temporary <a download>. Browser only. */
export function downloadHtml(html: string, name: string): void {
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = exportFileName(name);
  a.style.display = "none";
  document.body.appendChild(a);
  try {
    a.click();
  } finally {
    a.remove();
    // Revoked on the next task, not synchronously, so Safari and Firefox have started the download.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
