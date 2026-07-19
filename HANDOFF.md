# HANDOFF — Phase 0 + 1 (Claude Code → Cursor)

Built 2026-07-19. Scope was: repo, schema, ingest abstraction, freshness monitor,
CBSL FX source, dashboard shell, deploy. Everything after is yours.

## What's built and verified

- **Repo**: https://github.com/Cookie-Cat21/lanka-monitor — MIT, committed in logical chunks.
- **CBSL scraper**: verified live on 2026-07-19. `python -m ingest.run` fetched and
  parsed 5 business days of USD/LKR buy/sell (e.g. 2026-07-17: buy 331.4266,
  sell 340.7885, cross-checked by hand against the CBSL site).
- **Next.js build**: `npm run build` passes clean. Dashboard renders dark,
  mobile-first, with the FX card degrading to an explicit
  "down / no data yet / this card refuses to guess" state when the DB is absent —
  the honesty layer works even with zero infrastructure.
- **Freshness logic** lives in ONE place: the `source_status` SQL view
  (migration 0003). fresh ≤ cadence, stale ≤ 3×, else down. API and UI both read it.

## ⚠️ BLOCKED: Supabase — unpaid invoices

The Ardeno Studio Supabase org has **overdue invoices**. Both `create_project`
and restoring the existing paused projects return PaymentRequiredException.
Until that's settled the DB steps could not be executed. Once settled:

1. Create project `lanka-monitor` (region `ap-south-1` is closest to LK).
2. Run the three files in `supabase/migrations/` in order (SQL editor or CLI).
3. Set env vars on Vercel + `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`.
4. Add `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` as GitHub Actions
   secrets (backup cron in `.github/workflows/ingest.yml`).
5. Run `python -m ingest.run` once, confirm the badge flips to fresh.
6. **The stale test**: set `sources.active=false` for a day OR just wait with cron
   disabled; confirm the badge walks fresh → stale → down. This test was specified
   as must-pass and could not be run without the DB. Run it before trusting anything.

## CBSL — what I actually found (Step 6 investigation)

- No JSON API. Rates are behind PHP form endpoints (POST, no auth, no cookies):
  - Buy/sell: `https://www.cbsl.gov.lk/cbsl_custom/exratestt/exrates_resultstt.php`
  - Middle indicative: `https://www.cbsl.gov.lk/cbsl_custom/exrates/exrates_results.php`
- Form fields: `lookupPage=lookup_daily_exchange_rates.php`, `rangeType=dates`,
  `txtStart`/`txtEnd` (YYYY-MM-DD), `chk_cur[]=USD~US Dollar`, and — critically —
  **`submit_button=Submit`. Omit it and you get an HTTP 200 with an empty page.**
  That cost an hour; don't rediscover it.
- There's also a CSV export (`btnCSV`) but it needs PHP session state; the direct
  POST is simpler and stateless.
- Rates appear business days only, published ~09:30 Colombo. The worker fetches a
  7-day window and upserts idempotently, so weekends/holidays are naturally quiet
  and re-runs are safe.
- Site sits behind CloudFront; the honest `LankaMonitorBot/0.1 (+contact URL)` UA
  was not blocked at daily-cadence volumes.

## Deploy notes

- Vercel CLI is authed locally as `cookie-cat21`; the Vercel **MCP token cannot
  create projects** (403) — use the CLI.
- Cron: `vercel.json` schedules GET `/api/ingest` at 04:30 & 10:30 UTC
  (10:00 & 16:00 Colombo — post-publication re-check). Protected by `CRON_SECRET`.
- `/api/ingest` is a **Vercel Python function** (`api/ingest.py`) importing the
  same `ingest/` package. If mixed Next+Python runtimes misbehave on Vercel,
  the GitHub Actions workflow is a fully independent fallback doing the same job —
  both are idempotent, running both is fine.

## Surprises / watch out

- `LANKA_MONITOR_CLAUDE.md` (strategy doc with the §2 schema) **did not exist**
  in the workspace. The six-table schema here is derived from the bootstrap
  CLAUDE.md contract alone — if the real doc surfaces, diff against
  `supabase/migrations/0001_init.sql` before building on it.
- create-next-app@15 hangs on an interactive Turbopack prompt in non-TTY shells;
  the app was hand-scaffolded instead (Tailwind v4 via `@tailwindcss/postcss`).
- RLS is enabled with public **read** policies; writes only via service-role key.
  Keep it that way.
- The `observations` unique key is `(source_id, metric, observed_at)` — pin
  `observed_at` deterministically per datum (CBSL uses 06:30 UTC = noon Colombo)
  or upserts will duplicate.
