---
title: "In edit and preview, each field and the terms row sit in a column wrapper so an error message never remounts the input"
type: decision
project: captivator
ticket: T-022
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, splash, export]
---
# In edit and preview, each field and the terms row sit in a column wrapper so an error message never remounts the input

## Context
`StateError` puts each field's message directly under its input (6px gap) and the terms message under the row (2px gap). If an input is wrapped only while it's in error, its parent changes, so React remounts it, and the customer's typed value and tick are lost the moment Connect fails. The ticket also requires the export markup to stay byte-identical apart from the terms link's `id`.

## Decision
In `edit` and `preview`, every field and the terms row are always rendered inside a `<div>` column (gap 6 for fields, 2 for terms), which also holds the message when there is one. In `export` there's no wrapper, so the export markup is unchanged apart from `id="cv-terms-link"`. This was checked by rendering every template, with each field set and terms mode, before and after the change.

## Alternatives
- **Messages as siblings in the existing flex containers:** nothing remounts, but the terms message sits 12px below a 44px row, much further away than the canvas shows.
- **Wrap in every mode:** changes the export markup, which the ticket forbids.
- **Negative margins to pull the message up:** the layout rule is gap, not margins.

## Consequences
The edit and preview markup differs from the export by these wrappers. They add no height and no class, so neither the fit check nor SplashPage's class guard is affected.
