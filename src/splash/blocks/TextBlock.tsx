import type { CSSProperties, JSX } from "react";
import type { TextBlockSpec } from "../../lib/types";

// Font weight per role. The editor's contrast checks use it to decide whether text counts as large.
export const WEIGHT: Record<TextBlockSpec["role"], number> = { heading: 800, subheading: 500, body: 400 };

export type TextBlockProps = { block: TextBlockSpec; as: "h1" | "h2" | "p" };

// Customer text is rendered as a React text child, never as markup.
export function TextBlock({ block, as: Tag }: TextBlockProps): JSX.Element {
  const style: CSSProperties = {
    margin: 0,
    fontSize: block.size,
    color: block.colour,
    fontWeight: WEIGHT[block.role],
    lineHeight: block.role === "heading" ? 1.15 : 1.4,
    whiteSpace: "pre-line",
    overflowWrap: "anywhere",
    maxWidth: "100%",
  };
  return <Tag style={style}>{block.text}</Tag>;
}
