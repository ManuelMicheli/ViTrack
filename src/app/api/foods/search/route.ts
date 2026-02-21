import { searchFoods } from "@/lib/food-search";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { query } = await request.json();

  if (!query || typeof query !== "string" || query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchFoods(query.trim());
  return NextResponse.json({ results });
}
