-- Phase 2 sources: register new ingest workers and update active flags.
--
-- Sources added:
--   open_meteo     Open-Meteo Colombo weather forecast (free, no auth) → active
--   usgs_quakes    USGS Indian Ocean earthquake watch              → active
--   dengue_hub     denguedatahub weekly CSV (historical lag ~1 wk) → inactive
--   gold_cbsl      CBSL gold price (no verified HTML endpoint yet) → inactive (stub)
--
-- Sources activated from Phase 1 stubs:
--   fuel_prices    Octane API CPC fuel prices                → active
--   cse_asi        CSE All Share Price Index JSON API        → active
--   ceb_power      CEB Care power outage API                 → active
--   news_rss       Ada Derana / EconomyNext / Daily Mirror   → active
--
-- Cricket remains inactive (no reliable free live source implemented).
-- openaq_colombo remains inactive (requires OPENAQ_API_KEY).

insert into sources (id, name, category, url, expected_cadence_minutes, active) values
  -- New sources
  ('open_meteo',
   'Open-Meteo Colombo Weather',
   'weather',
   'https://api.open-meteo.com/v1/forecast',
   60,
   true),

  ('usgs_quakes',
   'USGS Indian Ocean Earthquake Watch',
   'health',
   'https://earthquake.usgs.gov/fdsnws/event/1/query',
   30,
   true),

  ('dengue_hub',
   'Dengue Data Hub (Sri Lanka Weekly)',
   'health',
   'https://github.com/thiyangt/denguedatahub',
   10080,
   false),

  -- gold_cbsl: CBSL publishes gold rates but no verified machine-readable
  -- endpoint was found at implementation time. Register as inactive stub.
  ('gold_cbsl',
   'CBSL Gold Price',
   'money',
   'https://www.cbsl.gov.lk/',
   1440,
   false)

on conflict (id) do update set
  name                     = excluded.name,
  category                 = excluded.category,
  url                      = excluded.url,
  expected_cadence_minutes = excluded.expected_cadence_minutes;

-- Activate Phase 1 stubs that now have working implementations.
update sources set active = true
where id in ('fuel_prices', 'cse_asi', 'ceb_power', 'news_rss');

-- Correct cadence for cse_asi to 60 min (was seeded as 1440 in 0002).
update sources set expected_cadence_minutes = 60
where id = 'cse_asi';

-- Ensure cricket stays inactive.
update sources set active = false
where id = 'cricket_scores';
