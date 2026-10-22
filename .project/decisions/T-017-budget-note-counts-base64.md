---
title: "The photo budget note counts the photo's base64 length, the bytes the export actually ships"
type: decision
project: captivator
ticket: [T-017, T-023]
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, export, budget]
---
# The photo budget note counts the photo's base64 length, the bytes the export actually ships

## Context
T-017's ticket gives the note as `src.length × 0.75 / 1024` KB, the decoded image size. The export inlines the photo as base64, and `export.ts` measures a data URL's length as its bytes against the 100 KB budget. The T-017 review showed the ticket's formula understates the cost by about a quarter: a photo that uses 40 KB of the page read "30 KB".

## Decision
"Photo is {n} KB of your budget" uses `Math.max(1, Math.round(src.length / 1024))`, the same measure as the export.

## Alternatives
- **The ticket's decoded size:** reads lower than what the budget counts.
- **Run the export's re-encode to show the shipped size:** heavy to do on every render.

## Consequences
For a large stored background (up to 1600px) the note can show more than the whole budget. The export re-encodes the background smaller when it's over its allowance (`T-023-reencode-only-when-needed.md`), so the note is an upper limit, not the size that ships.
