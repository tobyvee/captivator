---
title: "captivator — Status"
type: status
project: captivator
updated: 2026-10-23
tags: [project, captivator, status]
---
# captivator — Status

> PM docs: this repo's `.project/` (`prd/`, `spec/`, `tickets/`, this file). Committed with the repo.

## Summary

Captivator, the Phase 0 MVP editor for branded guest Wi-Fi splash pages, is built and deployed to Cloudflare Workers with vinext at https://app.captivator.workers.dev. All 46 tickets in 11 waves are done, all nine milestones are closed, and nothing was cut, stretch work included (`tickets/INDEX.md`). The editor has a live phone and browser preview, the block list with drag to reorder, undo and redo, the small-phone fit check, the logo palette, Unsplash search, and the Background, Text, Image, Fields, Connect button and Terms panels. It renders four guest screens from one `SplashPage` and exports a standalone HTML file under the 100 KB budget. Every ticket was reviewed and security-audited, and the guest page was splash-audited. The final full audit found one low, missing security headers, now fixed (`review/2026-10-23-security-full-review.md`). 832 tests pass, and the README describes what shipped, the key decisions and a path to production that assumes no router vendor or authentication method. You ran the real-phone checklist (`review/phone-checklist.md`): 15 checks passed, including the live URL over mobile data, and you accepted the other 6 as skipped, so they're recorded as unverified. Fixes you asked for after the run landed as `T-036` to `T-046`: 16px is now the smallest text size, no template opens with the small-phone warning, and the contrast check is gone because it confused customers. The Unsplash fix passed its re-check, and the Android export fix (`T-038`) wasn't re-checked. The final deploy is green and the security headers are live. All 11 waves are closed.

## In progress

## Outstanding

## Planned

## Completed

- [x] Repo created, `git init`, `.project/` set up (2026-10-21)
- [x] PRD and tech spec written and reviewed (2026-10-21)
- [x] Build planned and prioritised: 35 tickets in 11 waves, plus T-036 from the checklist (2026-10-22)
- [x] T-001: Scaffold the Next.js app on vinext, with dependencies, Vitest, the deploy workflow and schema tests (2026-10-22)
- [x] T-002: Blank and Sponsor templates (2026-10-22)
- [x] T-005: SplashPage skeleton with text and image blocks (2026-10-22)
- [x] T-011: Image upload pipeline and ImageUpload control (2026-10-22)
- [x] T-003: Contrast helpers (2026-10-22)
- [x] T-004: Store with every action, and localStorage persistence (2026-10-22)
- [x] T-007: Form renderer: fields, terms row, Connect and render modes (2026-10-23)
- [x] T-006: Background renderer: colour, gradient and photo (2026-10-23)
- [x] T-021: Terms sheet for the preview and the no-JS export (2026-10-23)
- [x] Cloudflare setup: API token and account ID secrets added; pushes deploy to app.captivator.workers.dev (2026-10-23)
- [x] Wave 3 closed; wave-wide security audit found nothing (2026-10-23)
- [x] T-008: Editor shell, top bar, inspector router and component slots (2026-10-23)
- [x] T-010: ColourField and Slider controls (2026-10-23)
- [x] T-023: Export HTML builder (2026-10-23)
- [x] T-018: Photo hero and Minimal templates (2026-10-23)
- [x] Wave 4 closed; wave-wide security audit found nothing (2026-10-23)
- [x] T-009: Preview stage with phone and browser frames (2026-10-23)
- [x] Milestone 2 closed: splash renderer with mobile and desktop preview (2026-10-23)
- [x] T-016: Background panel: colour, gradient and photo upload (2026-10-23)
- [x] T-012: Block list with three zones, add, reorder and the Terms switch (2026-10-23)
- [x] T-014: Image panel (2026-10-23)
- [x] Wave 5 closed; wave-wide security audit found nothing (2026-10-23)
- [x] T-013: Text panel (2026-10-23)
- [x] T-015: Fields and Connect button panels (2026-10-23)
- [x] Milestone 3 closed: editor blocks, fields, button, uploads (2026-10-23)
- [x] T-024: Export HTML button and size toast (2026-10-23)
- [x] Milestone 7 closed: export standalone HTML, ahead of milestones 4–6 because the waves run in parallel (2026-10-23)
- [x] T-017: Photo fit, zoom, focus presets and darken overlay (2026-10-23)
- [x] Wave 6 closed; wave-wide security audit found nothing (2026-10-23)
- [x] T-027: Readability check under the preview (2026-10-23)
- [x] T-019: Template picker with live thumbnails and Continue your design (2026-10-23)
- [x] Milestone 5 closed: templates and saved designs, ahead of milestone 4, whose stretch ticket T-033 is still to come (2026-10-23)
- [x] T-020: Terms panel (2026-10-23)
- [x] T-025: Undo and redo with shortcuts (2026-10-23)
- [x] Wave 7 closed; wave-wide security audit found nothing, and its note on the picker's failed-restore path is fixed (2026-10-23)
- [x] T-022: Error and Connected guest screens (2026-10-23)
- [x] Milestone 6 closed: terms and guest screens (2026-10-23)
- [x] T-026: Logo palette extraction (2026-10-23)
- [x] T-028: Small-phone fit check (2026-10-23)
- [x] T-031: Unsplash search and download-ping API route (2026-10-23)
- [x] Wave 8 closed; wave-wide security audit found one low, which lands with T-032 (2026-10-23)
- [x] T-033: Focus-point drag dot (2026-10-23)
- [x] Milestone 4 closed: background options (2026-10-23)
- [x] T-035: One-tap contrast Fix (2026-10-23)
- [x] T-032: Unsplash search in the Photo tab (2026-10-23)
- [x] T-034: Drag to reorder blocks with dnd-kit (2026-10-23)
- [x] Milestone 8 closed: undo, logo palette, readability and fit checks, plus Unsplash search, contrast Fix and drag to reorder (2026-10-23)
- [x] Wave 9 closed; wave-wide security audit found nothing (2026-10-23)
- [x] T-036: Editor columns scroll independently, so the preview stays put (a checklist failure) (2026-10-23)
- [x] T-037: The failing readability Notice stacks under the preview caption (reported after T-030) (2026-10-23)
- [x] T-038: The exported page draws under Android's gesture bar, inside the safe area (reported after T-030) (2026-10-23)
- [x] T-039: Gradient direction shows icons only (asked for after T-030) (2026-10-23)
- [x] T-040: No HTML entities in the exported font declaration (reported after T-030) (2026-10-23)
- [x] T-041: Hidden status text can't make the editor page scroll past the window (reported after T-036) (2026-10-23)
- [x] T-042: README path to production without vendor assumptions (asked for after T-030) (2026-10-23)
- [x] T-029: Real-phone testing checklist (2026-10-23)
- [x] Wave 10 closed; wave-wide security audit found nothing (2026-10-23)
- [x] T-030: README and final deploy (2026-10-23)
- [x] Milestone 9 closed: real-phone checklist, README and final deploy, with security headers (2026-10-23)
- [x] Wave 11 closed; the final full audit's one low (security headers) is fixed (2026-10-23)
- [x] Final deploy green (run 39856955907); `/`, `/editor` and `/api/unsplash` send the three security headers (2026-10-23)
- [x] Real-device checks finished: the live URL loads on mobile data, the Unsplash fixes (T-036, T-041) pass their re-check, and you accepted the rest as skipped (2026-10-23)
- [x] T-043: Text can't be smaller than 16px (asked for after wave 11) (2026-10-23)
- [x] Wave 11's closing security audit of T-037 to T-043 (`9650ed1..375bfef`): no findings (2026-10-23)
- [x] T-044: No template opens with the small-phone warning (asked for after wave 11) (2026-10-23)
- [x] T-045: Colour suggestions in one tight row (asked for after wave 11) (2026-10-23)
- [x] T-046: Remove the contrast check (asked for after wave 11) (2026-10-23)
