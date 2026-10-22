---
title: "T-014: Image panel"
type: ticket
project: captivator
status: todo
priority: P0
milestone: 3
estimate: 10
depends_on: [T-008, T-011]
touches:
  - src/editor/panels/ImagePanel.tsx
cut_rank:
updated: 2026-10-22
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
- [ ] Replacing the image updates the preview and keeps alt and size.
- [ ] Clearing the alt text shows "Describe the image" and leaves the stored alt unchanged; typing it again saves it.
- [ ] S/M/L changes the rendered height (72/120/168px).
- [ ] A logo uploaded here fills "From your logo" in colour pickers once T-026 lands (the `onPalette` wiring is in place now).
- [ ] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-008: the stub and `Segmented`.
- T-011: `ImageUpload`.

## Decisions
- [`T-004-store-rejects-invalid-designs.md`](../decisions/T-004-store-rejects-invalid-designs.md): Store actions drop any update that would make the design fail the schema
- [`T-008-editor-shell-creates-slots.md`](../decisions/T-008-editor-shell-creates-slots.md): The editor shell owns Inspector.tsx and TopBar.tsx and creates every later editor component as a stub
