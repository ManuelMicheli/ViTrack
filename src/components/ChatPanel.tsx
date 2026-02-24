"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@/lib/chat-context";
import { useUser } from "@/lib/user-provider";
import { CloseIcon, SendIcon } from "./icons";
import { springs } from "@/lib/animation-config";
import { useLanguage } from "@/lib/language-context";
import { AIVoiceInput } from "@/components/ui/ai-voice-input";
import { Mic, Maximize2, Minimize2 } from "lucide-react";
import { useChatMessages } from "@/components/chat/hooks/useChatMessages";
import { MessageRenderer } from "@/components/chat/messages/MessageRenderer";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { QuickActionsBar } from "@/components/chat/QuickActionsBar";
import { WelcomeCard } from "@/components/chat/messages/WelcomeCard";
import { WeightInput } from "@/components/chat/modals/WeightInput";
import { WaterPicker } from "@/components/chat/modals/WaterPicker";

export default function ChatPanel() {
  const { isChatOpen, closeChat } = useChat();
  const { user } = useUser();
  const { t } = useLanguage();
  const [voiceMode, setVoiceMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [input, setInput] = useState("");
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [showWaterPicker, setShowWaterPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, loading, isTyping, userId, sendMessage, setMessages } = useChatMessages(isChatOpen);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus textarea when panel opens
  useEffect(() => {
    if (isChatOpen && !voiceMode) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [isChatOpen, voiceMode]);

  // Escape to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isChatOpen) closeChat();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isChatOpen, closeChat]);

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const handleSend = (text?: string) => {
    const msg = text ?? input;
    if (!msg.trim()) return;

    if (msg === "__weight_input__") {
      setShowWeightInput(true);
      return;
    }
    if (msg === "__water_input__") {
      setShowWaterPicker(true);
      return;
    }

    sendMessage(msg);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showWelcome = messages.length === 0 && !loading && user;

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
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={springs.enter}
            className={`fixed z-50 flex flex-col bg-black border-l border-border
              ${isFullscreen
                ? "inset-0"
                : "inset-0 md:left-auto md:top-0 md:right-0 md:h-full md:w-[380px]"
              }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-surface-raised border border-border flex items-center justify-center">
                    <span className="text-sm">🏋️</span>
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success border-2 border-black rounded-full" />
                </div>
                <div>
                  <h2 className="font-mono-label text-xs text-text-primary">ViTrack Coach</h2>
                  <p className="text-[10px] text-text-tertiary">
                    {isTyping ? "Sta scrivendo..." : "Il tuo coach AI"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="hidden md:block p-1.5 rounded-lg hover:bg-surface-raised transition-colors"
                >
                  {isFullscreen
                    ? <Minimize2 className="w-4 h-4 text-text-tertiary" />
                    : <Maximize2 className="w-4 h-4 text-text-tertiary" />
                  }
                </button>
                <button
                  onClick={closeChat}
                  className="p-1.5 rounded-lg hover:bg-surface-raised transition-colors"
                >
                  <CloseIcon className="w-4 h-4 text-text-tertiary" />
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <QuickActionsBar user={user} onAction={handleSend} disabled={loading} />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
              {showWelcome && <WelcomeCard user={user} />}

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <MessageRenderer message={msg} onSendMessage={sendMessage} />
                </motion.div>
              ))}

              {isTyping && !messages.some(m => m.id.startsWith("stream-") && m.content === "") && (
                <TypingIndicator />
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Weight Input Modal */}
            <AnimatePresence>
              {showWeightInput && (
                <WeightInput
                  onLog={(kg) => {
                    setShowWeightInput(false);
                    sendMessage(`Peso: ${kg} kg`);
                  }}
                  onClose={() => setShowWeightInput(false)}
                />
              )}
            </AnimatePresence>

            {/* Water Picker Modal */}
            <AnimatePresence>
              {showWaterPicker && (
                <WaterPicker
                  onLog={(ml) => {
                    setShowWaterPicker(false);
                    sendMessage(`Acqua: ${ml} ml`);
                  }}
                  onClose={() => setShowWaterPicker(false)}
                />
              )}
            </AnimatePresence>

            {/* Voice Recording Overlay */}
            <AnimatePresence>
              {voiceMode && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-border bg-black/95"
                >
                  <AIVoiceInput
                    onTranscription={(text) => {
                      setVoiceMode(false);
                      sendMessage(text);
                    }}
                    onError={(err) => {
                      setVoiceMode(false);
                      setMessages((prev) => [
                        ...prev,
                        {
                          id: `err-${Date.now()}`,
                          user_id: userId ?? "",
                          role: "assistant",
                          content: err,
                          message_type: "error",
                          source: "web",
                          metadata: {},
                          created_at: new Date().toISOString(),
                        },
                      ]);
                    }}
                    disabled={loading}
                    visualizerBars={32}
                  />
                  <button
                    onClick={() => setVoiceMode(false)}
                    className="w-full py-2 text-xs text-text-tertiary hover:text-text-secondary transition-colors"
                  >
                    Annulla
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Bar */}
            {!voiceMode && (
              <div className="px-3 py-3 border-t border-border pb-[env(safe-area-inset-bottom,12px)]">
                <div className="flex items-end gap-2 border border-border rounded-xl bg-transparent px-3 py-2">
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
                    onClick={() => setVoiceMode(true)}
                    disabled={loading}
                    className="p-1.5 rounded-full text-text-tertiary hover:text-white
                      hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed
                      transition-colors flex-shrink-0"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || loading}
                    className="p-1.5 rounded-full bg-[var(--color-accent-dynamic)] text-black
                      disabled:opacity-30 disabled:cursor-not-allowed
                      hover:opacity-90 transition-colors flex-shrink-0"
                  >
                    <SendIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
