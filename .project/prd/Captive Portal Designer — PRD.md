# Captive Portal Designer — PRD

Oct 21, 2026 · @Toby

## Summary and problem

Build a self-serve designer that lets event producers and sponsors brand the guest Wi-Fi login on PopUp WiFi units and publish it in minutes, replacing today's template-plus-seven-day manual process. Designs are hosted on our own HTTPS service and reach guests through the Peplink router's external splash page. Publishing a design never touches the device.

**The problem today.** PopUp WiFi's [CAPTIVATE](https://popupwifi.com.au/captivate/) add-on needs sponsor assets at least 7 days before the event. PopUp staff then build the page from templates, and data-capture spreadsheets arrive within 12 hours of the event ending.

**What that costs.**

- **Late sponsor deals** can't be activated.
- **Every change** costs staff time.
- **Sponsor data** arrives after the event, when it's too late to act on.
- **The headline sponsor metric is inflated.** "One connection = one website visit" assumes guests are redirected to the sponsor URL on their first browser request. The iOS Captive Network Assistant and HTTPS make that unreliable (see Constraints).

**Who has the problem.**

- **Event producers** who sell guest Wi-Fi as sponsorship inventory.
- **Sponsors** who need the activation to look on-brand and prove a return.
- **PopUp WiFi's solutions team**, who currently do the build by hand.

## Phase 0: Captivator MVP

The first deliverable is a test project: a Next.js visual editor for mocking up a branded splash page, built in up to 4 hours in total, 3 of them coding, pushed to a public GitHub repo throughout. The [MVP tech spec](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md) is the source of truth for its stack, build plan, scope and cut order; where this section and the spec differ, the spec wins. It tests editor UX for non-technical customers and scoping judgement, not the portal runtime. Everything from System context onward describes the product it leads to. Design references are the activations on the [CAPTIVATE page](https://popupwifi.com.au/captivate/).

**Brief minimum.** A customer can:

- Upload a logo or image.
- Upload a background image or choose a background colour.
- Add text and adjust its colour and size.
- Add up to two fields from Name, Email and Phone.
- Set the Connect button's background and text colour.

The brief also asks for an instant live preview with mobile and desktop views, and an editor a non-technical customer finds intuitive.

**Out of scope for the MVP.** Router integration, RADIUS, consent storage, publish/rollback, multi-tenancy and the real guest flow. These go in the README as the path to production.

### What the references show

All nine CAPTIVATE examples share one layout: a centred column of logo → headline → optional sponsor block → 0–2 fields → Connect.

- **Backgrounds:** six use a full-bleed photo; three use a solid colour or gradient.
- **Sponsor logo:** a third carry one as a second image.
- **Headlines:** big, bold, often two-colour.
- **Fields:** plain white, placeholder-only.
- **Connect button:** a rounded accent colour, sometimes an outline.
- **Terms:** one has a T&Cs checkbox.
- **Legibility:** at least one has text that barely reads over its photo.

### Editor design

The layout is drawn on the [Captivator editor canvas](https://claude.ai/artifact/AWrSjgB8dZV2KWn8kkDeYj), in neutral greys so the customer's design is the only colour on screen.

- **Start screen:** pick a template (Sponsor, Photo hero, Minimal) or Blank. Switching templates later keeps the customer's content.
- **Top bar:** design name, a Mobile / Desktop preview toggle, undo/redo, Templates, Export HTML.
- **Left: the block list, in three zones.**
  - Background, pinned top.
  - Image and text blocks, draggable, with + Text / + Image and "2 of 2 images used" when full.
  - Fields, Terms (with an on/off switch) and Connect, pinned bottom.
- **Centre: the preview.**
  - Mobile shows a 375px phone frame; Desktop shows a browser frame where the background fills the window and the content column stays 420px.
  - A Landing / Terms / Error / Connected switcher shows every guest screen.
  - Tapping anything in the preview selects it for editing.
  - Below the preview: a page-weight meter (budget 100 KB) and a readability check.
- **Right: the inspector for the selected block.**
  - Text: content, a Heading/Subheading/Body preset, a size slider (12–56px), colour with swatches from the design, and a contrast result checked against both ends of a gradient.
  - Background: Colour, Gradient (two colours and a direction preset) or Photo.
- **Photo backgrounds:**
  - Unsplash search, with photographer credit, or upload your own.
  - Fill screen or Show whole photo, with a backdrop colour for the space around it.
  - Zoom (100–200%).
  - A focus point: a 3×3 grid of presets plus a draggable dot.
  - A gradient darkening overlay.

### Design schema

One Zod `Design` schema is the single source of truth. A template is a named `Design`; Blank is the smallest valid one.

- **`background`:** a colour, a gradient, or an image with `fit`, `zoom`, `focus`, `backdrop`, `overlay` and an optional Unsplash credit.
- **`blocks`:** image and text only, reorderable, at most 2 images.
- **`form`:**
  - `fields`: 0–2 of name/email/phone, unique.
  - `terms`: `off` or `checkbox`, label, link text, body, colour, version.
  - `button`: label, background, text colour, solid or outline.
- **Ordering is enforced by the shape,** not by validation rules.
- **Input attributes are system-owned.** Each field's `type`, `autocomplete` and `inputmode` live in `FIELD_SPEC`, never in the customer's design.
- **`version`** is used to migrate stored designs when the schema changes.

### Guest screens

Every screen is generated from the same design, with no extra customer input:

- **Landing.**
- **Terms sheet:** in-page, because external links won't load before auth.
- **Errors:** inline, in an error colour checked against the background.
- **Connected:** may only flash before the iOS sheet closes, so it carries nothing essential.

Connecting and the router failure states (401, 402, 500) are generated at runtime and left out of the MVP.

### Terms editing

Selecting the pinned Terms row switches the preview to the Terms sheet, so the customer edits the terms beside what guests will read. The [canvas artboard](https://claude.ai/artifact/AWrSjgB8dZV2KWn8kkDeYj) "Editor: terms selected" shows it.

- **On/off switch** in the inspector header and the block list. Switching off hides the row but keeps the wording.
- **Checkbox wording:** two short fields, "Before the link" ("I agree to the", max 60) and "Link text" ("terms of use", max 30), with a live sample of how guests see the row. The box always starts unticked.
- **Terms text:**
  - A plain textarea with a count out of 8,000.
  - A blank line starts a new paragraph; there's no rich text, so pasted Word or Google Docs content can't smuggle in markup.
  - The help text explains it opens inside the login page because external links won't load before auth.
- **Checkbox text colour,** contrast-checked against the background like any other text.
- **Version notice:** editing the text after publishing bumps `terms.version`, so each acceptance can record which terms the guest saw.
- **Marketing opt-in reminder:** collecting emails for marketing needs its own checkbox and can't share this one.
- **Placeholder text:** the MVP ships bracketed prompts ("\[Paste your terms of use here.\]"), never invented legal wording.

### Fit check

Text blocks are unlimited, so the editor warns when the page gets too tall to reach Connect without scrolling on a small phone. This is a warning, not a block: scrolling still works.

- **Reference height:** an iPhone SE login sheet, about 600px usable. This is the smallest common guest device, not the current preview frame.
- **How it's measured:** render the splash at 375 × 600, measure the natural content height (logo, text, images, fields, terms, Connect) without the flexible spacer, and warn when Connect's bottom edge passes 600px. Re-measure with a ResizeObserver on every change.
- **What the customer sees:**
  - A dashed "Small-phone fold" line across the mobile preview.
  - An amber "Too tall for small phones" note under it, suggesting shorter text, fewer blocks or smaller images.
- **Desktop and taller phones** have more room, so a design that fits the SE fits everywhere.
- **The Sponsor template already trips it** (about 690px needed). Tighten its default spacing so templates start inside the fold.

### Layout: flexbox within the viewport

The splash page is laid out with flexbox only, so spacing adapts to whatever viewport the guest has, and the editor preview, the export and the fit check all share one layout model.

- **Column:** `display: flex; flex-direction: column; align-items: center`, capped at about 420px and centred.
- **Height:** `min-height: 100dvh`, with a `100vh` fallback first. `dvh` tracks iOS's collapsing browser bars, and older WebKit ignores it and uses the fallback.
- **Spacing between blocks:** `gap`, from a small spacing scale, never per-element margins.
- **Bottom-anchored form:** a single `flex: 1` spacer between the content blocks and the form pushes fields, terms and Connect to the bottom on tall screens. On short screens it collapses to zero, so content stacks and the page scrolls naturally.
- **No absolute positioning or fixed heights for content.** Only the background image and its overlay are absolutely positioned behind the column.
- **The fit check measures this same layout with the spacer at zero,** so the warning matches what guests actually see.

### Quick wins

Two small features with a high payoff, each about 10–20 minutes because they reuse code the MVP already needs.

- **Palette from the logo.**
  - When a logo or image is uploaded, sample 3–4 dominant colours in the browser, from the already-downscaled canvas, using [fast-average-color](https://github.com/fast-average-color/fast-average-color) or a small sampling routine.
  - Show them as a "From your logo" swatch row in every colour picker, under "In this design".
  - Store them in editor state, not in `Design`; they're suggestions, not part of the published page.
- **Real undo/redo.**
  - Add [zundo](https://github.com/charkour/zundo) temporal middleware to the Zustand store, tracking only `design`, not UI state like the selected block or preview mode.
  - Wire up the existing toolbar buttons plus Cmd/Ctrl+Z, Shift+Cmd+Z and Ctrl+Y.
  - Group history so a colour drag or size slide is one undo step, not dozens (the spec uses a leading-edge debounce).
  - History is in memory only and isn't persisted with the design.

**Cut order, applied only on request:** see the spec's **Build plan**. Export HTML is required there, not a stretch goal.

### Behaviour decisions

- **The Terms checkbox is optional, separate from marketing opt-in, and never pre-ticked.** It's validated when Connect is tapped rather than disabling the button.
- **The design is saved to localStorage so a refresh doesn't lose it.**
  - Use Zustand `persist`, debounced about 300ms.
  - Validate with `Design.safeParse` on load.
  - Load after mount to avoid a hydration mismatch.
  - Images are downscaled before storing, with a quota error caught.
  - Undo history isn't persisted.
- **Unsplash photos are hotlinked in the editor,** as the API guidelines require: `download_location` is pinged when one is picked, the key stays server-side, and search is debounced. Copying to our CDN happens only on publish, pending Unsplash's confirmation (see Open questions).
- **No tablet preview.** The column layout is the same at tablet width; a focus point handles different screen shapes instead.
- **Plain, widely supported HTML and CSS.** Captive portal browsers are modern WebKit or Chromium, but older iPhones pin older WebKit, so features like `:has()` and container queries are avoided in the output. The MVP targets iOS 15.4 and newer (see the spec's **Splash renderer**).

### Build plan

The timed build plan, with one commit per milestone, is in the spec's **Build plan**. Commit at each step; the history is part of the test.

### Deployment

The MVP ships on Cloudflare Workers with [vinext](https://vinext.dev/), Cloudflare's Vite plugin that runs the Next.js API on Workers. The code stays standard Next.js. Vercel was the first choice, but an account couldn't be opened.

- **Deploy every push.** A GitHub Actions workflow tests, builds and deploys each push to `main` from the public GitHub repo, so reviewers can follow progress on the live URL alongside the commit history.
- **Unsplash proxy.** A route handler, with the access key stored as a Worker secret, never in client code.
- **Images.** Use plain `<img>` or `next/image` with `unoptimized`, since uploads are downscaled in the browser and Unsplash URLs carry their own resize parameters.
- **Production is a separate concern.** The README notes that the guest-facing portal service targets Cloudflare Workers + Hono (see System context). The editor now runs on the same platform, but its host doesn't constrain the portal service.

## Goals and non-goals

Targets below are proposed hypotheses, to be confirmed against a pilot baseline.

**Goals**

1. **Self-serve.** A standard design goes from first edit to live in under 30 minutes, with no PopUp staff involvement and no device reconfiguration.
2. **Valid by construction.** Every published portal passes automated validation: payload budget, contrast, required compliance blocks, and every state renders.
3. **Guests get online.** At least 85% of guests who see the portal reach the connected state.
4. **Honest sponsor metrics.** Portal views, completions, opt-ins and CTA clicks are measured events, visible live during the event.
5. **Late changes are safe.** Edits up to and during the event go live without a device change, and a bad publish rolls back in one action.

**Non-goals (v1)**

- **Freeform HTML, CSS or JS editing.** It breaks the iOS Captive Network Assistant, opens XSS into a multi-tenant service, and lets customers ship non-compliant consent.
- **Social login (Google, Facebook).** Providers block OAuth inside embedded WebViews, which is where captive portals run.
- **Pushing pages to devices.** Peplink's external splash model hosts pages on our side, and device config is set once.
- **First-browser-request redirect to a sponsor URL.** It can't be delivered over HTTPS or in the CNA. A success-screen call to action replaces it.
- **Network monitoring.** That stays in PopUp's [Slipstream](https://popupwifi.com.au/slipstream/).
- **Non-Peplink hardware and Passpoint/Hotspot 2.0.** The architecture shouldn't preclude them later (see P2).

## Users and stories

**Event producer** (buys the rental, sells the sponsorship)

- As a producer, I want to brand the guest login with my sponsor's assets myself, so that late sponsor deals can still be activated.
- As a producer, I want to see every screen a guest might hit before I publish, so that nothing off-brand or broken appears on the day.
- As a producer, I want to edit and republish during the event, so that a typo or a changed offer doesn't need a support call.
- As a producer, I want to roll back to the last good version in one action, so that a bad publish doesn't stop guests getting online.

**Sponsor marketer**

- As a sponsor, I want the login to match my brand within limits I can understand, so that the activation feels continuous with the physical space.
- As a sponsor, I want live counts of views, sign-ups, opt-ins and CTA clicks, so that I can compare this spend with other channels.
- As a sponsor, I want opted-in contacts exported with the consent record attached, so that I can lawfully email them.

**PopUp WiFi solutions and ops**

- As ops, I want a design bound to a booking and its units automatically, so that I don't hand-configure each event.
- As ops, I want publish blocked when validation fails, so that support isn't paged on event day.

**Guest** (on a phone, in a crowd)

- As a guest, I want to get online in one or two taps, so that I can get back to the event.
- As a guest, I want a code to autofill and a clear next step when something fails, so that I'm not stuck in the login sheet.
- As a guest, I want to know who receives my details and to opt out of marketing, so that I trust the network.
- As a guest whose session expired, I want to reconnect with one tap, so that I don't redo the whole flow.

## System context

The router intercepts and authorises guests; we host every page. The splash URL is configured once per PopUp captive portal profile and never changes per event. Peplink's InControl 2 API doesn't appear to expose captive portal or splash settings ([feature request](https://forum.peplink.com/t/incontrol-2-api-ability-to-retrieve-and-manage-captive-portal-and-splash-settings/24597)), so per-event device changes are designed out.

**Hardware.** PopUp units bond 5G/4G across Telstra, Optus and Vodafone and are cloud-managed. The [Workhorse](https://popupwifi.com.au/products-pricing/the-workhorse/), for example, has 2 × 5G + 2 × 4G, up to 100 concurrent users, and 20–250 Mbps down at 30–100 ms. Guest Wi-Fi runs on a separate lower-priority network from the passworded production network.

**Guest flow.**

1. The guest joins the guest SSID. The OS probe is intercepted, and the CNA or Android login sheet opens.
2. The router redirects to our fixed splash URL, appending session attributes ([Peplink external splash flow](https://forum.peplink.com/t/configuring-an-external-splash-page-for-captive-portal/7696)).
3. Our portal service resolves the device and SSID to the active booking, then serves that booking's published design.
4. The guest completes the flow. The browser authorises them with a top-level form POST to the `form_action` URL the router supplied (on Peplink, `captive-portal.peplink.com`).
5. The router releases the client and the OS probe succeeds. The success screen shows briefly, and the sheet closes.

&#91;embedded content: guest flow · router, portal service, one-time config\]

Publishing a design only touches our portal service. InControl 2 holds the one-time config and isn't touched per event.

### Router parameters

The router passes `sn` (device serial) on every redirect, so routing keys on `sn` to the booking. It also passes `browser`, so the portal knows when it's rendering inside the iOS CNA. Source: [Peplink external splash article](https://forum.peplink.com/t/configuring-an-external-splash-page-for-captive-portal/7696).

**Router → our page (steps 2–3, query string)**

| Attribute | Meaning | How we use it |
| --- | --- | --- |
| `form_action` | URL for submitting the form | Target of the auth form POST; don't hard-code the router host |
| `ip` | Client IP | Session context only |
| `client_mac` | Client MAC | Session key; randomised per network on phones |
| `orig_url` | URL the client originally requested | Pass through on submit |
| `ssid` | Captive portal profile on the device (despite the name) | Sanity check against the booking |
| `sn` | Device serial number | **Routing key: unit → booking** |
| `host_mac` | Device MAC | Secondary unit identifier |
| `host_ip` | Device IP | Diagnostics |
| `time` | Device's current time | Clock-skew check |
| `browser` | `cna` (Apple CNA), `google` (Android), `generic` (normal browser) | Pick the CNA-tuned rendering; segment analytics |

**Our page → router (steps 4–5, form POST to `form_action`)**

| Attribute | Meaning |
| --- | --- |
| `command` | `login` or `logout` |
| `orig_url` | Where to send the client after successful auth |
| `username` | Optional in Open Access mode |
| `password` | Optional in Open Access mode |

**Router → our page with the result (step 7)**

| Attribute | Meaning | How we use it |
| --- | --- | --- |
| `type` | Echo of `command` | — |
| `status` | `success` or `fail` | Success vs error state |
| `auth_code` | 200 success, 401 invalid username/password, 402 access quota reached, 500 internal error | Drives the error state shown |
| `host_mac` | Device MAC | Tie the result to the unit |
| `time_left` | Remaining time quota for the client | Session status display |

Two cautions from the docs:

- **Step 7 is drawn as plain HTTP**, while step 3 is HTTPS. Confirm on hardware which scheme the router actually uses.
- **Parameters arrive unsigned in the query string.** Anyone can hit our URL with a made-up `sn` or `status=success`. Treat them as hints: rate-limit by `sn`, and check that the request comes from the booking unit's public IP where PopUp's static IP allows.

**From Peplink's PHP demo (portal\_demo.php, v1.0.0, 2015)**

- **Extra parameters not in the article:**
  - `name` (device name) on the redirect.
  - `auth_msg` and `message` on the result.
  - `browser` is missing from the demo; it was added later.
- **form\_action fallbacks.** The demo ignores the passed `form_action` on Balance/MAX because older firmware sent a wrong value. It hard-codes the target per model:
  - Balance/MAX: `https://captive-portal.peplink.com:8000/portal.cgi`.
  - APs: `https://device.pepwave.com:8000/cgi-bin/portal.cgi`.
- **Success page.** A plain GET form to `orig_url` ("Click to continue"). Logout is a `window.open` popup posting `command=logout`, which won't work in the CNA.
- **Security requirement:**
  - Allowlist the `form_action` host to those two Peplink hostnames.
  - HTML-escape every parameter we render.
  - The demo echoes `form_action`, `orig_url`, `message` and `auth_msg` unescaped, including inside a script block. That's reflected XSS.
  - A crafted link with `form_action` pointing elsewhere would make our branded page post guest credentials to an attacker.

**What deploys where.**

| Change | Where it goes | How | Frequency |
| --- | --- | --- | --- |
| Publish or roll back a design | Our portal service | Designer publish | Any time, instant |
| Bind a design to a booking and units | Our booking map | Designer or ops action | Per event |
| Splash URL, access mode, RADIUS (optional) | PopUp's InControl 2 captive portal profile | Manual, once | Once per profile |
| Walled garden: our domain, payment provider domains | InControl 2 Allowed Networks | Manual | When a provider changes |
| TLS certificate for the portal hostname on each router | Each unit | Via InControl 2 | On renewal |
| Guest SSID name and password | InControl 2 | PopUp's existing per-booking setup | Per event |

### Access modes and RADIUS

Click-through runs on Open Access. Anything that collects data, issues vouchers or charges money runs on User Authentication with our own RADIUS server, so only guests with a recorded submission get online.

**Peplink modes.**

- **The external splash supports two:**
  - **Open Access:** any POST of `command=login` to `form_action` gets the guest online.
  - **User Authentication:** the router checks the posted username/password against a RADIUS server.
- **InControl 2's hosted portal adds six guest types:** Open Access, Social, Guest Account, Token, Email and SMS ([article](https://forum.peplink.com/t/configure-captive-portal-in-incontrol2/7664)). These only work on Peplink's own page, so choosing an external splash means rebuilding whatever we need beyond click-through.
- **Peplink's default portal keeps no documented consent record.**
  - It stores emails and names (or a social user ID) in InControl 2, exportable as CSV, plus MAC/IP sign-in events.
  - Guests accept Peplink's own Wi-Fi privacy policy, which isn't logged per guest and doesn't name the event or sponsors.
  - There's no documented way for an external page to write into those records, and the IC2 API appears read-only for captive portal ([thread](https://forum.peplink.com/t/icontrol2-api-reporting-and-controlling/58901)).
  - So our store is the system of record.

**RADIUS flow.**

1. The guest submits on our portal; we store the details and consent, then mint a one-time opaque token as username and password.
2. The page posts that token to `form_action`.
3. The router sends an Access-Request to our RADIUS server, which checks the token and replies Accept, with limits, or Reject (`auth_code=401`).
4. The router sends accounting Start, Interim and Stop messages carrying session time, bytes and client MAC against our token.

**Router attribute support.** From a [2016 Peplink thread](https://forum.peplink.com/t/peplink-support-freeradius-attributes/6504) and [IronWiFi's guide](https://help.ironwifi.com/configuration-guides/other/peplink); test on current firmware.

- **Time limits:** `Session-Timeout`, `Idle-Timeout` and `WISPr-Session-Terminate-Time`.
- **Data quotas:** `ChilliSpot-Max-*-Octets`, 32-bit, so about 4 GB each.
- **Speed limits:** `WISPr-Bandwidth-Max-Up/Down`, listed for APs only.
- **Concurrent devices:** `Simultaneous-Use`, with accounting.
- **No remote disconnect via IronWiFi:** it sends no CoA/Disconnect to Peplink, so sessions end by timeout.

**The RADIUS server is ours, not on the router.**

- The Peplink is only the RADIUS client.
- RADIUS uses UDP 1812/1813, which a Worker can't listen on. Run [FreeRADIUS](https://freeradius.org) on a small AU-region VM with its REST module calling our API, or use a hosted service.
- Run a primary and a secondary, because if RADIUS is down nobody gets online.
- Classic RADIUS hides only the password; we found no evidence Peplink supports RadSec. So usernames stay opaque tokens with no personal data, with a long fleet secret, firewalled to PopUp's static IPs where available.

### Where the portal service runs

[Cloudflare Workers](https://developers.cloudflare.com/workers/) with [Hono](https://hono.dev) fits: server-rendered HTML at the edge, close to guests on 30–100ms cellular links.

- **Designs and the `sn` → booking map** go in [KV](https://developers.cloudflare.com/kv/), as immutable design blobs. KV is eventually consistent (about 60s), so the current-version pointer for publish and rollback goes in [D1](https://developers.cloudflare.com/d1/) or a Durable Object.
- **Consent records and submissions** go in D1.
- **Funnel analytics** go in Analytics Engine.
- **Per-`sn` rate limiting** uses the rate-limit binding.
- **The unit's public IP** comes from `CF-Connecting-IP`, for spoof checks.
- **Capture flows take two hops:** the guest posts to the Worker, which stores consent, then a form posts `command=login` + `orig_url` to `form_action`. Never 307 the guest's personal data on to the router.

## Requirements

Customers design the skin; we own the flow. Everything below follows from that split.

### P0 — cannot ship without

1. **Theme tokens and block library.** Customers set the logo, colours, background image, type (one custom font plus a system fallback) and copy, and choose and order blocks from a fixed library inside 2–3 templates.
   - [ ] No path to inject raw HTML, CSS or JS.
   - [ ] Copy fields enforce per-block length limits.
2. **Locked flow blocks.** Form fields, their `type`/`autocomplete`/`inputmode` attributes, T&Cs acceptance, the privacy collection notice, the marketing opt-in, and the error and success logic are system-owned. Customers restyle them but can't remove, reorder out of sequence, or pre-tick them.
   - [ ] Publish fails if a required block is missing.
   - [ ] The opt-in renders unticked on every load.
3. **Generated states.** Every state is rendered from the customer's tokens:
   - Landing.
   - Each auth variant: click-through, email, SMS OTP, voucher.
   - OTP entry, with resend and change-number options.
   - Payment.
   - Errors: invalid code, wrong OTP, device limit, payment failed.
   - Session expired, with one-tap re-auth.
   - Terms and privacy, inline.
   - Success.
   - [ ] The designer can preview each state.
   - [ ] Publish fails if any state fails to render.
4. **Compiler output.** The output is a server-rendered, self-contained page: inline CSS, subset fonts, optimised images, and no external requests before auth.
   - [ ] The core flow works with JS disabled.
   - [ ] Total page weight is at most 100 KB (proposed).
   - [ ] Inputs are 16px or larger.
   - [ ] SVG uploads are rasterised or sanitised.
5. **Validation gate.** Publish is blocked on any of:
   - Payload over budget.
   - Text contrast below WCAG AA 4.5:1.
   - Missing logo alt text.
   - A missing required block.
   - A state that fails to render.
   - [ ] Each failure names the block to fix, with an auto-fix where possible (e.g. adjust contrast, recompress an image).
6. **Preview fidelity.** Previews use device frames emulating the iOS CNA sheet and the Android login app at 320–430px, with light, dark and landscape modes.
   - [ ] A banner states that a real test needs the sandbox SSID (P1).
7. **Publish, version and roll back.** Every publish is immutable and versioned.
   - [ ] Rollback to any prior version takes one action and is live within 60 seconds.
   - [ ] A publish during an event never serves a half-updated page.
8. **Booking binding and routing.** A design is bound to a booking. The portal service maps the router's sn parameter (device serial) to the active booking and serves its design. When browser=cna, it serves the CNA-tuned rendering.
   - [ ] Unknown or unbound devices get a neutral PopUp default portal that still authorises guests.
   - [ ] Multi-unit bookings serve the same design on every unit.
9. **Peplink authorisation.** The guest authorises via a top-level HTML form POST to the router's form\_action URL (command=login, orig\_url), not via fetch/XHR. The step-7 auth\_code (401, 402, 500) selects the error state shown, which avoids the cross-origin failures third-party portals report.
   - [ ] Verified on a Workhorse with iOS, Android and Windows clients.
   - [ ] The OS marks the network online after auth.
10. **Data capture and consent.**
    - Capture fields come from a fixed set: email, phone, name, and up to 3 survey questions.
    - The collection notice names every party data is disclosed to, including each sponsor.
    - Marketing opt-in is collected per sponsor.
    - Every submission stores a record of the consent text version, the T&Cs version and a timestamp.
    - [ ] Export includes the consent record.
    - [ ] Submissions without opt-in are never exported for marketing.
11. **Measured analytics.** Portal views, auth completions, failures by type, opt-ins and success-screen CTA clicks are recorded server-side per booking.
    - [ ] Live counts are visible to the producer during the event.
    - [ ] No metric claims a sponsor-site visit unless a CTA click was recorded.
12. **Success-screen CTA.** The success screen carries the sponsor message and one CTA link to the sponsor URL.
    - [ ] Essential information (a voucher, receipt or code) is never shown only on this screen; it's also sent by SMS or email.

### P1 — fast follow

- **Paid access.** Plan tiers by time or data, with payment through an inline card form. Requires User Authentication with our RADIUS server (time/data quotas, auth\_code 402) and the payment provider's domains in the walled garden.
  - [ ] Graceful fallback to a voucher when 3DS fails inside the CNA.
- **Sandbox SSID test mode.** A test SSID on a PopUp demo unit, plus a QR handoff, so producers can test on a real phone in the real CNA before the event.
- **Live export.** A CSV/API export of consented contacts, replacing the 12-hour spreadsheet.
- **Brand-impersonation checks.** Flag uploaded logos and copy resembling banks, telcos or government, and route them to manual review.
- **i18n.** Multiple languages with text-expansion headroom, and RTL support.
- **Session status.** Time and data remaining, with an extend option where the plan allows.

### P2 — design for, don't build

- **RFC 8908 Captive Portal API support** if Peplink firmware exposes it, so modern iOS and Android open the portal without probe hijacking.
- **Hardware abstraction.** Keep the Peplink redirect and authorisation adapter behind an interface so other vendors (Meraki, UniFi) can be added.
- **Multi-sponsor rotation** within one event.
- **Passpoint/Hotspot 2.0** for returning guests at long-lease venues.

## Constraints

The portal runs inside a stripped-down system WebView on a phone, over metered bonded cellular, behind a router we configure only once. Every requirement above traces to one of these.

### Client platforms

- **iOS Captive Network Assistant.** A modal sheet with no URL bar, ephemeral storage and no persistent cookies.
  - It closes or shows Done as soon as the OS probe passes.
  - `window.open`, `target=_blank`, downloads, and often `tel:`/`mailto:` links fail.
  - App switching risks losing the session.
- **Android.** The CaptivePortalLogin WebView opens only after the guest taps a "Sign in to Wi-Fi network" notification. Behaviour varies by OEM, especially Samsung.
- **Silent fallback to mobile data.** Wi-Fi Assist (iOS) and adaptive connectivity (Android) can route guests over mobile data when Wi-Fi has no internet, so some guests never see the portal.
- **Viewport and input.** Phone widths are 320–430px. Tap targets must be at least 44pt (iOS) or 48dp (Android). Inputs under 16px trigger zoom on iOS.
- **MAC randomisation.** iOS Private Wi-Fi Address and Android per-SSID random MACs, especially rotating modes, break MAC-keyed sessions and force re-auth.
- **Social login** is blocked in embedded WebViews ([Google policy](https://developers.googleblog.com/2021/06/upcoming-security-changes-to-googles-oauth-2.0-authorization-endpoint.html)).
- **Payments.** 3DS redirects and Apple Pay/Google Pay are unreliable in these WebViews.

### OS detection probes

- **Pre-auth:** port-80 HTTP must be intercepted and redirected. The probe hosts must NOT be in the walled garden, or the OS assumes it's online and never shows the portal:
  - Apple: `captive.apple.com/hotspot-detect.html`, expects "Success".
  - Android/ChromeOS: `connectivitycheck.gstatic.com/generate_204`, expects 204.
  - Windows: `www.msftconnecttest.com/connecttest.txt`.
  - Firefox: `detectportal.firefox.com`.
- **Post-auth:** probes must pass unmodified, so the OS marks the network online.
- **HTTPS is never intercepted.** Doing so causes certificate errors and HSTS failures.
- **DNS hijacking is fragile.** DoH/DoT, iCloud Private Relay and Android Private DNS bypass it.
- **Standards path.** [RFC 8910](https://www.rfc-editor.org/rfc/rfc8910) and [RFC 8908](https://www.rfc-editor.org/rfc/rfc8908) let the network announce the portal directly. Recent iOS and Android honour them; Peplink support is unconfirmed.

### Output and build

- **No external requests before auth.** No Google Fonts, CDNs or analytics scripts unless walled-gardened; inline everything.
- **Payload budget about 100 KB (proposed).** Pre-auth loads cross the metered cellular link (below).
- **Server-rendered.** No SPA routing, and state is kept server-side keyed to the portal session, never in localStorage or cookies.
- **Theming.** Dark mode (`prefers-color-scheme`), safe-area insets and landscape must all work.

### Network and backhaul

- **Metered data.** Pre-auth page loads come out of the event's data allowance: 40 GB included per unit, then $5/GB prepaid or $7/GB in overages (Workhorse). A 2 MB hero image × 3,000 guests is about 6 GB.
- **Latency.** 30–100 ms per round trip on bonded cellular argues for a single-request page.
- **Capacity.** A Workhorse handles 100 concurrent users, so large sites run several units. The design must be identical across units.
- **Session roaming.** Whether auth on one unit carries to another depends on PopUp's controller setup (open question).
- **Outages.** A total cellular outage takes guests offline regardless of where the portal is hosted. Portal location isn't a resilience lever.

### Peplink platform

- **External splash only.** Pages are hosted by us at a fixed URL configured in the InControl 2 captive portal profile. Configuring this on the device directly gets overwritten by InControl ([forum](https://forum.peplink.com/t/external-splash-page/11433)).
- **No config API.** The InControl 2 API doesn't appear to cover captive portal or splash settings, so routing per event lives on our side.
- **Authorisation** is a browser POST to `captive-portal.peplink.com:8000/portal.cgi`, which only resolves on the guest network. A cross-origin fetch fails, so use a form POST ([forum](https://forum.peplink.com/t/external-splash-page-issue/44110)).
- **TLS.** A valid TLS certificate must be installed on each router for the portal hostname ([IronWiFi](https://www.ironwifi.com/help/peplink)), which means issuance and renewal across the rental fleet.
- **Popup Handling.** Both checkboxes must be unchecked, or the CNA won't appear ([IronWiFi](https://help.ironwifi.com/portal/en/kb/articles/peplink)).
- **Walled garden.** It must include our portal domain and payment provider domains.
- **Where the portal applies.** On Balance/MAX routers the captive portal binds to a VLAN, not an SSID ([forum](https://forum.peplink.com/t/applyng-ssid-on-captive-portal-in-incontrol-2-3-0/6712)).

### Compliance (Australia)

- **Collection notice.** Required under [APP 5](https://www.oaic.gov.au/privacy/australian-privacy-principles) whenever email or phone is collected, and it must name sponsors who receive the data.
- **Marketing consent.** Opt-in must be express and unticked by default under the [Spam Act 2003](https://www.acma.gov.au/avoid-sending-spam), never bundled into T&Cs acceptance, and recorded per sponsor.
- **Pre-auth access to terms.** T&Cs and the privacy policy must be reachable before auth: served inline, never as links to blocked sites.
- **Audit trail.** Record which T&Cs and consent version each guest accepted.

### Security and abuse

- **A phishing kit by nature.** A brandable login page on open Wi-Fi is structurally an evil-twin phishing kit. Credential-shaped fields are limited to the system-defined auth types, and brand impersonation is screened (P1).
- **Multi-tenant isolation.** No customer-supplied code. Uploaded assets are re-encoded, and SVGs are rasterised or sanitised.
- **Cleartext pre-auth phase.** Never put personal data in URL parameters. Submit over HTTPS to our service only.

## Success metrics

All targets are proposed and will be set against a pilot baseline. Everything is measured server-side by the portal service per booking.

| Metric | Type | Target | Measured as |
| --- | --- | --- | --- |
| Time from first edit to live | Leading | Under 30 min | Designer session start to first successful publish |
| Self-serve rate | Leading | 80% of CAPTIVATE bookings with no staff build | Bookings published by a customer account |
| Publish validation pass rate | Leading | 95% pass after auto-fix | Publish attempts passing all checks |
| Guest completion rate | Leading | 85% or more | Connected ÷ portal views, deduplicated by session |
| Auth failure rate | Leading | Under 5% | Error-state renders ÷ submissions, split by type |
| Pre-auth payload | Leading | 100 KB or less median | Bytes served per portal view |
| Event-day support contacts about the portal | Lagging | Down 50% versus pre-designer baseline | PopUp support tickets tagged CAPTIVATE |
| CAPTIVATE attach rate | Lagging | Up versus baseline | CAPTIVATE add-ons ÷ rentals |
| Sponsor CTA click-through | Lagging | Reported, no target until baseline | CTA clicks ÷ connected |

## Open questions

| Question | Owner | Blocking? |
| --- | --- | --- |
| Answered: the redirect carries sn (device serial) and host\_mac, so we route on sn (see Router parameters). Still to confirm in the spike: sn is present on a Workhorse's current firmware, and whether step 7 arrives over HTTP or HTTPS. | Engineering + PopUp | Yes |
| Does PopUp manage units in one InControl 2 group or per booking? Can a single captive portal profile cover the whole fleet? | PopUp | Yes |
| How will the TLS cert for the portal hostname be issued and renewed on every unit? | PopUp + Engineering | Yes |
| Are guest sessions shared across units at multi-unit events, or does each router auth locally? | PopUp | No |
| Does current Peplink firmware advertise RFC 8910 / support RFC 8908? | Engineering | No |
| Which payment provider, and which domains go in the walled garden? | PopUp + Engineering | No (P1) |
| Who is the data controller for captured contacts: producer, sponsor or PopUp? This drives the notice wording. | Legal | Yes |
| What is the current per-unit concurrency and the guest volume per event, to size the portal service? | PopUp | No |
| Does Peplink's Allowed Networks match a domain on every request, or resolve it to IPs when configured? Cloudflare's anycast IPs aren't ours and can change. | Engineering | Yes |
| As far as we know, D1 and Durable Objects offer no Australian jurisdiction. Keep guest emails and phones in Cloudflare and meet APP 8 cross-border duties, or use an AU-region store? | Legal + Engineering | Yes |
| Who runs RADIUS (our FreeRADIUS in AU or a hosted service), and does current Peplink firmware support RadSec or CoA/Disconnect? | Engineering + PopUp | No (blocks data capture and paid access) |
| Will Unsplash allow a resized self-hosted copy on publish? Its API guidelines require hotlinking. Ask api@unsplash.com; the fallback is whitelisting its CDN. | Product | No |
| Does current firmware send the browser parameter, and which form\_action value? Peplink's 2015 demo hard-codes the target per model. | Engineering | No (spike) |

## Phasing

0. **Captivator MVP (test project).** The 4-hour Next.js editor in Phase 0: templates, block editor, live mobile/desktop preview with guest-screen switcher, localStorage persistence. *Gate: public repo with steady commits, plus a live deploy, submitted for review.*
1. **Spike: prove the Peplink loop.** One Workhorse, a fixed external splash URL, form-POST authorisation, and the redirect parameters captured. Test on iOS, Android and Windows. *Gate: guests get online and the OS marks the network online on all three; `sn` identifies the unit.*
2. **Portal service plus a hard-coded design.** A Worker + Hono service with booking routing, all generated states, consent records and server-side analytics. *Gate: a pilot event run on a design PopUp staff configure in a file.*
3. **Designer v1.** The MVP editor wired to publish and roll back, the validation gate and live counts. *Gate: three customer-built events with no staff build and no event-day portal incidents.*
4. **Data capture and paid access.** RADIUS (two instances), per-sponsor opt-in, live export, payment, impersonation checks, i18n. *Gate: no guest gets online without a recorded submission when capture is on.*

## Sources

- [PopUp WiFi CAPTIVATE](https://popupwifi.com.au/captivate/) · [Workhorse specs](https://popupwifi.com.au/products-pricing/the-workhorse/) · [Captivator editor canvas](https://claude.ai/artifact/AWrSjgB8dZV2KWn8kkDeYj)
- [Peplink: Configuring an External Splash Page](https://forum.peplink.com/t/configuring-an-external-splash-page-for-captive-portal/7696) and its [PHP demo](http://download.peplink.com/resources/portal_demo.zip) · [External splash and InControl](https://forum.peplink.com/t/external-splash-page/11433) · [CORS on portal.cgi](https://forum.peplink.com/t/external-splash-page-issue/44110) · [IC2 API feature request](https://forum.peplink.com/t/incontrol-2-api-ability-to-retrieve-and-manage-captive-portal-and-splash-settings/24597) · [IC2 API is read-only in practice](https://forum.peplink.com/t/icontrol2-api-reporting-and-controlling/58901) · [Captive portal on Balance/MAX VLANs](https://forum.peplink.com/t/applyng-ssid-on-captive-portal-in-incontrol-2-3-0/6712)
- [Configure Captive Portal in InControl2](https://forum.peplink.com/t/configure-captive-portal-in-incontrol2/7664) · [IC2 collected e-mails export](https://forum.peplink.com/t/incontrol2-captive-portal-view-collected-e-mails/24456) · [Social Wi-Fi and privacy policy changes](https://forum.peplink.com/t/important-changes-to-social-wi-fi-and-privacy-policy/15880) · [Peplink RADIUS attributes](https://forum.peplink.com/t/peplink-support-freeradius-attributes/6504)
- [IronWiFi Peplink setup](https://www.ironwifi.com/help/peplink) · [IronWiFi Peplink config guide](https://help.ironwifi.com/configuration-guides/other/peplink) · [Purple Peplink setup](https://support.purple.ai/hc/en-gb/articles/7580769540765)
- [RFC 8910](https://www.rfc-editor.org/rfc/rfc8910) · [RFC 8908](https://www.rfc-editor.org/rfc/rfc8908) · [RFC 8952](https://www.rfc-editor.org/rfc/rfc8952) · [RFC 2865](https://www.rfc-editor.org/rfc/rfc2865) · [RFC 2866](https://www.rfc-editor.org/rfc/rfc2866) · [RFC 5176](https://www.rfc-editor.org/rfc/rfc5176) · [RFC 6614](https://www.rfc-editor.org/rfc/rfc6614)
- [Unsplash API guidelines](https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines) · [Google: OAuth in embedded WebViews](https://developers.googleblog.com/2021/06/upcoming-security-changes-to-googles-oauth-2.0-authorization-endpoint.html) · [Hono](https://hono.dev) · [Cloudflare Workers](https://developers.cloudflare.com/workers/) · [Zustand](https://zustand.docs.pmnd.rs) · [Zod](https://zod.dev)
- [Australian Privacy Principles](https://www.oaic.gov.au/privacy/australian-privacy-principles) · [ACMA Spam Act guidance](https://www.acma.gov.au/avoid-sending-spam)
