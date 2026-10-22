---
title: "T-025: Undo and redo with shortcuts"
type: ticket
project: captivator
status: todo
priority: P1
milestone: 8
estimate: 20
depends_on: [T-004, T-008]
touches:
  - src/lib/store.ts
  - src/lib/store.undo.test.ts
  - src/editor/UndoRedo.tsx
cut_rank:
updated: 2026-10-23
tags: [project, captivator, ticket, store, editor]
---
# T-025: Undo and redo with shortcuts

## Context
Build step 8, "Undo/redo with shortcuts" ([spec → Data model and store → Undo/redo](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md), *Unit tests* → Undo). This is the only ticket after T-004 that edits `store.ts`: it wraps the existing store in zundo's `temporal` without changing any action or state name. It also replaces the `UndoRedo` stub from T-008. Canvas artboard: `Main` (top bar Undo/Redo). Decisions: [`general-undo-leading-edge-debounce.md`](../decisions/general-undo-leading-edge-debounce.md), [`T-004-store-owns-all-actions.md`](../decisions/T-004-store-owns-all-actions.md).

## Scope
- **`store.ts`:** add zundo `temporal` with:
  - `partialize: s => ({ design: s.design })`.
  - `limit: 100`.
  - `equality` comparing `design` by reference, so UI-only changes record nothing.
  - `handleSet` wrapped in a leading-edge debounce (about 400ms; `leading: true, trailing: false`): record on the first change, then ignore changes until 400ms pass with none. Hand-roll the debounce (no new package).
  - Clear history after rehydration, so restoring a saved design isn't an undo step.
  - History is in memory only. `persist` still writes only `{ design, name }`. Keep every existing export and its signature.
- **`UndoRedo.tsx`:**
  - Two icon buttons (lucide `Undo2`/`Redo2`): `aria-label` "Undo"/"Redo"; `title` "Undo (Cmd+Z or Ctrl+Z)" and "Redo (Shift+Cmd+Z or Ctrl+Y)". Disabled when `pastStates`/`futureStates` are empty (subscribe to `useStore.temporal`).
  - A `window` `keydown` listener, registered while mounted: Cmd/Ctrl+Z → undo; Shift+Cmd/Ctrl+Z or Ctrl+Y → redo; `preventDefault` when handled.
  - The listener ignores events whose target is an `input`, `textarea`, `select` or `contenteditable`, so native text undo works.
- **`store.undo.test.ts`** (node environment, fake timers).
- **`updateForm`:** when `selection.kind === "terms"` and the patch turns `terms.mode` to `"checkbox"`, also set `screen: "terms"`, with a test in `store.test.ts` or `store.undo.test.ts` ([`T-025-terms-switch-shows-terms-screen.md`](../decisions/T-025-terms-switch-shows-terms-screen.md), from the T-008 review).
- **Out of scope:** gesture-based grouping (rejected in the decision); any other store change.

## Acceptance criteria
- [ ] With fake timers, 20 colour updates spread over 2 seconds (100ms apart) make one undo step; undo restores the original colour (test).
- [ ] Two bursts separated by a 500ms pause make two steps (test).
- [ ] Selection, device and screen changes aren't undoable (test).
- [ ] History is capped at 100 (test).
- [ ] T-004's `store.test.ts` still passes unchanged.
- [ ] Buttons disable correctly. Cmd+Z in the design-name input or a textarea undoes text, not the design (spec checklist).
- [ ] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-004: the store this ticket wraps.
- T-008: the `UndoRedo` stub in the top bar.

## Notes
Pick the middleware order (`temporal(persist(…))` or `persist(temporal(…))`) so that `useStore.persist` and `useStore.temporal` both exist and persist's `partialize`/`merge` are unchanged. Say which you chose in your report.

The store only writes to storage when `design` or `name` changes by reference ([`T-004-write-only-on-design-change.md`](../decisions/T-004-write-only-on-design-change.md)). Undo and redo must set `design` to the stored history object, as zundo does, never mutate it in place, or the undone state won't be saved. Add a test that undo followed by a 300ms wait writes the earlier design.

## Decisions
- [`T-004-store-owns-all-actions.md`](../decisions/T-004-store-owns-all-actions.md): store.ts is created once with every action, and only the undo ticket edits it later
- [`T-008-editor-shell-creates-slots.md`](../decisions/T-008-editor-shell-creates-slots.md): The editor shell owns Inspector.tsx and TopBar.tsx and creates every later editor component as a stub
- [`general-undo-leading-edge-debounce.md`](../decisions/general-undo-leading-edge-debounce.md): Undo history uses a leading-edge debounce, not a throttle
- [`T-025-terms-switch-shows-terms-screen.md`](../decisions/T-025-terms-switch-shows-terms-screen.md): turning terms on while Terms is selected shows the Terms screen
