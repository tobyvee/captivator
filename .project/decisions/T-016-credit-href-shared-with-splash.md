---
title: "The Background panel links the photo credit with the splash renderer's profileHref, not a copy"
type: decision
project: captivator
ticket: [T-016, T-006]
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, splash, unsplash]
---
# The Background panel links the photo credit with the splash renderer's profileHref, not a copy

## Context
T-016's panel shows "Photo by {name} on Unsplash" with links, and its first version copied `profileHref` (the Unsplash origin re-check and the referral parameters) and `UNSPLASH_HOME` line for line from `src/splash/Background.tsx`. The review flagged the copy: if the allowlist rule or the parameters change, the two would drift, and the panel's copy had no test for a non-Unsplash URL. `Background.tsx` belongs to T-006, which is done, and no open ticket claims it.

## Decision
`src/splash/Background.tsx` exports `profileHref` and `UNSPLASH_HOME`, and the panel imports them. Nothing else in the splash file changes.

## Alternatives
- **Keep the copy:** the drift risk above.
- **A new `src/splash/credit.ts`:** cleaner, but moves T-006's code for two exports.
- **Move them to `src/lib/`:** the splash renderer must stay portable with no editor imports; `lib` is fine for it, but the helpers belong with the credit they build.

## Consequences
The editor imports from `src/splash`, the allowed direction. The splash tests that cover `profileHref` now cover both callers. A change to the credit link rules is a splash change and gets the splash and security audits.
