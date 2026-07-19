"use client";

import { useState } from "react";
import { TriangleAlert, ExternalLink } from "lucide-react";
import CardShell from "@/components/CardShell";
import RelativeTime from "@/components/RelativeTime";
import type { BriefData, BriefLocale } from "@/lib/types";

const LOCALE_LABELS: Record<BriefLocale, string> = {
  en: "EN",
  si: "සිං",
  ta: "தமி",
};

const LOCALE_FONT: Record<BriefLocale, string> = {
  en: "",
  si: "font-[var(--font-si)]",
  ta: "font-[var(--font-ta)]",
};

export default function BriefCard({ brief }: { brief: BriefData }) {
  const available = brief.locale_available;
  const [locale, setLocale] = useState<BriefLocale>(
    available.includes("en") ? "en" : available[0] ?? "en"
  );

  const content = brief[locale];
  const hasContent = Boolean(content);

  return (
    <CardShell
      title="Daily brief"
      subtitle={
        brief.created_at ? (
          <>
            <RelativeTime iso={brief.created_at} />
          </>
        ) : undefined
      }
      status={hasContent ? (brief.is_fallback ? "stale" : "fresh") : "down"}
      lastSuccessAt={brief.created_at}
      className="col-span-full"
    >
      {/* Fallback warning */}
      {brief.is_fallback && hasContent && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-stale/30 bg-stale/10 px-3 py-2 text-xs text-stale">
          <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden />
          This is a fallback brief — live generation unavailable right now.
        </div>
      )}

      {/* Locale switcher */}
      {available.length > 1 && (
        <div
          role="group"
          aria-label="Brief language"
          className="mb-3 flex items-center gap-0.5 self-start rounded-lg border border-panel-edge bg-ink/50 p-0.5"
        >
          {available.map((loc) => (
            <button
              key={loc}
              onClick={() => setLocale(loc)}
              aria-pressed={locale === loc}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 ${
                locale === loc
                  ? "bg-panel text-zinc-100"
                  : "text-text-dim hover:text-zinc-300"
              }`}
            >
              {LOCALE_LABELS[loc]}
            </button>
          ))}
        </div>
      )}

      {/* Brief content */}
      {content ? (
        <>
          <div
            lang={locale === "si" ? "si" : locale === "ta" ? "ta" : "en"}
            className={`whitespace-pre-wrap text-sm leading-relaxed text-zinc-200 ${LOCALE_FONT[locale]}`}
          >
            {content}
          </div>

          {/* Citations */}
          {brief.citations.length > 0 && (
            <div className="mt-4 border-t border-panel-edge pt-3">
              <h3 className="mb-1.5 text-[10px] uppercase tracking-wide text-text-dim">
                Sources
              </h3>
              <ul className="flex flex-wrap gap-x-3 gap-y-1">
                {brief.citations.map((cite) => (
                  <li key={cite.n} className="text-xs text-zinc-400">
                    {cite.url ? (
                      <a
                        href={cite.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 underline decoration-panel-edge underline-offset-2 hover:text-zinc-200"
                      >
                        [{cite.n}]&nbsp;{cite.title}
                        <ExternalLink className="h-2.5 w-2.5" aria-hidden />
                      </a>
                    ) : (
                      <span>
                        [{cite.n}]&nbsp;{cite.title}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <div className="py-6 text-sm text-text-dim">
          No brief available yet — the brief generation pipeline has not run.
          This card refuses to guess.
        </div>
      )}
    </CardShell>
  );
}
