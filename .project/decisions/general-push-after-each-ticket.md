---
title: "Each finished ticket is committed and pushed before the next one lands"
type: decision
project: captivator
ticket: none
decided_by: user
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, workflow, git]
---
# Each finished ticket is committed and pushed before the next one lands

## Context
`/implement-parallel` committed a wave's records once, after every ticket had merged. Neither it nor `/implement-ticket` pushed unless asked. The user asked for each ticket in a wave to be committed and pushed as it's completed.

## Decision
`/implement-ticket` pushes once the ticket's code and records are committed. `/implement-parallel` lands the wave's tickets one at a time and commits and pushes each ticket's record before landing the next.

## Alternatives
- One record commit per wave, pushed only when asked: the old rule. Progress didn't reach GitHub or the live app until the user pushed.

## Consequences
- Every push to `main` runs the deploy workflow (`general-deploy-via-github-actions.md`), so each ticket deploys as it lands.
- Both commands now check that the branch has an upstream and matches it before they start.
- Only the main session pushes. Agents never push, and nothing force-pushes.
