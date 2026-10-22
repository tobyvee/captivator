---
title: "The deploy workflow deploys the tested build with --skip-build and queues runs in push order"
type: decision
project: captivator
ticket: T-001
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, deploy, infra, security]
---
# The deploy workflow deploys the tested build with --skip-build and queues runs in push order

## Context
The ticket asks the workflow to skip the deploy's own build if the installed version can reuse the output, to run deploys in push order without cancelling one another, to pin each action to a version and to use Node 22.

## Decision
- **Build once:** `npm run build`, then `npm run deploy -- --skip-build`. In `@vinext/cloudflare` 1.2.0, deploy's build is `createBuilder({ mode: "production" }).buildApp()`, the same as `vite build`. Locally, `cf deploy --prebuilt --dry-run` accepted the `vite build` output without an account.
- **Order:** `concurrency` with `cancel-in-progress: false` and `queue: max`. GitHub's default queue keeps one pending run and cancels older pending ones; `max` keeps up to 100 pending runs in order.
- **Pins:** each action is pinned to a full commit SHA with its tag in a comment (`actions/checkout` v7.0.1, `actions/setup-node` v7.1.0). Checkout uses `persist-credentials: false`.
- **Node:** 22 with `check-latest: true`. `cf@1.0.0-beta.20` declares engines `^22.23.0 || ^24.22.0 || ^26.12.0`, and a runner's cached 22.x can be older. Its runtime check only requires major 22.
- **Secrets:** the Cloudflare token and account ID are set only in the deploy step's `env`, so `npm ci` and the build never see them.

## Alternatives
- Let deploy rebuild: builds twice for the same output.
- The default concurrency queue: a burst of pushes would skip the intermediate runs, which the ticket rules out.
- Tag pins (`@v7`): tags can be moved, and a SHA can't.

## Consequences
- With `--skip-build`, deploy skips its local prerender step, which runs only for static export or a cache adapter that packages prerendered output. When T-031 adds `kvDataAdapter()`, re-run `npx vinext-cloudflare deploy --dry-run` and confirm `--skip-build` still fits.
- Upgrading either action means updating the SHA and its comment together.
