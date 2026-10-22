---
title: "T-010: ColourField and Slider controls"
type: ticket
project: captivator
status: done
priority: P0
milestone: 3
estimate: 15
depends_on: [T-004]
touches:
  - src/editor/controls/ColourField.tsx
  - src/editor/controls/Slider.tsx
  - src/editor/controls/ColourField.test.tsx
  - src/editor/controls/Slider.test.tsx
  - src/app/globals.css
cut_rank:
updated: 2026-10-23
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
- [x] Dragging in the picker calls `onChange` continuously, so the preview updates live. One drag becomes one undo step once T-025 lands; nothing extra is needed here.
- [x] An invalid hex reverts on blur without calling `onChange`; `abc123` commits as `#ABC123`. *`maxLength` is 9, so pasted spaces trim ([`T-010-hex-input-allows-surrounding-spaces.md`](../decisions/T-010-hex-input-allows-surrounding-spaces.md)).*
- [x] "In this design" shows the design's colours; "From your logo" is hidden while `logoPalette` is empty and shows its swatches when set (check by calling `setLogoPalette` in the console or a test).
- [x] Keyboard only: Tab reaches the swatch, hex input and every swatch; Escape closes the popover.
- [x] Every interactive element has at least a 44px tap target (swatch rows may wrap). *Checked from the classes and the compiled CSS in review; jsdom can't measure size.*
- [x] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-004: `useStore` for `design` and `logoPalette` (read-only here).

## Notes
- `react-colorful` is installed by T-001. Import `HexColorPicker` and nothing else.
- Controls don't dispatch store actions. `onChange` is the caller's.

## Outcome
- **Built:** `ColourField` (swatch, react-colorful popover, hex input, "In this design" and "From your logo" rows) and `Slider`. 37 control tests; 365 tests pass, and `tsc`, lint and the build are clean.
- **Tests:** the implementer couldn't commit tests (no test file in `touches`). The test-writer added them on landing ([`T-010-control-tests-added-on-landing.md`](../decisions/T-010-control-tests-added-on-landing.md)).
- **Review:** "changes required" on the first pass. The hue strip's 44px height and the picker's focus ring never applied, because Tailwind turns `_` into a space and react-colorful's unlayered CSS beats Tailwind's layers. Both are now unlayered rules in `globals.css` ([`T-010-picker-styles-in-globals-css.md`](../decisions/T-010-picker-styles-in-globals-css.md)). Also fixed: the `"use client"` directives, a no-op re-pick, the swatch's description, Escape cancelling a hex draft, and pasted spaces. The re-review approved.
- **Security:** not a trust-boundary ticket; no audit run.

## Decisions
- [`T-010-design-colours-shape.md`](../decisions/T-010-design-colours-shape.md): how `designColours` orders, dedupes and caps the design's colours
- [`T-010-popover-focus-rules.md`](../decisions/T-010-popover-focus-rules.md): Escape returns focus to the swatch; an outside click doesn't
- [`T-010-swatch-tap-targets.md`](../decisions/T-010-swatch-tap-targets.md): 44px swatch, hex input and suggestion targets
- [`T-010-no-committed-control-tests.md`](../decisions/T-010-no-committed-control-tests.md): no test file in `touches` (superseded)
- [`T-010-control-tests-added-on-landing.md`](../decisions/T-010-control-tests-added-on-landing.md): the controls get committed jsdom tests when the ticket lands
- [`T-010-colourfield-keeps-use-client.md`](../decisions/T-010-colourfield-keeps-use-client.md): ColourField keeps `"use client"` because it calls store hooks
- [`T-010-picker-styles-in-globals-css.md`](../decisions/T-010-picker-styles-in-globals-css.md): the picker's overrides are unlayered rules in `globals.css`
- [`T-010-hex-input-allows-surrounding-spaces.md`](../decisions/T-010-hex-input-allows-surrounding-spaces.md): `maxLength` 9, so pasted colours with spaces trim
