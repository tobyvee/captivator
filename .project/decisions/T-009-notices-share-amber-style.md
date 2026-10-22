---
title: "The save and restore failure notices use the fit note's amber style"
type: decision
project: captivator
ticket: T-009
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, persistence]
---
# The save and restore failure notices use the fit note's amber style

## Context
The ticket gives the copy for "Couldn't save locally. Your changes stay in this tab only." and "Couldn't restore your saved design." with a Dismiss button, but the canvas only draws the amber fit note. Neither notice blocks editing.

## Decision
All three notes under the frame render through one `Notice` component in `PreviewStage`: `role="status"`, `#FFFBEB` background, `#FDE68A` border, `#78350F` title and a warning icon. Dismiss is a 44px-tall underlined text button inside the restore notice that calls `dismissRestoreFailed`. The save notice has no dismiss, because it clears itself on the next successful write.

## Alternatives
- **Red error styling:** reads as a blocking failure, and the editor keeps working in both cases.
- **A toast:** a new pattern the canvas doesn't have, and it would vanish before a customer reads the restore notice.

## Consequences
A later ticket that restyles warnings changes one component.
