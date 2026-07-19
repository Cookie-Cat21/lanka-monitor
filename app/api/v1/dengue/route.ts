import { NextResponse } from "next/server";
import { getDengueData } from "@/lib/dengue";

export const revalidate = 1800;

export async function GET() {
  const dengue = await getDengueData();
  return NextResponse.json({
    generated_at: new Date().toISOString(),
    ...dengue,
  });
}
