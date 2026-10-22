---
title: "T-010: ColourField and Slider controls"
type: ticket
project: captivator
status: todo
priority: P0
milestone: 3
estimate: 15
depends_on: [T-004]
touches:
  - src/editor/controls/ColourField.tsx
  - src/editor/controls/Slider.tsx
cut_rank:
updated: 2026-10-22
tags: [project, captivator, ticket, editor]
---
# T-010: ColourField and Slider controls

## Context
Build step 3 (`ColourField`) ([spec → Editor UI → ColourField](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md)). The Text, Fields, Button, Background, Photo and Terms panels all use these controls. The "From your logo" row reads `logoPalette`, which stays empty until T-026 fills it, so the row is hidden until then. Canvas artboard: `Main` (Colour section of the Text panel: swatch, hex input, "In this design" and "From your logo" rows; Size slider).

## Scope
- **`ColourField({ label, value, onChange, id? })`:**
  - A swatch `<button aria-label="Open colour picker">` opening a popover with react-colorful's `HexColorPicker`. The popover closes on Escape and on outside click, and returns focus to the swatch.
  - A hex `<input>` (`maxLength` 7, labelled by `label`) that commits on blur or Enter when the value matches `^#?[0-9a-fA-F]{6}$` (normalised to uppercase with `#`), and otherwise reverts to `value`.
  - The "In this design" swatch row: `designColours(design)`, up to 8 unique colours.
  - The "From your logo" row: `logoPalette`, hidden when empty.
  - Each swatch is a `<button aria-label="#RRGGBB">` that calls `onChange`.
  - Export `designColours(design: Design): string[]` from this file: background colour, gradient stops or backdrop; text block colours; `inputBg`, `inputText`, `terms.textColour`, `button.bg` and `button.fg`. Deduplicate case-insensitively.
- **`Slider({ label, value, min, max, step = 1, unit = "", format?, onChange })`:** a label, the value shown as `format?.(value) ?? value + unit`, and `<input type="range">` (accent `#2563EB`, min-height 44px, `aria-valuetext` matching the shown value).
- **Out of scope:** palette extraction (T-026); per-panel contrast lines (in each panel).

## Acceptance criteria
- [ ] Dragging in the picker calls `onChange` continuously, so the preview updates live. One drag becomes one undo step once T-025 lands; nothing extra is needed here.
- [ ] An invalid hex reverts on blur without calling `onChange`; `abc123` commits as `#ABC123`.
- [ ] "In this design" shows the design's colours; "From your logo" is hidden while `logoPalette` is empty and shows its swatches when set (check by calling `setLogoPalette` in the console or a test).
- [ ] Keyboard only: Tab reaches the swatch, hex input and every swatch; Escape closes the popover.
- [ ] Every interactive element has at least a 44px tap target (swatch rows may wrap).
- [ ] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-004: `useStore` for `design` and `logoPalette` (read-only here).

## Notes
- `react-colorful` is installed by T-001. Import `HexColorPicker` and nothing else.
- Controls don't dispatch store actions. `onChange` is the caller's.
