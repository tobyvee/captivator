---
title: "T-035: One-tap contrast Fix"
type: ticket
project: captivator
status: todo
priority: P2
milestone: 8
estimate: 10
depends_on: [T-027]
touches:
  - src/editor/checks/ReadabilityCheck.tsx
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
- **Out of scope:** changing `readability.ts` (T-027 owns it; the `target` is already there).

## Acceptance criteria
- [ ] White text on white, then Fix, turns the heading near-black and the line reads "All text is readable".
- [ ] Each Fix is one undo step.
- [ ] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-027: `ReadabilityCheck.tsx`, `checkDesign`'s `target`, and the photo-average hook.

## Notes
- **From T-027:** put the Fix button in the failure `Notice`'s children in `ReadabilityCheck.tsx`. "Fields" (the inputs' edge) and "Field text" share `target: { kind: "inputs" }`; tell them apart by `label`, and give "Fields" no Fix ([`T-027-input-edge-contrast.md`](../decisions/T-027-input-edge-contrast.md)).

## Decisions
- [`general-stretch-tickets-scheduled.md`](../decisions/general-stretch-tickets-scheduled.md): Stretch tickets are scheduled, not held until the build is ahead
