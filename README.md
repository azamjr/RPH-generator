# RPH Studio

A public pilot webapp for Malaysian primary Mathematics teachers, built for Tahun 1–6. Teachers select SK/SP from their supplied curriculum PDFs, prepare a lesson, edit individual sections, and export RPHs, differentiated worksheets and teacher answer keys.

## What works

- Four-step lesson form with multi-select SK/SP, duration warnings, BM/English output selection, class context and adjustable worksheet counts.
- Curriculum browser containing **325 extracted SP** across Tahun 1–6 with source filename and PDF page references. Original statements are English; all entries remain **extracted, pending human review**.
- Section editor, teacher-confirmed section regeneration, worksheet/answer editing, safe arithmetic checks and blank post-lesson reflection.
- On-demand `.docx` and PDF downloads: complete pack, lesson only, pupil worksheets without answers, or teacher answer key.
- Private cloud records, class profiles, template preferences, lesson duplication and up to 30 versions per lesson. Database requests are scoped to the authenticated user. Concurrent saves use revision checks.
- Responsive desktop-first workspace.
- Server-side Gemini adapter with explicit consent and bounded pilot quotas. Generation is disabled until the required server configuration is present.

## Important current limitations

**A working editor is not the same as enabled AI.** The arithmetic sample is a fixed addition example. It is prominently labelled in the app and exported files and must not be treated as aligned to arbitrary selected SP. It works without provider credentials.

Live AI needs `GEMINI_API_KEY` and `GEMINI_FREE_TIER_CONFIRMED=true` configured as hosted runtime secrets. Only confirm the latter after checking that the Google project is on the free tier with billing disabled. The app cannot verify Google billing status. No paid failover or automatic upgrade exists. The adapter uses `gemini-3.5-flash-lite`; verify current model availability before activation. Failed attempts count conservatively toward application limits.

The pilot uses the hosting platform's **ChatGPT identity**. This does **not** connect a teacher's ChatGPT subscription for inference. Google/email login and ChatGPT-plan generation remain pending supported integrations and eligibility checks; they are honestly shown as pending. Do not bypass this with stored ChatGPT passwords or session cookies.

Visitors can open the public planner. Sign in with ChatGPT to save personal plans and request AI generation when configured.

The original curriculum is English. BM lesson activities can be generated, but the curriculum statements stay in their source language. No unofficial translation is presented as exact KPM text. Extraction preserves source peculiarities and may lose superscript formatting; review cited pages before relying on a standard. Worksheet level does not assign a PBD TP.

## Architecture

Next-compatible React/TypeScript routes through Vinext, deployed as a Cloudflare Worker through Sites; Cloudflare D1 holds user-scoped JSON records, immutable lesson snapshots and daily AI counters. No files are stored for exports. No R2 is provisioned. UI components follow the included MIT-licensed shadcn-compatible starter; document export uses `dolanmiu/docx` and jsPDF. Earlier SaaS dashboard candidates were evaluated but not copied wholesale; the hosting-compatible starter avoids unnecessary Clerk/Stripe services.

- `app/workspace.tsx` — dashboard, form, editor and settings
- `app/api/workspace/route.ts` — authenticated persistence and version history
- `app/api/generate/route.ts` — validated generation and quota enforcement
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

## Pilot limits

- 5 AI attempts per teacher per UTC day; 50 for the site per UTC day.
- 100 saved records per teacher; each payload is bounded to 100 KB.
- 30 snapshots per lesson; exports generated locally on demand.
- Up to 12 SP, 1–10 questions per worksheet level, 1–60 pupils.
- Application quota reset: 00:00 UTC / 08:00 Malaysia. Provider quotas may differ.

At quota exhaustion, affected generation/saving pauses. Existing editing and local exports remain available. Hosting free-tier exhaustion may affect availability of the whole site; the app cannot guarantee uptime beyond provider limits.

## Source and license notes

Preserve the included third-party license files. This repository does not claim ownership of the KPM curriculum documents or official approval of generated lessons. A teacher must review mathematics, curriculum alignment and classroom suitability before use.
