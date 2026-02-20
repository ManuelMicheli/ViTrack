import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id");
  const date = request.nextUrl.searchParams.get("date");
  const days = request.nextUrl.searchParams.get("days");

  if (!userId) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  // Fetch history for sparkline
  if (days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days) + 1);
    const { data, error } = await supabaseAdmin
      .from("water_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate.toISOString().split("T")[0])
      .order("date", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data || []);
  }

  // Fetch single day
  if (!date) {
    return NextResponse.json({ error: "date or days required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("water_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || { glasses: 0, ml: 0, date });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { user_id, glasses, ml, date } = body;

  if (!user_id || !date) {
    return NextResponse.json({ error: "user_id and date required" }, { status: 400 });
  }

  const upsertData: Record<string, unknown> = { user_id, date };
  if (glasses != null) upsertData.glasses = glasses;
  if (ml != null) upsertData.ml = ml;

  const { data, error } = await supabaseAdmin
    .from("water_logs")
    .upsert(upsertData, { onConflict: "user_id,date" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
