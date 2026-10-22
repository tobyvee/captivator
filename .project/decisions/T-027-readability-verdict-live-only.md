---
title: "Only the readability verdict is live; the ratio and detail sit outside the status region"
type: decision
project: captivator
ticket: T-027
decided_by: main session
supersedes: T-027-line-states-and-notice.md
updated: 2026-10-23
tags: [project, captivator, decision, editor, contrast, accessibility]
---
# Only the readability verdict is live; the ratio and detail sit outside the status region

## Context
The code review of T-027 found that the whole readability line was one `role="status"` region holding the ratio, so every step of a colour drag that kept the check failing queued another announcement. `T-013-contrast-verdict-live-region.md` rejected exactly this for the Text panel, so the two contrast lines behaved differently for screen-reader users.

## Decision
Keep the three visual states from `T-027-line-states-and-notice.md` (inline green caption, inline amber caption, amber `Notice` on failure). The live region is now a visually hidden `role="status"` span, always mounted, holding only the verdict: "{label} is hard to read" on failure, otherwise the message ("All text is readable", "Check readability over your photo"). The visible Notice keeps the ratio and "Needs …:1" outside the region. The inline caption is `aria-hidden`, because the hidden span already says the same words.

## Alternatives
- **Keep the ratio live (the superseded decision):** a drag reads out a stream of ratios.
- **Make the Notice's title the live region:** its text is the ratio, so the same problem.

## Consequences
Tests read the verdict from `getByRole("status")` and the ratio with `getByText`. T-035's Fix button still goes in the Notice's children.
