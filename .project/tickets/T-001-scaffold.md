---
title: "T-001: Scaffold the Next.js app, dependencies, Vitest and schema tests"
type: ticket
project: captivator
status: todo
priority: P0
milestone: 1
estimate: 20
depends_on: []
touches:
  - package.json
  - package-lock.json
  - tsconfig.json
  - next.config.ts
  - eslint.config.mjs
  - postcss.config.mjs
  - vitest.config.ts
  - vitest.setup.ts
  - .env.example
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
# T-001: Scaffold the Next.js app, dependencies, Vitest and schema tests

## Context
Build step 1 ([spec → Build plan](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md), *Stack and dependencies*, *Unit tests*). Every other ticket depends on this one, so it installs **every** package the MVP needs (including stretch-only ones) and creates the shared type file, so no later ticket touches `package.json`. The committed `src/lib/design-schema.ts` is used as-is and is not edited by any ticket. Decisions: [`T-001-scaffold-owns-dependencies-and-shared-types.md`](../decisions/T-001-scaffold-owns-dependencies-and-shared-types.md), [`general-design-schema-committed.md`](../decisions/general-design-schema-committed.md), [`general-url-allowlist.md`](../decisions/general-url-allowlist.md), [`general-new-modules-beyond-project-structure.md`](../decisions/general-new-modules-beyond-project-structure.md).

## Scope
- Run `create-next-app` (latest stable; TypeScript, App Router, Tailwind, ESLint, `src/` dir, `@/*` alias, npm) **in a temporary directory**, then copy the result into the repo root. `create-next-app` refuses a non-empty directory, and the repo already holds `CLAUDE.md`, `.claude/`, `.project/`, `.gitignore` and `src/lib/design-schema.ts`. When copying:
  - **Never overwrite** `src/lib/design-schema.ts`, `.gitignore` (the existing one is more complete) or `CLAUDE.md`.
  - Don't copy the generated `README.md` (T-030 owns it), `.git/`, or the sample SVGs in `public/`.
- Install runtime deps: `zod`, `zustand`, `zundo`, `react-colorful`, `fast-average-color`, `lucide-react`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (stretch, installed now so T-034 needn't touch `package.json`).
- Install dev deps: `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`, `@testing-library/user-event`.
- `package.json` scripts: `"test": "vitest run"`, `"build": "vitest run && next build"`; keep `dev`, `start`, `lint`.
- `vitest.config.ts`: `environment: 'node'` by default, the `@/` alias, the React plugin, `setupFiles: ['vitest.setup.ts']` (imports `@testing-library/jest-dom/vitest`), `include: ['src/**/*.test.{ts,tsx}']`. Component tests opt into jsdom per file with `// @vitest-environment jsdom`.
- `eslint.config.mjs`: turn off `@next/next/no-img-element` (the splash renderer must use plain `<img>`, never `next/image`).
- `next.config.ts`: no `images.remotePatterns`, no custom headers.
- `src/app/layout.tsx`: `lang="en"`, metadata title "Captivator", `globals.css`; editor chrome font Inter via `next/font/google` with a `system-ui` fallback (matches the canvas). `globals.css` keeps the Tailwind import and a neutral body (`#F4F4F5` background, `#18181B` text).
- `src/app/page.tsx`: placeholder ("Captivator" and a link to `/editor`). T-019 replaces it with the template picker.
- `.env.example`: `UNSPLASH_ACCESS_KEY=` with a comment that it's server-only and optional.
- `src/lib/types.ts`: the shared types below.
- `src/lib/design-schema.test.ts`: the schema cases below.
- **Out of scope:** editing `design-schema.ts`; templates (T-002); "All four templates parse" (T-002/T-018 in `templates.test.ts`); the README (T-030); pushing to GitHub and linking Vercel (the main session does that after merge; implementers don't push).

## Acceptance criteria
- [ ] `npm run dev` serves `/` with a link to `/editor`.
- [ ] `git diff` shows no change to `src/lib/design-schema.ts`, `.gitignore` or `CLAUDE.md`.
- [ ] Schema tests pass: rejects a third image, a third field, a duplicate field, a bad hex (`#FFF`, `red`), text over 120 characters; accepts a `data:image/png;base64,…` src, a `/templates/sponsor.jpg` src and an `https:` src.
- [ ] **Security (schema is the trust boundary):** tests show a `javascript:alert(1)` src, a `data:text/html;base64,…` src, a `data:image/svg+xml;base64,…` src, an `http:` src and `/templates/../evil.jpg` are rejected; a credit `profileUrl` not on `https://unsplash.com/` and a `downloadLocation` not on `https://api.unsplash.com/` are rejected.
- [ ] A throwaway `// @vitest-environment jsdom` test rendering a component with Testing Library passes locally (proves the setup); don't commit it, because jsdom files are limited to two (`.claude/agents/test-writer.md`).
- [ ] `npm run build` runs Vitest before `next build`.
- [ ] No `NEXT_PUBLIC_` variables; `.env.example` lists only `UNSPLASH_ACCESS_KEY`.
- [ ] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

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
- Manual follow-up for the main session (not this agent): push to GitHub and link the Vercel project (spec *Deploy*: "connected to the public GitHub repo at minute 5").

## Decisions
- [`T-001-scaffold-owns-dependencies-and-shared-types.md`](../decisions/T-001-scaffold-owns-dependencies-and-shared-types.md): The scaffold ticket installs every dependency and creates the shared type file
- [`general-design-schema-committed.md`](../decisions/general-design-schema-committed.md): design-schema.ts from the design phase is committed at src/lib
- [`general-new-modules-beyond-project-structure.md`](../decisions/general-new-modules-beyond-project-structure.md): Planning adds small modules to the spec's project structure so each ticket owns its own files
- [`general-url-allowlist.md`](../decisions/general-url-allowlist.md): Image and credit URLs are allowlisted by scheme and host
