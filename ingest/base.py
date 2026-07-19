"""The ingest abstraction. Every data source is a subclass of Source.

Contract (do not weaken these when adding sources):
1. A failing source must never break another source or the page.
   run() catches everything, records it in source_health, and moves on.
2. Every run writes a source_health row — success or failure, always.
3. Be a polite, honest bot: identify ourselves in the User-Agent with a
   contact URL, keep cadences conservative, back off on failure.
4. Never let a client page load trigger a fetch — ingest runs on a schedule,
   the dashboard only reads the database.
"""

from __future__ import annotations

import logging
import os
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any

import requests

from .db import Db

logger = logging.getLogger("ingest")

CONTACT_URL = os.environ.get(
    "BOT_CONTACT_URL", "https://github.com/Cookie-Cat21/lanka-monitor"
)
USER_AGENT = f"LankaMonitorBot/0.1 (+{CONTACT_URL})"

MAX_ATTEMPTS = 3
BACKOFF_SECONDS = 5.0


@dataclass
class Observation:
    metric: str
    value: float
    observed_at: str  # ISO 8601
    unit: str | None = None
    meta: dict[str, Any] = field(default_factory=dict)


@dataclass
class RunResult:
    source_id: str
    ok: bool
    observations: int
    latency_ms: int
    error: str | None


class Source(ABC):
    id: str
    expected_cadence_minutes: int

    @abstractmethod
    def fetch(self) -> Any:
        """Hit the remote source and return its raw payload."""

    @abstractmethod
    def normalise(self, raw: Any) -> list[Observation]:
        """Turn the raw payload into observations. Raise on malformed data."""

    # -- shared plumbing -----------------------------------------------------

    def http_get(self, url: str, **kwargs: Any) -> requests.Response:
        return self._request("GET", url, **kwargs)

    def http_post(self, url: str, **kwargs: Any) -> requests.Response:
        return self._request("POST", url, **kwargs)

    def _request(self, method: str, url: str, **kwargs: Any) -> requests.Response:
        kwargs.setdefault("timeout", 30)
        headers = kwargs.pop("headers", {})
        headers.setdefault("User-Agent", USER_AGENT)
        last_exc: Exception | None = None
        for attempt in range(1, MAX_ATTEMPTS + 1):
            try:
                res = requests.request(method, url, headers=headers, **kwargs)
                res.raise_for_status()
                return res
            except Exception as exc:  # noqa: BLE001 — deliberate catch-all
                last_exc = exc
                if attempt < MAX_ATTEMPTS:
                    time.sleep(BACKOFF_SECONDS * attempt)
        raise last_exc  # type: ignore[misc]

    def articles(self) -> list[dict[str, Any]]:
        """Override to produce article rows for upsert_articles. Default: empty."""
        return []

    def run(self, db: Db) -> RunResult:
        """fetch -> normalise -> upsert -> report health. Never raises."""
        started = time.monotonic()
        error: str | None = None
        count = 0
        try:
            raw = self.fetch()
            observations = self.normalise(raw)
            rows = [
                {
                    "source_id": self.id,
                    "metric": o.metric,
                    "value": o.value,
                    "unit": o.unit,
                    "observed_at": o.observed_at,
                    "meta": o.meta,
                }
                for o in observations
            ]
            count = db.upsert_observations(rows)
            article_rows = self.articles()
            if article_rows:
                db.upsert_articles(article_rows)
        except Exception as exc:  # noqa: BLE001 — rule 1: record, don't raise
            error = f"{type(exc).__name__}: {exc}"[:1000]
            logger.exception("source %s failed", self.id)

        latency_ms = int((time.monotonic() - started) * 1000)
        ok = error is None
        try:
            failures = 0 if ok else db.last_consecutive_failures(self.id) + 1
            db.report_health(
                source_id=self.id,
                ok=ok,
                latency_ms=latency_ms,
                observations_count=count,
                error=error,
                consecutive_failures=failures,
            )
        except Exception:  # noqa: BLE001 — health reporting must not kill the run
            logger.exception("failed to report health for %s", self.id)

        return RunResult(self.id, ok, count, latency_ms, error)
