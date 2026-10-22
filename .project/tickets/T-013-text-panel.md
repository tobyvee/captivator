---
title: "T-013: Text panel"
type: ticket
project: captivator
status: todo
priority: P0
milestone: 3
estimate: 15
depends_on: [T-003, T-008, T-010]
touches:
  - src/editor/panels/TextPanel.tsx
cut_rank:
updated: 2026-10-22
tags: [project, captivator, ticket, editor]
---
# T-013: Text panel

## Context
Build step 3, brief item "add text and adjust its colour and size" ([spec → Editor UI → Inspector panels → Text](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md), *Limits*). This replaces the `TextPanel` stub from T-008. Canvas artboard: `Main` (right column, "Heading · Text block"). Decisions: [`T-013-panels-show-contrast-line.md`](../decisions/T-013-panels-show-contrast-line.md), [`T-003-large-text-includes-bold.md`](../decisions/T-003-large-text-includes-bold.md), [`general-photo-contrast-approximate.md`](../decisions/general-photo-contrast-approximate.md).

## Scope
- `TextPanel({ id })` reads the block from the store and dispatches `updateBlock(id, …)`:
  - **Text:** `<textarea>` (`maxLength` 120) with the counter "{n} of 120 characters" (`aria-describedby`).
  - **Style:** `Segmented` Heading / Subheading / Body, setting `role` and the preset size (heading 40, subheading 20, body 16).
  - **Size:** `Slider` 12–56, "Size {n} px".
  - **Colour:** `ColourField`.
  - **Contrast line** (decision): worst-case ratio of `colour` against `backgroundColours(design.background)` versus `requiredRatio(size, weight)`:
    - Passing: "Easy to read · {r} against the background" (plus "Checked at both ends of the gradient." for gradients).
    - Failing: "Hard to read · {r}, needs {required}:1".
    - Photo backgrounds: "Check readability over your photo".
  - **Tip:** "Want a two-colour headline? Add a second Text block and give it its own colour."
- **Out of scope:** delete (Inspector header, T-008); the design-wide readability line (T-027).

## Acceptance criteria
- [ ] The preview updates on every keystroke and slider move (spec checklist).
- [ ] The textarea stops at 120 characters and the counter updates. Cmd/Ctrl+Z inside it is native text undo (T-025 skips text inputs).
- [ ] Presets set role and size; the size slider then adjusts within 12–56.
- [ ] White text on a white background shows "Hard to read".
- [ ] All controls are labelled and reachable by keyboard, with at least 44px tap targets.
- [ ] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-003: `contrastRatio`/`worstRatio`, `backgroundColours`, `requiredRatio`, `formatRatio`.
- T-008: the stub, `Segmented`, and the `updateBlock` flow.
- T-010: `ColourField`, `Slider`.

## Notes
- Weight by role is 800 / 500 / 400 (spec *Blocks*), which is what `requiredRatio` needs.
- Empty text is valid in the schema, so no local draft is needed.

## Decisions
- [`T-003-large-text-includes-bold.md`](../decisions/T-003-large-text-includes-bold.md): Large text for contrast is 24px, or 18.66px and bold
- [`T-008-editor-shell-creates-slots.md`](../decisions/T-008-editor-shell-creates-slots.md): The editor shell owns Inspector.tsx and TopBar.tsx and creates every later editor component as a stub
- [`T-013-panels-show-contrast-line.md`](../decisions/T-013-panels-show-contrast-line.md): The Text and Terms panels show a per-item contrast line
- [`general-photo-contrast-approximate.md`](../decisions/general-photo-contrast-approximate.md): The photo contrast check is labelled approximate
