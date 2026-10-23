---
title: "T-037: The failing readability Notice stacks under the preview caption"
type: ticket
project: captivator
status: done
priority: P1
milestone: 9
estimate: 5
depends_on: []
touches:
  - src/editor/checks/ReadabilityCheck.tsx
  - src/editor/checks/ReadabilityCheck.test.tsx
cut_rank:
updated: 2026-10-23
tags: [project, captivator, ticket, editor]
---
# T-037: The failing readability Notice stacks under the preview caption

## Context
Reported by the user with a screenshot of the deployed editor: "The layout here should stack". In `PreviewStage`'s caption row (a centred `flex-wrap` row), a failing readability check's amber Notice sat beside the "375 × 740, iPhone login sheet" caption instead of under it. Canvas artboard `Main` draws only the passing state, inline beside the caption ([`T-027-line-states-and-notice.md`](../decisions/T-027-line-states-and-notice.md)).

## Scope
- `ReadabilityCheck` takes the caption row's full width when the check fails, so the Notice wraps under the caption. The Notice matches the fit Notice's 420px width.
- The passing and approximate lines stay inline beside the caption.
- **Out of scope:** `PreviewStage`'s row and the other Notices.

## Acceptance criteria
- [x] A failing check's Notice sits on its own line under the caption, centred, at the same width as the fit Notice below it. *Checked in headless Chrome against the dev server at 1440 × 950 (side by side) and 800 × 950 (stacked).*
- [x] The passing and approximate lines still sit beside the caption.
- [x] `ReadabilityCheck.test.tsx` checks the wrapper takes the full width only when failing.
- [x] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
None open. T-027 (done) built the line and Notice; T-035 (done) added the Fix.

## Outcome
The failing Notice now wraps under the caption at 420px, lined up with the fit Notice. 881 tests pass, and `tsc` and lint are clean.

## Decisions
- [`T-037-failure-notice-under-caption.md`](../decisions/T-037-failure-notice-under-caption.md): A failing readability Notice wraps under the preview caption; the passing line stays beside it
- [`T-037-lands-in-wave-11.md`](../decisions/T-037-lands-in-wave-11.md): T-037 lands in wave 11 alongside T-030
