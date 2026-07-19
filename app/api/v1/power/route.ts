import { NextResponse } from "next/server";
import { getPowerData, getPowerSourceStatus } from "@/lib/power";

export const revalidate = 120;

export async function GET() {
  const [power, source] = await Promise.all([getPowerData(), getPowerSourceStatus()]);
  return NextResponse.json({
    generated_at: new Date().toISOString(),
    source,
    ...power,
  });
}
