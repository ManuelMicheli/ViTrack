import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id");
  const type = request.nextUrl.searchParams.get("type"); // meals | workouts | all

  if (!userId || !type) {
    return NextResponse.json({ error: "user_id and type required" }, { status: 400 });
  }

  const errors: string[] = [];
  let totalDeleted = 0;

  if (type === "meals" || type === "all") {
    const { data, error } = await supabaseAdmin
      .from("meals")
      .delete()
      .eq("user_id", userId)
      .select("id");
    if (error) errors.push(`meals: ${error.message}`);
    else totalDeleted += (data?.length || 0);
  }

  if (type === "workouts" || type === "all") {
    const { data, error } = await supabaseAdmin
      .from("workouts")
      .delete()
      .eq("user_id", userId)
      .select("id");
    if (error) errors.push(`workouts: ${error.message}`);
    else totalDeleted += (data?.length || 0);
  }

  if (type === "all") {
    const { data: waterData, error: wErr } = await supabaseAdmin
      .from("water_logs")
      .delete()
      .eq("user_id", userId)
      .select("id");
    if (wErr) errors.push(`water: ${wErr.message}`);
    else totalDeleted += (waterData?.length || 0);

    const { data: weightData, error: wtErr } = await supabaseAdmin
      .from("weight_logs")
      .delete()
      .eq("user_id", userId)
      .select("id");
    if (wtErr) errors.push(`weight: ${wtErr.message}`);
    else totalDeleted += (weightData?.length || 0);
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join("; "), deleted: totalDeleted }, { status: 500 });
  }

  return NextResponse.json({ success: true, deleted: totalDeleted });
}
