#!/usr/bin/env bash
# Apply Lanka Monitor migrations to the local PostGIS (docker compose or host).
#
# Docker compose (default):
#   docker compose up -d && ./scripts/local-db-init.sh
# Host Postgres (no Docker):
#   LOCAL_DB_PORT=5432 LOCAL_DB_PASSWORD= ./scripts/local-db-init.sh
#   # or peer auth as postgres: LOCAL_DB_HOST=/var/run/postgresql LOCAL_DB_PORT=5432
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

DB_HOST="${LOCAL_DB_HOST:-127.0.0.1}"
DB_PORT="${LOCAL_DB_PORT:-54322}"
DB_USER="${LOCAL_DB_USER:-postgres}"
DB_NAME="${LOCAL_DB_NAME:-lanka_monitor}"
export PGPASSWORD="${LOCAL_DB_PASSWORD:-lanka_local_dev}"

echo "Waiting for Postgres at ${DB_HOST}:${DB_PORT}…"
for i in $(seq 1 30); do
  if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c 'select 1' >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c 'select 1' >/dev/null

for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "→ $(basename "$f")"
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$f"
done

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<'SQL'
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON source_status TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
SQL

echo "Local DB migrations applied."
echo "Point the app at .env.local (see .env.local.example) and run: python -m ingest.run"
