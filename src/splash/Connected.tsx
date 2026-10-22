import type { CSSProperties, JSX } from "react";
import { backgroundColours, bestTextColour, mainBackgroundColour } from "../lib/contrast";
import type { Design } from "../lib/design-schema";
import type { ImageBlockSpec, RenderMode, TextBlockSpec } from "../lib/types";
import { connectButtonStyle } from "./Form";
import { ImageBlock } from "./blocks/ImageBlock";
import { COLUMN } from "./layout";

export type ConnectedProps = { design: Design; mode: RenderMode; onContinue?: () => void };

const SPACER: CSSProperties = { flex: 1 };

const BADGE: CSSProperties = {
  flexShrink: 0,
  width: 72,
  height: 72,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 36,
};

/** "You're online": the logo, a tick badge, the sponsor when there is one, and CONTINUE. */
export function Connected({ design, mode, onContinue }: ConnectedProps): JSX.Element {
  const images = design.blocks.filter((b): b is ImageBlockSpec => b.kind === "image");
  const [logo, sponsor] = images;
  const heading = design.blocks.find(
    (b): b is TextBlockSpec => b.kind === "text" && b.role === "heading",
  );
  const page = backgroundColours(design.background);
  const accent = heading?.colour ?? bestTextColour(page);
  // In the editor, clicks on empty space fall through to SplashPage's root, which selects the
  // background (T-022-connected-clicks-fall-through).
  const interactive = mode !== "export";

  return (
    <div style={interactive ? { ...COLUMN, pointerEvents: "none" } : COLUMN}>
      {logo && <ImageBlock block={logo} />}
      <div aria-hidden="true" style={SPACER} />
      <div
        aria-hidden="true"
        style={{ ...BADGE, background: accent, color: mainBackgroundColour(design.background) }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <h1
        role="status"
        style={{
          margin: 0,
          fontSize: 40,
          lineHeight: 1.05,
          fontWeight: 800,
          letterSpacing: "0.01em",
          color: accent,
        }}
      >
        You&apos;re online
      </h1>
      <div aria-hidden="true" style={SPACER} />
      {sponsor && (
        <>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: bestTextColour(page) }}>
            Thanks to our sponsor
          </p>
          <ImageBlock block={sponsor} />
        </>
      )}
      <button
        type="button"
        onClick={interactive ? onContinue : undefined}
        style={{
          ...connectButtonStyle(design.form.button),
          ...(interactive ? { pointerEvents: "auto" } : null),
        }}
      >
        CONTINUE
      </button>
    </div>
  );
}
