---
title: "T-009: Preview stage with phone and browser frames"
type: ticket
project: captivator
status: todo
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
cut_rank:
updated: 2026-10-22
tags: [project, captivator, ticket, editor]
---
# T-009: Preview stage with phone and browser frames

## Context
Build step 2 (PhoneFrame, BrowserFrame, live preview) and step 3's click-to-select in the preview ([spec → Editor UI → Preview stage](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md)). This replaces the `PreviewStage` stub from T-008. It also creates the stage's own slots: a Landing/Terms `ScreenSwitcher` (T-022 adds Error and Connected), and stubs for the readability line (T-027) and fit check (T-028). Canvas artboards: `Main` (phone frame, switcher, notes under the frame, small-phone fold line) and `DesktopPreview` (browser frame). Decisions: [`T-009-landing-terms-switcher-in-step-2.md`](../decisions/T-009-landing-terms-switcher-in-step-2.md), [`general-splashpage-callback-props.md`](../decisions/general-splashpage-callback-props.md), [`general-persistence-versioning-and-flush.md`](../decisions/general-persistence-versioning-and-flush.md).

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
- **`frames/PhoneFrame.tsx`:** `PhoneFrame({ children, showFold })`. 375×740 inner viewport, 10px `#18181B` border, 46px radius, `overflow: hidden`. With `showFold`, draw the dashed amber line at 600px from the top with the "Small-phone fold" chip (canvas `Main`).
- **`frames/BrowserFrame.tsx`:** `BrowserFrame({ children, title })`. A 1280×800 page scaled to the stage width with `transform: scale(s)`, where `s = min(1, width / 1280)` from a `ResizeObserver`. The outer box reserves `800 * s` height. Add a simple browser bar (three dots and "Sign in to {title || "Guest WiFi"}").
- **`ScreenSwitcher.tsx`:** `ScreenSwitcher()` reads the store and renders a `Segmented` labelled "Preview screen". Options: Landing, and Terms only when `terms.mode === "checkbox"`. It shows the current `screen` and calls `setScreen`.
- **`checks/ReadabilityCheck.tsx`** (stub → T-027): `export function ReadabilityCheck({ design }: { design: Design }) { return null; }`.
- **`checks/useFitCheck.tsx`** (stub → T-028): `export function useFitCheck(design: Design): { tooTall: boolean; height: number | null; probe: ReactNode } { return { tooTall: false, height: null, probe: null }; }`.
- **Out of scope:** the device toggle (T-008, TopBar); Error and Connected switcher options (T-022); readability and fit logic (T-027, T-028); the page-weight meter (not in the spec; reported as a gap).

## Acceptance criteria
- [ ] The preview updates on every store change, in both Mobile and Desktop.
- [ ] Clicking a block in the preview selects it (outline, name chip, inspector panel). Clicking the page background selects Background.
- [ ] Desktop shows the background filling the 1280-wide page with the content column at 420px, scaled to fit the stage without horizontal scroll.
- [ ] The switcher shows Landing and Terms (Terms hidden when terms are off) and changes `screen`.
- [ ] The save-failure and restore-failure notices appear when their flags are set (check by setting the flags in the store).
- [ ] Captions: "375 × 740, iPhone login sheet" (mobile) and "1280 × 800 laptop browser. The content column stays 420 px wide; the photo fills the window." (desktop).
- [ ] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-005: `SplashPage` and its props (`mode`, `inFrame`, `selection`, `onSelect`, `onScreenChange`).
- T-008: the `PreviewStage` stub this replaces, `Segmented`, and the page layout it sits in.

## Notes
- **Fit note** (canvas): title "Too tall for small phones"; body "On a small phone like an iPhone SE, guests have to scroll to reach Connect. Shorten text, remove a block or use smaller images." Amber: `#FFFBEB` background, `#FDE68A` border, `#78350F` text.
- The canvas caption says 375 × 760, but the guest-state artboards' inner viewport and the spec are 375 × 740; use 740.
- `useFitCheck` is a `.tsx` file because T-028's probe renders JSX.

## Decisions
- [`T-008-editor-shell-creates-slots.md`](../decisions/T-008-editor-shell-creates-slots.md): The editor shell owns Inspector.tsx and TopBar.tsx and creates every later editor component as a stub
- [`T-009-landing-terms-switcher-in-step-2.md`](../decisions/T-009-landing-terms-switcher-in-step-2.md): PreviewStage ships a Landing/Terms switcher; Error and Connected are added by the cuttable guest-screens ticket
- [`general-new-modules-beyond-project-structure.md`](../decisions/general-new-modules-beyond-project-structure.md): Planning adds small modules to the spec's project structure so each ticket owns its own files
- [`general-persistence-versioning-and-flush.md`](../decisions/general-persistence-versioning-and-flush.md): Persistence keeps version 2, flushes on page hide and reports failed restores
- [`general-splashpage-callback-props.md`](../decisions/general-splashpage-callback-props.md): SplashPage takes selection, onSelect and onScreenChange props
