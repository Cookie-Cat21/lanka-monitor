# AGENTS.md

## Cursor Cloud specific instructions

Lanka Monitor is a real-time Sri Lanka situational-awareness dashboard. Three moving parts:

- **Next.js dashboard** (`app/`, `components/`, `lib/`) — the main app. Read-only; fetches from
  Supabase PostgREST with the anon key. Run with `npm run dev` → http://localhost:3000.
  By design it degrades to an explicit "no data / down" honesty state when the DB is
  unreachable, so it runs even with zero backend.
- **Python ingest workers** (`ingest/`) — scrape live public sources and upsert into Postgres
  with the service-role key. Entry point: `python -m ingest.run`. Only `cbsl_fx`
  (Central Bank USD/LKR rates) is active; it hits the live CBSL site (network required).
- **Local Supabase** (Postgres + PostgREST) — the backend the other two talk to.

Standard commands live in `README.md` (local setup) and `package.json` scripts. Notes below
are the non-obvious bits.

### Running the backend (local Supabase)

The VM snapshot already has Docker, the Supabase CLI, and `python3-venv` installed; the
startup update script only refreshes `node_modules` and the `.venv` Python deps. To bring the
backend up in a fresh session:

1. Start the Docker daemon (it is not auto-started here):
   `sudo dockerd > /tmp/dockerd.log 2>&1 &` — then confirm with `sudo docker info`.
   Docker is configured for docker-in-docker via `fuse-overlayfs` + `iptables-legacy`
   (`/etc/docker/daemon.json` also disables the containerd snapshotter, required for Docker 29).
2. Start Supabase (run with `sudo`, since dockerd runs as root here):
   `sudo supabase start` from the repo root. It applies `supabase/migrations/` automatically.
   Get keys with `sudo supabase status -o json` (`ANON_KEY`, `SERVICE_ROLE_KEY`, `API_URL`).
3. **Grant caveat (must run after every fresh `supabase start` / `db reset`).** In this local
   stack the `public`-schema default privileges only give the API roles `Dxtm` — **not**
   `SELECT`/DML — so anon reads and service-role writes are denied until you grant them. The
   migrations intentionally are not modified for this; apply the standard Supabase grants at
   runtime:
   ```sql
   grant usage on schema public to anon, authenticated, service_role;
   grant select on all tables in schema public to anon, authenticated;
   grant all on all tables in schema public to service_role;
   grant all on all sequences in schema public to service_role;
   ```
   e.g. `sudo docker exec -i supabase_db_workspace psql -U postgres -d postgres <<'SQL' ... SQL`.
   Without this the dashboard shows "down / no data" and `python -m ingest.run` fails with 403.

### Env vars

`.env.local` (gitignored) holds the local Supabase URL + keys for Next.js. The Python worker
reads `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from the environment — export
them (or `set -a; . .env.local; set +a`) before running `python -m ingest.run`. Activate the
virtualenv first: `. .venv/bin/activate`.

### Lint / type-check / build

`npm run lint` (`next lint`) is **not configured** in this repo and prompts interactively — do
not use it in non-interactive shells. For static checks use `npx tsc --noEmit` and
`npm run build` (both pass clean).

### End-to-end sanity check

With Supabase up + grants applied: `python -m ingest.run` (writes ~10 obs), then the USD/LKR
card on http://localhost:3000 shows a green `fresh` badge and real rates, and
`/api/v1/health` reports `cbsl_fx` as `fresh`.
