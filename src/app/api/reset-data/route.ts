import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id");
  const type = request.nextUrl.searchParams.get("type"); // meals | workouts | all

  if (!userId || !type) {
    return NextResponse.json({ error: "user_id and type required" }, { status: 400 });
  }

  const errors: string[] = [];

  if (type === "meals" || type === "all") {
    const { error } = await supabase.from("meals").delete().eq("user_id", userId);
    if (error) errors.push(`meals: ${error.message}`);
  }

  if (type === "workouts" || type === "all") {
    const { error } = await supabase.from("workouts").delete().eq("user_id", userId);
    if (error) errors.push(`workouts: ${error.message}`);
  }

  if (type === "all") {
    const { error: wErr } = await supabase.from("water_logs").delete().eq("user_id", userId);
    if (wErr) errors.push(`water: ${wErr.message}`);
    const { error: wtErr } = await supabase.from("weight_logs").delete().eq("user_id", userId);
    if (wtErr) errors.push(`weight: ${wtErr.message}`);
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
