"use client";

// Stub from T-008; T-014 replaces this file with the replace upload, alt text and size for the
// image block `id`.
export function ImagePanel({ id }: { id: string }) {
  return (
    <p data-block-id={id} className="text-[13px] text-zinc-600">
      Image settings are coming soon.
    </p>
  );
}
