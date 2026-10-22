---
title: "captivator — Ticket index"
type: reference
project: captivator
updated: 2026-10-23
tags: [project, captivator, reference, tickets]
---
# captivator — Ticket index

The run order for `/implement-parallel`: 35 tickets in 11 waves. Estimates add up to 550 minutes of agent work. The critical path, the sum of each wave's longest ticket, is 225 minutes before merging and review. Estimates size the work; they aren't a budget ([`general-time-budget-is-user-time.md`](../decisions/general-time-budget-is-user-time.md)).

Waves follow the greedy rules in `/prioritise-tickets`, with one override: `T-029` and `T-030` run last ([`T-029-checklist-and-readme-run-last.md`](../decisions/T-029-checklist-and-readme-run-last.md)).

## Waves

### Wave 1 (30 min)

**Before `T-001` is pushed,** the user creates a Cloudflare API token ("Edit Cloudflare Workers" template) and adds `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as GitHub Actions secrets, so the push deploys ([`general-deploy-via-github-actions.md`](../decisions/general-deploy-via-github-actions.md)). No agent does this. Each ticket is pushed as it lands ([`general-push-after-each-ticket.md`](../decisions/general-push-after-each-ticket.md)).

| ID | Title | Priority | Estimate | Touches |
|---|---|---|---|---|
| [T-001](T-001-scaffold.md) | Scaffold the Next.js app on vinext, with dependencies, Vitest, the deploy workflow and schema tests | P0 | 30 | `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `vite.config.ts`, `cloudflare.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `vitest.config.ts`, `vitest.setup.ts`, `.dev.vars.example`, `.gitignore`, `.github/workflows/deploy.yml`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/app/favicon.ico`, `src/lib/types.ts`, `src/lib/design-schema.test.ts` |

### Wave 2 (20 min)

| ID | Title | Priority | Estimate | Touches |
|---|---|---|---|---|
| [T-002](T-002-blank-and-sponsor-templates.md) | Blank and Sponsor templates | P0 | 10 | `src/lib/templates.ts`, `src/lib/templates.test.ts`, `public/templates/sponsor.jpg` |
| [T-005](T-005-splashpage-skeleton.md) | SplashPage skeleton with text and image blocks | P0 | 15 | `src/splash/SplashPage.tsx`, `src/splash/blocks/TextBlock.tsx`, `src/splash/blocks/ImageBlock.tsx`, `src/splash/Background.tsx`, `src/splash/Form.tsx`, `src/splash/TermsSheet.tsx`, `src/splash/Connected.tsx`, `src/splash/SplashPage.test.tsx` |
| [T-011](T-011-image-upload-pipeline.md) | Image upload pipeline and ImageUpload control | P0 | 20 | `src/lib/images.ts`, `src/lib/images.test.ts`, `src/lib/palette.ts`, `src/editor/controls/ImageUpload.tsx` |
| [T-003](T-003-contrast-helpers.md) | Contrast helpers | P1 | 10 | `src/lib/contrast.ts`, `src/lib/contrast.test.ts` |

### Wave 3 (30 min)

| ID | Title | Priority | Estimate | Touches |
|---|---|---|---|---|
| [T-004](T-004-store-and-persistence.md) | Store with every action, and localStorage persistence | P0 | 30 | `src/lib/store.ts`, `src/lib/store.test.ts`, `src/lib/persist-storage.ts`, `src/lib/persist-storage.test.ts`, `src/lib/store.hydration.test.tsx` |
| [T-007](T-007-form-renderer.md) | Form renderer: fields, terms row, Connect and render modes | P0 | 15 | `src/splash/Form.tsx`, `src/splash/Form.test.tsx` |
| [T-006](T-006-background-renderer.md) | Background renderer: colour, gradient and photo | P0 | 10 | `src/splash/Background.tsx`, `src/splash/Background.test.tsx`, `src/splash/SplashPage.tsx`, `src/splash/SplashPage.test.tsx` |
| [T-021](T-021-terms-sheet.md) | Terms sheet for the preview and the no-JS export | P1 | 15 | `src/splash/TermsSheet.tsx`, `src/splash/TermsSheet.test.tsx`, `src/splash/SplashPage.tsx`, `src/splash/SplashPage.test.tsx` |

### Wave 4 (25 min)

| ID | Title | Priority | Estimate | Touches |
|---|---|---|---|---|
| [T-008](T-008-editor-shell.md) | Editor shell, top bar, inspector router and component slots | P0 | 20 | `src/app/editor/page.tsx`, `src/editor/TopBar.tsx`, `src/editor/Inspector.tsx`, `src/editor/controls/Segmented.tsx`, `src/editor/controls/Switch.tsx`, `src/editor/BlockList.tsx`, `src/editor/PreviewStage.tsx`, `src/editor/UndoRedo.tsx`, `src/editor/ExportButton.tsx`, `src/editor/panels/BackgroundPanel.tsx`, `src/editor/panels/TextPanel.tsx`, `src/editor/panels/ImagePanel.tsx`, `src/editor/panels/FieldsPanel.tsx`, `src/editor/panels/TermsPanel.tsx`, `src/editor/panels/ButtonPanel.tsx`, `src/editor/editor.test.tsx` |
| [T-010](T-010-colour-field-and-slider.md) | ColourField and Slider controls | P0 | 15 | `src/editor/controls/ColourField.tsx`, `src/editor/controls/Slider.tsx`, `src/editor/controls/ColourField.test.tsx`, `src/editor/controls/Slider.test.tsx`, `src/app/globals.css` |
| [T-023](T-023-export-html-builder.md) | Export HTML builder | P0 | 25 | `src/lib/export.ts`, `src/lib/export.test.ts` |
| [T-018](T-018-photo-hero-and-minimal-templates.md) | Photo hero and Minimal templates | P1 | 10 | `src/lib/templates.ts`, `src/lib/templates.test.ts`, `public/templates/photo-hero.jpg`, `public/templates/minimal.jpg` |

### Wave 5 (20 min)

| ID | Title | Priority | Estimate | Touches |
|---|---|---|---|---|
| [T-009](T-009-preview-stage.md) | Preview stage with phone and browser frames | P0 | 20 | `src/editor/PreviewStage.tsx`, `src/editor/frames/PhoneFrame.tsx`, `src/editor/frames/BrowserFrame.tsx`, `src/editor/ScreenSwitcher.tsx`, `src/editor/checks/ReadabilityCheck.tsx`, `src/editor/checks/useFitCheck.tsx` |
| [T-016](T-016-background-panel.md) | Background panel: colour, gradient and photo upload | P0 | 15 | `src/editor/panels/BackgroundPanel.tsx`, `src/editor/panels/PhotoAdjustments.tsx`, `src/editor/panels/UnsplashSearch.tsx` |
| [T-012](T-012-block-list.md) | Block list with three zones, add, reorder and the Terms switch | P0 | 20 | `src/editor/BlockList.tsx` |
| [T-014](T-014-image-panel.md) | Image panel | P0 | 10 | `src/editor/panels/ImagePanel.tsx` |

### Wave 6 (20 min)

| ID | Title | Priority | Estimate | Touches |
|---|---|---|---|---|
| [T-013](T-013-text-panel.md) | Text panel | P0 | 15 | `src/editor/panels/TextPanel.tsx` |
| [T-015](T-015-fields-and-button-panels.md) | Fields and Connect button panels | P0 | 15 | `src/editor/panels/FieldsPanel.tsx`, `src/editor/panels/ButtonPanel.tsx` |
| [T-024](T-024-export-button.md) | Export HTML button and size toast | P0 | 10 | `src/editor/ExportButton.tsx` |
| [T-017](T-017-photo-adjustments.md) | Photo fit, zoom, focus presets and darken overlay | P1 | 20 | `src/editor/panels/PhotoAdjustments.tsx`, `src/editor/panels/FocusGrid.tsx` |

### Wave 7 (20 min)

| ID | Title | Priority | Estimate | Touches |
|---|---|---|---|---|
| [T-027](T-027-readability-check.md) | Readability check under the preview | P1 | 15 | `src/lib/readability.ts`, `src/lib/readability.test.ts`, `src/editor/checks/ReadabilityCheck.tsx` |
| [T-019](T-019-template-picker.md) | Template picker with live thumbnails and Continue your design | P1 | 15 | `src/app/page.tsx`, `src/editor/TemplateCard.tsx` |
| [T-020](T-020-terms-panel.md) | Terms panel | P1 | 15 | `src/editor/panels/TermsPanel.tsx` |
| [T-025](T-025-undo-redo.md) | Undo and redo with shortcuts | P1 | 20 | `src/lib/store.ts`, `src/lib/store.undo.test.ts`, `src/editor/UndoRedo.tsx` |

### Wave 8 (25 min)

| ID | Title | Priority | Estimate | Touches |
|---|---|---|---|---|
| [T-022](T-022-error-and-connected-screens.md) | Error and Connected guest screens | P1 | 20 | `src/splash/Form.tsx`, `src/splash/validate.ts`, `src/splash/validate.test.ts`, `src/splash/Connected.tsx`, `src/editor/ScreenSwitcher.tsx` |
| [T-026](T-026-logo-palette.md) | Logo palette extraction | P1 | 10 | `src/lib/palette.ts`, `src/lib/palette.test.ts` |
| [T-028](T-028-fit-check.md) | Small-phone fit check | P1 | 10 | `src/lib/fit.ts`, `src/lib/fit.test.ts`, `src/editor/checks/useFitCheck.tsx` |
| [T-031](T-031-unsplash-api-route.md) | Unsplash search and download-ping API route | P2 | 25 | `src/app/api/unsplash/route.ts`, `src/app/api/unsplash/route.test.ts`, `vite.config.ts`, `cloudflare.config.ts` |

### Wave 9 (15 min)

| ID | Title | Priority | Estimate | Touches |
|---|---|---|---|---|
| [T-033](T-033-focus-point-drag.md) | Focus-point drag dot | P2 | 10 | `src/editor/panels/FocusGrid.tsx` |
| [T-035](T-035-one-tap-contrast-fix.md) | One-tap contrast Fix | P2 | 10 | `src/editor/checks/ReadabilityCheck.tsx` |
| [T-032](T-032-unsplash-search-ui.md) | Unsplash search in the Photo tab | P2 | 15 | `src/editor/panels/UnsplashSearch.tsx` |
| [T-034](T-034-dnd-kit-reorder.md) | Drag to reorder blocks with dnd-kit | P2 | 15 | `src/editor/BlockList.tsx` |

### Wave 10 (10 min)

`T-029` needs a real phone, so the user and the main session run it, not a worktree agent. It writes `.project/review/phone-checklist.md`.

| ID | Title | Priority | Estimate | Touches |
|---|---|---|---|---|
| [T-029](T-029-real-phone-checklist.md) | Real-phone testing checklist | P1 | 10 | `.project/review/phone-checklist.md` |

### Wave 11 (10 min)

`T-030` ends with a manual check that the production URL loads on mobile data.

| ID | Title | Priority | Estimate | Touches |
|---|---|---|---|---|
| [T-030](T-030-readme-and-final-deploy.md) | README and final deploy | P1 | 10 | `README.md` |

## Cut

None. Nothing was asked to be cut, and the stretch tickets are scheduled at P2 ([`general-stretch-tickets-scheduled.md`](../decisions/general-stretch-tickets-scheduled.md)).

## Problems

None. Every dependency exists, there are no cycles, every `todo` ticket has `touches` and an `estimate`, and every file shared by two tickets is ordered by a dependency path.

## Tickets in run order

| Wave | ID | Title | Priority | Milestone | Estimate | depends_on | Status |
|---|---|---|---|---|---|---|---|
| 1 | [T-001](T-001-scaffold.md) | Scaffold the Next.js app on vinext, with dependencies, Vitest, the deploy workflow and schema tests | P0 | 1 | 30 | — | done |
| 2 | [T-002](T-002-blank-and-sponsor-templates.md) | Blank and Sponsor templates | P0 | 1 | 10 | T-001 | done |
| 2 | [T-005](T-005-splashpage-skeleton.md) | SplashPage skeleton with text and image blocks | P0 | 2 | 15 | T-001 | done |
| 2 | [T-011](T-011-image-upload-pipeline.md) | Image upload pipeline and ImageUpload control | P0 | 3 | 20 | T-001 | done |
| 2 | [T-003](T-003-contrast-helpers.md) | Contrast helpers | P1 | 1 | 10 | T-001 | done |
| 3 | [T-004](T-004-store-and-persistence.md) | Store with every action, and localStorage persistence | P0 | 1 | 30 | T-002 | done |
| 3 | [T-007](T-007-form-renderer.md) | Form renderer: fields, terms row, Connect and render modes | P0 | 2 | 15 | T-005 | done |
| 3 | [T-006](T-006-background-renderer.md) | Background renderer: colour, gradient and photo | P0 | 2 | 10 | T-005 | done |
| 3 | [T-021](T-021-terms-sheet.md) | Terms sheet for the preview and the no-JS export | P1 | 6 | 15 | T-003, T-005 | done |
| 4 | [T-008](T-008-editor-shell.md) | Editor shell, top bar, inspector router and component slots | P0 | 2 | 20 | T-004 | done |
| 4 | [T-010](T-010-colour-field-and-slider.md) | ColourField and Slider controls | P0 | 3 | 15 | T-004 | done |
| 4 | [T-023](T-023-export-html-builder.md) | Export HTML builder | P0 | 7 | 25 | T-006, T-007, T-011, T-021 | done |
| 4 | [T-018](T-018-photo-hero-and-minimal-templates.md) | Photo hero and Minimal templates | P1 | 5 | 10 | T-002 | done |
| 5 | [T-009](T-009-preview-stage.md) | Preview stage with phone and browser frames | P0 | 2 | 20 | T-005, T-008 | done |
| 5 | [T-016](T-016-background-panel.md) | Background panel: colour, gradient and photo upload | P0 | 4 | 15 | T-008, T-010, T-011 | done |
| 5 | [T-012](T-012-block-list.md) | Block list with three zones, add, reorder and the Terms switch | P0 | 3 | 20 | T-003, T-008, T-011 | done |
| 5 | [T-014](T-014-image-panel.md) | Image panel | P0 | 3 | 10 | T-008, T-011 | done |
| 6 | [T-013](T-013-text-panel.md) | Text panel | P0 | 3 | 15 | T-003, T-008, T-010 | done |
| 6 | [T-015](T-015-fields-and-button-panels.md) | Fields and Connect button panels | P0 | 3 | 15 | T-008, T-010 | done |
| 6 | [T-024](T-024-export-button.md) | Export HTML button and size toast | P0 | 7 | 10 | T-008, T-023 | done |
| 6 | [T-017](T-017-photo-adjustments.md) | Photo fit, zoom, focus presets and darken overlay | P1 | 4 | 20 | T-016 | done |
| 7 | [T-027](T-027-readability-check.md) | Readability check under the preview | P1 | 8 | 15 | T-003, T-009 | done |
| 7 | [T-019](T-019-template-picker.md) | Template picker with live thumbnails and Continue your design | P1 | 5 | 15 | T-004, T-006, T-007, T-018 | todo |
| 7 | [T-020](T-020-terms-panel.md) | Terms panel | P1 | 6 | 15 | T-003, T-008, T-010 | todo |
| 7 | [T-025](T-025-undo-redo.md) | Undo and redo with shortcuts | P1 | 8 | 20 | T-004, T-008 | todo |
| 8 | [T-022](T-022-error-and-connected-screens.md) | Error and Connected guest screens | P1 | 6 | 20 | T-003, T-007, T-009 | todo |
| 8 | [T-026](T-026-logo-palette.md) | Logo palette extraction | P1 | 8 | 10 | T-011 | todo |
| 8 | [T-028](T-028-fit-check.md) | Small-phone fit check | P1 | 8 | 10 | T-005, T-009 | todo |
| 8 | [T-031](T-031-unsplash-api-route.md) | Unsplash search and download-ping API route | P2 | 8 | 25 | T-001 | todo |
| 9 | [T-033](T-033-focus-point-drag.md) | Focus-point drag dot | P2 | 4 | 10 | T-017 | todo |
| 9 | [T-035](T-035-one-tap-contrast-fix.md) | One-tap contrast Fix | P2 | 8 | 10 | T-027 | todo |
| 9 | [T-032](T-032-unsplash-search-ui.md) | Unsplash search in the Photo tab | P2 | 8 | 15 | T-016, T-031 | todo |
| 9 | [T-034](T-034-dnd-kit-reorder.md) | Drag to reorder blocks with dnd-kit | P2 | 8 | 15 | T-012 | todo |
| 10 | [T-029](T-029-real-phone-checklist.md) | Real-phone testing checklist | P1 | 9 | 10 | T-012, T-013, T-014, T-015, T-017, T-019, T-020, T-024, T-025, T-027 | todo |
| 11 | [T-030](T-030-readme-and-final-deploy.md) | README and final deploy | P1 | 9 | 10 | T-029 | todo |
