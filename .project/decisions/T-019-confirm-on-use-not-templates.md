---
title: "The confirm moves from the Templates button to Use on the picker"
type: decision
project: captivator
ticket: [T-019, T-008]
decided_by: ticket-planner
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, editor]
---
# The confirm moves from the Templates button to Use on the picker

## Context
Review finding 18: the spec's top bar puts a confirm on Templates "if there are changes". But going back to the picker loses nothing, because the design is saved and offered as "Continue your design". The action that changes the design is "Use" on another template.

## Decision
- **Templates button:** navigates to `/` without a confirm.
- **"Use {template}":** when a saved design exists, it asks first, saying that text and uploaded images are kept and that colours and layout change.

## Alternatives
- **The spec as written:** confirms an action that loses nothing, and doesn't warn on the one that changes the design.

## Consequences
TopBar's Templates is a plain link. Only the picker uses `window.confirm`.
