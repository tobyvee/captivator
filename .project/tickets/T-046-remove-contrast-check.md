---
title: "T-046: Remove the contrast check"
type: ticket
project: captivator
status: done
priority: P1
milestone: 9
estimate: 10
depends_on: []
touches:
  - src/editor/checks/ReadabilityCheck.tsx
  - src/editor/checks/ReadabilityCheck.test.tsx
  - src/lib/readability.ts
  - src/lib/readability.test.ts
  - src/lib/contrast.ts
  - src/lib/contrast.test.ts
  - src/editor/PreviewStage.tsx
  - src/editor/PreviewStage.test.tsx
  - src/editor/panels/TextPanel.tsx
  - src/editor/panels/TextPanel.test.tsx
  - src/editor/panels/TermsPanel.tsx
  - src/editor/panels/TermsPanel.test.tsx
  - src/splash/blocks/TextBlock.tsx
  - src/lib/design-schema.ts
  - .claude/agents/ticket-planner.md
  - README.md
  - docs/editor.png
  - CLAUDE.md
cut_rank:
updated: 2026-10-23
tags: [project, captivator, ticket, editor, contrast]
---
# T-046: Remove the contrast check

## Context
The user: "Let's remove the WACG contrast checker. It's too confusing for the user and tbh they can make a bad design if that's what they want."

## Scope
- Remove the readability notice beside the preview caption, its one-tap Fix, and the contrast lines in the Text and Terms panels.
- Delete `readability.ts` and `ReadabilityCheck.tsx` with their tests. Keep the `contrast.ts` helpers the renderer uses, and drop what only the check used (`formatRatio`, the photo-average parameter).
- Update the README and CLAUDE.md so they no longer describe a contrast check, and retake the README screenshot, which showed the readability notice.
- While checking the README, add the departures from the spec made in T-043 to T-045.

## Acceptance criteria
- [x] White text on a white background shows no warning, ratio or Fix anywhere in the editor. *Tests in `PreviewStage.test.tsx` and `TextPanel.test.tsx` set white on white and check it. The PreviewStage test fails against the code before this ticket.*
- [x] The renderer's own colour picks (terms sheet, error text, Connected) are unchanged. *Their tests pass unchanged.*
- [x] `npm test` (832 tests), `npx tsc --noEmit` and `npm run lint` pass.

## Decisions
- [`T-046-contrast-check-removed.md`](../decisions/T-046-contrast-check-removed.md): The editor has no contrast check; the customer judges readability themselves (user)
- [`T-046-retire-remaining-contrast-decisions.md`](../decisions/T-046-retire-remaining-contrast-decisions.md): Four more decisions about the removed check are retired, and the Terms panel's wording inputs stand

## Notes
Code review (changes required, then fixed): the first preview test couldn't fail, so both tests now set white on white. The review also caught a stale `WEIGHT` export and comments, and decisions the first supersede list missed.
