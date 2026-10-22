---
title: "vite is raised to 8.3.3 to clear a dev-server advisory, and two transitive advisories are left for upstream"
type: decision
project: captivator
ticket: T-001
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, infra, security, dependencies]
---
# vite is raised to 8.3.3 to clear a dev-server advisory, and two transitive advisories are left for upstream

## Context
After install, `npm audit` reported three advisory sources:
- **`vite` 8.3.0 (high):** `vinext init` installed exactly this version. The advisories are in `launch-editor`, which backs the dev server's open-in-editor endpoint, and they affect 8.3.0 to 8.3.2.
- **`braces` (high):** reached only through `eslint-config-next` → `fast-glob` → `micromatch`, and through `vinext`'s build-time `vite-plugin-commonjs`.
- **`fflate` 0.7.3 (moderate):** reached through `vinext` → `@vercel/og` → `satori`, which only `next/og` uses.

Only T-001 edits `package.json` (`T-001-scaffold-owns-dependencies-and-shared-types.md`), so no later ticket can make these fixes.

## Decision
- Pin `vite` to 8.3.3 (`^8.3.3`). It's the first release outside the advisory range, published 2026-10-06. `npm audit fix` would have taken 8.3.5, published the day before this ticket.
- Leave `braces` and `fflate`. Both fixes need `npm audit fix --force`, which downgrades `eslint-config-next` or `vinext`. Neither package reaches the deployed Worker's request path: one is lint and build tooling, and the other is unused by this app.

## Alternatives
- Keep `vite` 8.3.0 as vinext init installed it: leaves a high advisory in every developer's dev server.
- `npm audit fix --force`: downgrades the framework packages this repo depends on.

## Consequences
- The security audit should expect the 12 remaining `npm audit` entries, which are these two chains and their dependents.
- Revisit when `eslint-config-next` or `vinext` ships a release with patched transitive dependencies. That's a `package.json` change, so it needs a ticket that owns it.
