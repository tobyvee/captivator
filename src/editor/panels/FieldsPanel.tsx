"use client";

import { useId } from "react";
import { FIELD_SPEC, FieldKind } from "@/lib/design-schema";
import { useStore } from "@/lib/store";
import type { FieldKindSpec } from "@/lib/types";
import { ColourField } from "../controls/ColourField";

const MAX_FIELDS = 2;
const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

/** Name / Email / Phone checkboxes (up to two, in tick order) and the input colours. */
export function FieldsPanel() {
  const fields = useStore((s) => s.design.form.fields);
  const inputBg = useStore((s) => s.design.form.inputBg);
  const inputText = useStore((s) => s.design.form.inputText);
  const updateForm = useStore((s) => s.updateForm);
  const noteId = useId();

  const full = fields.length >= MAX_FIELDS;
  const note =
    fields.length === 0
      ? "No fields: guests just tap Connect."
      : full
        ? "Up to two fields. Untick one to choose another."
        : null;

  // Ticking appends, so the preview shows the fields in the order they were chosen.
  function toggle(kind: FieldKindSpec, on: boolean) {
    updateForm({ fields: on ? [...fields, kind] : fields.filter((k) => k !== kind) });
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <fieldset className="flex flex-col gap-1.5">
        {/* The Inspector heading already says "Fields"; this names the group for screen readers. */}
        <legend className="sr-only">Fields</legend>
        {FieldKind.options.map((kind) => {
          const checked = fields.includes(kind);
          const disabled = !checked && full;
          return (
            <label
              key={kind}
              className={[
                "flex min-h-11 items-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-3 text-sm",
                disabled ? "cursor-not-allowed text-zinc-500" : "cursor-pointer text-zinc-900",
              ].join(" ")}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                aria-describedby={disabled ? noteId : undefined}
                onChange={(e) => toggle(kind, e.currentTarget.checked)}
                className={`size-5 shrink-0 accent-[#2563EB] ${FOCUS_RING}`}
              />
              {FIELD_SPEC[kind].placeholder}
            </label>
          );
        })}
        {/* Always mounted, so reaching the limit is announced as the second box is ticked. */}
        <p id={noteId} role="status" className="text-xs text-zinc-600 empty:-mt-1.5">
          {note}
        </p>
      </fieldset>

      <ColourField label="Input background" value={inputBg} onChange={(colour) => updateForm({ inputBg: colour })} />
      <ColourField label="Input text" value={inputText} onChange={(colour) => updateForm({ inputText: colour })} />
    </div>
  );
}
