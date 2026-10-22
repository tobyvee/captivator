import type { CSSProperties, JSX } from "react";
import type { BackgroundSpec, ImageBackground, RenderMode } from "../lib/types";

export type BackgroundProps = { background: BackgroundSpec; mode: RenderMode };

const ANGLE: Record<Extract<BackgroundSpec, { type: "gradient" }>["direction"], string> = {
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

// Above the content column and clickable, so it's a sibling of the layers, not inside them.
const CREDIT: CSSProperties = {
  position: "absolute",
  right: 10,
  bottom: 8,
  zIndex: 2,
  pointerEvents: "auto",
  margin: 0,
  fontSize: 11,
  lineHeight: 1.3,
  color: "#FFFFFF",
  textShadow: "0 1px 2px rgba(0, 0, 0, 0.6)",
};

const LINK: CSSProperties = { color: "inherit", textDecoration: "underline" };

const UTM = { utm_source: "captivator", utm_medium: "referral" };
const UNSPLASH_HOME = "https://unsplash.com/?utm_source=captivator&utm_medium=referral";

// The schema already allowlists profileUrl to https://unsplash.com/; this re-checks the origin so
// the renderer never links anywhere else, then adds the referral parameters Unsplash asks for.
function profileHref(profileUrl: string): string | null {
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

function Credit({ credit }: { credit: NonNullable<ImageBackground["credit"]> }): JSX.Element {
  const href = profileHref(credit.profileUrl);
  return (
    <p style={CREDIT}>
      Photo:{" "}
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" style={LINK}>
          {credit.name}
        </a>
      ) : (
        credit.name
      )}{" "}
      /{" "}
      <a href={UNSPLASH_HOME} target="_blank" rel="noopener noreferrer" style={LINK}>
        Unsplash
      </a>
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

// The background layers behind the SplashPage content, plus the Unsplash credit line when the
// photo has one. Renders the same in every mode.
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
        <>
          <div aria-hidden="true" style={{ ...LAYERS, background: background.backdrop }}>
            <Photo background={background} />
          </div>
          {background.credit && <Credit credit={background.credit} />}
        </>
      );
  }
}
