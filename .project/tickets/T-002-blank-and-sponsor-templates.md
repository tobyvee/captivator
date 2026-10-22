---
title: "T-002: Blank and Sponsor templates"
type: ticket
project: captivator
status: todo
priority: P0
milestone: 1
estimate: 10
depends_on: [T-001]
touches:
  - src/lib/templates.ts
  - src/lib/templates.test.ts
  - public/templates/sponsor.jpg
cut_rank:
updated: 2026-10-22
tags: [project, captivator, ticket, schema, lib]
---
# T-002: Blank and Sponsor templates

## Context
Build step 1 lists `templates.ts` with Blank and Sponsor ([spec → Data model and store → Templates](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md), *Template photos*). The store (T-004) starts from Sponsor, and the renderer and picker use these objects. Photo hero and Minimal come in T-018. The canvas `Templates` artboard (`project/Templates.dc.html`) and `StateLanding` show Sponsor. Decisions: [`T-002-template-photos-and-credits.md`](../decisions/T-002-template-photos-and-credits.md), [`T-004-default-design-is-sponsor.md`](../decisions/T-004-default-design-is-sponsor.md).

## Scope
- `src/lib/templates.ts` exports:
  - `BLANK` (re-exported from `design-schema.ts`), `SPONSOR`.
  - `TEMPLATES: Template[]` = `[SPONSOR, BLANK]` for now (T-018 inserts Photo hero and Minimal before Blank).
  - `TEMPLATE_CREDITS: Record<string, { name: string; profileUrl: string }>` keyed by template id.
  - `PLACEHOLDER_LOGO` and `PLACEHOLDER_SPONSOR` (data URLs, reused by T-018).
  - Every template object goes through `Template.parse(...)` at module load, so a broken template throws on import.
- `public/templates/sponsor.jpg`: the canvas asset `f4ba15fc2cf2dc81761e7074fa82bed6`. Fetch it with the Artifact tool (`action: "read"`, `url: https://claude.ai/artifact/AWrSjgB8dZV2KWn8kkDeYj`, `path: "f4ba15fc2cf2dc81761e7074fa82bed6"`) and copy the saved JPEG. If the Artifact tool isn't available, give Sponsor a gradient background (`#0F2A44` → `#0E5E6F`, down) and say so in your report.
- Placeholder images: two small **PNG data URLs** (a light dashed ring about 240×240 for the logo; a white rounded tile about 336×128 for the sponsor), each under about 3 KB of base64. Generate them with any local tool (e.g. a throwaway Node script that writes a PNG with `zlib`); don't commit the script.
- `src/lib/templates.test.ts`: every template in `TEMPLATES` passes `Design.safeParse`; ids are unique; Blank has no blocks and terms off; Sponsor's terms checkbox is on and its body is bracketed prompts.
- **Out of scope:** Photo hero and Minimal (T-018); the picker (T-019); any credit on the guest page for template photos (see decision).

## Acceptance criteria
- [ ] Importing `templates.ts` runs `Template.parse` on each template (a broken template fails the test run).
- [ ] Sponsor matches the values in Notes and uses `/templates/sponsor.jpg`.
- [ ] Image `src`s are either `/templates/<name>.jpg|jpeg|webp` or raster data URLs. PNG files under `/templates/` aren't allowed by the schema.
- [ ] Terms body is bracketed prompts only, never invented legal wording.
- [ ] Sponsor's content height in the compact layout is at most 600px by the arithmetic in Notes (review finding 17).
- [ ] `npm test` and `npx tsc --noEmit` pass.

## Dependencies
- T-001: Vitest, `tsconfig` and the `@/` alias.

## Notes
**Sponsor** (`id: "sponsor"`, name "Sponsor", description "Your logo, a bold headline and a sponsor thank-you over an event photo. Collects name and email."):
- Background: `{ type: "image", src: "/templates/sponsor.jpg", fit: "fill", zoom: 1, focus: { x: 50, y: 50 }, backdrop: "#0B1220", overlay: { from: "#1E293B", to: "#080C18", opacity: 0.7 } }`, no `credit`.
- Blocks (ids are fixed strings, e.g. `"sponsor-logo"`):
  1. image, `PLACEHOLDER_LOGO`, alt "Your logo", size `sm`.
  2. text "FREE WIFI", role heading, colour `#C6F432`, size 36.
  3. text "Proudly sponsored by", role subheading, colour `#FFFFFF`, size 15.
  4. image, `PLACEHOLDER_SPONSOR`, alt "Sponsor logo", size `sm`.
- Form: fields `["name", "email"]`, inputBg `#FFFFFF`, inputText `#111111`; terms `{ mode: "checkbox", label: "I agree to the", linkText: "terms of use", body: "[Paste your terms of use here.]\n\n[For example: who provides the WiFi, what guests may not do on it, and how their details are handled.]", textColour: "#FFFFFF", version: 1 }`; button `{ label: "CONNECT", bg: "#F97316", fg: "#111111", variant: "solid" }`.
- `TEMPLATE_CREDITS.sponsor = { name: "Marcel Strauß", profileUrl: "https://unsplash.com/@martzzl?utm_source=captivator&utm_medium=referral" }`.

**Fit arithmetic** (column padding 56 + 40, column gap 18, Form is one column child with internal gap 12 and fields gap 10, per T-005/T-007): logo `sm` 72 + heading 36px at ~1.15 line height ≈ 41 + subheading ≈ 21 + sponsor `sm` 72 + form (48 + 10 + 48 + 12 + 44 terms row + 12 + 50 button = 224) + 4 gaps × 18 = 72 + padding 96 ≈ 598px. If you change sizes, keep the total at or under 600px.

The schema's `ImageSrc` regex is `^(data:image\/(png|jpeg|webp);base64,|\/templates\/[\w-]+\.(jpg|jpeg|webp)$|https:\/\/)`.

## Decisions
- [`T-002-template-photos-and-credits.md`](../decisions/T-002-template-photos-and-credits.md): Template photos come from the canvas assets, and their credits live beside the templates, not in background.credit
- [`T-004-default-design-is-sponsor.md`](../decisions/T-004-default-design-is-sponsor.md): The store starts from the Sponsor template
