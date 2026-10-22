---
title: "The export re-encodes the background to fit the 100 KB budget"
type: decision
project: captivator
ticket: none
decided_by: user
supersedes:
updated: 2026-10-21
tags: [project, captivator, decision, export]
---
# The export re-encodes the background to fit the 100 KB budget

## Context
Review finding 3: a 1600px background at WebP 0.8 is typically 150–400 KB before base64, so every photo design would exceed the 100 KB page budget.

## Decision
At export time only, re-encode the background at 1000px with WebP quality stepping from 0.7 down to 0.4, then at 800px, stopping at the first result that fits the remaining budget. If none fits, the smallest attempt is used and the toast warns.

## Alternatives
- Budget the background separately: production treats 100 KB as blocking, so this only postpones the problem.
- Always use a small, blurred background: guarantees a fit but looks soft on desktop. Kept in reserve as a last step if the quality floor isn't enough.

## Consequences
The stored design keeps the sharper image for the editor. The stepping loop is pure, takes an injected encoder and is unit-tested.
