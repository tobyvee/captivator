---
title: "The export's style block sets the placeholder colour, since placeholders are the visible field labels"
type: decision
project: captivator
ticket: [T-023, T-007]
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, export, accessibility]
---
# The export's style block sets the placeholder colour, since placeholders are the visible field labels

## Context
The T-007 splash audit found that the form's placeholders ("Your name", "Email address") are the only visible field labels. On iOS, WebKit's default placeholder colour (#A9A9A9) is about 2.35:1 on white inputs, which fails WCAG 1.4.3. A placeholder's colour can't be set with an inline style. `general-splash-root-grows-in-frame.md` keeps the export's single `<style>` block as the home for rules inline styles can't express.

## Decision
T-023 adds `.cv-root ::placeholder{color:inherit;opacity:.65}` to `EXPORT_CSS`. Inputs already take `color: inputText`, so the placeholder is that colour at 65%: #111111 on #FFFFFF is about 6:1.

## Alternatives
- Visible `<label>` elements above each field: this changes the canvas look and adds about 20px per field to the fit budget.
- Leave the browser default: Chrome passes, but the iOS login sheet, the main target, fails.

## Consequences
- The editor preview can't apply this rule, because it has no `<style>` block, so placeholders look slightly lighter there than in the export.
- The export's `<style>` holds `body`, `.cv-root`, `.cv-terms`, `:focus-visible` and this rule. Audits shouldn't expect only `:target` and `.cv-root`.
