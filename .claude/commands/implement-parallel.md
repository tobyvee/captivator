---
description: Implement a wave of independent tickets in parallel, one subagent per ticket in its own git worktree, then land them one at a time, each reviewed, recorded, committed and pushed
argument-hint: "wave N | T-NNN T-NNN ..."
---

# Implement tickets in parallel

Run several tickets at once, each in an isolated worktree, then land them on the current branch one at a time, keeping history linear. Each ticket is merged, reviewed, recorded, committed and pushed before the next one starts landing (`general-push-after-each-ticket.md`, `general-review-each-ticket-before-push.md`). `$ARGUMENTS` is either `wave N` (read from `.project/tickets/INDEX.md`; run `/prioritise-tickets` first if there are no waves) or a list of ticket IDs.

## 1. Preflight (stop on any failure)

- The repo has at least one commit, and the working tree is clean (`git status --porcelain` is empty, including `.project/`). Worktrees branch from `HEAD`, so uncommitted code or ticket edits would be invisible to them.
- The current branch has an upstream and matches it: run `git fetch`, then `git rev-list --left-right --count @{u}...HEAD` must print `0	0`. Each ticket is pushed as it lands, so a branch that's behind would have its push rejected, and one that's ahead would publish commits this run didn't review. If there's no upstream, stop and ask the user; don't create one.
- Every ticket is `todo`, and every `depends_on` is `done`.
- **Re-check parallel safety yourself:** no two tickets' `touches` overlap (directories overlap with the files inside them), and at most one ticket changes `package.json`. If a pair clashes, drop the lower-priority one from this run and say so.
- At most 4 tickets.
- Note `HEAD` as the base commit. Don't change ticket statuses yet; each ticket is recorded as it lands (step 3).

## 2. Fan out

Launch one agent per ticket **in a single message**, each with `isolation: "worktree"`.

- **`nextjs-specialist`:** for tickets that touch Next.js or its build itself:
  - the scaffold
  - `src/app/`
  - `next.config.*`, `vite.config.ts` and `cloudflare.config.ts`
  - the persisted store's hydration
  - the tag `infra`
- **`ticket-implementer`:** for everything else.

Both follow the same ticket rules. The prompt only needs the ticket ID and, for UI tickets, the canvas artboard to match. The agent reads the ticket, spec, `CLAUDE.md` and test conventions from its worktree. Its definition (`.claude/agents/ticket-implementer.md`) holds the rules: stay inside `touches`, write nothing under `.project/` except new decision files, write tests with the code, commit with the ticket ID, and never push.

Don't do anything else while they run. Wait for every agent to finish.

Read each result before landing anything. A ticket whose agent returned `blocked`, or reported editing files outside `touches`, isn't landed. Record it as `blocked` in step 4, and leave its worktree for inspection.

## 3. Land each ticket: merge, verify, record, push

Take the tickets one at a time, in wave order (highest priority first, then most downstream dependants). Finish each one, pushed, before starting the next. That way every push is a ticket that's been reviewed and recorded.

1. **Merge.** Note `HEAD` as `<pre>`. Run the `branch-integrator` agent (no worktree; it works on the current branch). Give it the current branch, the wave's base commit, and this one ticket's ID, branch name and `touches` list. It rebases the branch onto the current branch, fast-forwards, runs the tests, fixes only mechanical conflicts and removes the merged worktree. Its definition is `.claude/agents/branch-integrator.md`. If it blocks the ticket, keep its reason for step 4 and move on to the next ticket.
2. **Verify `<pre>..HEAD`** the way `/implement-ticket` step 3 does, except that every fix is committed (run the fixing agents with commits on):
   - **`code-reviewer`:**
     - Must-fix findings: have `nextjs-specialist` fix them, then re-run the reviewer until the verdict isn't "changes required".
     - Should-fix findings: fix them if they're small. Otherwise put them under the ticket's `## Notes`.
   - **`splash-auditor`:** run it if the ticket touches `src/splash/` or `src/lib/export.ts`, and fix its failures.
   - **`security-auditor`:** run it if the ticket touches a trust boundary (the list in `/implement-ticket` step 3).
     - Critical and high findings: `security-fixer` fixes them, then re-run the auditor to confirm.
     - Medium findings: fix them the same way if the fix is small. Otherwise create a follow-up ticket with `/plan-tickets "<finding>"` and give it top priority in the next wave.
     - Low findings: put them under the ticket's `## Notes`.
     - If the audit had findings, save it as `.project/review/<YYYY-MM-DD>-security-<ticket-id>-review.md` (frontmatter `type: review`, no `status`).
   - **`needs decision`** from any fixer: stop and ask the user before pushing anything more.

   **If a must-fix, critical or high finding can't be resolved, don't push the ticket.**
   1. Keep its work on a branch: `git branch blocked/<ticket-id>`.
   2. Reset the current branch to `<pre>` with `git reset --hard <pre>`. Nothing after `<pre>` has been pushed.
   3. Record it as `blocked` in step 4, and move on to the next ticket.
3. **Record** it the way `/implement-ticket` step 4 does:
   - **Decisions:** log each choice this step forced (`decided_by: main session`), such as a finding deferred or an acceptance criterion left unmet. Then add a `## Decisions` list to the ticket that links every decision file naming it. Find them with `git diff --name-only --diff-filter=A <pre>..HEAD -- .project/decisions/`, plus any you just wrote.
   - **Status:** set `status: done`, tick the acceptance criteria you've verified, and bump `updated:`.
   - **Indexes:** tick the ticket in `STATUS.md`, then update `INDEX.md`.
   - **Milestone:** if no other `todo` ticket shares its `milestone:`, run the `milestone-reviewer` agent first. Its suggested commit message wins for this commit.
4. **Commit and push.** Commit those `.project/` changes, including any review doc, e.g. `Record text panel as done (T-012)`, ending with the attribution trailer Claude Code currently specifies. Then run `git push`.

   If the push is rejected, stop. Never force-push, and don't pull or rebase over the rejection. Report the state and which tickets haven't landed yet.

## 4. Close the wave

Once every ticket is pushed or blocked:

- **Security across the wave.** Run the `security-auditor` agent on `<base>..HEAD`, because tickets that are each safe can combine into a hole. If this wave closes the final milestone, use scope `full` instead. Handle its findings as in step 3: `security-fixer` commits each fix, you re-run the auditor, then push. If there were findings, save the audit as `.project/review/<YYYY-MM-DD>-security-wave-<N>-review.md` (frontmatter `type: review`, no `status`), with each finding's outcome and fix commit.
- **Decisions.** Log each choice this command made that step 3 didn't already log, following CLAUDE.md's **Decision log** (`decided_by: main session`):
  - a ticket not landed, or recorded as `blocked`
  - a finding deferred to a later wave
  - a ticket dropped from the wave for clashing `touches`

  Log the user's answer to any `needs decision` as `decided_by: user`.
- **Blocked tickets.** For each one:
  - Set `status: blocked`.
  - Put the reason under `## Notes`, with its `blocked/<ticket-id>` branch or worktree if it has one.
  - Add its `## Decisions` list.
- **Indexes.** Update `INDEX.md` and `STATUS.md`, using `/project-update` for the Summary.
- **Commit and push.** Commit these `.project/` changes together, e.g. `Close wave 2: T-012 blocked`, then push. Skip this if nothing changed.
- **Report:**
  - A table with each ticket, its result (pushed / blocked) and its commits.
  - The security findings by severity, and what happened to each.
  - The final test results.
  - The time spent against the wave's estimate.
  - The next command: the next wave, or `/prioritise-tickets` if anything was blocked.

Only the current branch is pushed, and only from step 3 and this step. Ticket branches and worktrees stay local, and nothing is force-pushed.
