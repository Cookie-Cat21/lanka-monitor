"""CBSL daily indicative USD/LKR buy & sell rates.

The Central Bank publishes these behind a plain HTML form (no auth, no
cookies). POST to exrates_resultstt.php with the form fields below — the
`submit_button=Submit` field is mandatory or the response comes back empty.
Rates are published each business day, so we fetch a 7-day window and upsert;
weekends/holidays simply have no rows.

Verified 2026-07-19: returns a table with columns Date / Buy Rate (LKR) /
Sell Rate (LKR).
"""

from __future__ import annotations

from datetime import date, timedelta

from bs4 import BeautifulSoup

from ..base import Observation, Source

RESULTS_URL = (
    "https://www.cbsl.gov.lk/cbsl_custom/exratestt/exrates_resultstt.php"
)


class CbslFx(Source):
    id = "cbsl_fx"
    expected_cadence_minutes = 1440

    def fetch(self) -> str:
        today = date.today()
        res = self.http_post(
            RESULTS_URL,
            data={
                "lookupPage": "lookup_daily_exchange_rates.php",
                "startRange": "2006-11-11",
                "rangeType": "dates",
                "txtStart": (today - timedelta(days=7)).isoformat(),
                "txtEnd": today.isoformat(),
                "chk_cur[]": "USD~US Dollar",
                "submit_button": "Submit",
            },
        )
        return res.text

    def normalise(self, raw: str) -> list[Observation]:
        soup = BeautifulSoup(raw, "html.parser")
        table = soup.find("table")
        if table is None:
            raise ValueError("no rates table in CBSL response")

        observations: list[Observation] = []
        for row in table.find_all("tr"):
            cells = [c.get_text(strip=True) for c in row.find_all("td")]
            if len(cells) != 3:
                continue
            day, buy, sell = cells
            # Rates are for the stated business day; pin to noon Colombo
            # time (UTC+5:30 -> 06:30 UTC) so re-scrapes upsert cleanly.
            observed_at = f"{day}T06:30:00+00:00"
            observations.append(
                Observation("usd_lkr_buy", float(buy), observed_at, unit="LKR")
            )
            observations.append(
                Observation("usd_lkr_sell", float(sell), observed_at, unit="LKR")
            )

        if not observations:
            raise ValueError("CBSL table parsed but contained no rate rows")
        return observations
