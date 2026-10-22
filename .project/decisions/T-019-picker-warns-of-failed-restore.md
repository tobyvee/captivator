---
title: "The picker shows the restore-failed notice, so a stored design that failed to restore isn't replaced unseen"
type: decision
project: captivator
ticket: T-019
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, templates, persistence]
---
# The picker shows the restore-failed notice, so a stored design that failed to restore isn't replaced unseen

## Context
The wave 7 security audit noted (not as a security finding) that `T-004-write-only-on-design-change` promises a stored design that failed to restore "isn't overwritten before the customer sees the notice", but the notice only showed in the editor's preview stage. On `/`, a failed restore leaves `hasSaved` false, so there's no Continue card and no confirm, and any "Use" overwrites the stored data before the customer has seen why.

## Decision
When `restoreFailed` is set, the picker shows the shared amber `Notice` above the grid: "Couldn't restore your saved design." with "Picking a template below replaces it." Picking stays one click; nothing is confirmed.

## Alternatives
- **Confirm before switching when `restoreFailed`:** a modal for data the app can't open anyway; the notice tells the customer before they click.
- **Leave it to the editor's notice:** breaks the T-004 promise on the picker path.

## Consequences
The editor still shows its own notice (with Dismiss) after a template is picked, since `restoreFailed` stays set until dismissed. The picker's notice has no Dismiss: it goes once a template is picked and the editor opens.
