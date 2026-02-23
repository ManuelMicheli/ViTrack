"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ChatMessage } from "@/lib/types";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

const getUserId = async (): Promise<string | null> => {
  try {
    const supabase = createSupabaseBrowser();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) return session.user.id;
  } catch {
    // Supabase not available
  }
  return localStorage.getItem("vitrack_user_id");
};

export function useChatMessages(isOpen: boolean) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const streamMsgIdRef = useRef<string | null>(null);

  // Resolve userId
  useEffect(() => {
    getUserId().then(setUserId);
  }, []);

  // Load message history when panel opens
  useEffect(() => {
    if (!isOpen || !userId || historyLoaded) return;

    const load = async () => {
      try {
        const res = await fetch(`/api/chat?user_id=${userId}&limit=50`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch {
        // Silently fail
      } finally {
        setHistoryLoaded(true);
      }
    };
    load();
  }, [isOpen, userId, historyLoaded]);

  // Send message with SSE streaming
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !userId || loading) return;

      const trimmed = text.trim();

      // Optimistic: add user message
      const tempUserMsg: ChatMessage = {
        id: `temp-${Date.now()}`,
        user_id: userId,
        role: "user",
        content: trimmed,
        message_type: "text",
        source: "web",
        metadata: {},
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMsg]);
      setLoading(true);
      setIsTyping(true);

      // Create streaming assistant message placeholder
      const streamMsgId = `stream-${Date.now()}`;
      streamMsgIdRef.current = streamMsgId;
      const streamMsg: ChatMessage = {
        id: streamMsgId,
        user_id: userId,
        role: "assistant",
        content: "",
        message_type: "text",
        source: "web",
        metadata: {},
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, streamMsg]);

      try {
        const res = await fetch("/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, message: trimmed }),
        });

        if (!res.ok || !res.body) throw new Error("Stream failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "delta") {
                accumulated += data.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === streamMsgId ? { ...m, content: accumulated } : m
                  )
                );
              } else if (data.type === "tool_result") {
                // Store structured tool result data in metadata for rich cards
                if (data.data) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === streamMsgId
                        ? { ...m, metadata: { ...m.metadata, ...data.data, _toolName: data.name } }
                        : m
                    )
                  );
                }
              } else if (data.type === "done") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === streamMsgId
                      ? {
                          ...m,
                          content: data.content,
                          message_type: data.messageType,
                          metadata: data.metadata ?? m.metadata,
                        }
                      : m
                  )
                );
                setIsTyping(false);
              } else if (data.type === "error") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === streamMsgId
                      ? { ...m, content: data.message, message_type: "error" as const }
                      : m
                  )
                );
                setIsTyping(false);
              }
            } catch {
              // Skip malformed SSE data
            }
          }
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamMsgId
              ? { ...m, content: "Errore di connessione.", message_type: "error" as const }
              : m
          )
        );
        setIsTyping(false);
      } finally {
        setLoading(false);
        streamMsgIdRef.current = null;
      }
    },
    [userId, loading]
  );

  return {
    messages,
    loading,
    isTyping,
    userId,
    sendMessage,
    setMessages,
  };
}
