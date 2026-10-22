---
title: "T-012: Block list with three zones, add, reorder and the Terms switch"
type: ticket
project: captivator
status: todo
priority: P0
milestone: 3
estimate: 20
depends_on: [T-003, T-008, T-011]
touches:
  - src/editor/BlockList.tsx
cut_rank:
updated: 2026-10-22
tags: [project, captivator, ticket, editor]
---
# T-012: Block list with three zones, add, reorder and the Terms switch

## Context
Build step 3 ([spec → Editor UI → Block list](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md), *Limits*). This replaces the `BlockList` stub from T-008. It ships up/down buttons; drag handles are stretch (T-034). It includes the Terms row's on/off switch from step 6, because the row lives in this file. Remove lives in the Inspector header (T-008). Canvas artboard: `Main` (left column). Decisions: [`T-007-form-renders-terms-row-in-step-2.md`](../decisions/T-007-form-renders-terms-row-in-step-2.md), [`T-008-editor-shell-creates-slots.md`](../decisions/T-008-editor-shell-creates-slots.md).

## Scope
- `BlockList()` as `<aside aria-label="Blocks">` with the heading "Blocks".
- **Zone 1:** a Background row (icon, "Background", summary, swatch showing the colour, gradient or a photo thumbnail).
- **Zone 2:** one row per block (type icon, name, one-line summary) with Move up and Move down buttons (`aria-label="Move {name} up"`/`"down"`, disabled at the ends, `moveBlock`). Then "+ Text" and "+ Image":
  - **+ Text:** `addBlock({ kind: "text", text: "New text", role: "body", colour: bestTextColour(backgroundColours(design.background)), size: 16 })`.
  - **+ Image:** `ImageUpload kind="image"` labelled "+ Image", then `addBlock({ kind: "image", src, alt: imageCount === 0 ? "Logo" : "Sponsor logo", size: "md" })`, with `onPalette={setLogoPalette}`. It's disabled with "2 of 2 images used." (`id="image-limit"`, `aria-describedby`) when `MAX_IMAGES` is reached.
- **Zone 3:** Fields row; Terms row with a sibling `Switch` (`aria-label="Show terms checkbox"`) → `updateForm({ terms: { mode } })`; Connect button row.
- **Selection:** clicking a row calls `setSelection`; the selected row gets the blue style and `aria-current="true"`.
- Tip at the bottom: "Tip: tap anything in the preview to edit it."
- **Out of scope:** remove (Inspector header, T-008); drag-to-reorder (T-034); panel contents.

## Acceptance criteria
- [ ] Adding text appends a block, selects it, and shows it in the preview.
- [ ] Adding a third image isn't possible: the button is disabled and shows "2 of 2 images used." (spec checklist).
- [ ] Up/down reorders blocks in the preview; the first block's Up and last block's Down are disabled.
- [ ] The Terms switch toggles the terms row in the preview and announces `aria-checked`. It's a sibling of the row button, not nested inside it.
- [ ] **Summaries:**
  - Background: "Colour, #RRGGBB", "Gradient, #A to #B" or "Photo" (with ", darkened" when the overlay opacity is above 0).
  - Text: the first 30 characters.
  - Image: its alt.
  - Fields: names joined with ", ", or "None, guests just tap Connect".
  - Terms: "Optional, shown" or "Off".
  - Button: its label.
- [ ] Every row and button is a real `<button>` (or the upload `<label>`), with at least a 44px tap target; keyboard Tab reaches all of them.
- [ ] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-003: `bestTextColour` and `backgroundColours` for new text blocks.
- T-008: the `BlockList` stub, `Switch`, and the store selection flow.
- T-011: `ImageUpload` for "+ Image".

## Notes
- Row look (canvas): `min-height: 48px; padding: 6px 10px; border-radius: 8px`; selected `border: 1.5px solid #2563EB; background: #EFF6FF`; summary 12px `#52525B`. "+ Text"/"+ Image" are dashed `#A1A1AA` buttons.
- Icons (lucide): `Image`, `Type`, `Paintbrush`, `TextCursorInput`, `FileText`, `MousePointerClick`, `ChevronUp`, `ChevronDown`.
- Names come from role ("Heading", "Subheading", "Text") or "Image".

## Decisions
- [`T-007-form-renders-terms-row-in-step-2.md`](../decisions/T-007-form-renders-terms-row-in-step-2.md): The Form renders the terms row from build step 2; the error state comes with the guest screens
- [`T-008-editor-shell-creates-slots.md`](../decisions/T-008-editor-shell-creates-slots.md): The editor shell owns Inspector.tsx and TopBar.tsx and creates every later editor component as a stub
