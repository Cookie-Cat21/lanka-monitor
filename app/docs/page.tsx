import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

export const metadata: Metadata = {
  title: "API · Lanka Monitor",
  description: "Public JSON endpoints for source health and USD/LKR rates.",
};

const INTRO =
  "Read-only JSON for developers and journalists. No API key. Every response includes " +
  "`generated_at` and source freshness — stale data is labeled, never silently served. " +
  "Attribute Lanka Monitor when republishing.";

function Endpoint({
  method,
  path,
  cache,
  summary,
  curl,
}: {
  method: string;
  path: string;
  cache: string;
  summary: string;
  curl: string;
}) {
  return (
    <section className="rounded-xl border border-panel-edge bg-panel p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded bg-fresh/15 px-2 py-0.5 font-mono text-xs font-semibold text-fresh">
          {method}
        </span>
        <code className="font-mono text-sm text-zinc-200">{path}</code>
        <span className="text-xs text-text-dim">· cached {cache}</span>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-zinc-300">{summary}</p>
      <pre className="overflow-x-auto rounded-lg border border-panel-edge bg-ink p-3 font-mono text-xs leading-relaxed text-zinc-300">
        <code>{curl}</code>
      </pre>
    </section>
  );
}

export default async function ApiDocsPage() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <Link
          href="/"
          className="text-xs text-text-dim underline decoration-panel-edge underline-offset-2 hover:text-zinc-300"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-3 text-lg font-semibold tracking-tight">API</h1>
        <p className="mt-2 text-sm leading-relaxed text-text-dim">{INTRO}</p>
      </header>

      <aside className="mb-8 rounded-xl border border-panel-edge bg-panel/60 p-4 text-sm text-zinc-300">
        <h2 className="mb-1 text-xs font-medium uppercase tracking-wide text-text-dim">
          Rate limits
        </h2>
        <p className="leading-relaxed">
          Fair use: ≤60 requests/min per IP. Health refreshes every 2&nbsp;min; FX every
          5&nbsp;min — polling faster won&apos;t return newer data.
        </p>
      </aside>

      <div className="space-y-4">
        <Endpoint
          method="GET"
          path="/api/v1/health"
          cache="120s"
          summary="Freshness status for every ingest source: fresh, stale, down, or inactive."
          curl={`curl -s "${origin}/api/v1/health" | jq`}
        />
        <Endpoint
          method="GET"
          path="/api/v1/fx"
          cache="300s"
          summary="Latest CBSL USD/LKR buy & sell rates plus a 30-day daily series."
          curl={`curl -s "${origin}/api/v1/fx" | jq '.latest,.series[-3:]'`}
        />
      </div>
    </main>
  );
}
