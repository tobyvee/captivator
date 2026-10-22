---
title: "T-030: README and final deploy"
type: ticket
project: captivator
status: todo
priority: P1
milestone: 9
estimate: 10
depends_on: [T-029]
touches:
  - README.md
cut_rank:
updated: 2026-10-22
tags: [project, captivator, ticket, docs]
---
# T-030: README and final deploy

## Context
Build step 9, "README and final deploy" ([spec → Testing, deploy and README → README contents](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md)). Use the `readme-writer` agent. The README is how reviewers read the project, so it says honestly what shipped, what was cut and why. Decisions to reflect: [`general-export-form-action.md`](../decisions/general-export-form-action.md) (two-hop form flow), [`general-minimum-ios-version.md`](../decisions/general-minimum-ios-version.md), [`general-photo-contrast-approximate.md`](../decisions/general-photo-contrast-approximate.md), [`T-002-template-photos-and-credits.md`](../decisions/T-002-template-photos-and-credits.md), [`T-006-overlay-two-stop-wash.md`](../decisions/T-006-overlay-two-stop-wash.md), and every `*-cut.md` file written by `/prioritise-tickets`.

## Scope
`README.md`, following the spec's six sections:
1. One line on what it is, the live URL (the Cloudflare Worker's address), and a screenshot or GIF (the main session captures it).
2. Run locally: `npm i && npm run dev` (Node 22 or newer), plus the optional `UNSPLASH_ACCESS_KEY` in `.dev.vars`. Note that every push to `main` deploys through the GitHub Actions workflow.
3. What's in it, mapped to the brief's list, then the extras.
4. Key decisions, one line each:
   - The schema-first `Design` with three zones.
   - The inline-styled renderer shared by preview and export.
   - Flexbox within the viewport.
   - Client-side downscaling.
   - The small-phone fit check.
   - vinext on Cloudflare Workers instead of Vercel.
5. Path to production:
   - Peplink external splash routed on `sn`.
   - The form POST to an allowlisted `form_action`, via the portal service's two hops.
   - Portal service on Cloudflare Workers + Hono.
   - RADIUS before data capture.
   - Consent records and terms versions.
   - Unsplash self-hosting pending confirmation.
   - A link to the PRD.
6. What I'd do next, and what was cut and why (from `.project/tickets/INDEX.md`'s Cut list and the cut decisions). Include the deferred fade-direction control.

Credit the template photographers (Marcel Strauß, Miguel Dominguez, Woliul Hasan) under the Unsplash License.

**Final deploy** (main session): pushing this ticket triggers the deploy workflow. Confirm its run is green and the production URL loads on mobile data; T-029 records the mobile-data check.

**Out of scope:** code changes.

## Acceptance criteria
- [ ] All six sections are present and accurate against the merged code and `INDEX.md`.
- [ ] No secrets, and no private claude.ai links presented as public (review finding 25): link repo paths for the PRD and spec.
- [ ] `npm run build` passes on the final commit, and that commit's deploy workflow run is green (`gh run list --workflow deploy.yml`).

## Dependencies
- T-029: the checklist results and any cuts are known before the README describes them.

## Decisions
- [`T-002-template-photos-and-credits.md`](../decisions/T-002-template-photos-and-credits.md): Template photos come from the canvas assets, and their credits live beside the templates, not in background.credit
- [`T-006-overlay-two-stop-wash.md`](../decisions/T-006-overlay-two-stop-wash.md): The photo overlay renders as a top-to-bottom gradient of its two colours; fade direction is deferred
- [`T-029-checklist-and-readme-run-last.md`](../decisions/T-029-checklist-and-readme-run-last.md): The phone checklist and README run after every other ticket
- [`T-029-phone-checklist-at-step-9.md`](../decisions/T-029-phone-checklist-at-step-9.md): The real-phone checklist is its own ticket at build step 9, run by the main session
- [`general-deploy-cloudflare-vinext.md`](../decisions/general-deploy-cloudflare-vinext.md): The MVP deploys to Cloudflare Workers with vinext, not Vercel
- [`general-deploy-via-github-actions.md`](../decisions/general-deploy-via-github-actions.md): A GitHub Actions workflow tests and deploys every push to main
- [`general-export-form-action.md`](../decisions/general-export-form-action.md): An export with guest fields posts to a portal-service placeholder, not the router
- [`general-minimum-ios-version.md`](../decisions/general-minimum-ios-version.md): The guest page targets iOS 15.4 and newer
- [`general-photo-contrast-approximate.md`](../decisions/general-photo-contrast-approximate.md): The photo contrast check is labelled approximate
