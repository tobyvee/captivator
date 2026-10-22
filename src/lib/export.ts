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

/** How long the download's blob URL lives. Safari can fail a download whose URL is revoked sooner. */
export const DOWNLOAD_REVOKE_MS = 30_000;

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
  const bg = design.background;
  const [background, blocks] = await Promise.all([
    bg.type === "image" ? toDataUrl(bg.src, "background", inline).then((src) => ({ ...bg, src })) : bg,
    Promise.all(
      design.blocks.map((b) =>
        b.kind === "image" ? toDataUrl(b.src, "image", inline).then((src) => ({ ...b, src })) : b,
      ),
    ),
  ]);
  return { ...design, background, blocks };
}

type FormAction = "[PORTAL_SUBMIT_URL]" | "[ROUTER_FORM_ACTION]";

/** Where the form must post: guest details go to the portal service, never to the router. */
const formAction = (design: Design): FormAction =>
  design.form.fields.length > 0 ? "[PORTAL_SUBMIT_URL]" : "[ROUTER_FORM_ACTION]";

const FORM_COMMENT: Record<FormAction, string> = {
  "[PORTAL_SUBMIT_URL]": PORTAL_COMMENT,
  "[ROUTER_FORM_ACTION]": ROUTER_COMMENT,
};

// The export guard is an allowlist (T-023-export-guard-allowlist): only the elements and
// attributes SplashPage renders in export mode. A renderer change that adds one fails the export
// until it's added here, with a decision.
const ALLOWED_TAGS = new Set([
  "a", "button", "div", "form", "h1", "h2", "img", "input", "label", "p", "path", "section", "span", "svg",
]);
const ALLOWED_ATTRS = new Set([
  "action", "alt", "aria-hidden", "aria-label", "aria-labelledby", "aria-modal", "autocomplete", "class", "d",
  "fill", "height", "href", "id", "inputmode", "method", "name", "placeholder", "required", "role", "src",
  "stroke", "stroke-linecap", "stroke-width", "style", "tabindex", "type", "value", "viewbox", "width",
]);

// CSS that can load something. A backslash covers CSS escapes; hex colours never contain one.
const UNSAFE_CSS = /url\(|image-set\(|@import|\\/i;

// SVG paint can reference a URL too, so it's limited to the forms the icons use.
const PAINT = /^(none|currentcolor|#[0-9a-f]{3,8})$/i;

/** Rules for the allowed attributes whose value could load, link or post somewhere. */
const valueRules = (action: FormAction): Record<string, (value: string) => boolean> => ({
  src: isRasterDataUrl,
  href: (v) => v.startsWith("#"),
  action: (v) => v === action,
  // The router's login command never rides along with guest details.
  name: (v) => action === "[ROUTER_FORM_ACTION]" || v.toLowerCase() !== "command",
  style: (v) => !UNSAFE_CSS.test(v),
  fill: (v) => PAINT.test(v),
  stroke: (v) => PAINT.test(v),
});

// A start or end tag exactly as React writes it: ` name="value"` attributes, double-quoted, with
// only React's five escapes in the value. Anything else (single-quoted or unquoted values, other
// character references, comments, `/` between attributes) can only come from raw markup.
const REACT_ESCAPES: Record<string, string> = {
  "&amp;": "&", "&quot;": '"', "&#x27;": "'", "&lt;": "<", "&gt;": ">",
};
const VALUE = String.raw`"(?:[^"<>&]|&(?:amp|quot|#x27|lt|gt);)*"`;
const TAG = new RegExp(String.raw`<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?: [^\s"'<>/=]+(?:=${VALUE})?)*)\/?>`, "y");
const ATTR = /([^\s"'<>/=]+)(?:="([^"]*)")?/g;

type Tag = { name: string; closing: boolean; attrs: [name: string, value: string][] };

/** Every tag in `markup`, names lower-cased and values unescaped. Fails if any `<` doesn't start one. */
function parseTags(markup: string): Tag[] {
  const tags: Tag[] = [];
  for (let at = markup.indexOf("<"); at >= 0; at = markup.indexOf("<", at + 1)) {
    TAG.lastIndex = at;
    const m = TAG.exec(markup);
    if (!m || (m[1] && m[3])) throw new ExportError(MSG_UNSAFE_OUTPUT);
    const attrs = [...m[3].matchAll(ATTR)].map(([, name, value = ""]): [string, string] => [
      name.toLowerCase(),
      value.replace(/&(?:amp|quot|#x27|lt|gt);/g, (e) => REACT_ESCAPES[e]),
    ]);
    tags.push({ name: m[2].toLowerCase(), closing: m[1] === "/", attrs });
    at = TAG.lastIndex - 1;
  }
  return tags;
}

/**
 * The last line of defence, run on the rendered body before the fixed form comment and wrapper
 * are added: every tag written the way React writes it, only allowed elements and attributes,
 * every src a raster data URL, every href an in-page fragment, every form action `action` (and
 * no command input when that's the portal service), and no inline style or SVG paint that can
 * fetch. Text content isn't checked, so terms that mention a web address export as inert text.
 */
function assertSelfContained(markup: string, action: FormAction): void {
  const rules = valueRules(action);
  for (const { name, closing, attrs } of parseTags(markup)) {
    if (!ALLOWED_TAGS.has(name)) throw new ExportError(MSG_UNSAFE_OUTPUT);
    // A form missing either would GET the guest's details to whatever host serves the page.
    if (name === "form" && !closing) {
      const has = (attr: string, value?: string) =>
        attrs.some(([a, v]) => a === attr && (value === undefined || v.toLowerCase() === value));
      if (!has("action") || !has("method", "post")) throw new ExportError(MSG_UNSAFE_OUTPUT);
    }
    for (const [attr, value] of attrs) {
      if (!ALLOWED_ATTRS.has(attr) || rules[attr]?.(value) === false) throw new ExportError(MSG_UNSAFE_OUTPUT);
    }
  }
}

async function renderPage(design: Design, name: string): Promise<string> {
  // Static markup has no `<!-- -->` text separators; renderToString would add them and fail the guard.
  const { renderToStaticMarkup } = await import("react-dom/server");
  let markup = renderToStaticMarkup(createElement(SplashPage, { design, screen: "landing", mode: "export" }));
  const action = formAction(design);
  assertSelfContained(markup, action);

  const formAt = markup.indexOf("<form");
  if (formAt >= 0) markup = markup.slice(0, formAt) + FORM_COMMENT[action] + markup.slice(formAt);

  const html =
    '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    // Stops iOS turning phone numbers in the terms into tel: links.
    '<meta name="format-detection" content="telephone=no">' +
    `<title>${escapeHtml(name.trim() || "WiFi login")}</title>` +
    `<style>${EXPORT_CSS}</style></head><body>${markup}</body></html>`;
  // The wrapper's fixed head adds exactly one <style>, and the body was checked to have none.
  if (html.match(/<style\b/gi)?.length !== 1) throw new ExportError(MSG_UNSAFE_OUTPUT);
  return html;
}

/**
 * Builds the standalone guest page. Every image is inlined first; a photo background that doesn't
 * fit what's left of PAGE_BUDGET is then re-encoded, and the smaller of the two copies ships
 * (T-023-reencode-only-when-needed). Rejects with an ExportError (a message for the customer)
 * when an image can't be inlined; over budget only sets `overBudget`.
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
    // Data URLs are ASCII, so their length is their size in bytes.
    if (bg.src.length > allowance) {
      try {
        const { dataUrl } = await withTimeout(
          Promise.resolve().then(() => reencode(bg.src, allowance)),
          IMAGE_TIMEOUT_MS,
        );
        // A copy that fits is always smaller; one that doesn't ships only if it's still smaller.
        if (isRasterDataUrl(dataUrl) && dataUrl.length < bg.src.length) {
          page = { ...page, background: { ...bg, src: dataUrl } };
          reencoded = true;
        }
      } catch {
        // Keep the inlined background, which is already a raster data URL; the size toast warns.
      }
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
    // Revoked well after the click: Safari can fail a blob download whose URL goes away too soon.
    setTimeout(() => URL.revokeObjectURL(url), DOWNLOAD_REVOKE_MS);
  }
}
