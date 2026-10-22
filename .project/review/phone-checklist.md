---
title: "Real-phone testing checklist"
type: review
project: captivator
updated: 2026-10-23
tags: [project, captivator, review, testing, checklist]
---
# Real-phone testing checklist

Run by the user against production (https://app.captivator.workers.dev, deploy of `8035bda`) on 2026-10-23, recorded on a private checklist page and read back by the main session. No item failed on the page, one failure was reported in chat, and none of the shipped features was cut. Eight items were skipped. Those weren't checked on a device, so they're listed as **unverified** below. The unit tests named next to each one are the only evidence for it ([`T-029-skipped-checks-unverified.md`](../decisions/T-029-skipped-checks-unverified.md)).

**Totals:** 14 pass · 0 fail (plus 1 failure reported in chat, fixed by T-036) · 8 skipped · 0 cut.

## The spec's checklist

| Item | Result | Note |
|---|---|---|
| Brief items: logo upload, background photo and colour, text colour and size, two of Name/Email/Phone, button colours | Pass | |
| Live preview on every keystroke and slider move, Mobile and Desktop | Pass | |
| Refresh restores the design; cleared storage falls back to the template without errors | Pass | |
| Undo through a colour drag (one step) and a text edit; Cmd+Z in a text box undoes text, not the design | Pass | |
| Third image or field blocked; a 4 MB phone photo lands under 150 KB | Skipped, unverified | Covered by `store.test.ts` (limits) and `images.test.ts` (downscale and encode budget) |
| Each template loads; switching keeps the uploaded logo | Pass | |
| White on white shows the contrast warning; five text blocks show the fit warning | Pass | Readability warning and one-tap Fix both checked |
| Keyboard only: Tab reaches every control; switches and segmented controls announce their state | Skipped, unverified | Covered by component tests for roles and `aria-checked`/`aria-pressed` state. Not checked with VoiceOver |

## Newer features

| Item | Result | Note |
|---|---|---|
| Colours from your logo (T-026) | Pass | |
| Guest screens and the editor's Connect flow (T-022) | Pass | |
| Photo focus dot by mouse and finger (T-033) | Pass | |
| Drag to reorder blocks (T-034) | Pass | |
| Unsplash search in the Photo tab (T-032) | Pass, with one failure | Search, pick and credit work. **Failure (reported in chat):** when the results load, the inspector grows past the window and the preview slides down the page. Follow-up: [T-036](../tickets/T-036-editor-columns-scroll-independently.md) |

## The exported file

| Item | Result | Note |
|---|---|---|
| Download in Safari, Chrome and iOS; file name matches the design name | Pass | |
| The file makes no network requests (DevTools Network panel empty) | Pass | |
| Opens correctly on the phone | Skipped, unverified | `export.test.ts` checks the single-file output and the flex layout. The `100dvh` rule is unchecked on a device |
| Terms sheet opens and closes via `:target`; the box stays unticked | Skipped, unverified | `export.test.ts` and `SplashPage` tests check the `#terms` markup and the `:target` rule |
| Native `required` messages; focus ring | Skipped, unverified | Tests check the `required` attributes and the `:focus-visible` rule |
| Borderless inputs show no inner shadow; placeholder readable | Skipped, unverified | |
| Inside a real iOS and Android Wi-Fi login sheet | Skipped, unverified | No router available. The PRD's production path covers this (Peplink external splash) |

## Production

| Item | Result | Note |
|---|---|---|
| Production URL loads on mobile data | Skipped, unverified | The main session confirmed `/` and `/editor` return 200 over the internet, and the latest deploy run is green. Not checked on a phone's mobile data |

## Follow-ups
- [T-036](../tickets/T-036-editor-columns-scroll-independently.md): editor columns scroll independently, so the preview stays put. Landed on 2026-10-23. Re-check the Unsplash item in the deployed editor.
- The README lists the unverified items as known gaps (T-030).
