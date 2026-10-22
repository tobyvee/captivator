import type { CSSProperties, JSX, ReactNode } from "react";
import { bestTextColour, contrastRatio } from "../lib/contrast";
import type { Design } from "../lib/design-schema";
import type { BackgroundSpec, RenderMode } from "../lib/types";

export type TermsSheetProps = { design: Design; mode: RenderMode; onClose?: () => void };

// One sheet on screen at a time (the editor preview, or the export's :target section).
const TITLE_ID = "cv-terms-title";

// Both layers sit above SplashPage's content column, which is at z-index 1 over the background.
const DIM: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 2,
  background: "rgba(0,0,0,0.55)",
};

const SHEET: CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 2,
  height: "82%",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  gap: 14,
  padding: "10px 24px 28px",
  borderRadius: "22px 22px 0 0",
  textAlign: "left",
};

const CLOSE_X: CSSProperties = {
  flex: "0 0 auto",
  width: 44,
  height: 44,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  border: 0,
  borderRadius: 22,
  cursor: "pointer",
};

const BODY: CSSProperties = {
  flex: "1 1 auto",
  minHeight: 0,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 12,
  paddingRight: 4,
  fontSize: 15,
  lineHeight: 1.55,
};

/** The sheet's colour: the background's colour, the gradient's first stop or the photo's backdrop. */
function sheetColour(bg: BackgroundSpec): string {
  switch (bg.type) {
    case "colour":
      return bg.colour;
    case "gradient":
      return bg.from;
    case "image":
      return bg.backdrop;
  }
}

/** The first heading's colour when it reads at 4.5:1 on the sheet, otherwise near-black or white. */
function textColour(design: Design, sheet: string): string {
  const heading = design.blocks.find((b) => b.kind === "text" && b.role === "heading");
  if (heading?.kind === "text" && contrastRatio(heading.colour, sheet) >= 4.5)
    return heading.colour;
  return bestTextColour(sheet);
}

// Rendered as text only: React escapes it, and blank lines split it into paragraphs.
function paragraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

// The close × and CLOSE are buttons in edit and preview, and `#` links in the no-JS export.
function closeControl(
  mode: RenderMode,
  onClose: (() => void) | undefined,
  props: { "aria-label"?: string; style: CSSProperties; children: ReactNode },
): JSX.Element {
  if (mode === "export") return <a href="#" {...props} />;
  return <button type="button" onClick={onClose} {...props} />;
}

export function TermsSheet({ design, mode, onClose }: TermsSheetProps): JSX.Element {
  const { terms, button } = design.form;
  const sheet = sheetColour(design.background);
  const text = textColour(design, sheet);
  const outline = button.variant === "outline";

  const content = (
    <>
      <div
        aria-hidden="true"
        style={{
          alignSelf: "center",
          flex: "0 0 auto",
          width: 40,
          height: 5,
          borderRadius: 3,
          background: `${text}59`, // 35% alpha
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2
          id={TITLE_ID}
          style={{
            margin: 0,
            flexGrow: 1,
            fontSize: 22,
            fontWeight: 800,
            lineHeight: 1.2,
            color: text,
          }}
        >
          Terms of use
        </h2>
        {closeControl(mode, onClose, {
          "aria-label": "Close terms",
          style: { ...CLOSE_X, background: `${text}1F`, color: text }, // 12% alpha
          children: (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          ),
        })}
      </div>
      <div style={{ ...BODY, color: text }}>
        {paragraphs(terms.body).map((p, i) => (
          <p key={i} style={{ margin: 0, whiteSpace: "pre-line", overflowWrap: "anywhere" }}>
            {p}
          </p>
        ))}
      </div>
      <span style={{ fontSize: 12, color: text, opacity: 0.7 }}>Version {terms.version}</span>
      {closeControl(mode, onClose, {
        style: {
          alignSelf: "center",
          flex: "0 0 auto",
          width: "66%",
          minHeight: 50,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 12px",
          border: outline ? `2px solid ${button.bg}` : 0,
          borderRadius: 10,
          background: outline ? "transparent" : button.bg,
          color: button.fg,
          fontFamily: "inherit",
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textDecoration: "none",
          cursor: "pointer",
        },
        children: "CLOSE",
      })}
    </>
  );

  const sheetStyle: CSSProperties = { ...SHEET, background: sheet, color: text };

  if (mode === "export") {
    // No inline `display`: the export's <style> hides .cv-terms until #terms is the :target.
    return (
      <section
        id="terms"
        className="cv-terms"
        role="dialog"
        aria-labelledby={TITLE_ID}
        style={{ position: "fixed", inset: 0, zIndex: 10 }}
      >
        <div style={DIM} />
        <div style={sheetStyle}>{content}</div>
      </section>
    );
  }

  return (
    <>
      <div aria-hidden="true" onClick={onClose} style={DIM} />
      <section role="dialog" aria-modal="true" aria-labelledby={TITLE_ID} style={sheetStyle}>
        {content}
      </section>
    </>
  );
}
