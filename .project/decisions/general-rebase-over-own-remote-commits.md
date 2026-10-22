---
title: "When a ticket's push is rejected by the user's own commit on disjoint files, rebase and push"
type: decision
project: captivator
ticket: none
decided_by: user
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, workflow, git]
---
# When a ticket's push is rejected by the user's own commit on disjoint files, rebase and push

## Context
In wave 3, T-004's push was rejected because `origin/main` had gained the user's commit `81ac2c4` (the Worker renamed to `app`), made while the wave was running. `/implement-parallel` says to stop on a rejected push and not pull or rebase over it. The user's commit and the unpushed T-004 commits share no files.

## Decision
The user chose to rebase the unpushed commits onto `origin/main`, re-run tests, type-check and lint, then push and carry on. A later rejection of the same kind gets the same treatment without asking: the new remote commits are the user's own, and they share no files with the unpushed ones.

## Alternatives
- Rebase this time, but ask again on the next rejection.
- Stop the run and leave the commits unpushed for the user to sort out.

## Consequences
- Nothing is ever force-pushed. Only unpublished local commits are rebased.
- The run still stops and asks when the remote commits aren't the user's, or when they touch any file the unpushed commits touch.
