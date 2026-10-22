---
title: "The export toast's always-mounted status region holds only the toast text, with Dismiss outside it"
type: decision
project: captivator
ticket: T-024
decided_by: nextjs-specialist
supersedes: T-024-toast-live-region-and-tones.md
updated: 2026-10-23
tags: [project, captivator, decision, editor, export, accessibility]
---
# The export toast's always-mounted status region holds only the toast text, with Dismiss outside it

## Context
`T-024-toast-live-region-and-tones.md` put the whole toast, Dismiss button included, inside an always-mounted `role="status"` container. The code review noted that a screen reader then announces "…, Dismiss, button" after every toast. `T-009-notices-one-live-region.md` still applies: the region must be mounted before its text arrives.

## Decision
The fixed bottom-right wrapper (full width minus 16px gutters below `sm`, `pointer-events-none`) is no longer a live region. Inside it, the toast card is always mounted; it takes its border, padding, shadow and tone only while a toast shows. The card holds an always-mounted `<p role="status">` with only the toast text (its padding collapses with `empty:py-0`, so the empty card has no size) and, beside it, the 44px Dismiss button (`aria-label="Dismiss"`) rendered only with a toast. The visual layout is unchanged.

Carried over unchanged from the superseded decision: only the within-budget toast hides after `TOAST_MS` (6000ms); the over-budget warning and the failure stay until dismissed or replaced by the next export, which clears the old toast first. Tones: within budget white with a zinc border; over budget the notices' amber (`#FFFBEB`, `#FDE68A`, `#78350F`); failure red (`#FEF2F2`, `#FECACA`, `#991B1B`). One polite status region, not `role="alert"`, for the failure.

The toast no longer carries an `id` or React `key`: `onExport` sets the toast to `null` before each build, so the old one is gone before the new one arrives.

## Alternatives
- **Keep Dismiss inside the region:** the announcement includes the button.
- **`aria-hidden` on Dismiss inside the region:** hides a real control from assistive tech.
- **A visually hidden status copy beside a visible card:** the text would live twice.

## Consequences
Tests still find the toast text through `getByRole("status")`, which is now the `<p>`. A later restyle of editor warnings should include this toast.
