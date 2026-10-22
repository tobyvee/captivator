---
title: "The photo credit sits on a dark backing, on one line, with the name ellipsized on its own"
type: decision
project: captivator
ticket: T-006
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, splash, accessibility, contrast]
---
# The photo credit sits on a dark backing, on one line, with the name ellipsized on its own

## Context
T-006's Notes, and the `DesktopPreview` artboard, style the credit as 11px white text with a subtle text-shadow. The T-006 splash audit found that a text-shadow doesn't give 11px white text 4.5:1 over a light photo. The security audit found that a long `credit.name` wrapped upward over Connect and the terms row (`.project/review/2026-10-23-security-T-006-review.md`, SEC-1). The splash re-audit then found that ellipsizing the whole line could hide "/ Unsplash".

## Decision
- The credit line has a `rgba(0,0,0,0.6)` backing (padding `2px 6px`, radius 4). White over it is at least 5.7:1, even over a white photo.
- The line stays on one line: `nowrap`, `overflow: hidden`, `ellipsis` and `max-width: calc(100% - 20px)`.
- The name sits in its own inline-block span capped at `18em` with its own ellipsis, so "/ Unsplash" always shows.

## Alternatives
- Keep the text-shadow: it fails contrast over light photos.
- Cap `credit.name` in the schema: the schema is user-committed (`general-design-schema-committed.md`), and the renderer fix covers hand-edited designs anyway.
- Let the credit wrap: a long name covers Connect and the consent row.

## Consequences
The credit looks slightly different from the canvas, as a small dark pill rather than shadowed text. Its height (about 18px at `bottom: 8`) fits inside the column's 40px bottom padding and inside the 28px that T-022 reserves under CONTINUE.
