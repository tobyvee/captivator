---
title: "The readability line is an inline caption when it passes or is approximate, and the shared amber Notice when it fails"
type: decision
project: captivator
ticket: T-027
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, contrast, accessibility]
---
# The readability line is an inline caption when it passes or is approximate, and the shared amber Notice when it fails

## Context
The ticket asks for "green tick for `ok`, amber for `approximate`, red-amber warning for `fail`", and its notes say warnings use the shared `Notice` (`T-017-notice-shared-control.md`). The `Main` artboard only draws the passing state: a green tick and "All text is readable" inline in the caption row. `Notice` has one amber tone and no tone prop, and `Notice.tsx` is outside T-027's `touches`.

## Decision
- **ok:** the canvas's inline caption, `#166534` with a check icon.
- **approximate:** the same inline caption in the notice amber (`#92400E`) with a warning icon. It isn't a failure, so it stays as quiet as the passing line.
- **fail:** `Notice` titled with the message ("Heading: 1.0:1 on the background"), with the detail line "Needs {required}:1.", plus " {n} more to fix." when there are other failures. It uses Notice's amber, not red: red reads as a blocking error (`T-009-notices-share-amber-style.md`, `T-013-contrast-verdict-live-region.md`), and the check never blocks.
- One always-mounted `role="status"` wrapper holds all three states, so a change of verdict is announced (`T-009-notices-one-live-region.md`). Its text includes the ratio, as the ticket's message does, so dragging a colour while the check fails can be announced more than once.

## Alternatives
- **A red tone for failures:** needs a tone prop on `Notice` (outside `touches`) and reads as blocking.
- **Notice for approximate too:** a photo design would always show a warning box, even when every ratio passes.
- **Only the verdict live, with the ratio outside the region:** the ticket asks for one status line holding the message.

## Consequences
T-035's Fix button can go in the Notice's children. If a later ticket adds a red tone to `Notice`, switch it here.
