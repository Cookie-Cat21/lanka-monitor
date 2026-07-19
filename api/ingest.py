"""Vercel Python function: runs the ingest workers on a schedule.

Vercel Cron calls GET /api/ingest (see vercel.json). When the CRON_SECRET
env var is set on the project, Vercel sends it as a Bearer token and we
reject anything that doesn't carry it, so random visitors can't make us
hammer government websites.
"""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from ingest.run import run_all  # noqa: E402


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        secret = os.environ.get("CRON_SECRET")
        auth = self.headers.get("Authorization", "")
        if secret and auth != f"Bearer {secret}":
            self.send_response(401)
            self.end_headers()
            self.wfile.write(b"unauthorized")
            return

        try:
            results = run_all()
            body = {
                "ok": all(r.ok for r in results),
                "results": [
                    {
                        "source_id": r.source_id,
                        "ok": r.ok,
                        "observations": r.observations,
                        "latency_ms": r.latency_ms,
                        "error": r.error,
                    }
                    for r in results
                ],
            }
            self.send_response(200)
        except Exception as exc:  # noqa: BLE001
            body = {"ok": False, "error": f"{type(exc).__name__}: {exc}"}
            self.send_response(500)

        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(body).encode())
