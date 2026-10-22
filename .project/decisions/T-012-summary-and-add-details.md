---
title: "Block-list summaries uppercase hex and show 'Empty' for blank text, and + Image restyles ImageUpload through its className"
type: decision
project: captivator
ticket: T-012
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor]
---
# Block-list summaries uppercase hex and show 'Empty' for blank text, and + Image restyles ImageUpload through its className

## Context
T-012 gives the summary wording but not a few edge cases. "+ Image" must look like the dashed "+ Text" button, while `ImageUpload` (T-011, outside `touches`) draws a solid-bordered label.

## Decision
- **Summaries:** hex colours are shown uppercase ("Colour, #0F2A44"), since a stored hex may be lowercase. Text is cut at exactly 30 characters with no ellipsis; empty text shows "Empty" so the row isn't blank. Field names are `FIELD_SPEC[kind].placeholder` ("Name", "Email", "Phone").
- **Connect button row:** also shows a swatch of the button colour, as on the canvas.
- **"+ Image":** passes `className="[&>label]:border-dashed [&>label]:border-zinc-400"` to `ImageUpload`; its Upload icon stays. Both add buttons are 44px tall, not the canvas's 40px.
- **"2 of 2 images used."** (`id="image-limit"`) renders only at the limit, and `describedBy` is passed only then.
- **Tip:** reads "Tip: tap anything in the preview to edit it.", without the canvas's "Drag blocks to reorder." until T-034 ships drag.

## Alternatives
- **Add a `variant` prop to `ImageUpload`:** changes a dependency's props, which this ticket may not do.
- **An ellipsis after 30 characters:** the ticket says the first 30 characters.

## Consequences
If `ImageUpload` stops rendering its `<label>` as a direct child of its root, "+ Image" loses its dashed border. T-034 should add the drag sentence back to the tip.
