# Captive Portal Designer — PRD

Oct 21, 2026 · @Toby

## Summary and problem

Build a self-serve designer that lets event producers and sponsors brand the guest Wi-Fi login on rented event Wi-Fi units and publish it in minutes, replacing today's template-plus-seven-day manual process. Designs are hosted on our own HTTPS service and reach guests through the router's external captive portal (splash page) setting. Publishing a design never touches the device.

In this document, **the provider** is the business that rents out the Wi-Fi units and runs the guest network, and **the gateway** is whatever router or controller runs the captive portal on a unit. Nothing here assumes a particular hardware vendor; what we need from a gateway is listed under **System context**.

**The problem today.** The provider's branded-portal add-on needs sponsor assets at least 7 days before the event. Provider staff then build the page from templates, and data-capture spreadsheets arrive within 12 hours of the event ending.

**What that costs.**

- **Late sponsor deals** can't be activated.
- **Every change** costs staff time.
- **Sponsor data** arrives after the event, when it's too late to act on.
- **The headline sponsor metric is inflated.** "One connection = one website visit" assumes guests are redirected to the sponsor URL on their first browser request. The iOS Captive Network Assistant and HTTPS make that unreliable.

**Who has the problem.**

- **Event producers** who sell guest Wi-Fi as sponsorship inventory.
- **Sponsors** who need the activation to look on-brand and prove a return.
- **The provider's solutions team**, who currently do the build by hand.

## Phase 0: Captivator MVP

The first deliverable is a test project: a Next.js visual editor for mocking up a branded splash page, built in up to 4 hours in total, 3 of them coding, pushed to a public GitHub repo throughout. The [MVP tech spec](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md) is the source of truth for its stack, build plan, scope and cut order; where this section and the spec differ, the spec wins. It tests editor UX for non-technical customers and scoping judgement, not the portal runtime. Everything from System context onward describes the product it leads to. Design references are nine branded guest portals from past event activations.

**Brief minimum.** A customer can:

- Upload a logo or image.
- Upload a background image or choose a background colour.
- Add text and adjust its colour and size.
- Add up to two fields from Name, Email and Phone.
- Set the Connect button's background and text colour.

The brief also asks for an instant live preview with mobile and desktop views, and an editor a non-technical customer finds intuitive.

**Out of scope for the MVP.** Gateway integration, guest authentication, consent storage, publish/rollback, multi-tenancy and the real guest flow. These go in the README as the path to production.

### What the references show

All nine reference portals share one layout: a centred column of logo → headline → optional sponsor block → 0–2 fields → Connect.

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

Connecting and the gateway's failure states (such as invalid credentials, quota reached or an internal error) are generated at runtime and left out of the MVP.

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

1. **Self-serve.** A standard design goes from first edit to live in under 30 minutes, with no provider staff involvement and no device reconfiguration.
2. **Valid by construction.** Every published portal passes automated validation: payload budget, contrast, required compliance blocks, and every state renders.
3. **Guests get online.** At least 85% of guests who see the portal reach the connected state.
4. **Honest sponsor metrics.** Portal views, completions, opt-ins and CTA clicks are measured events, visible live during the event.
5. **Late changes are safe.** Edits up to and during the event go live without a device change, and a bad publish rolls back in one action.

**Non-goals (v1)**

- **Freeform HTML, CSS or JS editing.** It breaks the iOS Captive Network Assistant, opens XSS into a multi-tenant service, and lets customers ship non-compliant consent.
- **Social login (Google, Facebook).** Identity providers block OAuth inside embedded WebViews, which is where captive portals run.
- **Pushing pages to devices.** With an external splash page, pages are hosted on our side, and device config is set once.
- **First-browser-request redirect to a sponsor URL.** It can't be delivered over HTTPS or in the CNA. A success-screen call to action replaces it.
- **Network monitoring.** That stays in the provider's existing tools.
- **Supporting every gateway at launch, and Passpoint/Hotspot 2.0.** v1 supports the gateways the spike proves; the architecture shouldn't preclude others later (see P2).

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

**Provider solutions and ops**

- As ops, I want a design bound to a booking and its units automatically, so that I don't hand-configure each event.
- As ops, I want publish blocked when validation fails, so that support isn't paged on event day.

**Guest** (on a phone, in a crowd)

- As a guest, I want to get online in one or two taps, so that I can get back to the event.
- As a guest, I want a code to autofill and a clear next step when something fails, so that I'm not stuck in the login sheet.
- As a guest, I want to know who receives my details and to opt out of marketing, so that I trust the network.
- As a guest whose session expired, I want to reconnect with one tap, so that I don't redo the whole flow.

## System context

The gateway intercepts and authorises guests; we host every page. The splash URL is configured once per captive portal profile and never changes per event. Not every management tool exposes captive portal settings through an API, and a fixed URL works on every gateway, so per-event device changes are designed out.

**What we need from a gateway.** The product assumes as little as possible about the hardware. A gateway is supported when it can:

- **Send guests to an external splash URL** that we host, set once and not overwritten by the device's management tool.
- **Identify the unit on the redirect,** for example with a serial number, a device MAC address or a site ID, so we can route to the right booking.
- **Let a guest online on our say-so,** through a login step the guest's browser completes (typically a form POST to an address the gateway supplies) or through a server-side check against our service.
- **Allow our domain before sign-in** (a walled garden), plus payment provider domains if paid access ships.

**Network.** Units may run on cellular, satellite or fixed uplinks, which may be metered. Guest Wi-Fi is assumed to run on its own network, separate from any production network on the same unit.

**Guest flow.**

1. The guest joins the guest SSID. The OS probe is intercepted, and the CNA or Android login sheet opens.
2. The gateway redirects to our fixed splash URL, appending its session parameters.
3. Our portal service resolves the unit identifier to the active booking, then serves that booking's published design.
4. The guest completes the flow, and the guest is authorised through the gateway's login step (see **Gateway integration**).
5. The gateway releases the client and the OS probe succeeds. The success screen shows briefly, and the sheet closes.

&#91;embedded content: guest flow · gateway, portal service, one-time config\]

Publishing a design only touches our portal service. The gateway's management tool holds the one-time config and isn't touched per event.

### Gateway integration

Each gateway passes and expects different parameters, so each one sits behind an adapter, and each is proven in a short spike before it's supported. The concepts are the same across vendors:

**Gateway → our page (steps 2–3)**

| Concept | Typical form | How we use it |
| --- | --- | --- |
| Unit identifier | Serial number, device MAC or site ID | **Routing key: unit → booking** |
| Login address | A URL passed on the redirect, or fixed per vendor | Target of the login step; never taken unchecked from the request |
| Original URL | The URL the client first requested | Pass through on login |
| Client identifiers | Client MAC and IP | Session context; phone MACs are often randomised per network |
| Browser hint, if sent | Which login sheet or browser is showing the page | Pick the CNA-tuned rendering; segment analytics |
| Device time, if sent | The gateway's clock | Clock-skew check |
| Portal profile or network, if sent | Which captive portal profile, SSID or VLAN the guest joined | Sanity check against the booking |

**Our page → gateway (step 4).** Usually a top-level form POST to the login address with the gateway's own login fields, plus a username and password or token when access is gated (see **Access modes**).

**Gateway → our page with the result (if the gateway reports one).** Success or failure, with a reason such as invalid credentials, quota reached or an internal error. The reason drives the error state shown.

Cautions that apply to every gateway:

- **Parameters usually arrive unsigned in the query string.** Anyone can hit our URL with a made-up unit identifier or a fake success result. Treat them as hints: rate-limit by unit, and check that requests come from the unit's public IP where the provider has static IPs.
- **The login address is attacker-controllable.** A crafted link could point our branded page's form at another host. Allowlist each gateway's known login hosts.
- **Escape everything we render.** Vendor sample portals have been seen echoing these parameters unescaped, which is reflected XSS.
- **Confirm the scheme on hardware.** Some gateways return results over plain HTTP while the splash itself is HTTPS.

**What deploys where.**

| Change | Where it goes | How | Frequency |
| --- | --- | --- | --- |
| Publish or roll back a design | Our portal service | Designer publish | Any time, instant |
| Bind a design to a booking and units | Our booking map | Designer or ops action | Per event |
| Splash URL, access mode, any authentication server | The gateway's captive portal profile | Manual, once | Once per profile |
| Walled garden: our domain, payment provider domains | The gateway's walled-garden setting | Manual | When the payment provider changes |
| TLS certificate for the gateway's login host, if needed | Each unit | Through the gateway's management tool | On renewal |
| Guest SSID name and password | The gateway's management tool | The provider's existing per-booking setup | Per event |

### Access modes

Click-through can use the gateway's open access mode. Anything that collects data, issues vouchers or charges money must be gated, so only guests with a recorded submission get online.

**How gating works depends on the gateway.** The options:

- **An external authentication server.** The gateway checks posted credentials against a server we run, for example over RADIUS.
- **A gateway API.** Our service calls the gateway or its controller to authorise the client.
- **A signed one-time token** that the gateway can verify against our service.

**The gated flow, whatever the mechanism.**

1. The guest submits on our portal; we store the details and consent, then mint a one-time opaque token.
2. Personal data never reaches the gateway. The gateway lets the guest online, with any limits, once our service vouches for them: by answering the gateway's credential check, by calling the gateway's API, or through a token the gateway can verify.
3. A rejection shows as an error state.
4. Where the gateway reports session accounting, we record session time and bytes against the token.

**Session limits** (time, data quotas, speed, concurrent devices) and remote disconnect vary by gateway and firmware, so each is confirmed in that gateway's spike before a plan relies on it.

**A gateway's hosted portal features don't carry over.** Built-in guest types such as social, voucher, email or SMS login only work on the gateway's own page, so choosing an external splash means rebuilding whatever we need beyond click-through.

**Our store is the system of record.** A gateway's built-in portal may keep its own guest list, but it won't hold our consent records or name the event's sponsors, so consent is recorded on our side.

**Any authentication server is ours, not on the gateway.**

- The gateway is only its client.
- A RADIUS server uses UDP, which a Worker can't listen on, so it would run on a small AU-region VM calling our API, or as a hosted service.
- Run a primary and a secondary, because if it's down nobody gets online.
- Keep credentials as opaque tokens with no personal data, with a long shared secret, firewalled to the provider's static IPs where available.

### Where the portal service runs

[Cloudflare Workers](https://developers.cloudflare.com/workers/) with [Hono](https://hono.dev) fits: server-rendered HTML at the edge, close to guests on slow or high-latency uplinks.

- **Designs and the unit → booking map** go in [KV](https://developers.cloudflare.com/kv/), as immutable design blobs. KV is eventually consistent (about 60s), so the current-version pointer for publish and rollback goes in [D1](https://developers.cloudflare.com/d1/) or a Durable Object.
- **Consent records and submissions** go in D1.
- **Funnel analytics** go in Analytics Engine.
- **Per-unit rate limiting** uses the rate-limit binding.
- **The unit's public IP** comes from `CF-Connecting-IP`, for spoof checks.
- **Capture flows take two hops:** the guest posts to the Worker, which stores consent, then completes the gateway's login step with no personal data. Never redirect the guest's personal data on to the gateway.

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
   - [ ] A banner states that a real test needs a real phone on a test network.
7. **Publish, version and roll back.** Every publish is immutable and versioned.
   - [ ] Rollback to any prior version takes one action and is live within 60 seconds.
   - [ ] A publish during an event never serves a half-updated page.
8. **Booking binding and routing.** A design is bound to a booking. The portal service maps the gateway's unit identifier to the active booking and serves its design. When the gateway's browser hint or the user agent suggests the iOS CNA, it serves the CNA-tuned rendering, which also works in any other browser.
   - [ ] Unknown or unbound devices get a neutral default portal that still authorises guests.
   - [ ] Multi-unit bookings serve the same design on every unit.
9. **Gateway authorisation.** The guest is authorised through the gateway's login step, behind a per-gateway adapter. Where that step is a browser request, it's a top-level HTML form POST, not fetch/XHR, which avoids the cross-origin failures third-party portals report. The gateway's result, where it reports one, selects the error state shown.
   - [ ] Verified on each supported gateway with iOS, Android and Windows clients.
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

### P2 — design for, don't build

- **RFC 8908 Captive Portal API support** where the gateway exposes it, so modern iOS and Android open the portal without probe hijacking.
- **More gateways.** Each new vendor is one adapter for its redirect parameters and login step, plus a spike.
- **Multi-sponsor rotation** within one event.
- **Passpoint/Hotspot 2.0** for returning guests at long-lease venues.

## Success metrics

All targets are proposed and will be set against a pilot baseline. Everything is measured server-side by the portal service per booking.

| Metric | Type | Target | Measured as |
| --- | --- | --- | --- |
| Time from first edit to live | Leading | Under 30 min | Designer session start to first successful publish |
| Self-serve rate | Leading | 80% of branded-portal bookings with no staff build | Bookings published by a customer account |
| Publish validation pass rate | Leading | 95% pass after auto-fix | Publish attempts passing all checks |
| Guest completion rate | Leading | 85% or more | Connected ÷ portal views, deduplicated by session |
| Auth failure rate | Leading | Under 5% | Error-state renders ÷ submissions, split by type |
| Pre-auth payload | Leading | 100 KB or less median | Bytes served per portal view |
| Event-day support contacts about the portal | Lagging | Down 50% versus pre-designer baseline | Provider support tickets tagged for the branded portal |
| Branded-portal attach rate | Lagging | Up versus baseline | Branded-portal add-ons ÷ rentals |
| Sponsor CTA click-through | Lagging | Reported, no target until baseline | CTA clicks ÷ connected |

## Open questions

| Question | Owner | Blocking? |
| --- | --- | --- |
| Which gateways are in the fleet, and which support an external splash URL with a unit identifier on the redirect? This decides the first spike. | Provider + Engineering | Yes |
| For each gateway: which unit identifier and login address does current firmware send, and does any result arrive over HTTP or HTTPS? | Engineering | Yes (spike) |
| Can one captive portal profile cover the whole fleet, or is it set per unit or per group? | Provider | Yes |
| Does any gateway in use need a TLS certificate on each unit, and how would it be issued and renewed? | Provider + Engineering | Yes |
| Are guest sessions shared across units at multi-unit events, or does each unit authorise locally? | Provider | No |
| Which gating mechanism does each gateway support (an authentication server, an API or a token), and who runs any server it needs? | Engineering + Provider | No (blocks data capture and paid access) |
| Does each gateway's walled garden match a domain on every request, or resolve it to IPs when configured? Cloudflare's anycast IPs aren't ours and can change. | Engineering | Yes |
| Do the gateways in use advertise RFC 8910 or support RFC 8908? | Engineering | No |
| Which payment provider, and which domains go in the walled garden? | Provider + Engineering | No (paid access) |
| Who is the data controller for captured contacts: producer, sponsor or provider? This drives the notice wording. | Legal | Yes |
| What is the per-unit concurrency and the guest volume per event, to size the portal service? | Provider | No |
| As far as we know, D1 and Durable Objects offer no Australian jurisdiction. Keep guest emails and phones in Cloudflare and meet APP 8 cross-border duties, or use an AU-region store? | Legal + Engineering | Yes |
| Will Unsplash allow a resized self-hosted copy on publish? Its API guidelines require hotlinking. Ask api@unsplash.com; the fallback is whitelisting its CDN. | Product | No |

## Phasing

0. **Captivator MVP (test project).** The 4-hour Next.js editor in Phase 0: templates, block editor, live mobile/desktop preview with guest-screen switcher, localStorage persistence. *Gate: public repo with steady commits, plus a live deploy, submitted for review.*
1. **Spike: prove one gateway loop.** One unit of the most common gateway in the fleet, a fixed external splash URL, its login step, and its redirect parameters captured. Test on iOS, Android and Windows. *Gate: guests get online and the OS marks the network online on all three; the redirect identifies the unit.*
2. **Portal service plus a hard-coded design.** A Worker + Hono service with booking routing, all generated states, consent records and server-side analytics. *Gate: a pilot event run on a design provider staff configure in a file.*
3. **Designer v1.** The MVP editor wired to publish and roll back, the validation gate and live counts. *Gate: three customer-built events with no staff build and no event-day portal incidents.*
4. **Data capture and paid access.** Gated access on each supported gateway, per-sponsor opt-in, live export, payment, impersonation checks, i18n. *Gate: no guest gets online without a recorded submission when capture is on.*

## Sources

- [Captivator editor canvas](https://claude.ai/artifact/AWrSjgB8dZV2KWn8kkDeYj)
- [RFC 8910](https://www.rfc-editor.org/rfc/rfc8910) · [RFC 8908](https://www.rfc-editor.org/rfc/rfc8908) · [RFC 8952](https://www.rfc-editor.org/rfc/rfc8952) · [RFC 2865 (RADIUS)](https://www.rfc-editor.org/rfc/rfc2865)
- [Unsplash API guidelines](https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines) · [Google: OAuth in embedded WebViews](https://developers.googleblog.com/2021/06/upcoming-security-changes-to-googles-oauth-2.0-authorization-endpoint.html) · [Hono](https://hono.dev) · [Cloudflare Workers](https://developers.cloudflare.com/workers/) · [Zustand](https://zustand.docs.pmnd.rs) · [Zod](https://zod.dev)
- [Australian Privacy Principles](https://www.oaic.gov.au/privacy/australian-privacy-principles) · [ACMA Spam Act guidance](https://www.acma.gov.au/avoid-sending-spam)
