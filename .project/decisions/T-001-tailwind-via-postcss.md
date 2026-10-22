---
title: "Tailwind runs through PostCSS, and the Turbopack loader config is removed"
type: decision
project: captivator
ticket: T-001
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, infra, styling, next.config]
---
# Tailwind runs through PostCSS, and the Turbopack loader config is removed

## Context
`create-next-app` 16.4.2 wires Tailwind through `turbopack.rules` in `next.config.ts` and the `@tailwindcss/turbopack` loader, with no PostCSS config. vinext ignores Turbopack loader rules: `npx vinext check` flagged `turbopack` as its only partially supported item. `vinext init` generated `postcss.config.mjs` with `@tailwindcss/postcss` instead.

## Decision
Keep the generated `postcss.config.mjs`. Remove the `turbopack` block from `next.config.ts`, which is now an empty config, and uninstall `@tailwindcss/turbopack`.

## Alternatives
- Keep both: the Turbopack block is dead config under vinext, and `vinext check` keeps flagging it.

## Consequences
- `vinext check` reports nothing partial or unsupported.
- Running `next dev` or `next build` directly would no longer compile Tailwind. Neither is a supported workflow in this repo.
