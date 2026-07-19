# Lanka Monitor — Phase completion status

Updated 2026-07-19. Phase 6 remains **parked** per the master plan.

## Phase 0 — Foundation ✅

| Item | Status |
|---|---|
| Next.js 15 + Tailwind + Framer Motion | ✅ |
| Postgres schema (PostGIS + pgvector) | ✅ migrations 0001–0007 |
| `Source` ingest abstraction + health | ✅ |
| `/api/v1/health` + `/health` UI | ✅ |
| Dashboard shell, freshness badges | ✅ |

**Gate:** dummy→CBSL FX flows end-to-end when Supabase invoices are settled.

## Phase 1 — Money ✅

| Item | Status |
|---|---|
| CBSL FX ingest + card + `/api/v1/fx` | ✅ live |
| CSE ASPI ingest + card + `/api/v1/cse` | ✅ verified `POST /api/aspiData` |
| Fuel via Octane API + card + `/api/v1/fuel` | ✅ live CPC prices |
| Gold | ⏸ stub `gold_cbsl` — no verified machine endpoint |
| Sparklines / money cluster | ✅ |

## Phase 2 — Safety & Utility ✅

| Item | Status |
|---|---|
| Open-Meteo weather ingest + card | ✅ (+ server fallback) |
| CEB power outage ingest + Tracker card | ✅ idle-cheap |
| USGS Indian Ocean watch | ✅ ingest + SeismicWatchCard |
| MapLibre SituationMap + layer toggles | ✅ |
| Cricket card | ✅ UI; feed needs `CRICKET_API_KEY` |
| DMC/NBRO warnings | ⏸ no verified free JSON yet — AlertBanner wired for seismic |

## Phase 3 — The Brief ✅

| Item | Status |
|---|---|
| RSS ingest (Ada Derana, EconomyNext, Newswire) | ✅ |
| Jaccard clustering (`ingest/cluster.py`) | ✅ |
| Desk brief + Claude path + cost guard | ✅ `brief_gen` |
| Trilingual BriefCard + language switcher | ✅ |
| `/api/v1/brief` | ✅ |

**Quality gate:** desk-v1 ships without Anthropic; Claude path when `ANTHROPIC_API_KEY` set. Bad briefs must not ship — prefer previous brief.

## Phase 4 — Launch ✅ (instrumentation)

| Item | Status |
|---|---|
| Public API docs `/docs` | ✅ |
| Rate limiting middleware | ✅ best-effort per instance |
| OG image `/api/og` | ✅ |
| `llms.txt` | ✅ |
| Analytics D1/D7 beacon | ✅ localStorage stub |
| Telegram send API | ✅ when tokens set |
| Soft-launch notes | See README |

**Do not chase Hacker News.** Chase three consecutive mornings.

## Phase 5 — Depth ✅ (scaffolds + dengue)

| Item | Status |
|---|---|
| Dengue hub CSV ingest + card | ✅ activate via 0007 |
| Coconut Index page | ✅ demo until HARTI PDF parse |
| SLCESI cost-of-living card | ✅ demo/incomplete until live inputs |
| AIS / port density | ✅ map layer (demo vessels) |
| Macro panel | ✅ demo monthly |
| Reservoir / hydro | ✅ demo until Mahaweli feed |
| Colombo AQI | ✅ ingest ready; needs `OPENAQ_API_KEY` |
| Poya + holidays | ✅ static 2026 calendar |

## Phase 6 — Satellite ⏸ PARKED

See `docs/PHASE6_SATELLITE.md`. Do not start before Phase 5 retention is proven.
Cheap intermediate when funded: reservoir surface area only.

## Remaining ops (not code)

1. Settle Supabase invoices → run migrations → set env on Vercel
2. `python -m ingest.run` once → confirm `/health` greens
3. Set `OPENAQ_API_KEY`, optional `ANTHROPIC_API_KEY`, `CRICKET_API_KEY`, Telegram tokens
4. Soft launch to LK Discords / r/srilanka / LinkedIn
