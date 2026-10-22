// The design-wide readability check shown under the preview. Pure: no DOM, no store.
// Builds on contrast.ts; photo results are approximate (general-photo-contrast-approximate.md).
import { WEIGHT } from "@/splash/blocks/TextBlock";
import { backgroundColours, contrastRatio, formatRatio, requiredRatio, worstRatio } from "./contrast";
import type { Design } from "./design-schema";
import type { BackgroundSpec, TextBlockSpec } from "./types";

export type ReadabilityTarget =
  | { kind: "block"; id: string }
  | { kind: "terms" }
  | { kind: "button" }
  | { kind: "inputs" };
/**
 * One failing check. `against` holds the colours the text was rated against, so a fix can be
 * measured on exactly the same ground (T-035-failure-carries-colours.md).
 */
export type ReadabilityFailure = {
  label: string;
  ratio: number;
  required: number;
  target: ReadabilityTarget;
  against: string[];
};
export type ReadabilityResult = {
  status: "ok" | "approximate" | "fail";
  message: string;
  failures: ReadabilityFailure[];
};

// The rendered sizes and weights of the form's text (src/splash/Form.tsx).
/** The guest's terms row: 14px at weight 400, so it needs 4.5:1. */
export const TERMS_TEXT = { size: 14, weight: 400 };
const BUTTON = { size: 16, weight: 700 };
const INPUT = { size: 16, weight: 400 };
/** WCAG 1.4.11: a control's edge needs 3:1 against what's around it (T-027-input-edge-contrast.md). */
const EDGE_RATIO = 3;

const ROLE_LABEL: Record<TextBlockSpec["role"], string> = {
  heading: "Heading",
  subheading: "Subheading",
  body: "Text",
};

/** One piece of text rated against the page, for the panels' contrast lines. */
export type TextRating = { kind: "photo" } | { kind: "pass" | "fail"; ratio: number; required: number };

/**
 * Rates `colour` at `size`/`weight` against the page, at a gradient's worse stop. A photo is never
 * rated (general-photo-contrast-approximate.md, T-013-photo-line-never-rates.md), and pass/fail uses
 * the unrounded ratio (T-003-format-ratio-rounds-down.md).
 */
export function rateText(colour: string, size: number, weight: number, background: BackgroundSpec): TextRating {
  if (background.type === "image") return { kind: "photo" };
  const ratio = worstRatio(colour, backgroundColours(background));
  const required = requiredRatio(size, weight);
  return { kind: ratio >= required ? "pass" : "fail", ratio, required };
}

type Check = ReadabilityFailure & { on: "background" | "button" | "field" };

/**
 * Checks every piece of text on the landing screen, plus the inputs' edge, against what it sits on.
 * `photoAverage` is the photo's average colour once known; until then a photo uses its backdrop.
 * Failures keep the order the guest reads them in, and the message names the first.
 */
export function checkDesign(design: Design, photoAverage?: string): ReadabilityResult {
  const bg = design.background;
  const page = backgroundColours(bg, photoAverage);
  // A fitted photo leaves the backdrop showing around it, so text can sit on either
  // (T-027-fitted-photo-checks-backdrop.md).
  if (bg.type === "image" && bg.fit === "fit" && photoAverage) page.push(...backgroundColours(bg));
  const { fields, inputBg, inputText, terms, button } = design.form;
  const checks: Check[] = [];

  const seen: Partial<Record<TextBlockSpec["role"], number>> = {};
  for (const block of design.blocks) {
    if (block.kind !== "text") continue;
    const n = (seen[block.role] ?? 0) + 1;
    seen[block.role] = n;
    checks.push({
      label: n === 1 ? ROLE_LABEL[block.role] : `${ROLE_LABEL[block.role]} ${n}`,
      ratio: worstRatio(block.colour, page),
      required: requiredRatio(block.size, WEIGHT[block.role]),
      target: { kind: "block", id: block.id },
      against: page,
      on: "background",
    });
  }

  if (terms.mode === "checkbox") {
    checks.push({
      label: "Terms checkbox",
      ratio: worstRatio(terms.textColour, page),
      required: requiredRatio(TERMS_TEXT.size, TERMS_TEXT.weight),
      target: { kind: "terms" },
      against: page,
      on: "background",
    });
  }

  // An outline button has no fill, so its label sits on the page (T-007-outline-button-colours.md).
  const outline = button.variant === "outline";
  const buttonGround = outline ? page : [button.bg];
  checks.push({
    label: "Connect button",
    ratio: worstRatio(button.fg, buttonGround),
    required: requiredRatio(BUTTON.size, BUTTON.weight),
    target: { kind: "button" },
    against: buttonGround,
    on: outline ? "background" : "button",
  });

  if (fields.length > 0) {
    checks.push(
      {
        label: "Field text",
        ratio: contrastRatio(inputText, inputBg),
        required: requiredRatio(INPUT.size, INPUT.weight),
        target: { kind: "inputs" },
        against: [inputBg],
        on: "field",
      },
      {
        label: "Fields",
        ratio: worstRatio(inputBg, page),
        required: EDGE_RATIO,
        target: { kind: "inputs" },
        against: page,
        on: "background",
      },
    );
  }

  // Pass/fail uses the unrounded ratio, never the displayed one (T-003-format-ratio-rounds-down.md).
  const failing = checks.filter((c) => c.ratio < c.required);
  const failures = failing.map(({ label, ratio, required, target, against }) => ({
    label,
    ratio,
    required,
    target,
    against,
  }));

  if (failing.length > 0) {
    const first = failing[0];
    return { status: "fail", message: `${first.label}: ${formatRatio(first.ratio)} on the ${first.on}`, failures };
  }
  if (bg.type === "image") {
    return { status: "approximate", message: "Check readability over your photo", failures };
  }
  return { status: "ok", message: "All text is readable", failures };
}
