"""Sri Lanka fuel prices via the Octane community API.

GET https://octane-api.fly.dev/v1/prices/latest returns an array of price
objects.  We prefer entries with source=="cpc" (Ceylon Petroleum Corporation,
the dominant state supplier) and fall back to the first available entry per
fuel type if CPC is absent.

observed_at is pinned to noon Colombo time (T06:30:00+00:00) on the date
recorded_at carries, so multiple fetches on the same day upsert cleanly.
"""

from __future__ import annotations

from typing import Any

from ..base import Observation, Source

OCTANE_URL = "https://octane-api.fly.dev/v1/prices/latest"

# Map octane fuel_type values → our metric names.
FUEL_METRIC_MAP: dict[str, str] = {
    "petrol_92": "fuel_petrol_92",
    "petrol_95": "fuel_petrol_95",
    "auto_diesel": "fuel_auto_diesel",
    "kerosene": "fuel_kerosene",
    "super_diesel": "fuel_super_diesel",
}

PREFERRED_SOURCE = "cpc"


def _date_to_observed_at(date_str: str) -> str:
    """Pin a date string (YYYY-MM-DD or ISO prefix) to noon Colombo time."""
    # Take only the date portion in case recorded_at includes a time.
    date_part = str(date_str).split("T")[0].split(" ")[0]
    return f"{date_part}T06:30:00+00:00"


class FuelOctane(Source):
    id = "fuel_prices"
    expected_cadence_minutes = 10080  # weekly

    def fetch(self) -> Any:
        res = self.http_get(OCTANE_URL)
        return res.json()

    def normalise(self, raw: Any) -> list[Observation]:
        # The API may return a top-level list or a dict with a data/prices key.
        if isinstance(raw, dict):
            items: list[Any] = (
                raw.get("data")
                or raw.get("prices")
                or raw.get("results")
                or []
            )
        elif isinstance(raw, list):
            items = raw
        else:
            raise ValueError(f"unexpected Octane API response type: {type(raw)}")

        if not items:
            raise ValueError("Octane API returned no fuel price entries")

        # Group by fuel_type; prefer CPC entries.
        best: dict[str, dict[str, Any]] = {}
        for item in items:
            if not isinstance(item, dict):
                continue
            fuel_type = str(item.get("fuel_type") or item.get("type") or "").strip().lower()
            if fuel_type not in FUEL_METRIC_MAP:
                continue
            src = str(item.get("source") or "").strip().lower()
            existing = best.get(fuel_type)
            if existing is None or src == PREFERRED_SOURCE:
                best[fuel_type] = item

        if not best:
            raise ValueError(
                f"no matching fuel types found in Octane response; "
                f"available types: {[i.get('fuel_type') or i.get('type') for i in items[:5]]}"
            )

        observations: list[Observation] = []
        for fuel_type, item in best.items():
            metric = FUEL_METRIC_MAP[fuel_type]
            price = (
                item.get("price_lkr")
                or item.get("price")
                or item.get("amount")
                or item.get("value")
            )
            recorded_at = item.get("recorded_at") or item.get("date") or item.get("updated_at")

            if price is None:
                continue
            try:
                price = float(price)
            except (TypeError, ValueError):
                continue

            if recorded_at:
                observed_at = _date_to_observed_at(str(recorded_at))
            else:
                from datetime import date
                observed_at = _date_to_observed_at(date.today().isoformat())

            meta = {
                "source": item.get("source"),
                "fuel_type": fuel_type,
            }
            observations.append(
                Observation(metric, price, observed_at, unit="LKR/L", meta=meta)
            )

        if not observations:
            raise ValueError("failed to extract any valid price entries from Octane response")

        return observations
