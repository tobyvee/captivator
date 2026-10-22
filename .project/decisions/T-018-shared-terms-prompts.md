---
title: "Photo hero and Minimal reuse Sponsor's bracketed terms wording"
type: decision
project: captivator
ticket: T-018
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, templates, terms]
---
# Photo hero and Minimal reuse Sponsor's bracketed terms wording

## Context
T-018 gives each new template's terms `mode` and `textColour` but not the `label`, `linkText`, `body` or `version`. The schema requires all of them, even when terms are off, and CLAUDE.md requires bracketed prompts, never invented legal wording.

## Decision
A module-local `TERMS_PROMPTS` in `templates.ts` holds Sponsor's wording ("I agree to the" / "terms of use" / the two bracketed prompt paragraphs, version 1). Sponsor, Photo hero and Minimal all spread it and set their own `mode` and `textColour`. Sponsor's values are unchanged.

## Alternatives
- **Blank's `"[YOUR TERMS OF USE]"` body:** a weaker prompt than Sponsor's, which tells the customer what to cover.
- **Separate wording per template:** no reason for the copy to differ, and it repeats the same text three times.

## Consequences
Switching from Sponsor to Photo hero or Minimal keeps the same placeholder terms, because `loadTemplate` takes the form from the new template. Changing the shared prompt changes all three templates.
