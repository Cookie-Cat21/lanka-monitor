"use client";

import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function SiteHeader({
  telegramUrl,
}: {
  telegramUrl?: string | null;
}) {
  return (
    <header className="relative mb-6 overflow-hidden rounded-3xl border border-panel-edge bg-panel/80 px-5 py-6 shadow-[0_1px_0_rgba(12,31,36,0.04)] backdrop-blur-sm sm:px-8 sm:py-8">
      {/* Atmosphere plane — brand visual, not a floating badge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_80%_at_100%_0%,rgba(14,116,144,0.14),transparent_55%),linear-gradient(135deg,rgba(15,118,110,0.06),transparent_40%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full border border-lagoon/15 sm:h-56 sm:w-56"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-2 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full border border-lagoon/20 sm:h-40 sm:w-40"
      />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="section-label mb-2">Ardeno Studio · daily utility</p>
          <h1 className="font-display text-[clamp(2.1rem,6vw,3.25rem)] font-semibold leading-[0.95] tracking-tight text-ink">
            Lanka{" "}
            <span className="text-lagoon">Monitor</span>
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-[15px]">
            Sri Lanka, right now — money, weather, power, health, news.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <a
              href="#money"
              className="inline-flex items-center rounded-full bg-lagoon px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-depth focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Check the rupee
            </a>
            <a
              href="/health"
              className="inline-flex items-center rounded-full border border-panel-edge bg-panel px-3.5 py-1.5 text-xs font-semibold text-ink-soft transition hover:border-lagoon/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Source health
            </a>
            {telegramUrl ? (
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted link-quiet"
              >
                Morning brief on Telegram
              </a>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 self-start sm:self-end">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
