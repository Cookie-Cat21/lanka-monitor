"""Run every active source once. Entry point for cron and local runs:

    python -m ingest.run
"""

from __future__ import annotations

import logging
import sys

from .base import RunResult
from .db import Db
from .sources import ALL_SOURCES


def run_all() -> list[RunResult]:
    db = Db.from_env()
    active = set(db.active_source_ids())
    results: list[RunResult] = []
    for source_cls in ALL_SOURCES:
        source = source_cls()
        if source.id not in active:
            logging.info("skipping inactive source %s", source.id)
            continue
        results.append(source.run(db))
    return results


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    results = run_all()
    for r in results:
        status = "ok" if r.ok else f"FAILED ({r.error})"
        print(f"{r.source_id}: {status} — {r.observations} observations in {r.latency_ms}ms")
    # Exit code reflects failures for CI visibility; individual failures never
    # abort other sources (they're already isolated inside Source.run).
    return 0 if all(r.ok for r in results) else 1


if __name__ == "__main__":
    sys.exit(main())
