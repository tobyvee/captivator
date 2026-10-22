---
title: "T-021 edits SplashPage.test.tsx once, to widen the class guard for a terms-on export"
type: decision
project: captivator
ticket: [T-021, T-005]
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, splash, tests]
---
# T-021 edits SplashPage.test.tsx once, to widen the class guard for a terms-on export

## Context
`T-021-cv-terms-second-export-class.md` allowed `cv-terms` as the export's second class, and asked whoever next owns `SplashPage.test.tsx` to widen its class guard. Until then the guard used a terms-off fixture, so a terms-on export was unguarded. No open ticket owns `SplashPage.test.tsx`, and T-021's review asked for the guard now.

## Decision
`SplashPage.test.tsx` joins T-021's `touches` as a one-off exception, like `T-006-credit-rendered-by-splashpage.md`. The guard checks four things:
- A terms-on export has exactly two classed elements: `cv-root` on the root and `cv-terms` on `section#terms`.
- Edit and preview with the sheet open have none.
- A terms-on export places `#terms` after the photo credit.
- A terms-off export has no `#terms`.

The file's `./Form` mock now spreads the real module, because `TermsSheet` imports `connectButtonStyle` from it. The edit test also checks that clicking the dim layer closes the sheet without selecting the background. `SplashPage.tsx` is unchanged.

## Alternatives
- **Leave the guard for a later ticket:** a terms-on export stays unguarded, and no planned ticket picks it up.
- **Duplicate the check in `TermsSheet.test.tsx`:** that file already guards the sheet alone, but it can't see the composition or the root's class.

## Consequences
Later tickets that replace a stub still don't edit `SplashPage.test.tsx` without logging an exception like this one.
