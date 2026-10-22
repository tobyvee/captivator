---
title: "In the editor frames the splash root grows with its content, and the frame scrolls"
type: decision
project: captivator
ticket: [T-005, T-009]
decided_by: user
supersedes: general-root-min-height-in-export-style.md
updated: 2026-10-22
tags: [project, captivator, decision, splash, editor]
---
# In the editor frames the splash root grows with its content, and the frame scrolls

## Context
`general-root-min-height-in-export-style.md` put the export root's `min-height: 100vh; min-height: 100dvh` in the export's `<style>` block, and had editor frames keep `height: 100%` via `inFrame`. T-005 built that as `height: 100%; overflow-y: auto`, making the root its own scroll container. The T-005 code review found that T-006's background layers (`position: absolute; inset: 0` against the root) then cover only the first frame-height of the root's scroll area, so a design taller than the 740px phone frame scrolls into bare space in the editor while the export, whose root grows, is fine.

## Decision
The export part stands: in `export` mode the root carries `class="cv-root"`, and the export's single `<style>` block sets `.cv-root { min-height: 100vh; min-height: 100dvh }`. With `inFrame`, the root uses `min-height: 100%` and no overflow of its own, so it grows with its content as the export root does. The editor's frame viewports (T-009's `PhoneFrame` and `BrowserFrame`) scroll vertically instead of clipping.

## Alternatives
- An inner positioned `min-height: 100%` wrapper inside a root that keeps `height: 100%`: keeps the old wording, but adds an element the export doesn't have, and the fold line stays fixed while the content scrolls.
- Defer it: the editor shows a bare area under tall designs until a later ticket adds `SplashPage.tsx` to its touches.

## Consequences
- T-009's frames scroll (`overflow-y: auto`), and the phone frame's 600px fold line scrolls with the content, marking the same point of the page.
- T-019's thumbnails still clip, because their mini-frame is fixed-size with `overflow: hidden`.
- T-028's fit check is unaffected, because it renders without `inFrame`.
- The renderer stays inline-only apart from `cv-root`, and the `<style>` block remains the home for rules that inline styles can't express.
