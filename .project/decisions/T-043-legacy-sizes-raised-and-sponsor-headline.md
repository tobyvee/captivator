---
title: "Saved 12–15px text is raised to 16 on load, Sponsor's headline drops to 34px, and the floor covers text blocks only"
type: decision
project: captivator
ticket: T-043
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, schema, templates, persistence]
---
# Saved 12–15px text is raised to 16 on load, Sponsor's headline drops to 34px, and the floor covers text blocks only

## Context
The user set a 16px floor for text blocks ([`T-043-text-size-floor-16.md`](T-043-text-size-floor-16.md)). That raised three questions:
- **Saved designs:** browsers may hold designs saved with 12–15px text.
- **Sponsor:** its subheading was 15px, and its compact height was already within about 2px of the 600px fit limit.
- **Scope:** the guest page also has fixed small text that isn't a text option: the terms row label (14px), the terms body (15px), Connected's sponsor thanks (15px) and the photo credit (11px).

## Decision
- **Saved designs:** the schema raises a stored whole-number size of 12–15 to 16, rather than rejecting the design. Anything the old schema rejected still fails, including fractions and sizes below 12.
- **Sponsor:** the subheading goes to 16px, and the headline from 36px to 34px. That keeps its estimated compact height at 597.5px.
- **Scope:** the floor covers the customer's text blocks, which is what the user's message named ("the text options"). The renderer's fixed small text is unchanged, and the user has been asked whether it should follow.

## Alternatives
- **A plain `min(16)`:** a design saved with 12–15px text would fail to restore and fall back to the template, losing its owner's work.
- **A `Design` version bump with a migration:** heavier than a clamp, for one field.
- **Keep Sponsor's 36px headline:** the default Sponsor would sit at or past the fold and show "Too tall for small phones".

## Consequences
A restored design can change size silently, but only upwards, to 16px. The stored copy keeps its old size until the next edit is saved.
