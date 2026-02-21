"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

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

export interface InitialPreferences {
  accent_color?: AccentColor;
  layout_mode?: LayoutMode;
  section_order?: string[];
}

interface PreferencesContextType {
  accentColor: AccentColor;
  accentHex: string;
  setAccentColor: (color: AccentColor) => void;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  sectionOrder: string[];
  setSectionOrder: (order: string[]) => void;
  saveError: string | null;
  clearSaveError: () => void;
}

const PreferencesContext = createContext<PreferencesContextType>({
  accentColor: "blue",
  accentHex: "#3B82F6",
  setAccentColor: () => {},
  layoutMode: "expanded",
  setLayoutMode: () => {},
  sectionOrder: DEFAULT_SECTION_ORDER,
  setSectionOrder: () => {},
  saveError: null,
  clearSaveError: () => {},
});

export function usePreferences() {
  return useContext(PreferencesContext);
}

function loadAccentColor(initial?: AccentColor): AccentColor {
  if (initial && ACCENT_COLORS[initial]) return initial;
  if (typeof window === "undefined") return "blue";
  const saved = localStorage.getItem("vitrack_accent_color") as AccentColor | null;
  return saved && ACCENT_COLORS[saved] ? saved : "blue";
}

function loadLayoutMode(initial?: LayoutMode): LayoutMode {
  if (initial === "compact" || initial === "expanded") return initial;
  if (typeof window === "undefined") return "expanded";
  const saved = localStorage.getItem("vitrack_layout_mode") as LayoutMode | null;
  return saved === "compact" || saved === "expanded" ? saved : "expanded";
}

function loadSectionOrder(initial?: string[]): string[] {
  if (initial && Array.isArray(initial) && initial.length > 0) return initial;
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

interface PreferencesProviderProps {
  children: React.ReactNode;
  userId?: string;
  initialPreferences?: InitialPreferences;
}

export function PreferencesProvider({ children, userId, initialPreferences }: PreferencesProviderProps) {
  const [accentColor, setAccentColorState] = useState<AccentColor>(() => loadAccentColor(initialPreferences?.accent_color));
  const [layoutMode, setLayoutModeState] = useState<LayoutMode>(() => loadLayoutMode(initialPreferences?.layout_mode));
  const [sectionOrder, setSectionOrderState] = useState<string[]>(() => loadSectionOrder(initialPreferences?.section_order));
  const [saveError, setSaveError] = useState<string | null>(null);
  const sectionOrderDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSaveError = useCallback(() => setSaveError(null), []);

  const showError = useCallback((msg: string) => {
    setSaveError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setSaveError(null), 4000);
  }, []);

  // Sync localStorage from DB values on mount
  useEffect(() => {
    if (initialPreferences?.accent_color && ACCENT_COLORS[initialPreferences.accent_color]) {
      localStorage.setItem("vitrack_accent_color", initialPreferences.accent_color);
    }
    if (initialPreferences?.layout_mode) {
      localStorage.setItem("vitrack_layout_mode", initialPreferences.layout_mode);
    }
    if (initialPreferences?.section_order && Array.isArray(initialPreferences.section_order)) {
      localStorage.setItem("vitrack_dashboard_order", JSON.stringify(initialPreferences.section_order));
    }
  }, [initialPreferences]);

  useEffect(() => {
    document.documentElement.style.setProperty("--color-accent-dynamic", ACCENT_COLORS[accentColor]);
  }, [accentColor]);

  const saveToDb = useCallback((field: string, value: unknown) => {
    if (!userId) return;
    fetch(`/api/user?id=${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    }).then((res) => {
      if (!res.ok) showError("Errore nel salvare la personalizzazione");
    }).catch(() => {
      showError("Errore di connessione. Riprova.");
    });
  }, [userId, showError]);

  const setAccentColor = useCallback((color: AccentColor) => {
    setAccentColorState(color);
    localStorage.setItem("vitrack_accent_color", color);
    saveToDb("accent_color", color);
  }, [saveToDb]);

  const setLayoutMode = useCallback((mode: LayoutMode) => {
    setLayoutModeState(mode);
    localStorage.setItem("vitrack_layout_mode", mode);
    saveToDb("layout_mode", mode);
  }, [saveToDb]);

  const setSectionOrder = useCallback((order: string[]) => {
    setSectionOrderState(order);
    localStorage.setItem("vitrack_dashboard_order", JSON.stringify(order));
    // Debounce DB save for section_order (drag-and-drop generates many events)
    if (sectionOrderDebounceRef.current) {
      clearTimeout(sectionOrderDebounceRef.current);
    }
    sectionOrderDebounceRef.current = setTimeout(() => {
      saveToDb("section_order", order);
    }, 500);
  }, [saveToDb]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (sectionOrderDebounceRef.current) clearTimeout(sectionOrderDebounceRef.current);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
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
        saveError,
        clearSaveError,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export { ACCENT_COLORS, DEFAULT_SECTION_ORDER };
