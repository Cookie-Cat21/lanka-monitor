# AGENTS.md — Lanka Monitor (Cursor)

You are picking up a repo bootstrapped by Claude Code. Read `HANDOFF.md` first, then this file.
Strategy context is in the master plan / `docs/UI_COMPONENTS.md` for UI research.

## What already exists

Next.js 15 + Tailwind + Framer Motion, Supabase Postgres (PostGIS + pgvector), Python ingest
workers under `/ingest`, a `Source` base class, a freshness monitor at `/api/v1/health`, and one
working source (CBSL FX) proving the pipeline end to end.

UI research shortlist and the 50-loop improvement log live in `docs/UI_COMPONENTS.md`.

**Your job is to fill in layers, not to re-architect.** If the `Source` abstraction genuinely
doesn't fit a new source, extend it — don't fork it.

## Rules that don't bend

1. **One layer = one `Source` subclass = one card = one API route.** Keep them independent.
2. **A failing source never breaks the page.** Catch, record in `source_health`, move on.
3. **Every card shows its own freshness badge.** Stale data is surfaced, never silently served.
4. **Server-side cache everything.** A client page load must never hit a government website.
5. **Conservative rate limits, honest User-Agent with contact URL.**
6. **No new layer until existing ones are green for 30 days.** Breadth is the trap.
7. **Flat MapLibre.** No 3D globe. Never.
8. **MIT licence — never vendor AGPL code** (WorldMonitor is AGPL-3.0).
9. **UI libraries:** adapt patterns (Tremor Raw, HyperUI, shadcn primitives). Skip DaisyUI themes,
   Magic beams, Aceternity carousels, Cult shader heroes, Shadcnblocks Pro.

## Source verification legend

- ✅ Confirmed to exist
- ⚠️ Probable — **verify before building.** Report what you actually find.
- 🔨 We already own it

## Phase focus

See `docs/PHASES.md` for the full checklist. Phases 0–5 are implemented in code;
Phase 6 satellite is parked.

Ops still required: settle Supabase, run migrations 0001–0007, set env keys,
green the freshness badges with a real ingest run.
