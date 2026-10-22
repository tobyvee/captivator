---
title: "T-022 adds Form.error.test.tsx, Connected.test.tsx and ScreenSwitcher.test.tsx beside the files it owns"
type: decision
project: captivator
ticket: T-022
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, testing]
---
# T-022 adds Form.error.test.tsx, Connected.test.tsx and ScreenSwitcher.test.tsx beside the files it owns

## Context
The only test file in the ticket's `touches` is `validate.test.ts`. But the ticket also asks for a test that the export terms link has `id="cv-terms-link"` and a test that clicks on Connected's empty space fall through, and it requires `Form.test.tsx` to pass unchanged. The other components it changes have no test file of their own.

## Decision
Add co-located test files for the files T-022 owns:
- `src/splash/Form.error.test.tsx`: the terms-link id, the Error screen and edit-mode Connect.
- `src/splash/Connected.test.tsx`: layout, colours, the sponsor, CONTINUE, and the click fall-through, tested through SplashPage.
- `src/editor/ScreenSwitcher.test.tsx`: the options, one pressed segment, and the fallback to Landing.

`Form.test.tsx` is untouched.

## Alternatives
- **Extend `Form.test.tsx`:** it's outside `touches`, and the ticket wants it to pass unchanged as proof that the export is unaffected.
- **Test only `validate.ts`:** leaves the id, the click fall-through and the switcher untested.

## Consequences
Two cases in `PreviewStage.test.tsx` still pin T-009's Landing/Terms-only switcher, and they now fail. Whoever owns that file updates them to the four-screen switcher.
