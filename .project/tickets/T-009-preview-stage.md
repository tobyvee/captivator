---
title: "T-009: Preview stage with phone and browser frames"
type: ticket
project: captivator
status: done
priority: P0
milestone: 2
estimate: 20
depends_on: [T-005, T-008]
touches:
  - src/editor/PreviewStage.tsx
  - src/editor/frames/PhoneFrame.tsx
  - src/editor/frames/BrowserFrame.tsx
  - src/editor/ScreenSwitcher.tsx
  - src/editor/checks/ReadabilityCheck.tsx
  - src/editor/checks/useFitCheck.tsx
  - src/editor/PreviewStage.test.tsx
  - src/editor/controls/Segmented.tsx
cut_rank:
updated: 2026-10-23
tags: [project, captivator, ticket, editor]
---
# T-009: Preview stage with phone and browser frames

## Context
Build step 2 (PhoneFrame, BrowserFrame, live preview) and step 3's click-to-select in the preview ([spec → Editor UI → Preview stage](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md)). This replaces the `PreviewStage` stub from T-008. It also creates the stage's own slots: a Landing/Terms `ScreenSwitcher` (T-022 adds Error and Connected), and stubs for the readability line (T-027) and fit check (T-028). Canvas artboards: `Main` (phone frame, switcher, notes under the frame, small-phone fold line) and `DesktopPreview` (browser frame). Decisions: [`general-splash-root-grows-in-frame.md`](../decisions/general-splash-root-grows-in-frame.md), [`T-009-landing-terms-switcher-in-step-2.md`](../decisions/T-009-landing-terms-switcher-in-step-2.md), [`general-splashpage-callback-props.md`](../decisions/general-splashpage-callback-props.md), [`general-persistence-versioning-and-flush.md`](../decisions/general-persistence-versioning-and-flush.md).

## Scope
- **`PreviewStage.tsx`:**
  - `<ScreenSwitcher/>` above the frame.
  - `device === "mobile"` → `<PhoneFrame showFold={fit.tooTall}>`; desktop → `<BrowserFrame title={name}>`.
  - Inside the frame: `<SplashPage design screen mode="edit" inFrame selection onSelect={setSelection} onScreenChange={setScreen} />`.
  - Under the frame:
    - The device caption.
    - `<ReadabilityCheck design={design} />`.
    - The amber fit note when `fit.tooTall`.
    - "Couldn't save locally. Your changes stay in this tab only." when `saveFailed`.
    - "Couldn't restore your saved design." with a Dismiss button (`dismissRestoreFailed`) when `restoreFailed`.
  - Render `fit.probe` somewhere in the stage. Get `fit` from `useFitCheck(design)`.
- **`frames/PhoneFrame.tsx`:** `PhoneFrame({ children, showFold })`. 375×740 inner viewport, 10px `#18181B` border, 46px radius. The viewport scrolls (`overflow-x: hidden; overflow-y: auto`) because the `inFrame` root grows with its content ([`general-splash-root-grows-in-frame.md`](../decisions/general-splash-root-grows-in-frame.md)). With `showFold`, draw the dashed amber line at 600px from the top of the scrolled content (inside the scroll container, so it moves with the page) with the "Small-phone fold" chip (canvas `Main`).
- **`frames/BrowserFrame.tsx`:** `BrowserFrame({ children, title })`. A 1280×800 page (vertically scrollable, `overflow-y: auto`, for designs taller than 800px) scaled to the stage width with `transform: scale(s)`, where `s = min(1, width / 1280)` from a `ResizeObserver`. The outer box reserves `800 * s` height. Add a simple browser bar (three dots and "Sign in to {title || "Guest WiFi"}").
- **`ScreenSwitcher.tsx`:** `ScreenSwitcher()` reads the store and renders a `Segmented` labelled "Preview screen". Options: Landing, and Terms only when `terms.mode === "checkbox"`. It shows the current `screen` and calls `setScreen`.
- **`checks/ReadabilityCheck.tsx`** (stub → T-027): `export function ReadabilityCheck({ design }: { design: Design }) { return null; }`.
- **`checks/useFitCheck.tsx`** (stub → T-028): `export function useFitCheck(design: Design): { tooTall: boolean; height: number | null; probe: ReactNode } { return { tooTall: false, height: null, probe: null }; }`.
- **Out of scope:** the device toggle (T-008, TopBar); Error and Connected switcher options (T-022); readability and fit logic (T-027, T-028); the page-weight meter (not in the spec; reported as a gap).

## Acceptance criteria
- [x] The preview updates on every store change, in both Mobile and Desktop.
- [x] Clicking a block in the preview selects it (outline, name chip, inspector panel). Clicking the page background selects Background.
- [x] A design taller than the frame scrolls inside it, with the background behind all of it, in both Mobile and Desktop. *Verified by structure and review; jsdom has no layout, so T-029 checks it in a browser.*
- [x] Desktop shows the background filling the 1280-wide page with the content column at 420px, scaled to fit the stage without horizontal scroll.
- [x] The switcher shows Landing and Terms (Terms hidden when terms are off) and changes `screen`.
- [x] The save-failure and restore-failure notices appear when their flags are set (check by setting the flags in the store).
- [x] Captions: "375 × 740, iPhone login sheet" (mobile) and "1280 × 800 laptop browser. The content column stays 420 px wide; the photo fills the window." (desktop).
- [x] With terms on and a design taller than the frame, the Terms screen shows the sheet at 82% of the frame's visible height with CLOSE in view, in both Mobile and Desktop. The sheet is `position: fixed`, so each frame's non-scrolling shell must be its containing block ([`T-021-fixed-sheet-in-every-mode.md`](../decisions/T-021-fixed-sheet-in-every-mode.md)). *Verified by structure (a test pins `contain: layout` and the shell transform) and by review; T-029 checks it in a browser.*
- [x] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-005: `SplashPage` and its props (`mode`, `inFrame`, `selection`, `onSelect`, `onScreenChange`).
- T-008: the `PreviewStage` stub this replaces, `Segmented`, and the page layout it sits in.

## Notes
- **Phone frame on narrow screens (milestone 2 review):** the 395px frame is `shrink-0`, so below about 427px the editor scrolls sideways. The canvas is fixed-width too; it's polish for later.
- **T-028's probe** renders as a child of the stage's `gap-4` column, so it needs to be out of flow (e.g. `position: absolute`) or it adds a gap.
- **Fit note** (canvas): title "Too tall for small phones"; body "On a small phone like an iPhone SE, guests have to scroll to reach Connect. Shorten text, remove a block or use smaller images." Amber: `#FFFBEB` background, `#FDE68A` border, `#78350F` text.
- The canvas caption says 375 × 760, but the guest-state artboards' inner viewport and the spec are 375 × 740; use 740.
- `useFitCheck` is a `.tsx` file because T-028's probe renders JSX.
- **Preview fields reset when Terms opens:** `SplashPage` re-mounts the landing inside the inert wrapper on the Terms screen, so test values typed into the preview's fields clear (T-021 splash re-audit). Accept it, or raise a ticket for SplashPage if it bothers the customer.
- **Landmarks:** the page now wraps the stage in its own `<main>` ([`T-008-landmarks-are-siblings.md`](../decisions/T-008-landmarks-are-siblings.md)), so `PreviewStage` keeps its `<section aria-label="Preview">` root and never renders another `<main>`.
- **Containing block for the Terms sheet:** `TermsSheet` uses `position: fixed; inset: 0` in every mode (T-021). Each frame needs a non-scrolling shell around its scroll container that establishes a containing block for fixed descendants: `transform` (BrowserFrame's scale already does, if it sits on the shell rather than the scroller) or `contain: layout` on PhoneFrame's viewport shell. Without one, the sheet covers the whole editor window. If the scroller itself carried the transform, the sheet would scroll away with the content.

## Outcome
- **Built:** `PreviewStage` with the screen switcher, `PhoneFrame` (375×740, `contain: layout` shell, fold line in the scroller), `BrowserFrame` (1280×800 scaled to the stage, capped at 1282px), the captions, and the fit, save and restore notices. `ReadabilityCheck` and `useFitCheck` are stubs for T-027 and T-028. 439 tests pass; `tsc` and lint are clean.
- **Review:** approved with should-fixes, all fixed in the record commit: the browser frame is measured before its first paint and capped at its page width ([`T-009-browser-frame-measured-before-paint-and-capped.md`](../decisions/T-009-browser-frame-measured-before-paint-and-capped.md)); the notices share one live region ([`T-009-notices-one-live-region.md`](../decisions/T-009-notices-one-live-region.md)); a test assertion that couldn't fail was dropped.
- **Milestone 2 review:** done, nothing blocking. Its switcher-track finding is fixed ([`T-009-segmented-track-matches-canvas.md`](../decisions/T-009-segmented-track-matches-canvas.md)).
- **Security:** not a trust-boundary ticket; no audit run.

## Decisions
- [`general-splash-root-grows-in-frame.md`](../decisions/general-splash-root-grows-in-frame.md): In the editor frames the splash root grows with its content, and the frame scrolls
- [`T-008-editor-shell-creates-slots.md`](../decisions/T-008-editor-shell-creates-slots.md): The editor shell owns Inspector.tsx and TopBar.tsx and creates every later editor component as a stub
- [`T-009-landing-terms-switcher-in-step-2.md`](../decisions/T-009-landing-terms-switcher-in-step-2.md): PreviewStage ships a Landing/Terms switcher; Error and Connected are added by the cuttable guest-screens ticket
- [`general-new-modules-beyond-project-structure.md`](../decisions/general-new-modules-beyond-project-structure.md): Planning adds small modules to the spec's project structure so each ticket owns its own files
- [`general-persistence-versioning-and-flush.md`](../decisions/general-persistence-versioning-and-flush.md): Persistence keeps version 2, flushes on page hide and reports failed restores
- [`general-splashpage-callback-props.md`](../decisions/general-splashpage-callback-props.md): SplashPage takes selection, onSelect and onScreenChange props
- [`T-009-fold-on-landing-screens.md`](../decisions/T-009-fold-on-landing-screens.md): the fold line shows on Landing and Error only
- [`T-009-frame-containing-blocks.md`](../decisions/T-009-frame-containing-blocks.md): how each frame contains the fixed Terms sheet (superseded)
- [`T-009-browser-frame-measured-before-paint-and-capped.md`](../decisions/T-009-browser-frame-measured-before-paint-and-capped.md): the browser frame is measured before paint and capped at 1282px
- [`T-009-notices-share-amber-style.md`](../decisions/T-009-notices-share-amber-style.md): the save and restore notices reuse the fit note's amber style
- [`T-009-notices-one-live-region.md`](../decisions/T-009-notices-one-live-region.md): the notices share one always-mounted status region
- [`T-009-preview-stage-test-file-added.md`](../decisions/T-009-preview-stage-test-file-added.md): adds `src/editor/PreviewStage.test.tsx`
- [`T-009-segmented-track-matches-canvas.md`](../decisions/T-009-segmented-track-matches-canvas.md): the Segmented track is zinc-200
