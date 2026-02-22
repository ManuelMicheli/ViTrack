import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

interface ExerciseEntry {
  name: string;
  sets?: number;
  reps?: number;
  weight_kg?: number | null;
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id");
  const exercise = request.nextUrl.searchParams.get("exercise");

  if (!userId || !exercise) {
    return NextResponse.json({ error: "user_id and exercise required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("workouts")
    .select("id, logged_at, exercises")
    .eq("user_id", userId)
    .not("exercises", "is", null)
    .order("logged_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const lowerExercise = exercise.toLowerCase();
  const points: { date: string; weight_kg: number; sets: number; reps: number; volume: number }[] = [];

  for (const row of data ?? []) {
    const exercises = row.exercises as ExerciseEntry[] | null;
    if (!exercises) continue;

    for (const ex of exercises) {
      if (ex.name.toLowerCase() === lowerExercise && ex.weight_kg) {
        const volume = (ex.sets ?? 1) * (ex.reps ?? 1) * (ex.weight_kg ?? 0);
        points.push({
          date: row.logged_at,
          weight_kg: ex.weight_kg,
          sets: ex.sets ?? 0,
          reps: ex.reps ?? 0,
          volume,
        });
      }
    }
  }

  return NextResponse.json(points);
}
