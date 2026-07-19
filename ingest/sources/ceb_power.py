"""CEB Care power outage monitor.

Queries the CEB Care REST API used by the mobile app to count active
scheduled power interruptions in the Western Province / Colombo area.

Endpoint hierarchy:
  GET /Incognito/GetProvinces          → list of provinces
  GET /Incognito/GetDistricts          → list of districts (with provinceId)
  GET /Incognito/GetOutageLocationsInArea?areaId=<id>&outageType=1
                                       → active outage location points

Some responses contain double-encoded JSON strings (a string field whose
value is itself a JSON array/object).  _decode() handles that transparently.

Conservative limits:
  • At most MAX_AREA_REQUESTS areas queried per run.
  • 0.5 s sleep between area requests.
  • Hard stop on HTTP 429 (rate-limited).

Metric emitted:
  power_active_outages  — total outage point count across sampled areas
                          (meta contains per-area breakdown and sample titles)
"""

from __future__ import annotations

import json
import logging
import time
from typing import Any

from ..base import Observation, Source

logger = logging.getLogger("ingest.ceb_power")

BASE_URL = "https://cebcare.ceb.lk/Incognito"
MAX_AREA_REQUESTS = 8
AREA_SLEEP_S = 0.5

# Province / district name fragments we prioritise.
_PRIORITY_NAMES = {"western", "colombo"}


def _decode(value: Any) -> Any:
    """If value is a string that looks like JSON, parse it; else return as-is."""
    if not isinstance(value, str):
        return value
    stripped = value.strip()
    if stripped.startswith(("[", "{")):
        try:
            return json.loads(stripped)
        except json.JSONDecodeError:
            pass
    return value


def _extract_list(response_json: Any) -> list[Any]:
    """Normalise various response shapes to a flat list."""
    if isinstance(response_json, list):
        return response_json
    if isinstance(response_json, dict):
        for key in ("data", "Data", "result", "Result", "results", "Results"):
            val = response_json.get(key)
            if val is not None:
                decoded = _decode(val)
                if isinstance(decoded, list):
                    return decoded
        # Try every value
        for val in response_json.values():
            decoded = _decode(val)
            if isinstance(decoded, list):
                return decoded
    return []


class CebPower(Source):
    id = "ceb_power"
    expected_cadence_minutes = 180

    def _get(self, path: str, params: dict[str, Any] | None = None) -> Any:
        res = self.http_get(f"{BASE_URL}{path}", params=params or {})
        return res.json()

    def fetch(self) -> dict[str, Any]:
        """Return provinces, sampled districts, and per-area outage counts."""
        provinces_raw = self._get("/GetProvinces")
        provinces = _extract_list(provinces_raw)

        # Find Western Province first; fall back to first province.
        def _priority(p: dict[str, Any]) -> int:
            name = str(p.get("name") or p.get("provinceName") or "").lower()
            return 0 if any(k in name for k in _PRIORITY_NAMES) else 1

        provinces_sorted = sorted(
            [p for p in provinces if isinstance(p, dict)],
            key=_priority,
        )

        # Try to get districts (they act as queryable areas in the CEB API).
        # Try several possible endpoint names.
        districts: list[dict[str, Any]] = []
        for endpoint in ("/GetDistricts", "/GetAreas", "/GetAllDistricts"):
            try:
                raw = self._get(endpoint)
                candidates = _extract_list(raw)
                if candidates:
                    districts = [d for d in candidates if isinstance(d, dict)]
                    break
            except Exception:
                continue

        # If district list is empty, fall back to treating provinces as areas.
        if not districts:
            districts = provinces_sorted

        # Sort districts: Colombo/Western first.
        def _dist_priority(d: dict[str, Any]) -> int:
            name = str(
                d.get("name") or d.get("districtName") or d.get("areaName") or ""
            ).lower()
            return 0 if any(k in name for k in _PRIORITY_NAMES) else 1

        districts_sorted = sorted(districts, key=_dist_priority)

        outage_data: list[dict[str, Any]] = []
        areas_queried = 0

        for area in districts_sorted:
            if areas_queried >= MAX_AREA_REQUESTS:
                break
            area_id = (
                area.get("id")
                or area.get("Id")
                or area.get("areaId")
                or area.get("districtId")
                or area.get("provinceId")
            )
            if area_id is None:
                continue

            area_name = str(
                area.get("name")
                or area.get("districtName")
                or area.get("areaName")
                or area_id
            )

            try:
                if areas_queried > 0:
                    time.sleep(AREA_SLEEP_S)
                raw = self._get(
                    "/GetOutageLocationsInArea",
                    {"areaId": area_id, "outageType": 1},
                )
                locations = _extract_list(raw)
                outage_data.append(
                    {
                        "area_id": area_id,
                        "area_name": area_name,
                        "locations": locations,
                    }
                )
                areas_queried += 1
            except Exception as exc:
                status = getattr(getattr(exc, "response", None), "status_code", None)
                if status == 429:
                    logger.warning("CEB API rate-limited after %d areas", areas_queried)
                    break
                logger.debug("area %s outage fetch failed: %s", area_name, exc)

        return {"outage_data": outage_data, "areas_queried": areas_queried}

    def normalise(self, raw: dict[str, Any]) -> list[Observation]:
        from datetime import datetime, timezone

        outage_data: list[dict[str, Any]] = raw.get("outage_data") or []

        total = 0
        per_area: list[dict[str, Any]] = []
        sample_titles: list[str] = []

        for area_info in outage_data:
            locations = area_info.get("locations") or []
            count = len(locations)
            total += count
            per_area.append(
                {"area": area_info["area_name"], "count": count}
            )
            for loc in locations[:3]:
                if isinstance(loc, dict):
                    title = (
                        loc.get("title")
                        or loc.get("Title")
                        or loc.get("outageTitle")
                        or loc.get("description")
                    )
                    if title:
                        sample_titles.append(str(title))

        observed_at = datetime.now(timezone.utc).isoformat()
        meta: dict[str, Any] = {
            "areas_queried": raw.get("areas_queried", 0),
            "per_area": per_area,
        }
        if sample_titles:
            meta["sample_titles"] = sample_titles[:10]

        return [
            Observation(
                "power_active_outages",
                float(total),
                observed_at,
                meta=meta,
            )
        ]
