---
title: "The Worker is named app, so the live URL is app.captivator.workers.dev"
type: decision
project: captivator
ticket: none
decided_by: user
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, deploy, infra]
---
# The Worker is named app, so the live URL is app.captivator.workers.dev

## Context
`general-deploy-via-github-actions.md` makes the live URL the Worker's `workers.dev` address, which is `<worker name>.<account subdomain>.workers.dev`. The account subdomain is `captivator` and the Worker was also named `captivator`, giving `captivator.captivator.workers.dev`.

## Decision
The Worker's `name` in `cloudflare.config.ts` is `app`, so the live URL is `https://app.captivator.workers.dev`.

## Alternatives
- Keep `captivator`: works, but repeats the name in the URL.
- A custom domain route: needs a domain on Cloudflare, which the project doesn't have.

## Consequences
- Cloudflare treats the rename as a new Worker. The old `captivator` Worker stays deployed until the user deletes it.
- Worker secrets are per Worker, so `UNSPLASH_ACCESS_KEY`, if Unsplash ships, is set on `app`.
- Another Worker on this account would need a different name.
