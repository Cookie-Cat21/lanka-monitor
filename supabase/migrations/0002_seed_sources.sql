-- S-tier sources. Only cbsl_fx is active in Phase 1; the rest are slots for Cursor.
insert into sources (id, name, category, url, expected_cadence_minutes, active) values
  ('cbsl_fx',       'CBSL Indicative Exchange Rates', 'money',   'https://www.cbsl.gov.lk/cbsl_custom/exratestt/exratestt.php', 1440, true),
  ('cse_asi',       'Colombo Stock Exchange ASI',     'money',   'https://www.cse.lk/', 1440, false),
  ('fuel_prices',   'CEYPETCO Fuel Prices',           'money',   'https://ceypetco.gov.lk/marketing-sales/', 10080, false),
  ('dmc_weather',   'Dept. of Meteorology Forecasts', 'weather', 'https://meteo.gov.lk/', 360, false),
  ('ceb_power',     'CEB / PUCSL Power Interruptions','power',   'https://cebcare.ceb.lk/', 360, false),
  ('epid_health',   'Epidemiology Unit Disease Data', 'health',  'https://www.epid.gov.lk/', 10080, false),
  ('news_rss',      'Sri Lanka News RSS Cluster',     'news',    'https://www.adaderana.lk/rss.php', 60, false),
  ('cricket_scores','Cricket Live Scores',            'cricket', 'https://www.espncricinfo.com/', 1440, false)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  url = excluded.url,
  expected_cadence_minutes = excluded.expected_cadence_minutes;
