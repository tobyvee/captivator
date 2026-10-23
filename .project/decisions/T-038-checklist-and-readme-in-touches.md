---
title: "T-038 updates the phone checklist and the README's known gaps"
type: decision
project: captivator
ticket: T-038
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, planning, checklist]
---
# T-038 updates the phone checklist and the README's known gaps

## Context
The user's Android screenshot was the first real-phone run of the checklist's skipped item, "Opens correctly on the phone". `review/phone-checklist.md` and `README.md` belong to T-030, which is done, and no `todo` ticket claims them.

## Decision
Take both files into T-038's `touches`. Record the item as failed and fixed by T-038, cut the skipped count to 7, and narrow the README's gap to the iPhone. Like T-036 and T-037, ticket T-038 in milestone 9 and wave 11 ([`T-037-lands-in-wave-11.md`](T-037-lands-in-wave-11.md)).

## Alternatives
- **Leave the item as skipped:** the record would then contradict what the user found on a real phone.

## Consequences
The checklist and README now name two fixes waiting on a re-check (T-036, T-038).
