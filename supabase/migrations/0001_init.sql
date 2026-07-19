-- Lanka Monitor — initial schema
-- Six tables: sources, observations, events, articles, briefs, source_health.
-- The strategy doc (LANKA_MONITOR_CLAUDE.md §2) was missing from the workspace
-- at build time; this schema is derived from the bootstrap CLAUDE.md contract:
-- ingest workers upsert observations keyed by (source_id, metric, observed_at),
-- every run reports to source_health, freshness = last_success vs expected_cadence_minutes.

create extension if not exists postgis;
create extension if not exists vector;

-- Registry of every data source we ingest. id is a stable slug (e.g. 'cbsl_fx').
create table if not exists sources (
  id text primary key,
  name text not null,
  category text not null,               -- money | weather | power | health | news | cricket
  url text not null,
  expected_cadence_minutes integer not null,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

-- Point-in-time numeric readings (fx rates, fuel prices, reservoir levels...).
create table if not exists observations (
  id bigint generated always as identity primary key,
  source_id text not null references sources(id),
  metric text not null,                 -- e.g. 'usd_lkr_buy', 'usd_lkr_sell'
  value numeric not null,
  unit text,
  observed_at timestamptz not null,     -- when the value was true in the world
  geom geometry(Point, 4326),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source_id, metric, observed_at)
);
create index if not exists observations_source_metric_time_idx
  on observations (source_id, metric, observed_at desc);

-- Discrete happenings with a time window and optional location (power cuts, warnings).
create table if not exists events (
  id bigint generated always as identity primary key,
  source_id text not null references sources(id),
  category text not null,
  title text not null,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  geom geometry(Geometry, 4326),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists events_source_time_idx on events (source_id, starts_at desc);

-- News articles; embedding sized for text-embedding-3-small style vectors.
create table if not exists articles (
  id bigint generated always as identity primary key,
  source_id text not null references sources(id),
  url text not null unique,
  title text not null,
  summary text,
  published_at timestamptz,
  embedding vector(1536),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists articles_published_idx on articles (published_at desc);

-- AI-generated daily briefs.
create table if not exists briefs (
  id bigint generated always as identity primary key,
  brief_date date not null unique,
  content text not null,
  model text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- One row per ingest run, success or failure — the freshness monitor reads this.
create table if not exists source_health (
  id bigint generated always as identity primary key,
  source_id text not null references sources(id),
  run_at timestamptz not null default now(),
  ok boolean not null,
  latency_ms integer,
  observations_count integer not null default 0,
  error text,
  consecutive_failures integer not null default 0
);
create index if not exists source_health_source_time_idx
  on source_health (source_id, run_at desc);

-- Read access for the dashboard via the anon key; writes go through the
-- service-role key (Python ingest), which bypasses RLS.
alter table sources enable row level security;
alter table observations enable row level security;
alter table events enable row level security;
alter table articles enable row level security;
alter table briefs enable row level security;
alter table source_health enable row level security;

create policy "public read sources" on sources for select using (true);
create policy "public read observations" on observations for select using (true);
create policy "public read events" on events for select using (true);
create policy "public read articles" on articles for select using (true);
create policy "public read briefs" on briefs for select using (true);
create policy "public read source_health" on source_health for select using (true);
