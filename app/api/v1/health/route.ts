import { NextResponse } from "next/server";
import { dbConfigured } from "@/lib/db";
import { getSourceStatuses } from "@/lib/fx";

export const revalidate = 120;

export async function GET() {
  if (!dbConfigured()) {
    return NextResponse.json(
      { generated_at: new Date().toISOString(), configured: false, sources: [] },
      { status: 503 }
    );
  }
  const sources = await getSourceStatuses();
  if (!sources) {
    return NextResponse.json(
      { generated_at: new Date().toISOString(), configured: true, sources: [], error: "database unreachable" },
      { status: 503 }
    );
  }
  return NextResponse.json({
    generated_at: new Date().toISOString(),
    configured: true,
    sources,
  });
}
