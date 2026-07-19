#!/usr/bin/env bash
# Start PostgREST against host Postgres (when Docker daemon isn't available).
# Prerequisites: migrations applied (see scripts/local-db-init.sh with LOCAL_DB_PORT=5432).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONF="${ROOT}/scripts/postgrest.conf"
PORT="${POSTGREST_PORT:-54321}"

if curl -sf "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then
  echo "PostgREST already responding on :${PORT}"
  exit 0
fi

if ! command -v postgrest >/dev/null 2>&1; then
  echo "postgrest not found. Install from https://github.com/PostgREST/postgrest/releases" >&2
  exit 1
fi

exec postgrest "$CONF"
