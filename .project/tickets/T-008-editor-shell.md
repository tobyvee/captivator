---
title: "T-008: Editor shell, top bar, inspector router and component slots"
type: ticket
project: captivator
status: todo
priority: P0
milestone: 2
estimate: 20
depends_on: [T-004]
touches:
  - src/app/editor/page.tsx
  - src/editor/TopBar.tsx
  - src/editor/Inspector.tsx
  - src/editor/controls/Segmented.tsx
  - src/editor/controls/Switch.tsx
  - src/editor/BlockList.tsx
  - src/editor/PreviewStage.tsx
  - src/editor/UndoRedo.tsx
  - src/editor/ExportButton.tsx
  - src/editor/panels/BackgroundPanel.tsx
  - src/editor/panels/TextPanel.tsx
  - src/editor/panels/ImagePanel.tsx
  - src/editor/panels/FieldsPanel.tsx
  - src/editor/panels/TermsPanel.tsx
  - src/editor/panels/ButtonPanel.tsx
cut_rank:
updated: 2026-10-22
tags: [project, captivator, ticket, editor]
---
# T-008: Editor shell, top bar, inspector router and component slots

## Context
Build step 2 (Mobile/Desktop toggle) and the integration point for steps 3–8 ([spec → Editor UI](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md), *Top bar*, *Persistence* → hydration). This ticket owns `Inspector.tsx`, `TopBar.tsx` and the editor page, and creates every later editor component as a stub with its final name and props, so each later ticket replaces exactly one file and no two tickets edit a router. It also ships the hydration guard, so saved designs load from step 2. Canvas artboards: `Main` (`project/Main.dc.html`) and `DesktopPreview`. Decisions: [`T-008-editor-shell-creates-slots.md`](../decisions/T-008-editor-shell-creates-slots.md), [`T-008-hydration-guard-in-step-2.md`](../decisions/T-008-hydration-guard-in-step-2.md), [`T-019-confirm-on-use-not-templates.md`](../decisions/T-019-confirm-on-use-not-templates.md).

## Scope
- **`src/app/editor/page.tsx`** (`"use client"`):
  - `const hydrated = useHydrated()`; render a neutral skeleton (grey blocks in the three-column layout) until it's true.
  - Then `<TopBar/>` and a `main` that holds `<BlockList/>`, `<PreviewStage/>` and `<Inspector/>` in a `flex-wrap` row: block list `flex: 1 1 272px; max-width: 300px`, stage `flex: 1 1 480px; min-width: 0`, inspector `flex: 1 1 300px; max-width: 340px`.
- **`TopBar.tsx`** (complete), left to right:
  - Wi-Fi icon + "Captivator" / design name input (`aria-label="Design name"`, `maxLength` 60, placeholder "Design name", `setName`).
  - Mobile/Desktop `Segmented` (`aria-label="Preview device"`, `setDevice`).
  - `<UndoRedo/>`.
  - "Templates" as a Next `<Link href="/">` styled as a secondary button (no confirm; decision).
  - `<ExportButton/>`.
- **`Inspector.tsx`** (complete): `<aside>` with a header and the panel for `selection`:
  - background → `BackgroundPanel`.
  - block → `TextPanel` or `ImagePanel` with `id` (falls back to `BackgroundPanel` if the id no longer exists).
  - fields → `FieldsPanel`; terms → `TermsPanel`; button → `ButtonPanel`.
  - Header: a title and subtitle per kind (Notes).
  - For blocks, a Delete button (`aria-label="Delete block"`, red Trash icon) → `removeBlock(id)`.
  - For terms, a `Switch` (`aria-label="Show terms checkbox"`) → `updateForm({ terms: { mode } })`.
- **`controls/Segmented.tsx`** (complete): `Segmented<T extends string>({ label, options: { value: T; label: string; icon?: ReactNode }[], value, onChange })`. `role="group"` with `aria-label`, `<button aria-pressed>` per option, min-height 44px.
- **`controls/Switch.tsx`** (complete): `Switch({ checked, onChange, label })`. A `<button role="switch" aria-checked aria-label>` drawn 44×26 (canvas) inside a 44px-tall hit area.
- **Stubs** (final names and props, minimal placeholder output, a comment naming the ticket that replaces each):
  - `BlockList()` → T-012.
  - `PreviewStage()` → T-009.
  - `UndoRedo()` (two disabled icon buttons) → T-025.
  - `ExportButton()` (disabled "Export HTML") → T-024.
  - `BackgroundPanel()` → T-016.
  - `TextPanel({ id })` → T-013.
  - `ImagePanel({ id })` → T-014.
  - `FieldsPanel()` and `ButtonPanel()` → T-015.
  - `TermsPanel()` → T-020.
- **Out of scope:** the content of every stub; the screen switcher and checks (T-009).

## Acceptance criteria
- [ ] `/editor` renders the skeleton on the server and first paint, then the three columns after `useHydrated()` is true, with no hydration warning in the console.
- [ ] Editing the name updates the store; after a refresh the name and design are restored (T-004 persistence).
- [ ] The Mobile/Desktop control announces its state (`aria-pressed`) and updates `device`.
- [ ] Each selection kind shows its panel stub and header; Delete removes the selected block and the inspector falls back to Background.
- [ ] The Terms switch in the header toggles `terms.mode` and announces `aria-checked`.
- [ ] Every control is a real `<button>`, `<input>`, `<a>` or `<label>`, with at least a 44px tap target. The layout wraps to one column on narrow screens.
- [ ] Panels and controls change state only through store actions.
- [ ] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-004: `useStore`, `useHydrated`, `setName`, `setDevice`, `removeBlock`, `updateForm`, `selection` and `device`.

## Notes
- **Header titles:**
  - Background: "Background" / "Fills the whole screen behind your content".
  - Text: "Heading", "Subheading" or "Text" by role / "Text block".
  - Image: "Image" / "Image block".
  - Fields: "Fields" / "Up to two".
  - Terms: "Terms" / "Checkbox above the Connect button".
  - Button: "Connect button".
- **Canvas look:**
  - Page `#F4F4F5`, panels white with `#E4E4E7` borders, text `#18181B`, secondary `#52525B`.
  - Primary button `#18181B` with white text.
  - Selected state `#2563EB` border on `#EFF6FF`.
  - Icons from `lucide-react`.
  - The canvas draws some controls at 34–36px; the spec's 44px tap-target rule wins.
- Tailwind is fine here (editor chrome). Never import editor code into `src/splash/`.
- The PreviewStage stub must not import `SplashPage` (this ticket doesn't depend on T-005).

## Decisions
- [`T-008-editor-shell-creates-slots.md`](../decisions/T-008-editor-shell-creates-slots.md): The editor shell owns Inspector.tsx and TopBar.tsx and creates every later editor component as a stub
- [`T-008-hydration-guard-in-step-2.md`](../decisions/T-008-hydration-guard-in-step-2.md): The hydration guard ships with the editor shell in build step 2
- [`T-019-confirm-on-use-not-templates.md`](../decisions/T-019-confirm-on-use-not-templates.md): The confirm moves from the Templates button to Use on the picker
- [`general-new-modules-beyond-project-structure.md`](../decisions/general-new-modules-beyond-project-structure.md): Planning adds small modules to the spec's project structure so each ticket owns its own files
