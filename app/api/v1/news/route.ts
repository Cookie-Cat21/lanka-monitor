import { NextResponse } from "next/server";
import { getNewsData } from "@/lib/news";

export const revalidate = 120;

export async function GET() {
  const news = await getNewsData();
  return NextResponse.json({
    generated_at: new Date().toISOString(),
    ...news,
  });
}
