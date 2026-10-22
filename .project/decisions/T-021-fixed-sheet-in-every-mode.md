---
title: "The terms sheet uses a position: fixed overlay in every mode; editor frames must contain fixed descendants"
type: decision
project: captivator
ticket: [T-021, T-009]
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, splash, terms, editor]
---
# The terms sheet uses a position: fixed overlay in every mode; editor frames must contain fixed descendants

## Context
T-021's ticket positioned the edit and preview sheet absolutely, at 82% of the splash root. In the editor frames, the root grows with its content (`general-splash-root-grows-in-frame.md`). For a design taller than the frame, the sheet was 82% of the content height, with CLOSE below the fold. The export used a `position: fixed; inset: 0` section, so the two geometries differed (review should-fix 3).

## Decision
In every mode, `TermsSheet` renders one `<section role="dialog" aria-modal="true">` with `position: fixed; inset: 0; z-index: 10`. Inside it are the dim layer and the sheet (`position: absolute; bottom: 0; height: 82%`). Export adds `id="terms"`, `class="cv-terms"` and `tabindex="-1"`. T-009's `PhoneFrame` and `BrowserFrame` must make each frame's non-scrolling shell the containing block for fixed descendants (`transform` or `contain: layout`), so the overlay fills the frame's viewport, not the browser window.

## Alternatives
- **Keep the absolute sheet and pin it to the frame with `position: sticky`:** this needs a different structure from the export, which is the divergence the review flagged.
- **Give the root a fixed height in frames:** this reverses the user's `general-splash-root-grows-in-frame.md`.

## Consequences
- Until T-009 builds the frames, an editor preview of the terms screen covers the whole window. Nothing renders it there yet.
- The edit and preview dim layer still calls `onClose`, and its clicks never reach the root's background-select check, whose target is the root itself.
- The landing wrapper stays `aria-hidden` and `inert`.
- `T-005-landing-under-sheet-inert.md`'s note that the sheet anchors to the root no longer applies to the sheet, but still applies to the background layers.
