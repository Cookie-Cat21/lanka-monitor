import { NextResponse } from "next/server";
import { getFuelData, getFuelSourceStatus } from "@/lib/fuel";

export const revalidate = 300;

export async function GET() {
  const [fuel, source] = await Promise.all([getFuelData(), getFuelSourceStatus()]);
  return NextResponse.json({
    generated_at: new Date().toISOString(),
    source,
    ...fuel,
  });
}
