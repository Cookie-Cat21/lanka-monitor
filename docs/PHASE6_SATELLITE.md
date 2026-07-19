# Phase 6 — Satellite / Remote-Sensing Layer

> **Status: PARKED** — Do not build until Phases 1–5 retention metrics confirm demand.

## Concept

Add a satellite-imagery overlay to the SituationMap, surfacing:

- **Flood extent** — near-real-time flood mapping from Copernicus EMS or Sentinel-1 SAR
- **Agricultural stress** — NDVI anomaly from MODIS/Sentinel-2 for rice districts
- **Wildfire / burn scars** — FIRMS MODIS/VIIRS active fire and burn-scar GeoJSON
- **Coral bleaching proxy** — SST anomaly from NOAA CoralTemp for coastal districts

## Data sources (all free / open)

| Layer | Source | Format | Cadence |
|---|---|---|---|
| Flood extent | Copernicus EMS / GFM | GeoJSON polygons | Event-driven |
| NDVI anomaly | NASA AppEEARS / MODIS MOD13 | GeoTIFF / COG | 16-day composite |
| Active fires | NASA FIRMS | CSV / GeoJSON | Daily |
| SST anomaly | NOAA CoralTemp | NetCDF / COG | Daily |

## Implementation sketch

1. Add a new map layer type `"satellite"` to `SituationMap.tsx` layer panel.
2. Ingest worker (`ingest/satellite.py`) downloads GeoJSON/GeoTIFF on schedule, converts to
   PMTiles or hosted GeoJSON, stores URL in `source_status` + `observations`.
3. API route `/api/v1/satellite` returns layer manifest (name, url, bbox, updated_at).
4. Frontend fetches manifest and adds layers to MapLibre dynamically.

## Why parked

- Satellite data is large; cold-start latency matters on Vercel Edge.
- PMTiles hosting adds cost; defer until traffic justifies it.
- Flood / fire alerts can be surfaced more cheaply via text alerts (Phase 4 Telegram) first.
- Revisit after Phase 5 DRI (Dengue, Reservoir level, Infrastructure) metrics land.

## Intermediate cheapest path

Before full satellite, add FIRMS active-fire GeoJSON as a toggle layer in SituationMap:

```typescript
// Approximately free, ~3 KB GeoJSON for Sri Lanka bbox
const FIRMS_URL =
  "https://firms.modaps.eosdis.nasa.gov/api/area/csv/WORLD-FIRMS/VIIRS_SNPP_NRT/SriLanka/1/today";
```

This requires a free NASA FIRMS API key (`FIRMS_API_KEY`).
