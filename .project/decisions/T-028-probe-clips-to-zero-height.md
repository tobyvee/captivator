---
title: "The fit probe is a zero-height, clipped, inert box, and observes the splash root picked by tag"
type: decision
project: captivator
ticket: T-028
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, fit]
---
# The fit probe is a zero-height, clipped, inert box, and observes the splash root picked by tag

## Context
The ticket gives the probe `position: absolute; left: -10000px; top: 0; width: 375px; visibility: hidden; pointer-events: none` and `aria-hidden`. Nothing in `PreviewStage` is positioned, so the probe sits at the top of the document. An absolutely placed box still adds scrollable overflow below it, so a design taller than the editor page (five extra text blocks on Sponsor measure about 800px) would lengthen the editor's scroll with blank space. `visibility: hidden` can also be overridden by a descendant that sets `visibility: visible`, and React's server render puts a `<link rel="preload">` for the background photo ahead of the SplashPage root.

## Decision
The probe also carries `height: 0; overflow: hidden`, which clips the page out of the document's scrollable overflow while the splash root inside keeps its own content height (measured the same, 599px and 801px, with and without these styles in Chrome). It also carries `inert`, so nothing in it can take focus or clicks whatever its descendants' styles. The hook observes `probe.querySelector(":scope > div")` rather than `firstElementChild`.

## Alternatives
- **The ticket's styles only:** a tall design adds blank scroll to the editor page.
- **`contain: strict`:** also works, but is less obvious than a clipped zero-height box.
- **Observe the probe container:** with `height: 0` its size never changes, so the observer would never re-fire.

## Consequences
The probe never affects the editor's layout or scroll. SplashPage's root must stay a `<div>` for the hook to find it.
