# Lanka Monitor

Real-time situational awareness dashboard for Sri Lanka — money, weather, power, health, news, cricket.

One surface where the rupee, the fuel price, the power cut and the news pulse explain each
other. Built for the morning check on a phone.

**Trust is the product.** Every card carries its own timestamp and freshness badge. When a
scraper breaks, the card visibly goes stale — stale data is surfaced, never silently served.

Phase status: see [`docs/PHASES.md`](docs/PHASES.md). UI research: [`docs/UI_COMPONENTS.md`](docs/UI_COMPONENTS.md).

## Stack

- **Frontend**: Next.js 15 (App Router) · TypeScript · Tailwind CSS · Framer Motion · MapLibre
- **Database**: Postgres (PostGIS + pgvector) via Supabase in prod, or local PostgREST
- **Ingest**: Python workers in [`/ingest`](ingest/) — one subclass per source
- **Hosting**: Vercel Cron + GitHub Actions backup

## Local setup

Supabase cloud can wait — use a local DB until invoices are settled.

```bash
npm install
pip install -r ingest/requirements.txt

# Preferred: Docker (Postgres + PostgREST)
docker compose up -d
./scripts/local-db-init.sh
cp .env.local.example .env.local

# Or host Postgres + PostgREST binary (no Docker daemon):
#   create DB lanka_monitor, apply scripts/local-db-bootstrap.sql
#   LOCAL_DB_PORT=5432 LOCAL_DB_PASSWORD= ./scripts/local-db-init.sh
#   ./scripts/start-local-postgrest.sh   # listens on :54321
#   cp .env.local.example .env.local

npm run dev                  # http://localhost:3000
python -m ingest.run         # every active source once → /health goes green
```

`POSTGREST_URL` in `.env.local` points the Next app and ingest workers at PostgREST
root (no `/rest/v1` prefix). Swap to real Supabase URL + keys when cloud is ready —
same migrations, same schema.

## Public API

| Route | Data |
|---|---|
| `GET /api/v1/health` | Source freshness |
| `GET /api/v1/fx` | USD/LKR + series |
| `GET /api/v1/cse` | ASPI |
| `GET /api/v1/fuel` | CPC pump prices |
| `GET /api/v1/weather` | Colombo conditions |
| `GET /api/v1/power` | Active outage count |
| `GET /api/v1/news` | Recent headlines |
| `GET /api/v1/brief` | Daily brief (EN/SI/TA) |
| `GET /api/v1/dengue` | Weekly cases |
| `GET /api/v1/aqi` | Colombo AQI |
| `GET /api/v1/cricket` | Scores (needs key) |
| `GET /api/og` | Dynamic OG image |

Human docs: [`/docs`](/docs). Machine: [`/llms.txt`](/llms.txt).

## Ingest sources

| Source | Status |
|---|---|
| CBSL FX | live |
| CSE ASPI | live |
| Octane / CEYPETCO fuel | live |
| Open-Meteo weather | live |
| CEB Care outages | live |
| USGS quakes | live |
| News RSS | live |
| Desk/Claude brief | live (desk without key) |
| Dengue Data Hub | ready (activate 0007) |
| OpenAQ Colombo | needs `OPENAQ_API_KEY` |
| Cricket | needs `CRICKET_API_KEY` |
| Gold / HARTI PDF / DMC | stubbed — verify before scrape |

Scrapers identify as `LankaMonitorBot` with a contact URL, run at conservative cadences,
and never let a page load hit a government site directly (except Open-Meteo free API as
cached fallback when the DB is empty).

## Soft launch

Chase **D7 retention**, not Hacker News. Soft channels: LK Discord, r/srilanka, LinkedIn.

## Licence

MIT — see [LICENSE](LICENSE).
