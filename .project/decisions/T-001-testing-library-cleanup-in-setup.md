---
title: "vitest.setup.ts does Testing Library's auto-setup for jsdom tests"
type: decision
project: captivator
ticket: T-001
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, tests]
---
# vitest.setup.ts does Testing Library's auto-setup for jsdom tests

## Context
React Testing Library's auto-setup (cleanup after each test, and setting React's `IS_REACT_ACT_ENVIRONMENT` flag) runs only when it finds a global `afterEach`, which Vitest provides only with `globals: true`. The ticket's Vitest config doesn't turn globals on. Without cleanup, renders leak between tests in the same file. A throwaway check showed this: a second test's `getByRole("button")` failed with "Found multiple elements with the role button" until cleanup was registered. Without the act flag, React stays silent about updates that land outside `act`, so a test could assert against a stale DOM (code review of T-001).

## Decision
`vitest.setup.ts` imports `@testing-library/jest-dom/vitest`. When `document` exists (a file opted into jsdom), it imports `@testing-library/react` dynamically, sets `IS_REACT_ACT_ENVIRONMENT = true` and registers `afterEach(cleanup)`.

## Alternatives
- `globals: true`: changes the style of every test file and needs the global types.
- Each component test calls `cleanup` itself: easy to forget, and the rule belongs in one place.

## Consequences
- Component tests don't call `cleanup`.
- Node-environment test files don't load Testing Library or React DOM.
