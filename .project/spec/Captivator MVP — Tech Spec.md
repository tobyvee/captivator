# Captivator MVP — Tech Spec

Oct 21, 2026 · @Toby

## Overview

Build a Next.js editor where a non-technical customer styles a WiFi splash page and sees it live on mobile and desktop, in 3 hours of coding, deployed to Cloudflare Workers with [vinext](https://vinext.dev/) from a public GitHub repo with steady commits. Design is done: the [editor canvas](https://claude.ai/artifact/AWrSjgB8dZV2KWn8kkDeYj) and the Phase 0 section of the [PRD](../prd/Captive%20Portal%20Designer%20%E2%80%94%20PRD.md) are the source of truth for what it looks like.

**Must ship (the brief):**

- Logo or image upload.
- Background image or colour.
- Text blocks with colour and size.
- Up to two of Name, Email and Phone.
- Connect button colours.
- Instant mobile and desktop preview.

**Also required: Export HTML.** One click downloads the guest page as a single self-contained `.html` file, which proves the mockup is a real, deployable page and not just a picture.

**Planned on top, in priority order:** templates, gradient backgrounds, terms checkbox, localStorage persistence, undo/redo, logo palette, contrast and fit checks, guest-screen switcher, photo fit/zoom/focus, Unsplash search.

**Out of scope:** gateway integration, guest authentication, consent storage, publishing, accounts. These go in the README's path to production.

**Ground rules for the 3 hours:**

- **The splash renderer uses inline styles, not Tailwind.** One component then renders the editor preview and any export identically. Tailwind is for editor chrome only.
- **Everything is client-side except the Unsplash proxy.** No database, no auth.
- **Commit at every milestone in the build plan,** with honest messages; the history is part of the review.

## Stack and dependencies

Use Next.js 16 with the App Router and TypeScript, scaffolded with `create-next-app` (Tailwind, ESLint, `src/` dir). Then run `vinext init --platform=cloudflare`, so [vinext](https://vinext.dev/) builds the app with Vite and deploys it to Cloudflare Workers. vinext targets Next.js 16 and needs Node 22 or newer. The code stays standard Next.js; only the build and the host change. Add only what saves time over writing it.

| Package | Used for | Why not hand-roll |
| --- | --- | --- |
| [Next.js](https://nextjs.org) + React | App shell, one API route | Brief requirement |
| [vinext](https://vinext.dev/) | Vite build, Cloudflare Workers deploy | Runs the Next.js API on Workers; Vercel isn't available |
| [Tailwind CSS](https://tailwindcss.com) | Editor chrome only | Fast neutral UI |
| [Zod](https://zod.dev) | `Design` schema, validation on load | Types and runtime checks from one definition |
| [Zustand](https://zustand.docs.pmnd.rs) + `persist` | Store, localStorage | Persistence, versioning and migration built in |
| [zundo](https://github.com/charkour/zundo) | Undo/redo | Temporal middleware for Zustand in a few lines |
| [react-colorful](https://github.com/omgovich/react-colorful) | Colour picker | Tiny, accessible, no dependencies |
| [fast-average-color](https://github.com/fast-average-color/fast-average-color) | Logo palette, photo tone for contrast | Saves writing canvas sampling |
| [lucide-react](https://lucide.dev) | Editor icons | Matches the canvas's stroke icons |
| [@dnd-kit/sortable](https://dndkit.com) | Drag to reorder blocks | Stretch only; ship up/down buttons first |
| Vitest + Testing Library | Unit tests, two jsdom component tests | Fast, TypeScript without config, runs in the build script |

**Not adding:** a UI component library (the editor is a handful of controls), a form library, or any database. `nanoid` isn't needed; use `crypto.randomUUID()` for block ids.

## Architecture

&#91;embedded content: architecture · store, renderer and its four consumers\]

Editor panels only ever dispatch store actions. Everything a guest or reviewer sees comes out of the one `SplashPage` renderer, so the preview can't drift from the templates, the fit check or an export.

## Project structure

One route for the editor, one for the template picker, one API route. The splash renderer and the schema have no editor or Next.js imports, so they could later move to the portal service unchanged.

```
src/
  app/
    page.tsx                  # template picker (start screen)
    editor/page.tsx           # editor shell (client component)
    api/unsplash/route.ts     # GET search, POST download ping (stretch)
    layout.tsx, globals.css
  lib/
    design-schema.ts          # Zod Design, Template, FIELD_SPEC (committed from the design phase)
    templates.ts              # SPONSOR, PHOTO_HERO, MINIMAL, BLANK
    store.ts                  # Zustand + persist + zundo
    contrast.ts               # WCAG luminance, ratio, bestTextColour
    images.ts                 # downscale to data URL, palette extraction
    fit.ts                    # small-phone fit measurement
  splash/                     # pure renderer, inline styles only
    SplashPage.tsx            # Design + screen -> page
    Background.tsx
    blocks/TextBlock.tsx, ImageBlock.tsx
    Form.tsx                  # fields, terms row, Connect
    TermsSheet.tsx, Connected.tsx
  editor/
    TopBar.tsx                # name, Mobile/Desktop, undo/redo, Templates
    BlockList.tsx             # three zones, add, reorder, terms switch
    Inspector.tsx             # routes to the panel for the selection
    panels/BackgroundPanel.tsx, TextPanel.tsx, ImagePanel.tsx,
           FieldsPanel.tsx, TermsPanel.tsx, ButtonPanel.tsx
    controls/ColourField.tsx, Segmented.tsx, Slider.tsx, ImageUpload.tsx
    PreviewStage.tsx          # frames, screen switcher, checks
    frames/PhoneFrame.tsx, BrowserFrame.tsx
public/templates/             # template photos (downloaded, credited)
```

## Data model and store

`src/lib/design-schema.ts`, committed from the design phase, is used as-is apart from the URL allowlist below: `Design = { version, background, blocks, form }`, where only `blocks` (image and text) is reorderable, `form` holds fields, terms and button, and `FIELD_SPEC` owns input attributes. Image `src` and Unsplash credit URLs are allowlisted by scheme and host rather than validated as "any URL": images are raster data URLs (`png`, `jpeg`, `webp`), bundled `/templates/*` photos or `https:`; credit links are `https://unsplash.com/...` and download pings `https://api.unsplash.com/...`. That rejects `javascript:`, `data:text/html` and other schemes, which matters because a stored design can be hand-edited in localStorage.

One Zustand store holds the design plus UI state:

```ts
type EditorState = {
  design: Design;                       // persisted + tracked by undo
  name: string;                         // persisted
  selection: { kind: 'background' | 'block' | 'fields' | 'terms' | 'button'; id?: string };
  device: 'mobile' | 'desktop';
  screen: 'landing' | 'terms' | 'error' | 'connected';
  logoPalette: string[];                // suggestions, never saved in Design
  // actions: loadTemplate, updateBackground, addBlock, updateBlock, removeBlock,
  //          moveBlock(id, -1 | 1), updateForm, setSelection, setDevice, setScreen
};
```

**Persistence (`persist`):**

- Key `captivator:v2`, `partialize` to `{ design, name }` only. The `2` matches `Design.version` (the schema is version 2 from the design phase); the store's `version` and the schema's move together, and a schema change bumps both and adds a `migrate` step.
- `version: 2` with a `migrate` that returns the template on anything older.
- Storage is `createJSONStorage(() => localStorage)` wrapped so `setItem` catches `QuotaExceededError` and sets a "Couldn't save locally" flag instead of throwing.
- Debounce writes about 300ms with a thin storage wrapper, so slider drags don't re-serialise image data URLs dozens of times a second.
- Flush the pending write immediately on `pagehide` and on `visibilitychange` to `hidden`, so an edit made just before closing the tab or switching apps isn't lost. The quota error can now surface from the timer or the flush, so the wrapper sets the "Couldn't save locally" flag there rather than relying on `setItem` to throw.
- `skipHydration: true`, then `useStore.persist.rehydrate()` in a `useEffect` on the editor page, rendering a skeleton until `hasHydrated`. This avoids the server/client mismatch and the template flash.
- `merge` runs `Design.safeParse` on the stored value and keeps the current template if it fails, setting a `restoreFailed` flag. The editor then shows "Couldn't restore your saved design" instead of silently replacing the customer's work.

**Undo/redo (zundo `temporal`):**

- `partialize: s => ({ design: s.design })`, so selection, device and screen changes aren't undo steps.
- `limit: 100`.
- `handleSet` wrapped in a leading-edge debounce (about 400ms, `leading: true, trailing: false`): the state before a change is recorded once, then nothing more until input pauses for 400ms, so one drag is one step however long it lasts. A throttle would record a step every 400ms of a long drag.
- Keyboard: Cmd/Ctrl+Z, Shift+Cmd+Z and Ctrl+Y on `window`, ignored when focus is in a text input or textarea, so native text undo still works there.
- History is in memory only.

**Templates:** `lib/templates.ts` exports four `Template` objects, each parsed with `Design.parse` at module load, so a broken template fails the build, not the demo. Switching template keeps the customer's uploaded images and text where the new template has a block of the same kind.

## Editor UI

The editor is three columns (block list 280px, preview stage, inspector 320px) under a top bar, stacking on narrow screens with `flex-wrap`, exactly as on the canvas. Every control is a real `<button>`, `<input>` or `<label>`, with 44px tap targets.

**Top bar.** Design name input, Mobile/Desktop segmented control, undo/redo icon buttons (disabled when history is empty), Templates (back to the picker, with a confirm if there are changes), and Export HTML (primary button).

**Block list (`BlockList`):**

- **Zone 1:** Background, pinned, with a swatch.
- **Zone 2:** image and text blocks, each with its type icon, a one-line summary and up/down buttons; drag handles come with the @dnd-kit stretch work. Below them, "+ Text" and "+ Image", where + Image is disabled with "2 of 2 images used".
- **Zone 3:** Fields, Terms (with a `role="switch"` toggle) and Connect, pinned.
- **Selection:** clicking a row sets `selection`, and the selected row gets the blue style and `aria-current`.

**Preview stage (`PreviewStage`):**

- Landing/Terms/Error/Connected switcher above the frame.
- `PhoneFrame` (375 × 740) or `BrowserFrame` (scales a 1280 × 800 page into the stage width with `transform: scale`).
- `SplashPage` inside, with `mode="edit"`: clicking a block in the preview calls `setSelection`, and the selected block gets an outline and a name chip.
- Under the frame: the readability result, the fit warning and the "Couldn't save locally" flag when present.

**Inspector panels** (one per selection kind, all live-updating the store):

- **Background:** Colour / Gradient / Photo tabs.
  - Gradient: two `ColourField`s and three direction presets.
  - Photo: Upload or Unsplash search, Fill/Show whole photo, Zoom 100–200%, a 3×3 focus grid (drag dot is stretch), and a darken slider with fade direction.
- **Text:** a textarea (max 120), Heading/Subheading/Body presets (setting a size and weight default), a size slider 12–56, and a `ColourField`.
- **Image:** replace upload, required alt text, S/M/L size, remove.
- **Fields:** three checkboxes for Name/Email/Phone with a max of 2 (the third disables once two are ticked), plus input background and text colours.
- **Terms:** an on/off switch, two wording inputs with a live sample, the body textarea (max 8,000, a blank line makes a paragraph), text colour, and a version note.
- **Connect button:** label (max 24), background and text colours, Solid/Outline.

**`ColourField`:** a swatch button opening a react-colorful popover, a hex input validated on blur, then two swatch rows, "In this design" (colours already used) and "From your logo" (`logoPalette`).

**Template picker (`/`):** four cards rendering a scaled-down `SplashPage` of each template, not screenshots, so they never drift from the real output. "Use" loads the template into the store and routes to `/editor`. If a saved design exists, show "Continue your design" first.

## Splash renderer

`SplashPage({ design, screen, mode, compact?, inFrame? })` is a pure component that renders the guest page from a `Design` using inline style objects only, so the preview, the template thumbnails, the fit check and Export HTML all share one output.

**Render mode.** `mode` is the only thing that varies the markup between consumers; `compact` and `inFrame` change layout only. Never branch on anything else.

| | `edit` (editor preview) | `preview` (thumbnails, fit check) | `export` (Export HTML) |
| --- | --- | --- | --- |
| Clicking a block | `setSelection`, with outline and name chip | nothing (`pointer-events: none`) | nothing |
| Terms link | `<button>` that selects the Terms row | `<button>` that opens the Terms sheet | `<a href="#terms">` |
| Connect | validates, then shows Error or Connected | nothing | native form submit |
| `required` on inputs and the terms checkbox | absent | absent | present |
| Form `method`, `action` and hidden `command` | absent | absent | present |
| Root `class="cv-root"` (see Layout) | absent | absent | present |
| Unsplash photo credit | "Photo: {name} / Unsplash" with both links (`target="_blank"`) | same as `edit` | plain text, no links ([decision](../decisions/T-006-export-credit-plain-text.md)) |

**Minimum target:** iOS 15.4 and Android WebView on Chrome 108 or newer. That covers flexbox `gap`, `dvh` units and `accent-color`, all of which the output uses. Older WebKit is out of scope for the MVP.

**Layout: flexbox within the viewport.**

- **Root:** `position: relative`, with the background layers absolutely positioned behind. Its full-viewport height can't be an inline style, because the `100vh` fallback for `100dvh` needs the property twice and a React style object holds one value per key. In `export` mode the root carries `class="cv-root"` and the export's `<style>` block sets `.cv-root { min-height: 100vh; min-height: 100dvh }` (the second wins where supported).
- **Column:** `display: flex; flex-direction: column; align-items: center; gap: 18px; max-width: 420px; margin: 0 auto; padding: 56px 28px 40px; text-align: center`.
- **Order:** content blocks in array order, then a `flex: 1` spacer, then the form. With `compact` (used by the fit check) the spacer is omitted.
- **No absolute positioning or fixed heights for content.**
- **Inside the editor frames,** the root uses `min-height: 100%` when `inFrame` is set, so it fills the phone or browser frame rather than the window and grows with its content; the frame scrolls (`general-splash-root-grows-in-frame.md`).

**Background (`Background.tsx`):**

- **Colour:** a solid fill.
- **Gradient:** `linear-gradient(180deg | 135deg | 90deg, from, to)` for down / diagonal / right.
- **Photo:** an `<img>` with `object-fit: cover | contain`, `object-position: x% y%`, `transform: scale(zoom)` and `transform-origin: x% y%`, over the `backdrop` colour. The overlay is a `linear-gradient(direction, transparent, to)` at `opacity`.
- **Credit:** Unsplash credit renders as a small corner line on the page as well as in the editor.

**Blocks:**

- **Text:** `h1` for the first heading, `h2` for other headings, `p` otherwise; `font-size`, `color`, and weight from role (800 / 500 / 400); `white-space: pre-line`, so line breaks typed in the editor survive.
- **Image:** `<img alt>` sized S 72px, M 120px, L 168px tall, `object-fit: contain`.

**Form (`Form.tsx`):**

- **Inputs:** one per field from `FIELD_SPEC`, with `type`, `autocomplete`, `inputMode`, an `aria-label` and a placeholder, 16px text, 48px tall.
- **Terms row:** a `<label>` wrapping an unticked checkbox (`accent-color` = button background) plus the label text and the terms link, a link-styled `<button>` or `<a>` depending on `mode`.
- **Connect:** a 66%-wide 50px button, solid or outline. Its behaviour depends on `mode` (see **Render mode**).

**Guest screens:**

- **Landing:** as above.
- **Terms:** the landing page dimmed by a 55% black overlay, with a bottom sheet (82% height; its colour is the background's colour, its gradient's first stop, or a photo's `backdrop`; its text is the first heading block's colour if that passes contrast on the sheet, otherwise `bestTextColour(sheet)`) holding the title, a close button, the body split on blank lines into `<p>`, the version, and a CLOSE button styled like Connect.
- **Error:** the landing page as a failed Connect would show it: the first field gets an example invalid value and its error ("Enter a valid email", "Enter your name", "Enter a valid phone number"), and when terms are on they're unticked with "Please accept the terms". With no fields and terms off nothing can fail, so the switcher hides Error. Error text and the red outline use a colour picked by `bestErrorColour(background)`, light red on dark backgrounds and dark red on light ones.
- **Connected:** logo, a tick badge, "You're online", the sponsor block if present, and a CONTINUE button. The **sponsor block** is the design's second image block, when there is one; there's no separate block type.

### Export HTML

`lib/export.ts` turns the current `Design` into one standalone HTML file that works with no network and no JavaScript, then downloads it.

1. **Render:** `renderToStaticMarkup(<SplashPage design={d} screen="landing" mode="export" />)` from `react-dom/server`, which runs fine in the browser bundle.
2. **Wrap:**
   - Doctype, `lang`, charset and `<meta name="viewport" content="width=device-width, initial-scale=1">`.
   - A `<title>` from the design name.
   - `body { margin: 0 }` and the system font stack.
3. **Images:** every image `src` in the design that isn't already a data URL is fetched, run through the upload pipeline and inlined, so the file makes no network requests.
   - This covers template photos (same-origin `/templates/*.jpg` from `public/`) and Unsplash backgrounds (their CDN allows CORS); uploads are already data URLs.
   - The background is then re-encoded to fit the page budget (see **Export re-encode** under Images).
   - Unsplash credit lines are kept. The README notes this self-hosting is pending Unsplash's confirmation.
4. **Terms without JS:**
   - The terms link is `<a href="#terms">` and the sheet is a `<section id="terms">`, hidden until `:target`.
   - Closing is `<a href="#">`.
   - This `<style>` block also holds the root's `min-height` pair (see **Layout**). It's the only `<style>` block in the file.
5. **Validation without JS:** inputs and the terms checkbox get `required` (plus the right `type`), so the browser itself blocks submission and says why.
6. **Form:** `method="post"` and an `action` placeholder that depends on whether the design collects guest data:
   - **With fields:** `action="[PORTAL_SUBMIT_URL]"`, with an HTML comment explaining the two hops from the PRD (*Where the portal service runs*): the guest's details go to our portal service first, which records them and then logs the guest in at the router with no personal data. Guest personal data is never posted to the router.
   - **Click-through (no fields):** `action="[ROUTER_FORM_ACTION]"`, the gateway's login address, with a hidden `command=login` and a comment explaining them. Both currently follow one vendor's login step, as an example; whether to make them vendor-neutral is waiting on the user (`T-047-export-comments-left-for-user.md`).
7. **Download:** a `Blob` (`text/html`) through a temporary `<a download="<design-name>.html">`.
   - Show the file size against the 100 KB budget in the toast, noting when the background was re-encoded to fit.
   - Warn, but still download, if still over.

## Images and Unsplash

Every uploaded image is downscaled in the browser before it touches the store, which keeps localStorage within quota, the page within its 100 KB budget, and the preview fast.

**Upload pipeline (`lib/images.ts`):**

1. `<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml">`; reject over 10 MB before decoding.
2. Decode with `createImageBitmap` (an `<img>` for SVG), so SVG is rasterised and never stored as markup.
3. Draw to a canvas capped at 600px on the long edge for logos and images, 1600px for backgrounds.
4. `canvas.toBlob('image/webp', 0.8)`, falling back to JPEG 0.82 if WebP comes back empty (older Safari), then convert to a data URL.
5. Warn if the result is over 150 KB.
6. Logos and transparent images keep PNG if the WebP is larger.

**Export re-encode:** a 1600px background at WebP 0.8 is typically 150–400 KB before base64 adds about a third, so a stored background alone breaks the 100 KB page budget. At export time only (the stored design keeps the sharper image for the editor):

1. Build the page with every other image inlined and measure it; the background's allowance is 100 KB minus that size.
2. Re-encode the background at 1000px on the long edge, stepping WebP quality 0.7 → 0.6 → 0.5 → 0.4 until its base64 length fits the allowance.
3. If it still doesn't fit, repeat at 800px.
4. Stop at the smallest attempt and let the toast warn if the page is still over. Photos sit behind an overlay, which hides compression artefacts.

This is a pure loop over an injected `encode(size, quality)` function, so the stepping logic is unit-tested without a canvas.

**Logo palette:** after a logo or image upload, run fast-average-color on the downscaled canvas. Its dominant colour plus a small k-means over a 32×32 sample gives 3–4 distinct swatches (skip near-duplicates within ΔE \~10). Write them to `logoPalette`.

**Unsplash (stretch, `app/api/unsplash/route.ts`):**

- **`GET ?q=`:** calls `https://api.unsplash.com/search/photos?query=…&orientation=portrait&per_page=12` with `Authorization: Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`. Returns only `id`, `urls.small`, `urls.regular`, `user.name`, `user.links.html` and `links.download_location`, with `Cache-Control: public, max-age=3600`.
- **`POST {downloadLocation}`:** pings the download endpoint server-side when a photo is chosen, as the API guidelines require. Only accept `api.unsplash.com` URLs, so the route can't be used as an open proxy.
- **Client:** the search input is debounced 400ms; results show as a 2-column grid. Picking one sets `background.src` to `urls.regular` + `&w=1600&q=70`, hotlinked, and stores the credit with the `?utm_source=captivator&utm_medium=referral` links.
- **Demo-mode limit is 50 requests an hour.** On Workers, an `s-maxage` header isn't cached at the edge and memory is per isolate. So cache the upstream search for an hour in vinext's KV-backed data cache (`T-031-unsplash-cache-in-data-cache.md`).

**Template photos:** the four templates use Unsplash photos downloaded into `public/templates/` under the Unsplash License, with credits in the template data. They don't depend on the API key.

## Checks

Three checks run on every change and surface under the preview. They warn; they never block editing.

**Contrast (`lib/contrast.ts`):** WCAG relative luminance and ratio, with a threshold of 4.5:1 for normal text and 3:1 for text 24px and up.

- **What the background colour is, per type:**
  - Colour: the fill itself.
  - Gradient: both stops, worst case wins.
  - Photo: the photo's average colour (fast-average-color on the downscaled image) blended with the overlay's end colour at its opacity.
- **What's checked:** every text block, the terms label, the button label against the button background, and input text against input background.
- **Result:** "All text is readable", or the first failure by name ("Heading: 2.1:1 on the background"). On photo backgrounds the check is approximate, because an average colour can hide a bright strip behind the text; the message says "Check readability over your photo" instead of claiming a pass.
- **Helpers:** `bestTextColour(bg)` (near-black or white, whichever passes) and `bestErrorColour(bg)` power the error screen; a one-tap Fix is stretch work.

**Fit (`lib/fit.ts`):**

- Render `<SplashPage mode="preview" compact />` into a hidden 375px-wide container and read its `scrollHeight` through a `ResizeObserver`, re-measured on design changes.
- If it exceeds 600px (an iPhone SE login sheet), show the amber "Too tall for small phones" note and the dashed small-phone fold line in the mobile frame.

**Limits, enforced in the UI and the schema:**

| Rule | Limit | Where |
| --- | --- | --- |
| Images | 2 | + Image disabled with a count |
| Fields | 0–2, unique | Third checkbox disabled |
| Text block | 120 characters | Counter in the inspector |
| Button label | 24 characters | Input `maxLength` |
| Terms body | 8,000 characters | Counter in the inspector |
| Upload | 10 MB in, about 150 KB stored | Error message, size warning |

## Build plan

The step times below are the original targets for the user's own time; they stay as written so the commit history can be compared against them. They don't limit agent work, so nothing is cut or shrunk to fit them. The brief's minimum is covered by 1:30. Everything after it is ordered so that stopping at any milestone still leaves a working, deployed app. Each step ends with its unit tests passing, a commit and a deploy.

1. **0:00–0:15: Scaffold.** `create-next-app` then `vinext init`, deps, the deploy workflow, `design-schema.ts`, `templates.ts` (Blank and Sponsor), store with persist, Vitest configured with the schema and contrast tests. *Commit: "Scaffold, schema and store".*
2. **0:15–0:45: Renderer and preview.** `SplashPage` with colour and gradient backgrounds, text, image, fields and Connect; `PhoneFrame`, `BrowserFrame`, Mobile/Desktop toggle. *Commit: "Splash renderer with mobile and desktop preview".*
3. **0:45–1:30: Editor core, which meets the brief.** Block list with the three zones, add/remove/up-down; Text, Image (upload pipeline), Fields and Connect panels; `ColourField`; click-to-select in the preview. *Commit: "Editor: blocks, fields, button, uploads".*
4. **1:30–1:55: Background panel.** Colour, Gradient, Photo upload, Fill/Fit, Zoom, 3×3 focus, darken overlay. *Commit: "Background options".*
5. **1:55–2:10: Templates and persistence.** Picker page with live thumbnails, Photo hero and Minimal templates, hydration guard, "Continue your design". *Commit: "Templates and saved designs".*
6. **2:10–2:25: Terms and guest screens.** Terms row and panel, the screen switcher, Terms sheet, Error and Connected. *Commit: "Terms and guest screens".*
7. **2:25–2:40: Export HTML.** `lib/export.ts`, the Export button, size toast, no-JS terms and validation; open the downloaded file on a phone. *Commit: "Export standalone HTML".*
8. **2:40–2:52: Quick wins and checks.** Undo/redo with shortcuts, logo palette, contrast check, fit check. *Commit: "Undo, logo palette, readability and fit checks".*
9. **2:52–3:00: README and final deploy.** Run through the testing checklist on a real phone, then write the README. *Commit: "README".*

**Cut order, applied only on request (time never forces a cut):** Unsplash, focus-point drag (keep presets), the screen switcher down to Landing and Terms, the logo palette, then the fit check. Never cut persistence, Export HTML or the brief's minimum.

**Stretch, scheduled at P2 after the planned work:** Unsplash search, drag-to-reorder with @dnd-kit, and the one-tap contrast Fix.

## Testing, deploy and README

Every pure module gets Vitest unit tests, written by Claude Code in the same step as the module, from the cases listed below rather than "add tests". A 10-minute manual pass on a real phone still closes out step 8, because the hard parts here (layout in the iOS sheet, uploads from a camera roll) aren't unit-testable.

### Unit tests

**Setup:** [Vitest](https://vitest.dev) with `environment: 'node'` by default and `jsdom` per file for the two component tests, plus [Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for those. `npm test` runs `vitest run`. The build script is `vitest run && vite build`, and the deploy workflow runs it before deploying, so a failing test blocks the deploy. Vitest keeps its own `vitest.config.ts`, without the vinext or Cloudflare plugins.

**What to test, by module:**

| Module | Cases |
| --- | --- |
| `design-schema` | All four templates parse. Rejects a third image, a third field, a duplicate field, a bad hex, text over 120 characters. Accepts a data-URL `src`, a `/templates/...` `src` and an `https:` `src`. Rejects a `javascript:` `src`, a `data:text/html` `src` and an `http:` `src`. Rejects a credit `profileUrl` that isn't on `unsplash.com`. |
| `contrast` | White and black luminance are 1 and 0. Black on white is 21:1. #777777 on white fails 4.5:1. Large text passes at 3:1. A gradient takes the worse stop. `bestTextColour` gives white on navy and near-black on yellow. |
| `store` actions | `addBlock` refuses a third image. `moveBlock` stops at the ends. `removeBlock` clears a stale selection. Fields cap at 2. `loadTemplate` keeps uploaded images and text. |
| Persistence | Corrupt or schema-invalid stored JSON falls back to the template. An older `version` migrates to the template. A storage that throws `QuotaExceededError` sets the "couldn't save" flag instead of crashing. A schema-invalid stored design sets `restoreFailed`. A pending debounced write is flushed on `pagehide`. |
| Undo | With fake timers, 20 colour updates spread over 2 seconds (100ms apart) make one undo step; two bursts separated by a 500ms pause make two. Selection and device changes aren't undoable. |
| `images` (pure parts) | Target size keeps aspect ratio and caps the long edge (600 or 1600). Palette dedupe drops near-identical colours and returns at most 4. The export re-encode loop, with a fake encoder, steps quality down then size down, stops at the first attempt that fits the allowance, and returns the smallest attempt when none fits. |
| `fit` | The decision function warns above 600px and not at or below it. |
| `SplashPage` (jsdom) | Each field renders the `type`, `autocomplete` and `inputmode` from `FIELD_SPEC`. The terms row is absent when off. The checkbox is never pre-checked. Text blocks render in array order. `edit` and `preview` modes render no `required`, form `action` or `cv-root`; `export` renders all three and an `<a href="#terms">`. |
| Unsplash route | Trims the API response to the allowed fields. Refuses a download ping to any host but `api.unsplash.com`. |
| export | Output starts with a doctype and has a viewport meta. It contains no http(s) URLs at all: every image is a data URL and the photo credit is plain text, and there is no `<link`. Required fields and the terms checkbox carry required. The terms sheet has id="terms" and a :target rule. A design with fields posts to the \[PORTAL\_SUBMIT\_URL\] placeholder and has no `command` input; a design with no fields posts to \[ROUTER\_FORM\_ACTION\] with `command=login`. Design-name text is HTML-escaped in the title. A design using a template photo (`/templates/...`) exports it as a data URL. The `<style>` block contains the `.cv-root` `100vh`/`100dvh` pair. |

**Not unit-tested:** canvas downscaling and fast-average-color (need a real browser), `ResizeObserver` measurement, and visual layout. These are covered by the manual checklist.

**Checklist (step 8):**

- [ ] Each brief item works: logo upload, background image and colour, add text with colour and size, two of Name/Email/Phone, button colours.
- [ ] Preview updates on every keystroke and slider move, in both Mobile and Desktop.
- [ ] Refresh the page and the design is still there; clear storage and it falls back to the template without errors.
- [ ] Undo and redo through a colour drag (one step) and a text edit; Cmd+Z inside a textarea undoes text, not the design.
- [ ] A third image or field can't be added; a 4 MB phone photo uploads and lands under 150 KB.
- [ ] Each template loads; switching template keeps the uploaded logo.
- [ ] White text on a white background shows the contrast warning; adding five text blocks shows the fit warning.
- [ ] Keyboard only: Tab reaches every control; switches and segmented controls announce their state.

**Deploy:** Cloudflare Workers via vinext. A GitHub Actions workflow runs `npm run build` (tests first) and deploys on every push to `main`. It uses the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets, so add those before the scaffold is pushed. The live URL is the Worker's `workers.dev` address. Set `UNSPLASH_ACCESS_KEY` as a Worker secret only if Unsplash ships. Before sending, confirm the production URL loads on mobile data, not just home WiFi.

**README contents:**

1. One line on what it is, the live URL, and a screenshot or GIF.
2. Run locally: `npm i && npm run dev`, plus the optional env var.
3. What's in it, mapped to the brief's list, then the extras.
4. Key decisions, one line each:
   - The schema-first `Design` with three zones.
   - The inline-styled renderer shared by preview and export.
   - Flexbox within the viewport.
   - Client-side downscaling.
   - The small-phone fit check.
5. **Path to production:**
   - One fixed external splash URL per router, routing on whatever unit identifier the gateway sends.
   - The gateway's login step, with its login hosts allowlisted.
   - Portal service on Cloudflare Workers + Hono.
   - Gated access (whatever mechanism the gateway supports) before data capture.
   - Consent records and terms versions.
   - Unsplash self-hosting pending confirmation.
   - Link to the PRD for the rest.
6. What I'd do next with more time, and what was cut and why.
