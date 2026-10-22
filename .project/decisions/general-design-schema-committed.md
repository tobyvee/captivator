---
title: "design-schema.ts from the design phase is committed at src/lib"
type: decision
project: captivator
ticket: none
decided_by: user
supersedes:
updated: 2026-10-21
tags: [project, captivator, decision, schema]
---
# design-schema.ts from the design phase is committed at src/lib

## Context
Review finding 7: the spec used `design-schema.ts` "from the design phase" as-is, but the file wasn't in the repo.

## Decision
The user saved it as `src/lib/design-schema.ts`, and the spec now points there. It's used as-is.

## Alternatives
- Regenerate it from the PRD's *Design schema* section: unnecessary now that the original exists.

## Consequences
Review findings 8 (the URL scheme allowlist) and 10 (sponsor block, Terms sheet fallbacks, Error screen) remain open against this file. It already has `inputBg`/`inputText` and `version: 2`, which settle part of 10 and explain `captivator:v2` in 11.
