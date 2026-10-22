---
title: "captivator — Status"
type: status
project: captivator
updated: 2026-10-22
tags: [project, captivator, status]
---
# captivator — Status

> PM docs: this repo's `.project/` (`prd/`, `spec/`, `tickets/`, this file). Committed with the repo.

## Summary

Captivator, the Phase 0 MVP editor for branded guest Wi-Fi splash pages, is planned and ready to build. The PRD, tech spec and editor canvas are done. The build is split into 35 tickets in 11 parallel-safe waves (`tickets/INDEX.md`), with nothing cut and the stretch work scheduled. The only code so far is the design-phase schema, and nothing is committed yet. The next step is wave 1: `T-001`, the scaffold.

## In progress

## Outstanding

- [ ] T-001: Scaffold the Next.js app, dependencies, Vitest and schema tests

## Planned

- [ ] T-002: Blank and Sponsor templates
- [ ] T-005: SplashPage skeleton with text and image blocks
- [ ] T-011: Image upload pipeline and ImageUpload control
- [ ] T-003: Contrast helpers
- [ ] T-004: Store with every action, and localStorage persistence
- [ ] T-007: Form renderer: fields, terms row, Connect and render modes
- [ ] T-006: Background renderer: colour, gradient and photo
- [ ] T-021: Terms sheet for the preview and the no-JS export
- [ ] T-008: Editor shell, top bar, inspector router and component slots
- [ ] T-010: ColourField and Slider controls
- [ ] T-023: Export HTML builder
- [ ] T-018: Photo hero and Minimal templates
- [ ] T-009: Preview stage with phone and browser frames
- [ ] T-016: Background panel: colour, gradient and photo upload
- [ ] T-012: Block list with three zones, add, reorder and the Terms switch
- [ ] T-014: Image panel
- [ ] T-013: Text panel
- [ ] T-015: Fields and Connect button panels
- [ ] T-024: Export HTML button and size toast
- [ ] T-017: Photo fit, zoom, focus presets and darken overlay
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
