---
title: "T-004: Store with every action, and localStorage persistence"
type: ticket
project: captivator
status: todo
priority: P0
milestone: 1
estimate: 30
depends_on: [T-002]
touches:
  - src/lib/store.ts
  - src/lib/store.test.ts
  - src/lib/persist-storage.ts
  - src/lib/persist-storage.test.ts
cut_rank:
updated: 2026-10-22
tags: [project, captivator, ticket, store, security]
---
# T-004: Store with every action, and localStorage persistence

## Context
Build step 1, "store with persist" ([spec → Data model and store](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md), *Persistence*, *Unit tests* → `store` actions and Persistence). This is the shared foundation every editor ticket dispatches to, so it defines **every** action and flag up front; only T-025 (undo) edits `store.ts` afterwards. Persistence is P0 and a trust boundary: localStorage can be hand-edited. Decisions: [`T-004-store-owns-all-actions.md`](../decisions/T-004-store-owns-all-actions.md), [`T-004-store-rejects-invalid-designs.md`](../decisions/T-004-store-rejects-invalid-designs.md), [`T-004-terms-selection-switches-screen.md`](../decisions/T-004-terms-selection-switches-screen.md), [`T-004-template-switch-carry-rule.md`](../decisions/T-004-template-switch-carry-rule.md), [`T-004-default-design-is-sponsor.md`](../decisions/T-004-default-design-is-sponsor.md), [`general-persistence-versioning-and-flush.md`](../decisions/general-persistence-versioning-and-flush.md).

## Scope
- `src/lib/persist-storage.ts`: `createDebouncedStorage(options)` returns a Zustand `StateStorage` (`getItem`, `setItem`, `removeItem`) plus `flush()`:
  - `setItem` keeps the latest pending value and (re)starts a ~300ms timer.
  - `getItem` returns a pending value for that key if there is one, otherwise reads storage.
  - `removeItem` cancels any pending write for that key.
  - `flush()` writes the pending value now.
  - Writes from the timer or `flush()` catch any error (`QuotaExceededError` included), call `onError(err)` and never throw. A successful write calls `onSuccess()`.
  - Flushes on `pagehide` (window) and on `visibilitychange` when `visibilityState === "hidden"` (document). Listeners attach only when those targets exist.
  - Options: `{ delay?: number; onError: (e: unknown) => void; onSuccess?: () => void; getStorage?: () => Storage; events?: { window: EventTarget; document: EventTarget & { visibilityState: string } } }`. Injected `getStorage` and `events` let tests run in the node environment.
- `src/lib/store.ts`: the Zustand store with `persist` and the API in Notes.
  - `persist`:
    - `name: STORAGE_KEY` (`"captivator:v2"`), `version: 2`, `partialize: s => ({ design: s.design, name: s.name })`.
    - `storage: createJSONStorage(() => debouncedStorage)`, with `onError` setting `saveFailed: true` and `onSuccess` clearing it.
    - `migrate` returns the default state (Sponsor design, empty name) for any version below 2.
    - `merge` runs `Design.safeParse` on the stored design. On success it uses it and sets `restored: true`. On failure it keeps the current design and sets `restoreFailed: true`. The stored `name` is used only if it's a string of at most 60 characters.
    - `skipHydration: true`. `onRehydrateStorage` sets `hasHydrated: true`, and on a parse error (corrupt JSON) also sets `restoreFailed: true`.
  - `useHydrated()`: calls `useStore.persist.rehydrate()` once in a `useEffect` and returns `hasHydrated`.
  - Every design-changing action builds the next design and runs `Design.safeParse`. If that fails, the state is unchanged and the action returns `false` (or `null` for `addBlock`).
- Tests: `src/lib/store.test.ts` (actions and persistence) and `src/lib/persist-storage.test.ts`, node environment, with a fake `Storage` object stubbed on `globalThis.localStorage` where the store needs one.
- **Out of scope:** zundo undo/redo (T-025 adds `temporal` to this file); any UI.

## Acceptance criteria
- [ ] `addBlock` refuses a third image (returns `null`, design unchanged).
- [ ] `moveBlock` stops at the ends (moving the first block up and the last block down are no-ops).
- [ ] `removeBlock` clears a stale selection to `{ kind: "background" }`.
- [ ] Fields cap at 2: `updateForm({ fields: ["name", "email", "phone"] })` returns `false` and leaves fields unchanged; a duplicate field is refused too.
- [ ] `loadTemplate` keeps uploaded images and text (fixture templates): customer text and a data-URL image carry by position; a text equal to a template default doesn't carry.
- [ ] `setSelection({ kind: "terms" })` with terms on sets `screen: "terms"`; selecting a block afterwards returns `screen` to `"landing"`.
- [ ] Persistence: corrupt JSON in `captivator:v2` falls back to Sponsor without throwing; an older `version` migrates to Sponsor.
- [ ] **Security:** a schema-invalid stored design (e.g. an image `src` of `javascript:alert(1)`) is not used, the Sponsor design stays, and `restoreFailed` is `true` (test).
- [ ] A storage whose `setItem` throws `QuotaExceededError` sets `saveFailed` instead of crashing, both from the timer and from `flush()` (test).
- [ ] A pending debounced write is flushed on `pagehide` and on `visibilitychange` to hidden (test with injected event targets).
- [ ] Nothing except `{ design, name }` is written to storage (test the written JSON).
- [ ] `npm test` and `npx tsc --noEmit` pass.

## Dependencies
- T-002: `SPONSOR`, `TEMPLATES` and the `Template` type for the default design and `loadTemplate`'s default-content set.
- T-001 (via T-002): `src/lib/types.ts` (`Selection`, `Screen`, `Device`, `BackgroundSpec`, `FormSpec`, block types).

## Notes
API (other tickets build against exactly this):

```ts
export const STORAGE_KEY = "captivator:v2";
export type NewBlock = Omit<TextBlockSpec, "id"> | Omit<ImageBlockSpec, "id">;
export type BlockPatch =
  | Partial<Omit<TextBlockSpec, "id" | "kind">>
  | Partial<Omit<ImageBlockSpec, "id" | "kind">>;
export type FormPatch = Partial<Omit<FormSpec, "terms" | "button">> & {
  terms?: Partial<FormSpec["terms"]>;   // merged one level deep
  button?: Partial<FormSpec["button"]>; // merged one level deep
};

export type EditorState = {
  design: Design;          // persisted (+ undo in T-025)
  name: string;            // persisted, max 60
  selection: Selection;    // starts { kind: "background" }
  device: Device;          // starts "mobile"
  screen: Screen;          // starts "landing"
  logoPalette: string[];   // suggestions only, never in Design
  hasHydrated: boolean;
  restored: boolean;       // a saved design was restored (picker shows "Continue your design")
  restoreFailed: boolean;  // "Couldn't restore your saved design"
  saveFailed: boolean;     // "Couldn't save locally"

  loadTemplate(template: Template): void;            // carry rule (decision); selection → background, screen → landing
  updateBackground(background: BackgroundSpec): boolean; // replaces the whole background
  addBlock(block: NewBlock): string | null;          // id = crypto.randomUUID(); selects the new block
  updateBlock(id: string, patch: BlockPatch): boolean;
  removeBlock(id: string): void;
  moveBlock(id: string, dir: -1 | 1): void;
  updateForm(patch: FormPatch): boolean;
  setName(name: string): void;                       // trims to 60 characters
  setSelection(selection: Selection): void;          // terms ↔ screen rule (decision)
  setDevice(device: Device): void;
  setScreen(screen: Screen): void;
  setLogoPalette(colours: string[]): void;
  dismissRestoreFailed(): void;
};
export const useStore: /* UseBoundStore<…> with .persist */;
export function useHydrated(): boolean;
```

- **Screen consistency** (decision): `setSelection` sets `screen: "terms"` when selecting terms with `terms.mode === "checkbox"`, and returns to `"landing"` when selecting anything else while on `"terms"`. `updateForm` returns to `"landing"` if terms are switched off while on `"terms"`, or if nothing can fail (`fields.length === 0 && terms.mode === "off"`) while on `"error"`.
- **Carry rule** (decision): build `defaults` = every text string and every image `src` that appears in any template in `TEMPLATES`. Then:
  - The new template's i-th text block takes the current design's i-th text block's `text`, unless that text is in `defaults`.
  - The i-th image block takes `src` and `alt` from the current i-th image block, unless its `src` is in `defaults`.
  - If both backgrounds are images and the current `src` isn't in `defaults`, keep the current `src` and `credit`.
  - Everything else (colours, sizes, form) comes from the new template.
- Keep `store.ts` free of React components; `useHydrated` is the only hook. Don't import `contrast.ts` (callers pass complete blocks).
- With `skipHydration`, nothing reads localStorage at import time, so the module is safe to import on the server.

## Decisions
- [`T-004-default-design-is-sponsor.md`](../decisions/T-004-default-design-is-sponsor.md): The store starts from the Sponsor template
- [`T-004-store-owns-all-actions.md`](../decisions/T-004-store-owns-all-actions.md): store.ts is created once with every action, and only the undo ticket edits it later
- [`T-004-store-rejects-invalid-designs.md`](../decisions/T-004-store-rejects-invalid-designs.md): Store actions drop any update that would make the design fail the schema
- [`T-004-template-switch-carry-rule.md`](../decisions/T-004-template-switch-carry-rule.md): Switching template carries text and uploaded images by position, never template defaults
- [`T-004-terms-selection-switches-screen.md`](../decisions/T-004-terms-selection-switches-screen.md): Selecting Terms switches the preview to the Terms sheet, in the store
- [`general-new-modules-beyond-project-structure.md`](../decisions/general-new-modules-beyond-project-structure.md): Planning adds small modules to the spec's project structure so each ticket owns its own files
- [`general-persistence-versioning-and-flush.md`](../decisions/general-persistence-versioning-and-flush.md): Persistence keeps version 2, flushes on page hide and reports failed restores
