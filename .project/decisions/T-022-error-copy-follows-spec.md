---
title: "Guest error messages use the spec's wording, not the canvas's"
type: decision
project: captivator
ticket: T-022
decided_by: ticket-planner
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, splash]
---
# Guest error messages use the spec's wording, not the canvas's

## Context
The canvas `StateError` artboard says "Enter a full email address" and "Please accept the terms to connect". The spec says "Enter a valid email", "Enter your name", "Enter a valid phone number" and "Please accept the terms".

## Decision
Use the spec's copy, held in `ERROR_COPY` in `src/splash/validate.ts`.

## Alternatives
- **The canvas copy:** it covers only email and terms, so the spec would still be needed for name and phone.

## Consequences
Tests and the README quote the spec's strings. Changing the copy later is a one-line edit.
