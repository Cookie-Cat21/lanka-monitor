-- Phase 3: AI brief generation source.
--
-- brief_gen reads recent articles + live observations and writes one row per
-- hour to the briefs table.  It works in two modes:
--   Claude mode  — ANTHROPIC_API_KEY is set; produces trilingual structured JSON.
--   Desk mode    — no key; deterministic assembly from article titles + FX/weather.
--
-- Active by default: desk-v1 works with zero extra credentials.

insert into sources (id, name, category, url, expected_cadence_minutes, active) values
  (
    'brief_gen',
    'AI Daily Brief Generator',
    'news',
    'https://github.com/Cookie-Cat21/lanka-monitor',
    60,
    true
  )
on conflict (id) do update set
  name                     = excluded.name,
  category                 = excluded.category,
  url                      = excluded.url,
  expected_cadence_minutes = excluded.expected_cadence_minutes;
