---
title: "Four more decisions about the removed contrast check are retired, and the Terms panel's wording inputs stand"
type: decision
project: captivator
ticket: T-046
decided_by: main session
supersedes:
  - T-003-format-ratio-rounds-down.md
  - T-013-role-weights-shared-with-splash.md
  - T-027-readability-check-test-file-added.md
  - T-035-fix-tests-in-readability-test-file.md
updated: 2026-10-23
tags: [project, captivator, decision, contrast, editor]
---
# Four more decisions about the removed contrast check are retired, and the Terms panel's wording inputs stand

## Context
Code review of T-046 found decisions that still read as live although what they describe is gone: `formatRatio`, the Text panel's import of `WEIGHT`, and the two readability test files. [`T-046-contrast-check-removed.md`](T-046-contrast-check-removed.md) also supersedes `T-020-panels-share-rate-text.md` as a whole, but only that file's contrast half was removed.

## Decision
Supersede the four decisions above. `WEIGHT` is now local to `TextBlock.tsx`. From `T-020-panels-share-rate-text.md`, these parts still hold: the shared `WordingInput`, the named drafts, no counters on the wording inputs, the "Checkbox wording" fieldset and the sample's 14px text and 20px box.

## Alternatives
- **Edit the earlier decision files:** committed decisions are never edited.
- **Leave them:** an agent reading the log would treat the missing ratio, Fix or test files as defects.

## Consequences
No live decision describes an editor contrast check. `T-003-large-text-includes-bold.md` stays live, because the Connected screen uses `requiredRatio`.
