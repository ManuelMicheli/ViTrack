import { NextRequest } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { buildAIContext, buildFastContext } from "@/ai/context-builder";
import {
  buildAISystemPrompt,
  buildCompactSystemPrompt,
  selectModelTier,
} from "@/ai/system-prompt";
import { chatWithAI, MODEL_TIER_CONFIGS } from "@/ai/ai-client";
import { tryQuickAction } from "@/lib/quick-actions";
import {
  invalidateAfterMealLog,
  invalidateAfterWorkoutLog,
  invalidateAfterWaterLog,
  invalidateAfterWeightLog,
} from "@/lib/context-cache";

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
  const t0 = Date.now();

  // ═══════════════════════════════════════════════════════════════
  // STEP 1: QUICK ACTION CHECK (target: <300ms, no AI)
  // ═══════════════════════════════════════════════════════════════
  const quick = await tryQuickAction(text, user_id);

  if (quick.matched) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send done event immediately (no streaming needed)
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "done",
              content: quick.content,
              messageType: quick.messageType,
              metadata: quick.metadata,
            })}\n\n`
          )
        );
        controller.close();

        // Fire-and-forget: save messages to DB + cache invalidation
        Promise.all([
          supabase.from("chat_messages").insert({
            user_id,
            role: "user",
            content: text,
            message_type: "text",
            source: "web",
          }).then(() => {}),
          supabase.from("chat_messages").insert({
            user_id,
            role: "assistant",
            content: quick.content,
            message_type: quick.messageType,
            source: "web",
            metadata: quick.metadata,
          }).then(() => {}),
          quick.sideEffects ? quick.sideEffects() : Promise.resolve(),
        ]).catch(console.error);
      },
    });

    console.log(`[Quick Action] ${text.slice(0, 30)} → ${Date.now() - t0}ms`);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 2: SELECT MODEL TIER (fast vs smart)
  // ═══════════════════════════════════════════════════════════════
  const tier = selectModelTier(text);
  const tierConfig = MODEL_TIER_CONFIGS[tier];

  // ═══════════════════════════════════════════════════════════════
  // STEP 3: BUILD CONTEXT (fast: ~150ms/3 queries, smart: ~400ms/8 queries)
  // ═══════════════════════════════════════════════════════════════
  const tCtx = Date.now();
  const ctx = tier === "fast"
    ? await buildFastContext(user_id)
    : await buildAIContext(user_id, { messageLimit: 10 });
  console.log(`[Perf] Context (${tier}): ${Date.now() - tCtx}ms`);

  // ═══════════════════════════════════════════════════════════════
  // STEP 4: BUILD SYSTEM PROMPT (compact for fast, full for smart)
  // ═══════════════════════════════════════════════════════════════
  const systemPrompt =
    tier === "fast"
      ? buildCompactSystemPrompt(ctx)
      : buildAISystemPrompt(ctx);
  console.log(`[Perf] Prompt tokens ~${Math.round(systemPrompt.length / 4)} (${tier})`);

  // Save user message (after context build so it's not in recentMessages)
  // Fire-and-forget — don't wait for this before starting AI
  supabase
    .from("chat_messages")
    .insert({
      user_id,
      role: "user",
      content: text,
      message_type: "text",
      source: "web",
    })
    .then(() => {});

  // Build conversation history (limited by tier)
  const history = [
    ...(ctx?.recentMessages ?? []),
    { role: "user", content: text },
  ];

  // ═══════════════════════════════════════════════════════════════
  // STEP 5: STREAM AI RESPONSE
  // ═══════════════════════════════════════════════════════════════
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await chatWithAI({
          messages: history,
          systemPrompt,
          userId: user_id,
          stream: true,
          tierConfig,
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

        // ═══════════════════════════════════════════════════════════
        // STEP 6: BUILD METADATA FOR RICH CARDS
        // ═══════════════════════════════════════════════════════════
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
            // Invalidate cache after meal log
            invalidateAfterMealLog(user_id);
          } else if (lastTool.name === "log_workout" && lastTool.result.success) {
            messageType = "workout_logged";
            const workoutData = lastTool.result.data as Record<string, unknown>;
            metadata = {
              ...metadata,
              description: workoutData.description,
              workout_type: workoutData.workout_type,
              exercises: workoutData.exercises ?? [],
            };
            invalidateAfterWorkoutLog(user_id);
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
            invalidateAfterWaterLog(user_id);
          } else if (lastTool.name === "log_weight" && lastTool.result.success) {
            messageType = "weight_logged";
            const weightData = lastTool.result.data as Record<string, unknown>;
            metadata = {
              ...metadata,
              weight_kg: weightData.weight_kg,
              previous_kg: weightData.previous_kg ?? null,
              change_kg: weightData.change_kg ?? null,
            };
            invalidateAfterWeightLog(user_id);
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
          } else if (lastTool.name === "get_weekly_report" && lastTool.result.success) {
            messageType = "weekly_summary";
            const weekData = lastTool.result.data as Record<string, unknown>;
            metadata = {
              ...metadata,
              avg_daily_calories: weekData.avgDailyCalories,
              calorie_goal: weekData.calorieGoal,
              avg_daily_protein: weekData.avgDailyProtein,
              workout_count: weekData.workoutCount,
              weight_change: weekData.weightChange ?? null,
              weight_entries: weekData.weightEntries ?? [],
            };
          } else if (lastTool.name === "suggest_meal" && lastTool.result.success) {
            messageType = "meal_suggestion";
            const suggestData = lastTool.result.data as Record<string, unknown>;
            metadata = {
              ...metadata,
              context: suggestData.context,
              options: suggestData.options,
              remaining: suggestData.remaining,
            };
          }
        }

        // Save assistant response (fire-and-forget — don't block the response)
        supabase
          .from("chat_messages")
          .insert({
            user_id,
            role: "assistant",
            content: result.content,
            message_type: messageType,
            source: "web",
            metadata,
          })
          .then(() => {});

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

        console.log(
          `[AI ${tier}] "${text.slice(0, 30)}" → ${Date.now() - t0}ms`
        );
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
