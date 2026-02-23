"use client";
import type { ChatMessage } from "@/lib/types";
import { CoachBubble } from "./CoachBubble";

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "");
}

export function TextBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const content = stripHtml(message.content);
  const fromTelegram = message.source === "telegram";

  if (isUser) {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[85%]">
          <div className="bg-[var(--color-accent-dynamic)]/10 text-text-primary rounded-2xl rounded-br-sm px-4 py-2.5">
            <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
          </div>
          {fromTelegram && (
            <p className="text-[10px] text-text-tertiary mt-0.5 text-right">via Telegram</p>
          )}
          <span className="text-[10px] text-text-tertiary mt-0.5 block text-right">
            {new Date(message.created_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
    );
  }

  const isError = message.message_type === "error";
  const bgClass = isError
    ? "bg-danger/10 border border-danger/20"
    : "bg-surface border border-border";

  return (
    <CoachBubble timestamp={message.created_at}>
      <div className={`${bgClass} rounded-2xl rounded-bl-sm px-4 py-2.5`}>
        <p className="text-sm text-white/90 whitespace-pre-wrap break-words">{content}</p>
      </div>
      {fromTelegram && (
        <p className="text-[10px] text-text-tertiary mt-0.5">via Telegram</p>
      )}
    </CoachBubble>
  );
}
