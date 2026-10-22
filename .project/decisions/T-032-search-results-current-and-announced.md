---
title: "The current Unsplash result is marked aria-current, the result count is announced, and a left query's outcome is forgotten"
type: decision
project: captivator
ticket: T-032
decided_by: nextjs-specialist
supersedes: T-032-search-debounce-and-cache.md
updated: 2026-10-23
tags: [project, captivator, decision, unsplash, editor, react, accessibility]
---
# The current Unsplash result is marked aria-current, the result count is announced, and a left query's outcome is forgotten

## Context
The code review of T-032 found three gaps in `T-032-search-debounce-and-cache.md`:
- Its `aria-pressed` on the result buttons announces a toggle, but pressing the selected photo again does nothing (it must not send a second download ping).
- The `role="status"` region said "Searching…" and then went empty when results arrived, so a screen-reader user heard nothing about them, and a cached query was never announced.
- A failed outcome stayed in state after its query was left, so returning to that query showed the old failure for 400ms while the retry was pending.

The review also asked for the 200 body to be checked as a list before it is cached.

## Decision
This restates every rule of the superseded decision that is still in force, with the changes marked **(new)**.

- **Key:** the query normalised as the route does it (trimmed, whitespace collapsed, lower-cased), so `Cat  Dog` and `cat dog` share one entry and one request. The input caps at 100 characters, the route's limit.
- **Debounce:** a `useEffect` keyed on the normalised query sets a 400ms timer and fetches. Its cleanup clears the timer and marks the run stale, so a pending search never fires after the panel closes and a slow reply for an older query is dropped, even when the newer query has already failed.
- **View:** derived during render, never synced. A blank query is idle, a cached query shows its results at once, a query with a settled outcome shows it, and anything else reads "Searching…" (including the pause).
- **(new) Leaving a query forgets its outcome:** the input's change handler clears the settled outcome when the normalised query moves off it, so returning to a failed query reads "Searching…" and retries rather than showing the old failure. It's an event-handler reset, not a request counter, because the effect's cleanup already drops stale replies.
- **Cache:** only a 200 whose `results` is an array is stored **(new: the `Array.isArray` check)**. Any other 200 body, a 429, 503, 502 or network error is shown until the query changes, and searching again later retries.
- **Messages:** a 429 shows the route's `error` text (falling back to "Too many searches, try again shortly"). Every other failure shows "Photo search isn't available right now. Upload your own instead." They sit in one always-mounted `role="status"` region with "No photos found"; a refused pick uses a separate `role="alert"`.
- **(new) Result count:** when results are showing, the same status region holds "{n} photo(s) found for “{query}”" and is visually hidden (`sr-only`), because the grid already shows them. Naming the query means a cached query with the same count as the last one still changes the text, so it is announced.
- **Results:** a list of `<button>`s, each holding an `<img alt="Photo by {name}">` (or "Photo from Unsplash" for a blank name). **(new)** The one that is the current background has `aria-current="true"` (no `aria-pressed`) and the canvas's 3px blue outline; the focus ring uses the same 3px width with a 4px offset, so a focused selected tile keeps its width and its ring visibly moves out.

## Alternatives
- **Keep `aria-pressed`:** announces a toggle that can't be turned off.
- **`aria-selected`:** only valid on options, tabs, rows and grid cells, which these buttons aren't.
- **A visible result count:** the canvas doesn't show one.
- **A request counter for nit 5:** would duplicate the effect cleanup's stale-reply handling.

## Consequences
Tests read the selected tile with `aria-current` and the count from `getByRole("status")`. The focus ring sits 2px further out than the canvas's other rings, the cost of showing focus on a tile that already has an outline.
