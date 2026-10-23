"use client";

import { Info } from "lucide-react";
import { useId } from "react";
import { backgroundColours } from "@/lib/contrast";
import { useStore } from "@/lib/store";
import type { BackgroundSpec } from "@/lib/types";
import { ANGLE } from "@/splash/Background";
import { ColourField } from "../controls/ColourField";
import { useRequiredDraft } from "../controls/useRequiredDraft";

const MAX_LABEL = 60;
const MAX_LINK = 30;
const MAX_BODY = 8000;

const count = (n: number) => n.toLocaleString("en-US");

const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

type Draft = ReturnType<typeof useRequiredDraft>;

/** A required wording input with the shared draft markup (T-015-required-draft-hook). */
function WordingInput({
  label,
  maxLength,
  field,
  className,
}: {
  label: string;
  maxLength: number;
  field: Draft;
  className: string;
}) {
  const id = useId();
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-xs text-zinc-700">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={field.draft}
        maxLength={maxLength}
        required
        aria-invalid={field.missing || undefined}
        aria-describedby={field.missing ? `${id}-error` : undefined}
        onChange={(e) => field.onChange(e.currentTarget.value)}
        className={[
          "min-h-11 w-full rounded-lg border px-2.5 text-[15px] text-zinc-900",
          FOCUS_RING,
          field.missing ? "border-red-600" : "border-zinc-300",
        ].join(" ")}
      />
      {/* Always mounted, so the error is announced as the field empties, not only on focus. */}
      <p id={`${id}-error`} role="alert" className="text-xs text-red-700 empty:-mt-1">
        {field.missing ? "Required" : null}
      </p>
    </div>
  );
}

/**
 * The live sample's backdrop: the page's colour or gradient, or a photo's backdrop washed by its
 * overlay, since the sample can't show the photo itself.
 */
function sampleBackground(bg: BackgroundSpec): string {
  if (bg.type === "gradient") return `linear-gradient(${ANGLE[bg.direction]}, ${bg.from}, ${bg.to})`;
  const [from, to = from] = backgroundColours(bg);
  return from === to ? from : `linear-gradient(180deg, ${from}, ${to})`;
}

/** Checkbox wording with a live sample, the terms body, the checkbox text colour and the version note. */
export function TermsPanel() {
  const terms = useStore((s) => s.design.form.terms);
  const background = useStore((s) => s.design.background);
  const accent = useStore((s) => s.design.form.button.bg);
  const updateForm = useStore((s) => s.updateForm);
  const bodyId = useId();

  // The store refuses empty wording (T-004-store-rejects-invalid-designs), so each input edits a draft.
  const label = useRequiredDraft(terms.label, (value) => updateForm({ terms: { label: value } }));
  const linkText = useRequiredDraft(terms.linkText, (value) => updateForm({ terms: { linkText: value } }));
  const body = useRequiredDraft(terms.body, (value) => updateForm({ terms: { body: value } }));

  return (
    <div className="flex grow flex-col gap-[18px]">
      {terms.mode === "off" && (
        <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs leading-normal text-zinc-700">
          Terms are off. Turn them on with the switch above to show the checkbox.
        </p>
      )}

      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className="mb-2 text-[13px] font-semibold">Checkbox wording</legend>
        <div className="flex gap-2">
          <WordingInput label="Before the link" maxLength={MAX_LABEL} field={label} className="flex-[3]" />
          <WordingInput label="Link text" maxLength={MAX_LINK} field={linkText} className="flex-[2]" />
        </div>
        {/* The stored wording, as the preview shows it. The box is never ticked. */}
        <label
          className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm"
          style={{ background: sampleBackground(background), color: terms.textColour }}
        >
          <input
            type="checkbox"
            disabled
            checked={false}
            readOnly
            className="size-5 shrink-0"
            style={{ accentColor: accent }}
          />
          <span>
            {terms.label} <span className="font-semibold underline">{terms.linkText}</span>
          </span>
        </label>
        <p className="text-xs text-zinc-600">How guests see it. The box always starts unticked.</p>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor={bodyId} className="text-[13px] font-semibold">
            Terms text
          </label>
          <span id={`${bodyId}-count`} className="text-xs text-zinc-600 tabular-nums">
            {count(body.draft.length)} of {count(MAX_BODY)}
          </span>
        </div>
        <textarea
          id={bodyId}
          rows={8}
          value={body.draft}
          maxLength={MAX_BODY}
          required
          aria-invalid={body.missing || undefined}
          aria-describedby={`${bodyId}-count ${bodyId}-hint${body.missing ? ` ${bodyId}-error` : ""}`}
          onChange={(e) => body.onChange(e.currentTarget.value)}
          className={[
            "min-h-11 w-full resize-y rounded-lg border p-2.5 text-[15px] leading-normal text-zinc-900",
            FOCUS_RING,
            body.missing ? "border-red-600" : "border-zinc-300",
          ].join(" ")}
        />
        <p id={`${bodyId}-hint`} className="text-xs leading-normal text-zinc-600">
          Type or paste your terms. A blank line starts a new paragraph. They open inside the login page, because
          guests are not online yet and links to websites would not load.
        </p>
        {/* Always mounted, so the error is announced as the field empties, not only on focus. */}
        <p id={`${bodyId}-error`} role="alert" className="text-xs text-red-700 empty:-mt-1.5">
          {body.missing ? "Required" : null}
        </p>
      </div>

      <ColourField
        label="Checkbox text colour"
        value={terms.textColour}
        onChange={(textColour) => updateForm({ terms: { textColour } })}
      />

      {/* The MVP has no publish step, so the version is shown but never bumped. */}
      <div className="flex gap-2.5 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] p-3">
        <Info size={18} strokeWidth={2.2} aria-hidden="true" className="shrink-0 text-[#1E40AF]" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-semibold text-[#1E3A8A]">Version {terms.version}</span>
          <span className="text-xs leading-[1.45] text-[#1E40AF]">
            Changing the text after you publish starts a new version, so you can tell which terms each guest agreed
            to.
          </span>
        </div>
      </div>

      <p className="mt-auto text-xs leading-normal text-zinc-600">
        Collecting emails for marketing? That needs its own opt-in. It can&apos;t share this checkbox.
      </p>
    </div>
  );
}
