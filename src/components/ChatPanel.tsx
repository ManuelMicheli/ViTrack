"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@/lib/chat-context";
import { CloseIcon, SendIcon } from "./icons";
import { springs } from "@/lib/animation-config";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { useLanguage } from "@/lib/language-context";
import type { ChatMessage } from "@/lib/types";

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

const QUICK_COMMANDS = [
  { label: "Oggi", command: "/oggi" },
  { label: "Ricette", command: "/ricette" },
  { label: "Sessione", command: "/sessione" },
  { label: "Fine", command: "/fine" },
  { label: "Annulla", command: "/annulla" },
];

export default function ChatPanel() {
  const { isChatOpen, closeChat } = useChat();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Resolve userId: Supabase Auth first, then localStorage fallback
  useEffect(() => {
    getUserId().then(setUserId);
  }, []);

  // Load message history when panel opens
  useEffect(() => {
    if (!isChatOpen || !userId || historyLoaded) return;

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
  }, [isChatOpen, userId, historyLoaded]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus textarea when panel opens
  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [isChatOpen]);

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !userId || loading) return;

      const trimmed = text.trim();
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";

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

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, message: trimmed }),
        });

        if (res.ok) {
          const { userMessage, assistantMessage } = await res.json();
          setMessages((prev) => {
            // Replace temp user message with real one, add assistant message
            const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
            return [...filtered, userMessage, assistantMessage];
          });
        } else {
          // Add error message
          setMessages((prev) => [
            ...prev,
            {
              id: `err-${Date.now()}`,
              user_id: userId,
              role: "assistant",
              content: t("chat.error"),
              message_type: "error",
              source: "web",
              metadata: {},
              created_at: new Date().toISOString(),
            },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            user_id: userId,
            role: "assistant",
            content: t("chat.networkError"),
            message_type: "error",
            source: "web",
            metadata: {},
            created_at: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [userId, loading]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Strip HTML tags from Telegram messages for clean display
  const stripHtml = (html: string) =>
    html.replace(/<[^>]*>/g, "");

  return (
    <AnimatePresence>
      {isChatOpen && (
        <>
          {/* Backdrop on mobile */}
          <motion.div
            key="chat-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 bg-black/80 z-40"
            onClick={closeChat}
          />

          {/* Panel */}
          <motion.div
            key="chat-panel"
            ref={panelRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={springs.enter}
            className="fixed z-50 flex flex-col bg-black border-l border-border inset-0 md:left-auto md:top-0 md:right-0 md:h-full md:w-[380px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="font-mono-label text-text-secondary">ASSISTENTE</h2>
              <button
                onClick={closeChat}
                className="p-2 rounded-lg hover:bg-surface-raised transition-colors"
              >
                <CloseIcon className="w-5 h-5 text-text-tertiary" />
              </button>
            </div>

            {/* Quick Commands */}
            <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-none border-b border-border-subtle">
              {QUICK_COMMANDS.map((cmd) => (
                <motion.button
                  key={cmd.command}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendMessage(cmd.command)}
                  disabled={loading}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-border bg-transparent
                    text-text-tertiary hover:bg-surface-raised hover:text-text-secondary
                    font-mono-label text-[10px] transition-all disabled:opacity-40"
                >
                  {cmd.label}
                </motion.button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center mb-3">
                    <span className="text-2xl">...</span>
                  </div>
                  <p className="font-mono-label text-text-tertiary">
                    {t("chat.emptyTitle")}
                  </p>
                  <p className="font-body text-xs text-text-tertiary mt-1">
                    {t("chat.emptySubtitle")}
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <MessageBubble message={msg} stripHtml={stripHtml} />
                </motion.div>
              ))}

              {loading && (
                <div className="flex items-start gap-2">
                  <div className="bg-surface border border-border rounded-lg px-4 py-3">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-2 h-2 bg-text-tertiary rounded-full"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15, ease: "easeInOut" }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="px-4 py-3 border-t border-border pb-[env(safe-area-inset-bottom,12px)]">
              <div className="flex items-end gap-2 border border-border rounded-lg bg-transparent px-3 py-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder={t("chat.placeholder")}
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-tertiary font-body
                    resize-none outline-none max-h-[120px] leading-5 py-1"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="p-1.5 rounded-full bg-[var(--color-accent-dynamic)] text-black
                    disabled:opacity-30 disabled:cursor-not-allowed
                    hover:opacity-90 transition-colors flex-shrink-0"
                >
                  <SendIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Message Bubble
// ---------------------------------------------------------------------------
function MessageBubble({
  message,
  stripHtml,
}: {
  message: ChatMessage;
  stripHtml: (s: string) => string;
}) {
  const { t } = useLanguage();
  const isUser = message.role === "user";
  const content = stripHtml(message.content);

  // Source indicator for Telegram messages
  const fromTelegram = message.source === "telegram";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%]">
          <div className="bg-[var(--color-accent-dynamic)]/10 text-text-primary rounded-lg px-4 py-2.5">
            <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
          </div>
          {fromTelegram && (
            <p className="text-[10px] text-text-tertiary mt-0.5 text-right">
              {t("chat.viaTelegram")}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Assistant message — different styles based on message_type
  const isMealSaved = message.message_type === "meal_saved";
  const isWorkoutSaved = message.message_type === "workout_saved";
  const isError = message.message_type === "error";

  const bgClass = isMealSaved
    ? "bg-success/10 border border-success/20"
    : isWorkoutSaved
      ? "bg-water/10 border border-water/20"
      : isError
        ? "bg-danger/10 border border-danger/20"
        : "bg-surface border border-border";

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        <div
          className={`${bgClass} rounded-lg px-4 py-2.5`}
        >
          <p className="text-sm text-white/90 whitespace-pre-wrap break-words">
            {content}
          </p>
        </div>
        {fromTelegram && (
          <p className="text-[10px] text-text-tertiary mt-0.5">{t("chat.viaTelegram")}</p>
        )}
      </div>
    </div>
  );
}
