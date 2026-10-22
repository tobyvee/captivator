---
title: "The export toast lives in one always-mounted status region, and only a within-budget toast hides itself"
type: decision
project: captivator
ticket: T-024
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, export, accessibility]
---
# The export toast lives in one always-mounted status region, and only a within-budget toast hides itself

## Context
T-024 asks for a fixed bottom-right toast with `role="status"` and a dismiss button that auto-hides after about 6 seconds "unless it's a warning", amber when over budget. It doesn't say whether the failure toast auto-hides or how it looks, and the canvas draws no toast. `T-009-notices-one-live-region.md` found that a live region mounted with its text already inside often isn't announced.

## Decision
`ExportButton` renders an always-mounted, empty `role="status"` container (fixed bottom-right, full width minus 16px gutters below `sm`, `pointer-events-none` so it never blocks the editor) and puts the toast inside it. Only the within-budget toast hides after `TOAST_MS` (6000ms). The over-budget warning and the failure stay until dismissed or replaced by the next export. Tones: within budget is white with a zinc border; over budget uses the notices' amber (`#FFFBEB`, `#FDE68A`, `#78350F`); failure is red (`#FEF2F2`, `#FECACA`, `#991B1B`). The Dismiss button is 44px square with `aria-label="Dismiss"`.

## Alternatives
- **Mount the region with the toast:** often not announced (T-009).
- **`role="alert"` for the failure:** a second region for one component; the failure comes straight after the customer's own click, so a polite status is enough.
- **Auto-hide the failure too:** the customer could miss why no file arrived.
- **Amber for the failure:** it would read the same as the over-budget warning, which still downloaded.

## Consequences
Starting a new export clears the previous toast. A later restyle of editor warnings should include this toast.
