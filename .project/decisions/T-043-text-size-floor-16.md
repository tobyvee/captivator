---
title: "Text blocks can't be smaller than 16px"
type: decision
project: captivator
ticket: T-043
decided_by: user
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, schema, editor]
---
# Text blocks can't be smaller than 16px

## Context
The schema allowed text blocks from 12px to 56px, and the Text panel's size slider started at 12. The user: "The text options allow the user to make the font < 16px. 16px should be the minimum font-size and it cannot be made smaller than that."

## Decision
A text block's size is 16–56px. The schema enforces it (`MIN_TEXT_SIZE`, `MAX_TEXT_SIZE`), and the Text panel's slider starts at 16.

## Alternatives
- **Keep the 12px floor:** the user ruled it out.

## Consequences
How saved designs and the templates meet the floor, and what it covers, are in [`T-043-legacy-sizes-raised-and-sponsor-headline.md`](T-043-legacy-sizes-raised-and-sponsor-headline.md).
