---
title: "Switching background type carries the background's main colour: its colour, a gradient's first stop, or a photo's backdrop"
type: decision
project: captivator
ticket: T-016
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, background]
---
# Switching background type carries the background's main colour: its colour, a gradient's first stop, or a photo's backdrop

## Context
T-016 gives three conversions. Colour takes "the gradient's `from` or the photo's `backdrop`". Gradient takes `from: current colour or "#0F2A44"`. A new photo takes `backdrop: previous colour or "#111111"`. It doesn't say what "current colour" or "previous colour" is when the background is a gradient or a photo, which is when the literal defaults would apply.

## Decision
One helper, `mainColour(bg)`, returns the colour, the gradient's `from` or the photo's `backdrop`, and all three conversions use it. A photo to gradient switch starts from the backdrop, and a gradient to photo upload uses the gradient's `from` as the backdrop. The literal defaults `#0F2A44` and `#111111` are never needed, because every background type has a main colour. The gradient's `to` is always `#0E5E6F`.

## Alternatives
- **"Current colour" means only a colour background's colour, with the defaults otherwise:** photo to gradient would drop the backdrop the customer may have picked for "Show whole photo", and gradient to photo would ignore the gradient's colour.
- **Remember the last colour per tab in local state:** lost on reload and on remount, and the store already holds a sensible colour.

## Consequences
Switching tabs always keeps a colour the customer already saw. A default photo backdrop (`#111111` from a template) becomes the gradient's first stop when switching photo to gradient.
