"""BriefGen source — calls generate_brief() and records health.

This source does not produce numeric observations; it produces one row in the
`briefs` table per successful generation.  The base Source.run() contract is
preserved (health always reported, errors caught) but the fetch/normalise steps
are replaced with a single generate_brief() call.

observations_count is set to 1 when a brief is written, 0 when skipped (rate
limit or cap reached).  source_health rows with observations_count > 0 are used
by db.count_brief_generations_today() to enforce the daily hard cap.
"""

from __future__ import annotations

import logging
import time
from typing import Any

from ..base import Observation, RunResult, Source
from ..brief import generate_brief
from ..db import Db

logger = logging.getLogger("ingest.brief_gen")


class BriefGen(Source):
    id = "brief_gen"
    expected_cadence_minutes = 60

    # These two are required by the ABC but never reached in normal operation
    # because run() is overridden below.
    def fetch(self) -> Any:
        return None  # pragma: no cover

    def normalise(self, raw: Any) -> list[Observation]:
        return []  # pragma: no cover

    def run(self, db: Db) -> RunResult:
        """Override the standard fetch/normalise pipeline for brief generation."""
        started = time.monotonic()
        error: str | None = None
        count = 0
        try:
            result = generate_brief(db)
            if result is not None:
                count = 1  # signals to daily cap counter that a brief was written
            else:
                logger.info("brief_gen: skipped (rate-limit or cap reached)")
        except Exception as exc:  # noqa: BLE001 — rule 1: record, don't raise
            error = f"{type(exc).__name__}: {exc}"[:1000]
            logger.exception("brief_gen failed")

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
        except Exception:  # noqa: BLE001
            logger.exception("failed to report health for brief_gen")

        return RunResult(self.id, ok, count, latency_ms, error)
