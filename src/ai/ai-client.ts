// ---------------------------------------------------------------------------
// AI Client — OpenAI streaming + function calling engine for ViTrack Coach
// ---------------------------------------------------------------------------
// Handles:
// 1. Calling OpenAI with system prompt + tools + message history
// 2. Streaming response tokens for progressive UI display
// 3. Detecting and executing tool calls (function calling)
// 4. Feeding tool results back and continuing the conversation
// 5. Multi-round tool calling with max depth limit
// ---------------------------------------------------------------------------

import { AI_TOOLS, AI_TOOLS_FAST, type ToolDefinition } from "@/ai/tools";
import { executeTool, type ToolResult } from "@/ai/tool-executor";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const OPENAI_MODEL = "gpt-5-mini";
const MAX_COMPLETION_TOKENS = 4096;
const MAX_TOOL_ROUNDS = 3;
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

const ERROR_MESSAGE =
  "Mi dispiace, si è verificato un errore. Riprova.";

// ---------------------------------------------------------------------------
// Model tier configuration
// ---------------------------------------------------------------------------
export type { ToolDefinition };

export interface ModelTierConfig {
  maxTokens: number;
  temperature: number;
  tools: ToolDefinition[];
}

export const MODEL_TIER_CONFIGS: Record<string, ModelTierConfig> = {
  fast: {
    maxTokens: 512,
    temperature: 0.2,
    tools: AI_TOOLS_FAST,
  },
  smart: {
    maxTokens: MAX_COMPLETION_TOKENS,
    temperature: 0.3,
    tools: AI_TOOLS,
  },
};

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface AIStreamCallbacks {
  /** Called with each text content delta for progressive UI display */
  onTextDelta?: (delta: string) => void;
  /** Called when the AI starts calling a tool */
  onToolCall?: (toolName: string) => void;
  /** Called when a tool execution completes */
  onToolResult?: (toolName: string, result: ToolResult) => void;
}

export interface AIResponse {
  /** The final text content from the AI */
  content: string;
  /** List of tools that were called during this interaction */
  toolCalls: {
    name: string;
    args: Record<string, unknown>;
    result: ToolResult;
  }[];
}

// ---------------------------------------------------------------------------
// Internal types for OpenAI message format
// ---------------------------------------------------------------------------

interface OpenAIMessage {
  role: string;
  content?: string | null;
  tool_calls?: OpenAIToolCall[];
  tool_call_id?: string;
}

interface OpenAIToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function chatWithAI(params: {
  messages: { role: string; content: string }[];
  systemPrompt: string;
  userId: string;
  callbacks?: AIStreamCallbacks;
  stream?: boolean;
  /** Optional tier config to override default model/tokens/tools */
  tierConfig?: ModelTierConfig;
}): Promise<AIResponse> {
  const { messages, systemPrompt, userId, callbacks, stream = false, tierConfig } = params;

  // Build OpenAI message array
  const openAIMessages: OpenAIMessage[] = [
    { role: "developer", content: systemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  try {
    if (stream) {
      return await streamingChat(openAIMessages, userId, callbacks, tierConfig);
    } else {
      return await nonStreamingChat(openAIMessages, userId, callbacks, tierConfig);
    }
  } catch (err) {
    console.error("[AIClient] chatWithAI error:", err);
    return { content: ERROR_MESSAGE, toolCalls: [] };
  }
}

// ---------------------------------------------------------------------------
// Non-streaming mode
// ---------------------------------------------------------------------------

async function nonStreamingChat(
  messages: OpenAIMessage[],
  userId: string,
  callbacks?: AIStreamCallbacks,
  tierConfig?: ModelTierConfig
): Promise<AIResponse> {
  const allToolCalls: AIResponse["toolCalls"] = [];
  let currentMessages = [...messages];
  const tools = tierConfig?.tools ?? AI_TOOLS;
  const maxTokens = tierConfig?.maxTokens ?? MAX_COMPLETION_TOKENS;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const res = await fetch(OPENAI_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        max_completion_tokens: maxTokens,
        messages: currentMessages,
        tools,
        tool_choice: "auto",
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[AIClient] OpenAI API error:", res.status, errBody);
      return { content: ERROR_MESSAGE, toolCalls: allToolCalls };
    }

    const data = await res.json();
    const choice = data.choices?.[0];

    if (!choice) {
      console.error("[AIClient] No choices in response:", JSON.stringify(data).slice(0, 500));
      return { content: ERROR_MESSAGE, toolCalls: allToolCalls };
    }

    const assistantMsg = choice.message;
    const finishReason = choice.finish_reason;

    // Case 1: AI returned text content (done)
    if (finishReason === "stop" || !assistantMsg.tool_calls?.length) {
      const content = assistantMsg.content ?? "";
      if (callbacks?.onTextDelta && content) {
        callbacks.onTextDelta(content);
      }
      return { content, toolCalls: allToolCalls };
    }

    // Case 2: AI wants to call tools
    if (finishReason === "tool_calls" || assistantMsg.tool_calls?.length) {
      const toolResults = await executeToolCalls(
        assistantMsg.tool_calls as OpenAIToolCall[],
        userId,
        callbacks
      );

      allToolCalls.push(...toolResults);

      // Build follow-up messages: include the assistant message with tool_calls
      // then each tool result
      const toolResultMessages: OpenAIMessage[] =
        (assistantMsg.tool_calls as OpenAIToolCall[]).map(
          (tc: OpenAIToolCall, i: number) => ({
            role: "tool" as const,
            tool_call_id: tc.id,
            content: JSON.stringify(toolResults[i].result),
          })
        );

      currentMessages = [
        ...currentMessages,
        {
          role: assistantMsg.role,
          content: assistantMsg.content ?? null,
          tool_calls: assistantMsg.tool_calls,
        },
        ...toolResultMessages,
      ];

      // Continue to next round (AI may call more tools or produce text)
      continue;
    }

    // Fallback: unexpected finish reason
    const content = assistantMsg.content ?? "";
    return { content, toolCalls: allToolCalls };
  }

  // Exceeded max rounds — make one final call without tools to force text output
  const finalRes = await fetch(OPENAI_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_completion_tokens: MAX_COMPLETION_TOKENS,
      messages: currentMessages,
    }),
  });

  if (!finalRes.ok) {
    console.error("[AIClient] Final call error:", finalRes.status);
    return { content: ERROR_MESSAGE, toolCalls: allToolCalls };
  }

  const finalData = await finalRes.json();
  const finalContent = finalData.choices?.[0]?.message?.content ?? "";

  if (callbacks?.onTextDelta && finalContent) {
    callbacks.onTextDelta(finalContent);
  }

  return { content: finalContent, toolCalls: allToolCalls };
}

// ---------------------------------------------------------------------------
// Streaming mode
// ---------------------------------------------------------------------------

async function streamingChat(
  messages: OpenAIMessage[],
  userId: string,
  callbacks?: AIStreamCallbacks,
  tierConfig?: ModelTierConfig
): Promise<AIResponse> {
  const allToolCalls: AIResponse["toolCalls"] = [];
  let currentMessages = [...messages];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const result = await streamOneRound(currentMessages, callbacks, tierConfig);

    // Case 1: AI returned text content (done)
    if (result.type === "text") {
      return { content: result.content, toolCalls: allToolCalls };
    }

    // Case 2: AI wants to call tools
    if (result.type === "tool_calls") {
      const toolResults = await executeToolCalls(
        result.toolCalls,
        userId,
        callbacks
      );

      allToolCalls.push(...toolResults);

      // Build the assistant message with tool_calls for follow-up
      const assistantMessage: OpenAIMessage = {
        role: "assistant",
        content: result.content || null,
        tool_calls: result.toolCalls,
      };

      const toolResultMessages: OpenAIMessage[] = result.toolCalls.map(
        (tc, i) => ({
          role: "tool" as const,
          tool_call_id: tc.id,
          content: JSON.stringify(toolResults[i].result),
        })
      );

      currentMessages = [
        ...currentMessages,
        assistantMessage,
        ...toolResultMessages,
      ];

      // Continue to next round
      continue;
    }
  }

  // Exceeded max rounds — make one final streaming call without tools
  const finalResult = await streamFinalRound(currentMessages, callbacks);
  return { content: finalResult, toolCalls: allToolCalls };
}

// ---------------------------------------------------------------------------
// Stream one round of OpenAI conversation
// ---------------------------------------------------------------------------

interface StreamTextResult {
  type: "text";
  content: string;
}

interface StreamToolCallResult {
  type: "tool_calls";
  content: string;
  toolCalls: OpenAIToolCall[];
}

type StreamRoundResult = StreamTextResult | StreamToolCallResult;

async function streamOneRound(
  messages: OpenAIMessage[],
  callbacks?: AIStreamCallbacks,
  tierConfig?: ModelTierConfig
): Promise<StreamRoundResult> {
  const tools = tierConfig?.tools ?? AI_TOOLS;
  const maxTokens = tierConfig?.maxTokens ?? MAX_COMPLETION_TOKENS;

  const res = await fetch(OPENAI_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_completion_tokens: maxTokens,
      stream: true,
      messages,
      tools,
      tool_choice: "auto",
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("[AIClient] Streaming API error:", res.status, errBody);
    return { type: "text", content: ERROR_MESSAGE };
  }

  if (!res.body) {
    // Fallback: no streaming body available
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? ERROR_MESSAGE;
    return { type: "text", content };
  }

  // Accumulate text content and tool calls from the SSE stream
  let textContent = "";
  const pendingToolCalls: Map<
    number,
    { id: string; name: string; arguments: string }
  > = new Map();
  let finishReason = "";

  await processSSEStream(res, (data: string) => {
    try {
      const parsed = JSON.parse(data);
      const choice = parsed.choices?.[0];
      if (!choice) return;

      const delta = choice.delta;

      // Text content delta
      if (delta?.content) {
        textContent += delta.content;
        callbacks?.onTextDelta?.(delta.content);
      }

      // Tool call deltas
      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index as number;
          if (!pendingToolCalls.has(idx)) {
            pendingToolCalls.set(idx, {
              id: tc.id || "",
              name: tc.function?.name || "",
              arguments: "",
            });
          }
          const pending = pendingToolCalls.get(idx)!;
          if (tc.id) pending.id = tc.id;
          if (tc.function?.name) pending.name = tc.function.name;
          if (tc.function?.arguments)
            pending.arguments += tc.function.arguments;
        }
      }

      // Capture finish_reason
      if (choice.finish_reason) {
        finishReason = choice.finish_reason;
      }
    } catch {
      // Skip malformed SSE data
    }
  });

  // Determine result based on finish_reason and accumulated data
  if (
    finishReason === "tool_calls" ||
    (pendingToolCalls.size > 0 && finishReason !== "stop")
  ) {
    // Convert pending tool calls to OpenAI format
    const toolCalls: OpenAIToolCall[] = [];
    const sortedIndices = [...pendingToolCalls.keys()].sort((a, b) => a - b);

    for (const idx of sortedIndices) {
      const tc = pendingToolCalls.get(idx)!;
      toolCalls.push({
        id: tc.id,
        type: "function",
        function: {
          name: tc.name,
          arguments: tc.arguments,
        },
      });
    }

    return { type: "tool_calls", content: textContent, toolCalls };
  }

  // Text response
  return { type: "text", content: textContent };
}

// ---------------------------------------------------------------------------
// Stream final round (no tools, force text output)
// ---------------------------------------------------------------------------

async function streamFinalRound(
  messages: OpenAIMessage[],
  callbacks?: AIStreamCallbacks
): Promise<string> {
  const res = await fetch(OPENAI_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_completion_tokens: MAX_COMPLETION_TOKENS,
      stream: true,
      messages,
    }),
  });

  if (!res.ok) {
    console.error("[AIClient] Final stream error:", res.status);
    return ERROR_MESSAGE;
  }

  if (!res.body) {
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? ERROR_MESSAGE;
  }

  let textContent = "";

  await processSSEStream(res, (data: string) => {
    try {
      const parsed = JSON.parse(data);
      const delta = parsed.choices?.[0]?.delta?.content;
      if (delta) {
        textContent += delta;
        callbacks?.onTextDelta?.(delta);
      }
    } catch {
      // Skip malformed SSE data
    }
  });

  return textContent || ERROR_MESSAGE;
}

// ---------------------------------------------------------------------------
// Execute tool calls and collect results
// ---------------------------------------------------------------------------

async function executeToolCalls(
  toolCalls: OpenAIToolCall[],
  userId: string,
  callbacks?: AIStreamCallbacks
): Promise<AIResponse["toolCalls"]> {
  // Execute ALL tool calls in PARALLEL for maximum speed
  const results = await Promise.all(
    toolCalls.map(async (tc) => {
      let args: Record<string, unknown>;
      try {
        args = JSON.parse(tc.function.arguments);
      } catch {
        console.error(
          "[AIClient] Failed to parse tool arguments:",
          tc.function.name,
          tc.function.arguments
        );
        args = {};
      }

      callbacks?.onToolCall?.(tc.function.name);
      const result = await executeTool(tc.function.name, args, userId);
      callbacks?.onToolResult?.(tc.function.name, result);

      return { name: tc.function.name, args, result };
    })
  );

  return results;
}

// ---------------------------------------------------------------------------
// SSE stream processor
// ---------------------------------------------------------------------------

async function processSSEStream(
  response: Response,
  onEvent: (data: string) => void
): Promise<void> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") continue;
        onEvent(data);
      }
    }

    // Process any remaining buffer
    if (buffer.trim()) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith("data: ")) {
        const data = trimmed.slice(6);
        if (data !== "[DONE]") {
          onEvent(data);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
