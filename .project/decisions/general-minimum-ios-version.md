---
title: "The guest page targets iOS 15.4 and newer"
type: decision
project: captivator
ticket: none
decided_by: user
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, splash, compatibility]
---
# The guest page targets iOS 15.4 and newer

## Context
Review finding 13: flexbox `gap` needs iOS 14.5, which contradicted "plain, widely supported CSS".

## Decision
State iOS 15.4+ and Chrome 108+ WebView as the minimum, which covers `gap`, `dvh` and `accent-color`.

## Alternatives
- Use margins instead of `gap`: more code, for devices the MVP won't be tested on.

## Consequences
`splash-auditor` audits against this floor. Supporting older devices would be a production-path decision.
