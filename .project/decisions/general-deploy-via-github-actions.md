---
title: "A GitHub Actions workflow tests and deploys every push to main"
type: decision
project: captivator
ticket: [T-001, T-030]
decided_by: main session
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, deploy, infra, security]
---
# A GitHub Actions workflow tests and deploys every push to main

## Context
Vercel built and deployed every push without any config, and because its build ran Vitest, a failing test blocked the deploy. Moving to Cloudflare Workers (`general-deploy-cloudflare-vinext.md`) means choosing how a push turns into a deploy.

## Decision
T-001 adds `.github/workflows/deploy.yml`. On every push to `main` it runs `npm ci` and `npm run build` (tests first), then the vinext Cloudflare deploy. It authenticates with two repository secrets that the user adds: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

## Alternatives
- Workers Builds (Cloudflare's Git integration): needs no workflow file, but vinext's docs don't cover it, so it's untested with the `cloudflare.config.ts` that vinext generates.
- Deploying from the main session with `npx @vinext/cloudflare deploy`: needs a logged-in CLI on the user's machine, and deploys only while a session is running.

## Consequences
- The workflow runs only on pushes to `main` and manual runs, never on pull requests, and has read-only `contents` permission. Forks can't reach the token.
- The user creates the API token (the "Edit Cloudflare Workers" template) and adds both secrets before T-001 is pushed. Without them, the first deploy fails.
- The live URL is the Worker's `workers.dev` address unless the user adds a custom domain.
- CLAUDE.md's "There is no separate CI" no longer holds: this workflow is the CI.
