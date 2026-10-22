# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Captivator is a Next.js editor where a non-technical customer designs a branded guest Wi-Fi splash (captive portal) page for PopUp WiFi units. It has a live mobile and desktop preview and exports the page as standalone HTML. This repo is the **Phase 0 MVP**, a time-boxed build. The spec is the source of truth for scope and build order:

- `.project/spec/Captivator MVP — Tech Spec.md`: stack, structure, store, renderer, export, tests, build plan and cut order.
- [Captivator editor canvas](https://claude.ai/artifact/AWrSjgB8dZV2KWn8kkDeYj#page-dcb81aee8d83): the design artifact for this project and the source of truth for how the editor looks. Read it with the Artifact tool, never WebFetch; see **Reading the canvas** below.
- `.project/prd/Captive Portal Designer — PRD.md`: the product. The **Phase 0** section covers the MVP; everything from "System context" onward (Peplink router, Workers portal service, RADIUS, consent) is the production path and is **out of scope here**.

The code has not been scaffolded yet. The commands and layout below are the ones the spec plans. Update this file once they exist.

### Reading the canvas

The canvas is a Design artifact, so a plain `action: "read"` on its URL returns no design content. Read it in two steps:

1. List its files: `action: "list"`, `scope: "files"`, `url: <canvas URL>`.
2. Read only the artboards you need, one per call: `action: "read"`, `url: <canvas URL>`, `path: <the path exactly as the listing prints it>`.

The artboards are `.dc.html` files under `project/`, and `project/canvas.json` describes the canvas as a whole. Take paths from the listing, not from memory. Which artboard covers what:

| Artboard | Covers |
|---|---|
| `Main` | The editor: top bar, block list, preview stage, inspector panels |
| `DesktopPreview` | The editor with the Desktop preview frame |
| `EditorTerms` | The Terms row and Terms panel in the editor |
| `Templates` | The template picker (`/`) |
| `StateLanding`, `StateTerms`, `StateError`, `StateConnected` | The four guest screens rendered by `SplashPage` |

Tickets name their artboard. If the Artifact tool isn't available, or a read fails, build from the spec alone and say so in your report.

## Commands (planned)

- `npm run dev`: local dev server.
- `npm test`: runs `vitest run`.
- `npx vitest run src/lib/contrast.test.ts`: run one test file; add `-t "<name>"` to run a single case.
- `npm run build`: runs `vitest run && next build`, so a failing test blocks the Vercel deploy. There is no separate CI.
- `UNSPLASH_ACCESS_KEY`: optional, server-side only. It's needed only if Unsplash search ships.

## Architecture

**One schema, one store, one renderer.**

- **`src/lib/design-schema.ts`:** the Zod `Design = { version, background, blocks, form }` is the single source of truth. A template is a named `Design`, and Blank is the smallest valid one.
  - Only `blocks` (text and image, max 2 images) can be reordered. Background is pinned at the top, and `form` (0–2 unique fields, terms, Connect button) is pinned at the bottom.
  - The shape enforces this ordering, not validation rules.
  - Input `type`/`autocomplete`/`inputmode` live in `FIELD_SPEC` and are never stored in the customer's design.
  - Image `src` and Unsplash credit URLs are allowlisted by scheme and host (raster data URLs, `/templates/*`, `https:`), never `z.string().url()`. A stored design can be hand-edited, so the schema is the trust boundary.
- **`src/lib/store.ts`:** a single Zustand store holding `design` + `name` + UI state (`selection`, `device`, `screen`, `logoPalette`). Editor panels only dispatch store actions.
  - **`persist`:**
    - Key `captivator:v2` with `partialize` to `{ design, name }`, plus a `version`/`migrate` that falls back to the template.
    - A `merge` that runs `Design.safeParse` and, on failure, keeps the template and sets `restoreFailed` so the editor says "Couldn't restore your saved design".
    - A debounced (~300ms) storage wrapper, flushed on `pagehide` and `visibilitychange`, that catches `QuotaExceededError` and sets a "couldn't save" flag.
    - `skipHydration: true`, then `rehydrate()` in a `useEffect` to avoid hydration mismatches.
  - **zundo `temporal`:** tracks **only `design`**, behind a leading-edge debounce (~400ms) so one drag is one undo step, with a limit of 100 and in-memory only. Keyboard shortcuts skip text inputs so native text undo still works.
  - `logoPalette` holds suggestions only and is never written into `Design`.
- **`src/splash/SplashPage.tsx`:** a pure renderer `({ design, screen, mode, compact?, inFrame? })`. `mode` (`edit | preview | export`) is the only thing that varies the markup; the spec's **Render mode** table lists the differences. **Inline styles only, no Tailwind, and no editor or Next.js imports**, so it can move to the production portal service unchanged. Four consumers use it: the editor preview, the template-picker thumbnails, the fit check (`compact`) and Export HTML. Never fork rendering logic for one of them.
  - Layout uses flexbox only: a centred column with `max-width: 420px`, `gap` instead of margins, and a `flex: 1` spacer between the blocks and the form (omitted when `compact`). Content never uses absolute positioning or fixed heights; only the background layers do. The root's `min-height: 100vh` then `100dvh` can't be inline, so it's a `.cv-root` rule in the export's `<style>` block.
  - Screens: `landing | terms | error | connected`, all generated from the same `Design`.
- **`src/editor/`:** Tailwind editor chrome in three columns: block list, `PreviewStage` (phone 375×740 or browser 1280×800 scaled) and an inspector panel per selection kind.
- **`src/lib/export.ts`:** `renderToStaticMarkup(<SplashPage screen="landing">)` wrapped into a single file that needs no JS and no network.
  - Every image that isn't already a data URL (template photos, Unsplash) is fetched, downscaled and inlined. The background is then re-encoded (1000px, then 800px, with quality stepping down) to fit the budget.
  - Terms open via `#terms` + `:target`. That rule and `.cv-root` share the file's only `<style>` block.
  - Validation is native `required`.
  - A form with fields posts to a `[PORTAL_SUBMIT_URL]` placeholder, because guest personal data never goes to the router. Only a click-through form (no fields) posts to `[ROUTER_FORM_ACTION]` with `command=login`.
  - The design name is HTML-escaped.
  - The page budget is 100 KB; going over warns but doesn't block.
- **`src/app/api/unsplash/route.ts`:** the only server code (stretch). It trims responses to the allowed fields, and the download ping accepts only `api.unsplash.com` URLs.

## Constraints that shape the code

- **Splash output must run inside the iOS Captive Network Assistant.** The minimum target is iOS 15.4 (flexbox `gap`, `dvh`, `accent-color`). Use plain HTML and CSS: no `:has()`, no container queries, inputs at least 16px, tap targets at least 44px, and no external requests in exported pages.
- **Uploads are downscaled in the browser before they reach the store** (`lib/images.ts`):
  - Reject files over 10 MB.
  - Cap the long edge at 600px for logos and images, 1600px for backgrounds.
  - Encode as WebP 0.8, falling back to JPEG.
  - Rasterise SVGs; never store them as markup.
- **Templates are `Design.parse`d at module load**, so a broken template fails the build. Switching templates keeps the customer's images and text.
- **Checks warn but never block editing:**
  - Contrast (WCAG 4.5:1, or 3:1 at 24px and up). Gradients use the worse stop; photos use their average colour blended with the overlay, which is approximate, so the message says to check readability over the photo rather than claiming a pass.
  - Fit: warns when content passes 600px at 375px wide, the iPhone SE login sheet.
- **Terms checkbox:**
  - It is never pre-ticked.
  - It is separate from any marketing opt-in.
  - The body is plain text only, with blank lines splitting paragraphs.
  - Placeholder copy is bracketed prompts, never invented legal wording.

## Working rules

- **Follow the spec's build plan in order** and make one commit per milestone with an honest message, because the commit history is part of the review. Each milestone ends with its unit tests passing.
- **The time budget is the user's own time, not agent time,** so it never forces a cut and stretch work is scheduled at P2 like the rest. Cut only when the user asks, in the spec's order: Unsplash, then focus-point drag, the screen switcher, the logo palette, then the fit check. Never cut persistence, Export HTML or the brief's minimum.
- **Write each pure module's Vitest tests in the same step as the module**, using the cases listed in the spec's test table.

## Ticket workflow (`.claude/commands/`)

Run these in order. Use them instead of `/project-doc ticket` for build work.

1. `/plan-tickets [all | build step N | description]`: splits the spec into 10–40 minute tickets with `priority`, `milestone`, `estimate`, `depends_on` and `touches` in their frontmatter.
2. `/prioritise-tickets [work to cut]`: orders the tickets into waves of up to 4 where no two tickets in a wave touch the same files. It cuts only the work the user names, and never cuts P0.
3. `/implement-parallel wave N` runs one worktree agent per ticket, then rebases each onto the current branch with tests after every merge. `/implement-ticket T-NNN` implements a single ticket in place.

Parallel agents read their ticket and the spec from `.project/` in their worktree. The only thing they write there is **new** files in `.project/decisions/` (see below). Only the main session updates ticket status, `INDEX.md` and `STATUS.md`, so parallel branches can't conflict on them. Commit messages describe the change and end with the ticket ID, e.g. `Text panel with size presets (T-012)`.

## Agents (`.claude/agents/`)

- `test-writer`: after writing or changing a module, writes its tests from the spec's test table and runs them.
- `splash-auditor`: after changing `src/splash/` or export, audits the guest-facing output for iOS login-sheet and WebView compatibility, accessibility, contrast and the 100 KB budget. Read-only.
- `milestone-reviewer`: before each milestone commit, checks the milestone against the spec and the editor canvas, runs tests and type-checking, and suggests the commit message. Read-only.
- `readme-writer`: at the final build step, writes the README with the path to production.
- `ticket-planner`: used by `/plan-tickets`. It holds the split rules and ticket format, and writes ticket files only.
- `ticket-implementer`: used by `/implement-parallel` (one per worktree) and optionally `/implement-ticket`. It builds one ticket within its `touches`. Under `.project/`, it only adds decision files.
- `code-reviewer`: used by `/implement-ticket` and `/implement-parallel` before work is marked done. Read-only. It reviews correctness, completeness, concision, readability and Next.js/React/TypeScript practice for the installed versions, and returns must-fix / should-fix / nit findings with a verdict.
- `nextjs-specialist`: a Next.js App Router, React and TypeScript expert. It implements tickets that touch Next.js itself (scaffold, `src/app/`, `next.config`, store hydration), fixes `code-reviewer` findings, and answers "the right way in Next.js" questions against the installed version's docs.
- `security-auditor`: used by `/implement-ticket` (for tickets that touch a trust boundary), by `/implement-parallel` (after each wave's merges) and as a full-repo audit before the final deploy. Read-only. It reports findings by severity, each with an exploit, a fix and a regression test.
- `security-fixer`: fixes the audit findings it's given. Each fix comes with a regression test that fails first and is committed separately. Changes that would remove a customer-facing capability come back as `needs decision`. Under `.project/`, it only adds decision files.
- `branch-integrator`: used by `/implement-parallel`. It rebases a wave's branches onto the current branch one at a time, runs tests after each, fixes only mechanical conflicts, and reports what it merged and what it blocked.

## Project Management (`.project/`)

Planning docs live in `.project/`, which **is committed with this repo**. This overrides the global default of a local, gitignored folder. The repo is public, so everything in `.project/` is public too.

- `.project/prd/`: product requirements documents
- `.project/spec/`: technical specifications
- `.project/tickets/`: engineering tickets
- `.project/decisions/`: one file per decision made on a ticket (see **Decision log**)
- `.project/review/`: security audits with findings
- `.project/STATUS.md`: current status (the dashboard quotes the first paragraph under `## Summary`)

Every doc starts with YAML frontmatter (`title`, `type`, `project: captivator`,
`updated`, `tags`; `status` on tickets only). Create docs with `/project-doc`.
After finishing work, record it with `/project-update`: tick the ticket, update
`STATUS.md` and bump `updated:`. Commit those doc changes in the same commit as the work they record.

### Decision log (`.project/decisions/`)

**Every decision an agent or session makes on a ticket gets its own file in `.project/decisions/`**, committed with the work it shaped. This applies to the main session running a command and to every agent that writes code or tickets.

**What counts as a decision:** a choice between real alternatives that the spec, the canvas and the ticket don't already settle. For example:
- Interpreting an ambiguous requirement.
- Departing from the spec.
- Choosing a library, API or pattern.
- Changing a ticket's scope, `touches` or dependencies.
- Splitting or merging tickets.
- Cutting or deferring work.
- Fixing versus deferring a review or security finding.
- Resolving a non-mechanical merge.
- Any answer the user gives to a `needs decision`.

Following the spec as written, naming and formatting aren't decisions. If in doubt, log it.

**File name:** `<ticket-id>-<slug>.md`, e.g. `T-012-size-slider-step.md`. Use `general-<slug>.md` when no single ticket owns the decision. Never number decisions globally: agents in parallel worktrees would collide. Once committed, a decision file is never edited. To change course, write a new file that sets `supersedes:`.

```markdown
---
title: "<the decision, as a statement>"
type: decision           # project-specific addition to the global doc types
project: captivator
ticket: T-012            # or a list, or "none"
decided_by: ticket-implementer   # agent name, "main session", or "user"
supersedes:              # earlier decision file name, if any
updated: YYYY-MM-DD
tags: [project, captivator, decision, <area>]
---
# <the decision, as a statement>

## Context
What forced a choice, linked to the spec section or finding.

## Decision
What was chosen, in one or two sentences.

## Alternatives
Each option rejected, and why in one line.

## Consequences
What this commits later tickets to, or what it costs.
```

**Who writes what:**
- **Code-writing agents** (`ticket-implementer`, `nextjs-specialist`, `security-fixer`, `branch-integrator`) write their own decision files, commit them with the change, and list the file names in their report.
- **Read-only agents** (reviewers and auditors) can't write. When their result forces a choice, the calling session logs that choice.
- **When recording a ticket**, the main session adds a `## Decisions` list to the ticket linking its decision files.
- **Security decisions** describe the protection chosen, never a working exploit, because the repo is public.

### Reading the log

**Before acting on a ticket, a review or a question, check `.project/decisions/` for anything relevant.** The log records choices the spec doesn't show, and redoing or contradicting them silently is a defect.

1. **Find candidates.** List the folder, then read:
   - every `general-*.md` file (cross-cutting choices);
   - every file whose `ticket:` names your ticket, a ticket in its `depends_on`, or a ticket that owns a file you'll read or change (`grep -l "T-012" .project/decisions/*.md`);
   - any file whose title or tags match your area (`grep -il "<keyword>" .project/decisions/*.md`, e.g. `export`, `undo`, `schema`).
2. **Drop superseded files.** A file named in another file's `supersedes:` no longer applies; follow the newest in the chain.
3. **Precedence.** A decision overrides the spec or PRD text it departs from. A user decision (`decided_by: user`) overrides an agent's. If a decision conflicts with the spec and neither says which wins, or two live decisions conflict, don't pick: report the conflict.
4. **Cite them.** When a decision shaped what you did or found, name its file in your report. To depart from one, log a new decision that sets `supersedes:`; never just act against it. Read-only agents recommend this instead.
