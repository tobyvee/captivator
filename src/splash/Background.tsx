import type { CSSProperties, JSX } from "react";
import type { BackgroundSpec, ImageBackground, RenderMode } from "../lib/types";
import { clearOfEdge } from "./layout";

export type BackgroundProps = { background: BackgroundSpec; mode: RenderMode };

// CSS angle per gradient direction. The editor's block-list swatch draws gradients with it too.
export const ANGLE: Record<Extract<BackgroundSpec, { type: "gradient" }>["direction"], string> = {
  down: "180deg",
  diagonal: "135deg",
  right: "90deg",
};

// Sits behind the content column (z-index 1). Clicks fall through to the root, which selects
// the background in edit mode (T-005-background-select-on-own-target.md).
const LAYERS: CSSProperties = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  zIndex: 0,
  pointerEvents: "none",
};

const FILL: CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%" };

// SplashPage renders the credit after the content (reading order) and above it (z-index 2), so its
// links stay clickable. One line with a dark backing: white 11px text over rgba(0,0,0,0.6) is at
// least 5.7:1 over any photo, and a long name ellipsizes instead of wrapping up over Connect.
const CREDIT: CSSProperties = {
  position: "absolute",
  right: clearOfEdge("right", 10),
  bottom: clearOfEdge("bottom", 8),
  zIndex: 2,
  pointerEvents: "auto",
  boxSizing: "border-box",
  maxWidth: "calc(100% - 20px - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px))",
  margin: 0,
  padding: "2px 6px",
  borderRadius: 4,
  background: "rgba(0, 0, 0, 0.6)",
  fontSize: 11,
  lineHeight: 1.3,
  color: "#FFFFFF",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const LINK: CSSProperties = { color: "inherit", textDecoration: "underline" };

// The name ellipsizes on its own, so a long one can't push "/ Unsplash" out of view.
const NAME: CSSProperties = {
  display: "inline-block",
  maxWidth: "18em",
  overflow: "hidden",
  textOverflow: "ellipsis",
  verticalAlign: "bottom",
};

const UTM = { utm_source: "captivator", utm_medium: "referral" };
export const UNSPLASH_HOME = "https://unsplash.com/?utm_source=captivator&utm_medium=referral";

// The schema already allowlists profileUrl to https://unsplash.com/; this re-checks the origin so
// the renderer never links anywhere else, then adds the referral parameters Unsplash asks for.
// The editor's Background panel links the same way (T-016-credit-href-shared-with-splash).
export function profileHref(profileUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(profileUrl);
  } catch {
    return null;
  }
  if (url.origin !== "https://unsplash.com") return null;
  for (const [key, value] of Object.entries(UTM)) {
    if (!url.searchParams.has(key)) url.searchParams.set(key, value);
  }
  return url.toString();
}

export type CreditProps = { credit: NonNullable<ImageBackground["credit"]>; mode: RenderMode };

// "Photo: {name} / Unsplash". The export shows it as plain text, because links can't open from the
// login sheet before sign-in (T-006-export-credit-plain-text.md); the editor keeps both links.
export function Credit({ credit, mode }: CreditProps): JSX.Element {
  const name = credit.name.trim();
  const linked = mode !== "export";
  const href = linked && name ? profileHref(credit.profileUrl) : null;
  return (
    <p style={CREDIT}>
      Photo:{" "}
      {name && (
        <>
          <span style={NAME}>
            {href ? (
              <a href={href} target="_blank" rel="noopener noreferrer" style={LINK}>
                {name}
              </a>
            ) : (
              name
            )}
          </span>{" "}
          /{" "}
        </>
      )}
      {linked ? (
        <a href={UNSPLASH_HOME} target="_blank" rel="noopener noreferrer" style={LINK}>
          Unsplash
        </a>
      ) : (
        "Unsplash"
      )}
    </p>
  );
}

function Photo({ background }: { background: ImageBackground }): JSX.Element {
  const { fit, zoom, focus, overlay } = background;
  const origin = `${focus.x}% ${focus.y}%`;
  return (
    <>
      <img
        src={background.src}
        alt=""
        aria-hidden="true"
        style={{
          ...FILL,
          display: "block",
          objectPosition: origin,
          ...(fit === "fill"
            ? { objectFit: "cover", transform: `scale(${zoom})`, transformOrigin: origin }
            : { objectFit: "contain" }),
        }}
      />
      {overlay && (
        <div
          style={{
            ...FILL,
            background: `linear-gradient(180deg, ${overlay.from}, ${overlay.to})`,
            opacity: overlay.opacity,
          }}
        />
      )}
    </>
  );
}

// The background layers behind the SplashPage content. Renders the same in every mode; the
// Unsplash credit line is the separate `Credit`, which SplashPage places after the content.
export function Background({ background }: BackgroundProps): JSX.Element {
  switch (background.type) {
    case "colour":
      return <div aria-hidden="true" style={{ ...LAYERS, background: background.colour }} />;
    case "gradient":
      return (
        <div
          aria-hidden="true"
          style={{
            ...LAYERS,
            background: `linear-gradient(${ANGLE[background.direction]}, ${background.from}, ${background.to})`,
          }}
        />
      );
    case "image":
      return (
        <div aria-hidden="true" style={{ ...LAYERS, background: background.backdrop }}>
          <Photo background={background} />
        </div>
      );
  }
}
