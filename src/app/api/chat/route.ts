import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { processMessage, resultToMessageType } from "@/lib/chat-processor";

// GET /api/chat?user_id=...&limit=50 — load message history
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id");
  const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "50");

  if (!userId) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return in chronological order
  return NextResponse.json(data?.reverse() ?? []);
}

// POST /api/chat — send a message and get a response
export async function POST(request: NextRequest) {
  try {
    const { user_id, message } = await request.json();

    if (!user_id || !message?.trim()) {
      return NextResponse.json(
        { error: "user_id and message required" },
        { status: 400 }
      );
    }

    const text = message.trim();

    // Save user message
    const { data: userMsg, error: userErr } = await supabase
      .from("chat_messages")
      .insert({
        user_id,
        role: "user",
        content: text,
        message_type: "text",
        source: "web",
      })
      .select()
      .single();

    if (userErr) {
      return NextResponse.json(
        { error: "Failed to save message" },
        { status: 500 }
      );
    }

    // Process the message through the shared processor
    const result = await processMessage(user_id, text);

    // Save assistant response
    const msgType = resultToMessageType(result.kind);
    const metadata: Record<string, unknown> = {};
    if ("data" in result) metadata.data = result.data;
    if ("workoutId" in result) metadata.workoutId = result.workoutId;

    const { data: assistantMsg, error: assistantErr } = await supabase
      .from("chat_messages")
      .insert({
        user_id,
        role: "assistant",
        content: result.reply,
        message_type: msgType,
        source: "web",
        metadata,
      })
      .select()
      .single();

    if (assistantErr) {
      return NextResponse.json(
        { error: "Failed to save response" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      userMessage: userMsg,
      assistantMessage: assistantMsg,
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
