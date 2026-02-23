"use client";

import { useQuickActions } from "./hooks/useQuickActions";
import type { User } from "@/lib/types";

export function QuickActionsBar({ user, onAction, disabled }: {
  user: User | null;
  onAction: (message: string) => void;
  disabled?: boolean;
}) {
  const actions = useQuickActions(user);

  return (
    <div className="flex gap-1.5 px-3 py-2 overflow-x-auto scrollbar-none border-t border-border">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onAction(action.message)}
          disabled={disabled}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-surface-raised border border-border
                     rounded-full text-[10px] font-medium text-text-tertiary whitespace-nowrap
                     hover:bg-[var(--color-accent-dynamic)]/10 hover:text-text-secondary
                     hover:border-[var(--color-accent-dynamic)]/30
                     transition-colors flex-shrink-0 disabled:opacity-40"
        >
          <span>{action.emoji}</span>
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}
