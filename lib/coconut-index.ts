/** HARTI retail coconut price — meme-friendly single-number food pulse. */

export interface CoconutIndexData {
  /** Retail price in Sri Lankan rupees per large coconut. */
  price: number;
  /** Change vs previous observation (same units). */
  delta: number;
  asOf: string;
  market: string;
  commodity: string;
  series: number[];
  /** True until HARTI ingest ships — card shows demo with stale badge. */
  demo: boolean;
}

export const COCONUT_SOURCE = {
  id: "harti_food_prices",
  label: "HARTI Daily Food Commodities Bulletin",
  url: "https://www.harti.gov.lk/index.php/en/market-information/daily-price.php",
} as const;

/** Illustrative Colombo retail readings until HARTI worker lands. */
export function getCoconutIndexData(): CoconutIndexData {
  const series = [142, 148, 151, 155, 158, 162, 168, 171, 175, 178, 182, 185];
  const price = series[series.length - 1];
  const prev = series[series.length - 2];

  return {
    price,
    delta: price - prev,
    asOf: "2026-07-18",
    market: "Colombo retail",
    commodity: "Coconut — large",
    series,
    demo: true,
  };
}

export function coconutShareText(data: CoconutIndexData, origin = ""): string {
  const sign = data.delta > 0 ? "+" : "";
  const url = origin ? `${origin}/coconut` : "https://lanka-monitor.vercel.app/coconut";
  return `🥥 Coconut Index Rs ${data.price} (${sign}${data.delta} vs prior) · ${data.asOf} · ${url}`;
}
