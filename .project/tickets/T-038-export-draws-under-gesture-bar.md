---
title: "T-038: The exported page draws under Android's gesture bar, inside the safe area"
type: ticket
project: captivator
status: done
priority: P1
milestone: 9
estimate: 10
depends_on: []
touches:
  - src/lib/export.ts
  - src/lib/export.test.ts
  - src/splash/layout.ts
  - src/splash/Background.tsx
  - src/splash/Background.test.tsx
  - src/splash/TermsSheet.tsx
  - src/splash/TermsSheet.test.tsx
  - src/splash/Connected.test.tsx
  - .project/review/phone-checklist.md
  - README.md
cut_rank:
updated: 2026-10-23
tags: [project, captivator, ticket, export, splash]
---
# T-038: The exported page draws under Android's gesture bar, inside the safe area

## Context
The user reported, with a screenshot from Chrome on Android of an exported page: "On Chrome Android there is a white space at the bottom". Chrome 135+ goes edge to edge, and a page without `viewport-fit=cover` gets a white chin behind the gesture bar ([Chrome's edge-to-edge guide](https://developer.chrome.com/docs/css-ui/edge-to-edge)).

## Scope
- The export's viewport meta adds `viewport-fit=cover`.
- Content against an edge adds that edge's safe-area inset: the column's bottom padding, the photo credit, and the terms sheet's sides and bottom.
- Record the checklist item and the README's known gap.

## Acceptance criteria
- [x] The export's viewport meta has `viewport-fit=cover`.
- [x] The column, credit and terms sheet add the safe-area insets, and the inset is 0 where a page doesn't opt in, so the editor is unchanged.
- [x] Tests assert the values in static markup (jsdom drops `env()`).
- [x] `npm test`, `npx tsc --noEmit` and `npm run lint` pass. Code review, splash audit and security audit have run, and their landscape findings are fixed.
- [ ] Re-export and open the file on the Android phone: no white strip, and the credit and Connect clear the gesture bar. *Needs the user's phone.*

## Outcome
The exported page now runs under the gesture bar, with its content inside the safe area, in portrait and landscape. 881 tests pass. The security audit found nothing. The splash audit and the code review found that the terms sheet and credit sat under the notch in landscape, and that is fixed. Export size grows by about 300 bytes.

## Notes
- The iOS and Android login sheets haven't been tried on a device; the splash audit expects them to be no worse than before.
- The spec's viewport meta line is now out of date ([`T-038-export-draws-under-gesture-bar.md`](../decisions/T-038-export-draws-under-gesture-bar.md)).

## Decisions
- [`T-038-export-draws-under-gesture-bar.md`](../decisions/T-038-export-draws-under-gesture-bar.md): The export opts into viewport-fit=cover, and its edge content adds the safe-area insets
- [`T-038-checklist-and-readme-in-touches.md`](../decisions/T-038-checklist-and-readme-in-touches.md): T-038 updates the phone checklist and the README's known gaps
