import { NextResponse } from "next/server";
import { getCricketData } from "@/lib/cricket";

export const revalidate = 120;

export async function GET() {
  const cricket = await getCricketData();
  return NextResponse.json({
    generated_at: new Date().toISOString(),
    ...cricket,
  });
}
