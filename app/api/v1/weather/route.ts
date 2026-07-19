import { NextResponse } from "next/server";
import { getWeatherData } from "@/lib/weather";

export const revalidate = 1800;

export async function GET() {
  const weather = await getWeatherData();
  return NextResponse.json({
    generated_at: new Date().toISOString(),
    ...weather,
  });
}
