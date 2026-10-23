import { z } from "zod";

// ---------- primitives ----------
const Hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour");
const Id = z.string().min(1);

// URLs are allowlisted by scheme and host, not just "is a URL": the stored design can be
// hand-edited in localStorage, so this schema is the trust boundary.
// Images: uploads (raster data URLs), bundled template photos, or https photos (Unsplash).
const ImageSrc = z
  .string()
  .regex(
    /^(data:image\/(png|jpeg|webp);base64,|\/templates\/[\w-]+\.(jpg|jpeg|webp)$|https:\/\/)/,
    "Use an uploaded image or an https photo",
  );
const UnsplashProfileUrl = z.string().regex(/^https:\/\/unsplash\.com\//);
const UnsplashDownloadUrl = z.string().regex(/^https:\/\/api\.unsplash\.com\//);

// Unsplash requires photographer credit when the image came from their API.
const Credit = z.object({
  name: z.string(),
  profileUrl: UnsplashProfileUrl, // add ?utm_source=captivator&utm_medium=referral
  downloadLocation: UnsplashDownloadUrl, // ping when the image is chosen
});

// ---------- background (pinned top) ----------
const Direction = z.enum(["down", "diagonal", "right"]); // presets, not a free angle

const Overlay = z
  .object({ from: Hex, to: Hex, opacity: z.number().min(0).max(0.85) })
  .nullable();

export const Background = z.discriminatedUnion("type", [
  z.object({ type: z.literal("colour"), colour: Hex }),
  z.object({ type: z.literal("gradient"), from: Hex, to: Hex, direction: Direction }),
  z.object({
    type: z.literal("image"),
    src: ImageSrc,
    credit: Credit.optional(),
    // Rendered as <img style="object-fit; object-position; transform: scale(zoom); transform-origin: focus">
    fit: z.enum(["fill", "fit"]), // fill = cover (crops), fit = contain (whole photo, backdrop shows)
    zoom: z.number().min(1).max(2), // fill only: 1 = 100%
    focus: z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }), // % — kept visible on every screen shape
    backdrop: Hex, // fit only: colour around the photo
    overlay: Overlay, // gradient overlay keeps text readable on photos
  }),
]);

// ---------- content blocks (the only reorderable part) ----------
const ImageBlock = z.object({
  id: Id,
  kind: z.literal("image"),
  src: ImageSrc,
  alt: z.string().min(1, "Describe the image"),
  size: z.enum(["sm", "md", "lg"]),
});

/** Text blocks are never smaller than 16px or larger than 56px (T-043-text-size-floor-16.md). */
export const MIN_TEXT_SIZE = 16;
export const MAX_TEXT_SIZE = 56;
// Designs saved before the 16px floor allowed 12–15px; those are raised to it rather than failing
// to restore. Anything outside the old range still fails.
const LEGACY_MIN_TEXT_SIZE = 12;
const raiseLegacySize = (v: unknown) =>
  Number.isInteger(v) && (v as number) >= LEGACY_MIN_TEXT_SIZE && (v as number) < MIN_TEXT_SIZE ? MIN_TEXT_SIZE : v;

const TextBlock = z.object({
  id: Id,
  kind: z.literal("text"),
  text: z.string().max(120),
  role: z.enum(["heading", "subheading", "body"]), // sets the default size/weight
  colour: Hex,
  size: z.preprocess(raiseLegacySize, z.number().int().min(MIN_TEXT_SIZE).max(MAX_TEXT_SIZE)), // brief: "adjust its size"
});

export const Block = z.discriminatedUnion("kind", [ImageBlock, TextBlock]);
export type Block = z.infer<typeof Block>;

export const MAX_IMAGES = 2;

const Blocks = z
  .array(Block)
  .refine((b) => b.filter((x) => x.kind === "image").length <= MAX_IMAGES, {
    message: `Up to ${MAX_IMAGES} images`,
  });

// ---------- form (pinned bottom: fields, then Connect) ----------
// The field *kinds* are customer-chosen; their input attributes are system-owned (see FIELD_SPEC).
export const FieldKind = z.enum(["name", "email", "phone"]);

const Form = z.object({
  fields: z
    .array(FieldKind)
    .max(2, "Up to two fields")
    .refine((f) => new Set(f).size === f.length, "Each field can be used once"),
  inputBg: Hex,
  inputText: Hex,
  // T&Cs acceptance only. Marketing opt-in is a separate consent (Spam Act) and must
  // never share this checkbox; add it as its own field when capture ships.
  terms: z.object({
    // Optional. "off" hides the row entirely (wording is kept, so toggling back restores it).
    // "checkbox": validated on Connect, never pre-ticked.
    mode: z.enum(["off", "checkbox"]),
    label: z.string().min(1).max(60), // "I agree to the"
    linkText: z.string().min(1).max(30), // "terms of use"
    body: z.string().min(1).max(8000), // shown in an in-page sheet; external links won't load pre-auth
    textColour: Hex, // contrast-checked against the background like any text
    version: z.number().int().positive(), // bump on edit; recorded with each acceptance
  }),
  button: z.object({
    label: z.string().min(1).max(24),
    bg: Hex,
    fg: Hex,
    variant: z.enum(["solid", "outline"]),
  }),
});

// ---------- design (the thing templates are instances of) ----------
// Order is fixed by the shape itself: background → blocks → form.
// No ordering rules needed; the editor's drag-and-drop only ever touches `blocks`.
export const Design = z.object({
  version: z.literal(2),
  background: Background,
  blocks: Blocks,
  form: Form,
});

export type Design = z.infer<typeof Design>;

// ---------- templates ----------
export const Template = z.object({
  id: Id,
  name: z.string(),
  description: z.string(),
  design: Design,
});
export type Template = z.infer<typeof Template>;

// "Blank" is just the minimal template that still conforms.
export const BLANK: Template = {
  id: "blank",
  name: "Blank",
  description: "Start from a plain colour with a Connect button",
  design: {
    version: 2,
    background: { type: "colour", colour: "#FFFFFF" },
    blocks: [],
    form: {
      fields: [],
      inputBg: "#FFFFFF",
      inputText: "#111111",
      terms: {
        mode: "off", // optional: Blank starts without it; Sponsor/Photo hero switch it on
        label: "I agree to the",
        linkText: "terms of use",
        body: "[YOUR TERMS OF USE]",
        textColour: "#111111",
        version: 1,
      },
      button: { label: "Connect", bg: "#111111", fg: "#FFFFFF", variant: "solid" },
    },
  },
};

// ---------- system-owned input attributes (never in the customer's design) ----------
export const FIELD_SPEC = {
  name: { type: "text", autoComplete: "name", inputMode: "text", placeholder: "Name" },
  email: { type: "email", autoComplete: "email", inputMode: "email", placeholder: "Email" },
  phone: { type: "tel", autoComplete: "tel", inputMode: "tel", placeholder: "Phone" },
} as const satisfies Record<z.infer<typeof FieldKind>, object>;
