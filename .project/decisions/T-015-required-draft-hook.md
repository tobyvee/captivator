---
title: "Required text inputs share a useRequiredDraft hook; each panel keeps its own label, hint and alert markup"
type: decision
project: captivator
ticket: [T-015, T-014, T-020]
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, accessibility, undo, client]
---
# Required text inputs share a useRequiredDraft hook; each panel keeps its own label, hint and alert markup

## Context
The T-015 review found the required-text draft (`T-014-alt-draft-rules.md`, `T-015-button-label-draft-rules.md`) copied in `ImagePanel` and `ButtonPanel`: a local draft resynced during render when the stored value changes, `trim()` gating, and dispatching non-empty values untrimmed. T-020's Terms panel has three more required inputs (before-link text, link text, terms body).

## Decision
- `src/editor/controls/useRequiredDraft.ts` exports `useRequiredDraft(stored, commit)`, returning `{ draft, missing, onChange(value) }`. It holds exactly the rules of the two decisions above: spaces-only is `missing` and never committed, anything else is committed as typed, and the draft follows outside changes to `stored`. `onChange` takes the string, not the event, so it serves `<input>` and `<textarea>` alike.
- The markup stays in each panel: the `<label>`, `aria-invalid`, the `aria-describedby` list and the always-mounted `role="alert"` paragraph (`T-014-alt-error-live-region.md`). The panels differ in what sits beside the error (a counter, a hint), its wording and the control (input or textarea), so a shared component would need a prop for each of those and save only a few lines.
- The file has `"use client"`, because it calls React state (`T-008-use-client-on-stateful-modules.md`, as `checks/useFitCheck.tsx` does).
- The hook has its own `renderHook` test; the panels' tests keep covering the wiring.

## Alternatives
- **Leave the copies:** T-020 would add three more, and a rule change would have to be made in five places.
- **A `RequiredTextField` component:** needs props for counter vs hint, error text and input vs textarea; more API than it saves.
- **Hook takes the change event:** ties it to one element type; the string is simpler and easier to test.

## Consequences
- T-020 calls `useRequiredDraft` once per required wording input (and for the body textarea) with a commit that dispatches the matching `updateForm({ terms: { … } })`, then writes the same markup: `aria-invalid={missing || undefined}`, the error id added to `aria-describedby` only while missing, and an always-mounted `role="alert"` paragraph showing "Required".
- `ImagePanel` (T-014's file) now imports the hook; its behaviour is unchanged.
