---
title: "The Export button shows busy with aria-disabled, not the disabled attribute, and a ref blocks a second export"
type: decision
project: captivator
ticket: T-024
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, export, accessibility]
---
# The Export button shows busy with aria-disabled, not the disabled attribute, and a ref blocks a second export

## Context
T-024's acceptance criteria say the button is "disabled" while exporting. The code review found that the native `disabled` attribute drops keyboard focus from the button for the length of the build, so a keyboard or screen-reader user who pressed Enter loses their place, and focus doesn't come back when the export finishes. The component already had a `running` ref, because `busy` only reaches the DOM after a re-render and two clicks in one tick would both start an export.

## Decision
While exporting, the button carries `aria-disabled="true"` and reads "Exporting…", stays focusable, and looks disabled through `aria-disabled:` Tailwind variants (60% opacity, not-allowed cursor, no hover change). The `running` ref is the only guard: `onExport` returns at once while it's set, so clicks and Enter during a build do nothing. The test fires two synchronous clicks so it fails without the ref. This meets the AC's "disabled" for assistive tech and the eye, without the focus loss.

## Alternatives
- **Native `disabled`:** focus is lost mid-export, the finding's reason.
- **Both `disabled` and focus restoration afterwards:** more code, and focus still jumps away and back during the build.
- **Guard on `busy` state instead of a ref:** a second click in the same tick sees the stale `false`.

## Consequences
`toBeDisabled()`/`toBeEnabled()` no longer describe the busy state; tests assert `aria-disabled`. `editor.test.tsx`'s `toBeEnabled()` on the idle button still holds. Any later busy button in the editor should follow the same pattern.
