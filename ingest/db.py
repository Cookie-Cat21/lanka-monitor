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

    def upsert_articles(self, rows: list[dict[str, Any]]) -> int:
        if not rows:
            return 0
        res = requests.post(
            f"{self.url}/rest/v1/articles",
            json=rows,
            headers=self._headers(
                {"Prefer": "resolution=merge-duplicates,return=minimal"}
            ),
            params={"on_conflict": "url"},
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

    def list_recent_articles(self, hours: int = 24, limit: int = 50) -> list[dict[str, Any]]:
        from datetime import datetime, timedelta, timezone

        cutoff = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
        res = requests.get(
            f"{self.url}/rest/v1/articles",
            headers=self._headers(),
            params={
                "published_at": f"gte.{cutoff}",
                "select": "id,url,title,summary,published_at,meta",
                "order": "published_at.desc",
                "limit": str(limit),
            },
            timeout=30,
        )
        res.raise_for_status()
        return res.json()

    def get_latest_observation(self, source_id: str, metric: str) -> float | None:
        res = requests.get(
            f"{self.url}/rest/v1/observations",
            headers=self._headers(),
            params={
                "source_id": f"eq.{source_id}",
                "metric": f"eq.{metric}",
                "select": "value",
                "order": "observed_at.desc",
                "limit": "1",
            },
            timeout=30,
        )
        res.raise_for_status()
        rows = res.json()
        return float(rows[0]["value"]) if rows else None

    def get_latest_brief(self) -> dict[str, Any] | None:
        res = requests.get(
            f"{self.url}/rest/v1/briefs",
            headers=self._headers(),
            params={
                "select": "id,brief_date,content,model,meta,created_at",
                "order": "brief_date.desc",
                "limit": "1",
            },
            timeout=30,
        )
        res.raise_for_status()
        rows = res.json()
        return rows[0] if rows else None

    def upsert_brief(
        self,
        brief_date: str,
        content: str,
        model: str,
        meta: dict[str, Any],
    ) -> None:
        res = requests.post(
            f"{self.url}/rest/v1/briefs",
            json={
                "brief_date": brief_date,
                "content": content,
                "model": model,
                "meta": meta,
            },
            headers=self._headers({"Prefer": "resolution=merge-duplicates,return=minimal"}),
            params={"on_conflict": "brief_date"},
            timeout=30,
        )
        res.raise_for_status()

    def count_brief_generations_today(self) -> int:
        """Count brief_gen runs today that actually wrote a brief (observations_count > 0)."""
        from datetime import date

        today_start = date.today().isoformat() + "T00:00:00+00:00"
        res = requests.get(
            f"{self.url}/rest/v1/source_health",
            headers=self._headers(),
            params={
                "source_id": "eq.brief_gen",
                "observations_count": "gt.0",
                "run_at": f"gte.{today_start}",
                "select": "id",
            },
            timeout=30,
        )
        res.raise_for_status()
        return len(res.json())
