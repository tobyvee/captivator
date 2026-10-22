---
title: "The export's final guard checks the body markup's elements, URL attributes, inline CSS and form action"
type: decision
project: captivator
ticket: T-023
decided_by: security-fixer
supersedes: T-023-final-attribute-guard.md
updated: 2026-10-23
tags: [project, captivator, decision, export, security]
---
# The export's final guard checks the body markup's elements, URL attributes, inline CSS and form action

## Context
`T-023-final-attribute-guard.md` made a final check on the finished page the backstop for future renderer changes. A security review found two gaps. First, the check only looked at a few tags and plain `src`/`href`/`action` attributes, so a loading CSS value in an inline style, a namespaced `xlink:href`, an SVG image element, a `<meta>` redirect, an extra `<style>` and `ping` all got through. Second, it accepted either placeholder action whatever the design's fields, so a renderer regression could send guest details to the router (against `general-export-form-action.md`). Neither gap can be reached with today's renderer.

## Decision
`renderPage` checks the rendered body, after the form comment is inserted but before the fixed document wrapper is added, and throws `ExportError(MSG_UNSAFE_OUTPUT)` if any of these fail:
- **Elements:** no `link`, `script`, `style`, `iframe`, `object`, `embed`, `base`, `meta`, `image`, `use` or `feImage` tag (case-insensitive).
- **URL attributes**, including namespaced forms such as `xlink:href`:
  - `src` must be a raster data URL.
  - `href` must be an in-page `#` fragment.
  - `action` must be the one placeholder the design calls for: `[PORTAL_SUBMIT_URL]` when it has fields, `[ROUTER_FORM_ACTION]` when it has none.
  - `srcset`, `formaction`, `poster`, `ping`, `background` and `data` aren't allowed at all.
- **Command input:** when the action is `[PORTAL_SUBMIT_URL]`, the body has no `name="command"` input.
- **Inline styles:** no `style` attribute contains `url(`, `image-set(`, `@import` or a backslash. A backslash would start a CSS escape, and hex colours, gradients and numbers never need one.

After wrapping, the page must contain exactly one `<style>`: the wrapper's own. Text content still isn't checked, because React escapes it and a web address in the terms is inert.

## Alternatives
- **Check the whole wrapped page, as before:** the wrapper's fixed `<meta>` and `<style>` would trip the new element rules.
- **Allow either placeholder action:** doesn't catch a regression that posts guest details straight to the router.
- **Parse the CSS, or allowlist individual properties:** more code for no gain. Rendered styles are hex colours, gradients and numbers, so refusing anything that can load is enough.
- **Refuse any `https://` text:** still rejected, for the reason in the superseded decision.

## Consequences
A splash change that draws a photo with `background-image`, adds an SVG `<use>`/`<image>`, adds its own `<style>` or `<meta>`, or puts a backslash in a style value fails export until this guard and a new decision cover it. Photo backgrounds must stay `<img>` elements with data URL sources. The check also runs on the measurement render that sizes the background re-encode, so an unsafe page fails before any re-encoding.
