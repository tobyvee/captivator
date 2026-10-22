---
title: "T-008 is blocked at integration because its test file fails npx tsc --noEmit"
type: decision
project: captivator
ticket: T-008
decided_by: branch-integrator
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, tests, typecheck, integration]
---
# T-008 is blocked at integration because its test file fails npx tsc --noEmit

## Context
`worktree-agent-acc83b64797273708` (624bae3) rebased onto `main` (ed8bea5) with no conflicts. On the merged tree `npm test` (327 tests) and `npm run lint` passed, but `npx tsc --noEmit` failed:

```
src/editor/editor.test.tsx(40,26): error TS2345: Argument of type 'HTMLDivElement' is not assignable to parameter of type 'string | Response | ReadableStream<any>'.
```

`tsconfig.json` includes `.cloudflare/types` (`T-001-typecheck-without-generated-globals.md`). Those generated Workers types declare a global `interface Element` whose `append(content: string | ReadableStream | Response, ...)` merges with the DOM's `Element`, so `document.body.append(container)` fails to type-check. The ticket's own worktree has `.cloudflare/types` too and fails the same way, so this is an error in the ticket's code, not a clash between two tickets. `main` at ed8bea5 type-checks clean.

## Decision
Reset `main` to ed8bea5 (the merge was never pushed) and block T-008. The branch and worktree stay so the work can be recovered.

## Alternatives
- **Integration fix on the target (`appendChild` in place of `append`):** this is a one-line change, but the branch-integrator only fixes failures caused by how two tickets fit together. A failure in the ticket's own file goes back to the ticket.
- **Merge anyway:** leaves `main` failing its type-check.

## Consequences
T-008 needs a follow-up commit on its branch that makes `npx tsc --noEmit` pass, for example by using `document.body.appendChild(container)` at `src/editor/editor.test.tsx:40`. Once it does, re-run integration. Later editor tests in jsdom should use `appendChild` (or `Node` APIs the Workers types don't shadow) for the same reason. T-009, T-012 and the panel tickets depend on T-008's slots.
