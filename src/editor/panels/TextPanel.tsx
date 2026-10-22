"use client";

// Stub from T-008; T-013 replaces this file with the text, style presets, size, colour and
// contrast line for the text block `id`.
export function TextPanel({ id }: { id: string }) {
  return (
    <p data-block-id={id} className="text-[13px] text-zinc-600">
      Text settings are coming soon.
    </p>
  );
}
