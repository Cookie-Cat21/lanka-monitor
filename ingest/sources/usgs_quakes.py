"""USGS FDSN earthquake monitor — Indian Ocean / South Asia watch zone.

Queries the USGS Earthquake Hazards Program GeoJSON feed for events:
  • M ≥ 5.5 (large enough to be felt regionally or generate a tsunami watch)
  • Within the Indian Ocean / South Asia bounding box
    (lon 55–100 °E, lat -15 to 30 °N) covering Sri Lanka's hazard region
  • In the past 72 hours

Metric emitted:
  quake_watch_count  — number of qualifying events in the window
                       (meta contains magnitude stats and the largest event)
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from ..base import Observation, Source

USGS_FDSN_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query"

MIN_MAGNITUDE = 5.5
LOOKBACK_HOURS = 72

# Indian Ocean / South Asia bounding box.
MIN_LAT = -15.0
MAX_LAT = 30.0
MIN_LON = 55.0
MAX_LON = 100.0


class UsgsQuakes(Source):
    id = "usgs_quakes"
    expected_cadence_minutes = 30

    def fetch(self) -> dict[str, Any]:
        start_time = (
            datetime.now(timezone.utc) - timedelta(hours=LOOKBACK_HOURS)
        ).strftime("%Y-%m-%dT%H:%M:%S")

        res = self.http_get(
            USGS_FDSN_URL,
            params={
                "format": "geojson",
                "minmagnitude": MIN_MAGNITUDE,
                "minlatitude": MIN_LAT,
                "maxlatitude": MAX_LAT,
                "minlongitude": MIN_LON,
                "maxlongitude": MAX_LON,
                "starttime": start_time,
                "orderby": "magnitude",
            },
        )
        return res.json()

    def normalise(self, raw: dict[str, Any]) -> list[Observation]:
        features = raw.get("features") or []
        count = len(features)
        observed_at = datetime.now(timezone.utc).isoformat()

        meta: dict[str, Any] = {
            "lookback_hours": LOOKBACK_HOURS,
            "min_magnitude": MIN_MAGNITUDE,
            "count": count,
        }

        if features:
            mags = [
                f["properties"]["mag"]
                for f in features
                if isinstance(f.get("properties"), dict)
                and f["properties"].get("mag") is not None
            ]
            if mags:
                meta["max_magnitude"] = max(mags)
                meta["avg_magnitude"] = round(sum(mags) / len(mags), 2)

            largest = features[0]
            props = largest.get("properties") or {}
            meta["largest"] = {
                "place": props.get("place"),
                "mag": props.get("mag"),
                "time": (
                    datetime.fromtimestamp(
                        props["time"] / 1000, tz=timezone.utc
                    ).isoformat()
                    if props.get("time")
                    else None
                ),
                "url": props.get("url"),
            }

        return [
            Observation(
                "quake_watch_count",
                float(count),
                observed_at,
                meta=meta,
            )
        ]
