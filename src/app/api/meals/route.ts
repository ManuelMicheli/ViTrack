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
    .from("meals")
    .select("*")
    .eq("user_id", userId)
    .order("logged_at", { ascending: true });

  if (date) {
    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;
    query = query.gte("logged_at", startOfDay).lte("logged_at", endOfDay);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { user_id, description, calories, protein_g, carbs_g, fat_g, fiber_g, meal_type } = body;

  if (!user_id || !description || calories == null || !meal_type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("meals")
    .insert({ user_id, description, calories, protein_g, carbs_g, fat_g, fiber_g, meal_type })
    .select()
    .single();

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
    .from("meals")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
