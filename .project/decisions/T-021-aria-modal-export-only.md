---
title: "The terms sheet is aria-modal only in the export"
type: decision
project: captivator
ticket: T-021
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, splash, accessibility, terms]
---
# The terms sheet is aria-modal only in the export

## Context
T-021's scope gives the edit and preview sheet `aria-modal="true"`. The re-review found that in the editor this tells screen readers everything outside the sheet is inert. The inspector, block list and screen switcher stay usable beside the preview, and VoiceOver in Safari confines navigation to an `aria-modal` dialog, which would trap a screen-reader user inside the preview.

## Decision
`role="dialog"` and `aria-labelledby` stay in every mode, but `aria-modal="true"` is set only in `export`, where the sheet really is modal for the guest. The scrolling body region is labelled "Terms text", so it isn't announced as a second "Terms of use".

## Alternatives
- Keep `aria-modal` in every mode as the ticket says: this traps screen-reader users in the editor preview.
- Drop `role="dialog"` in the editor: the sheet is still a dialog over the landing page, and the landing page stays `inert`.

## Consequences
In the editor, the landing behind the sheet stays `inert` and `aria-hidden`, so the sheet is still the only reachable part of the preview. The no-JS export can't make its landing inert, so Shift+Tab from the dialog reaches the form underneath; `aria-modal` covers VoiceOver there.
