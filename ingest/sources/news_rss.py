"""Sri Lanka news RSS aggregator.

Fetches RSS feeds from three major outlets:
  • Ada Derana     https://www.adaderana.lk/rss.php
  • EconomyNext   https://economynext.com/feed/
  • Daily Mirror  https://www.dailymirror.lk/rss

Each feed is fetched independently; a dead feed logs a warning and is
skipped without failing the overall run.

Parsing strategy:
  1. Try feedparser (pip install feedparser) if installed.
  2. Fall back to xml.etree.ElementTree (stdlib).

Two outputs per run:
  a. Observation  news_article_count  — total new articles seen this pass
     (meta has per-feed counts and a sample of titles)
  b. Article rows  upserted via db.upsert_articles (base.run() calls this)
     keyed on URL — repeated fetches are idempotent.
"""

from __future__ import annotations

import logging
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Any

from ..base import Observation, Source

logger = logging.getLogger("ingest.news_rss")

FEEDS: list[dict[str, str]] = [
    {"id": "adaderana", "name": "Ada Derana", "url": "https://www.adaderana.lk/rss.php"},
    {"id": "economynext", "name": "EconomyNext", "url": "https://economynext.com/feed/"},
    {"id": "newswire", "name": "Newswire", "url": "https://www.newswire.lk/feed/"},
    # Daily Mirror often 403s our bot — kept for when access returns.
    {"id": "dailymirror", "name": "Daily Mirror", "url": "https://www.dailymirror.lk/rss"},
]

# Try feedparser; gracefully degrade to stdlib XML if unavailable.
try:
    import feedparser as _feedparser

    _HAS_FEEDPARSER = True
except ImportError:
    _feedparser = None  # type: ignore[assignment]
    _HAS_FEEDPARSER = False


def _parse_date(date_str: str | None) -> str | None:
    """Parse an RFC 2822 or ISO date string → ISO 8601 UTC. Returns None on failure."""
    if not date_str:
        return None
    try:
        dt = parsedate_to_datetime(date_str)
        return dt.astimezone(timezone.utc).isoformat()
    except Exception:
        pass
    # Try ISO fallback
    for fmt in ("%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            dt = datetime.strptime(date_str.strip(), fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc).isoformat()
        except ValueError:
            continue
    return None


def _parse_feedparser(text: str, feed_url: str) -> list[dict[str, Any]]:
    """Parse RSS/Atom using feedparser library."""
    parsed = _feedparser.parse(text)  # type: ignore[union-attr]
    items: list[dict[str, Any]] = []
    for entry in parsed.get("entries", []):
        link = entry.get("link") or entry.get("id") or ""
        title = entry.get("title") or ""
        summary = entry.get("summary") or entry.get("description") or ""
        pub_date = _parse_date(
            entry.get("published") or entry.get("updated")
        )
        if link:
            items.append(
                {"url": link, "title": title, "summary": summary, "published_at": pub_date}
            )
    return items


def _parse_etree(text: str, feed_url: str) -> list[dict[str, Any]]:
    """Parse RSS 2.0 / Atom using stdlib xml.etree."""
    items: list[dict[str, Any]] = []
    try:
        root = ET.fromstring(text)
    except ET.ParseError as exc:
        logger.warning("XML parse error for %s: %s", feed_url, exc)
        return items

    # Remove namespace prefixes for simpler XPath.
    ns_strip = root.tag.split("}")[0].lstrip("{") if "}" in root.tag else None

    # RSS 2.0: channel/item
    for item in root.iter("item"):
        link = (item.findtext("link") or "").strip()
        title = (item.findtext("title") or "").strip()
        desc = (item.findtext("description") or "").strip()
        pub_date = _parse_date(item.findtext("pubDate"))
        if link:
            items.append(
                {"url": link, "title": title, "summary": desc, "published_at": pub_date}
            )

    # Atom: entry
    if not items:
        atom_ns = "{http://www.w3.org/2005/Atom}"
        for entry in root.iter(f"{atom_ns}entry"):
            link_el = entry.find(f"{atom_ns}link")
            link = ""
            if link_el is not None:
                link = link_el.get("href", "")
            title = (entry.findtext(f"{atom_ns}title") or "").strip()
            summary = (entry.findtext(f"{atom_ns}summary") or "").strip()
            published = entry.findtext(f"{atom_ns}published") or entry.findtext(
                f"{atom_ns}updated"
            )
            pub_date = _parse_date(published)
            if link:
                items.append(
                    {"url": link, "title": title, "summary": summary, "published_at": pub_date}
                )

    return items


def _parse_feed(text: str, feed_url: str) -> list[dict[str, Any]]:
    if _HAS_FEEDPARSER:
        return _parse_feedparser(text, feed_url)
    return _parse_etree(text, feed_url)


class NewsRss(Source):
    id = "news_rss"
    expected_cadence_minutes = 15

    # Populated during fetch/normalise; read by articles().
    _article_rows: list[dict[str, Any]]

    def __init__(self) -> None:
        self._article_rows = []

    def fetch(self) -> dict[str, Any]:
        """Return raw feed texts keyed by feed id."""
        results: dict[str, Any] = {}
        for feed in FEEDS:
            try:
                res = self.http_get(
                    feed["url"],
                    headers={"Accept": "application/rss+xml, application/xml, text/xml"},
                )
                results[feed["id"]] = {"text": res.text, "name": feed["name"], "url": feed["url"]}
            except Exception as exc:
                logger.warning("RSS fetch failed for %s: %s", feed["url"], exc)
                results[feed["id"]] = None
        return results

    def normalise(self, raw: dict[str, Any]) -> list[Observation]:
        now_iso = datetime.now(timezone.utc).isoformat()
        per_feed: dict[str, int] = {}
        sample_titles: list[str] = []
        article_rows: list[dict[str, Any]] = []

        for feed_id, feed_result in raw.items():
            if feed_result is None:
                per_feed[feed_id] = 0
                continue
            items = _parse_feed(feed_result["text"], feed_result["url"])
            per_feed[feed_id] = len(items)
            for item in items:
                if item.get("title"):
                    sample_titles.append(item["title"])
                article_rows.append(
                    {
                        "source_id": self.id,
                        "url": item["url"],
                        "title": item.get("title") or "(no title)",
                        "summary": item.get("summary") or None,
                        "published_at": item.get("published_at"),
                        "meta": {"feed": feed_id},
                    }
                )

        self._article_rows = article_rows
        total = sum(per_feed.values())

        return [
            Observation(
                "news_article_count",
                float(total),
                now_iso,
                meta={
                    "per_feed": per_feed,
                    "sample_titles": sample_titles[:10],
                    "parser": "feedparser" if _HAS_FEEDPARSER else "etree",
                },
            )
        ]

    def articles(self) -> list[dict[str, Any]]:
        """Return article rows populated by the most recent normalise() call."""
        return self._article_rows
