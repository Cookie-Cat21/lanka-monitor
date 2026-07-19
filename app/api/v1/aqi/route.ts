import { NextResponse } from "next/server";
import { getAqiData, getSourceStatuses } from "@/lib/aqi";

export const revalidate = 300;

export async function GET() {
  const [aqi, statuses] = await Promise.all([getAqiData(), getSourceStatuses()]);
  const source = statuses?.find((s) => s.id === "openaq_colombo") ?? null;
  return NextResponse.json({
    generated_at: new Date().toISOString(),
    source,
    ...aqi,
  });
}
