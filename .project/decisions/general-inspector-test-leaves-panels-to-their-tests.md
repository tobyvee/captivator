---
title: "The Inspector tests check the header and region only; each panel's own test file covers its body"
type: decision
project: captivator
ticket: [T-008, T-013, T-014, T-015, T-016, T-020]
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, tests]
---
# The Inspector tests check the header and region only; each panel's own test file covers its body

## Context
T-008's `editor.test.tsx` checked, for every selection kind, that the panel stub's "settings are coming soon" text rendered, and that the Image stub carried the block id. Every panel ticket replaces a stub, so each one broke these assertions in a file it doesn't own. T-016 and T-014 both hit them in wave 5.

## Decision
The per-selection Inspector case checks only the header, subtitle and `{title} settings` region; the stub-text line is gone. The block-id case checks whatever the real panel shows for that block once its ticket lands (for Image, the Alt text field holding the logo's alt). The main session makes these edits on the panel ticket's branch before merging it.

## Alternatives
- **Have each panel ticket add `editor.test.tsx` to its `touches`:** it would make every panel ticket clash with every other, so they couldn't share a wave.
- **Keep the stub text in each real panel:** customer-facing filler.

## Consequences
The Inspector tests no longer prove a panel body renders; `BackgroundPanel.test.tsx`, `ImagePanel.test.tsx` and later panel test files do. T-013, T-015 and T-020 don't need to touch `editor.test.tsx`.
