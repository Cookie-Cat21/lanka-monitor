"use client";

import { CloudRain, Wind, Thermometer, Droplets } from "lucide-react";
import CardShell from "@/components/CardShell";
import type { WeatherData } from "@/lib/types";

function WeatherCodeIcon({ code }: { code: number }) {
  if (code >= 95) return <span className="text-2xl" aria-hidden>⛈️</span>;
  if (code >= 80) return <span className="text-2xl" aria-hidden>🌧️</span>;
  if (code >= 61) return <span className="text-2xl" aria-hidden>🌧️</span>;
  if (code >= 51) return <span className="text-2xl" aria-hidden>🌦️</span>;
  if (code >= 45) return <span className="text-2xl" aria-hidden>🌫️</span>;
  if (code === 3) return <span className="text-2xl" aria-hidden>☁️</span>;
  if (code === 2) return <span className="text-2xl" aria-hidden>⛅</span>;
  return <span className="text-2xl" aria-hidden>☀️</span>;
}

export default function WeatherCard({ weather }: { weather: WeatherData }) {
  const c = weather.current;
  const status = c ? "fresh" : "down";

  return (
    <CardShell
      title="Weather"
      subtitle={weather.location}
      status={status}
      lastSuccessAt={c?.observed_at ?? null}
      footer={
        c ? (
          <>
            Open-Meteo · observed{" "}
            <time className="tabular">{c.observed_at.slice(0, 16).replace("T", " ")}</time>
          </>
        ) : undefined
      }
    >
      {c ? (
        <div className="space-y-3">
          {/* Hero: temperature + condition */}
          <div className="flex items-center gap-3">
            <WeatherCodeIcon code={c.weather_code} />
            <div>
              <div className="tabular text-3xl font-semibold leading-none">
                {c.temp_c.toFixed(1)}
                <span className="ml-0.5 text-lg font-normal text-text-dim">°C</span>
              </div>
              <div className="mt-0.5 text-xs text-zinc-400">{c.weather_label}</div>
            </div>
          </div>

          {/* Secondary metrics row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex items-center gap-1.5">
              <CloudRain className="h-3.5 w-3.5 shrink-0 text-text-dim" aria-hidden />
              <div>
                <div className="tabular text-sm font-medium">{c.rain_mm.toFixed(1)} mm</div>
                {weather.precip_pct_next6h !== null && (
                  <div className="text-[10px] text-text-dim">
                    {weather.precip_pct_next6h}% next 6 h
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Wind className="h-3.5 w-3.5 shrink-0 text-text-dim" aria-hidden />
              <div>
                <div className="tabular text-sm font-medium">{c.wind_kmh.toFixed(0)} km/h</div>
                <div className="text-[10px] text-text-dim">wind</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Droplets className="h-3.5 w-3.5 shrink-0 text-text-dim" aria-hidden />
              <div>
                <div className="tabular text-sm font-medium">{c.humidity_pct}%</div>
                <div className="text-[10px] text-text-dim">humidity</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-6 text-sm text-text-dim">
          Weather data unavailable — Open-Meteo unreachable. This card refuses
          to guess.
        </div>
      )}
    </CardShell>
  );
}
