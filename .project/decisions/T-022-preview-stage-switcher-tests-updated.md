---
title: "The main session updates PreviewStage.test.tsx's switcher cases on T-022's branch before merging"
type: decision
project: captivator
ticket: T-022
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, tests]
---
# The main session updates PreviewStage.test.tsx's switcher cases on T-022's branch before merging

## Context
T-022 extends the screen switcher to Landing, Terms, Error and Connected. Two cases in `src/editor/PreviewStage.test.tsx` (owned by T-009, done) pinned T-009's Landing/Terms-only switcher, and T-022's agent was told not to edit that file, as with `editor.test.tsx` (`general-inspector-test-leaves-panels-to-their-tests.md`).

## Decision
The main session edits those two cases on T-022's branch before merging: all four screens while terms are on, and Landing, Error and Connected while terms are off (Sponsor still has fields). The first case is renamed to match. `src/editor/PreviewStage.test.tsx` joins T-022's `touches`.

## Alternatives
- **Merge red and fix after:** a commit on main with failing tests.
- **Let the agent edit it:** agents in parallel worktrees would collide on shared test files.

## Consequences
None beyond the two cases.
