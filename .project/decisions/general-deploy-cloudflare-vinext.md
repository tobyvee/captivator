---
title: "The MVP deploys to Cloudflare Workers with vinext, not Vercel"
type: decision
project: captivator
ticket: [T-001, T-029, T-030, T-031]
decided_by: user
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, deploy, infra]
---
# The MVP deploys to Cloudflare Workers with vinext, not Vercel

## Context
The spec and PRD deploy the MVP on Vercel, linked to the GitHub repo. The user can't open a Vercel account because it won't accept their phone number. They chose Cloudflare via [vinext](https://vinext.dev/) instead: Cloudflare's Vite plugin that reimplements the Next.js 16 API and deploys to Workers.

## Decision
The code stays a standard Next.js 16 App Router app. `create-next-app` scaffolds it, `vinext init --platform=cloudflare` adds the Vite and Cloudflare config, and vinext builds it and deploys it to Cloudflare Workers.

## Alternatives
- Vercel: the user can't open an account.

## Consequences
- **Versions:** Next.js is pinned to 16, the major vinext targets. vinext needs Node 22 or newer.
- **Build and tests:** the build is `vitest run && vite build`. Vitest keeps its own `vitest.config.ts`, without the vinext or Cloudflare plugins.
- **Secrets:** `UNSPLASH_ACCESS_KEY` is a Worker secret in production and goes in `.dev.vars` locally (gitignored; `.dev.vars.example` is committed). `process.env` holds Worker secrets only with Node.js compatibility and a compatibility date of 2025-04-01 or later, so the scaffold sets both.
- **Caching:** an `s-maxage` header on a route handler response isn't cached in front of a Worker, and module memory is per isolate. So the Unsplash route caches through vinext's data cache (`T-031-unsplash-cache-in-data-cache.md`).
- **Maturity:** vinext is under active development. Check its compatibility and differences pages before relying on a `next/*` feature. Its `next/font/google` loads fonts from Google's CDN at runtime. That only affects the editor chrome: exported pages still make no external requests.
- **Shared platform:** the production portal service already targets Cloudflare Workers with Hono, so the MVP and production now run on the same platform.
- **What this overrides:** the Vercel text in the spec and PRD, and the Vercel note in `general-stretch-tickets-scheduled.md`'s consequences.
