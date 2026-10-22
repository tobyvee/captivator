---
title: "The export's final guard allowlists the elements and attributes SplashPage renders, written as React writes them"
type: decision
project: captivator
ticket: T-023
decided_by: main session
supersedes: T-023-guard-covers-css-and-form-action.md
updated: 2026-10-23
tags: [project, captivator, decision, export, security]
---
# The export's final guard allowlists the elements and attributes SplashPage renders, written as React writes them

## Context
`T-023-guard-covers-css-and-form-action.md` made the final check on the exported body a blocklist of elements, URL attributes and inline CSS. A security re-audit found two more gaps of the same kind. SVG paint and reference attributes and SVG animation elements can load or link without any of the blocked names. Raw markup that isn't quoted the way React quotes it got past every attribute rule. Neither is reachable from today's renderer, but each new blocklist entry only closes the case someone already thought of.

## Decision
`renderPage` checks the rendered body before the fixed form comment and the document wrapper are added, and throws `ExportError(MSG_UNSAFE_OUTPUT)` unless all of these hold:
- **Written as React writes it.** Every `<` starts a start or end tag of the form `<name name="value" …>` or `<name …/>`. Values are double-quoted and contain only React's five escapes (`&amp;`, `&quot;`, `&#x27;`, `&lt;`, `&gt;`). End tags carry no attributes. Single-quoted or unquoted values, other character references, comments and `/` between attributes all fail. Values are unescaped before the rules below.
- **Allowed elements only:** `a`, `button`, `div`, `form`, `h1`, `h2`, `img`, `input`, `label`, `p`, `path`, `section`, `span`, `svg`. This is exactly what SplashPage renders in export mode across the templates, every background type, every field set, terms on and off, both button variants and every block kind.
- **Allowed attributes only:** `action`, `alt`, `aria-hidden`, `aria-label`, `aria-labelledby`, `aria-modal`, `autocomplete`, `class`, `d`, `fill`, `height`, `href`, `id`, `inputmode`, `method`, `name`, `placeholder`, `required`, `role`, `src`, `stroke`, `stroke-linecap`, `stroke-width`, `style`, `tabindex`, `type`, `value`, `viewbox`, `width`. Names are compared lower-cased, and the list is the same for every element.
- **Value rules**, as before plus SVG paint:
  - `src` must be a raster data URL.
  - `href` must be an in-page `#` fragment.
  - `action` must be the placeholder the design's fields call for.
  - A `name="command"` input is refused when the action is the portal service.
  - `style` must contain no `url(`, `image-set(`, `@import` or backslash.
  - `fill` and `stroke` must be `none`, `currentColor` or a hex colour.

The wrapper must still contain exactly one `<style>`, its own. Text content still isn't checked: React escapes it, so a web address in the terms stays inert.

**Rule for later changes:** a renderer change that adds an element or attribute to the export fails the export until that name is added to the allowlist in `src/lib/export.ts`. Each addition needs its own decision file saying why the name can't load, link or post anything, and any value rule it needs.

## Alternatives
- **Keep extending the blocklist:** each audit has found a new name that loads. The set of HTML and SVG features that can fetch keeps growing, so a blocklist can't be complete.
- **Per-element attribute lists:** stricter, but more to maintain for little gain. The value rules already constrain every attribute that can carry a URL, and the attribute list is small.
- **A regex for unquoted values only, run on the whole body:** gives false positives on customer text with `name=value` in an alt or label, and on the fixed form comment, and still misses other character references.
- **A full HTML parser dependency:** a short strict tokenizer is enough, because the input is React's own regular output.

## Consequences
- The guard now runs before the form comment is inserted. That comment is a fixed constant, so it never needs checking.
- A new splash element (for example a credit link, a list or another icon element) or attribute (for example `title` or `for`) fails export until it's allowlisted with a decision.
- Raw markup through `dangerouslySetInnerHTML` can't pass the guard unless it's byte-for-byte the kind of markup React would write for allowed elements and attributes.
