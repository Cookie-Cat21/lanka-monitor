import { NextResponse } from "next/server";
import { getBriefData } from "@/lib/brief";

export const revalidate = 120;

export async function GET() {
  const brief = await getBriefData();
  return NextResponse.json({
    generated_at: new Date().toISOString(),
    ...brief,
  });
}
