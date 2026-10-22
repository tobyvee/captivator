---
title: "Continue your design is a TemplateCard first in the grid, holding the saved design"
type: decision
project: captivator
ticket: T-019
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, picker, editor]
---
# Continue your design is a TemplateCard first in the grid, holding the saved design

## Context
T-019 asks for a "Continue your design" card first, with a thumbnail of the saved design, its name and a Continue button. The `Templates` artboard doesn't draw it, and `TemplateCard({ template, credit?, primaryLabel, onUse })` already has the thumbnail, a heading, a line of text and a button.

## Decision
The picker renders `TemplateCard` with `{ id: "saved", name: "Continue your design", description: <design name, or "Untitled design">, design }`, `primaryLabel="Continue"` and `onUse={() => router.push("/editor")}`, as the grid's first item. No credit is passed: a saved Unsplash background shows its own credit inside the thumbnail, as on the guest page.

## Alternatives
- **A separate wide card above the grid:** a second thumbnail implementation or an exported thumbnail, for a layout the canvas doesn't specify.
- **The design name as the heading:** an empty or arbitrary customer string as the card's h2; "Continue your design" reads better in the heading outline.

## Consequences
The card looks like the template cards. The `"saved"` id is only a React key and never reaches the store; it must not collide with a template id (`TemplateCard` styles `"blank"` as an outline card).
