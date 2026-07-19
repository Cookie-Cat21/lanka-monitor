# Lanka Monitor — UI Component Research & Improvement Log

Synthesized from **46 parallel research agents** across the Ardeno UI Elements bookmark set
and domain-specific dashboard patterns. Doc version 1.0 · 2026-07-19.

## Verdict (libraries)

| Library | Licence | Decision | Why |
|---|---|---|---|
| **Tremor Raw** (copy-paste) | Apache-2.0 / MIT | **Adapt patterns** | Tracker, CategoryBar, KPI composition. Keep our SVG sparkline; don't pull `@tremor/react` (TW v3). |
| **HyperUI** | MIT | **Copy HTML patterns** | Stats cards, badges, empty states, slim footer. Restyle to our tokens. |
| **DaisyUI** | MIT | **Skip** | Generic admin silhouette fights bespoke trust UI. |
| **React Bits** | MIT + Commons Clause | **Use 0–1** | CountUp only. Beams/glitch = wow-traps. |
| **21st.dev** | MIT (per component) | **Cherry-pick** | Alert, KPI Card, MapLibre markers, Timeline. Skip Heroes / Pulse Beams / 3D. |
| **shadcn/ui** | MIT | **Install later** | Tabs/Dialog/Skeleton when map layers land. Keep FreshnessBadge custom. |
| **Shadcnblocks Pro** | Proprietary | **Skip** | Bans public-repo redistribution. |
| **Cult UI Hero Color Panels** | MIT (free) | **Skip on dashboard** | Marketing shaders. |
| **Watermelon UI** | MIT | **Adapt primitives** | Card/badge/alert/chart only — not SaaS shells. |
| **Magic UI Animated Beam** | MIT | **Skip** | Implies live pipes; we are batch scrapers. Credibility-negative. |
| **Aceternity Apple Cards** | Aceternity (not MIT) | **Skip** | Marketing aesthetics + licence friction on MIT repo. |

**Hard rule unchanged:** never vendor AGPL (WorldMonitor).

## Adopt shortlist (what we build)

1. **CardShell** — shared panel chrome (title + FreshnessBadge + footer slot)
2. **FreshnessBadge** (enhanced) — a11y pill, `aria-label`, pulse only on `down`
3. **RelativeTime** — SSR-safe client relative clock
4. **CountUp** — one intentional metric roll-in on FX
5. **Lucide icons** — Banknote, CloudRain, Zap, Fuel, Activity, Newspaper, Trophy, Radio
6. **HolidayGlance** — micro strip (already shipped)
7. **SeismicWatch** — idle strip / expand on alert (already shipped)
8. **Source health page** `/health` — trust table over raw JSON
9. **API docs** `/docs` — curl examples (already scaffolded)
10. **Brief card shell** (Phase 3) — full-width, EN|සි|த, citations, fail-to-previous
11. **MapLibre LayerFab + bottom sheet** (Phase 2) — no deck.gl / no globe
12. **Weather / Power / Cricket / News** card layouts (specs below; placeholders until ingest)

## Domain card specs (from agents)

| Card | Layout | Key rule |
|---|---|---|
| FX | Sell hero + buy + delta + sparkline | Red = rupee weaker (consumer lens) |
| CSE | ASPI \| SL20 + market phase | Green = index up |
| Fuel | 2×2 grades + per-cell spark | On-change cadence labeled |
| Weather | Temp + rain/wind; warnings below | Severity chip, not full-card red |
| Power | Idle: “No outages”; crisis: next window | Idle-cheap |
| Cricket | Teams, scores, overs, one status line | No betting aesthetics |
| News + Brief | Brief strip above cluster list | No marquee; trilingual |
| Dengue | National KPI + tiny SVG choropleth | Don't dominate grid |
| SLCESI | Index + weights + methodology expand | No traffic-light dial |
| AQI | Number + category label (Okabe–Ito) | Never colour alone |
| Hydro | Spark bars + 35% stress line | Ties power + drought |
| Port AIS | Flat MapLibre heatmap + count badge | Demo until ingest |

## Typography & atmosphere

- **Display/body:** IBM Plex Sans (Latin numerals) + Noto Sans Sinhala / Noto Sans Tamil for Phase 3
- **Background:** cool slate radial layers + near-invisible noise — not flat, not purple glow
- **Motion budget (3):** mount fade, status colour shift, metric crossfade. Respect `prefers-reduced-motion`.

## Explicit skips

DaisyUI themes · Magic beams · Aceternity carousels · Cult shader heroes · Shadcnblocks Pro ·
floating map badges · Infinite marquees · Number tickers on daily FX beyond one CountUp ·
3D globe / deck.gl

---

## 50 improvement loops

Each loop: evaluate → apply / defer / skip. Applied in this PR marked ✅.

| # | Improvement | Result |
|---|---|---|
| 1 | Extract CardShell | ✅ |
| 2 | SSR-safe RelativeTime | ✅ |
| 3 | FreshnessBadge a11y pill + aria-label | ✅ |
| 4 | Pulse only on `down` | ✅ |
| 5 | Bump timestamp contrast (`text-dim`) | ✅ |
| 6 | Atmosphere gradient + grain | ✅ |
| 7 | Expressive fonts (IBM Plex + Noto SI/TA) | ✅ |
| 8 | Lucide layer icons on placeholders | ✅ |
| 9 | CountUp on FX sell rate | ✅ |
| 10 | Sticky mobile header | ✅ |
| 11 | Footer nav landmark + MIT link | ✅ |
| 12 | `/health` source status page | ✅ |
| 13 | `/docs` API page polish | ✅ (scaffold) |
| 14 | `llms.txt` for crawlers | ✅ |
| 15 | AGENTS.md for Cursor | ✅ |
| 16 | Poya pill: drop indigo (avoid purple bias) | ✅ |
| 17 | Card min-heights for layout stability | ✅ |
| 18 | `prefers-reduced-motion` gate on Framer | ✅ |
| 19 | Holiday glance strip | ✅ (prior) |
| 20 | Seismic idle/active dual UI | ✅ (prior) |
| 21 | CSE market-hours phase label | ✅ (prior) |
| 22 | AQI colour + text label | ✅ (prior) |
| 23 | SLCESI methodology expand | ✅ (prior) |
| 24 | Hydro spark bars + stress threshold | ✅ (prior) |
| 25 | Port map demo labelled as demo | ✅ |
| 26 | Phase-5 cards below S-tier money | ✅ |
| 27 | Demo/incomplete data → stale badge | ✅ (prior pattern) |
| 28 | Focus-visible rings on footer links | ✅ |
| 29 | `lang` on html for future brief | ✅ |
| 30 | Tabular nums utility class retained | ✅ |
| 31 | Tremor Tracker for power | ✅ PowerCard + Tracker |
| 32 | MapLibre layer FAB / bottom sheet | ✅ SituationMap |
| 33 | Brief card EN/SI/TA | ✅ BriefCard + brief_gen |
| 34 | News ClusterList | ✅ NewsPulseCard + Jaccard |
| 35 | Life-safety AlertBanner | ✅ seismic S4+ |
| 36 | Cricket compact scorecard | ✅ needs API key |
| 37 | Fuel 2×2 Octane card | ✅ |
| 38 | Dengue district bars | ✅ DengueCard |
| 39 | Coconut Index share page | ✅ (demo until HARTI PDF) |
| 40 | OG image generator | ✅ /api/og |
| 41 | Telegram CTA + send API | ✅ |
| 42 | Language switcher | ✅ |
| 43 | Skeleton while fetching | ⏸ until Supabase live |
| 44 | DaisyUI adoption | ❌ skip |
| 45 | Magic UI Animated Beam | ❌ skip |
| 46 | Aceternity Apple Cards | ❌ skip |
| 47 | Cult Hero Color Panels | ❌ skip |
| 48 | Shadcnblocks Pro | ❌ skip |
| 49 | 3D globe / deck.gl | ❌ skip |
| 50 | Breadth gate reminder in AGENTS.md | ✅ |
