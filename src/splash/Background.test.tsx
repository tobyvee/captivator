import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { BackgroundSpec, ImageBackground, RenderMode } from "../lib/types";
import { Background, Credit } from "./Background";

type El = { tag: string; attrs: Record<string, string>; style: Record<string, string> };

// A small tag scanner for the static markup, so the tests run in node without jsdom.
function elements(html: string): El[] {
  return [...html.matchAll(/<([a-z]+)((?:\s+[a-z-]+="[^"]*")*)\s*\/?>/g)].map(([, tag, raw]) => {
    const attrs = Object.fromEntries(
      [...raw.matchAll(/([a-z-]+)="([^"]*)"/g)].map(([, k, v]) => [k, v.replaceAll("&amp;", "&")]),
    );
    const style = Object.fromEntries(
      (attrs.style ?? "")
        .split(";")
        .filter(Boolean)
        .map((d) => {
          const i = d.indexOf(":");
          return [d.slice(0, i), d.slice(i + 1)];
        }),
    );
    return { tag, attrs, style };
  });
}

const render = (background: BackgroundSpec) =>
  renderToStaticMarkup(<Background background={background} mode="export" />);

// A data URL, as in the export: React's static renderer adds a <link rel="preload"> for any other
// img src, which would be an external request on the guest page.
const PHOTO_SRC = "data:image/webp;base64,UklGRg==";

const PHOTO: ImageBackground = {
  type: "image",
  src: PHOTO_SRC,
  fit: "fill",
  zoom: 1.15,
  focus: { x: 50, y: 58 },
  backdrop: "#0B1F2E",
  overlay: { from: "#000000", to: "#111111", opacity: 0.55 },
};

const photo = (patch: Partial<ImageBackground>) => elements(render({ ...PHOTO, ...patch }));

const CREDIT = {
  name: "Alex S.",
  profileUrl: "https://unsplash.com/@santsec24",
  downloadLocation: "https://api.unsplash.com/photos/abc/download",
};

describe("Background layers", () => {
  it("colour renders a solid fill on an absolute, click-through layer behind the content", () => {
    const [layer, ...rest] = elements(render({ type: "colour", colour: "#FF8800" }));
    expect(rest).toHaveLength(0);
    expect(layer.style).toMatchObject({
      position: "absolute",
      inset: "0",
      "z-index": "0",
      "pointer-events": "none",
      background: "#FF8800",
    });
  });

  it.each([
    ["down", "180deg"],
    ["diagonal", "135deg"],
    ["right", "90deg"],
  ] as const)("gradient %s renders linear-gradient(%s, from, to)", (direction, angle) => {
    const [layer] = elements(render({ type: "gradient", from: "#0F2A44", to: "#0E5E6F", direction }));
    expect(layer.style.background).toBe(`linear-gradient(${angle}, #0F2A44, #0E5E6F)`);
  });

  it("photo fill: a covering, zoomed, focus-anchored img over the backdrop colour", () => {
    const [layer, img] = photo({});
    expect(layer.style).toMatchObject({
      background: "#0B1F2E",
      overflow: "hidden",
      "pointer-events": "none",
    });
    expect(img.tag).toBe("img");
    expect(img.attrs.src).toBe(PHOTO_SRC);
    expect(img.style).toMatchObject({
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      "object-fit": "cover",
      "object-position": "50% 58%",
      transform: "scale(1.15)",
      "transform-origin": "50% 58%",
    });
  });

  it("photo fit: contained with no scale, so the backdrop shows around it", () => {
    const [layer, img] = photo({ fit: "fit", zoom: 2 });
    expect(layer.style.background).toBe("#0B1F2E");
    expect(img.style["object-fit"]).toBe("contain");
    expect(img.style.transform).toBeUndefined();
  });

  it("photo img is decorative: empty alt and aria-hidden", () => {
    const img = photo({}).find((e) => e.tag === "img")!;
    expect(img.attrs.alt).toBe("");
    expect(img.attrs["aria-hidden"]).toBe("true");
  });

  it("overlay is a top-to-bottom gradient of its two colours at its opacity", () => {
    const [, , overlay] = photo({});
    expect(overlay.style).toMatchObject({
      position: "absolute",
      inset: "0",
      background: "linear-gradient(180deg, #000000, #111111)",
      opacity: "0.55",
    });
  });

  it("no overlay layer when overlay is null", () => {
    expect(photo({ overlay: null }).map((e) => e.tag)).toEqual(["div", "img"]);
  });
});

describe("Background without the credit", () => {
  it("renders no text or links, even when the photo has a credit (SplashPage places the Credit)", () => {
    const tags = elements(render({ ...PHOTO, credit: CREDIT })).map((e) => e.tag);
    expect(tags).toEqual(["div", "img", "div"]);
  });
});

describe("Credit", () => {
  const credit = (mode: RenderMode, patch: Partial<typeof CREDIT> = {}) =>
    renderToStaticMarkup(<Credit credit={{ ...CREDIT, ...patch }} mode={mode} />);
  const textOf = (html: string) => html.replace(/<[^>]+>/g, "");
  const links = (html: string) => elements(html).filter((e) => e.tag === "a");

  it.each<RenderMode>(["edit", "preview"])(
    "%s: Photo: name / Unsplash with referral links that open safely in a new tab",
    (mode) => {
      const html = credit(mode);
      expect(links(html).map((a) => a.attrs.href)).toEqual([
        "https://unsplash.com/@santsec24?utm_source=captivator&utm_medium=referral",
        "https://unsplash.com/?utm_source=captivator&utm_medium=referral",
      ]);
      for (const a of links(html)) {
        expect(a.attrs.target).toBe("_blank");
        expect(a.attrs.rel).toBe("noopener noreferrer");
      }
      expect(textOf(html)).toBe("Photo: Alex S. / Unsplash");
    },
  );

  it("export: plain text with no links, which the login sheet can't open before sign-in", () => {
    const html = credit("export");
    expect(html).not.toContain("<a");
    expect(textOf(html)).toBe("Photo: Alex S. / Unsplash");
  });

  it("is one absolute line inside the safe area above the content, clickable, on a dark backing", () => {
    const [line] = elements(credit("preview"));
    expect(line.tag).toBe("p");
    expect(line.style).toMatchObject({
      position: "absolute",
      right: "calc(10px + env(safe-area-inset-right, 0px))",
      bottom: "calc(8px + env(safe-area-inset-bottom, 0px))",
      "z-index": "2",
      "pointer-events": "auto",
      background: "rgba(0, 0, 0, 0.6)",
      padding: "2px 6px",
      "border-radius": "4px",
      color: "#FFFFFF",
    });
  });

  it("keeps a 500-character name to one ellipsized line that can't wrap up over Connect", () => {
    const name = `<b>${"x".repeat(497)}`;
    const html = credit("edit", { name });
    const [line] = elements(html);
    expect(line.style).toMatchObject({
      "white-space": "nowrap",
      overflow: "hidden",
      "text-overflow": "ellipsis",
      "max-width": "calc(100% - 20px - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px))",
      "box-sizing": "border-box",
    });
    expect(html).toContain(`&lt;b&gt;${"x".repeat(497)}`);
    expect(elements(html).map((e) => e.tag)).toEqual(["p", "span", "a", "a"]);
    // The name ellipsizes inside its own box, so "/ Unsplash" stays visible after it.
    expect(elements(html)[1].style).toMatchObject({
      display: "inline-block",
      "max-width": "18em",
      overflow: "hidden",
      "text-overflow": "ellipsis",
    });
    expect(html).toMatch(/<\/span> \/ <a[^>]*>Unsplash<\/a><\/p>$/);
  });

  it.each<RenderMode>(["edit", "export"])(
    "%s: an empty or blank name renders Photo: Unsplash without an empty link",
    (mode) => {
      for (const name of ["", "   "]) {
        const html = credit(mode, { name });
        expect(textOf(html)).toBe("Photo: Unsplash");
        expect(links(html).map((a) => a.attrs.href)).toEqual(
          mode === "export" ? [] : ["https://unsplash.com/?utm_source=captivator&utm_medium=referral"],
        );
      }
    },
  );

  it("keeps referral parameters the profile URL already has, adding only missing ones", () => {
    const html = credit("preview", { profileUrl: "https://unsplash.com/@a?utm_source=captivator" });
    expect(links(html)[0].attrs.href).toBe(
      "https://unsplash.com/@a?utm_source=captivator&utm_medium=referral",
    );
  });

  it.each<RenderMode>(["edit", "export"])("%s: renders the photographer name as text, never markup", (mode) => {
    const html = credit(mode, { name: '<img src=x onerror="alert(1)">' });
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(elements(html).filter((e) => e.tag === "img")).toHaveLength(0);
  });

  it("does not link a profile URL off unsplash.com even if one gets past the schema", () => {
    const html = credit("preview", { profileUrl: "https://unsplash.com.evil.example/@x" });
    expect(links(html).map((a) => a.attrs.href)).toEqual([
      "https://unsplash.com/?utm_source=captivator&utm_medium=referral",
    ]);
    expect(textOf(html)).toBe("Photo: Alex S. / Unsplash");
  });
});
