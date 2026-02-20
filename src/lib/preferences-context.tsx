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

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [accentColor, setAccentColorState] = useState<AccentColor>("blue");
  const [layoutMode, setLayoutModeState] = useState<LayoutMode>("expanded");
  const [sectionOrder, setSectionOrderState] = useState<string[]>(DEFAULT_SECTION_ORDER);

  useEffect(() => {
    const savedAccent = localStorage.getItem("vitrack_accent_color") as AccentColor | null;
    if (savedAccent && ACCENT_COLORS[savedAccent]) setAccentColorState(savedAccent);

    const savedLayout = localStorage.getItem("vitrack_layout_mode") as LayoutMode | null;
    if (savedLayout === "compact" || savedLayout === "expanded") setLayoutModeState(savedLayout);

    const savedOrder = localStorage.getItem("vitrack_dashboard_order");
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        if (Array.isArray(parsed)) setSectionOrderState(parsed);
      } catch { /* ignore */ }
    }
  }, []);

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
