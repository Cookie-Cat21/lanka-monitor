import AqiCard from "@/components/cards/AqiCard";
import BriefCard from "@/components/cards/BriefCard";
import CoconutIndexCard from "@/components/cards/CoconutIndexCard";
import CostOfLivingCard from "@/components/cards/CostOfLivingCard";
import CricketCard from "@/components/cards/CricketCard";
import CseCard from "@/components/cards/CseCard";
import DengueCard from "@/components/cards/DengueCard";
import FuelCard from "@/components/cards/FuelCard";
import FxCard from "@/components/cards/FxCard";
import HydroCard from "@/components/cards/HydroCard";
import MacroCard from "@/components/cards/MacroCard";
import NewsPulseCard from "@/components/cards/NewsPulseCard";
import PowerCard from "@/components/cards/PowerCard";
import SeismicWatchCard from "@/components/cards/SeismicWatchCard";
import WeatherCard from "@/components/cards/WeatherCard";
import AlertBanner from "@/components/AlertBanner";
import HolidayGlance from "@/components/HolidayGlance";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import SituationMapLoader from "@/components/maps/SituationMapLoader";
import { getAqiData } from "@/lib/aqi";
import { getBriefData } from "@/lib/brief";
import { getCseData, getCseSourceStatus } from "@/lib/cse";
import { getCricketData } from "@/lib/cricket";
import { getDengueData } from "@/lib/dengue";
import { getFuelData, getFuelSourceStatus } from "@/lib/fuel";
import { getFxData, getSourceStatuses } from "@/lib/fx";
import { getHydroData, getHydroSourceStatus } from "@/lib/hydro";
import { getMacroData } from "@/lib/macro";
import { getNewsData } from "@/lib/news";
import { getPowerData, getPowerSourceStatus } from "@/lib/power";
import { getSeismicWatchData } from "@/lib/seismic";
import { getSlcesiData } from "@/lib/slcesi";
import { getWeatherData } from "@/lib/weather";
import { getCoconutIndexData } from "@/lib/coconut-index";
import type { Metadata } from "next";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Lanka Monitor",
  description:
    "Real-time situational awareness for Sri Lanka — money, weather, power, health, news.",
  openGraph: {
    title: "Lanka Monitor",
    description:
      "The real-time daily-life dashboard for Sri Lanka — money, weather, power, health, news, cricket.",
    type: "website",
    images: ["/api/og"],
  },
};

export default async function Dashboard() {
  const [
    fx,
    cse,
    aqi,
    statuses,
    cseSource,
    slcesi,
    macro,
    hydro,
    hydroSource,
    seismic,
    fuel,
    fuelSource,
    weather,
    power,
    powerSource,
    news,
    brief,
    dengue,
    cricket,
  ] = await Promise.all([
    getFxData(),
    getCseData(),
    getAqiData(),
    getSourceStatuses(),
    getCseSourceStatus(),
    Promise.resolve(getSlcesiData()),
    Promise.resolve(getMacroData()),
    getHydroData(),
    getHydroSourceStatus(),
    getSeismicWatchData(),
    getFuelData(),
    getFuelSourceStatus(),
    getWeatherData(),
    getPowerData(),
    getPowerSourceStatus(),
    getNewsData(),
    getBriefData(),
    getDengueData(),
    getCricketData(),
  ]);

  const coconut = getCoconutIndexData();

  const cbsl = statuses?.find((s) => s.id === "cbsl_fx") ?? null;
  const openaq = statuses?.find((s) => s.id === "openaq_colombo") ?? null;

  const telegramUrl = process.env.NEXT_PUBLIC_TELEGRAM_URL ?? null;

  return (
    <main className="mx-auto max-w-5xl px-4 pb-10 pt-0 sm:px-6 sm:pb-12">
      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 -mx-4 mb-4 border-b border-panel-edge/60 bg-ink/90 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:mb-6 sm:px-6 sm:py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Lanka Monitor</h1>
            <p className="mt-0.5 text-sm text-text-dim">
              Sri Lanka, right now — money, weather, power, health, news.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 pt-1">
            {telegramUrl && (
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-text-dim underline decoration-panel-edge underline-offset-2 hover:text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                aria-label="Lanka Monitor Telegram channel"
              >
                Telegram
              </a>
            )}
            <a
              href="/health"
              className="text-xs text-text-dim underline decoration-panel-edge underline-offset-2 hover:text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Source health
            </a>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* ── Life-safety alert (hidden when quiet) ─────────────────────────── */}
      <AlertBanner seismic={seismic} />

      <HolidayGlance />

      <div className="mb-4">
        <SeismicWatchCard data={seismic} />
      </div>

      {/* ── Brief — full width ─────────────────────────────────────────────── */}
      {(brief.en || brief.si || brief.ta) && (
        <div className="mb-4">
          <BriefCard brief={brief} />
        </div>
      )}

      {/* ── Money cluster ─────────────────────────────────────────────────── */}
      <section aria-label="Economic indicators">
        <p className="mb-1.5 text-[11px] uppercase tracking-wide text-text-dim">
          Money
        </p>
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
          <FxCard fx={fx} source={cbsl} />
          <CseCard cse={cse} source={cseSource} />
          <FuelCard fuel={fuel} source={fuelSource} />
        </div>
      </section>

      {/* ── Operational cluster ───────────────────────────────────────────── */}
      <section aria-label="Operational status">
        <p className="mb-1.5 text-[11px] uppercase tracking-wide text-text-dim">
          Today
        </p>
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
          <WeatherCard weather={weather} />
          <PowerCard power={power} source={powerSource} />
          <CricketCard cricket={cricket} />
        </div>
      </section>

      {/* ── Situation map (replaces port demo) ────────────────────────────── */}
      <div className="mb-4">
        <p className="mb-1.5 text-[11px] uppercase tracking-wide text-text-dim">
          Map · weather, outages, quakes
        </p>
        <SituationMapLoader seismic={seismic} />
      </div>

      {/* ── Depth cards ───────────────────────────────────────────────────── */}
      <section aria-label="Depth data">
        <p className="mb-1.5 text-[11px] uppercase tracking-wide text-text-dim">
          Depth
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
          <NewsPulseCard news={news} />
          <DengueCard dengue={dengue} />
          <CostOfLivingCard data={slcesi} />
          <AqiCard aqi={aqi} source={openaq} />
          <MacroCard data={macro} />
          <HydroCard hydro={hydro} source={hydroSource} />
          <CoconutIndexCard data={coconut} />
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer
        className="mt-10 border-t border-panel-edge pt-4 text-xs text-text-dim"
        aria-label="Site footer"
      >
        <p>Data from public Sri Lankan institutions; credited per card.</p>
        <nav
          className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1"
          aria-label="Site links"
        >
          <a
            className="underline decoration-panel-edge underline-offset-2 hover:text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            href="https://github.com/Cookie-Cat21/lanka-monitor"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <span aria-hidden>·</span>
          <a
            className="underline decoration-panel-edge underline-offset-2 hover:text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            href="/docs"
          >
            API docs
          </a>
          <span aria-hidden>·</span>
          <a
            className="underline decoration-panel-edge underline-offset-2 hover:text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            href="/health"
          >
            Source health
          </a>
          <span aria-hidden>·</span>
          <a
            className="underline decoration-panel-edge underline-offset-2 hover:text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            href="https://github.com/Cookie-Cat21/lanka-monitor/blob/main/LICENSE"
            rel="noopener noreferrer"
          >
            MIT License
          </a>
          <span aria-hidden>·</span>
          <a
            className="underline decoration-panel-edge underline-offset-2 hover:text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            href="/llms.txt"
          >
            llms.txt
          </a>
        </nav>
      </footer>
    </main>
  );
}
