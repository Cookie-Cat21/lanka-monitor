"""Daily brief generation pipeline.

Reads recent articles + live observations, produces a structured trilingual
brief (EN / සිංහල / தமிழ்) and stores it in the briefs table.

Two modes:
  Claude mode  — ANTHROPIC_API_KEY is set; calls claude-sonnet for structured JSON
                 with 3-5 bullets and citations.
  Desk mode    — no key; assembles a deterministic brief from article titles +
                 latest FX / weather; labelled model="desk-v1".

Cost guards:
  - Hourly rate limit: if today's brief was generated < 1 hour ago, skip.
  - Daily hard cap: max 24 actual generations per calendar day (tracked via
    source_health observations_count > 0 for brief_gen).
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone
from typing import Any

import requests

from .cluster import cluster_articles
from .db import Db

logger = logging.getLogger("ingest.brief")

MAX_BRIEFS_PER_DAY = 24
ANTHROPIC_API_BASE = "https://api.anthropic.com/v1"
# Override via CLAUDE_MODEL env var; alias accepted by Anthropic's API.
CLAUDE_MODEL = os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-5")


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------


def generate_brief(db: Db) -> dict[str, Any] | None:
    """Generate (or skip) the daily brief.

    Returns the stored brief meta dict when a brief was written, None when
    skipped (cap reached or rate-limited).  Never raises — callers should
    treat None as a normal skip, not an error.
    """
    from datetime import date

    today = date.today().isoformat()

    # Daily hard cap — count actual generations (observations_count > 0) today.
    try:
        gen_count = db.count_brief_generations_today()
        if gen_count >= MAX_BRIEFS_PER_DAY:
            logger.info("brief: daily cap (%d) reached for %s — skipping", MAX_BRIEFS_PER_DAY, today)
            return None
    except Exception:
        logger.warning("brief: could not read daily cap counter — proceeding", exc_info=True)

    # Hourly rate limit — check meta.generated_at of today's existing brief.
    try:
        existing = db.get_latest_brief()
        if existing and existing.get("brief_date") == today:
            gen_at_str = (existing.get("meta") or {}).get("generated_at")
            if gen_at_str:
                gen_time = datetime.fromisoformat(gen_at_str)
                if gen_time.tzinfo is None:
                    gen_time = gen_time.replace(tzinfo=timezone.utc)
                age_secs = (datetime.now(timezone.utc) - gen_time).total_seconds()
                if age_secs < 3600:
                    logger.info(
                        "brief: generated %.0f min ago — skipping (hourly limit)",
                        age_secs / 60,
                    )
                    return None
    except Exception:
        logger.warning("brief: could not read existing brief for rate-limit check — proceeding", exc_info=True)

    # Gather inputs.
    articles: list[dict[str, Any]] = []
    try:
        articles = db.list_recent_articles(hours=24, limit=50)
    except Exception:
        logger.warning("brief: could not fetch recent articles", exc_info=True)

    fx_sell: float | None = None
    try:
        fx_sell = db.get_latest_observation("cbsl_fx", "usd_lkr_sell")
    except Exception:
        pass

    temp_c: float | None = None
    try:
        temp_c = db.get_latest_observation("dmc_weather", "temp_c")
    except Exception:
        pass

    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()

    if api_key and articles:
        brief_data = _claude_brief(api_key, articles, fx_sell, temp_c)
        model = CLAUDE_MODEL
        is_fallback = False
    else:
        brief_data = _desk_brief(articles, fx_sell, temp_c)
        model = "desk-v1"
        is_fallback = True

    generated_at = datetime.now(timezone.utc).isoformat()
    meta: dict[str, Any] = {
        "locales": {
            "si": brief_data.get("si", ""),
            "ta": brief_data.get("ta", ""),
        },
        "citations": brief_data.get("citations", []),
        "headline": brief_data.get("headline", ""),
        "is_fallback": is_fallback,
        "generated_at": generated_at,
    }

    db.upsert_brief(
        brief_date=today,
        content=brief_data.get("en", ""),
        model=model,
        meta=meta,
    )
    logger.info("brief: wrote %s brief for %s (model=%s)", "fallback" if is_fallback else "AI", today, model)

    return {"brief_date": today, "model": model, "meta": meta}


# ---------------------------------------------------------------------------
# Claude mode
# ---------------------------------------------------------------------------


def _claude_brief(
    api_key: str,
    articles: list[dict[str, Any]],
    fx_sell: float | None,
    temp_c: float | None,
) -> dict[str, Any]:
    titles = [a.get("title", "") for a in articles]
    clusters = cluster_articles(titles, threshold=0.35)

    # One representative per cluster (first index = earliest/most-recent due to
    # descending sort from DB).
    rep_indices = [cluster[0] for cluster in clusters[:20]]
    rep_articles = [articles[i] for i in rep_indices]

    article_lines = [
        f"[{i}] {art.get('title', '')} — {art.get('url', '')}"
        for i, art in enumerate(rep_articles, 1)
    ]
    articles_block = "\n".join(article_lines)

    extras: list[str] = []
    if fx_sell is not None:
        extras.append(f"USD/LKR sell rate: {fx_sell:.2f} LKR")
    if temp_c is not None:
        extras.append(f"Colombo temperature: {temp_c:.1f}°C")
    extras_block = ("\n\nLive data:\n" + "\n".join(extras)) if extras else ""

    system = (
        "You are the Lanka Monitor brief engine. "
        "Produce a concise, factual daily brief about Sri Lanka in three languages. "
        "Cite sources by bracketed number. Never invent facts. "
        "Respond with raw JSON only — no markdown fences, no explanation."
    )

    user = f"""Articles (deduplicated, most recent first):
{articles_block}{extras_block}

Produce exactly this JSON structure — no other text:
{{
  "headline": "<one sentence, max 12 words, most important story>",
  "en": "<3–5 bullet points, each on its own line starting with •, inline citations like [1]>",
  "si": "<same bullets translated into Sinhala script (සිංහල)>",
  "ta": "<same bullets translated into Sri Lankan Tamil script (தமிழ்)>",
  "citations": [{{"n": 1, "title": "<title>", "url": "<url>"}}, ...]
}}"""

    res = requests.post(
        f"{ANTHROPIC_API_BASE}/messages",
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": CLAUDE_MODEL,
            "max_tokens": 2048,
            "system": system,
            "messages": [{"role": "user", "content": user}],
        },
        timeout=60,
    )
    res.raise_for_status()
    payload = res.json()
    text = payload["content"][0]["text"].strip()
    # Strip any accidental markdown fence wrapping before parsing.
    if text.startswith("```"):
        text = "\n".join(
            line for line in text.splitlines()
            if not line.startswith("```")
        ).strip()
    return json.loads(text)


# ---------------------------------------------------------------------------
# Desk mode (no API key)
# ---------------------------------------------------------------------------


def _desk_brief(
    articles: list[dict[str, Any]],
    fx_sell: float | None,
    temp_c: float | None,
) -> dict[str, Any]:
    titles = [a.get("title", "") for a in articles]
    clusters = cluster_articles(titles, threshold=0.35) if titles else []

    rep_indices = [cluster[0] for cluster in clusters[:5]]
    rep_articles = [articles[i] for i in rep_indices] if rep_indices else articles[:5]

    bullets: list[str] = []
    citations: list[dict[str, Any]] = []

    for i, art in enumerate(rep_articles, 1):
        title = art.get("title") or "(No title)"
        url = art.get("url", "")
        bullets.append(f"• {title} [{i}]")
        citations.append({"n": i, "title": title, "url": url})

    if fx_sell is not None:
        bullets.append(f"• USD/LKR sell rate: {fx_sell:.2f} LKR")
    if temp_c is not None:
        bullets.append(f"• Colombo temperature: {temp_c:.1f}°C")

    body = "\n".join(bullets) if bullets else "No data available."
    note = "[desk-v1: deterministic assembly — no AI summarisation]"
    full_body = f"{body}\n\n{note}"

    headline = (rep_articles[0].get("title") or "Lanka Monitor Daily Brief")[:80] if rep_articles else "Lanka Monitor Daily Brief"

    return {
        "headline": headline,
        "en": full_body,
        "si": full_body,
        "ta": full_body,
        "citations": citations,
    }
