# Claude Code setup

The project's slash commands and subagents for turning the tech spec into tickets and building them. This summary lives here rather than in `commands/` or `agents/`, because Claude Code loads every `.md` file in those folders as a command or agent.

- [`commands/`](commands/): one file per slash command, named after the file. Its frontmatter sets the description and argument hint, and the body is the procedure.
- [`agents/`](agents/): one file per subagent. Its frontmatter sets the name, description and tools, and the body is its instructions.

The commands delegate the heavy work to the agents. You can also call any agent directly. Every agent reads `CLAUDE.md`, the tech spec (`.project/spec/`) and the relevant decisions in `.project/decisions/` before acting (see CLAUDE.md, **Decision log → Reading the log**).

## Commands

Run them in this order:

| Command | Arguments | What it does | Agents it uses |
|---|---|---|---|
| [`/plan-tickets`](commands/plan-tickets.md) | `all`, `build step N`, or a description of new work | Splits the work into small tickets in `.project/tickets/`, then writes `INDEX.md`, updates `STATUS.md` and commits. Asks before ticketing anything outside the spec. | `ticket-planner` |
| [`/prioritise-tickets`](commands/prioritise-tickets.md) | Work the user wants cut (optional) | Orders open tickets into waves of up to 4, where no two tickets in a wave touch the same files. It cuts only the work the user names, and never cuts P0. | — |
| [`/implement-ticket`](commands/implement-ticket.md) | `T-NNN` | Builds one ticket in the main tree, verifies it (tests, type-check, code review, plus splash and security audits where relevant), records it as done and commits code and records together. | `ticket-implementer` or `nextjs-specialist`, `test-writer`, `code-reviewer`, `splash-auditor`, `security-auditor`, `security-fixer`, `milestone-reviewer` |
| [`/implement-parallel`](commands/implement-parallel.md) | `wave N`, or a list of ticket IDs | Runs one agent per ticket in its own git worktree, rebases the branches back one at a time with tests after each, then reviews and audits the merged result and records the wave in one commit. | `ticket-implementer` or `nextjs-specialist`, `branch-integrator`, `security-auditor`, `security-fixer`, `code-reviewer`, `splash-auditor`, `milestone-reviewer` |

## Agents

### Planning

| Agent | What it does | Writes | Used by |
|---|---|---|---|
| [`ticket-planner`](agents/ticket-planner.md) | Splits the spec's build plan, or a described piece of work, into 10–40 minute tickets with `priority`, `milestone`, `estimate`, `depends_on` and `touches`. | Ticket files and decision files | `/plan-tickets` |

### Building

| Agent | What it does | Writes | Used by |
|---|---|---|---|
| [`ticket-implementer`](agents/ticket-implementer.md) | Implements one ticket with tests, staying inside its `touches`, and commits it. | Code, tests, decision files | `/implement-parallel` (one per worktree), `/implement-ticket` |
| [`nextjs-specialist`](agents/nextjs-specialist.md) | Next.js App Router, React and TypeScript expert. Implements tickets that touch Next.js itself (scaffold, `src/app/`, `next.config`, store hydration), fixes `code-reviewer` findings, and answers "the right way in Next.js" questions against the installed version's docs. | Code, tests, decision files | `/implement-ticket`, `/implement-parallel` |
| [`test-writer`](agents/test-writer.md) | Writes a module's Vitest tests from the cases in the spec's test table, then runs them. | Tests, decision files | After writing or changing a module |
| [`branch-integrator`](agents/branch-integrator.md) | Rebases a wave's ticket branches onto the current branch one at a time, runs tests after each, fixes only mechanical conflicts, and blocks the rest. | Merge fixes, decision files | `/implement-parallel` |
| [`readme-writer`](agents/readme-writer.md) | Writes the repo README: what shipped, how it maps to the brief, key decisions and the path to production. | `README.md` | Final build step |

### Reviewing (read-only)

| Agent | What it checks | Used by |
|---|---|---|
| [`code-reviewer`](agents/code-reviewer.md) | Correctness, completeness, concision, readability and Next.js/React/TypeScript practice. Returns must-fix / should-fix / nit findings with a verdict. | `/implement-ticket`, `/implement-parallel` |
| [`splash-auditor`](agents/splash-auditor.md) | The guest-facing page and Export HTML: iOS login sheet and Android WebView compatibility, accessibility, contrast and the 100 KB budget. | After changes to `src/splash/` or export |
| [`milestone-reviewer`](agents/milestone-reviewer.md) | A finished build-plan milestone against the spec and the editor canvas; runs tests and type-checking and suggests the commit message. | Before each milestone commit |
| [`security-auditor`](agents/security-auditor.md) | A diff or the whole repo for security issues, ranked critical to low, each with an exploit scenario, a fix and a regression test. | `/implement-ticket` (trust-boundary tickets), `/implement-parallel` (after each wave), before the final deploy |

### Fixing

| Agent | What it does | Writes | Used by |
|---|---|---|---|
| [`security-fixer`](agents/security-fixer.md) | Fixes given `security-auditor` findings, each with a regression test that fails first, one commit per fix. Returns `needs decision` when a fix would remove a customer-facing capability. | Code, tests, decision files | `/implement-ticket`, `/implement-parallel` |

## Conventions

- **Tickets** carry `status`, `priority` (P0/P1/P2/cut), `milestone`, `estimate`, `depends_on` and `touches` in their frontmatter. `touches` is what makes parallel waves safe.
- **`.project/` is read-only for agents** apart from adding new files to `.project/decisions/`. Only the main session updates tickets, `INDEX.md` and `STATUS.md`, so parallel worktrees can't conflict on them.
- **Every decision gets a file** in `.project/decisions/`, whether an agent or a command made it. Read-only agents can't write, so the calling session logs any choice their results force.
- **Records move with the code.** Ticket status, `INDEX.md`, `STATUS.md` and decision files are committed together with the work they record.
- **Commit subjects** describe the change and end with the ticket ID, e.g. `Text panel with size presets (T-012)`. Security commits and decisions describe the protection, never a working exploit, because the repo is public.
- **Nothing is pushed** unless you ask.
