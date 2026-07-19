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
import SectionLabel from "@/components/SectionLabel";
import SiteHeader from "@/components/SiteHeader";
import SituationMapLoader from "@/components/maps/SituationMapLoader";
import { getAqiData } from "@/lib/aqi";
import { getBriefData } from "@/lib/brief";
import { getCoconutIndexData } from "@/lib/coconut-index";
import { getCricketData } from "@/lib/cricket";
import { getCseData, getCseSourceStatus } from "@/lib/cse";
import { getDengueData } from "@/lib/dengue";
import { getFuelData, getFuelSourceStatus } from "@/lib/fuel";
import { getFxData, getSourceStatuses } from "@/lib/fx";
import { getHydroData, getHydroSourceStatus } from "@/lib/hydro";
import { getMacroData } from "@/lib/macro";
import { getNewsData } from "@/lib/news";
import { getPowerData, getPowerSourceStatus } from "@/lib/power";
import { getSeismicWatchData } from "@/lib/seismic";
import { getSlcesiData } from "@/lib/slcesi";
import { getWeatherData, getWeatherSourceStatus } from "@/lib/weather";
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
    weatherSource,
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
    getWeatherSourceStatus(),
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
    <main className="mx-auto max-w-5xl px-4 pb-14 pt-5 sm:px-6 sm:pt-8">
      <SiteHeader telegramUrl={telegramUrl} />

      <AlertBanner seismic={seismic} />
      <HolidayGlance />
      <SeismicWatchCard data={seismic} />

      {(brief.en || brief.si || brief.ta) && (
        <div className="mb-5">
          <BriefCard brief={brief} />
        </div>
      )}

      <section aria-label="Economic indicators" className="mb-6">
        <SectionLabel id="money">Money</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
          <FxCard fx={fx} source={cbsl} />
          <CseCard cse={cse} source={cseSource} />
          <FuelCard fuel={fuel} source={fuelSource} />
        </div>
      </section>

      <section aria-label="Operational status" className="mb-6">
        <SectionLabel>Today</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
          <WeatherCard weather={weather} source={weatherSource} />
          <PowerCard power={power} source={powerSource} />
          <CricketCard cricket={cricket} />
        </div>
      </section>

      <section aria-label="Situation map" className="mb-6">
        <SectionLabel>Map · weather, outages, quakes</SectionLabel>
        <SituationMapLoader seismic={seismic} />
      </section>

      <section aria-label="Depth data" className="mb-2">
        <SectionLabel>Depth</SectionLabel>
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

      <footer
        className="mt-12 border-t border-panel-edge pt-5 text-xs text-muted"
        aria-label="Site footer"
      >
        <p className="font-medium text-ink-soft">
          Data from public Sri Lankan institutions; credited per card.
        </p>
        <nav
          className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1"
          aria-label="Site links"
        >
          {[
            ["GitHub", "https://github.com/Cookie-Cat21/lanka-monitor"],
            ["API docs", "/docs"],
            ["Source health", "/health"],
            [
              "MIT License",
              "https://github.com/Cookie-Cat21/lanka-monitor/blob/main/LICENSE",
            ],
            ["llms.txt", "/llms.txt"],
          ].map(([label, href], i, arr) => (
            <span key={href} className="inline-flex items-center gap-x-3">
              <a
                className="link-quiet"
                href={href}
                {...(href.startsWith("http")
                  ? { rel: "noopener noreferrer" }
                  : {})}
              >
                {label}
              </a>
              {i < arr.length - 1 ? <span aria-hidden>·</span> : null}
            </span>
          ))}
        </nav>
      </footer>
    </main>
  );
}
