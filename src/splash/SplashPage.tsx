import { Fragment, type CSSProperties, type JSX, type MouseEvent } from "react";
import type { Design } from "../lib/design-schema";
import type { RenderMode, Screen, Selection, TextBlockSpec } from "../lib/types";
import { Background, Credit } from "./Background";
import { Connected } from "./Connected";
import { Form } from "./Form";
import { TermsSheet } from "./TermsSheet";
import { ImageBlock } from "./blocks/ImageBlock";
import { TextBlock } from "./blocks/TextBlock";

// The guest page renderer. Inline styles only, and no imports from next/*, the editor or the
// store, so it can move to the production portal service unchanged. `mode` is the only prop
// that changes the markup; `compact` and `inFrame` change layout only.
export type SplashPageProps = {
  design: Design;
  screen: Screen;
  mode: RenderMode;
  compact?: boolean;
  inFrame?: boolean;
  selection?: Selection; // edit: outline + name chip
  onSelect?: (s: Selection) => void; // edit only
  onScreenChange?: (s: Screen) => void; // edit/preview: sheet open/close, Connect
};

type BlockSpec = Design["blocks"][number];

const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const SELECT_BLUE = "#2563EB";

const COLUMN: CSSProperties = {
  position: "relative",
  zIndex: 1,
  flex: "1 0 auto",
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 18,
  maxWidth: 420,
  margin: "0 auto",
  padding: "56px 28px 40px",
  boxSizing: "border-box",
  textAlign: "center",
};

// Wraps the landing page under the open terms sheet. Not positioned, so the background layers
// still anchor to the root. `inert` keeps its content out of focus and clicks.
const UNDER_SHEET: CSSProperties = { flex: "1 0 auto", display: "flex", flexDirection: "column" };

const CHIP: CSSProperties = {
  position: "absolute",
  top: -24,
  left: 0,
  padding: "2px 6px",
  borderRadius: 4,
  background: SELECT_BLUE,
  color: "#FFFFFF",
  fontSize: 11,
  fontWeight: 600,
  lineHeight: "14px",
  whiteSpace: "nowrap",
  pointerEvents: "none",
};

const CHIP_LABEL: Record<TextBlockSpec["role"], string> = {
  heading: "Heading",
  subheading: "Subheading",
  body: "Text",
};

export function SplashPage({
  design,
  screen,
  mode,
  compact,
  inFrame,
  selection,
  onSelect,
  onScreenChange,
}: SplashPageProps): JSX.Element {
  const firstHeadingId = design.blocks.find((b) => b.kind === "text" && b.role === "heading")?.id;
  const termsOn = design.form.terms.mode === "checkbox";

  // In edit mode, a click selects the background only when it lands on the empty area of the
  // root, the column or the spacer itself, so clicks inside blocks, the form or the sheet keep
  // their own selection without having to stop propagation.
  const selectBackground =
    mode === "edit"
      ? (e: MouseEvent) => {
          if (e.target === e.currentTarget) onSelect?.({ kind: "background" });
        }
      : undefined;

  function renderBlock(block: BlockSpec): JSX.Element {
    const content =
      block.kind === "text" ? (
        <TextBlock
          block={block}
          as={block.role !== "heading" ? "p" : block.id === firstHeadingId ? "h1" : "h2"}
        />
      ) : (
        <ImageBlock block={block} />
      );

    if (mode === "export") return <Fragment key={block.id}>{content}</Fragment>;

    if (mode === "preview") {
      return (
        <div key={block.id} style={{ position: "relative", maxWidth: "100%", pointerEvents: "none" }}>
          {content}
        </div>
      );
    }

    const selected = selection?.kind === "block" && selection.id === block.id;
    return (
      <div
        key={block.id}
        onClick={() => onSelect?.({ kind: "block", id: block.id })}
        style={{
          position: "relative",
          maxWidth: "100%",
          cursor: "pointer",
          ...(selected ? { outline: `2px solid ${SELECT_BLUE}`, outlineOffset: 4 } : null),
        }}
      >
        {content}
        {selected && (
          <span aria-hidden="true" style={CHIP}>
            {block.kind === "image" ? "Image" : CHIP_LABEL[block.role]}
          </span>
        )}
      </div>
    );
  }

  const background = <Background background={design.background} mode={mode} />;
  // The Unsplash credit comes after the page's content in reading and tab order. It sits at
  // z-index 2, above the column; the terms sheet's overlay (z-index 10) paints over it.
  const credit =
    design.background.type === "image" && design.background.credit ? (
      <Credit credit={design.background.credit} mode={mode} />
    ) : null;

  const landing = (
    <>
      {background}
      <div onClick={selectBackground} style={COLUMN}>
        {design.blocks.map(renderBlock)}
        {!compact && <div aria-hidden="true" onClick={selectBackground} style={{ flex: 1 }} />}
        <Form
          design={design}
          mode={mode}
          screen={screen}
          onSelect={onSelect}
          onScreenChange={onScreenChange}
        />
      </div>
      {credit}
    </>
  );

  let page: JSX.Element;
  if (screen === "connected") {
    page = (
      <>
        {background}
        <Connected design={design} mode={mode} onContinue={() => onScreenChange?.("landing")} />
        {credit}
      </>
    );
  } else if (mode === "export") {
    // The export always carries the sheet when terms are on; CSS shows it on :target.
    page = (
      <>
        {landing}
        {termsOn && <TermsSheet design={design} mode={mode} />}
      </>
    );
  } else if (screen === "terms" && termsOn) {
    page = (
      <>
        <div aria-hidden="true" inert style={UNDER_SHEET}>
          {landing}
        </div>
        <TermsSheet design={design} mode={mode} onClose={() => onScreenChange?.("landing")} />
      </>
    );
  } else {
    page = landing;
  }

  return (
    <div
      className={mode === "export" ? "cv-root" : undefined}
      onClick={selectBackground}
      style={{
        position: "relative",
        // Its own stacking context, so the column and credit z-indexes never compete with the
        // editor or picker chrome around it.
        isolation: "isolate",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        fontFamily: FONT,
        // In a device frame the root fills the viewport and grows with its content; the frame
        // scrolls, so the background layers cover the full content height.
        ...(inFrame ? { minHeight: "100%" } : null),
      }}
    >
      {page}
    </div>
  );
}
