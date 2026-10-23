---
title: "The export opts into viewport-fit=cover, and its edge content adds the safe-area insets"
type: decision
project: captivator
ticket: T-038
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, export, splash, mobile]
---
# The export opts into viewport-fit=cover, and its edge content adds the safe-area insets

## Context
The user opened an exported page in Chrome on Android and saw a white strip under the page, behind the gesture bar. From Chrome 135, Chrome on Android goes edge to edge. A page without `viewport-fit=cover` gets a "chin" under it, and the chin showed the default white canvas. The spec gives the viewport meta as `width=device-width, initial-scale=1`.

## Decision
- The export's viewport meta adds `viewport-fit=cover`, so the background runs to the bottom edge.
- `clearOfEdge(edge, px)` in `src/splash/layout.ts` adds `env(safe-area-inset-<edge>, 0px)` to whatever sits against an edge:
  - the content column's bottom padding;
  - the photo credit's `bottom` and `right`, with its `max-width` less both side insets;
  - the terms sheet's left, right and bottom padding.
- The insets are 0 wherever a page doesn't opt in, so the editor and the fit check are unchanged.
- The landscape side insets came from review and the splash audit.

## Alternatives
- **Colour the chin with an `html` background or `theme-color`:** leaves a flat band under the photo, and needs a colour picked from the design for each background type.
- **Leave it:** the strip is the first thing a guest sees at the bottom of the page.

## Consequences
The spec's meta line is out of date. Real-device checks on the iOS and Android login sheets are still needed. If a sheet draws edge to edge but reports a 0 inset, it renders as it did before this change.
