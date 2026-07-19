"""Supabase PostgREST client for the ingest workers.

Writes use the service-role key (bypasses RLS). Kept dependency-light on
purpose: plain HTTP against PostgREST, no supabase-py, so this runs anywhere
a `requests` install exists — including a Vercel serverless function.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any

import requests


class DbNotConfigured(RuntimeError):
    pass


@dataclass
class Db:
    url: str
    key: str

    @classmethod
    def from_env(cls) -> "Db":
        url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise DbNotConfigured(
                "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
            )
        return cls(url=url.rstrip("/"), key=key)

    def _headers(self, extra: dict[str, str] | None = None) -> dict[str, str]:
        headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
        }
        if extra:
            headers.update(extra)
        return headers

    def upsert_observations(self, rows: list[dict[str, Any]]) -> int:
        if not rows:
            return 0
        res = requests.post(
            f"{self.url}/rest/v1/observations",
            json=rows,
            headers=self._headers(
                {"Prefer": "resolution=merge-duplicates,return=minimal"}
            ),
            params={"on_conflict": "source_id,metric,observed_at"},
            timeout=30,
        )
        res.raise_for_status()
        return len(rows)

    def last_consecutive_failures(self, source_id: str) -> int:
        res = requests.get(
            f"{self.url}/rest/v1/source_health",
            headers=self._headers(),
            params={
                "source_id": f"eq.{source_id}",
                "select": "ok,consecutive_failures",
                "order": "run_at.desc",
                "limit": "1",
            },
            timeout=30,
        )
        res.raise_for_status()
        rows = res.json()
        if not rows or rows[0]["ok"]:
            return 0
        return int(rows[0]["consecutive_failures"])

    def report_health(
        self,
        source_id: str,
        ok: bool,
        latency_ms: int,
        observations_count: int,
        error: str | None,
        consecutive_failures: int,
    ) -> None:
        res = requests.post(
            f"{self.url}/rest/v1/source_health",
            json={
                "source_id": source_id,
                "ok": ok,
                "latency_ms": latency_ms,
                "observations_count": observations_count,
                "error": error,
                "consecutive_failures": consecutive_failures,
            },
            headers=self._headers({"Prefer": "return=minimal"}),
            timeout=30,
        )
        res.raise_for_status()

    def active_source_ids(self) -> list[str]:
        res = requests.get(
            f"{self.url}/rest/v1/sources",
            headers=self._headers(),
            params={"active": "eq.true", "select": "id"},
            timeout=30,
        )
        res.raise_for_status()
        return [row["id"] for row in res.json()]
