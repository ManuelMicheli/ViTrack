"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export type AccentColor = "blue" | "violet" | "cyan" | "green" | "orange" | "pink";
export type LayoutMode = "compact" | "expanded";

const ACCENT_COLORS: Record<AccentColor, string> = {
  blue: "#3B82F6",
  violet: "#8B5CF6",
  cyan: "#06B6D4",
  green: "#22C55E",
  orange: "#F59E0B",
  pink: "#EC4899",
};

const DEFAULT_SECTION_ORDER = [
  "greeting",
  "quickadd",
  "calories",
  "water-streak",
  "weight",
  "meals",
  "workouts",
];

interface PreferencesContextType {
  accentColor: AccentColor;
  accentHex: string;
  setAccentColor: (color: AccentColor) => void;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  sectionOrder: string[];
  setSectionOrder: (order: string[]) => void;
}

const PreferencesContext = createContext<PreferencesContextType>({
  accentColor: "blue",
  accentHex: "#3B82F6",
  setAccentColor: () => {},
  layoutMode: "expanded",
  setLayoutMode: () => {},
  sectionOrder: DEFAULT_SECTION_ORDER,
  setSectionOrder: () => {},
});

export function usePreferences() {
  return useContext(PreferencesContext);
}

function loadAccentColor(): AccentColor {
  if (typeof window === "undefined") return "blue";
  const saved = localStorage.getItem("vitrack_accent_color") as AccentColor | null;
  return saved && ACCENT_COLORS[saved] ? saved : "blue";
}

function loadLayoutMode(): LayoutMode {
  if (typeof window === "undefined") return "expanded";
  const saved = localStorage.getItem("vitrack_layout_mode") as LayoutMode | null;
  return saved === "compact" || saved === "expanded" ? saved : "expanded";
}

function loadSectionOrder(): string[] {
  if (typeof window === "undefined") return DEFAULT_SECTION_ORDER;
  const saved = localStorage.getItem("vitrack_dashboard_order");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* ignore */ }
  }
  return DEFAULT_SECTION_ORDER;
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [accentColor, setAccentColorState] = useState<AccentColor>(loadAccentColor);
  const [layoutMode, setLayoutModeState] = useState<LayoutMode>(loadLayoutMode);
  const [sectionOrder, setSectionOrderState] = useState<string[]>(loadSectionOrder);

  useEffect(() => {
    document.documentElement.style.setProperty("--color-accent-dynamic", ACCENT_COLORS[accentColor]);
  }, [accentColor]);

  const setAccentColor = useCallback((color: AccentColor) => {
    setAccentColorState(color);
    localStorage.setItem("vitrack_accent_color", color);
  }, []);

  const setLayoutMode = useCallback((mode: LayoutMode) => {
    setLayoutModeState(mode);
    localStorage.setItem("vitrack_layout_mode", mode);
  }, []);

  const setSectionOrder = useCallback((order: string[]) => {
    setSectionOrderState(order);
    localStorage.setItem("vitrack_dashboard_order", JSON.stringify(order));
  }, []);

  return (
    <PreferencesContext.Provider
      value={{
        accentColor,
        accentHex: ACCENT_COLORS[accentColor],
        setAccentColor,
        layoutMode,
        setLayoutMode,
        sectionOrder,
        setSectionOrder,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export { ACCENT_COLORS, DEFAULT_SECTION_ORDER };
