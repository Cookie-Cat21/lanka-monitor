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

/** S-tier / Phase 1–2 placeholders — build before Phase 5 depth cards. */
const PLACEHOLDERS = [
  {
    title: "Weather",
    detail: "Forecasts and warnings from the Department of Meteorology.",
  },
  {
    title: "Power cuts",
    detail: "Scheduled interruptions from CEB — idle-cheap until crisis week.",
  },
  {
    title: "Fuel",
    detail: "CEYPETCO pump prices — petrol, diesel, kerosene (Octane).",
  },
  {
    title: "News pulse",
    detail: "Clustered headlines from Sri Lankan outlets — Phase 3 brief feed.",
  },
  {
    title: "Cricket",
    detail: "Live scores when Sri Lanka is playing.",
  },
  {
    title: "Health",
    detail: "Dengue and disease surveillance from the Epidemiology Unit.",
  },
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
    <main className="mx-auto max-w-5xl px-4 pb-10 pt-0 sm:px-6 sm:pb-12">
      <header className="sticky top-0 z-10 -mx-4 mb-4 border-b border-panel-edge/60 bg-ink/90 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:mb-6 sm:px-6 sm:py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Lanka Monitor</h1>
            <p className="mt-0.5 text-sm text-text-dim">
              Sri Lanka, right now — money, weather, power, health, news.
            </p>
          </div>
          <a
            href="/health"
            className="shrink-0 pt-1 text-xs text-text-dim underline decoration-panel-edge underline-offset-2 hover:text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Source health
          </a>
        </div>
      </header>

      <HolidayGlance />

      <div className="mb-4">
        <SeismicWatchCard data={seismic} />
      </div>

      {/* Money cluster — Phase 1 product surface */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
        <FxCard fx={fx} source={cbsl} />
        <CseCard cse={cse} source={cseSource} />
        {PLACEHOLDERS.filter((p) =>
          ["Weather", "Power cuts", "Fuel", "Cricket"].includes(p.title),
        ).map((p, i) => (
          <PlaceholderCard key={p.title} title={p.title} detail={p.detail} index={i} />
        ))}
      </div>

      {/* Port visual — labelled demo until AIS ingest */}
      <div className="mb-4">
        <p className="mb-1.5 text-[11px] uppercase tracking-wide text-text-dim">
          Port of Colombo · demo density · AIS ingest pending
        </p>
        <ColomboPortMap />
      </div>

      {/* Phase 5 depth scaffolds — clearly secondary until retention proven */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
        <CostOfLivingCard data={slcesi} />
        <AqiCard aqi={aqi} source={openaq} />
        <MacroCard data={macro} />
        <HydroCard hydro={hydro} source={hydroSource} />
        {PLACEHOLDERS.filter((p) =>
          ["News pulse", "Health"].includes(p.title),
        ).map((p, i) => (
          <PlaceholderCard
            key={p.title}
            title={p.title}
            detail={p.detail}
            index={i + 4}
          />
        ))}
      </div>

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
