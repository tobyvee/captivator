---
title: "The export checks its finished markup's URL-bearing attributes, not its text, before returning"
type: decision
project: captivator
ticket: T-023
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, export, security]
---
# The export checks its finished markup's URL-bearing attributes, not its text, before returning

## Context
T-023 requires no `http(s)://` URLs, no `<link`, no `<script>` and only `data:image/` img sources in the export. Inlining before rendering is the main protection, but a later renderer change could add an element or attribute that loads something. A blanket "no `https://` anywhere" check would also block a customer whose terms body or heading mentions their website as plain text, which loads nothing.

## Decision
After rendering, `buildExportHtml` throws `ExportError(MSG_UNSAFE_OUTPUT)` if the markup has `<link`, `<script`, `<iframe`, `<object`, `<embed` or `<base`, or any `src`, `srcset`, `href`, `action`, `formaction` or `poster` attribute outside an allowlist: `src` a raster data URL, `href` an in-page `#` fragment, `action` one of the two placeholders. Text content isn't checked; React escapes it, so it can't form markup.

## Alternatives
- Reject any `http://` or `https://` substring: also rejects inert text such as a web address in the terms.
- No final check: relies entirely on inlining and on every future splash change.

## Consequences
The tests' "no http(s) URLs at all" assertions use designs whose text has none. A splash change that adds a new URL-bearing attribute or element (for example a credit link in export) fails the export until this allowlist and a decision cover it.
