import { NextResponse } from "next/server";
import { getFxData, getSourceStatuses } from "@/lib/fx";

export const revalidate = 300;

export async function GET() {
  const [fx, statuses] = await Promise.all([getFxData(), getSourceStatuses()]);
  const source = statuses?.find((s) => s.id === "cbsl_fx") ?? null;
  return NextResponse.json({
    generated_at: new Date().toISOString(),
    source,
    ...fx,
  });
}
