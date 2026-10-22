---
title: "Unsplash search is debounced in an effect keyed on the normalised query, and caches only successful results"
type: decision
project: captivator
ticket: T-032
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, unsplash, editor, react]
---
# Unsplash search is debounced in an effect keyed on the normalised query, and caches only successful results

## Context
T-032 asks for a 400ms debounce and a module-level `Map` cache per query, but leaves open what the cache is keyed by, whether failures are cached, how a slow reply for an old query is handled, and what shows during the pause. It also leaves the 429 message, the pick failure and the selected state to the panel.

## Decision
- **Key:** the query normalised as the route does it (trimmed, whitespace collapsed, lower-cased), so `Cat  Dog` and `cat dog` share one entry and one request. The input caps at 100 characters, the route's limit.
- **Debounce:** a `useEffect` keyed on the normalised query sets a 400ms timer and fetches. Its cleanup clears the timer and marks the run stale, so a pending search never fires after the panel closes and a slow reply for an older query is dropped. A fetch is an external system, so an effect is the place for it; the state it sets is set only in the async callback.
- **View:** derived during render, never synced. A blank query is idle, a cached query shows its results at once, a query with a settled outcome shows it, and anything else reads "Searching…" (including the pause).
- **Cache:** only 200 results are stored. A 429, 503, 502, network error or unreadable reply is shown until the query changes, and searching again later retries.
- **Messages:** a 429 shows the route's `error` text (falling back to "Too many searches, try again shortly"). Every other failure shows "Photo search isn't available right now. Upload your own instead." They sit in one always-mounted `role="status"` region with "No photos found"; a refused pick uses a separate `role="alert"`.
- **Results:** a list of `<button>`s, each holding an `<img alt="Photo by {name}">` (or "Photo from Unsplash" for a blank name), with `aria-pressed` and the canvas's blue outline on the one that is the current background.

## Alternatives
- **Debounce in the change handler with a timer ref:** needs a ref read in an unmount cleanup and a request counter for stale replies; the effect's cleanup does both.
- **Key by the raw query:** different spacing or case would cost a request each.
- **Cache failures too:** a 503 fixed by setting the key, or a 429 that has expired, would stick for the page's life.

## Consequences
The cache lives until the page reloads and grows by one entry per distinct successful query, at most 12 trimmed results each. Picking the photo that's already the background does nothing, so it never sends a second download ping.
