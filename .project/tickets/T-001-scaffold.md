---
title: "T-001: Scaffold the Next.js app on vinext, with dependencies, Vitest, the deploy workflow and schema tests"
type: ticket
project: captivator
status: done
priority: P0
milestone: 1
estimate: 30
depends_on: []
touches:
  - package.json
  - package-lock.json
  - tsconfig.json
  - next.config.ts
  - vite.config.ts
  - cloudflare.config.ts
  - eslint.config.mjs
  - postcss.config.mjs
  - vitest.config.ts
  - vitest.setup.ts
  - .dev.vars.example
  - .gitignore
  - .github/workflows/deploy.yml
  - src/app/layout.tsx
  - src/app/page.tsx
  - src/app/globals.css
  - src/app/favicon.ico
  - src/lib/types.ts
  - src/lib/design-schema.test.ts
cut_rank:
updated: 2026-10-22
tags: [project, captivator, ticket, infra, schema, security]
---
# T-001: Scaffold the Next.js app on vinext, with dependencies, Vitest, the deploy workflow and schema tests

## Context
Build step 1 ([spec → Build plan](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md), *Stack and dependencies*, *Unit tests*). Every other ticket depends on this one, so it installs **every** package the MVP needs (including stretch-only ones) and creates the shared type file, so no later ticket touches `package.json`. The committed `src/lib/design-schema.ts` is used as-is and is not edited by any ticket. Decisions: [`T-001-scaffold-owns-dependencies-and-shared-types.md`](../decisions/T-001-scaffold-owns-dependencies-and-shared-types.md), [`general-design-schema-committed.md`](../decisions/general-design-schema-committed.md), [`general-url-allowlist.md`](../decisions/general-url-allowlist.md), [`general-new-modules-beyond-project-structure.md`](../decisions/general-new-modules-beyond-project-structure.md), [`general-deploy-cloudflare-vinext.md`](../decisions/general-deploy-cloudflare-vinext.md), [`general-deploy-via-github-actions.md`](../decisions/general-deploy-via-github-actions.md).

The app deploys to Cloudflare Workers with [vinext](https://vinext.dev/), not Vercel. Before writing any config, read vinext's [Cloudflare Workers](https://vinext.dev/docs/deploying/cloudflare), [migration](https://vinext.dev/docs/getting-started/migrating) and [differences](https://vinext.dev/docs/reference/differences) pages for the version you install. vinext is under active development, so follow its docs where they differ from this ticket, and log the difference.

## Scope
- Use Node 22 or newer (vinext's minimum).
- Run `create-next-app@16` (Next.js 16, the major vinext targets; TypeScript, App Router, Tailwind, ESLint, `src/` dir, `@/*` alias, npm) **in a temporary directory**, then copy the result into the repo root. `create-next-app` refuses a non-empty directory, and the repo already holds `CLAUDE.md`, `.claude/`, `.project/`, `.gitignore` and `src/lib/design-schema.ts`. When copying:
  - **Never overwrite** `src/lib/design-schema.ts` or `CLAUDE.md`.
  - **Merge, don't overwrite, `.gitignore`.** The existing one is more complete, so keep every line and add only what's missing (e.g. vinext's build output).
  - Don't copy the generated `README.md` (T-030 owns it), `.git/`, or the sample SVGs in `public/`.
- In the repo root, run `npx vinext init --platform=cloudflare`. It adds `vite.config.ts`, `cloudflare.config.ts`, `"type": "module"` and `*:vinext` scripts, and leaves `next` installed. Keep what it generates, then:
  - **Scripts:** make `dev`, `build` and `start` the vinext ones and drop the duplicate `*:vinext` scripts. `build` is `vitest run && vite build`.
  - **Deploy script:** add `"deploy"`, which runs the vinext Cloudflare deploy. Install `@vinext/cloudflare` as a dev dependency so CI uses a pinned version.
  - **Worker config (`cloudflare.config.ts`):** name the Worker `captivator`. Enable Node.js compatibility with a compatibility date of 2025-04-01 or later, so Worker secrets reach `process.env` (T-031 reads `UNSPLASH_ACCESS_KEY` there). Keep the generated asset-routing block, and add no bindings: T-031 adds the KV cache.
  - **`src/` layout:** confirm that vinext serves `src/app/`. If it only finds a root `app/`, stop and report: moving it would change every ticket's `touches`.
  - **Compatibility:** run `npx vinext check`, and fix or report anything it flags.
- Install runtime deps: `zod`, `zustand`, `zundo`, `react-colorful`, `fast-average-color`, `lucide-react`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (stretch, installed now so T-034 needn't touch `package.json`).
- Install dev deps: `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`, `@testing-library/user-event`.
- `package.json` scripts: `"test": "vitest run"`, `"build": "vitest run && vite build"`, `"deploy"` as above; keep `dev`, `start`, `lint`.
- `vitest.config.ts`: `environment: 'node'` by default, the `@/` alias, the React plugin, `setupFiles: ['vitest.setup.ts']` (imports `@testing-library/jest-dom/vitest`), `include: ['src/**/*.test.{ts,tsx}']`. Component tests opt into jsdom per file with `// @vitest-environment jsdom`. Keep it separate from `vite.config.ts`, and don't load the vinext or Cloudflare plugins in it, so tests run in plain Node or jsdom.
- `.github/workflows/deploy.yml`:
  - **Triggers:** `push` to `main` and `workflow_dispatch` only, never `pull_request` or `pull_request_target`.
  - **Safety:** `permissions: contents: read`, and a `concurrency` group so deploys run in push order without cancelling one another.
  - **Steps:** Node 22, `npm ci`, `npm run build` (the tests run first, so a failing test stops the deploy), then `npm run deploy`. Skip the deploy's own build if the installed version can reuse the output.
  - **Secrets:** pass `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` from repository secrets, and never echo them.
  - **Actions:** pin each third-party action to a version.
- `eslint.config.mjs`: turn off `@next/next/no-img-element` (the splash renderer must use plain `<img>`, never `next/image`).
- `next.config.ts`: no `images.remotePatterns`, no custom headers. vinext reads it.
- `src/app/layout.tsx`: `lang="en"`, metadata title "Captivator", `globals.css`; editor chrome font Inter via `next/font/google` with a `system-ui` fallback (matches the canvas). Under vinext, this loads from Google's CDN at runtime; that's fine for the editor, but never use it in `src/splash/`. `globals.css` keeps the Tailwind import and a neutral body (`#F4F4F5` background, `#18181B` text).
- `src/app/page.tsx`: placeholder ("Captivator" and a link to `/editor`). T-019 replaces it with the template picker.
- `.dev.vars.example`: `UNSPLASH_ACCESS_KEY=` with a comment that it's server-only and optional, that local dev reads it from a copy named `.dev.vars` (gitignored), and that production uses a Worker secret.
- `src/lib/types.ts`: the shared types below.
- `src/lib/design-schema.test.ts`: the schema cases below.
- **Out of scope:** editing `design-schema.ts`; templates (T-002); "All four templates parse" (T-002/T-018 in `templates.test.ts`); the README (T-030); the KV data cache (T-031); pushing (the main session pushes once the ticket is recorded; implementers don't push); the Cloudflare account, API token and GitHub secrets (the user sets those up).

## Acceptance criteria
- [x] `npm run dev` (vinext) serves `/` with a link to `/editor`.
- [x] `git diff` shows no change to `src/lib/design-schema.ts` or `CLAUDE.md`, and `.gitignore` only gains lines.
- [x] Schema tests pass: rejects a third image, a third field, a duplicate field, a bad hex (`#FFF`, `red`), text over 120 characters; accepts a `data:image/png;base64,…` src, a `/templates/sponsor.jpg` src and an `https:` src.
- [x] **Security (schema is the trust boundary):** tests show a `javascript:alert(1)` src, a `data:text/html;base64,…` src, a `data:image/svg+xml;base64,…` src, an `http:` src and `/templates/../evil.jpg` are rejected; a credit `profileUrl` not on `https://unsplash.com/` and a `downloadLocation` not on `https://api.unsplash.com/` are rejected.
- [x] A throwaway `// @vitest-environment jsdom` test rendering a component with Testing Library passes locally (proves the setup); don't commit it, because jsdom files are limited to two (`.claude/agents/test-writer.md`).
- [x] `npm run build` runs Vitest before `vite build`, and a deliberately failing test stops it. Check this locally, and don't commit the failing test.
- [x] `npx vinext check` flags nothing the MVP uses, or the report lists what it flags.
- [x] **Security (deploy workflow):** `deploy.yml` runs only on push to `main` and manual dispatch, has read-only `contents` permission, takes the Cloudflare token and account ID only from secrets, and runs the tests before deploying.
- [x] No `NEXT_PUBLIC_` variables; `.dev.vars.example` lists only `UNSPLASH_ACCESS_KEY`, and `.dev.vars` is gitignored.
- [x] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
None. The schema is already at `HEAD`.

## Notes
`src/lib/types.ts` (exact content; other tickets import these names):

```ts
import type { z } from "zod";
import type { Background, Block, Design } from "./design-schema";

export type BackgroundSpec = z.infer<typeof Background>;
export type ImageBackground = Extract<BackgroundSpec, { type: "image" }>;
export type TextBlockSpec = Extract<Block, { kind: "text" }>;
export type ImageBlockSpec = Extract<Block, { kind: "image" }>;
export type FormSpec = Design["form"];
export type FieldKindSpec = FormSpec["fields"][number];

export type Screen = "landing" | "terms" | "error" | "connected";
export type RenderMode = "edit" | "preview" | "export";
export type Device = "mobile" | "desktop";
export type SelectionKind = "background" | "block" | "fields" | "terms" | "button";
export type Selection = { kind: SelectionKind; id?: string };
```

- Use the installed Zod major's API. The schema uses `z.string().regex`, `z.discriminatedUnion` and `.refine`, which work in Zod 3 and 4. If `tsc` reports a problem inside `design-schema.ts`, report it rather than editing the file.
- Build schema test fixtures from `BLANK.design` (exported by the schema) with `structuredClone`, then mutate one thing per case.
- **The user sets this up before the ticket is pushed** (spec *Deploy*). Neither this agent nor the main session does it:
  1. Create a Cloudflare API token from the "Edit Cloudflare Workers" template.
  2. Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as GitHub Actions repository secrets.

  Without them, the first deploy run fails; re-run it once they're added.

**Outcome (recorded by the main session):**
- **Fonts:** vinext 1.3.0 self-hosts `next/font/google`, serving Inter from `/_next/static/_vinext_fonts/`. It uses Google's CDN only as a fallback, so the scope's note about loading from the CDN at runtime is out of date.
- **Dev server:** `npm run dev` serves on port 5173, and `npm run start` runs `vite preview`. `@vinext/cloudflare` stays in `dependencies`, where `vinext init` put it ([`T-001-vinext-standard-scripts.md`](../decisions/T-001-vinext-standard-scripts.md)).
- **Security headers:** finding 2 (low) is deferred: the editor sends no security headers ([review](../review/2026-10-22-security-T-001-review.md), [`T-001-security-headers-deferred.md`](../decisions/T-001-security-headers-deferred.md)). Finding 1 (a manual workflow run could deploy another branch) is fixed by a `main`-only guard on the deploy job.
- **`npm audit`:** the remaining `braces` and `fflate` entries are build-time only and accepted ([`T-001-vite-patched-release.md`](../decisions/T-001-vite-patched-release.md)).
- **Deploy:** not exercised end to end locally. `vinext-cloudflare deploy --dry-run` and `cf deploy --prebuilt --dry-run` passed. The first real deploy runs on this ticket's push and needs the user's Cloudflare secrets.

## Decisions
- [`T-001-deploy-workflow-reuses-build.md`](../decisions/T-001-deploy-workflow-reuses-build.md): The deploy workflow deploys the tested build with --skip-build and queues runs in push order
- [`T-001-scaffold-owns-dependencies-and-shared-types.md`](../decisions/T-001-scaffold-owns-dependencies-and-shared-types.md): The scaffold ticket installs every dependency and creates the shared type file
- [`T-001-security-headers-deferred.md`](../decisions/T-001-security-headers-deferred.md): Security headers on HTML responses are deferred, not added in the scaffold
- [`T-001-tailwind-via-postcss.md`](../decisions/T-001-tailwind-via-postcss.md): Tailwind runs through PostCSS, and the Turbopack loader config is removed
- [`T-001-testing-library-cleanup-in-setup.md`](../decisions/T-001-testing-library-cleanup-in-setup.md): vitest.setup.ts does Testing Library's auto-setup for jsdom tests
- [`T-001-typecheck-without-generated-globals.md`](../decisions/T-001-typecheck-without-generated-globals.md): Type-checking includes vinext's generated Worker types but never depends on generated globals
- [`T-001-unsplash-secret-binding-in-t031.md`](../decisions/T-001-unsplash-secret-binding-in-t031.md): T-031, not the scaffold, declares UNSPLASH_ACCESS_KEY as a secret binding
- [`T-001-vinext-standard-scripts.md`](../decisions/T-001-vinext-standard-scripts.md): Scripts use vinext's standard names, and vinext init's dependency placement is kept
- [`T-001-vite-patched-release.md`](../decisions/T-001-vite-patched-release.md): vite is raised to 8.3.3 to clear a dev-server advisory, and two transitive advisories are left for upstream
- [`general-deploy-cloudflare-vinext.md`](../decisions/general-deploy-cloudflare-vinext.md): The MVP deploys to Cloudflare Workers with vinext, not Vercel
- [`general-deploy-via-github-actions.md`](../decisions/general-deploy-via-github-actions.md): A GitHub Actions workflow tests and deploys every push to main
- [`general-design-schema-committed.md`](../decisions/general-design-schema-committed.md): design-schema.ts from the design phase is committed at src/lib
- [`general-new-modules-beyond-project-structure.md`](../decisions/general-new-modules-beyond-project-structure.md): Planning adds small modules to the spec's project structure so each ticket owns its own files
- [`general-url-allowlist.md`](../decisions/general-url-allowlist.md): Image and credit URLs are allowlisted by scheme and host
