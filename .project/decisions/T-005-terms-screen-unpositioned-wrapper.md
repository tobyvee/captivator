---
title: "The landing page under the open terms sheet sits in an unpositioned flex wrapper with aria-hidden"
type: decision
project: captivator
ticket: [T-005, T-006, T-021]
decided_by: ticket-implementer
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, splash, accessibility]
---
# The landing page under the open terms sheet sits in an unpositioned flex wrapper with aria-hidden

## Context
The ticket says the `terms` screen is "the landing composition wrapped with `aria-hidden`" plus `<TermsSheet>`, but not how the wrapper behaves in layout. The wrapper sits between the root and both the background layers (T-006, absolutely positioned) and the column (`flex: 1 0 auto`). T-021 expects to position the sheet against the root.

## Decision
The wrapper is a `<div aria-hidden="true">` with `display: flex; flex-direction: column; flex: 1 0 auto` and no `position`. The column still fills the root, and the background layers and the sheet still anchor to the root, exactly as on the landing screen.

## Alternatives
- **`display: contents`:** no layout cost, but Safari has dropped or mishandled `aria-hidden` on `display: contents` elements, and the hiding is the point of the wrapper.
- **A positioned wrapper (`position: relative`):** the background would anchor to the wrapper instead of the root, so it could differ between the landing and terms screens.
- **`aria-hidden` on the column and the background separately:** two attributes to keep in step instead of one.

## Consequences
T-006's layers and T-021's sheet position against the `position: relative` root on every screen. In `edit` mode, blocks under the sheet stay clickable; T-021's dimming overlay decides whether clicks reach them.
