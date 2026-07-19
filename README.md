# Lanka Monitor

Real-time situational awareness dashboard for Sri Lanka — money, weather, power, health, news.

One surface where the rupee, the fuel price, the power cut and the news pulse explain each
other. Built for the morning check on a phone: is the rupee moving, is it going to rain,
is the power out, what happened overnight.

**Trust is the product.** Every card carries its own timestamp and freshness badge. When a
scraper breaks, the card visibly goes stale — stale data is surfaced, never silently served.

## Stack

- **Frontend**: Next.js 15 (App Router) · TypeScript · Tailwind CSS · Framer Motion
- **Database**: Postgres (Supabase) with PostGIS + pgvector
- **Ingest**: Python workers in [`/ingest`](ingest/) — one subclass per source
- **Maps** (later phases): MapLibre GL JS
- **Hosting**: Vercel, with Vercel Cron driving the ingest worker

## Local setup

```bash
# 1. Frontend
npm install
cp .env.example .env.local   # fill in Supabase URL + keys
npm run dev                  # http://localhost:3000

# 2. Database — apply migrations (Supabase SQL editor or CLI)
#    supabase/migrations/0001_init.sql
#    supabase/migrations/0002_seed_sources.sql

# 3. Ingest worker (Python 3.11+)
pip install -r ingest/requirements.txt
python -m ingest.run         # runs every active source once
```

## API

- `GET /api/v1/health` — freshness status of every source (`fresh` / `stale` / `down` / `inactive`)
- `GET /api/v1/fx` — latest USD/LKR buy/sell observations + 30-day series

## Data sources

We scrape public government and institutional websites. Attribution is part of scraping
ethically — every number on the dashboard credits where it came from:

| Source | Data | Status |
|---|---|---|
| [Central Bank of Sri Lanka](https://www.cbsl.gov.lk/) | Daily indicative USD/LKR buy/sell exchange rates | **live** |
| [Colombo Stock Exchange](https://www.cse.lk/) | All Share Index | planned |
| [CEYPETCO](https://ceypetco.gov.lk/) | Fuel prices | planned |
| [Department of Meteorology](https://meteo.gov.lk/) | Weather forecasts & warnings | planned |
| [Ceylon Electricity Board](https://cebcare.ceb.lk/) | Power interruption schedules | planned |
| [Epidemiology Unit, Ministry of Health](https://www.epid.gov.lk/) | Disease surveillance (dengue etc.) | planned |
| Sri Lankan news RSS feeds ([Ada Derana](https://www.adaderana.lk/) and others) | News pulse | planned |

Our scrapers identify themselves honestly (`LankaMonitorBot` User-Agent with a contact URL),
run at conservative cadences with backoff, and cache server-side — a page load on this
dashboard never triggers a request to a government website.

If you operate one of these sources and have concerns, open an issue.

## Licence

MIT — see [LICENSE](LICENSE).
