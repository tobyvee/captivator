---
description: Implement a wave of independent tickets in parallel, one subagent per ticket in its own git worktree, then merge them back one at a time with tests in between
argument-hint: "wave N | T-NNN T-NNN ..."
---

# Implement tickets in parallel

Run several tickets at once, each in an isolated worktree, then integrate them into a linear history on the current branch. `$ARGUMENTS` is either `wave N` (read from `.project/tickets/INDEX.md`; run `/prioritise-tickets` first if there are no waves) or a list of ticket IDs.

## 1. Preflight (stop on any failure)

- The repo has at least one commit, and the working tree is clean (`git status --porcelain` is empty, including `.project/`). Worktrees branch from `HEAD`, so uncommitted code or ticket edits would be invisible to them.
- Every ticket is `todo`, and every `depends_on` is `done`.
- **Re-check parallel safety yourself:** no two tickets' `touches` overlap (directories overlap with the files inside them), and at most one ticket changes `package.json`. If a pair clashes, drop the lower-priority one from this run and say so.
- At most 4 tickets.
- Note `HEAD` as the base commit. Don't change ticket statuses yet; everything under `.project/` is updated once, after integration (step 4).

## 2. Fan out

Launch one agent per ticket **in a single message**, each with `isolation: "worktree"`.

- **`nextjs-specialist`:** for tickets that touch Next.js itself:
  - the scaffold
  - `src/app/`
  - `next.config.*`
  - the persisted store's hydration
  - the tag `infra`
- **`ticket-implementer`:** for everything else.

Both follow the same ticket rules. The prompt only needs the ticket ID and, for UI tickets, the canvas artboard to match. The agent reads the ticket, spec, `CLAUDE.md` and test conventions from its worktree. Its definition (`.claude/agents/ticket-implementer.md`) holds the rules: stay inside `touches`, write nothing under `.project/` except new decision files, write tests with the code, and commit with the ticket ID.

Don't do anything else while they run. Wait for every agent to finish.

Read each result before integrating. A ticket whose agent returned `blocked`, or reported editing files outside `touches`, isn't integrated. Mark it `blocked` in step 4 and leave its worktree for inspection.

## 3. Integrate, one ticket at a time

Run the `branch-integrator` agent (no worktree; it works on the current branch). Give it:

- The current branch and the base commit.
- The tickets to merge, in wave order (highest priority first, then most downstream dependants), each with its branch name and `touches` list.

It rebases each branch onto the current branch in turn, fast-forwards, runs tests after every merge, fixes only mechanical conflicts, removes merged worktrees, and returns a merged/blocked table. Its definition is `.claude/agents/branch-integrator.md`.

Check its result: `git log --oneline <base>..HEAD` should be linear, with one commit per ticket plus any separate fix commits, and the final tests must pass. Carry each blocked ticket's reason into its `## Notes` in step 4.

## 4. Review and record

- **Security first.** Run the `security-auditor` agent on `<base>..HEAD` of the integrated tree, even if every ticket looked safe on its own, because merged tickets can combine into a hole. If this wave closes the final milestone, use scope `full` instead. Then act on its findings:
  - **critical and high:** run the `security-fixer` agent in the main tree with commits on, one per fix. The wave isn't recorded as done until they're fixed and the suite passes. Re-run the auditor on the fixer's commits to confirm.
  - **medium:** fix the same way if the fix is small. Otherwise create a follow-up ticket with `/plan-tickets "<finding>"` and give it top priority in the next wave.
  - **low:** list in the review doc below.
  - **`needs decision`** from the fixer: stop and ask the user before recording the wave.

  If there were findings, save the audit as `.project/review/<YYYY-MM-DD>-security-wave-<N>-review.md` (frontmatter `type: review`, no `status`) with each finding's outcome and fix commit.
- **Code review.** Run the `code-reviewer` agent on `<base>..HEAD`.
  - **must-fix findings:** have the `nextjs-specialist` agent fix them in the main tree with commits on, then re-run the reviewer until it no longer returns "changes required". A ticket with an unresolved must-fix is recorded as `blocked`, not `done`.
  - **should-fix findings:** fix them the same way if they're small. Otherwise record them in the ticket's `## Notes` for a later wave.
- If any merged ticket touches `src/splash/` or `src/lib/export.ts`, run the `splash-auditor` agent on the integrated tree.
- If this wave completes a build-plan milestone, run the `milestone-reviewer` agent and report its verdict.
- **Decisions.** The implementers', integrator's and fixers' decision files arrived with their commits. Now log, following CLAUDE.md's **Decision log**, each choice this command made itself (`decided_by: main session`):
  - a ticket not integrated, or recorded as `blocked`
  - a finding deferred to a later wave
  - a ticket dropped from the wave for clashing `touches`

  Log the user's answer to any `needs decision` as `decided_by: user`. Then add a `## Decisions` list to each ticket in the wave, linking every decision file whose `ticket:` names it. To find them, run `git diff --name-only --diff-filter=A <base>..HEAD -- .project/decisions/`, plus any new files you wrote.
- Set each merged ticket to `status: done`, with its acceptance criteria ticked as reported and verified. Bump `updated:`.
- Update `INDEX.md` and `STATUS.md`, using `/project-update` for the Summary.
- Commit all the `.project/` changes for the wave (including any security review doc and your decision files) in one commit, e.g. `Record wave 2: T-010, T-011 done, T-012 blocked`.
- Report a table with each ticket, its result (merged / blocked) and a one-line note. Then give the security findings by severity and what happened to each, the integrated test results, the time spent against the wave's estimate, and the next command (the next wave, or `/prioritise-tickets` if anything was blocked).

Don't push unless asked.
