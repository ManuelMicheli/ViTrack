import { NextRequest } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { buildAIContext } from "@/ai/context-builder";
import { buildAISystemPrompt } from "@/ai/system-prompt";
import { chatWithAI } from "@/ai/ai-client";

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
                  `data: ${JSON.stringify({ type: "tool_result", name, success: res.success })}\n\n`
                )
              );
            },
          },
        });

        // Determine message type based on tool calls
        let messageType = "text";
        if (result.toolCalls.some((tc) => tc.name === "log_meal"))
          messageType = "meal_saved";
        else if (result.toolCalls.some((tc) => tc.name === "log_workout"))
          messageType = "workout_saved";

        // Save assistant response
        await supabase.from("chat_messages").insert({
          user_id,
          role: "assistant",
          content: result.content,
          message_type: messageType,
          source: "web",
          metadata: { toolCalls: result.toolCalls.map((tc) => tc.name) },
        });

        // Send done event
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "done", content: result.content, messageType })}\n\n`
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
