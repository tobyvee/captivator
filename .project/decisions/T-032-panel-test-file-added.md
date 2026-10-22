---
title: "T-032 adds src/editor/panels/UnsplashSearch.test.tsx for the search panel's jsdom tests"
type: decision
project: captivator
ticket: T-032
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, tests]
---
# T-032 adds src/editor/panels/UnsplashSearch.test.tsx for the search panel's jsdom tests

## Context
T-032's `touches` lists `UnsplashSearch.tsx` and the route's test, but no test for the panel. Its acceptance criteria (the 400ms debounce, the cache, the allowlist refusal, names as text, the fallback message) are behaviour a test can pin. `T-008-editor-test-file-added.md`, `T-016-panel-test-file-added.md` and `T-017-panel-test-file-added.md` set the pattern of a co-located test file per panel.

## Decision
`src/editor/panels/UnsplashSearch.test.tsx` (jsdom, fake timers, `fetch` stubbed) covers the debounce, the cache across spacing and case, blank queries, stale replies, empty results, each failure status, the 429 message, a pick keeping a photo's settings or using the new-photo defaults, the download ping's JSON content type, no second ping for the same photo, allowlist refusals leaving the design unchanged, names rendered as text, unmount cancelling a search, and the credit line in `BackgroundPanel`. Each test searches its own words, because the cache is module-level.

## Alternatives
- **No committed tests:** a regression in the pick or the fallbacks wouldn't fail the build.
- **Cases in `BackgroundPanel.test.tsx`:** owned by T-016.

## Consequences
The real Unsplash API and the hotlinked thumbnails are left to a manual check against a deploy with the key set.
