import { NextRequest } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { buildAIContext } from "@/ai/context-builder";
import { buildAISystemPrompt } from "@/ai/system-prompt";
import { chatWithAI } from "@/ai/ai-client";

// Helper: get current day calorie/macro status for meal_logged cards
async function getDayStatus(userId: string) {
  const italianNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" })
  );
  const todayDate = italianNow.toISOString().split("T")[0];
  const startOfDay = `${todayDate}T00:00:00.000Z`;
  const endOfDay = `${todayDate}T23:59:59.999Z`;

  const [mealsRes, userRes] = await Promise.all([
    supabase
      .from("meals")
      .select("calories, protein_g, carbs_g, fat_g")
      .eq("user_id", userId)
      .gte("logged_at", startOfDay)
      .lte("logged_at", endOfDay),
    supabase
      .from("users")
      .select("daily_calorie_goal, protein_goal, carbs_goal, fat_goal")
      .eq("id", userId)
      .single(),
  ]);

  const meals = mealsRes.data ?? [];
  let totalCal = 0, totalProt = 0, totalCarbs = 0, totalFat = 0;
  for (const m of meals) {
    totalCal += (m as Record<string, number>).calories || 0;
    totalProt += (m as Record<string, number>).protein_g || 0;
    totalCarbs += (m as Record<string, number>).carbs_g || 0;
    totalFat += (m as Record<string, number>).fat_g || 0;
  }

  const targetCal = userRes.data?.daily_calorie_goal ?? 2000;
  const targetProt = userRes.data?.protein_goal ?? 150;
  const targetCarbs = userRes.data?.carbs_goal ?? 200;
  const targetFat = userRes.data?.fat_goal ?? 65;

  return {
    total_calories: Math.round(totalCal),
    target_calories: targetCal,
    remaining_calories: targetCal - Math.round(totalCal),
    total_protein: Math.round(totalProt),
    target_protein: targetProt,
    total_carbs: Math.round(totalCarbs),
    target_carbs: targetCarbs,
    total_fat: Math.round(totalFat),
    target_fat: targetFat,
  };
}

export async function POST(request: NextRequest) {
  const { user_id, message } = await request.json();

  if (!user_id || !message?.trim()) {
    return new Response("user_id and message required", { status: 400 });
  }

  const text = message.trim();

  // Build context BEFORE saving user message to avoid duplicate in history
  const ctx = await buildAIContext(user_id);
  const systemPrompt = buildAISystemPrompt(ctx);

  // Save user message (after context build so it's not in recentMessages)
  await supabase.from("chat_messages").insert({
    user_id,
    role: "user",
    content: text,
    message_type: "text",
    source: "web",
  });

  // Build conversation history
  const history = [
    ...(ctx?.recentMessages ?? []),
    { role: "user", content: text },
  ];

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await chatWithAI({
          messages: history,
          systemPrompt,
          userId: user_id,
          stream: true,
          callbacks: {
            onTextDelta: (delta) => {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "delta", content: delta })}\n\n`
                )
              );
            },
            onToolCall: (name) => {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "tool_call", name })}\n\n`
                )
              );
            },
            onToolResult: (name, res) => {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "tool_result",
                    name,
                    success: res.success,
                    data: res.data ?? null,
                  })}\n\n`
                )
              );
            },
          },
        });

        // Determine message type and build metadata for rich cards
        let messageType = "text";
        let metadata: Record<string, unknown> = {
          toolCalls: result.toolCalls.map((tc) => tc.name),
        };

        if (result.toolCalls.length > 0) {
          const lastTool = result.toolCalls[result.toolCalls.length - 1];

          if (lastTool.name === "log_meal" && lastTool.result.success) {
            messageType = "meal_logged";
            const mealData = lastTool.result.data as Record<string, unknown>;
            const dayStatus = await getDayStatus(user_id);
            metadata = {
              ...metadata,
              items: mealData.items,
              meal_type: mealData.meal_type,
              totals: {
                kcal: mealData.calories,
                protein_g: mealData.protein_g,
                carbs_g: mealData.carbs_g,
                fat_g: mealData.fat_g,
              },
              day_status: dayStatus,
            };
          } else if (lastTool.name === "log_workout" && lastTool.result.success) {
            messageType = "workout_logged";
            const workoutData = lastTool.result.data as Record<string, unknown>;
            metadata = {
              ...metadata,
              description: workoutData.description,
              workout_type: workoutData.workout_type,
              exercises: workoutData.exercises ?? [],
            };
          } else if (lastTool.name === "log_water" && lastTool.result.success) {
            messageType = "water_logged";
            const waterData = lastTool.result.data as Record<string, unknown>;
            const { data: userData } = await supabase
              .from("users")
              .select("water_goal_ml")
              .eq("id", user_id)
              .single();
            metadata = {
              ...metadata,
              amount_added_ml: waterData.amount_added_ml,
              current_ml: waterData.total_today_ml,
              target_ml: userData?.water_goal_ml ?? 2500,
            };
          } else if (lastTool.name === "log_weight" && lastTool.result.success) {
            messageType = "weight_logged";
            const weightData = lastTool.result.data as Record<string, unknown>;
            metadata = {
              ...metadata,
              weight_kg: weightData.weight_kg,
            };
          } else if (lastTool.name === "get_daily_summary" && lastTool.result.success) {
            messageType = "daily_summary";
            const summaryData = lastTool.result.data as Record<string, unknown>;
            const { data: userData } = await supabase
              .from("users")
              .select("daily_calorie_goal, protein_goal, carbs_goal, fat_goal, water_goal_ml")
              .eq("id", user_id)
              .single();
            metadata = {
              ...metadata,
              date: summaryData.date,
              calories: {
                current: summaryData.totalCalories,
                target: userData?.daily_calorie_goal ?? 2000,
              },
              macros: {
                protein: { current: summaryData.totalProtein, target: userData?.protein_goal ?? 150 },
                carbs: { current: summaryData.totalCarbs, target: userData?.carbs_goal ?? 200 },
                fat: { current: summaryData.totalFat, target: userData?.fat_goal ?? 65 },
              },
              water: {
                current_ml: summaryData.waterMl,
                target_ml: userData?.water_goal_ml ?? 2500,
              },
              meals: (summaryData.meals as { time?: string; meal_type?: string; description?: string; calories?: number }[]).map((m) => ({
                time: m.time ?? "",
                type: m.meal_type ?? "",
                description: m.description ?? "",
                calories: m.calories ?? 0,
              })),
              workouts: summaryData.workouts,
              streak: (summaryData as Record<string, unknown>).streak ?? 0,
              insight: "",
            };
          }
        }

        // Save assistant response
        await supabase.from("chat_messages").insert({
          user_id,
          role: "assistant",
          content: result.content,
          message_type: messageType,
          source: "web",
          metadata,
        });

        // Send done event with metadata for frontend rich card rendering
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "done",
              content: result.content,
              messageType,
              metadata,
            })}\n\n`
          )
        );
        controller.close();
      } catch (err) {
        console.error("Stream error:", err);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message: "Errore nell'elaborazione." })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
