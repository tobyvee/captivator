---
title: "T-024: Export HTML button and size toast"
type: ticket
project: captivator
status: todo
priority: P0
milestone: 7
estimate: 10
depends_on: [T-008, T-023]
touches:
  - src/editor/ExportButton.tsx
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
- [ ] One click downloads `<name>.html`; opening it in a browser shows the landing page with no network requests (DevTools Network panel shows nothing after the file).
- [ ] The toast shows the size against 100 KB, and notes when the photo was shrunk.
- [ ] Over budget still downloads and warns.
- [ ] The button is disabled while exporting and is a real `<button>` with at least a 44px tap target.
- [ ] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-008: the `ExportButton` stub in the top bar.
- T-023: `buildExportHtml`, `downloadHtml`, `exportFileName`, `PAGE_BUDGET`.

## Notes
- **From the wave 4 audit:** pass the store's `name` (already capped at 60) to `buildExportHtml` and `downloadHtml`, and show an `ExportError`'s message as text, never as markup. Its messages (`MSG_IMAGE_FAILED`, `MSG_UNSAFE_OUTPUT`) are written for the customer.
`kb` = `Math.round(bytes / 1024)`. Opening the file on a real phone is in T-029's checklist.

## Decisions
- [`T-008-editor-shell-creates-slots.md`](../decisions/T-008-editor-shell-creates-slots.md): The editor shell owns Inspector.tsx and TopBar.tsx and creates every later editor component as a stub
- [`general-export-background-reencode.md`](../decisions/general-export-background-reencode.md): The export re-encodes the background to fit the 100 KB budget
