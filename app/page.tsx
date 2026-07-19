import AqiCard from "@/components/cards/AqiCard";
import CostOfLivingCard from "@/components/cards/CostOfLivingCard";
import CseCard from "@/components/cards/CseCard";
import FxCard from "@/components/cards/FxCard";
import HydroCard from "@/components/cards/HydroCard";
import MacroCard from "@/components/cards/MacroCard";
import PlaceholderCard from "@/components/cards/PlaceholderCard";
import SeismicWatchCard from "@/components/cards/SeismicWatchCard";
import HolidayGlance from "@/components/HolidayGlance";
import ColomboPortMap from "@/components/maps/ColomboPortMapLoader";
import { getAqiData } from "@/lib/aqi";
import { getCseData, getCseSourceStatus } from "@/lib/cse";
import { getFxData, getSourceStatuses } from "@/lib/fx";
import { getHydroData, getHydroSourceStatus } from "@/lib/hydro";
import { getMacroData } from "@/lib/macro";
import { getSeismicWatchData } from "@/lib/seismic";
import { getSlcesiData } from "@/lib/slcesi";

export const revalidate = 300;

const PLACEHOLDERS = [
  { title: "Weather", detail: "Forecasts and warnings from the Department of Meteorology." },
  { title: "Power cuts", detail: "Scheduled interruptions from CEB / PUCSL — follows hydro shortfall." },
  { title: "News pulse", detail: "Clustered headlines from Sri Lankan outlets." },
  { title: "Cricket", detail: "Live scores when Sri Lanka is playing." },
];

export default async function Dashboard() {
  const [fx, cse, aqi, statuses, cseSource, slcesi, macro, hydro, hydroSource, seismic] =
    await Promise.all([
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
    ]);
  const cbsl = statuses?.find((s) => s.id === "cbsl_fx") ?? null;
  const openaq = statuses?.find((s) => s.id === "openaq_colombo") ?? null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-lg font-semibold tracking-tight">Lanka Monitor</h1>
        <p className="mt-1 text-sm text-text-dim">
          Sri Lanka, right now — money, weather, power, health, news.
        </p>
      </header>

      <HolidayGlance />

      <div className="mb-4">
        <SeismicWatchCard data={seismic} />
      </div>

      <ColomboPortMap />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
        <CostOfLivingCard data={slcesi} />
        <FxCard fx={fx} source={cbsl} />
        <AqiCard aqi={aqi} source={openaq} />
        <CseCard cse={cse} source={cseSource} />
        <MacroCard data={macro} />
        <HydroCard hydro={hydro} source={hydroSource} />
        {PLACEHOLDERS.map((p, i) => (
          <PlaceholderCard key={p.title} title={p.title} detail={p.detail} index={i} />
        ))}
      </div>

      <footer className="mt-10 border-t border-panel-edge pt-4 text-xs text-text-dim">
        Data from public Sri Lankan institutions, credited per card.{" "}
        <a
          className="underline decoration-panel-edge underline-offset-2 hover:text-zinc-300"
          href="https://github.com/Cookie-Cat21/lanka-monitor"
        >
          Source on GitHub
        </a>
        {" · "}
        <a
          className="underline decoration-panel-edge underline-offset-2 hover:text-zinc-300"
          href="/docs"
        >
          API docs
        </a>
        {" · "}
        <a
          className="underline decoration-panel-edge underline-offset-2 hover:text-zinc-300"
          href="/api/v1/health"
        >
          Source health
        </a>
      </footer>
    </main>
  );
}
