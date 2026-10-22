---
title: "T-014: Image panel"
type: ticket
project: captivator
status: done
priority: P0
milestone: 3
estimate: 10
depends_on: [T-008, T-011]
touches:
  - src/editor/panels/ImagePanel.tsx
  - src/editor/panels/ImagePanel.test.tsx
  - src/editor/editor.test.tsx
cut_rank:
updated: 2026-10-23
tags: [project, captivator, ticket, editor]
---
# T-014: Image panel

## Context
Build step 3, brief item "upload a logo or image" ([spec → Editor UI → Inspector panels → Image](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md)). This replaces the `ImagePanel` stub from T-008. No artboard draws this panel; match the panel styling on `Main`. Decision: [`T-004-store-rejects-invalid-designs.md`](../decisions/T-004-store-rejects-invalid-designs.md).

## Scope
- `ImagePanel({ id })`:
  - A small preview of the image.
  - "Replace image": `ImageUpload kind="image"` → `updateBlock(id, { src })`, with `onPalette={setLogoPalette}`.
  - **Alt text:** required input. Keep a local draft; dispatch `updateBlock(id, { alt })` only when it's non-empty, and show "Describe the image" while it's empty.
  - **Size:** `Segmented` S / M / L.
- **Out of scope:** remove (Inspector header, T-008); the upload pipeline (T-011).

## Acceptance criteria
- [x] Replacing the image updates the preview and keeps alt and size.
- [x] Clearing the alt text shows "Describe the image" and leaves the stored alt unchanged; typing it again saves it.
- [x] S/M/L changes the rendered height (72/120/168px).
- [x] A logo uploaded here fills "From your logo" in colour pickers once T-026 lands (the `onPalette` wiring is in place now). *Tested with a mocked `extractPalette`; the real palette arrives with T-026.*
- [x] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-008: the stub and `Segmented`.
- T-011: `ImageUpload`.

## Outcome
- **Built:** the Image panel with a preview, "Replace image" (through `ImageUpload`, wired to the logo palette), a required alt text field with a local draft, and Small / Medium / Large size buttons. 486 tests pass; `tsc` and lint are clean.
- **Review:** approved with should-fixes, all fixed. "Describe the image" is now announced from its own alert ([`T-014-alt-error-live-region.md`](../decisions/T-014-alt-error-live-region.md)). A test now pins that alt and size changed during a replacement survive and that a removed block drops the upload; it fails with the stale-closure pattern T-016 fixed. The size test titles print the right values, and the tests use `userEvent.setup()` throughout.
- **Inspector test:** the block-id case now checks the real Alt text field ([`general-inspector-test-leaves-panels-to-their-tests.md`](../decisions/general-inspector-test-leaves-panels-to-their-tests.md)).
- **Security:** not a trust-boundary ticket; no audit run.

## Notes
- **Review nit left as is:** the visible "Size" label is `aria-hidden` (the group carries `aria-label="Size"`), while the Background panel's "Direction" label isn't. Pick one pattern when a later panel adds a labelled group.

## Decisions
- [`T-004-store-rejects-invalid-designs.md`](../decisions/T-004-store-rejects-invalid-designs.md): Store actions drop any update that would make the design fail the schema
- [`T-008-editor-shell-creates-slots.md`](../decisions/T-008-editor-shell-creates-slots.md): The editor shell owns Inspector.tsx and TopBar.tsx and creates every later editor component as a stub
- [`T-014-image-panel-test-file-added.md`](../decisions/T-014-image-panel-test-file-added.md): adds `ImagePanel.test.tsx`
- [`T-014-size-labels-spelled-out.md`](../decisions/T-014-size-labels-spelled-out.md): the size buttons read Small, Medium and Large
- [`T-014-alt-draft-rules.md`](../decisions/T-014-alt-draft-rules.md): spaces-only alt is empty; alt is saved as typed; the draft follows the store
- [`T-014-alt-error-live-region.md`](../decisions/T-014-alt-error-live-region.md): the alt error is announced from its own alert
- [`general-inspector-test-leaves-panels-to-their-tests.md`](../decisions/general-inspector-test-leaves-panels-to-their-tests.md): the Inspector tests leave panel bodies to their own tests
