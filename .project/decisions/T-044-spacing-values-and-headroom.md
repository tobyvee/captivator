---
title: "The column gap is 14px and its top padding 48px, and every template keeps 20px of fit headroom"
type: decision
project: captivator
ticket: T-044
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, splash, fit]
---
# The column gap is 14px and its top padding 48px, and every template keeps 20px of fit headroom

## Context
The user chose to tighten the guest page's spacing so no template opens with the fit warning ([`T-044-tighter-column-spacing.md`](T-044-tighter-column-spacing.md)). The spec's column is `gap: 18px; padding: 56px 28px 40px`. Sponsor measured 602.5px. The templates test's estimate (597.5px) ran a few pixels under Chrome, and iOS fonts can differ again.

## Decision
- **Spacing:** the column's gap goes from 18px to 14px, and its top padding from 56px to 48px.
- **Bottom padding:** stays at 40px, which keeps the last button clear of the photo credit.
- **Headroom:** the templates test now requires every template's estimate to stay at or under 580px.

Measured in Chrome after the change:

| Template | Height |
|---|---|
| Sponsor | 578.5px |
| Photo hero | 437.2px |
| Minimal | 390px |
| Blank | 138px |

None shows the warning.

## Alternatives
- **Gap only (18 to 13):** the blocks would crowd before the top looked any different.
- **Cut the bottom padding:** the photo credit would overlap Connect.

## Consequences
The spec's column line is out of date. A future template change has to keep the 20px headroom.
