-- OpenAQ Colombo air quality (PM2.5 → US EPA AQI). Inactive until OPENAQ_API_KEY is set.
insert into sources (id, name, category, url, expected_cadence_minutes, active) values
  ('openaq_colombo', 'OpenAQ Colombo PM2.5', 'health', 'https://openaq.org/', 360, false)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  url = excluded.url,
  expected_cadence_minutes = excluded.expected_cadence_minutes;
