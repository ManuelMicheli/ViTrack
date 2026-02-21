import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const telegramId = searchParams.get("telegram_id");
  const id = searchParams.get("id");

  if (!telegramId && !id) {
    return NextResponse.json(
      { error: "telegram_id or id required" },
      { status: 400 }
    );
  }

  let query = supabaseAdmin.from("users").select("*");

  if (id) {
    query = query.eq("id", id);
  } else {
    query = query.eq("telegram_id", parseInt(telegramId!));
  }

  const { data, error } = await query.single();

  if (error || !data) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function PATCH(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const body = await request.json();
  const allowedFields = [
    "first_name",
    "username",
    "email",
    "date_of_birth",
    "gender",
    "activity_level",
    "dietary_preferences",
    "avatar_url",
    "theme",
    "unit_system",
    "language",
    "notifications_enabled",
    "daily_calorie_goal",
    "protein_goal",
    "carbs_goal",
    "fat_goal",
    "water_goal_ml",
    "water_tracking_mode",
    "weight_goal_kg",
    "height_cm",
    "telegram_id",
    "accent_color",
    "layout_mode",
    "section_order",
  ];
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
