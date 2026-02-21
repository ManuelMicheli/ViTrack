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
            className="md:hidden fixed inset-0 bg-black/60 z-40"
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
            className="fixed z-50 flex flex-col bg-[#0A0A0A]/95 backdrop-blur-xl border-l border-white/[0.06] inset-0 md:left-auto md:top-0 md:right-0 md:h-full md:w-[400px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center">
                  <span className="text-xs font-bold">Vi</span>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    {t("chat.title")}
                  </h2>
                  <p className="text-[10px] text-white/40">
                    {t("chat.subtitle")}
                  </p>
                </div>
              </div>
              <button
                onClick={closeChat}
                className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
              >
                <CloseIcon className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Quick Commands */}
            <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-none border-b border-white/[0.04]">
              {QUICK_COMMANDS.map((cmd) => (
                <motion.button
                  key={cmd.command}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendMessage(cmd.command)}
                  disabled={loading}
                  className="flex-shrink-0 px-3 py-1.5 text-xs rounded-full
                    bg-white/[0.06] text-white/70 hover:bg-white/[0.10] hover:text-white
                    transition-all disabled:opacity-40"
                >
                  {cmd.label}
                </motion.button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
                    <span className="text-2xl">...</span>
                  </div>
                  <p className="text-sm text-white/40">
                    {t("chat.emptyTitle")}
                  </p>
                  <p className="text-xs text-white/25 mt-1">
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
                  <div className="bg-white/[0.06] rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-2 h-2 bg-white/30 rounded-full"
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
            <div className="px-4 py-3 border-t border-white/[0.06] pb-[env(safe-area-inset-bottom,12px)]">
              <div className="flex items-end gap-2 bg-white/[0.06] rounded-2xl px-3 py-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder={t("chat.placeholder")}
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/30
                    resize-none outline-none max-h-[120px] leading-5 py-1"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="p-1.5 rounded-full bg-[#3B82F6] text-white
                    disabled:opacity-30 disabled:cursor-not-allowed
                    hover:bg-[#2563EB] transition-colors flex-shrink-0"
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
          <div className="bg-[#3B82F6] text-white rounded-2xl rounded-br-sm px-4 py-2.5">
            <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
          </div>
          {fromTelegram && (
            <p className="text-[10px] text-white/25 mt-0.5 text-right">
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
    ? "bg-emerald-500/10 border border-emerald-500/20"
    : isWorkoutSaved
      ? "bg-blue-500/10 border border-blue-500/20"
      : isError
        ? "bg-red-500/10 border border-red-500/20"
        : "bg-white/[0.06]";

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        <div
          className={`${bgClass} rounded-2xl rounded-bl-sm px-4 py-2.5`}
        >
          <p className="text-sm text-white/90 whitespace-pre-wrap break-words">
            {content}
          </p>
        </div>
        {fromTelegram && (
          <p className="text-[10px] text-white/25 mt-0.5">{t("chat.viaTelegram")}</p>
        )}
      </div>
    </div>
  );
}
