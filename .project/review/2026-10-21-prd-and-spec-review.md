---
title: "Review: Captive Portal Designer PRD and Captivator MVP Tech Spec"
type: review
project: captivator
updated: 2026-10-22
tags: [project, captivator, review, prd, spec]
---
# Review: Captive Portal Designer PRD and Captivator MVP Tech Spec

## Summary verdict

Both docs are strong. The PRD's system context (Peplink parameters, how the iOS login sheet behaves, the consent rules) is unusually well researched, and the spec's core idea of one schema, one store and one renderer is right. The PRD's production-path sections need no changes before the MVP.

**Fix the spec before `/plan-tickets`.** Four of its instructions can't work as written:

- Inline styles can't hold the `100vh` fallback for `100dvh`.
- Template photos never get inlined into the export.
- A throttled undo history doesn't make one drag one undo step.
- The "one renderer" needs a render mode it doesn't define.

The Phase 0 section of the PRD also contradicts the spec on time budget, scope and cut order. Since agents will read both, one of them must win.

## Findings

### Critical: blocks the build or contradicts another doc

1. **The `100vh` fallback can't be written as an inline style.** Spec, *Splash renderer → Layout* (l.170). `min-height: 100vh; min-height: 100dvh` relies on a duplicate CSS property, but a React `style` object can hold only one `minHeight`. The renderer is inline-only by rule, so the fallback is impossible.
   - **Fix:** put the root's `min-height` pair in the export's single `<style>` block, as a class. In the editor frames, `inFrame` already uses `height: 100%`, so the preview doesn't need it.

2. **The export never inlines template photos.** Spec, *Export HTML* step 3 and *Template photos* (l.246). Step 3 inlines uploads (already data URLs) and Unsplash photos. Template backgrounds, though, are `/templates/*.jpg` paths from `public/`. In a downloaded file those paths break, and they fail the export test "no http(s) URLs".
   - **Fix:** in step 3, fetch every `src` that isn't a data URL (same-origin or Unsplash), run it through the downscale pipeline, and inline it. Add a template-photo case to the export test.

3. **The 100 KB budget can't be met with a photo background.** Spec, *Images* and *Export HTML*, against PRD P0 #4.
   - **Why:** a 1600px WebP at q0.8 is typically 150–400 KB, and base64 adds about 33%. Every photo template's export will therefore exceed 100 KB and show the warning.
   - **Production impact:** the PRD makes 100 KB a blocking publish rule, so this will matter in production.
   - **Fix:** re-encode for export separately: about 1000px on the long edge, about q0.6, applied at export time only. State the expected export size for each template. Alternatively, make the budget apply to everything except the background and say so.

4. **A throttled history doesn't make one drag one undo step.** Spec, *Undo/redo* (l.123), against PRD *Quick wins* ("Debounce history").
   - **The problem:** throttling at 400ms records a step every 400ms, so a 2-second colour drag creates about 5 undo steps. The spec's own test (20 rapid updates make one step) passes only because the updates are fast.
   - **Fix:** use a leading-edge debounce (`leading: true, trailing: false`, about 400ms) as zundo's `handleSet`. That records the state before the drag once, then ignores changes until input pauses.
   - **Test change:** spread the 20 updates over 2 seconds with fake timers.

5. **The one renderer needs a render mode.** Spec, *Splash renderer*, *Form* and *Export HTML*. Its output has to differ between the editor and the export in ways its props (`editable`, `compact`, `inFrame`) don't cover:

   | Element | Editor | Export |
   |---|---|---|
   | Terms link | `<button>` | `<a href="#terms">` |
   | `required` attributes | absent | present |
   | Form `method`/`action` and hidden `command` | absent | present |
   | Connect | runs validation and shows Error | native form submit |

   **Fix:** add `mode: 'edit' | 'preview' | 'export'` to `SplashPage`, list exactly what each mode changes, and replace the vague "in the editor it does nothing; in preview it runs validation" with that list.

6. **Phase 0 in the PRD contradicts the spec.** The spec should win, so the PRD should defer to it.

   | | PRD Phase 0 | Spec |
   |---|---|---|
   | Budget | 4 hours, plan 0:00–4:00 | 3 hours of coding |
   | Export HTML | stretch | required, never cut |
   | Cut order | Unsplash, Export HTML, focus drag, switcher | Unsplash, focus drag, switcher, logo palette, fit check |
   | Undo history | debounced | throttled (see #4) |

   **Fix:** trim PRD Phase 0 to the brief, the editor design and the schema, and point to the spec for the plan, cuts and stack. Delete the PRD's *4-hour plan* and its cut order.

7. **`design-schema.ts` "from the design phase" isn't in the repo.** Spec, *Data model* (l.93) and *Project structure*. The spec says to use it "as-is", but it doesn't exist here. Agents working from tickets can't use something they can't read.
   - **Fix:** commit it, e.g. as `.project/spec/design-schema.ts` or straight into `src/lib/`, or confirm the canvas contains it and link the exact artboard.

### Major: fix before the affected ticket is planned

8. **The URL validation accepts `javascript:`.** Spec, *Data model* ("Data URLs pass `z.string().url()`"). The check that admits data URLs also admits `javascript:`, `data:text/html` and any other scheme. `localStorage` can be hand-edited, so the schema is the trust boundary. In Zod 4, `z.string().url()` is also deprecated in favour of `z.url()`.
   - **Fix:** allow image `src` only as `https:` or `data:image/(png|jpeg|webp);base64`. Allow credit links only as `https://unsplash.com/...`. Add both to the schema tests.

9. **The export posts guest data straight to the router.** Spec, *Export HTML* step 6, against PRD *Where the portal service runs*. The form posts `command=login` plus the name, email and phone fields to `[ROUTER_FORM_ACTION]`. That's exactly what the PRD forbids: "Never 307 the guest's personal data on to the router"; capture goes to our service first, then a second form posts to `form_action`.
   - **Why it matters:** it's harmless in a mock-up, but the README presents the export as "a real, deployable page".
   - **Fix:** when fields are present, the placeholder should be `[PORTAL_SUBMIT_URL]`, with a comment explaining the two hops. Use `[ROUTER_FORM_ACTION]` only for click-through designs with no fields.

10. **Parts of the schema are missing or undefined.**
    - **Input colours:** the Fields panel edits input background and text colours (spec l.156), and the contrast check reads them (l.258), but the PRD's schema puts no colours on `form.fields`. Add `form.inputStyle: { background, text }`.
    - **"Sponsor block":** the Connected screen shows "the sponsor block if present" (l.199), but there's no sponsor block type, only image and text. Define it, e.g. as the second image block.
    - **Terms sheet colours:** the sheet uses "the background's first colour" and "the heading colour from the first heading block" (l.197). Neither exists for a photo background, or for a design with no heading. Give fallbacks: the backdrop colour or the photo's average colour, and `bestTextColour`.
    - **Error screen:** it shows an invalid email. If the design has no email field, or no fields and terms are off, there's nothing to show. Say which field is used, and hide Error from the switcher when nothing can fail.

11. **Stored designs are discarded silently.** Spec, *Persistence*. Two problems:
    - **Two version numbers:** `captivator:v2` with `version: 2` exist in an app that has never shipped a v1. And `Design.version` is a second, separate version whose relationship to the store's isn't explained. **Fix:** start at 1, and say which version gates which migration.
    - **Silent loss:** `merge` keeps the template when `safeParse` fails, so a schema change silently throws away a customer's work. **Fix:** show a "Couldn't restore your saved design" notice instead.

12. **The last edit can be lost.** Spec, *Persistence* (l.115). With writes debounced at 300ms, a change made just before closing the tab or tapping Templates is never saved.
    - **Fix:** flush pending writes on `pagehide` and `visibilitychange`.
    - **Also note:** the quota error then surfaces from inside a timer, so the flag has to be set there, not through a `setItem` that throws.

13. **Flexbox `gap` contradicts "plain, widely supported CSS".** Spec, *Layout*, against PRD *Behaviour decisions*. Safari only supports flexbox `gap` from 14.1 (iOS 14.5), and the PRD's own reason for avoiding `:has()` is "older iPhones pin older WebKit".
    - **Fix:** either state a minimum iOS version (15.4 also covers `dvh` and `accent-color`), or use margins between blocks. Stating a minimum is simpler.

14. **The photo contrast check can pass unreadable text.** Spec, *Checks → Contrast*. A photo's average colour can be mid-grey even when the strip behind the text is bright sky. That's exactly the "barely reads over its photo" failure the PRD's reference review found.
    - **Fix:** use the lightest (or darkest) 10th-percentile colour of the region behind the content column, plus the overlay. If that's out of time, say the check is approximate.

### Minor

15. **The fit check could measure the frame, not the content.** Spec, *Checks → Fit*. If the hidden container imposes the root's `min-height` or `height: 100%`, `scrollHeight` measures the frame rather than the content. Measure the column element, with the root's height unset.
16. **The large-text threshold is only half right.** Spec, *Checks*. Under WCAG, large text is 24px regular **or about 18.7px bold**. Headings at weight 800 qualify from 19px.
17. **The Sponsor template already fails the fit check.** PRD *Fit check* says it's about 690px tall, but the spec's template work (step 1/5) doesn't mention tightening it. Add that to the templates step.
18. **The Templates confirm is in the wrong place.** Spec, *Top bar*. Going back to the picker loses nothing, because the design is saved and "Continue your design" is shown. The data-losing action is **Use** on another template, so put the confirm there.
19. **Preview clicks on the terms link are ambiguous.** In `edit` mode, does tapping the terms link select the Terms row or open the sheet? Choose one; selecting it is consistent with the PRD's *Terms editing*.
20. **Wide logos can overflow.** Spec, *Blocks → Image*. A wide logo at 168px tall overflows the 364px content width. Add `max-width: 100%`.
21. **The output has no focus styles.** Inline styles can't express `:focus-visible`, so the exported page has only browser defaults. Add focus rules to the single `<style>` block.
22. **`react-dom/server` is bundled up front.** Spec, *Export HTML* step 1. Load it with `await import('react-dom/server')` when Export is clicked, so the editor bundle doesn't carry it.
23. **`lib/export.ts` is missing from Project structure,** although the Export section relies on it.
24. **The manual checklist step is inconsistent.** The spec says both "closes out step 8" and "Checklist (step 8)", but step 9 says "run through the testing checklist". Pick step 9.
25. **The spec's PRD link is a private claude.ai artifact.** Now that `.project/` is committed, link the repo path instead. Public readers can't open the artifact links, and that includes the canvas.
26. **The Unsplash cache won't reliably hold across serverless instances.** The in-memory cache may not survive between Vercel function instances, so rely on the `s-maxage` CDN cache for the 50/hour limit and say so.
27. **The schedule is very tight.** Step 1 (scaffold, Vercel link, schema, two templates, store with persist, Vitest and tests) is given 15 minutes. Step 3 (four panels, the upload pipeline and the colour picker popover) is given 45. Step 8 (undo, palette, contrast and fit checks) is given 12. The cut order covers the risk, but planning each step at 1.5× would show earlier where the cuts will fall.

### PRD-only (production path; none of it blocks the MVP)

28. **Answered questions are still listed as open.** The first row of *Open questions* starts with "Answered:". Move what's settled into *Router parameters*, and keep only the still-open spike checks.
29. **"Step 7" doesn't match the guest flow.** The *Router parameters* tables refer to steps 2–3, 4–5 and 7 from Peplink's diagram, but the PRD's guest flow has only 5 steps. Renumber, or say the numbers are Peplink's.
30. **The PRD doesn't say whether the MVP's system fonts are a deliberate cut.** P0 #1 calls for one custom font, but the MVP spec uses the system font stack only. That's fine for the MVP; say it's deliberate in Phase 0, so it doesn't read as a gap.

## Follow-ups

- [x] Fix critical findings 1–7 in the spec (6 also in the PRD) before running `/plan-tickets`. Applied 2026-10-21; each choice is a `general-*` file in `.project/decisions/`.
- [x] Fold the major findings (8–14) and the schedule (27) into the spec. Applied 2026-10-22; decisions in `.project/decisions/general-*`. Minor findings 15–26 are left to the tickets they affect.
- [x] Locate and commit `design-schema.ts` (finding 7). Saved as `src/lib/design-schema.ts`.
