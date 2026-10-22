---
title: "Type-checking includes vinext's generated Worker types but never depends on generated globals"
type: decision
project: captivator
ticket: T-001
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, typescript, infra]
---
# Type-checking includes vinext's generated Worker types but never depends on generated globals

## Context
`create-next-app`'s layout types its props with `LayoutProps<"/">`, a global that Next's route typegen writes to `.next/types`. vinext's Cloudflare docs say to add `.cloudflare/types`, which is generated during dev and build, to `tsconfig.json`'s `include`. Both folders are gitignored, so a fresh clone has neither until `npm run dev` or `npm run build` runs.

## Decision
- `tsconfig.json`'s `include` gains `.cloudflare/types`, as vinext's docs say.
- The root layout types `children` explicitly (`Readonly<{ children: ReactNode }>`), as `create-vinext-app` does, instead of using `LayoutProps`.

`npx tsc --noEmit` passes both on a fresh clone and after a build.

## Alternatives
- Keep `LayoutProps`: `tsc` fails on a fresh clone.
- Generate types before every type-check with `cf workers types`: there are no bindings to type yet.

## Consequences
- Later tickets type page and layout props explicitly, never with the generated `PageProps`/`LayoutProps` globals.
- Once a ticket imports `env` from `cloudflare:workers` or relies on binding types, a standalone `tsc` needs `.cloudflare/types` generated first, by a build or `npx cf workers types`.
