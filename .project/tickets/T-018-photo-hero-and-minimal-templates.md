---
title: "T-018: Photo hero and Minimal templates"
type: ticket
project: captivator
status: todo
priority: P1
milestone: 5
estimate: 10
depends_on: [T-002]
touches:
  - src/lib/templates.ts
  - src/lib/templates.test.ts
  - public/templates/photo-hero.jpg
  - public/templates/minimal.jpg
cut_rank:
updated: 2026-10-22
tags: [project, captivator, ticket, schema, lib]
---
# T-018: Photo hero and Minimal templates

## Context
Build step 5 adds Photo hero and Minimal ([spec → Data model and store → Templates](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md), *Template photos*, *Unit tests* → "All four templates parse"). Canvas artboard: `Templates` (`project/Templates.dc.html`). Decisions: [`T-002-template-photos-and-credits.md`](../decisions/T-002-template-photos-and-credits.md), [`T-004-template-switch-carry-rule.md`](../decisions/T-004-template-switch-carry-rule.md).

## Scope
- In `templates.ts`: add `PHOTO_HERO` and `MINIMAL`, parsed at module load. Set `TEMPLATES` to `[SPONSOR, PHOTO_HERO, MINIMAL, BLANK]` and add their `TEMPLATE_CREDITS`.
- Photos from the canvas assets, via the Artifact tool (`action: "read"`, `url: https://claude.ai/artifact/AWrSjgB8dZV2KWn8kkDeYj`, `path: <asset id>`):
  - `public/templates/photo-hero.jpg` ← `5c6b0d919538434c9a8eec4a0aac1d40`.
  - `public/templates/minimal.jpg` ← `2848735b7a97a6499fa2e08690531a74`.
  - If the Artifact tool isn't available, use a gradient background and say so in your report.
- `templates.test.ts`: all four templates parse; ids unique; `TEMPLATES` order as above.
- **Out of scope:** the picker (T-019).

## Acceptance criteria
- [ ] All four templates parse (test), and a broken template fails on import.
- [ ] Each template's content height in the compact layout is at most 600px by the arithmetic used in T-002's Notes.
- [ ] Both use `PLACEHOLDER_LOGO` (no new placeholder images needed) and bracketed terms prompts.
- [ ] `npm test` and `npx tsc --noEmit` pass.

## Dependencies
- T-002: `templates.ts`, `TEMPLATE_CREDITS`, `PLACEHOLDER_LOGO` and the test file this ticket extends.

## Notes
**Photo hero** (`id: "photo-hero"`, description "A full-screen venue photo with your message. Collects an email address."):
- Background: image `/templates/photo-hero.jpg`, `fill`, zoom 1, focus 50/50, backdrop `#0B1F2E`, overlay `{ from: "#334155", to: "#050A1E", opacity: 0.75 }`.
- Blocks: image `PLACEHOLDER_LOGO` alt "Your logo" `sm`; text "WIFI IS\nON THE HOUSE" heading `#FFFFFF` 34.
- Form: fields `["email"]`; terms checkbox on (per the schema's BLANK comment), `textColour: "#FFFFFF"`; button "CONNECT", bg `#FACC15`, fg `#111111`, solid.
- Credit: Miguel Dominguez, `https://unsplash.com/@migueldominguez?utm_source=captivator&utm_medium=referral`.
- The canvas card shows the headline near the bottom. In the spec's layout, blocks always sit above the spacer, so it renders near the top. That's expected.

**Minimal** (`id: "minimal"`, description "Just your logo on a soft abstract background, with an outline Connect button."):
- Background: image `/templates/minimal.jpg`, `fill`, zoom 1, focus 50/50, backdrop `#EDE9FE`, overlay `{ from: "#FFFFFF", to: "#FFFFFF", opacity: 0.35 }`.
- Blocks: image `PLACEHOLDER_LOGO` alt "Your logo" `md`.
- Form: fields `["name", "email"]`, inputBg `#FFFFFF`, inputText `#18181B`; terms off, `textColour: "#18181B"`; button "Connect", bg `#18181B`, fg `#18181B`, outline.
- Credit: Woliul Hasan, `https://unsplash.com/@shotbywoliul?utm_source=captivator&utm_medium=referral`.

## Decisions
- [`T-002-template-photos-and-credits.md`](../decisions/T-002-template-photos-and-credits.md): Template photos come from the canvas assets, and their credits live beside the templates, not in background.credit
- [`T-004-template-switch-carry-rule.md`](../decisions/T-004-template-switch-carry-rule.md): Switching template carries text and uploaded images by position, never template defaults
