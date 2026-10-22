---
title: "T-022: Error and Connected guest screens"
type: ticket
project: captivator
status: todo
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
cut_rank: 3
updated: 2026-10-22
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
- **`Form.tsx`** (extend T-007; keep its export markup unchanged):
  - **`screen === "error"`:** the first field gets `defaultValue={EXAMPLE_INVALID[kind]}`, `aria-invalid="true"`, `aria-describedby` to its message, and a 2px border in the error colour. Its message (icon + `ERROR_COPY`, 14px/500) sits below it. With terms on, the checkbox gets an outline in the error colour, plus "Please accept the terms" (`role="alert"`). The error colour is `bestErrorColour(backgroundColours(design.background))`.
  - **Edit-mode Connect:** still calls `onSelect({ kind: "button" })`, then reads the preview form's values (`FormData` from `event.currentTarget.form`), runs `validateGuest`, and calls `onScreenChange(ok ? "connected" : "error")`.
- **`Connected.tsx`** (replace the T-005 stub):
  - A column in the T-005 layout: the logo (first image block) at the top; a spacer; a 72px tick badge (circle in the first heading's colour, or `bestTextColour(bg)`; the tick uses the background's main colour, the same rule as the Terms sheet: `colour`, gradient `from` or photo `backdrop`); h1 "You're online" (`role="status"`, 40px/800, same colour); a spacer.
  - If there's a second image block (the sponsor): "Thanks to our sponsor" and that image.
  - A CONTINUE button styled like Connect → `onContinue` (edit/preview).
- **`ScreenSwitcher.tsx`** (extend T-009): add "Error" (only when `canFail(form)`) and "Connected".
- **Out of scope:** the terms sheet (T-021); export markup (T-007/T-023; this ticket must not change export output).

## Acceptance criteria
- [ ] `canFail` is false with no fields and terms off; the switcher then hides Error (test `canFail`; check the switcher by eye).
- [ ] `validateGuest`: `sam@` is invalid and `sam@example.com` valid; empty name is invalid; `12` is invalid and `+61 400 000 000` valid; unticked terms are invalid when on (tests).
- [ ] The Error screen matches `StateError`'s layout with the spec's copy; the error colour is light red on dark backgrounds and dark red on light ones.
- [ ] The Connected screen matches `StateConnected`, showing the sponsor only when a second image exists.
- [ ] In edit mode, Connect with empty inputs shows Error; with valid inputs (and terms ticked) it shows Connected; CONTINUE returns to Landing.
- [ ] `Form.test.tsx` from T-007 still passes unchanged (export markup unaffected).
- [ ] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-003: `bestErrorColour`, `backgroundColours`, `bestTextColour`.
- T-007: `Form.tsx` and its tests, which this ticket extends.
- T-009: `ScreenSwitcher.tsx`, which this ticket extends. `Connected.tsx`'s stub comes from T-005, via T-007.

## Notes
- The canvas's error copy ("Enter a full email address", "Please accept the terms to connect") differs from the spec; use the spec's (decision).
- The canvas's "Enjoy the event." line isn't generated from the design, so leave it out.

## Decisions
- [`T-005-splashpage-skeleton-creates-stubs.md`](../decisions/T-005-splashpage-skeleton-creates-stubs.md): The SplashPage skeleton owns composition and creates every child component as a stub
- [`T-007-form-renders-terms-row-in-step-2.md`](../decisions/T-007-form-renders-terms-row-in-step-2.md): The Form renders the terms row from build step 2; the error state comes with the guest screens
- [`T-009-landing-terms-switcher-in-step-2.md`](../decisions/T-009-landing-terms-switcher-in-step-2.md): PreviewStage ships a Landing/Terms switcher; Error and Connected are added by the cuttable guest-screens ticket
- [`T-022-edit-connect-selects-then-validates.md`](../decisions/T-022-edit-connect-selects-then-validates.md): In edit mode, Connect selects the button and, once the guest screens exist, also validates and shows Error or Connected
- [`T-022-error-copy-follows-spec.md`](../decisions/T-022-error-copy-follows-spec.md): Guest error messages use the spec's wording, not the canvas's
- [`general-guest-screen-fallbacks.md`](../decisions/general-guest-screen-fallbacks.md): Sponsor, Terms sheet and Error screen behaviour is defined from existing schema fields
- [`general-new-modules-beyond-project-structure.md`](../decisions/general-new-modules-beyond-project-structure.md): Planning adds small modules to the spec's project structure so each ticket owns its own files
- [`general-splashpage-callback-props.md`](../decisions/general-splashpage-callback-props.md): SplashPage takes selection, onSelect and onScreenChange props
