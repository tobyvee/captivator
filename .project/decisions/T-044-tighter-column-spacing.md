---
title: "Templates must open without the fit warning, made room for by tightening the guest page's spacing"
type: decision
project: captivator
ticket: T-044
decided_by: user
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, splash, templates, fit]
---
# Templates must open without the fit warning, made room for by tightening the guest page's spacing

## Context
The user: "I don't think we should default to a template which shows the small phone warning, in fact none of the templates should show the warning in their initial state." Measured in Chrome, Sponsor's compact page was 602.5px against the 600px limit. The user was offered three ways to make room: drop Sponsor's Name field, drop its "Proudly sponsored by" line, or tighten the page spacing. They chose "Tighten the page spacing".

## Decision
- No template shows the small-phone warning when it's first opened.
- The room comes from the renderer's column spacing, which applies to every design, not from Sponsor's content.

The exact values are in [`T-044-spacing-values-and-headroom.md`](T-044-spacing-values-and-headroom.md).

## Alternatives
- **Drop Sponsor's Name field:** it would collect email only.
- **Drop "Proudly sponsored by":** the sponsor logo would have no label.

## Consequences
Every guest page, including customers' own designs and exports, is a little tighter than the spec's column.
