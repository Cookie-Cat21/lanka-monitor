"""Open-Meteo weather for Colombo, Sri Lanka.

Free, no-auth API — returns current conditions and the day's max
precipitation probability for lat/lon 6.9271 / 79.8612 (Fort, Colombo).

Metrics emitted:
  weather_temp_c            current 2 m air temperature (°C)
  weather_humidity_pct      current relative humidity (%)
  weather_precip_mm         current precipitation in the last hour (mm)
  weather_wind_kmh          current 10 m wind speed (km/h)
  weather_code              WMO weather interpretation code
  weather_precip_prob_pct   daily max precipitation probability (%)

observed_at for current metrics uses the API's current.time (UTC).
observed_at for precip_prob uses the daily date at 06:30 UTC (noon Colombo).
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from ..base import Observation, Source

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

COLOMBO_LAT = 6.9271
COLOMBO_LON = 79.8612


class OpenMeteo(Source):
    id = "open_meteo"
    expected_cadence_minutes = 60

    def fetch(self) -> dict[str, Any]:
        res = self.http_get(
            OPEN_METEO_URL,
            params={
                "latitude": COLOMBO_LAT,
                "longitude": COLOMBO_LON,
                "current": (
                    "temperature_2m,"
                    "relative_humidity_2m,"
                    "precipitation,"
                    "weather_code,"
                    "wind_speed_10m"
                ),
                "daily": "precipitation_probability_max",
                "wind_speed_unit": "kmh",
                "timezone": "UTC",
                "forecast_days": 1,
            },
        )
        return res.json()

    def normalise(self, raw: dict[str, Any]) -> list[Observation]:
        current = raw.get("current") or {}
        daily = raw.get("daily") or {}

        # Parse current.time → ISO 8601 UTC.
        current_time_str = current.get("time", "")
        if current_time_str:
            # Open-Meteo returns e.g. "2026-07-19T04:00" without seconds or tz.
            try:
                dt = datetime.strptime(current_time_str, "%Y-%m-%dT%H:%M")
                observed_at = dt.replace(tzinfo=timezone.utc).isoformat()
            except ValueError:
                observed_at = f"{current_time_str}:00+00:00"
        else:
            observed_at = datetime.now(timezone.utc).isoformat()

        observations: list[Observation] = []

        mapping = [
            ("temperature_2m", "weather_temp_c", "°C"),
            ("relative_humidity_2m", "weather_humidity_pct", "%"),
            ("precipitation", "weather_precip_mm", "mm"),
            ("weather_code", "weather_code", None),
            ("wind_speed_10m", "weather_wind_kmh", "km/h"),
        ]
        for api_key, metric, unit in mapping:
            val = current.get(api_key)
            if val is not None:
                observations.append(
                    Observation(metric, float(val), observed_at, unit=unit)
                )

        # Daily precipitation probability — pinned to noon Colombo on that date.
        daily_times = daily.get("time") or []
        precip_probs = daily.get("precipitation_probability_max") or []
        if daily_times and precip_probs and precip_probs[0] is not None:
            daily_observed_at = f"{daily_times[0]}T06:30:00+00:00"
            observations.append(
                Observation(
                    "weather_precip_prob_pct",
                    float(precip_probs[0]),
                    daily_observed_at,
                    unit="%",
                )
            )

        if not observations:
            raise ValueError("no weather fields in Open-Meteo response")

        return observations
