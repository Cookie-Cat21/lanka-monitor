import FxCard from "@/components/cards/FxCard";
import PlaceholderCard from "@/components/cards/PlaceholderCard";
import { getFxData, getSourceStatuses } from "@/lib/fx";

export const revalidate = 300;

const PLACEHOLDERS = [
  { title: "Weather", detail: "Forecasts and warnings from the Department of Meteorology." },
  { title: "Power", detail: "Scheduled power interruptions from CEB / PUCSL." },
  { title: "Fuel", detail: "CEYPETCO pump prices — petrol, diesel, kerosene." },
  { title: "Health", detail: "Dengue and disease surveillance from the Epidemiology Unit." },
  { title: "News pulse", detail: "Clustered headlines from Sri Lankan outlets." },
  { title: "Cricket", detail: "Live scores when Sri Lanka is playing." },
];

export default async function Dashboard() {
  const [fx, statuses] = await Promise.all([getFxData(), getSourceStatuses()]);
  const cbsl = statuses?.find((s) => s.id === "cbsl_fx") ?? null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-lg font-semibold tracking-tight">Lanka Monitor</h1>
        <p className="mt-1 text-sm text-text-dim">
          Sri Lanka, right now — money, weather, power, health, news.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
        <FxCard fx={fx} source={cbsl} />
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
          href="/api/v1/health"
        >
          Source health
        </a>
      </footer>
    </main>
  );
}
