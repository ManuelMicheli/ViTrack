import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id");
  const date = request.nextUrl.searchParams.get("date");

  if (!userId) {
    return NextResponse.json(
      { error: "user_id is required" },
      { status: 400 }
    );
  }

  let query = supabaseAdmin
    .from("workouts")
    .select("*")
    .eq("user_id", userId)
    .order("logged_at", { ascending: true });

  if (date) {
    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;
    query = query.gte("logged_at", startOfDay).lte("logged_at", endOfDay);
  }

  const range = request.nextUrl.searchParams.get("range");
  if (!date && range) {
    const days = parseInt(range, 10);
    if (!isNaN(days) && days > 0) {
      const since = new Date();
      since.setDate(since.getDate() - days);
      query = query.gte("logged_at", since.toISOString());
    }
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const userId = request.nextUrl.searchParams.get("user_id");

  if (!id || !userId) {
    return NextResponse.json({ error: "id and user_id required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("workouts")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function POST(request: NextRequest) {
  let body: {
    user_id: string;
    description: string;
    workout_type: string;
    duration_min?: number | null;
    calories_burned?: number | null;
    exercises?: { name: string; sets?: number; reps?: number; weight_kg?: number | null }[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.user_id || !body.description || !body.workout_type) {
    return NextResponse.json({ error: "user_id, description, workout_type required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("workouts")
    .insert({
      user_id: body.user_id,
      description: body.description,
      workout_type: body.workout_type,
      duration_min: body.duration_min ?? null,
      calories_burned: body.calories_burned ?? null,
      exercises: body.exercises ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
