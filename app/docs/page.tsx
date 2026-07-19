import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

export const metadata: Metadata = {
  title: "API · Lanka Monitor",
  description:
    "Public JSON endpoints for all Lanka Monitor data: FX, fuel, weather, power, news, brief, dengue, cricket, CSE.",
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
    <section className="rounded-2xl border border-panel-edge bg-panel p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded bg-fresh/15 px-2 py-0.5 font-mono text-xs font-semibold text-fresh">
          {method}
        </span>
        <code className="font-mono text-sm text-ink">{path}</code>
        <span className="text-xs text-muted">· cached {cache}</span>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-ink-soft">{summary}</p>
      <pre className="overflow-x-auto rounded-lg border border-panel-edge bg-depth p-3 font-mono text-xs leading-relaxed text-white/90">
        <code>{curl}</code>
      </pre>
    </section>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-8 mb-3 text-xs font-medium uppercase tracking-wide text-muted">
      {children}
    </h2>
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
          className="text-xs text-muted underline decoration-panel-edge underline-offset-2 hover:text-ink-soft"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-3 text-lg font-semibold tracking-tight">API</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{INTRO}</p>
      </header>

      <aside className="mb-8 rounded-2xl border border-panel-edge bg-panel/60 p-4 text-sm text-ink-soft">
        <h2 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
          Rate limits
        </h2>
        <p className="leading-relaxed">
          Fair use: ≤60 requests/min per IP. Cache responses — polling faster
          than the stated cache window won&apos;t return newer data.
        </p>
      </aside>

      <div className="space-y-4">
        <SectionHeading>System</SectionHeading>

        <Endpoint
          method="GET"
          path="/api/v1/health"
          cache="120s"
          summary="Freshness status for every ingest source: fresh, stale, down, or inactive."
          curl={`curl -s "${origin}/api/v1/health" | jq`}
        />

        <SectionHeading>Finance</SectionHeading>

        <Endpoint
          method="GET"
          path="/api/v1/fx"
          cache="300s"
          summary="Latest CBSL USD/LKR buy & sell rates plus a 30-day daily series."
          curl={`curl -s "${origin}/api/v1/fx" | jq '.latest,.series[-3:]'`}
        />

        <Endpoint
          method="GET"
          path="/api/v1/cse"
          cache="300s"
          summary="Colombo Stock Exchange ASPI and S&P SL20 indices — latest close and 30-day series."
          curl={`curl -s "${origin}/api/v1/cse" | jq '.aspi.latest,.sl20.latest'`}
        />

        <Endpoint
          method="GET"
          path="/api/v1/fuel"
          cache="300s"
          summary="CEYPETCO pump prices in LKR/litre: Petrol 92, Petrol 95, Diesel, Kerosene."
          curl={`curl -s "${origin}/api/v1/fuel" | jq '.latest'`}
        />

        <SectionHeading>Environment</SectionHeading>

        <Endpoint
          method="GET"
          path="/api/v1/weather"
          cache="1800s"
          summary="Current weather for Colombo from Open-Meteo: temperature, rain, wind, WMO weather code."
          curl={`curl -s "${origin}/api/v1/weather" | jq '.current'`}
        />

        <Endpoint
          method="GET"
          path="/api/v1/aqi"
          cache="300s"
          summary="Colombo air quality (PM2.5 and AQI) from OpenAQ when ingest is active."
          curl={`curl -s "${origin}/api/v1/aqi" | jq '.latest'`}
        />

        <SectionHeading>Infrastructure</SectionHeading>

        <Endpoint
          method="GET"
          path="/api/v1/power"
          cache="120s"
          summary="CEB scheduled power outage count (active) plus 14-day daily history."
          curl={`curl -s "${origin}/api/v1/power" | jq '{active_outages,series_tail:.series[-3:]}'`}
        />

        <SectionHeading>Health</SectionHeading>

        <Endpoint
          method="GET"
          path="/api/v1/dengue"
          cache="1800s"
          summary="National dengue case count for the latest surveillance week plus top districts. Source: Epidemiology Unit."
          curl={`curl -s "${origin}/api/v1/dengue" | jq '.national,.districts[:5]'`}
        />

        <SectionHeading>News & Brief</SectionHeading>

        <Endpoint
          method="GET"
          path="/api/v1/news"
          cache="120s"
          summary="Latest articles from Sri Lankan outlets with optional cluster grouping."
          curl={`curl -s "${origin}/api/v1/news" | jq '.articles[:3]'`}
        />

        <Endpoint
          method="GET"
          path="/api/v1/brief"
          cache="120s"
          summary="Daily situation brief in English, Sinhala, and Tamil with citations."
          curl={`curl -s "${origin}/api/v1/brief" | jq '{locale_available,is_fallback,en:.en[:200]}'`}
        />

        <SectionHeading>Sport</SectionHeading>

        <Endpoint
          method="GET"
          path="/api/v1/cricket"
          cache="120s"
          summary="Sri Lanka cricket — live / recent match scores. Returns honest inactive state when CRICKET_API_KEY is not configured."
          curl={`curl -s "${origin}/api/v1/cricket" | jq '{feed_status,message}'`}
        />

        <SectionHeading>Notifications</SectionHeading>

        <Endpoint
          method="POST"
          path="/api/telegram"
          cache="—"
          summary={`Send a message to the configured Telegram channel. Requires TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID. Body: {"text": "..."}. Returns 503 when not configured.`}
          curl={`curl -s -X POST "${origin}/api/telegram" \\\n  -H "Content-Type: application/json" \\\n  -d '{"text":"Test from Lanka Monitor"}' | jq`}
        />

        <SectionHeading>Open Graph</SectionHeading>

        <Endpoint
          method="GET"
          path="/api/og"
          cache="300s"
          summary="OG image (1200×630 PNG) showing the latest USD/LKR rate. Used by social share previews."
          curl={`curl -s "${origin}/api/og" -o og.png && open og.png`}
        />
      </div>

      <aside className="mt-8 rounded-2xl border border-panel-edge bg-panel/60 p-4 text-sm text-ink-soft">
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
          Data attribution
        </h2>
        <ul className="space-y-1 text-xs text-muted">
          <li>FX — Central Bank of Sri Lanka (CBSL)</li>
          <li>CSE — Colombo Stock Exchange</li>
          <li>Fuel — CEYPETCO / Ministry of Energy</li>
          <li>Weather — Open-Meteo (open-source, free)</li>
          <li>Power — Ceylon Electricity Board (CEB)</li>
          <li>AQI — OpenAQ</li>
          <li>Dengue — Epidemiology Unit, Ministry of Health</li>
          <li>Seismic — USGS FDSN</li>
        </ul>
      </aside>
    </main>
  );
}
