---
title: "Scripts use vinext's standard names, and vinext init's dependency placement is kept"
type: decision
project: captivator
ticket: T-001
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, infra, deploy]
---
# Scripts use vinext's standard names, and vinext init's dependency placement is kept

## Context
The ticket asks for `dev`, `build` and `start` to become the vinext scripts, a `deploy` script, and `@vinext/cloudflare` as a dev dependency. `vinext init --platform=cloudflare` (vinext 1.3.0) generated `dev:vinext: vite dev --port 3001`, `start:vinext: vite preview` and `deploy:vinext: vinext-cloudflare deploy`. It put `vinext`, `@vinext/cloudflare` and `react-server-dom-webpack` in `dependencies`. The 3001 port exists only so the vinext server can run beside `next dev`. `create-vinext-app`, vinext's starter for vinext-only projects, uses `vite dev` with no port flag.

## Decision
- **Scripts:** `dev: vite dev`, `build: vitest run && vite build`, `start: vite preview`, `deploy: vinext-cloudflare deploy`, `test: vitest run`, `lint: eslint`. This is the set `create-vinext-app` generates, plus `test` and the Vitest-first `build`.
- **Dependencies:** `@vinext/cloudflare` stays in `dependencies`, where vinext init put it. The lockfile pins it for CI either way.
- **`@types/node`:** raised from `^20` to `^22`, which matches the Node 22 floor and Vitest 5's peer range.

## Alternatives
- Keep `--port 3001`: it only avoided a clash with `next dev`, which is no longer a script.
- `start: vinext start`: vinext init's Cloudflare target generates `vite preview`, which runs the built Worker in workerd.
- Move `@vinext/cloudflare` to `devDependencies` as the ticket says: departs from vinext's own placement, and it also ships the runtime adapters T-031 imports (`kvDataAdapter`). Placement doesn't change the Worker bundle.

## Consequences
- `npm run dev` serves on Vite's default port, http://localhost:5173. `npm run start` serves the built Worker on http://localhost:4173.
- The README (T-030) and CLAUDE.md's planned commands (`next build`, Vercel) should be updated to match.
