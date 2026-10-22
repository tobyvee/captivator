import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Design } from "./design-schema";
import {
  buildExportHtml,
  DOWNLOAD_REVOKE_MS,
  downloadHtml,
  escapeHtml,
  ExportError,
  exportFileName,
  IMAGE_TIMEOUT_MS,
  MSG_IMAGE_FAILED,
  MSG_UNSAFE_OUTPUT,
  PAGE_BUDGET,
  type ExportDeps,
} from "./export";
import { BLANK, SPONSOR } from "./templates";

const WEBP = "data:image/webp;base64,";

// Fake image deps: no canvas, no network.
const fakeInline = () =>
  vi.fn<ExportDeps["inline"]>(async (_src, kind) => `${WEBP}${kind === "background" ? "QkdC" : "SU1H"}`);
const fakeReencode = (dataUrl = `${WEBP}UkVF`) =>
  vi.fn<ExportDeps["reencode"]>(async () => ({ dataUrl, fits: true }));

const clone = (d: Design): Design => structuredClone(d);

/** Blank with the given fields and terms on, so the form and the sheet both render. */
function withForm(fields: Design["form"]["fields"], termsOn = true): Design {
  const d = clone(BLANK.design);
  d.form.fields = fields;
  d.form.terms.mode = termsOn ? "checkbox" : "off";
  return d;
}

/** An Unsplash background with a credit, plus an https image block. */
function unsplashDesign(): Design {
  const d = clone(SPONSOR.design);
  d.background = {
    type: "image",
    src: "https://images.unsplash.com/photo-1?ixid=x&w=1600&q=70",
    credit: {
      name: "Jo Photographer",
      profileUrl: "https://unsplash.com/@jo?utm_source=captivator&utm_medium=referral",
      downloadLocation: "https://api.unsplash.com/photos/1/download",
    },
    fit: "fill",
    zoom: 1,
    focus: { x: 50, y: 50 },
    backdrop: "#0B1220",
    overlay: null,
  };
  d.blocks.push({ id: "remote", kind: "image", src: "https://example.com/logo.png", alt: "Logo", size: "md" });
  return d;
}

const build = (design: Design, name = "Cafe WiFi", deps: Partial<ExportDeps> = {}) =>
  buildExportHtml(design, name, { inline: fakeInline(), reencode: fakeReencode(), ...deps });

const imgSrcs = (html: string) => [...html.matchAll(/<img[^>]*\ssrc="([^"]*)"/g)].map((m) => m[1]);

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("buildExportHtml: document shell", () => {
  it("starts with a doctype and has the viewport meta", async () => {
    const { html } = await build(BLANK.design);
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<meta charset="utf-8">');
  });

  it("stops iOS turning phone numbers into tel: links, and still passes the final check", async () => {
    const d = withForm(["phone"]);
    d.form.terms.body = "Questions? Call 020 7946 0000.";
    const { html } = await build(d);
    expect(html).toContain('<meta name="format-detection" content="telephone=no">');
    expect(html).toContain("020 7946 0000");
    expect(html).not.toContain("tel:");
  });

  it("has exactly one <style> block holding the .cv-root pair and the :target rule", async () => {
    const { html } = await build(withForm(["email"]));
    expect(html.match(/<style/g)).toHaveLength(1);
    const style = html.match(/<style>([\s\S]*?)<\/style>/)![1];
    expect(style).toContain(".cv-root{min-height:100vh;min-height:100dvh}");
    expect(style).toContain(".cv-terms{display:none}.cv-terms:target{display:block}");
    expect(style).toContain(".cv-root ::placeholder{color:inherit;opacity:.65}");
    expect(html).toContain('class="cv-root"');
  });

  it("escapes the design name in <title>", async () => {
    const { html } = await build(BLANK.design, "</title><script>x</script>");
    expect(html).toContain("<title>&lt;/title&gt;&lt;script&gt;x&lt;/script&gt;</title>");
    expect(html).not.toMatch(/<script/i);
  });

  it("falls back to a default title for an empty name", async () => {
    const { html } = await build(BLANK.design, "  ");
    expect(html).toContain("<title>WiFi login</title>");
  });

  it("has no <script> and no inline on… handler attributes", async () => {
    for (const design of [SPONSOR.design, withForm(["name", "phone"]), BLANK.design]) {
      const { html } = await build(design);
      expect(html).not.toMatch(/<script/i);
      expect(html).not.toMatch(/\son[a-z]+=/i);
    }
  });

  it("reports the UTF-8 byte size of the html", async () => {
    const { html, bytes, overBudget } = await build(BLANK.design, "Café ☕");
    expect(bytes).toBe(new TextEncoder().encode(html).length);
    expect(bytes).toBeGreaterThan(html.length); // é and ☕ take more than one byte
    expect(overBudget).toBe(false);
  });
});

describe("buildExportHtml: no network", () => {
  it("contains no http(s) URLs, no <link>, and only data:image/ img sources", async () => {
    const { html } = await build(unsplashDesign());
    expect(html).not.toMatch(/https?:\/\//);
    expect(html).not.toMatch(/<link/i);
    const srcs = imgSrcs(html);
    expect(srcs.length).toBeGreaterThanOrEqual(3);
    for (const src of srcs) expect(src.startsWith("data:image/")).toBe(true);
    // The Unsplash credit stays, as plain text (T-006-export-credit-plain-text).
    expect(html).toContain("Jo Photographer");
  });

  it("inlines a /templates/ photo as a data URL", async () => {
    const inline = fakeInline();
    const { html } = await build(SPONSOR.design, "Sponsor", { inline });
    expect(inline).toHaveBeenCalledWith("/templates/sponsor.jpg", "background");
    expect(html).not.toContain("/templates/");
    expect(imgSrcs(html).every((s) => s.startsWith("data:image/"))).toBe(true);
  });

  it("inlines https image blocks with the image kind and leaves data URLs alone", async () => {
    const inline = fakeInline();
    await build(unsplashDesign(), "x", { inline });
    expect(inline).toHaveBeenCalledWith("https://example.com/logo.png", "image");
    // Sponsor's two placeholder logos are already data URLs, so only the two remote images go out.
    expect(inline).toHaveBeenCalledTimes(2);
  });

  it("fails closed with a clear message when inline rejects, and never keeps the original src", async () => {
    const inline = vi.fn<ExportDeps["inline"]>(async (src) => {
      if (src.startsWith("https://example.com")) throw new Error("CORS refused");
      return `${WEBP}QkdC`;
    });
    const result = build(unsplashDesign(), "x", { inline });
    await expect(result).rejects.toBeInstanceOf(ExportError);
    await expect(result).rejects.toThrow(MSG_IMAGE_FAILED);
  });

  it("fails closed when inline hands back something other than a raster data URL", async () => {
    for (const bad of ["https://images.unsplash.com/photo-1", "/templates/sponsor.jpg", "data:image/svg+xml;base64,PHN2Zz4="]) {
      const inline = vi.fn<ExportDeps["inline"]>(async () => bad);
      await expect(build(SPONSOR.design, "x", { inline })).rejects.toThrow(MSG_IMAGE_FAILED);
    }
  });

  it("gives up on an image that never loads after IMAGE_TIMEOUT_MS", async () => {
    vi.useFakeTimers();
    const inline = vi.fn<ExportDeps["inline"]>(() => new Promise<string>(() => {}));
    const result = build(SPONSOR.design, "x", { inline });
    const settled = expect(result).rejects.toThrow(MSG_IMAGE_FAILED);
    await vi.advanceTimersByTimeAsync(IMAGE_TIMEOUT_MS);
    await settled;
  });
});

describe("buildExportHtml: final check", () => {
  // A renderer regression that let a remote src through must still fail closed.
  async function buildWith(element: ReturnType<typeof createElement>, design: Design = BLANK.design) {
    vi.resetModules();
    vi.doMock("../splash/SplashPage", () => ({ SplashPage: () => element }));
    try {
      const mod = await import("./export");
      return await mod.buildExportHtml(design, "x", { inline: fakeInline() });
    } finally {
      vi.doUnmock("../splash/SplashPage");
      vi.resetModules();
    }
  }

  it("refuses a remote img src, which React would also preload with a <link>", async () => {
    await expect(buildWith(createElement("img", { src: "https://example.com/x.png", alt: "" }))).rejects.toThrow(
      MSG_UNSAFE_OUTPUT,
    );
  });

  it("refuses an href that leaves the page and an action that isn't a placeholder", async () => {
    await expect(buildWith(createElement("a", { href: "https://example.com" }, "x"))).rejects.toThrow(
      MSG_UNSAFE_OUTPUT,
    );
    await expect(buildWith(createElement("form", { action: "https://example.com" }))).rejects.toThrow(
      MSG_UNSAFE_OUTPUT,
    );
  });

  it("refuses a CSS url() or image-set() in an inline style", async () => {
    const unsafe = [
      { background: "url(https://example.com/x.png)" },
      { backgroundImage: 'image-set("https://example.com/x.png" 1x)' },
    ];
    for (const style of unsafe) {
      await expect(buildWith(createElement("div", { style }))).rejects.toThrow(MSG_UNSAFE_OUTPUT);
    }
  });

  it("refuses an SVG <image> with an xlink:href", async () => {
    const svg = createElement("svg", null, createElement("image", { xlinkHref: "https://example.com/x.png" }));
    await expect(buildWith(svg)).rejects.toThrow(MSG_UNSAFE_OUTPUT);
  });

  it("refuses a <meta> refresh and an extra <style> with @import", async () => {
    const meta = createElement("meta", { httpEquiv: "refresh", content: "0;url=https://example.com" });
    await expect(buildWith(meta)).rejects.toThrow(MSG_UNSAFE_OUTPUT);
    const style = createElement("style", null, "@import url(https://example.com/x.css);");
    await expect(buildWith(style)).rejects.toThrow(MSG_UNSAFE_OUTPUT);
  });

  it("refuses a ping attribute, even on an in-page link", async () => {
    const a = createElement("a", { href: "#x", ping: "https://example.com" }, "x");
    await expect(buildWith(a)).rejects.toThrow(MSG_UNSAFE_OUTPUT);
  });

  it("passes the real photo-background exports: gradients, 8-digit hex tints and the close icon", async () => {
    const credited = unsplashDesign();
    if (credited.background.type === "image") {
      credited.background.overlay = { from: "#1E293B", to: "#080C18", opacity: 0.7 };
    }
    for (const design of [SPONSOR.design, credited]) {
      const { html } = await build(design);
      expect(html).toMatch(/linear-gradient\(/);
      expect(html).toMatch(/#[0-9A-F]{8}\b/i);
      expect(html).toMatch(/<svg[\s\S]*<path/);
      expect(html.match(/<style/g)).toHaveLength(1);
    }
  });

  it("refuses the router placeholder when the design collects guest details", async () => {
    const form = createElement("form", { action: "[ROUTER_FORM_ACTION]" }, createElement("input", { name: "email" }));
    await expect(buildWith(form, withForm(["email"]))).rejects.toThrow(MSG_UNSAFE_OUTPUT);
    const { html } = await build(SPONSOR.design);
    expect(html).toContain('action="[PORTAL_SUBMIT_URL]"');
  });

  it("refuses a command input when the design collects guest details", async () => {
    const form = createElement(
      "form",
      { action: "[PORTAL_SUBMIT_URL]" },
      createElement("input", { name: "email" }),
      createElement("input", { type: "hidden", name: "command", value: "login" }),
    );
    await expect(buildWith(form, withForm(["email"]))).rejects.toThrow(MSG_UNSAFE_OUTPUT);
  });

  // Raw markup skips React's quoting and escaping, so it can't be read the way React output is.
  const raw = (__html: string) => createElement("div", { dangerouslySetInnerHTML: { __html } });

  it("refuses single-quoted and unquoted attribute values", async () => {
    await expect(buildWith(raw("<img src='https://example.com/x.png' alt=''>"))).rejects.toThrow(MSG_UNSAFE_OUTPUT);
    await expect(buildWith(raw("<div style=background:url(https://example.com/x.png)>x</div>"))).rejects.toThrow(
      MSG_UNSAFE_OUTPUT,
    );
  });

  it("refuses attribute values with character references React doesn't write", async () => {
    const style = '<div style="background:url&#40;https://example.com/x.png&#41;">x</div>';
    await expect(buildWith(raw(style))).rejects.toThrow(MSG_UNSAFE_OUTPUT);
  });

  it("refuses markup React wouldn't write, such as a comment or a slash between attributes", async () => {
    await expect(buildWith(raw("<!-- x -->"))).rejects.toThrow(MSG_UNSAFE_OUTPUT);
    await expect(buildWith(raw('<img/src="https://example.com/x.png">'))).rejects.toThrow(MSG_UNSAFE_OUTPUT);
  });

  it("passes customer text with quotes, ampersands, angle brackets and name=value pairs", async () => {
    const d = withForm(["name", "email"]);
    const odd = `Tom's "Cafe" & <Bar> a=b c='d'`;
    d.blocks.push(
      { id: "t", kind: "text", text: odd, role: "heading", colour: "#111111", size: 30 },
      { id: "i", kind: "image", src: `${WEBP}SU1H`, alt: odd, size: "md" },
    );
    d.form.terms.body = odd;
    d.form.terms.linkText = "terms & c='x'";
    d.form.button.label = 'Go "now"';
    const { html } = await build(d);
    expect(html).toContain("Tom&#x27;s &quot;Cafe&quot; &amp; &lt;Bar&gt; a=b c=&#x27;d&#x27;");
  });

  it("lets web addresses through as plain text, such as in the terms", async () => {
    const { html } = await buildWith(createElement("p", null, "See https://example.com"));
    expect(html).toContain("See https://example.com");
  });
});

describe("buildExportHtml: form", () => {
  it("marks the fields and the terms checkbox required", async () => {
    const { html } = await build(withForm(["name", "email"]));
    const inputs = [...html.matchAll(/<input[^>]*>/g)].map((m) => m[0]);
    const visible = inputs.filter((i) => !i.includes('type="hidden"'));
    expect(visible).toHaveLength(3);
    for (const input of visible) expect(input).toMatch(/\srequired=""/);
    expect(inputs.find((i) => i.includes('type="checkbox"'))).not.toMatch(/checked/);
  });

  it("has the terms sheet with id=terms and a link to it", async () => {
    const { html } = await build(withForm(["email"]));
    expect(html).toMatch(/<section[^>]*id="terms"/);
    expect(html).toContain('href="#terms"');
  });

  it("with fields, posts to [PORTAL_SUBMIT_URL] with no command input and the two-hop comment", async () => {
    const { html } = await build(withForm(["name", "email"]));
    expect(html).toContain('action="[PORTAL_SUBMIT_URL]"');
    expect(html).toContain('method="post"');
    expect(html).not.toContain("[ROUTER_FORM_ACTION]");
    expect(html).not.toContain('name="command"');
    expect(html).toMatch(/<!--[^>]*portal service[^>]*no personal data[^>]*-->\s*<form/);
  });

  it("with no fields, posts to [ROUTER_FORM_ACTION] with command=login and the Peplink comment", async () => {
    const { html } = await build(withForm([], false));
    expect(html).toContain('action="[ROUTER_FORM_ACTION]"');
    expect(html).not.toContain("[PORTAL_SUBMIT_URL]");
    expect(html).toMatch(/<input type="hidden" name="command" value="login"\/?>/);
    expect(html).toMatch(/<!--[^>]*Peplink[^>]*-->\s*<form/);
  });

  it("keeps design data out of the form comment", async () => {
    const d = withForm(["email"]);
    d.form.button.label = "ZZ-MARK";
    const { html } = await build(d, "ZZ-NAME");
    const comment = html.match(/<!--([\s\S]*?)-->/)![1];
    expect(comment).not.toContain("ZZ-");
  });
});

describe("buildExportHtml: background re-encode", () => {
  /** A raster data URL exactly `length` characters long. */
  const dataUrlOfLength = (length: number) => WEBP + "A".repeat(length - WEBP.length);

  // An inlined background bigger than the whole budget, so it always needs re-encoding.
  const BIG = dataUrlOfLength(PAGE_BUDGET * 2);
  const bigInline = () => vi.fn<ExportDeps["inline"]>(async () => BIG);
  const buildBig = (reencode: ExportDeps["reencode"]) =>
    build(SPONSOR.design, "Sponsor", { inline: bigInline(), reencode });

  it("gives reencode the budget left after the rest of the page, so a result that size fits exactly", async () => {
    let allowance = 0;
    const reencode = vi.fn<ExportDeps["reencode"]>(async (_src, a) => {
      allowance = a;
      return { dataUrl: dataUrlOfLength(a), fits: true };
    });
    // A multi-byte name in <title> checks the allowance counts UTF-8 bytes, not characters.
    const { html, bytes, overBudget, reencoded } = await build(SPONSOR.design, "Café ☕", {
      inline: bigInline(),
      reencode,
    });
    expect(reencode).toHaveBeenCalledWith(BIG, expect.any(Number));
    expect(html).toContain("<title>Café ☕</title>");
    expect(allowance).toBeGreaterThan(0);
    expect(allowance).toBeLessThan(PAGE_BUDGET);
    expect(bytes).toBe(PAGE_BUDGET);
    expect(overBudget).toBe(false);
    expect(reencoded).toBe(true);
  });

  it("ships a re-encode that can't fit when it's still smaller than the inlined copy", async () => {
    const reencode = vi.fn<ExportDeps["reencode"]>(async (_src, a) => ({
      dataUrl: dataUrlOfLength(a + 4),
      fits: false,
    }));
    const { bytes, overBudget, reencoded } = await buildBig(reencode);
    expect(bytes).toBe(PAGE_BUDGET + 4);
    expect(overBudget).toBe(true);
    expect(reencoded).toBe(true);
  });

  it("keeps the inlined copy when the best re-encode is no smaller", async () => {
    const reencode = vi.fn<ExportDeps["reencode"]>(async () => ({ dataUrl: dataUrlOfLength(BIG.length), fits: false }));
    const { html, overBudget, reencoded } = await buildBig(reencode);
    expect(reencode).toHaveBeenCalledOnce();
    expect(reencoded).toBe(false);
    expect(overBudget).toBe(true);
    expect(imgSrcs(html)).toContain(BIG);
  });

  it("skips the re-encode when the inlined copy already fits", async () => {
    const reencode = fakeReencode();
    const { html, overBudget, reencoded } = await build(SPONSOR.design, "Sponsor", { reencode });
    expect(reencode).not.toHaveBeenCalled();
    expect(reencoded).toBe(false);
    expect(overBudget).toBe(false);
    expect(imgSrcs(html)).toContain(`${WEBP}QkdC`);
  });

  it("keeps the inlined background when reencode fails", async () => {
    const reencode = vi.fn<ExportDeps["reencode"]>(async () => {
      throw new Error("encode failed");
    });
    const { html, reencoded } = await buildBig(reencode);
    expect(reencode).toHaveBeenCalledOnce();
    expect(reencoded).toBe(false);
    expect(imgSrcs(html)).toContain(BIG);
    expect(html).not.toContain("/templates/");
  });

  it("keeps the inlined background when reencode never settles, after IMAGE_TIMEOUT_MS", async () => {
    vi.useFakeTimers();
    let started!: () => void;
    const reencodeStarted = new Promise<void>((resolve) => (started = resolve));
    const reencode = vi.fn<ExportDeps["reencode"]>(() => {
      started();
      return new Promise(() => {});
    });
    const result = buildBig(reencode);
    await reencodeStarted; // the timeout is armed before reencode is called
    await vi.advanceTimersByTimeAsync(IMAGE_TIMEOUT_MS);
    const { html, reencoded } = await result;
    expect(reencoded).toBe(false);
    expect(imgSrcs(html)).toContain(BIG);
  });

  it("ignores a reencode result that isn't a raster data URL", async () => {
    const { html, reencoded } = await buildBig(fakeReencode("https://images.unsplash.com/photo-1"));
    expect(reencoded).toBe(false);
    expect(imgSrcs(html)).toContain(BIG);
    expect(html).not.toMatch(/https?:\/\//);
  });

  it("doesn't re-encode colour or gradient backgrounds", async () => {
    const reencode = fakeReencode();
    const { reencoded } = await build(BLANK.design, "x", { reencode });
    expect(reencode).not.toHaveBeenCalled();
    expect(reencoded).toBe(false);
  });
});

describe("escapeHtml", () => {
  it("escapes & < > \" '", () => {
    expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe(
      "&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;",
    );
  });
});

describe("exportFileName", () => {
  it("strips diacritics and punctuation", () => {
    expect(exportFileName("Café / WiFi!")).toBe("cafe-wifi.html");
  });

  it("falls back to wifi-login.html for an empty or symbol-only name", () => {
    expect(exportFileName("")).toBe("wifi-login.html");
    expect(exportFileName("  /!? ")).toBe("wifi-login.html");
  });

  it("keeps path and markup characters out and caps the length at 60", () => {
    const name = exportFileName(`../../${"a".repeat(80)}<script>`);
    expect(name).toMatch(/^[a-z0-9-]+\.html$/);
    expect(name.length).toBeLessThanOrEqual(60 + ".html".length);
    expect(exportFileName(`${"a".repeat(59)} b`)).toBe(`${"a".repeat(59)}.html`);
  });
});

describe("downloadHtml", () => {
  it("downloads a text/html blob under the safe file name, then revokes the URL after DOWNLOAD_REVOKE_MS", async () => {
    vi.useFakeTimers();
    const anchor = { href: "", download: "", style: {} as Record<string, string>, click: vi.fn(), remove: vi.fn() };
    const appendChild = vi.fn();
    vi.stubGlobal("document", { createElement: vi.fn(() => anchor), body: { appendChild } });
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:export");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    downloadHtml("<!doctype html><p>hi</p>", "Café / WiFi!");

    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("text/html");
    expect(await blob.text()).toBe("<!doctype html><p>hi</p>");
    expect(anchor.href).toBe("blob:export");
    expect(anchor.download).toBe("cafe-wifi.html");
    expect(anchor.click).toHaveBeenCalledOnce();
    expect(anchor.remove).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(DOWNLOAD_REVOKE_MS - 1);
    expect(revokeObjectURL).not.toHaveBeenCalled(); // Safari needs the URL a while after the click
    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:export");
  });
});
