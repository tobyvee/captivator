---
title: "T-031, not the scaffold, declares UNSPLASH_ACCESS_KEY as a secret binding"
type: decision
project: captivator
ticket: [T-001, T-031]
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, deploy, unsplash, security]
---
# T-031, not the scaffold, declares UNSPLASH_ACCESS_KEY as a secret binding

## Context
The ticket sets Node.js compatibility and a compatibility date of 2025-04-01 or later so Worker secrets reach `process.env`, and says to add no bindings. vinext 1.3.0's init generates `cloudflare.config.ts` for the `cf` CLI and Cloudflare Vite plugin v2. In local dev, that plugin builds the Worker's env only from the bindings declared in the config's `env`. A secret needs `bindings.secret()` from `cf/config`, and its local value then comes from `.dev.vars` (used exclusively when it exists), or else from `.env` files and the process environment. An undeclared `.dev.vars` value never reaches the Worker in dev.

## Decision
The scaffold sets `nodejs_compat` and a compatibility date of 2026-10-22, and leaves `env` with only the generated `ASSETS` binding. T-031 adds `UNSPLASH_ACCESS_KEY: bindings.secret()` next to its `VINEXT_KV_CACHE` binding.

## Alternatives
- Declare the secret now: goes against the ticket's "add no bindings". It would also make every local dev session warn about a missing secret for an optional stretch feature.

## Consequences
- Without the declaration, T-031's route reads `undefined` in local dev. The declaration also documents and types the secret for production.
- The gitignored root `.env` is a fallback source of the local value when no `.dev.vars` exists.
- The user sets the production value as a Worker secret.
