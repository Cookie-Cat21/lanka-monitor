"use client";

import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function SiteHeader({
  telegramUrl,
}: {
  telegramUrl?: string | null;
}) {
  return (
    <header className="mb-6 border-b border-panel-edge pb-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <nav className="flex items-center gap-3 text-xs font-medium text-muted">
          <a href="/health" className="hover:text-ink">
            Source health
          </a>
          <a href="/docs" className="hover:text-ink">
            API
          </a>
          {telegramUrl ? (
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink"
            >
              Telegram
            </a>
          ) : null}
        </nav>
        <LanguageSwitcher />
      </div>

      <h1 className="font-display text-[clamp(2.4rem,7vw,3.5rem)] font-semibold leading-[0.92] tracking-tight text-ink">
        Lanka Monitor
      </h1>
      <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted">
        Sri Lanka, right now — money, weather, power, health, news.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <a
          href="#money"
          className="inline-flex items-center rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Check the rupee
        </a>
        <a
          href="/health"
          className="inline-flex items-center rounded-lg border border-panel-edge bg-panel px-3.5 py-2 text-xs font-semibold text-ink-soft transition hover:bg-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Source health
        </a>
      </div>
    </header>
  );
}
