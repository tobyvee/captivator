---
description: Implement one ticket on the current branch, with tests, checks and a commit, then record it as done
argument-hint: "T-NNN"
---

# Implement a ticket

Implement `$ARGUMENTS` (one ticket ID) in the main working tree. For several independent tickets at once, use `/implement-parallel`.

## 1. Check it's ready

- Read `.project/tickets/$ARGUMENTS-*.md` and the spec sections it links to. For UI tickets, also read the editor canvas artboard it names, read with the Artifact tool following CLAUDE.md's **Reading the canvas** (list its files, then read the artboard by path).
- Find the relevant decisions in `.project/decisions/`, following CLAUDE.md's **Decision log → Reading the log**. They apply whether you build the ticket yourself or delegate it.
- Stop and report if any `depends_on` ticket isn't `done`, or if the working tree has uncommitted changes to files the ticket `touches`.
- Set the ticket's `status: doing` and bump `updated:`. Move its STATUS.md line to `## In progress`.

## 2. Build it

Build it yourself in this session, or, to keep the build's output out of the main context, delegate it to an agent (no worktree) with the ticket ID:

- Use the **`nextjs-specialist`** agent if the ticket touches Next.js itself:
  - the scaffold
  - `src/app/` (pages, layouts, the route handler)
  - `next.config.*`
  - the persisted store's hydration
  - the tag `infra`
- Use the **`ticket-implementer`** agent for everything else.

A delegated agent commits its code and its own decision files, but nothing else under `.project/`. In that case, do step 4's records as a follow-up commit, and still run step 3's checks on its result.

- **Stay inside `touches`.** If the work needs another file, edit it only if no `todo`/`doing` ticket claims that file, and add it to this ticket's `touches`. Otherwise stop and say which ticket owns it.
- Follow CLAUDE.md's architecture rules. The ones most often broken:
  - Panels only dispatch store actions.
  - `src/splash/` uses inline styles and has no editor or Next.js imports.
  - Undo and persistence track `design` only.
  - `FIELD_SPEC` owns input attributes.
- Write the module's tests in the same step. Use the `test-writer` agent, or follow `.claude/agents/test-writer.md` yourself.

## 3. Verify

- Run `npm test`, `npx tsc --noEmit` and `npm run lint` (if it exists). All must pass.
- **Code review.** Run the `code-reviewer` agent on the ticket's diff.
  - **must-fix findings:** fix them before going on. Use the `nextjs-specialist` agent for findings in Next.js, React or TypeScript practice. Re-run the reviewer until the verdict isn't "changes required".
  - **should-fix findings:** fix them if they're inside this ticket's files. Otherwise note them under the ticket's `## Notes`.
  - **Nits:** fix them only if trivial.
- If the ticket touches `src/splash/` or `src/lib/export.ts`, run the `splash-auditor` agent and fix its failures.
- **Security.** If the ticket touches any trust boundary, run the `security-auditor` agent on the ticket's diff. Trust boundaries are:
  - `src/splash/`
  - `src/lib/export.ts`, `images.ts` and `design-schema.ts`
  - the store's persistence
  - `src/app/api/`
  - `next.config.*`, `package.json` and `.gitignore`

  Then act on its findings:
  - **critical and high:** run the `security-fixer` agent with those findings, uncommitted, so the fixes land in this ticket's commit. The ticket isn't done until they're fixed and the full suite passes again.
  - **medium:** fix the same way if the fix is small and inside this ticket's files. Otherwise create a follow-up ticket with `/plan-tickets "<finding>"`.
  - **low:** list under the ticket's `## Notes`.
  - **`needs decision`** from the fixer: stop and ask the user.

  Save the audit as `.project/review/<YYYY-MM-DD>-security-<ticket-id>-review.md` (frontmatter `type: review`, no `status`) only if it had findings, recording each finding's outcome.
- Tick each acceptance criterion in the ticket only once you've checked it. If one can't be met, leave it unticked and explain why under `## Notes`.

## 4. Commit and record

- **Decisions.** Make sure every decision taken on this ticket has a file in `.project/decisions/`, following CLAUDE.md's **Decision log**. That means the decisions you made building it yourself, the agents' decisions (already written by them), and every choice this command forced:
  - a should-fix or medium finding deferred rather than fixed
  - an acceptance criterion left unmet
  - a file added to `touches`
  - the user's answer to a `needs decision`, logged as `decided_by: user`

  Then add a `## Decisions` list to the ticket linking each file.
- Set `status: done`, bump `updated:`, tick the ticket in `STATUS.md`, update `INDEX.md`, and run `/project-update` if the Summary no longer reflects where things stand.
- Commit this ticket's files **together with those `.project/` changes, including its decision files**, so the record moves with the code. Describe the change and end the subject with the ticket ID, e.g. `Text panel with size presets (T-012)`. End the message with the attribution trailer Claude Code currently specifies.
- If this ticket closes the final milestone (the README and deploy step), first run `security-auditor` with scope `full`, and handle its findings as in step 3.
- If this ticket finishes a build-plan milestone (no other `todo` tickets share its `milestone:`), first run the `milestone-reviewer` agent. Its suggested commit message wins for the commit that closes the milestone.
- Report what was built, the test results and the next ready ticket.

Don't push unless asked.
