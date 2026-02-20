import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return Response.json({ error: "user_id required" }, { status: 400 });
  }

  // Fetch all user data in parallel
  const [userRes, mealsRes, workoutsRes, waterRes, weightRes, chatRes] =
    await Promise.all([
      supabaseAdmin.from("users").select("*").eq("id", userId).single(),
      supabaseAdmin.from("meals").select("*").eq("user_id", userId).order("logged_at", { ascending: false }),
      supabaseAdmin.from("workouts").select("*").eq("user_id", userId).order("logged_at", { ascending: false }),
      supabaseAdmin.from("water_logs").select("*").eq("user_id", userId).order("date", { ascending: false }),
      supabaseAdmin.from("weight_logs").select("*").eq("user_id", userId).order("logged_at", { ascending: false }),
      supabaseAdmin.from("chat_messages").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    user: userRes.data,
    meals: mealsRes.data || [],
    workouts: workoutsRes.data || [],
    water_logs: waterRes.data || [],
    weight_logs: weightRes.data || [],
    chat_messages: chatRes.data || [],
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="vitrack-export-${userId}.json"`,
    },
  });
}
