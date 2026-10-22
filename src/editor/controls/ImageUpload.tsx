"use client";

import { useId, useState, type ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { MSG_UNREADABLE, processUpload, UploadError, type ImageKind } from "@/lib/images";
import { extractPalette } from "@/lib/palette";

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";

type Props = {
  kind: ImageKind;
  label: string;
  onUploaded: (dataUrl: string) => void;
  /** Called with palette suggestions after an `image` upload. */
  onPalette?: (colours: string[]) => void;
  disabled?: boolean;
  describedBy?: string;
  className?: string;
};

/** A button-styled file picker that shrinks the chosen image before handing it on. */
export function ImageUpload({ kind, label, onUploaded, onPalette, disabled, describedBy, className }: Props) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const inactive = disabled || busy;

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    // Clear the value so picking the same file again still fires a change.
    input.value = "";
    // The input stays enabled (and focusable) while busy, so a pick made then is ignored here.
    if (busy || !file) return;

    setBusy(true);
    setError(null);
    setWarning(null);
    try {
      const { dataUrl, bytes, tooLarge } = await processUpload(file, kind);
      onUploaded(dataUrl);
      if (tooLarge) {
        setWarning(
          `This image is ${Math.round(bytes / 1024)} KB after shrinking. A simpler image keeps the page fast.`,
        );
      }
      if (kind === "image" && onPalette) {
        extractPalette(dataUrl).then(onPalette, () => {});
      }
    } catch (err) {
      setError(err instanceof UploadError ? err.message : MSG_UNREADABLE);
    } finally {
      setBusy(false);
    }
  }

  const describedByIds =
    [describedBy, error && `${id}-error`, warning && `${id}-warning`].filter(Boolean).join(" ") || undefined;

  return (
    <div className={["flex flex-col", className].filter(Boolean).join(" ")}>
      <label
        aria-busy={busy || undefined}
        className={[
          "flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3",
          "text-[13px] font-medium text-zinc-900",
          "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue-600",
          inactive ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-zinc-50",
        ].join(" ")}
      >
        <Upload size={15} strokeWidth={2} aria-hidden="true" />
        {busy ? "Shrinking image…" : label}
        <input
          type="file"
          accept={ACCEPT}
          className="sr-only"
          disabled={disabled}
          aria-disabled={busy || undefined}
          aria-describedby={describedByIds}
          onChange={handleChange}
        />
      </label>
      {/* Both live regions stay mounted so screen readers announce text when it arrives. */}
      <p id={`${id}-error`} role="alert" className="text-xs leading-snug text-red-700 [&:not(:empty)]:mt-2">
        {error}
      </p>
      <p id={`${id}-warning`} role="status" className="text-xs leading-snug text-amber-800 [&:not(:empty)]:mt-2">
        {warning}
      </p>
    </div>
  );
}
