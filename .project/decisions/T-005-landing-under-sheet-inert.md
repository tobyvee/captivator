---
title: "The landing page under the open terms sheet is an unpositioned flex wrapper with aria-hidden and inert"
type: decision
project: captivator
ticket: [T-005, T-006, T-021]
decided_by: nextjs-specialist
supersedes: T-005-terms-screen-unpositioned-wrapper.md
updated: 2026-10-22
tags: [project, captivator, decision, splash, accessibility]
---
# The landing page under the open terms sheet is an unpositioned flex wrapper with aria-hidden and inert

## Context
The splash audit found that the wrapper around the landing page under the open terms sheet is `aria-hidden` but its focusable content (fields, the Connect button, T-006's credit link) would still take keyboard focus behind a modal sheet. The earlier decision also said blocks under the sheet stay clickable in edit mode.

## Decision
The wrapper keeps the earlier layout: a `<div>` with `display: flex; flex-direction: column; flex: 1 0 auto` and no `position`, so the background layers and the sheet still anchor to the `position: relative` root. It now carries both `aria-hidden="true"` and `inert` (React 19's boolean prop), so its content is out of the accessibility tree, the tab order and pointer hit-testing.

## Alternatives
- **`aria-hidden` only:** hidden content stays focusable, which WCAG flags (`aria-hidden-focus`).
- **`tabIndex={-1}` on each focusable child:** the children belong to other tickets, and it misses pointer clicks.
- **`display: contents` or a positioned wrapper:** rejected in the superseded decision for the same reasons (Safari's `aria-hidden` handling; the background would anchor to the wrapper).

## Consequences
In edit mode, clicks on the landing under the open sheet no longer reach its blocks: they pass to the root, which selects the background (`T-005-background-select-on-own-target.md`), and the store returns the preview to landing (`T-004-terms-selection-switches-screen.md`), so clicking outside the sheet dismisses it. iOS 15.4 lacks `inert` (Safari 15.5+), but the export never renders this wrapper, so the guest page is unaffected.
