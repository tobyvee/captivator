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

Captivator, the Phase 0 MVP editor for branded guest Wi-Fi splash pages, is being built. The PRD, tech spec and editor canvas are done. The build is split into 35 tickets in 11 parallel-safe waves (`tickets/INDEX.md`), with nothing cut and the stretch work scheduled. The app deploys to Cloudflare Workers with vinext at https://app.captivator.workers.dev, and each ticket is pushed and deployed as it lands. Waves 1 to 5 are done, and milestones 1 to 3 and 7 are closed. The guest page renders from one `SplashPage`, and Export HTML (`T-023`) builds a standalone page under the 100 KB budget. The editor has its shell, the live phone and browser preview (`T-009`), the block list (`T-012`), and the Background and Image panels (`T-016`, `T-014`), on four templates. Each ticket is reviewed, splash-audited where it touches the guest page, and security-audited, and the wave 5 audit found nothing. Wave 6 is landing: the Text panel (`T-013`), the Fields and Connect button panels (`T-015`, closing milestone 3) and the Export HTML button (`T-024`, closing milestone 7) are in, and `T-017` follows. 537 tests pass.

## In progress

## Outstanding

- [ ] T-017: Photo fit, zoom, focus presets and darken overlay

## Planned

- [ ] T-027: Readability check under the preview
- [ ] T-019: Template picker with live thumbnails and Continue your design
- [ ] T-020: Terms panel
- [ ] T-025: Undo and redo with shortcuts
- [ ] T-022: Error and Connected guest screens
- [ ] T-026: Logo palette extraction
- [ ] T-028: Small-phone fit check
- [ ] T-031: Unsplash search and download-ping API route
- [ ] T-033: Focus-point drag dot
- [ ] T-035: One-tap contrast Fix
- [ ] T-032: Unsplash search in the Photo tab
- [ ] T-034: Drag to reorder blocks with dnd-kit
- [ ] T-029: Real-phone testing checklist
- [ ] T-030: README and final deploy

## Completed

- [x] Repo created, `git init`, `.project/` set up (2026-10-21)
- [x] PRD and tech spec written and reviewed (2026-10-21)
- [x] Build planned and prioritised: 35 tickets in 11 waves (2026-10-22)
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
