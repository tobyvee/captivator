---
title: "The splash font stack names Segoe UI without quotes"
type: decision
project: captivator
ticket: T-040
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, splash, export]
---
# The splash font stack names Segoe UI without quotes

## Context
The user noticed `&quot;Segoe UI&quot;` in the exported page's root `style` attribute. React writes inline styles into double-quoted attributes, so it escapes a `"` in a value as `&quot;`, and a `'` as `&#x27;`. The browser decodes these before it reads the CSS, so the page rendered correctly, but the markup was noisier than it needed to be.

## Decision
Write the family name unquoted (`Segoe UI`) in `SplashPage`'s `FONT` and in the export's `body` rule. CSS allows an unquoted family name made of plain words. A test checks that no template's style attributes contain an entity.

## Alternatives
- **Single quotes:** React escapes those too, as `&#x27;`.
- **Drop the root's inline font and rely on the export's `body` rule:** `SplashPage` must render the same in every consumer, and the editor and the portal service don't use that rule.

## Consequences
Any future family name that needs quotes, such as one starting with a digit, would bring the entity back. The test catches that.
