import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id");
  const limit = request.nextUrl.searchParams.get("limit") || "30";
  const days = request.nextUrl.searchParams.get("days");

  if (!userId) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  let query = supabaseAdmin
    .from("weight_logs")
    .select("*")
    .eq("user_id", userId)
    .order("logged_at", { ascending: false });

  if (days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    query = query.gte("logged_at", startDate.toISOString());
  } else {
    query = query.limit(parseInt(limit));
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { user_id, weight_kg } = body;

  if (!user_id || !weight_kg) {
    return NextResponse.json({ error: "user_id and weight_kg required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("weight_logs")
    .insert({ user_id, weight_kg })
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
    .from("weight_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
