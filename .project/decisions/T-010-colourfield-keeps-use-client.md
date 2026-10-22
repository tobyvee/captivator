---
title: "ColourField keeps 'use client' because it calls a store hook and React state"
type: decision
project: captivator
ticket: [T-010, T-008]
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, client]
---
# ColourField keeps 'use client' because it calls a store hook and React state

## Context
`T-008-use-client-on-stateful-modules.md` puts the directive on modules that call a store hook or React state, and leaves it off presentational controls that only take props and callbacks. Its Consequences line named `ColourField` as one of the prop-only controls. That was a forecast made before T-010 was built. As built, `ColourField` reads `design` and `logoPalette` through `useStore` for its suggestion rows, and holds the popover's open state and the hex draft in `useState`.

## Decision
`src/editor/controls/ColourField.tsx` keeps `"use client"`. T-008's rule still applies unchanged: ColourField falls on the "store hook or React state" side of it. This corrects only the Consequences line of T-008's decision that listed ColourField as prop-only. `Slider` takes only props and callbacks, so its directive comes off.

## Alternatives
- **Drop the directive to match the T-008 Consequences line:** follows a forecast that turned out wrong, and contradicts the rule that line was derived from.
- **Pass the suggestion colours in as props so ColourField is prop-only:** every panel that uses it (Text, Fields, Button, Background, Photo, Terms) would have to read the store itself, duplicating the same selectors.

## Consequences
Next's TypeScript plugin may flag `onChange` as an unserializable prop on a `'use client'` entry. That's acceptable, because ColourField is only ever rendered inside the client editor tree. `FocusGrid` is still expected to be prop-only and to leave the directive off, unless it ends up calling a store hook or state too.
