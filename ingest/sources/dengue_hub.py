"""Sri Lanka dengue surveillance from the denguedatahub CRAN package.

Source CSV (updated weekly by the package maintainers):
  https://raw.githubusercontent.com/thiyangt/denguedatahub/master/data-raw/srilanka_weekly_data.csv

The CSV is expected to contain at least these columns (case-insensitive):
  year, week, district, cases  (or 'dengue_cases' / 'count')

We read the latest epidemiological week that has data, compute a national
total, and emit one observation per district for that week.

Metrics emitted:
  dengue_national_cases          total cases across all districts (latest week)
  dengue_district_{slug}         cases for each district (latest week)

observed_at is pinned to Monday of the ISO week at 06:30 UTC (noon Colombo).
"""

from __future__ import annotations

import csv
import io
import logging
import re
from datetime import date, timedelta
from typing import Any

from ..base import Observation, Source

logger = logging.getLogger("ingest.dengue_hub")

CSV_URL = (
    "https://raw.githubusercontent.com/thiyangt/"
    "denguedatahub/master/data-raw/srilanka_weekly_data.csv"
)


def _district_slug(name: str) -> str:
    """'Nuwara Eliya' → 'nuwara_eliya'."""
    slug = name.strip().lower()
    slug = re.sub(r"[^a-z0-9]+", "_", slug)
    return slug.strip("_")


def _week_to_observed_at(year: int, week: int) -> str:
    """Return ISO 8601 for Monday of ISO week `week` in `year` at 06:30 UTC."""
    try:
        monday = date.fromisocalendar(year, week, 1)
    except (ValueError, AttributeError):
        # Python < 3.8 fallback: Jan 4 is always in week 1.
        jan4 = date(year, 1, 4)
        start_of_week1 = jan4 - timedelta(days=jan4.weekday())
        monday = start_of_week1 + timedelta(weeks=week - 1)
    return f"{monday.isoformat()}T06:30:00+00:00"


def _find_col(header: list[str], *candidates: str) -> int | None:
    """Return the index of the first matching column (case-insensitive)."""
    lower = [h.strip().lower() for h in header]
    for c in candidates:
        try:
            return lower.index(c.lower())
        except ValueError:
            continue
    return None


class DengueHub(Source):
    id = "dengue_hub"
    expected_cadence_minutes = 10080  # weekly

    def fetch(self) -> str:
        res = self.http_get(CSV_URL)
        return res.text

    def normalise(self, raw: str) -> list[Observation]:
        reader = csv.reader(io.StringIO(raw))
        header = next(reader, None)
        if header is None:
            raise ValueError("dengue CSV is empty")

        # Locate required columns.
        year_col = _find_col(header, "year")
        week_col = _find_col(header, "week", "epi_week", "epiweek")
        district_col = _find_col(header, "district", "district_name", "province")
        cases_col = _find_col(
            header, "cases", "dengue_cases", "count", "total_cases", "reported_cases"
        )

        if any(c is None for c in (year_col, week_col, cases_col)):
            raise ValueError(
                f"dengue CSV missing required columns. "
                f"Header: {header}. "
                f"year_col={year_col}, week_col={week_col}, cases_col={cases_col}"
            )

        # Read all rows into memory (file is small).
        rows: list[dict[str, Any]] = []
        for line in reader:
            if not line or not any(line):
                continue
            try:
                year = int(float(line[year_col]))  # type: ignore[index]
                week = int(float(line[week_col]))  # type: ignore[index]
                cases_raw = line[cases_col]  # type: ignore[index]
                cases = float(cases_raw) if cases_raw.strip() not in ("", "NA", "na") else 0.0
                district = line[district_col].strip() if district_col is not None else "national"
            except (IndexError, ValueError):
                continue
            rows.append({"year": year, "week": week, "district": district, "cases": cases})

        if not rows:
            raise ValueError("dengue CSV contained no parsable data rows")

        # Find latest year+week combination.
        latest = max(rows, key=lambda r: (r["year"], r["week"]))
        latest_year, latest_week = latest["year"], latest["week"]

        week_rows = [r for r in rows if r["year"] == latest_year and r["week"] == latest_week]
        observed_at = _week_to_observed_at(latest_year, latest_week)

        observations: list[Observation] = []
        national_total = 0.0

        for row in week_rows:
            national_total += row["cases"]
            slug = _district_slug(row["district"])
            observations.append(
                Observation(
                    f"dengue_district_{slug}",
                    row["cases"],
                    observed_at,
                    meta={"year": latest_year, "week": latest_week},
                )
            )

        observations.insert(
            0,
            Observation(
                "dengue_national_cases",
                national_total,
                observed_at,
                meta={"year": latest_year, "week": latest_week},
            ),
        )

        return observations
