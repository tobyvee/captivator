---
title: "T-024: Export HTML button and size toast"
type: ticket
project: captivator
status: done
priority: P0
milestone: 7
estimate: 10
depends_on: [T-008, T-023]
touches:
  - src/editor/ExportButton.tsx
  - src/editor/ExportButton.test.tsx
  - src/editor/editor.test.tsx
cut_rank:
updated: 2026-10-23
tags: [project, captivator, ticket, editor, export]
---
# T-024: Export HTML button and size toast

## Context
Build step 7, "the Export button, size toast" ([spec → Export HTML](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md) step 7; *Editor UI → Top bar*). This replaces the `ExportButton` stub from T-008, which sits in the top bar. Canvas artboard: `Main` (top bar, primary "Export HTML"). Decision: [`general-export-background-reencode.md`](../decisions/general-export-background-reencode.md).

## Scope
- `ExportButton()`:
  - A primary button "Export HTML" (`#18181B`, white text).
  - On click: show the busy label "Exporting…", run `buildExportHtml(design, name)`, then `downloadHtml(html, name)`, then show a toast.
- The toast is fixed bottom-right (editor chrome, Tailwind), `role="status"`, with a dismiss button. It auto-hides after about 6 seconds unless it's a warning. Messages:
  - **Within budget:** "Downloaded {file}: {kb} KB of 100 KB", plus ". Photo shrunk to fit." when `reencoded`.
  - **Over budget** (amber; doesn't block): "Downloaded {file}: {kb} KB, over the 100 KB budget. Guests on slow WiFi may wait; try a simpler photo."
  - **Failure:** "Export failed: we couldn't load one of the images. Try again, or replace it." Never leave the button stuck busy.
- **Out of scope:** the HTML itself (T-023).

## Acceptance criteria
- [ ] One click downloads `<name>.html`; opening it in a browser shows the landing page with no network requests (DevTools Network panel shows nothing after the file). *Not checked here: needs a real browser. Deferred to T-029 ([`T-024-browser-download-check-in-t029.md`](../decisions/T-024-browser-download-check-in-t029.md)); the click's arguments and the file's lack of requests are unit-tested.*
- [x] The toast shows the size against 100 KB, and notes when the photo was shrunk.
- [x] Over budget still downloads and warns.
- [x] The button is disabled while exporting and is a real `<button>` with at least a 44px tap target. *Disabled as `aria-disabled` plus a guard, so keyboard focus stays on it ([`T-024-aria-disabled-keeps-focus.md`](../decisions/T-024-aria-disabled-keeps-focus.md)).*
- [x] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-008: the `ExportButton` stub in the top bar.
- T-023: `buildExportHtml`, `downloadHtml`, `exportFileName`, `PAGE_BUDGET`.

## Outcome
- **Built:** the Export HTML button in the top bar. It snapshots the design and name at the click, builds and downloads the page, and shows a toast in one always-mounted status region: size against 100 KB (auto-hides), an amber over-budget warning, or a red failure with the `ExportError`'s message as text. 537 tests pass; `tsc` and lint are clean.
- **Review:** changes required. The click-snapshot test changed the store before the click, so it couldn't catch a stale read; it now changes the store mid-build. Should-fixes, all fixed (`553f024`):
  - `aria-disabled` with the `running` ref as the real guard, so focus stays on the button; a test fails without the ref.
  - The toast timer tests have a 2s margin and resolve inside `act` ([`T-024-toast-timer-tests-advance-real-time.md`](../decisions/T-024-toast-timer-tests-advance-real-time.md)).
  - The unused toast key was removed.
  - Unexpected errors go to `console.error`.
  - Only the toast text is live; Dismiss sits outside it ([`T-024-toast-status-holds-only-text.md`](../decisions/T-024-toast-status-holds-only-text.md)).
  - The re-review approved; its comment fixes and the click-time design check followed.
- **Inspector test:** `editor.test.tsx` now expects a live Export HTML button ([`general-inspector-test-leaves-panels-to-their-tests.md`](../decisions/general-inspector-test-leaves-panels-to-their-tests.md)).
- **Milestone 7 review:** done, nothing missing; this record closes milestone 7 ahead of milestones 4–6, because the waves run in parallel.
- **Security:** not a trust-boundary ticket (`export.ts` is unchanged); no audit run. The wave audit covers it.

## Notes
- **Review nit left as is:** "{kb} KB" uses `Math.round`, as the ticket says, so 102,401–102,911 bytes reads "100 KB, over the 100 KB budget".
- **The export's terms link** still lacks `id="cv-terms-link"` until T-022, so closing the sheet in the exported file drops focus to `<body>` ([`T-021-close-to-terms-link.md`](../decisions/T-021-close-to-terms-link.md)).
- **From the wave 4 audit:** pass the store's `name` (already capped at 60) to `buildExportHtml` and `downloadHtml`, and show an `ExportError`'s message as text, never as markup. Its messages (`MSG_IMAGE_FAILED`, `MSG_UNSAFE_OUTPUT`) are written for the customer.
`kb` = `Math.round(bytes / 1024)`. Opening the file on a real phone is in T-029's checklist.

## Decisions
- [`T-008-editor-shell-creates-slots.md`](../decisions/T-008-editor-shell-creates-slots.md): The editor shell owns Inspector.tsx and TopBar.tsx and creates every later editor component as a stub
- [`general-export-background-reencode.md`](../decisions/general-export-background-reencode.md): The export re-encodes the background to fit the 100 KB budget
- [`T-024-export-button-test-file-added.md`](../decisions/T-024-export-button-test-file-added.md): adds `ExportButton.test.tsx`
- [`T-024-failure-text-and-click-snapshot.md`](../decisions/T-024-failure-text-and-click-snapshot.md): failure text from `ExportError`; one snapshot at the click
- [`T-024-toast-live-region-and-tones.md`](../decisions/T-024-toast-live-region-and-tones.md): the toast's live region and tones (superseded)
- [`T-024-toast-status-holds-only-text.md`](../decisions/T-024-toast-status-holds-only-text.md): the status region holds only the toast text
- [`T-024-aria-disabled-keeps-focus.md`](../decisions/T-024-aria-disabled-keeps-focus.md): `aria-disabled` keeps focus while exporting
- [`T-024-toast-timer-tests-advance-real-time.md`](../decisions/T-024-toast-timer-tests-advance-real-time.md): why the timer tests advance real time
- [`T-024-browser-download-check-in-t029.md`](../decisions/T-024-browser-download-check-in-t029.md): the open-the-file check moves to T-029
