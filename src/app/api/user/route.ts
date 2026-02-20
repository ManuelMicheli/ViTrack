import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const telegramId = request.nextUrl.searchParams.get("telegram_id");

  if (!telegramId) {
    return NextResponse.json(
      { error: "telegram_id is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("telegram_id", parseInt(telegramId))
    .single();

  if (error) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const body = await request.json();
  const allowedFields = ["daily_calorie_goal", "water_goal_ml", "water_tracking_mode", "weight_goal_kg", "height_cm"];
  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
