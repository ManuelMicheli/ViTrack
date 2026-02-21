"use client";

import { createContext, useContext } from "react";

interface ThemeContextType {
  theme: "dark";
  resolvedTheme: "dark";
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  resolvedTheme: "dark",
});

export function useTheme() {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <ThemeContext.Provider value={{ theme: "dark", resolvedTheme: "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}
