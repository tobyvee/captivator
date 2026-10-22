---
title: "The user sets the UNSPLASH_ACCESS_KEY Worker secret before T-031 is pushed, so the declaration stays"
type: decision
project: captivator
ticket: [T-031, T-001]
decided_by: user
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, unsplash, deploy, secrets]
---
# The user sets the UNSPLASH_ACCESS_KEY Worker secret before T-031 is pushed, so the declaration stays

## Context
T-031's review asked whether declaring `UNSPLASH_ACCESS_KEY: bindings.secret()` breaks a deploy while the secret is unset. It does: the installed `cf` deploy turns a declared secret into Wrangler's `secrets.required`, adds an inherit binding for any missing one, and fails the deploy naming it ("The following required secrets have not been set"). `T-001-unsplash-secret-binding-in-t031.md` assumed the only cost was a local dev warning. The deploy also uploads with `keepSecrets: true`, so a secret set on the Worker survives deploys whether or not it's declared. A probe route under `vite dev` showed the key reaches the Worker locally only when it's declared.

## Decision
Keep the declaration. The user sets the production secret on the `app` Worker (`npx wrangler secret put UNSPLASH_ACCESS_KEY --name app`, or the dashboard) before T-031 is pushed, and the deploy run is checked after the push.

## Alternatives
- **Declare it only outside CI:** dev keeps the key and CI deploys never require it, at the cost of a config branch on the environment.
- **Don't declare it:** deploys never need it and production works once set, but local dev search always says "Photo search is not set up".

## Consequences
The Unsplash key is now required to deploy: a fresh Worker, or one whose secret is deleted, can't be deployed until it's set. The README's path to production must say so.
