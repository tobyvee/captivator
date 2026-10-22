---
title: "T-022: Error and Connected guest screens"
type: ticket
project: captivator
status: done
priority: P1
milestone: 6
estimate: 20
depends_on: [T-003, T-007, T-009]
touches:
  - src/splash/Form.tsx
  - src/splash/validate.ts
  - src/splash/validate.test.ts
  - src/splash/Connected.tsx
  - src/editor/ScreenSwitcher.tsx
  - src/splash/Form.error.test.tsx
  - src/splash/Connected.test.tsx
  - src/editor/ScreenSwitcher.test.tsx
  - src/editor/PreviewStage.test.tsx
  - src/lib/screens.ts
  - src/lib/screens.test.ts
  - src/splash/layout.ts
  - src/lib/contrast.ts
  - src/lib/contrast.test.ts
  - src/lib/store.ts
  - src/splash/SplashPage.tsx
  - src/splash/TermsSheet.tsx
  - src/editor/panels/BackgroundPanel.tsx
cut_rank: 3
updated: 2026-10-23
tags: [project, captivator, ticket, splash]
---
# T-022: Error and Connected guest screens

## Context
Build step 6, "Error and Connected" plus the rest of the screen switcher ([spec → Splash renderer → Guest screens](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md), *Render mode* → Connect in edit). This is cut order item 3 ("the screen switcher down to Landing and Terms"). If it's cut, the Landing/Terms switcher from T-009 stays and edit-mode Connect just selects the button. Canvas artboards: `StateError`, `StateConnected`, and `Main` (switcher). Decisions: [`T-022-edit-connect-selects-then-validates.md`](../decisions/T-022-edit-connect-selects-then-validates.md), [`T-022-error-copy-follows-spec.md`](../decisions/T-022-error-copy-follows-spec.md), [`general-guest-screen-fallbacks.md`](../decisions/general-guest-screen-fallbacks.md), [`T-009-landing-terms-switcher-in-step-2.md`](../decisions/T-009-landing-terms-switcher-in-step-2.md).

## Scope
- **`src/splash/validate.ts`** (pure):
  - `canFail(form: FormSpec): boolean`: `fields.length > 0 || terms.mode === "checkbox"`.
  - `ERROR_COPY = { name: "Enter your name", email: "Enter a valid email", phone: "Enter a valid phone number", terms: "Please accept the terms" }`.
  - `EXAMPLE_INVALID = { name: "", email: "sam@", phone: "12" }`.
  - `validateGuest(fields, values: Partial<Record<FieldKindSpec, string>>, termsOn: boolean, termsChecked: boolean): { ok: boolean; field?: FieldKindSpec; terms?: boolean }`:
    - Name: non-empty after trim.
    - Email: `^[^\s@]+@[^\s@]+\.[^\s@]+$`.
    - Phone: at least 6 digits; `+`, spaces, `-` and `()` are allowed.
    - Terms: must be ticked when on.
- **`Form.tsx`** (extend T-007; keep its export markup unchanged, except for one attribute: give the export terms link `id={TERMS_LINK_ID}` from `TermsSheet.tsx`, so closing the sheet returns the guest and focus to the link. See [`T-021-close-to-terms-link.md`](../decisions/T-021-close-to-terms-link.md), and add a test that the export link has `id="cv-terms-link"`):
  - **`screen === "error"`:** the first field gets `defaultValue={EXAMPLE_INVALID[kind]}`, `aria-invalid="true"`, `aria-describedby` to its message, and a 2px border in the error colour. Its message (icon + `ERROR_COPY`, 14px/500) sits below it. With terms on, the checkbox gets an outline in the error colour, plus "Please accept the terms" (`role="alert"`). The error colour is `bestErrorColour(backgroundColours(design.background))`.
  - **Edit-mode Connect:** still calls `onSelect({ kind: "button" })`, then reads the preview form's values (`FormData` from `event.currentTarget.form`), runs `validateGuest`, and calls `onScreenChange(ok ? "connected" : "error")`.
- **`Connected.tsx`** (replace the T-005 stub):
  - A column in the T-005 layout: the logo (first image block) at the top; a spacer; a 72px tick badge (circle in the first heading's colour, or `bestTextColour(bg)`; the tick uses the background's main colour, the same rule as the Terms sheet: `colour`, gradient `from` or photo `backdrop`); h1 "You're online" (`role="status"`, 40px/800, same colour); a spacer.
  - If there's a second image block (the sponsor): "Thanks to our sponsor" and that image.
  - A CONTINUE button styled like Connect (`connectButtonStyle` from `Form.tsx`) → `onContinue` (edit/preview). Keep at least 28px of bottom padding below it, so the photo credit SplashPage draws at the bottom right (T-006) never overlaps it.
  - In edit and preview, the column wrapper has `pointerEvents: "none"` and CONTINUE has `pointerEvents: "auto"`, so a click on empty space reaches the root and selects the background ([`T-022-connected-clicks-fall-through.md`](../decisions/T-022-connected-clicks-fall-through.md)); test it.
- **`ScreenSwitcher.tsx`** (extend T-009): add "Error" (only when `canFail(form)`) and "Connected".
- **Out of scope:** the terms sheet (T-021); export markup (T-007/T-023; this ticket must not change export output).

## Acceptance criteria
- [x] `canFail` is false with no fields and terms off; the switcher then hides Error (test `canFail`; check the switcher by eye). *Tested in `screens.test.ts` and `ScreenSwitcher.test.tsx`; the milestone review checked the switcher against the `EditorTerms` artboard. Seeing it in a browser is on T-029.*
- [x] `validateGuest`: `sam@` is invalid and `sam@example.com` valid; empty name is invalid; `12` is invalid and `+61 400 000 000` valid; unticked terms are invalid when on (tests).
- [x] The Error screen matches `StateError`'s layout with the spec's copy; the error colour is light red on dark backgrounds and dark red on light ones. *Checked against the artboard by the milestone review. Where neither red reaches 4.5:1, the message text uses the page's readable colour and the red stays on the marks ([`T-022-error-text-contrast-floor.md`](../decisions/T-022-error-text-contrast-floor.md)).*
- [x] The Connected screen matches `StateConnected`, showing the sponsor only when a second image exists.
- [x] In edit mode, Connect with empty inputs shows Error; with valid inputs (and terms ticked) it shows Connected; CONTINUE returns to Landing.
- [x] `Form.test.tsx` from T-007 still passes unchanged (export markup unaffected).
- [x] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-003: `bestErrorColour`, `backgroundColours`, `bestTextColour`.
- T-007: `Form.tsx` and its tests, which this ticket extends.
- T-009: `ScreenSwitcher.tsx`, which this ticket extends. `Connected.tsx`'s stub comes from T-005, via T-007.

## Outcome
- **Built:** `validate.ts` (`validateGuest`, `ERROR_COPY`, `EXAMPLE_INVALID`) and `screens.ts` (`canFail`, shared by the store and the switcher). The Error screen flags what failed in the spec's copy, with a red mark picked for the page and message text kept at 4.5:1; only the first message is an alert. In the editor, Connect selects the button, checks the preview's own inputs and shows Error or Connected. The Connected screen shows the logo, a tick badge, "You're online" (a heading inside a status region), the sponsor when a second image exists, and CONTINUE back to Landing. The switcher offers Landing, Terms, Error and Connected. Export markup is unchanged apart from the terms link's `id`. 733 tests pass; `tsc` and lint are clean.
- **Review:** one must-fix (a stale failure could leave Error with nothing flagged) and should-fixes on copied helpers and the Connected heading, fixed by nextjs-specialist in `7e553c1`, `a7a837f` and `0730565`; the main session added `c39ee59` (sponsor line at 4.5:1, BackgroundPanel on the shared colour helper) and `f2685fb` (superseding decisions, and a test pinning that the example can't replace a typed value). Re-reviewed and approved.
- **Splash audit:** two failures (the heading role, the error colour's missing 4.5:1 floor) and three warnings, fixed and re-audited clean. The exported page is byte-identical for every template and variant, and all are under 100 KB.
- **Security:** audited (src/splash is a trust boundary). No findings.
- **Commit history:** the agent's commit and the main session's test update were squashed before pushing, so no commit on main fails its tests (`d0fb422`).
- **Milestone 6:** closed by the milestone review.

## Notes
- **Left open from the splash re-audit (logged trade-off):** on a two-stop gradient whose ends need opposite text colours (e.g. `#777777`→`#2563EB`), no colour reaches 4.5:1 on both, so error messages, the terms message and the sponsor line can fall short. A readability warning for such gradients would need its own decision. The red marks can also fall under 3:1 on some mid-tones; the readable message text and `aria-invalid` still identify the error.
- **For the production portal:** CONTINUE is a `type="button"` with no handler in export mode, so the portal needs a link or form behind it; consider `autoFocus` on the first `aria-invalid` input for a server-rendered Error page.
- **From T-020:** `TERMS_TEXT` (`{ size: 14, weight: 400 }`) is exported from `src/lib/readability.ts`; `Form.tsx`'s terms row could use it so the editor's checks and the guest row can't drift ([`T-020-panels-share-rate-text.md`](../decisions/T-020-panels-share-rate-text.md)). Optional.
- **Export guard:** `src/lib/export.ts` checks exported markup against an allowlist of elements, attributes and values ([`T-023-export-guard-allowlist.md`](../decisions/T-023-export-guard-allowlist.md)). `id` is already allowed, so the terms-link id needs no change. If the export markup gains any other element or attribute, the export fails until the allowlist is extended with a decision. Run the export tests.
- The canvas's error copy ("Enter a full email address", "Please accept the terms to connect") differs from the spec; use the spec's (decision).
- The canvas's "Enjoy the event." line isn't generated from the design, so leave it out.

## Decisions
- [`T-022-connected-clicks-fall-through.md`](../decisions/T-022-connected-clicks-fall-through.md): The Connected screen's column lets clicks on empty space fall through to the root
- [`T-005-splashpage-skeleton-creates-stubs.md`](../decisions/T-005-splashpage-skeleton-creates-stubs.md): The SplashPage skeleton owns composition and creates every child component as a stub
- [`T-007-form-renders-terms-row-in-step-2.md`](../decisions/T-007-form-renders-terms-row-in-step-2.md): The Form renders the terms row from build step 2; the error state comes with the guest screens
- [`T-009-landing-terms-switcher-in-step-2.md`](../decisions/T-009-landing-terms-switcher-in-step-2.md): PreviewStage ships a Landing/Terms switcher; Error and Connected are added by the cuttable guest-screens ticket
- [`T-022-edit-connect-selects-then-validates.md`](../decisions/T-022-edit-connect-selects-then-validates.md): In edit mode, Connect selects the button and, once the guest screens exist, also validates and shows Error or Connected
- [`T-022-error-copy-follows-spec.md`](../decisions/T-022-error-copy-follows-spec.md): Guest error messages use the spec's wording, not the canvas's
- [`general-guest-screen-fallbacks.md`](../decisions/general-guest-screen-fallbacks.md): Sponsor, Terms sheet and Error screen behaviour is defined from existing schema fields
- [`general-new-modules-beyond-project-structure.md`](../decisions/general-new-modules-beyond-project-structure.md): Planning adds small modules to the spec's project structure so each ticket owns its own files
- [`general-splashpage-callback-props.md`](../decisions/general-splashpage-callback-props.md): SplashPage takes selection, onSelect and onScreenChange props
- [`T-022-alert-on-first-error-only.md`](../decisions/T-022-alert-on-first-error-only.md): Only the first error message shown, field before terms, has role="alert"
- [`T-022-canfail-in-lib-screens.md`](../decisions/T-022-canfail-in-lib-screens.md): canFail moves to src/lib/screens.ts so the store and the screen switcher share one rule
- [`T-022-connected-heading-fallback.md`](../decisions/T-022-connected-heading-fallback.md): The Connected heading and badge use the first heading's colour only when it reaches 3:1 on the page, otherwise bestTextColour
- [`T-022-connected-status-wrapper.md`](../decisions/T-022-connected-status-wrapper.md): The Connected screen's live region is a div with role="status" around the h1, not role="status" on the h1
- [`T-022-connected-text-colours-and-copy.md`](../decisions/T-022-connected-text-colours-and-copy.md): The Connected screen's sponsor line uses bestTextColour on the page, its heading stays in sentence case, and CONTINUE has no extra margin
- [`T-022-editor-error-slots.md`](../decisions/T-022-editor-error-slots.md): In edit and preview, each field and the terms row sit in a column wrapper so an error message never remounts the input
- [`T-022-error-screen-shows-real-failure.md`](../decisions/T-022-error-screen-shows-real-failure.md): After a failed edit-mode Connect, the Error screen flags the field and terms that actually failed; the switcher's Error shows the spec's example
- [`T-022-example-fallback-keeps-typed-value.md`](../decisions/T-022-example-fallback-keeps-typed-value.md): When the Error screen falls back to the example, a value the customer typed stays in the field
- [`T-022-preview-stage-switcher-tests-updated.md`](../decisions/T-022-preview-stage-switcher-tests-updated.md): The main session updates PreviewStage.test.tsx's switcher cases on T-022's branch before merging
- [`T-022-shared-main-colour-and-column.md`](../decisions/T-022-shared-main-colour-and-column.md): The background's main colour and the guest column are shared helpers, mainBackgroundColour in lib/contrast and COLUMN in splash/layout
- [`T-022-sponsor-line-readable-colour.md`](../decisions/T-022-sponsor-line-readable-colour.md): Connected's sponsor line uses readableTextColour; the shared main colour and column rules stand, and BackgroundPanel now shares the helper
- [`T-022-stale-failure-falls-back-to-example.md`](../decisions/T-022-stale-failure-falls-back-to-example.md): A failure the form can no longer show falls back to the example, and Connect pressed on the example keeps its value
- [`T-022-test-files-added.md`](../decisions/T-022-test-files-added.md): T-022 adds Form.error.test.tsx, Connected.test.tsx and ScreenSwitcher.test.tsx beside the files it owns
