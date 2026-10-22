---
title: "T-029 closes with the user's skipped checks recorded as unverified, not failed or blocked"
type: decision
project: captivator
ticket: T-029
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, testing, checklist]
---
# T-029 closes with the user's skipped checks recorded as unverified, not failed or blocked

## Context
The user ran the real-phone checklist and said they had "done all the checks I can". 8 of 22 items were marked Skip: limits and photo size, keyboard and VoiceOver, the exported file on the phone, the terms sheet, `required` messages, input styling, a real Wi-Fi login sheet, and mobile data. T-029's criteria ask that every item has a recorded result, not that every item passes.

## Decision
Record each skipped item as "Skipped, unverified" in `.project/review/phone-checklist.md`, naming the unit tests that cover it where they exist, and mark T-029 done. T-030's README lists the unverified items as known gaps.

## Alternatives
- **Mark T-029 blocked until every item is run:** some items, such as a real captive-portal router, can't be checked in this setup, so the ticket would stay blocked indefinitely.
- **Count skips as passes on the strength of the unit tests:** that would overstate the evidence for device behaviour (`100dvh`, native validation UI, VoiceOver).

## Consequences
Device-only behaviour stays unconfirmed: the iOS login sheet, `100dvh`, native `required` messages, VoiceOver and the mobile-data load. Re-running those items later needs no code change. The mobile-data check that T-030 asks for is recorded as skipped rather than passed.
