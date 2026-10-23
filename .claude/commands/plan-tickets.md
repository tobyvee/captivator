---
description: Break the tech spec (or a described piece of work) into small, dependency-tagged tickets in .project/tickets/
argument-hint: "[all | build step N | free-text description of new work]"
---

# Plan tickets

Turn work into tickets in `.project/tickets/` that `/prioritise-tickets` can schedule and `/implement-parallel` can run side by side. `$ARGUMENTS`:

- **empty or `all`:** the whole **Build plan** in `.project/spec/Captivator MVP — Tech Spec.md`.
- **`build step N`:** just that milestone.
- **anything else:** a description of new or changed work. Check it against the spec first. If it contradicts the spec or belongs to the PRD's production path (gateway integration, guest authentication, accounts, publishing), say so and ask before ticketing it.

## 1. Delegate the split

Run the `ticket-planner` agent with the scope. It reads the spec, the canvas, existing tickets and the code, then writes the ticket files. Its definition (`.claude/agents/ticket-planner.md`) holds the split rules and the ticket format.

When it returns, check its work before recording anything:

- Spot-check two or three tickets against the spec.
- Confirm no two tickets share a file in `touches` unless one depends on the other.
- Confirm every build-plan item in scope has a ticket.

If any of these fail, send the problems back to the same agent (`SendMessage`) to fix rather than patching the tickets yourself.

The planner logs its own planning decisions in `.project/decisions/`. If you asked the user whether to ticket out-of-spec work, log their answer too (`decided_by: user`), following CLAUDE.md's **Decision log**. Add a `## Decisions` list to each ticket that has decision files, linking them.

## 2. Record

1. Create or update `.project/tickets/INDEX.md` with **no `status:` in its frontmatter**, so the dashboard doesn't count it as a ticket. Use `type: reference` and include a table with ID, title, priority, milestone, estimate, depends_on and status.
2. Add one `- [ ] T-NNN: title` line per new ticket under `## Planned` in `STATUS.md`, and bump `updated:` in both files.
3. Commit the new tickets, decision files, `INDEX.md` and `STATUS.md` together, e.g. `Plan tickets for build steps 1–9`, so the tickets exist at `HEAD` before any worktree branches from it.
4. Report the ticket count, the total estimate, which tickets can start now, and any spec gaps the planner found. Then suggest `/prioritise-tickets`.
