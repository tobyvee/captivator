---
title: "'use client' marks the editor page and modules that use hooks, not presentational controls that take callbacks"
type: decision
project: captivator
ticket: T-008
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, client]
---
# 'use client' marks the editor page and modules that use hooks, not presentational controls that take callbacks

## Context
Only `src/app/editor/page.tsx` has to be a client boundary for the editor to work. Next.js 16's `use-client` page (`node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md`) says the directive is only needed on files rendered directly from Server Components, and that props of a `'use client'` entry must be serializable. Function props like `onChange` are not serializable. `ImageUpload.tsx` (T-011) has the directive and takes callbacks, so there's no single rule in the code yet.

## Decision
- **The directive goes on:**
  - the editor page;
  - every module that calls a store hook or React state (`TopBar`, `Inspector`);
  - the stubs whose replacements will (`BlockList`, `PreviewStage`, `UndoRedo`, `ExportButton` and the panels).

  If a Server Component imports one of these by mistake, it then still works as a client component.
- **It stays off** the presentational controls whose props include callbacks (`controls/Segmented.tsx`, `controls/Switch.tsx`). They only run inside the client tree, and with the directive Next's TypeScript plugin flags their callback props as unserializable.

## Alternatives
- **Only the page:** a stateful module imported from a Server Component later would fail at runtime.
- **Every editor file:** callback props get flagged and the control looks like a boundary when it isn't.

## Consequences
New controls that only take props and callbacks (`ColourField`, `FocusGrid`) leave the directive off. Stateful panels keep it. `ImageUpload` is left as it is (out of scope).
