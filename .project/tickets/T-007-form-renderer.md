---
title: "T-007: Form renderer: fields, terms row, Connect and render modes"
type: ticket
project: captivator
status: done
priority: P0
milestone: 2
estimate: 15
depends_on: [T-005]
touches:
  - src/splash/Form.tsx
  - src/splash/Form.test.tsx
cut_rank:
updated: 2026-10-23
tags: [project, captivator, ticket, splash, security]
---
# T-007: Form renderer: fields, terms row, Connect and render modes

## Context
Build step 2 ([spec → Splash renderer → Form](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md), *Render mode*, *Export HTML* steps 4–6, *Unit tests* → `SplashPage`). This replaces the stub from T-005. It includes the terms row now, because Sponsor has terms on and export needs it. The error state and edit-mode validation come in T-022, which is cuttable. Canvas artboard: `StateLanding`. Decisions: [`T-007-form-renders-terms-row-in-step-2.md`](../decisions/T-007-form-renders-terms-row-in-step-2.md), [`T-007-outline-button-colours.md`](../decisions/T-007-outline-button-colours.md), [`T-022-edit-connect-selects-then-validates.md`](../decisions/T-022-edit-connect-selects-then-validates.md), [`general-export-form-action.md`](../decisions/general-export-form-action.md), [`general-splashpage-render-mode.md`](../decisions/general-splashpage-render-mode.md).

## Scope
- `Form({ design, mode, screen, onSelect, onScreenChange })` renders a `<form>` with the fields, the terms row (when `terms.mode === "checkbox"`) and Connect. Mode differences are in Notes. Accept `screen` but ignore `"error"` for now (T-022).
- `Form.test.tsx` (`// @vitest-environment jsdom`; the second and last jsdom file).
- **Out of scope:** error messages and invalid styling (T-022); edit-mode validation and screen switching on Connect (T-022); the terms sheet (T-021); the two-hop HTML comment (export.ts inserts it, T-023).

## Acceptance criteria
- [x] Each field renders `type`, `autocomplete` and `inputmode` from `FIELD_SPEC` (test all three kinds).
- [x] The terms row is absent when `terms.mode` is `"off"` (test).
- [x] The checkbox is never pre-checked in any mode: no `checked` or `defaultChecked` (test).
- [x] `edit` and `preview` render no `required`, no form `action` and no `method` (test).
- [x] `export` renders `required` on every input and the terms checkbox, `method="post"`, and `<a href="#terms">` as the terms link (test).
- [x] **Security:** `export` with fields posts to `action="[PORTAL_SUBMIT_URL]"` and has no `command` input; with no fields it posts to `action="[ROUTER_FORM_ACTION]"` with `<input type="hidden" name="command" value="login">`. The action is always one of those two literals, never design data (tests). Label, link and button text render as text.
- [x] `edit`: the terms link is a `<button type="button">` that calls `onSelect({ kind: "terms" })`, and Connect calls `onSelect({ kind: "button" })` (test). `preview`: the terms link is a `<button>` that calls `onScreenChange("terms")`.
- [x] Inputs are 16px text and 48px tall; the terms row and Connect are at least 44px tall.
- [x] `npm test` and `npx tsc --noEmit` pass.

## Dependencies
- T-005: the `Form` stub's props and the column it sits in.

## Notes
- **Layout:** the `<form>` is one column child: `width: 100%; display: flex; flex-direction: column; align-items: center; gap: 12px; margin: 0`.
- **Fields group:** `width: 100%; display: flex; flex-direction: column; gap: 10px`. Edit mode: clicking the group calls `onSelect({ kind: "fields" })`; inputs stay focusable so the customer can type a test value.
- **Input:** `name={kind}`, `type`/`autoComplete`/`inputMode`/`placeholder` from `FIELD_SPEC[kind]`, `aria-label={placeholder}`. Style: `box-sizing: border-box; width: 100%; height: 48px; padding: 0 14px; border: 0; border-radius: 10px; background: {inputBg}; color: {inputText}; font: inherit; font-size: 16px`.
- **Terms row:**
  - A `<label>` with `width: 100%; min-height: 44px; display: flex; align-items: center; gap: 10px; font-size: 14px; text-align: left; color: {terms.textColour}`.
  - It wraps `<input type="checkbox" name="accept_terms" value={terms.version}>` (20×20, `margin: 0`, `flex-shrink: 0`, `accent-color: {button.bg}`) and `<span>{label} {link}</span>`.
  - The link is styled `color: inherit; font: inherit; font-weight: 600; text-decoration: underline; background: none; border: 0; padding: 0; cursor: pointer`.
  - Edit mode: clicking the row also calls `onSelect({ kind: "terms" })`.
- **Connect:** `<button type={mode === "export" ? "submit" : "button"}>` with `width: 66%; min-height: 50px; border-radius: 10px; font: inherit; font-size: 16px; font-weight: 700; letter-spacing: 0.06em; cursor: pointer`.
  - Solid: `background: {bg}; color: {fg}; border: 0`.
  - Outline (decision): `background: transparent; border: 2px solid {bg}; color: {fg}`.
  - Preview: no handler.
- In edit and preview, the `<form>` has `onSubmit={e => e.preventDefault()}`.
- Error copy, `canFail` and validation live in `src/splash/validate.ts` (T-022); don't create that file here.

**Outcome (2026-10-23):**
- **Security audit:** no findings.
- **Code review:** approved with two should-fixes, both fixed in `e0674d6`:
  - In edit mode, a click on the form's own empty area selects the background (`T-005-background-select-on-own-target.md`).
  - The Connect style is exported as `connectButtonStyle(button)`, for T-021's CLOSE and T-022's CONTINUE.
  - Two redundant tests are removed, and `termsLink` is now one `const`.
- **Splash audit:** two failures and one risk:
  - *Terms link tap area:* it was about 17px tall. It's now padded to the row's 44px in every mode ([`T-007-terms-link-tap-padding.md`](../decisions/T-007-terms-link-tap-padding.md)), fixed in `e0674d6`.
  - *Placeholder contrast on iOS:* the default placeholder colour, the only visible field label, fails 4.5:1. A rule in the export's `<style>` block fixes it, owned by T-023 ([`general-export-placeholder-colour.md`](../decisions/general-export-placeholder-colour.md)).
  - *Inputs that blend into the page* (e.g. Blank with a field): T-027's readability check now also warns at 3:1 ([`T-027-input-edge-contrast.md`](../decisions/T-027-input-edge-contrast.md)).
  - Its iOS login-sheet checks are added to T-029.
- **Not fixed:** in edit and preview, the terms link is a `<button>` inside the `<label>`, which the HTML content model disallows. It works in browsers, and the export uses an `<a>`.

## Decisions
- [`T-007-edit-terms-row-click-handling.md`](../decisions/T-007-edit-terms-row-click-handling.md): In edit mode the terms row selects Terms once on any click except on the checkbox, which only toggles
- [`T-007-terms-link-tap-padding.md`](../decisions/T-007-terms-link-tap-padding.md): The terms link gets 14px of vertical padding so its tap area reaches the 44px row
- [`general-export-placeholder-colour.md`](../decisions/general-export-placeholder-colour.md): The export's style block sets the placeholder colour, since placeholders are the visible field labels
- [`T-027-input-edge-contrast.md`](../decisions/T-027-input-edge-contrast.md): The readability check also warns when the inputs blend into the page (3:1)
- [`T-005-splashpage-skeleton-creates-stubs.md`](../decisions/T-005-splashpage-skeleton-creates-stubs.md): The SplashPage skeleton owns composition and creates every child component as a stub
- [`T-007-form-renders-terms-row-in-step-2.md`](../decisions/T-007-form-renders-terms-row-in-step-2.md): The Form renders the terms row from build step 2; the error state comes with the guest screens
- [`T-007-outline-button-colours.md`](../decisions/T-007-outline-button-colours.md): An outline Connect button uses bg as its border and fg as its text
- [`T-022-edit-connect-selects-then-validates.md`](../decisions/T-022-edit-connect-selects-then-validates.md): In edit mode, Connect selects the button and, once the guest screens exist, also validates and shows Error or Connected
- [`general-export-form-action.md`](../decisions/general-export-form-action.md): An export with guest fields posts to a portal-service placeholder, not the router
- [`general-splashpage-callback-props.md`](../decisions/general-splashpage-callback-props.md): SplashPage takes selection, onSelect and onScreenChange props
- [`general-splashpage-render-mode.md`](../decisions/general-splashpage-render-mode.md): SplashPage takes a render mode of edit, preview or export
