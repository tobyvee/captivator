import type { CSSProperties, JSX, ReactNode } from "react";
import { contrastRatio, mainBackgroundColour, readableTextColour } from "../lib/contrast";
import type { Design } from "../lib/design-schema";
import type { RenderMode, TextBlockSpec } from "../lib/types";
import { connectButtonStyle } from "./Form";

export type TermsSheetProps = { design: Design; mode: RenderMode; onClose?: () => void };

/**
 * The export's terms link id. The export's close links and dim layer point here, so closing
 * returns the guest (and focus) to the link without `#` scrolling to the top; while nothing
 * carries the id, the fragment still clears `:target` without scrolling (T-021-close-to-terms-link).
 */
export const TERMS_LINK_ID = "cv-terms-link";

// One sheet on screen at a time (the editor preview, or the export's :target section).
const TITLE_ID = "cv-terms-title";

// Fixed in every mode, so the sheet is 82% of the viewport rather than of a root that grows with
// its content in the editor frames (T-021-fixed-sheet-in-every-mode). Its z-index sits above
// SplashPage's column (1) and credit (2).
const OVERLAY: CSSProperties = { position: "fixed", inset: 0, zIndex: 10 };

const DIM: CSSProperties = { position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" };

const SHEET: CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
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

// What CLOSE adds to Connect's look, so it also lays out as a centred flex item and as an <a>.
const CLOSE_EXTRAS: CSSProperties = {
  alignSelf: "center",
  flex: "0 0 auto",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 12px",
  textDecoration: "none",
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

/**
 * The first heading's colour when it reads at 4.5:1 on the sheet, otherwise near-black or white,
 * or pure black on mid-greys where neither reaches 4.5:1 (black always reaches 4.58:1).
 */
function textColour(design: Design, sheet: string): string {
  const heading = design.blocks.find(
    (b): b is TextBlockSpec => b.kind === "text" && b.role === "heading",
  );
  if (heading && contrastRatio(heading.colour, sheet) >= 4.5) return heading.colour;
  return readableTextColour(sheet);
}

// Rendered as text only: React escapes it, and blank lines split it into paragraphs.
function paragraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

// The close × and CLOSE are buttons in edit and preview, and links back to the terms link in
// the no-JS export.
function closeControl(
  mode: RenderMode,
  onClose: (() => void) | undefined,
  props: { "aria-label"?: string; style: CSSProperties; children: ReactNode },
): JSX.Element {
  if (mode === "export") return <a href={`#${TERMS_LINK_ID}`} {...props} />;
  return <button type="button" onClick={onClose} {...props} />;
}

export function TermsSheet({ design, mode, onClose }: TermsSheetProps): JSX.Element {
  const { terms, button } = design.form;
  const exporting = mode === "export";
  const sheet = mainBackgroundColour(design.background);
  const text = textColour(design, sheet);
  // An outline label sits on the sheet, not on `bg`; when `fg` can't be read there, CLOSE takes
  // the sheet's text colour (T-021-outline-close-uses-sheet-text).
  const outlineFails = button.variant === "outline" && contrastRatio(button.fg, sheet) < 4.5;

  return (
    // In the export there's no inline `display`: the <style> hides .cv-terms until #terms is the
    // :target, and tabIndex -1 lets that fragment navigation move focus into the dialog.
    <section
      id={exporting ? "terms" : undefined}
      className={exporting ? "cv-terms" : undefined}
      role="dialog"
      // Only the guest page is modal; in the editor the inspector and block list stay usable
      // beside the preview, so screen readers mustn't be confined to the sheet.
      aria-modal={exporting ? "true" : undefined}
      aria-labelledby={TITLE_ID}
      tabIndex={exporting ? -1 : undefined}
      style={OVERLAY}
    >
      {exporting ? (
        <a href={`#${TERMS_LINK_ID}`} aria-hidden="true" tabIndex={-1} style={DIM} />
      ) : (
        <div aria-hidden="true" onClick={onClose} style={DIM} />
      )}
      <div style={{ ...SHEET, background: sheet, color: text }}>
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
            style={{ margin: 0, flexGrow: 1, fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}
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
        {/* Focusable, so keyboard users can scroll a long body. */}
        <div role="region" aria-label="Terms text" tabIndex={0} style={BODY}>
          {paragraphs(terms.body).map((p, i) => (
            <p key={i} style={{ margin: 0, whiteSpace: "pre-line", overflowWrap: "anywhere" }}>
              {p}
            </p>
          ))}
        </div>
        <span style={{ fontSize: 12, opacity: 0.7 }}>Version {terms.version}</span>
        {closeControl(mode, onClose, {
          style: {
            ...connectButtonStyle(button),
            ...CLOSE_EXTRAS,
            ...(outlineFails ? { color: text, border: `2px solid ${text}` } : null),
          },
          children: "CLOSE",
        })}
      </div>
    </section>
  );
}
