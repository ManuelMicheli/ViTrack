import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id");
  if (!userId) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("workouts")
    .select("exercises")
    .eq("user_id", userId)
    .not("exercises", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const nameSet = new Set<string>();
  for (const row of data ?? []) {
    const exercises = row.exercises as { name: string }[] | null;
    if (exercises) {
      for (const ex of exercises) {
        if (ex.name) nameSet.add(ex.name);
      }
    }
  }

  return NextResponse.json([...nameSet].sort());
}
