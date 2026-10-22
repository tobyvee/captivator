---
title: "PLACEHOLDER_LOGO is a white dashed ring on a transparent PNG"
type: decision
project: captivator
ticket: [T-002, T-018]
decided_by: ticket-implementer
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, templates, images]
---
# PLACEHOLDER_LOGO is a white dashed ring on a transparent PNG

## Context
T-002 asks for "a light dashed ring about 240×240" under about 3 KB of base64. The canvas `StateLanding` artboard draws it as a 2px dashed ring at `rgba(255,255,255,0.65)` over a dark photo. T-018's Minimal template reuses `PLACEHOLDER_LOGO` over a light background, where a white ring is faint.

## Decision
`PLACEHOLDER_LOGO` is a 240×240 grey+alpha PNG: a white ring (~5px stroke, 24 dashes) at 75% opacity on transparency, with its antialiasing quantised to three levels to keep it at ~2 KB of base64. `PLACEHOLDER_SPONSOR` is a 336×128 opaque white tile with 20px rounded corners. Neither carries text such as "[EVENT LOGO]", because text at this size would push the logo past the size budget.

## Alternatives
- A mid-grey ring that shows on both light and dark backgrounds: departs from the canvas and the ticket's "light".
- Full 8-bit antialiasing: ~3.7 KB of base64, over the budget.
- Bracketed text in the image: much larger PNGs, and the text isn't translatable or accessible anyway (the `alt` already says "Your logo").

## Consequences
On light backgrounds (Minimal in T-018, or Blank after adding the logo) the placeholder is nearly invisible. T-018 can add a dark variant in `templates.ts` (it touches that file) if Minimal needs a visible placeholder.
