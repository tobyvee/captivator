---
title: "The Unsplash credit links are small inline text links, not 44px tap targets"
type: decision
project: captivator
ticket: T-006
decided_by: ticket-implementer
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, splash, accessibility]
---
# The Unsplash credit links are small inline text links, not 44px tap targets

## Context
CLAUDE.md asks for tap targets of at least 44px on the splash output. The ticket and the `DesktopPreview` artboard draw the photo credit as a small (11px) corner line, "Photo: {name} / Unsplash", whose two links are its only controls. The line sits 8px from the bottom of the root, just under the Connect button's bottom padding.

## Decision
The two links stay inline text links at the line's own size. They are attribution, not part of signing in, and inline links in a sentence are exempt from WCAG 2.5.8's target-size rule.

## Alternatives
- **Pad each link to a 44px hit area (inline vertical padding):** the credit sits above the content column (`z-index: 2`), so the padded area would reach up to the Connect button and could intercept taps meant for it.
- **Make the line a 44px-tall bar:** departs from the canvas and covers part of the photo on every screen.

## Consequences
The credit is harder to tap on a phone, which only affects guests who want to visit the photographer's page. The splash audit should treat these two links as the documented exception to the 44px rule.
