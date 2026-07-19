import { ImageResponse } from "next/og";
import { getFxData } from "@/lib/fx";

export const runtime = "edge";
export const revalidate = 300;

export async function GET() {
  const fx = await getFxData();
  const rate = fx.latest?.sell ?? null;
  const rateStr = rate != null ? rate.toFixed(2) : "—";
  const date =
    fx.latest?.observed_at.slice(0, 10) ??
    new Date().toISOString().slice(0, 10);

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0b1016",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "64px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Top label */}
        <div
          style={{
            fontSize: 18,
            color: "#a8b4c4",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Lanka Monitor · USD / LKR
        </div>

        {/* Big rate */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: "#f1f5f9",
            lineHeight: 1,
            marginBottom: 16,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {rateStr}
        </div>

        {/* Selling label */}
        <div style={{ fontSize: 22, color: "#a8b4c4", marginBottom: 40 }}>
          Selling rate · CBSL
        </div>

        {/* Footer row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 18,
            color: "#64748b",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              background: "#34d399",
            }}
          />
          <span>lanka-monitor.vercel.app</span>
          <span style={{ color: "#1c2634" }}>·</span>
          <span>{date}</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
