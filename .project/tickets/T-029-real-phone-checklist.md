---
title: "T-029: Real-phone testing checklist"
type: ticket
project: captivator
status: todo
priority: P1
milestone: 9
estimate: 10
depends_on: [T-012, T-013, T-014, T-015, T-017, T-019, T-020, T-024, T-025, T-027]
touches:
  - .project/review/phone-checklist.md
cut_rank:
updated: 2026-10-23
tags: [project, captivator, ticket, docs]
---
# T-029: Real-phone testing checklist

## Context
Build step 9, "Run through the testing checklist on a real phone" ([spec → Testing, deploy and README → Checklist](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md); build step 7's "open the downloaded file on a phone"). The hard parts (layout in the iOS login sheet, camera-roll uploads) aren't unit-testable. **This ticket is run by the main session with the user, not by a `ticket-implementer`.** It needs a real phone, and implementers may only write decision files under `.project/`. Decision: [`T-029-phone-checklist-at-step-9.md`](../decisions/T-029-phone-checklist-at-step-9.md).

## Scope
- On the deployed app (the Cloudflare Worker's URL, from the latest deploy workflow run), on a real phone and a desktop browser, run the spec's checklist and record pass/fail with a one-line note per item in `.project/review/phone-checklist.md` (frontmatter `type: review`).
- Also check:
  - The exported `.html` file opened on the phone (from Files or AirDrop): the layout, the terms sheet via `#terms`, native `required` validation, and no network requests.
  - The production URL loads on mobile data, not just home Wi-Fi (spec *Deploy*).
  - **The guest form in the iOS login sheet:**
    - Tapping "terms of use" opens the sheet without ticking the box.
    - Native `required` bubbles appear for an empty field and for the unticked checkbox.
    - Borderless inputs show no native inset shadow.
    - Placeholders are readable (T-007 splash audit, `general-export-placeholder-colour.md`).
- Failures become new tickets via `/plan-tickets <description>`; don't fix them inside this ticket.
- **Out of scope:** code changes; the README (T-030).

## Acceptance criteria
- [ ] Every item in the spec's checklist has a recorded result:
  - Brief items.
  - Live preview in Mobile and Desktop.
  - Refresh restores; cleared storage falls back without errors.
  - Undo through a colour drag and a text edit; Cmd+Z in a textarea.
  - Third image or field blocked; a 4 MB photo lands under 150 KB, measured as the stored data URL's length, the number the upload warning shows ([`T-011-upload-size-measures-data-url.md`](../decisions/T-011-upload-size-measures-data-url.md)).
  - Templates load and switching keeps the logo.
  - Contrast and fit warnings.
  - Keyboard-only use, with announced switch and segmented states.
- [ ] Items for cut tickets are marked "cut" rather than failed.
- [ ] The exported file and mobile-data checks are recorded.
- [ ] Any failure has a follow-up ticket ID next to it.

## Dependencies
These are the last non-cuttable tickets on each path, so every feature the checklist exercises is merged:
- T-012, T-013, T-014, T-015 (editor core).
- T-017 (photo adjustments).
- T-019 (templates).
- T-020 (terms panel).
- T-024 (export, which brings in T-023 and T-021).
- T-025 (undo).
- T-027 (readability, which brings in T-009).

Cuttable tickets (T-022, T-026, T-028 and the stretch tickets) are deliberately not dependencies; check them if they shipped.

## Notes
- **From T-025:** in Safari and Chrome, type in the design-name input and a panel textarea, press Cmd+Z (Ctrl+Z where available): the text undoes and the design doesn't ([`T-025-native-text-undo-check-in-t029.md`](../decisions/T-025-native-text-undo-check-in-t029.md)).
- **From T-024 and the milestone 7 review:** download the export in Safari, Chrome and on iOS and check the file name; open the file and confirm DevTools' Network panel is empty; check `:target` opens and closes the terms sheet, native `required` messages show, and the `:focus-visible` ring appears; check `100dvh` in the iOS Captive Network Assistant and Android's login WebView; and note the real export size for Sponsor with two uploads on Safari's JPEG path (T-023's audit measured 98.1 KB) ([`T-024-browser-download-check-in-t029.md`](../decisions/T-024-browser-download-check-in-t029.md)).

## Decisions
- [`T-029-checklist-and-readme-run-last.md`](../decisions/T-029-checklist-and-readme-run-last.md): The phone checklist and README run after every other ticket
- [`T-029-phone-checklist-at-step-9.md`](../decisions/T-029-phone-checklist-at-step-9.md): The real-phone checklist is its own ticket at build step 9, run by the main session
- [`general-deploy-cloudflare-vinext.md`](../decisions/general-deploy-cloudflare-vinext.md): The MVP deploys to Cloudflare Workers with vinext, not Vercel
- [`T-024-browser-download-check-in-t029.md`](../decisions/T-024-browser-download-check-in-t029.md): T-024's download and open check is done here
