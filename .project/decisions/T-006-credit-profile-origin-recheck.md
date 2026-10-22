---
title: "The credit renderer re-checks the profile URL's origin and adds missing referral parameters with the URL API"
type: decision
project: captivator
ticket: T-006
decided_by: ticket-implementer
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, splash, security]
---
# The credit renderer re-checks the profile URL's origin and adds missing referral parameters with the URL API

## Context
The ticket links the photographer's name to the schema-validated `profileUrl`, "with `utm_source=captivator&utm_medium=referral` appended if missing". It doesn't say how to append them, or what happens if a `Background` is ever rendered from data that didn't pass `Design.parse` (the renderer is meant to move to the production portal service unchanged).

## Decision
`Background.tsx` parses `profileUrl` with `new URL` and links it only when its origin is exactly `https://unsplash.com`; otherwise the name renders as plain text and only the Unsplash home link remains. Each of `utm_source` and `utm_medium` is set only when the URL doesn't already have it, so existing parameters are kept.

## Alternatives
- **Trust the schema and string-append `?`/`&` plus both parameters:** duplicates a parameter when one is already present, and links anywhere if unvalidated data reaches the renderer.
- **Drop the whole credit line on a bad URL:** loses the attribution Unsplash requires.

## Consequences
The URL API is available in browsers, Node and Workers, so the renderer stays portable. `URL.toString()` may normalise the href slightly (e.g. percent-encoding); the tests pin the output for normal profile URLs.
