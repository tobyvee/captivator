---
title: "T-043: Text can't be smaller than 16px"
type: ticket
project: captivator
status: done
priority: P1
milestone: 9
estimate: 10
depends_on: []
touches:
  - src/lib/design-schema.ts
  - src/lib/design-schema.test.ts
  - src/lib/templates.ts
  - src/lib/templates.test.ts
  - src/editor/panels/TextPanel.tsx
  - src/editor/panels/TextPanel.test.tsx
  - src/lib/store.test.ts
  - src/lib/export.test.ts
cut_rank:
updated: 2026-10-23
tags: [project, captivator, ticket, schema, editor]
---
# T-043: Text can't be smaller than 16px

## Context
The user: "The text options allow the user to make the font < 16px. 16px should be the minimum font-size and it cannot be made smaller than that."

## Scope
- The schema's text size range becomes 16–56px. A saved 12–15px size is raised to 16.
- The Text panel's size slider starts at 16.
- Sponsor's subheading goes to 16px, with its headline at 34px so it still fits.
- **Out of scope:** the renderer's fixed small text (credit, terms).

## Acceptance criteria
- [x] The slider's minimum is 16, and a lower value can't reach the design.
- [x] `Design` accepts 16–56 and rejects 57, fractions and anything below 12. A saved whole-number 12–15 is raised to 16, through a store update and on restore.
- [x] Every template parses, and Sponsor's estimated compact height stays under 600px (597.5).
- [x] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Outcome
Text blocks are 16–56px everywhere, and older saved designs still restore. 887 tests pass. The code review and security audit approved it. Their fixes are in: fractions aren't raised, the stale fixture is fixed, and there are store tests.

## Notes
- The guest page's fixed small text (terms row 14px, terms body 15px, Connected's thanks 15px, credit 11px) is out of scope; the user has been asked whether it should follow the floor.

## Decisions
- [`T-043-text-size-floor-16.md`](../decisions/T-043-text-size-floor-16.md): Text blocks can't be smaller than 16px
- [`T-043-legacy-sizes-raised-and-sponsor-headline.md`](../decisions/T-043-legacy-sizes-raised-and-sponsor-headline.md): Saved 12–15px text is raised to 16 on load, Sponsor's headline drops to 34px, and the floor covers text blocks only
