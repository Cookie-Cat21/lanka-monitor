# Lanka Monitor

Real-time situational awareness dashboard for Sri Lanka — money, weather, power, health, news, cricket.

One surface where the rupee, the fuel price, the power cut and the news pulse explain each
other. Built for the morning check on a phone.

**Trust is the product.** Every card carries its own timestamp and freshness badge. When a
scraper breaks, the card visibly goes stale — stale data is surfaced, never silently served.

Phase status: see [`docs/PHASES.md`](docs/PHASES.md). UI research: [`docs/UI_COMPONENTS.md`](docs/UI_COMPONENTS.md).

## Stack

- **Frontend**: Next.js 15 (App Router) · TypeScript · Tailwind CSS · Framer Motion · MapLibre
- **Database**: Postgres (Supabase) with PostGIS + pgvector
- **Ingest**: Python workers in [`/ingest`](ingest/) — one subclass per source
- **Hosting**: Vercel Cron + GitHub Actions backup

## Local setup

```bash
npm install
cp .env.example .env.local   # fill Supabase URL + keys
npm run dev                  # http://localhost:3000

# Apply supabase/migrations/0001…0007 in order

pip install -r ingest/requirements.txt
python -m ingest.run         # every active source once
```

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
