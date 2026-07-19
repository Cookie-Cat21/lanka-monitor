"use client";

import { Cloud, CloudRain, Droplets, Wind } from "lucide-react";
import CardShell from "@/components/CardShell";
import type { SourceStatus, WeatherData } from "@/lib/types";

function WeatherCodeIcon({ code }: { code: number }) {
  if (code >= 51) {
    return <CloudRain className="h-8 w-8 text-lagoon" strokeWidth={1.5} aria-hidden />;
  }
  return <Cloud className="h-8 w-8 text-muted" strokeWidth={1.5} aria-hidden />;
}

export default function WeatherCard({
  weather,
  source,
}: {
  weather: WeatherData;
  source?: SourceStatus | null;
}) {
  const c = weather.current;
  const status = source?.status ?? (c ? "fresh" : "down");

  return (
    <CardShell
      title="Weather"
      subtitle={weather.location}
      status={status}
      lastSuccessAt={source?.last_success_at ?? c?.observed_at ?? null}
      footer={
        c ? (
          <>
            Open-Meteo · observed{" "}
            <time className="tabular">
              {c.observed_at.slice(0, 16).replace("T", " ")}
            </time>
          </>
        ) : undefined
      }
    >
      {c ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <WeatherCodeIcon code={c.weather_code} />
            <div>
              <div className="kpi-value text-4xl font-semibold leading-none text-ink">
                {c.temp_c.toFixed(1)}
                <span className="ml-0.5 text-lg font-normal text-muted">°C</span>
              </div>
              <div className="mt-0.5 text-xs text-muted">{c.weather_label}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="flex items-center gap-1.5">
              <CloudRain className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
              <div>
                <div className="tabular text-sm font-medium">
                  {c.rain_mm.toFixed(1)} mm
                </div>
                {weather.precip_pct_next6h !== null && (
                  <div className="text-[10px] text-muted">
                    {weather.precip_pct_next6h}% rain chance
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Wind className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
              <div>
                <div className="tabular text-sm font-medium">
                  {c.wind_kmh.toFixed(0)} km/h
                </div>
                <div className="text-[10px] text-muted">wind</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Droplets className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
              <div>
                <div className="tabular text-sm font-medium">{c.humidity_pct}%</div>
                <div className="text-[10px] text-muted">humidity</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-6 text-sm text-muted">
          Weather data unavailable — source is{" "}
          <span className="text-down">{status}</span>. This card refuses to guess.
        </div>
      )}
    </CardShell>
  );
}
