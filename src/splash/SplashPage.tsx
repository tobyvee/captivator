import { Fragment, type CSSProperties, type JSX, type MouseEvent } from "react";
import type { Design } from "../lib/design-schema";
import type { RenderMode, Screen, Selection } from "../lib/types";
import { Background } from "./Background";
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
// and the sheet still anchor to the root.
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

function chipLabel(block: BlockSpec): string {
  if (block.kind === "image") return "Image";
  return { heading: "Heading", subheading: "Subheading", body: "Text" }[block.role];
}

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
        onClick={(e: MouseEvent) => {
          e.stopPropagation();
          onSelect?.({ kind: "block", id: block.id });
        }}
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
            {chipLabel(block)}
          </span>
        )}
      </div>
    );
  }

  const background = <Background background={design.background} mode={mode} />;

  const landing = (
    <>
      {background}
      <div style={COLUMN}>
        {design.blocks.map(renderBlock)}
        {!compact && <div aria-hidden="true" style={{ flex: 1 }} />}
        <Form
          design={design}
          mode={mode}
          screen={screen}
          onSelect={onSelect}
          onScreenChange={onScreenChange}
        />
      </div>
    </>
  );

  let page: JSX.Element;
  if (screen === "connected") {
    page = (
      <>
        {background}
        <Connected design={design} mode={mode} onContinue={() => onScreenChange?.("landing")} />
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
        <div aria-hidden="true" style={UNDER_SHEET}>
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
      onClick={mode === "edit" ? () => onSelect?.({ kind: "background" }) : undefined}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        fontFamily: FONT,
        ...(inFrame ? { height: "100%", overflowY: "auto" } : null),
      }}
    >
      {page}
    </div>
  );
}
