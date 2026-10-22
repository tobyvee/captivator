---
title: "The focus box doesn't clip, so the drag dot keeps its full 44px tap target at the edges"
type: decision
project: captivator
ticket: T-033
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, photo, accessibility]
---
# The focus box doesn't clip, so the drag dot keeps its full 44px tap target at the edges

## Context
The milestone 4 review found that at 0% or 100% the dot's 44px hit area was clipped to about 33px by the focus box's `overflow-hidden`: the track is inset 11px, but the button reaches 22px from its centre. CLAUDE.md asks for 44px tap targets.

## Decision
The box drops `overflow-hidden`; the photo and the preset grid round their own corners instead. A test checks no ancestor of the dot clips.

## Alternatives
- **Inset the track by 22px:** the dot couldn't reach the photo's edges visually.
- **Accept the clipping at the edges:** below the tap-target rule where a customer most often aims, at a corner.

## Consequences
The dot's invisible hit area can reach up to 11px past the box at an edge; the visible dot stays inside.
