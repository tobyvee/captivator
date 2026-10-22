---
title: "T-035: One-tap contrast Fix"
type: ticket
project: captivator
status: done
priority: P2
milestone: 8
estimate: 10
depends_on: [T-027]
touches:
  - src/editor/checks/ReadabilityCheck.tsx
  - src/editor/checks/ReadabilityCheck.test.tsx
  - src/lib/readability.ts
  - src/lib/readability.test.ts
cut_rank:
updated: 2026-10-23
tags: [project, captivator, ticket, editor]
---
# T-035: One-tap contrast Fix

## Context
Stretch, scheduled at P2 ([`general-stretch-tickets-scheduled.md`](../decisions/general-stretch-tickets-scheduled.md); [spec → Checks → Contrast](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md): "a one-tap Fix is stretch work"; *Build plan → Stretch*). It's not in the cut order, so it has no `cut_rank`. This extends `ReadabilityCheck` from T-027 using the `target` on each failure. Canvas artboard: `Main` (readability line under the frame).

## Scope
- When `status === "fail"`, show a "Fix" `<button>` next to the message. It acts on the first failure's `target`:
  - `block` → `updateBlock(id, { colour: bestTextColour(backgroundColours(bg, photoAverage)) })`.
  - `terms` → `updateForm({ terms: { textColour: bestTextColour(...) } })`.
  - `button` → `updateForm({ button: { fg: bestTextColour(solid ? button.bg : page background) } })`.
  - `inputs` → `updateForm({ inputText: bestTextColour(inputBg) })`.
- **Out of scope:** changing `readability.ts` (T-027 owns it; the `target` is already there). *Changed in review: failures now carry the colours they were rated against ([`T-035-failure-carries-colours.md`](../decisions/T-035-failure-carries-colours.md)).*

## Acceptance criteria
- [x] White text on white, then Fix, turns the heading near-black and the line reads "All text is readable".
- [x] Each Fix is one undo step. *For Fixes at least 400ms apart; a Fix within 400ms of another design change joins its step ([`general-undo-leading-edge-debounce.md`](../decisions/general-undo-leading-edge-debounce.md)).*
- [x] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-027: `ReadabilityCheck.tsx`, `checkDesign`'s `target`, and the photo-average hook.

## Outcome
- **Built:** a "Fix {label}" button on the failing readability line. It acts on the first failure that has a Fix, through one store action (`updateBlock` for a text block; `updateForm` for the terms row, the Connect label or the field text), choosing near-black, white or black with `readableTextColour` against the colours that check was rated on. It shows only when that colour reads better than the current one, and never for "Fields" (the inputs' edge). White text on white becomes `#111111` and the line reads "All text is readable". 835 tests pass; `tsc` and lint are clean.
- **Review:** changes required. On a gradient or fitted photo the Fix could pick a colour that read worse, and `fixFor` copied `checkDesign`'s page colours. A double-click applied two Fixes, and an unfixable first failure hid later Fixes. nextjs-specialist fixed all four in `08c96cb`, `be41d30` and `8ccfc97` with mutation-checked tests; failures now carry `against` ([`T-035-failure-carries-colours.md`](../decisions/T-035-failure-carries-colours.md)). The re-review approved.
- **Security:** not a trust-boundary ticket; the wave audit covers it.

## Notes
- **Review nits left as they are:** "Fields" is told apart from "Field text" by its label, per [`T-027-input-edge-contrast.md`](../decisions/T-027-input-edge-contrast.md), so a separate target kind would be sturdier if that label is ever reworded. Page-colour failures share one `against` array; typing it `readonly` would stop one consumer changing another's.
- **Limits:** the Fix only offers near-black, white or black, so on a strong gradient or a busy photo no Fix may help; a mid-grey can pass where those three fail.
- **From T-027:** put the Fix button in the failure `Notice`'s children in `ReadabilityCheck.tsx`. "Fields" (the inputs' edge) and "Field text" share `target: { kind: "inputs" }`; tell them apart by `label`, and give "Fields" no Fix ([`T-027-input-edge-contrast.md`](../decisions/T-027-input-edge-contrast.md)).

## Decisions
- [`general-stretch-tickets-scheduled.md`](../decisions/general-stretch-tickets-scheduled.md): Stretch tickets are scheduled, not held until the build is ahead
- [`T-035-fix-colour-and-when-shown.md`](../decisions/T-035-fix-colour-and-when-shown.md): `readableTextColour`, page colours rebuilt in the component (superseded)
- [`T-035-failure-carries-colours.md`](../decisions/T-035-failure-carries-colours.md): failures carry `against`; a Fix only when it reads better
- [`T-035-fix-ignores-repeat-clicks.md`](../decisions/T-035-fix-ignores-repeat-clicks.md): a double-click applies one Fix
- [`T-035-fix-first-fixable-failure.md`](../decisions/T-035-fix-first-fixable-failure.md): the Fix acts on the first fixable failure and names it
- [`T-035-fix-tests-in-readability-test-file.md`](../decisions/T-035-fix-tests-in-readability-test-file.md): the Fix tests live in T-027's test file
