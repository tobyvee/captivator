---
title: "The picker's header and intro render on the server; only the card grid waits for hydration"
type: decision
project: captivator
ticket: T-019
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, picker, hydration, client]
---
# The picker's header and intro render on the server; only the card grid waits for hydration

## Context
T-019 asks for "a neutral placeholder until `useHydrated()` is true". The header, the h1 and the intro never depend on the store. The template cards don't either, but the "Continue your design" card goes before them and depends on `restored`, which is only known after `rehydrate()` (`T-004-hydrate-once-on-store-flag.md`).

## Decision
`src/app/page.tsx` always renders the header, h1 and intro. Below them, it renders grey card shapes in the same grid (`aria-busy`, with a "Loading templates…" status) until `useHydrated()` is true, then the cards. The server render and the first client render match, and the Continue card never pushes painted templates down.

## Alternatives
- **Placeholder for the whole page:** hides static text that can't mismatch, and blanks the page's h1 for the server render.
- **Render the template cards on the server and add the Continue card after hydration:** the four cards jump down one slot on every visit with a saved design.

## Consequences
The thumbnails are client-only, so `SplashPage` isn't rendered for `/` on the Worker. The placeholder card height (476px) approximates a real card; a change to the card's text sizes may need it adjusted.
