---
title: "T-048: Remove the PRD's P1 and Constraints sections"
type: ticket
project: captivator
status: done
priority: P1
milestone: 9
estimate: 5
depends_on: [T-047]
touches:
  - .project/prd/Captive Portal Designer — PRD.md
  - .claude/agents/splash-auditor.md
  - .claude/agents/readme-writer.md
cut_rank:
updated: 2026-10-23
tags: [project, captivator, ticket, docs, prd]
---
# T-048: Remove the PRD's P1 and Constraints sections

## Context
The user: "Remove "P1 — fast follow" section and the entire "Constraints" section from the PRD", then "Remove the "Phasing" section from the PRD. No decision log."

## Scope
- Delete "P1 — fast follow", "Constraints" with all its subsections, and "Phasing".
- Reword anything that pointed at them.

## Acceptance criteria
- [x] None of the three sections remains. *Checked against the PRD's heading list.*
- [x] Nothing in the PRD, the spec, CLAUDE.md, the README or `.claude/` refers to them. *Checked with grep.*
