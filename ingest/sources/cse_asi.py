"""Colombo Stock Exchange — All Share Price Index (ASPI) and S&P SL20.

The CSE website exposes two JSON endpoints used by its own front-end:
  POST /api/aspiData  → {"value": <float>, "timestamp": <ms epoch>}
  POST /api/marketIndices → list of index objects (ASPI, S&P SL20, etc.)

aspiData is treated as the primary/required source.  marketIndices is a
best-effort supplement: if the response contains a recognisable S&P SL20
entry we also record cse_sl20, and we prefer its ASPI value if present.

The exchange is open Mon–Fri 09:30–14:30 Colombo time (UTC+5:30), so
live ticks are only available during a ~300 minute window.  We register
expected_cadence_minutes=60 to keep the source_status view happy outside
trading hours, but callers may reduce their poll interval to 5 minutes
while active.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from ..base import Observation, Source

logger = logging.getLogger("ingest.cse_asi")

CSE_ASPI_URL = "https://www.cse.lk/api/aspiData"
CSE_INDICES_URL = "https://www.cse.lk/api/marketIndices"

# Keys that identify the All Share index inside marketIndices responses.
_ASPI_NAMES = {"all share", "all share price index", "aspi"}
# Keys that identify S&P SL20.
_SL20_NAMES = {"s&p sl20", "sp sl20", "sl20", "s&p sri lanka 20"}


def _ms_to_iso(ts: int | float) -> str:
    """Convert a millisecond epoch timestamp to an ISO 8601 UTC string."""
    return datetime.fromtimestamp(ts / 1000.0, tz=timezone.utc).isoformat()


class CseAsi(Source):
    id = "cse_asi"
    expected_cadence_minutes = 60

    def fetch(self) -> dict[str, Any]:
        """Return {'aspi': <aspiData response>, 'indices': <marketIndices or None>}."""
        aspi_res = self.http_post(CSE_ASPI_URL, json={})
        aspi_data = aspi_res.json()

        indices_data: Any = None
        try:
            idx_res = self.http_post(CSE_INDICES_URL, json={})
            indices_data = idx_res.json()
        except Exception:
            logger.debug("marketIndices fetch failed — proceeding with aspiData only")

        return {"aspi": aspi_data, "indices": indices_data}

    def normalise(self, raw: dict[str, Any]) -> list[Observation]:
        observations: list[Observation] = []

        # --- Primary: aspiData ---
        aspi_data = raw.get("aspi") or {}
        aspi_val = aspi_data.get("value")
        aspi_ts = aspi_data.get("timestamp")
        if aspi_val is None:
            raise ValueError(f"aspiData response missing 'value': {aspi_data!r}")
        if aspi_ts is None:
            raise ValueError(f"aspiData response missing 'timestamp': {aspi_data!r}")

        aspi_observed_at = _ms_to_iso(int(aspi_ts))
        observations.append(
            Observation("cse_aspi", float(aspi_val), aspi_observed_at)
        )

        # --- Supplement: marketIndices ---
        indices = raw.get("indices")
        if not indices:
            return observations

        # marketIndices may be a list at top-level or nested; normalise to a
        # flat list of candidate objects.
        candidates: list[Any] = []
        if isinstance(indices, list):
            candidates = indices
        elif isinstance(indices, dict):
            for v in indices.values():
                if isinstance(v, list):
                    candidates.extend(v)
                elif isinstance(v, dict):
                    candidates.append(v)

        # Walk candidates; extract by name matching.
        found_sl20 = False
        for item in candidates:
            if not isinstance(item, dict):
                continue
            name_raw = str(item.get("name") or item.get("indexName") or "").strip().lower()
            val = item.get("value") or item.get("indexValue") or item.get("close")
            ts = item.get("timestamp") or item.get("lastUpdated")

            if val is None:
                continue

            try:
                val = float(val)
            except (TypeError, ValueError):
                continue

            if ts is not None:
                try:
                    obs_at = _ms_to_iso(int(ts))
                except (TypeError, ValueError):
                    obs_at = aspi_observed_at
            else:
                obs_at = aspi_observed_at

            if name_raw in _SL20_NAMES and not found_sl20:
                observations.append(Observation("cse_sl20", val, obs_at))
                found_sl20 = True

        return observations
