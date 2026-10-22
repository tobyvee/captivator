---
title: "Security review: T-004 store and persistence"
type: review
project: captivator
updated: 2026-10-22
tags: [project, captivator, review, security, store]
---
# Security review: T-004 store and persistence

`security-auditor` reviewed T-004 after it merged (`29a1261..36e035f`): `src/lib/store.ts`, `src/lib/persist-storage.ts` and their tests. Saved designs in localStorage are untrusted, because they can be hand-edited or planted, and the restored design feeds the editor preview and, later, the export. It found 1 issue, low: 0 critical, 0 high, 0 medium. A second audit, covering the fix commit and the code review's persistence rework, confirmed the fix and found nothing new.

## Findings

| # | Severity | Finding | Outcome |
|---|---|---|---|
| SEC-1 | low | `loadTemplate` had one path that wrote to `design` without the schema check. When the carried design failed to parse, it stored the template's design directly. That only happens when the template itself is invalid, so an unparsed template (from a future source or a cast fixture) could reach the preview, storage and the export. It wasn't reachable, because every shipped template is `Template.parse`d at module load. | **Fixed in `14419a6`.** The fallback goes through the same `commit` guard as every other action, so an invalid template leaves the state unchanged. The regression test uses a template with an image `src` outside the allowlist: the design stays as it was, and storage never contains that `src`. |

## Checked and passed
- **Every path into `design` is schema-checked:**
  - Each design action goes through `commit`, which runs `Design.safeParse` and stores the parsed output, so unknown keys are stripped.
  - Restoring a saved design reads only `design` and `name`. The design is used only after it parses, and `name` must be a string of at most 60 characters.
  - Corrupt JSON, a value that isn't an object, a wrong shape or an older version all keep the template and set `restoreFailed`.
- **Persisted shape:** only `{ design, name }` is written. Selection, device, screen, the logo palette and all flags stay in memory.
- **Errors:**
  - Read errors, including blocked storage and corrupt JSON, reach `onRehydrateStorage` as an error.
  - Write errors, including quota, go to `onError`, never throw, and only set a flag.
  - Nothing is logged.
- **Prototype pollution:** a `__proto__` or `constructor.prototype` key in parsed JSON is dropped by Zod's object parsing. The spreads used to update the design define own properties only, and their output is parsed again.
- **Regular expressions:** every pattern the schema runs on restore is anchored and linear.
- **Write-skip guard (code-review fix):** it can only skip a write, never add one. An invalid stored value stays in storage until the customer's first real edit, and it's checked again on every load (`T-004-write-only-on-design-change.md`).

## For later tickets
- **T-025:** undo and redo must restore only designs that were committed earlier, which holds if zundo tracks `design`. They must also set a new object rather than mutating the current one, or the write-skip guard won't save the result.
