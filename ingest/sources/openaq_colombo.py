"""Colombo PM2.5 from OpenAQ v3.

Resolves the nearest PM2.5 sensor to central Colombo via the locations API,
then stores the latest reading plus a US-EPA AQI derived from PM2.5. Requires
OPENAQ_API_KEY (free at https://explore.openaq.org/register).
"""

from __future__ import annotations

import math
import os
from typing import Any

from ..base import Observation, Source

OPENAQ_BASE = "https://api.openaq.org/v3"
COLOMBO_LAT = 6.9271
COLOMBO_LON = 79.8612
# Western Province haze belt — bbox minLon,minLat,maxLon,maxLat
COLOMBO_BBOX = "79.70,6.70,80.05,7.05"
PM25_PARAMETER_ID = 2


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlon / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _pm25_to_aqi(pm25: float) -> int:
    breaks: list[tuple[float, float, int, int]] = [
        (0.0, 12.0, 0, 50),
        (12.1, 35.4, 51, 100),
        (35.5, 55.4, 101, 150),
        (55.5, 150.4, 151, 200),
        (150.5, 250.4, 201, 300),
        (250.5, 500.4, 301, 500),
    ]
    for c_low, c_high, i_low, i_high in breaks:
        if pm25 <= c_high:
            return round(((i_high - i_low) / (c_high - c_low)) * (pm25 - c_low) + i_low)
    return 500


class OpenaqColombo(Source):
    id = "openaq_colombo"
    expected_cadence_minutes = 360

    def _api_key(self) -> str:
        key = os.environ.get("OPENAQ_API_KEY", "").strip()
        if not key:
            raise ValueError("OPENAQ_API_KEY is not set")
        return key

    def _openaq_get(self, path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        res = self.http_get(
            f"{OPENAQ_BASE}{path}",
            params=params or {},
            headers={"X-API-Key": self._api_key()},
        )
        return res.json()

    def fetch(self) -> dict[str, Any]:
        latest = self._openaq_get(
            f"/parameters/{PM25_PARAMETER_ID}/latest",
            {"bbox": COLOMBO_BBOX, "limit": 100},
        )
        results = latest.get("results") or []
        if not results:
            raise ValueError("no PM2.5 readings in Colombo bbox from OpenAQ")

        best: dict[str, Any] | None = None
        best_dist = float("inf")
        for row in results:
            coords = row.get("coordinates") or {}
            lat, lon = coords.get("latitude"), coords.get("longitude")
            if lat is None or lon is None:
                continue
            dist = _haversine_km(COLOMBO_LAT, COLOMBO_LON, float(lat), float(lon))
            if dist < best_dist:
                best_dist = dist
                best = row

        if best is None:
            raise ValueError("PM2.5 readings lacked coordinates")

        location_id = best.get("locationsId")
        location_name = None
        if location_id is not None:
            loc = self._openaq_get(f"/locations/{location_id}")
            location_name = (loc.get("results") or {}).get("name")

        return {"reading": best, "location_name": location_name, "distance_km": best_dist}

    def normalise(self, raw: dict[str, Any]) -> list[Observation]:
        reading = raw["reading"]
        pm25 = float(reading["value"])
        observed_at = reading["datetime"]["utc"]
        if not observed_at.endswith("Z"):
            observed_at = f"{observed_at}Z"
        observed_at = observed_at.replace("Z", "+00:00")

        aqi = _pm25_to_aqi(pm25)
        meta = {
            "location": raw.get("location_name"),
            "distance_km": round(float(raw.get("distance_km", 0)), 1),
            "locations_id": reading.get("locationsId"),
            "sensors_id": reading.get("sensorsId"),
        }

        return [
            Observation("pm25_ugm3", pm25, observed_at, unit="µg/m³", meta=meta),
            Observation("aqi", float(aqi), observed_at, unit="US EPA", meta=meta),
        ]
