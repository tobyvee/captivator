import type { JSX } from "react";
import type { ImageBlockSpec } from "../../lib/types";

const HEIGHT: Record<ImageBlockSpec["size"], number> = { sm: 72, md: 120, lg: 168 };

export type ImageBlockProps = { block: ImageBlockSpec };

export function ImageBlock({ block }: ImageBlockProps): JSX.Element {
  return (
    <img
      src={block.src}
      alt={block.alt}
      style={{
        display: "block",
        height: HEIGHT[block.size],
        width: "auto",
        maxWidth: "100%",
        objectFit: "contain",
      }}
    />
  );
}
