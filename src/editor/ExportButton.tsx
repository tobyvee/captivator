"use client";

// Stub from T-008; T-024 replaces this file with Export HTML (the single-file download and
// its page-weight warning). Disabled until then.
export function ExportButton() {
  return (
    <button
      type="button"
      disabled
      className="min-h-11 rounded-lg bg-zinc-900 px-4 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      Export HTML
    </button>
  );
}
