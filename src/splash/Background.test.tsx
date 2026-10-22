import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { BackgroundSpec, ImageBackground } from "../lib/types";
import { Background } from "./Background";

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
    expect(layer.style.background).toBe("#0B1F2E");
    expect(layer.style["pointer-events"]).toBe("none");
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

describe("Background credit", () => {
  it("shows no credit line without a credit", () => {
    const html = render(PHOTO);
    expect(html).not.toContain("<a");
    expect(html).not.toContain("Unsplash");
  });

  it("renders Photo: name / Unsplash with referral links that open safely in a new tab", () => {
    const html = render({ ...PHOTO, credit: CREDIT });
    const els = elements(html);
    const links = els.filter((e) => e.tag === "a");
    expect(links.map((a) => a.attrs.href)).toEqual([
      "https://unsplash.com/@santsec24?utm_source=captivator&utm_medium=referral",
      "https://unsplash.com/?utm_source=captivator&utm_medium=referral",
    ]);
    for (const a of links) {
      expect(a.attrs.target).toBe("_blank");
      expect(a.attrs.rel).toBe("noopener noreferrer");
    }
    expect(html.replace(/<[^>]+>/g, "")).toBe("Photo: Alex S. / Unsplash");
  });

  it("sits above the content and stays clickable, outside the click-through layer", () => {
    const html = render({ ...PHOTO, credit: CREDIT });
    const [layer] = elements(html);
    const line = elements(html).find((e) => e.tag === "p")!;
    expect(line.style).toMatchObject({ position: "absolute", "z-index": "2", "pointer-events": "auto" });
    // The layer div closes before the credit line opens.
    expect(html.indexOf("</div><p")).toBeGreaterThan(0);
    expect(layer.style["pointer-events"]).toBe("none");
  });

  it("keeps referral parameters the profile URL already has, adding only missing ones", () => {
    const links = elements(
      render({ ...PHOTO, credit: { ...CREDIT, profileUrl: "https://unsplash.com/@a?utm_source=captivator" } }),
    ).filter((e) => e.tag === "a");
    expect(links[0].attrs.href).toBe(
      "https://unsplash.com/@a?utm_source=captivator&utm_medium=referral",
    );
  });

  it("renders the photographer name as text, never markup", () => {
    const name = '<img src=x onerror="alert(1)">';
    const html = render({ ...PHOTO, credit: { ...CREDIT, name } });
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(elements(html).filter((e) => e.tag === "img")).toHaveLength(1);
  });

  it("does not link a profile URL off unsplash.com even if one gets past the schema", () => {
    const html = render({
      ...PHOTO,
      credit: { ...CREDIT, profileUrl: "https://unsplash.com.evil.example/@x" },
    });
    const hrefs = elements(html)
      .filter((e) => e.tag === "a")
      .map((a) => a.attrs.href);
    expect(hrefs).toEqual(["https://unsplash.com/?utm_source=captivator&utm_medium=referral"]);
    expect(html).toContain("Alex S.");
  });
});
