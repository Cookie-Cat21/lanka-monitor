import Link from "next/link";
import FreshnessBadge from "@/components/FreshnessBadge";
import { getSourceStatuses } from "@/lib/fx";
import type { SourceStatus } from "@/lib/types";

export const revalidate = 120;

function cadenceLabel(mins: number): string {
  if (mins < 60) return `every ${mins}m`;
  if (mins < 60 * 24) return `every ${Math.round(mins / 60)}h`;
  return `every ${Math.round(mins / (60 * 24))}d`;
}

function Summary({ sources }: { sources: SourceStatus[] }) {
  const counts = { fresh: 0, stale: 0, down: 0, inactive: 0 };
  for (const s of sources) counts[s.status] += 1;
  return (
    <div className="mb-6 flex flex-wrap gap-3 text-xs sm:text-sm">
      <span className="text-fresh">● {counts.fresh} fresh</span>
      <span className="text-stale">● {counts.stale} stale</span>
      <span className="text-down">● {counts.down} down</span>
      <span className="text-muted">○ {counts.inactive} soon</span>
    </div>
  );
}

function SourceRow({ s }: { s: SourceStatus }) {
  return (
    <>
      {/* Desktop */}
      <tr className="hidden border-t border-panel-edge sm:table-row">
        <td className="py-3 pr-4 font-medium text-ink">{s.name}</td>
        <td className="py-3 pr-4 capitalize text-muted">{s.category}</td>
        <td className="py-3 pr-4">
          <FreshnessBadge status={s.status} lastSuccessAt={s.last_success_at} />
        </td>
        <td className="tabular py-3 text-muted">
          {cadenceLabel(s.expected_cadence_minutes)}
        </td>
      </tr>
      {/* Mobile */}
      <tr className="sm:hidden">
        <td colSpan={4} className="py-2">
          <article className="rounded-2xl border border-panel-edge bg-panel p-3">
            <div className="mb-1 flex items-start justify-between gap-2">
              <h2 className="text-sm font-medium text-ink">{s.name}</h2>
              <FreshnessBadge
                status={s.status}
                lastSuccessAt={s.last_success_at}
              />
            </div>
            <p className="text-xs text-muted">
              <span className="capitalize">{s.category}</span>
              {" · "}
              {cadenceLabel(s.expected_cadence_minutes)}
            </p>
            {s.last_error && s.status === "down" ? (
              <p className="mt-1 text-xs text-down" title={s.last_error}>
                {s.last_error.slice(0, 120)}
              </p>
            ) : null}
          </article>
        </td>
      </tr>
    </>
  );
}

export default async function HealthPage() {
  const sources = await getSourceStatuses();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6">
        <Link
          href="/"
          className="text-xs text-muted underline decoration-panel-edge underline-offset-2 hover:text-ink-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-3 text-lg font-semibold tracking-tight">
          Source health
        </h1>
        <p className="mt-1 text-sm text-muted">
          Pipeline transparency — what we trust today. Cards hide data when a
          source is down; they refuse to guess.
        </p>
      </header>

      {!sources ? (
        <div className="rounded-2xl border border-panel-edge bg-panel p-5 text-sm text-muted">
          Database not configured — health view unavailable. Set Supabase env
          vars, then re-check. Raw JSON:{" "}
          <Link href="/api/v1/health" className="underline">
            /api/v1/health
          </Link>
        </div>
      ) : sources.length === 0 ? (
        <p className="text-sm text-muted">No sources configured.</p>
      ) : (
        <>
          <Summary sources={sources} />
          <div className="overflow-x-auto rounded-2xl border border-panel-edge bg-panel/40 p-2 sm:p-4">
            <table className="w-full text-left text-sm">
              <thead className="hidden text-xs uppercase tracking-wide text-muted sm:table-header-group">
                <tr>
                  <th className="pb-2 font-medium">Source</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Cadence</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <SourceRow key={s.id} s={s} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="mt-6 text-xs text-muted">
        Machine-readable:{" "}
        <Link
          href="/api/v1/health"
          className="underline decoration-panel-edge underline-offset-2 hover:text-ink-soft"
        >
          GET /api/v1/health
        </Link>
      </p>
    </main>
  );
}
