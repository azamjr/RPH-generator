# RPH Studio

A public pilot webapp for Malaysian primary Mathematics teachers, built for Tahun 1–6. Teachers select SK/SP from their supplied curriculum PDFs, prepare a lesson, edit individual sections, and export RPHs, differentiated worksheets and teacher answer keys.

## What works

- Four-step lesson form with multi-select SK/SP, duration warnings, BM/English output selection, class context and adjustable worksheet counts.
- Curriculum browser containing **325 extracted SP** across Tahun 1–6 with source filename and PDF page references. Original statements are English; all entries remain **extracted, pending human review**.
- Section editor, teacher-confirmed section regeneration, worksheet/answer editing, safe arithmetic checks and blank post-lesson reflection.
- On-demand `.docx` and PDF downloads: complete pack, lesson only, pupil worksheets without answers, or teacher answer key.
- Private cloud records, class profiles, template preferences, lesson duplication and up to 30 versions per lesson. Database requests are scoped to the authenticated user. Concurrent saves use revision checks.
- Responsive desktop-first workspace.
- Optional Sign in with ChatGPT plan usage for locally run, open-source installations. Each teacher authorizes their own account; the app does not use a shared API key or quota.

## Important current limitations

**A working editor is not the same as enabled AI.** The arithmetic sample is a fixed addition example. It is prominently labelled in the app and exported files and must not be treated as aligned to arbitrary selected SP. It works without provider credentials.

AI generation uses OpenAI's documented Sign in with ChatGPT flow for open-source and locally hosted apps. It is enabled only at `http://127.0.0.1`; generation on a remotely hosted copy is deliberately blocked. The user approves separate ChatGPT plan usage permissions in the OpenAI sign-in screen. The app never collects ChatGPT passwords, browser cookies, or API keys. OAuth access and refresh tokens remain in the local D1 database under `.wrangler/` and are not returned to the browser. Keep that local state private to the operating-system account and do not commit it.

Every generation request is sent to the OpenAI Responses API with `store: false` and `stream: true`, using a model available to the connected account. There is no Gemini integration, app-funded quota, provider fallback, or promise of a fixed number of generations. Usage limits belong to each user's ChatGPT plan and are shared with their other ChatGPT plan usage. Review and disconnect access through ChatGPT Settings → Usage.

The hosting platform's ChatGPT sign-in, when available, identifies the RPH workspace; it is separate from the optional ChatGPT plan connection used for generation. Self-hosted copies use the local development identity for the workspace. Never expose that development identity or local plan-usage endpoints on a public deployment.

Visitors can open the public planner. Workspace sign-in is used for the hosted pilot's saved plans; self-hosted copies use a local development identity and the separate ChatGPT plan connection described below.

The original curriculum is English. BM lesson activities can be generated, but the curriculum statements stay in their source language. No unofficial translation is presented as exact KPM text. Extraction preserves source peculiarities and may lose superscript formatting; review cited pages before relying on a standard. Worksheet level does not assign a PBD TP.

## Architecture

Next-compatible React/TypeScript routes through Vinext, deployed as a Cloudflare Worker through Sites; Cloudflare D1 holds user-scoped JSON records, immutable lesson snapshots and daily AI counters. No files are stored for exports. No R2 is provisioned. UI components follow the included MIT-licensed shadcn-compatible starter; document export uses `dolanmiu/docx` and jsPDF. Earlier SaaS dashboard candidates were evaluated but not copied wholesale; the hosting-compatible starter avoids unnecessary Clerk/Stripe services.

- `app/workspace.tsx` — dashboard, form, editor and settings
- `app/api/workspace/route.ts` — authenticated persistence and version history
- `app/api/generate/route.ts` — validated generation through the connected ChatGPT plan
- `app/api/chatgpt/` — local OAuth connection, account status, and disconnect routes
- `lib/chatgpt-plan.ts` — PKCE, token validation/refresh, model selection, and streamed Responses API client
- `lib/rph/` — document schema, quality checks, sample and exports
- `data/curriculum.json` — extracted SK/SP and source references
- `data/curriculum-sources.json` — source hashes, page counts and language
- `scripts/curriculum/extract.py` — reproducible column-aware PDF extraction
- `drizzle/` — schema-only database migrations

The shared document schema is independent of Mathematics-specific prompting and checking, allowing later subject modules.

## Local development

Requires Node 22.13+ and npm. Use the lockfile:

```sh
npm ci
npm run db:generate  # only after schema changes
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_uneven_terror.sql
npm run dev
```

On Unix, start the terminal session with `umask 077` before running the database and app commands. This keeps the local database and its ChatGPT tokens readable only by your OS account. The first migration creates the workspace tables. Apply the ChatGPT account migration to the local database before using Sign in with ChatGPT:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_chatgpt_plan.sql
```

Open the app at the loopback address shown by the local server, using `http://127.0.0.1` (not `localhost` or a public hostname). In Preferences, choose **Continue with ChatGPT**, approve ChatGPT plan usage, then return to RPH Studio. Sign-in and generation are intentionally unavailable on hosted URLs. Each self-hosted teacher runs and connects their own copy.

Apply each migration only once locally. Production migrations are applied by the hosting workflow. Portable local development uses the starter's development-only mock identity; never expose it as production authentication. Production identity must come from the trusted hosting gateway; do not deploy the worker directly with untrusted client-supplied identity headers.

```sh
npm run typecheck
npm test
python3 tests/storage_test.py
npm run build
```

API keys belong in server-side environment configuration, never Git, client code, prompts, screenshots or query strings. `.dev.vars`/`.env` files are ignored.

To reproduce curriculum extraction, install `pdfplumber` and run:

```sh
python3 scripts/curriculum/extract.py /path/to/the/four/pdfs
```

Raw PDFs are not copied into the public repository. Re-extraction requires the original filenames recorded in the source manifest.

## Limits and local data

- 100 saved records per teacher; each payload is bounded to 100 KB.
- 30 snapshots per lesson; exports generated locally on demand.
- Up to 12 SP, 1–10 questions per worksheet level, 1–60 pupils.

ChatGPT account limits govern generation. RPH Studio does not show or enforce an independent AI quota. Local database state, including ChatGPT credentials, is stored by Wrangler under `.wrangler/state`; use **Disconnect ChatGPT** in Preferences to revoke access before removing or sharing the computer.

## Source and license notes

Preserve the included third-party license files. This repository does not claim ownership of the KPM curriculum documents or official approval of generated lessons. A teacher must review mathematics, curriculum alignment and classroom suitability before use.

### Publish the public planner on Cloudflare Workers

Use Node 22.13 or newer. Run `npm ci`, then `npx wrangler login` and `npm run deploy:cloudflare`. Wrangler prints the public workers.dev URL. In Cloudflare Workers Builds, connect this repository, use the repository root and set the deploy command to `npm run deploy:cloudflare` (it includes the build).

This Worker deployment can serve the public planner and its assets, but remote ChatGPT plan generation is disabled. To use your own ChatGPT subscription, clone and run the repository locally at `127.0.0.1`, connect your own ChatGPT account in Preferences, and keep the local database private. OpenAI requires an interest-form process for remotely hosted apps that offer plan usage; this repository does not enable that path.
