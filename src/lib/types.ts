import type { z } from "zod";
import type { Background, Block, Design } from "./design-schema";

export type BackgroundSpec = z.infer<typeof Background>;
export type ImageBackground = Extract<BackgroundSpec, { type: "image" }>;
export type TextBlockSpec = Extract<Block, { kind: "text" }>;
export type ImageBlockSpec = Extract<Block, { kind: "image" }>;
export type FormSpec = Design["form"];
export type FieldKindSpec = FormSpec["fields"][number];

export type Screen = "landing" | "terms" | "error" | "connected";
export type RenderMode = "edit" | "preview" | "export";
export type Device = "mobile" | "desktop";
export type SelectionKind = "background" | "block" | "fields" | "terms" | "button";
export type Selection = { kind: SelectionKind; id?: string };
