---
title: "T-025: Undo and redo with shortcuts"
type: ticket
project: captivator
status: done
priority: P1
milestone: 8
estimate: 20
depends_on: [T-004, T-008]
touches:
  - src/lib/store.ts
  - src/lib/store.undo.test.ts
  - src/editor/UndoRedo.tsx
  - src/editor/UndoRedo.test.tsx
  - src/app/page.tsx
  - src/lib/store.test.ts
  - src/editor/TemplateCard.test.tsx
  - src/editor/editor.test.tsx
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
- [x] With fake timers, 20 colour updates spread over 2 seconds (100ms apart) make one undo step; undo restores the original colour (test).
- [x] Two bursts separated by a 500ms pause make two steps (test).
- [x] Selection, device and screen changes aren't undoable (test).
- [x] History is capped at 100 (test).
- [x] T-004's `store.test.ts` still passes unchanged.
- [x] Buttons disable correctly. Cmd+Z in the design-name input or a textarea undoes text, not the design (spec checklist). *The handler skips text-entry targets and leaves the event to the browser (tested in jsdom); the real-browser text undo is on T-029's checklist ([`T-025-native-text-undo-check-in-t029.md`](../decisions/T-025-native-text-undo-check-in-t029.md)).*
- [x] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-004: the store this ticket wraps.
- T-008: the `UndoRedo` stub in the top bar.

## Outcome
- **Built:** zundo `temporal` inside `persist`, tracking only `design` by reference, with a timestamp-based leading-edge debounce (400ms) so one drag is one step, a limit of 100, history cleared after rehydration and kept in memory only. `UndoRedo` has two 44px icon buttons, natively disabled with no history, and Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z and Ctrl+Y shortcuts that skip text entry. Turning terms on with Terms selected shows the Terms screen. 655 tests pass; `tsc` and lint are clean.
- **Added scope:** the store's `restored` flag is now `hasSaved`, also set when the first edit after hydration is written, so the picker offers "Continue your design" and asks before switching without a reload (`593d0fb`, [`T-025-saved-means-written-this-session.md`](../decisions/T-025-saved-means-written-this-session.md)). This closes T-019's open criterion.
- **Review:** one must-fix, fixed in `92a0472` by nextjs-specialist and re-reviewed: undo and redo now keep the preview on a screen the design can show, through one `screenAfter` rule shared by `updateForm` and a store subscriber ([`T-025-undo-keeps-screen-valid.md`](../decisions/T-025-undo-keeps-screen-valid.md)). The re-review's test should-fix and nit are fixed in `94e35be`.
- **Security:** audited (store persistence is a trust boundary). No findings: undo and redo can't bring in a design that skipped the schema, history is never persisted, and a failed restore still isn't overwritten before an edit.

## Notes
- **Added scope from T-019 and the milestone 5 review:** treat a design edited in this session as saved, so the picker shows "Continue your design" and asks before switching without a reload. The main session adds it when landing T-025 ([`T-025-store-marks-in-session-saves.md`](../decisions/T-025-store-marks-in-session-saves.md)).
Pick the middleware order (`temporal(persist(…))` or `persist(temporal(…))`) so that `useStore.persist` and `useStore.temporal` both exist and persist's `partialize`/`merge` are unchanged. Say which you chose in your report.

The store only writes to storage when `design` or `name` changes by reference ([`T-004-write-only-on-design-change.md`](../decisions/T-004-write-only-on-design-change.md)). Undo and redo must set `design` to the stored history object, as zundo does, never mutate it in place, or the undone state won't be saved. Add a test that undo followed by a 300ms wait writes the earlier design.

## Decisions
- [`T-004-store-owns-all-actions.md`](../decisions/T-004-store-owns-all-actions.md): store.ts is created once with every action, and only the undo ticket edits it later
- [`T-008-editor-shell-creates-slots.md`](../decisions/T-008-editor-shell-creates-slots.md): The editor shell owns Inspector.tsx and TopBar.tsx and creates every later editor component as a stub
- [`general-undo-leading-edge-debounce.md`](../decisions/general-undo-leading-edge-debounce.md): Undo history uses a leading-edge debounce, not a throttle
- [`T-025-terms-switch-shows-terms-screen.md`](../decisions/T-025-terms-switch-shows-terms-screen.md): turning terms on while Terms is selected shows the Terms screen
- [`T-025-persist-wraps-temporal.md`](../decisions/T-025-persist-wraps-temporal.md): persist wraps temporal; hydration clears history
- [`T-025-undo-gate-reopens-after-undo.md`](../decisions/T-025-undo-gate-reopens-after-undo.md): the timestamp debounce always records the first change after undo, redo or clear
- [`T-025-shortcuts-skip-text-entry-only.md`](../decisions/T-025-shortcuts-skip-text-entry-only.md): shortcuts skip text entry, not sliders
- [`T-025-undo-buttons-native-disabled.md`](../decisions/T-025-undo-buttons-native-disabled.md): native `disabled` on the undo buttons
- [`T-025-undoredo-test-file-added.md`](../decisions/T-025-undoredo-test-file-added.md): adds `UndoRedo.test.tsx`
- [`T-025-terms-on-means-mode-change.md`](../decisions/T-025-terms-on-means-mode-change.md): only a real off-to-checkbox change shows the Terms screen
- [`T-025-store-marks-in-session-saves.md`](../decisions/T-025-store-marks-in-session-saves.md): the in-session saved case moves into T-025 (superseded)
- [`T-025-saved-means-written-this-session.md`](../decisions/T-025-saved-means-written-this-session.md): `hasSaved` replaces `restored`
- [`T-025-undo-keeps-screen-valid.md`](../decisions/T-025-undo-keeps-screen-valid.md): undo and redo keep the screen valid
- [`T-025-native-text-undo-check-in-t029.md`](../decisions/T-025-native-text-undo-check-in-t029.md): the real-browser text undo check moves to T-029
