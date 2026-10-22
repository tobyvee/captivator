---
title: "The exported guest page shows the photo credit as plain text, without links"
type: decision
project: captivator
ticket: [T-006, T-030]
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, splash, unsplash, export]
---
# The exported guest page shows the photo credit as plain text, without links

## Context
T-006's ticket asks for the Unsplash credit to link to the photographer and to Unsplash with `target="_blank"`. The T-006 splash audit found this conflicts with the PRD's client-platform constraint: `target=_blank` and `window.open` fail in the iOS login sheet. Before sign-in, unsplash.com isn't reachable from the guest's phone anyway.
- **iOS:** a tap does nothing, or hands off to Safari and takes the guest out of the sheet before they're online.
- **Android:** the login WebView navigates away to a page that can't load, and the guest loses what they typed.
- **No `target` at all:** this is worse, because the sheet navigates to a dead page with no back button.

## Decision
In `export` mode, the credit renders as plain text, "Photo: {name} / Unsplash", with no `<a>`. In `edit` and `preview` it keeps both links, which open in the customer's own browser tab. This adds one row to the spec's Render mode table.

## Alternatives
- Keep the links in the export as a known dead or risky tap: this risks the guest's sign-in to satisfy an attribution link nobody can follow before sign-in.
- Drop the credit from the export entirely: Unsplash asks for attribution, and plain text keeps the attribution.

## Consequences
- Unsplash's guidelines ask for linked attribution "where possible". The README's path to production (T-030) lists this with the existing open question about Unsplash on publish. A production portal can link the credit after sign-in, on the Connected page.
- T-006's acceptance criterion about `target="_blank"` links applies to `edit` and `preview` only.
