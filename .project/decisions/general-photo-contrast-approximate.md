---
title: "The photo contrast check is labelled approximate"
type: decision
project: captivator
ticket: none
decided_by: user
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, checks]
---
# The photo contrast check is labelled approximate

## Context
Review finding 14: an average colour can pass text sitting over a bright part of a photo.

## Decision
Keep the average-colour method for the MVP. On photo backgrounds the result says "Check readability over your photo" instead of claiming a pass.

## Alternatives
- Use the 10th-percentile colour of the region behind the column: more accurate, about 15 minutes more.

## Consequences
The more accurate method can be added later without a schema change.
