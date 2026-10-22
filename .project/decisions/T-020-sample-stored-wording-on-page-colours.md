---
title: "The Terms panel's live sample is a disabled, labelled checkbox showing the stored wording on the page's background colours"
type: decision
project: captivator
ticket: T-020
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, terms]
---
# The Terms panel's live sample is a disabled, labelled checkbox showing the stored wording on the page's background colours

## Context
The ticket asks for "an unticked, disabled checkbox plus '{label} {linkText}' styled as a link". The `EditorTerms` artboard draws the box as an `aria-hidden` span on the Sponsor navy (`#0F2A44`). Neither says whether the sample shows the drafts or the stored values while a field is empty, what backdrop it uses for gradients and photos, or how screen readers meet it.

## Decision
- The sample is a real `<label>` around `<input type="checkbox" disabled>` (never checked, `accent-color` = the button colour, as the guest row uses), so it is named "{label} {linkText}" and skipped by Tab. The link text is a bold underlined span, not a link.
- It shows the **stored** wording, like the preview, so an emptied field (which the store refuses) leaves the sample showing what guests would still see.
- Its backdrop is the page's colour, its gradient (with the renderer's `ANGLE`), or for a photo the backdrop blended with the overlay stops (`backgroundColours`), top to bottom. The text is `terms.textColour`.

## Alternatives
- **`aria-hidden` span as on the canvas:** the ticket names a disabled checkbox, and hiding the sample from screen readers adds nothing.
- **Show the drafts:** an empty draft would show a sample guests never see.
- **The photo itself behind the sample:** a small strip of a cropped photo says little, and the contrast line already says to check over the photo.

## Consequences
Tests that look for "the checkbox" in a page that also renders the preview must tell the two apart (the sample is the disabled one).
