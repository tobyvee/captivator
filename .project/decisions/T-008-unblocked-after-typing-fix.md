---
title: "T-008 is unblocked: its hydration test uses appendChild so it type-checks"
type: decision
project: captivator
ticket: T-008
decided_by: main session
supersedes: T-008-blocked-on-typecheck.md
updated: 2026-10-23
tags: [project, captivator, decision, editor, typescript, tests]
---
# T-008 is unblocked: its hydration test uses appendChild so it type-checks

## Context
The branch integrator blocked T-008 because `npx tsc --noEmit` failed in `src/editor/editor.test.tsx`. `document.body.append(container)` doesn't type-check, because the generated Cloudflare Workers types in `.cloudflare/types` merge a global `Element.append(content: string | ReadableStream | Response)` into the DOM's `Element` (T-001-typecheck-without-generated-globals.md). Tests and lint passed, and the rest of the ticket was sound.

## Decision
A follow-up commit on the T-008 branch changes the call to `document.body.appendChild(container)`, with a comment explaining why. The ticket is then integrated again rather than recorded as blocked.

## Alternatives
- Keep T-008 blocked until the next wave: T-009, T-012 and every panel ticket depend on its slots, so the whole build would stall over a one-line test fix.
- Exclude the Workers types from the type-check: they type the server code, and T-001's decision keeps them in.

## Consequences
Editor tests in jsdom use `appendChild`, not `append`, on DOM nodes. Ticket agents must run `npx tsc --noEmit` themselves before handing back, because Vitest doesn't type-check.
