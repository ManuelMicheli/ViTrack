import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id");
  const date = request.nextUrl.searchParams.get("date");

  if (!userId || !date) {
    return NextResponse.json({ error: "user_id and date required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("water_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || { glasses: 0, date });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { user_id, glasses, date } = body;

  if (!user_id || glasses == null || !date) {
    return NextResponse.json({ error: "user_id, glasses, date required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("water_logs")
    .upsert({ user_id, glasses, date }, { onConflict: "user_id,date" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
