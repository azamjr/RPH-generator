# Pilot readiness

Implemented: guided form, source-linked standards, per-section editing, worksheets, answers, Word/PDF export, cloud persistence with owner checks, class profiles, template preferences, version recovery, quota-aware Gemini adapter.

Before classroom pilot:

1. Review the extracted SK/SP text against the four supplied PDFs, especially continued entries and superscript angles. Entries remain extracted until a controlled review updates their status.
2. Configure a Gemini key from a confirmed free project with billing disabled, set `GEMINI_FREE_TIER_CONFIRMED=true`, and exercise BM and English generation across number, fractions, time, geometry and data topics. Adapter credentials were not supplied during implementation; live provider requests are untested.
3. Check provider privacy terms with pilot teachers and keep pupil personal data out of free text.
4. Confirm permitted invited-user access on the hosting platform before admitting teachers. Initial deployment is owner-private.
5. Integrate Google/email authentication only through a supported hosting identity path. Sign in with ChatGPT for plan usage is a separate future integration.
6. Print a generated RPH and each worksheet level; teacher-check all mathematical solutions and SP alignment. Automated checks cover arithmetic expressions, not full semantic correctness.
7. Validate restore and concurrent-save handling with two browser sessions of the same teacher. Never overwrite another user's records.

No paid cloud service, AI key, billing account or ChatGPT-session automation was activated by this implementation.
