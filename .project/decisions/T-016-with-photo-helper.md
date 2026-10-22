---
title: "A new photo goes through one exported withPhoto(bg, src, credit?), applied to the background as it is when the upload finishes"
type: decision
project: captivator
ticket: [T-016, T-032]
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, background]
---
# A new photo goes through one exported withPhoto(bg, src, credit?), applied to the background as it is when the upload finishes

## Context
The T-016 review found two problems with the panel's upload handler. It built the next background from the `bg` captured when the file was picked, so an undo, template switch or tab change during the shrink (several seconds for a large photo) was overwritten when the upload landed. And the new-photo defaults (fill, zoom 1, focus 50/50, backdrop from the main colour, a 40% black overlay) were an inline literal that T-032's Unsplash search, which touches only `UnsplashSearch.tsx`, would have had to copy.

## Decision
`BackgroundPanel.tsx` exports `withPhoto(bg, src, credit?)` and `mainColour(bg)`. A photo keeps its settings and swaps `src` and `credit`; anything else becomes a fresh photo over its main colour. The upload calls it with `useStore.getState().design.background` at the moment the upload finishes. T-032 calls `withPhoto` with the chosen photo's credit.

## Alternatives
- **Keep the closure:** loses the customer's changes made during an upload.
- **A store action for "set photo":** `store.ts` belongs to T-025 until it lands, and the store already has `updateBackground`.

## Consequences
An upload that finishes after the customer has left the Photo tab still applies to the current background, which is what they asked for when they picked the file. `withPhoto` has its own unit tests.
