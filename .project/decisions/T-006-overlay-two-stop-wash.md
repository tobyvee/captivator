---
title: "The photo overlay renders as a top-to-bottom gradient of its two colours; fade direction is deferred"
type: decision
project: captivator
ticket: [T-006, T-017, T-003]
decided_by: ticket-planner
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, splash, schema]
---
# The photo overlay renders as a top-to-bottom gradient of its two colours; fade direction is deferred

## Context
The spec renders the overlay as `linear-gradient(direction, transparent, to)` at `opacity`, with a "fade direction" control. The canvas draws three directions: bottom, bottom-right and right. But the committed schema's overlay is `{ from, to, opacity }`, with no direction. Adding one is a schema change that bumps the storage version and needs a `migrate` step (`general-persistence-versioning-and-flush.md`).

## Decision
- **Render:** the overlay is an absolute layer of `linear-gradient(180deg, from, to)` at `opacity`.
- **Panel:** the Photo panel offers only the darken slider.
- **Contrast:** blends the photo colour with both stops and takes the worst case.

## Alternatives
- **`transparent → to`:** ignores `from`, and leaves the top of the page undarkened, which is where the logo and headline sit.
- **Add `overlay.direction` with a v3 migration:** changes the user-committed schema, so it needs a user decision.

## Consequences
Templates get a "darker at bottom" look by choosing a lighter `from`. The fade-direction control is reported as a gap for the user to decide.
