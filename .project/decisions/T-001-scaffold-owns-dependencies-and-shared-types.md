---
title: "The scaffold ticket installs every dependency and creates the shared type file"
type: decision
project: captivator
ticket: T-001
decided_by: ticket-planner
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, infra, planning]
---
# The scaffold ticket installs every dependency and creates the shared type file

## Context
`package.json` and the lockfile conflict whenever two parallel worktrees change them. Several modules also need the same UI types (`Screen`, `Selection`, `RenderMode`, `Device`), and the splash renderer can't import the store, where the spec puts them.

## Decision
- **Dependencies:** T-001 is the only ticket that edits `package.json` and the lockfile. It installs every runtime and test dependency, including the stretch-only `@dnd-kit/*` packages.
- **Shared types:** it creates `src/lib/types.ts`, holding schema-derived type aliases and the UI unions.
- **Schema:** it writes the schema tests. No ticket edits `design-schema.ts`.

## Alternatives
- **Each ticket adds its own packages:** parallel lockfile conflicts.
- **Define the UI unions in `store.ts`:** the splash would have to import the store or duplicate the unions.
- **Install `@dnd-kit` only if the stretch ships:** a late `package.json` edit.

## Consequences
If T-034 is cut, `@dnd-kit` stays in `package.json` but is never imported, so it isn't bundled. A ticket that needs a new package must report it rather than add it.
