import { NextResponse } from "next/server";
import { getCseData, getCseSourceStatus } from "@/lib/cse";

export const revalidate = 300;

export async function GET() {
  const [cse, source] = await Promise.all([getCseData(), getCseSourceStatus()]);
  return NextResponse.json({
    generated_at: new Date().toISOString(),
    source,
    ...cse,
  });
}
