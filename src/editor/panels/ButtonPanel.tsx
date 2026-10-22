"use client";

import { useId, useState } from "react";
import { useStore } from "@/lib/store";
import type { FormSpec } from "@/lib/types";
import { ColourField } from "../controls/ColourField";
import { Segmented, type SegmentedOption } from "../controls/Segmented";

const MAX_LABEL = 24;

const VARIANTS: SegmentedOption<FormSpec["button"]["variant"]>[] = [
  { value: "solid", label: "Solid" },
  { value: "outline", label: "Outline" },
];

/** The Connect button's label, colours and Solid/Outline style. */
export function ButtonPanel() {
  const button = useStore((s) => s.design.form.button);
  const updateForm = useStore((s) => s.updateForm);
  const labelId = useId();

  // The store refuses an empty label (T-004-store-rejects-invalid-designs), so the input keeps a
  // local draft. It follows the stored label when that changes from outside, e.g. undo.
  const [draft, setDraft] = useState(button.label);
  const [syncedLabel, setSyncedLabel] = useState(button.label);
  if (button.label !== syncedLabel) {
    setSyncedLabel(button.label);
    setDraft(button.label);
  }

  const labelMissing = draft.trim() === "";
  const describedBy = `${labelId}-count${labelMissing ? ` ${labelId}-error` : ""}`;

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={labelId} className="text-[13px] font-semibold text-zinc-900">
          Label
        </label>
        <input
          id={labelId}
          type="text"
          value={draft}
          maxLength={MAX_LABEL}
          required
          aria-invalid={labelMissing || undefined}
          aria-describedby={describedBy}
          onChange={(e) => {
            const label = e.currentTarget.value;
            setDraft(label);
            if (label.trim() !== "") updateForm({ button: { label } });
          }}
          className={[
            "min-h-11 w-full rounded-lg border px-2.5 text-[15px] text-zinc-900",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
            labelMissing ? "border-red-600" : "border-zinc-300",
          ].join(" ")}
        />
        <p id={`${labelId}-count`} className="text-xs text-zinc-600">
          {draft.length} of {MAX_LABEL}
        </p>
        {/* Always mounted, so the error is announced as the field empties, not only on focus. */}
        <p id={`${labelId}-error`} role="alert" className="text-xs text-red-700 empty:-mt-1.5">
          {labelMissing ? "Required" : null}
        </p>
      </div>

      <ColourField label="Button colour" value={button.bg} onChange={(bg) => updateForm({ button: { bg } })} />
      <ColourField label="Text colour" value={button.fg} onChange={(fg) => updateForm({ button: { fg } })} />

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-zinc-900" aria-hidden="true">
          Style
        </span>
        <Segmented
          label="Style"
          options={VARIANTS}
          value={button.variant}
          onChange={(variant) => updateForm({ button: { variant } })}
        />
      </div>
    </div>
  );
}
