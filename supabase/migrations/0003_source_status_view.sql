-- Freshness status per source, computed in one place so the API and any
-- future consumer agree on the definition:
--   fresh: last success within expected_cadence_minutes
--   stale: within 3x cadence
--   down:  older than 3x cadence, or never succeeded
create or replace view source_status as
select
  s.id,
  s.name,
  s.category,
  s.expected_cadence_minutes,
  s.active,
  hs.last_success_at,
  hr.last_run_at,
  hr.last_error,
  hr.consecutive_failures,
  case
    when not s.active then 'inactive'
    when hs.last_success_at is null then 'down'
    when now() - hs.last_success_at <= make_interval(mins => s.expected_cadence_minutes) then 'fresh'
    when now() - hs.last_success_at <= make_interval(mins => 3 * s.expected_cadence_minutes) then 'stale'
    else 'down'
  end as status
from sources s
left join lateral (
  select max(run_at) as last_success_at
  from source_health where source_id = s.id and ok
) hs on true
left join lateral (
  select run_at as last_run_at, error as last_error, consecutive_failures
  from source_health where source_id = s.id
  order by run_at desc limit 1
) hr on true;

grant select on source_status to anon, authenticated;
