"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { User } from "@/lib/types";

interface UserContextValue {
  user: User | null;
  /** Optimistic local merge — no API call */
  updateUser: (updates: Partial<User>) => void;
  /** PATCH /api/user + update context */
  saveUser: (fields: Record<string, unknown>) => Promise<User | null>;
  /** Re-fetch user from server */
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({
  initialUser,
  children,
}: {
  initialUser: User | null;
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(initialUser);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const saveUser = useCallback(
    async (fields: Record<string, unknown>): Promise<User | null> => {
      if (!user) return null;
      try {
        const res = await fetch(`/api/user?id=${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
        });
        if (res.ok) {
          const updated: User = await res.json();
          setUser(updated);
          return updated;
        }
      } catch {
        /* ignore */
      }
      return null;
    },
    [user],
  );

  const refreshUser = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/user?id=${user.id}`);
      if (res.ok) {
        const data: User = await res.json();
        setUser(data);
      }
    } catch {
      /* ignore */
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, updateUser, saveUser, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
}
