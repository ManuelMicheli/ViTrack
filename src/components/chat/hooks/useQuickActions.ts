"use client";

import { useMemo } from "react";
import type { User } from "@/lib/types";

export interface QuickAction {
  id: string;
  emoji: string;
  label: string;
  message: string;
}

export function useQuickActions(user: User | null): QuickAction[] {
  return useMemo(() => {
    const hour = new Date().getHours();
    const actions: QuickAction[] = [];

    if (hour >= 6 && hour < 10) {
      actions.push({ id: "breakfast", emoji: "🥣", label: "Colazione", message: "Registra colazione" });
    }
    if (hour >= 12 && hour < 15) {
      actions.push({ id: "lunch", emoji: "🍝", label: "Pranzo", message: "Registra pranzo" });
    }
    if (hour >= 18 && hour < 22) {
      actions.push({ id: "dinner", emoji: "🍽", label: "Cena", message: "Registra cena" });
    }

    actions.push(
      { id: "log_meal", emoji: "🍽", label: "Registra pasto", message: "Registra pasto" },
      { id: "water", emoji: "💧", label: "Acqua", message: "Registra acqua" },
      { id: "today", emoji: "📊", label: "Giornata", message: "/oggi" },
      { id: "suggest", emoji: "🥗", label: "Cosa mangio?", message: "Cosa mi suggerisci di mangiare?" },
    );

    actions.push({ id: "weight", emoji: "⚖️", label: "Peso", message: "Registra peso" });
    actions.push({ id: "workout", emoji: "🏋️", label: "Allenamento", message: "Registra allenamento" });

    const seen = new Set<string>();
    return actions.filter(a => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });
  }, [user]);
}
