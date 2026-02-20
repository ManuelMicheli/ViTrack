"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@/lib/types";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import ChatPanel from "@/components/ChatPanel";
import { ChatProvider } from "@/lib/chat-context";
import { PreferencesProvider } from "@/lib/preferences-context";
import PageTransition from "@/components/PageTransition";
import Celebration from "@/components/Celebration";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Try Supabase Auth session first (email-registered users)
      const supabase = createSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        try {
          const res = await fetch(`/api/user?id=${session.user.id}`);
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
            setAuthChecked(true);
            return;
          }
        } catch {
          // Fall through to localStorage check
        }
      }

      // Legacy: check localStorage for Telegram-only users
      const userId = localStorage.getItem("vitrack_user_id");
      const telegramId = localStorage.getItem("vitrack_telegram_id");

      if (!userId || !telegramId) {
        router.push("/");
        return;
      }

      try {
        const res = await fetch(`/api/user?telegram_id=${encodeURIComponent(telegramId)}`);
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          router.push("/");
          return;
        }
      } catch {
        // User fetch failed
      }
      setAuthChecked(true);
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    localStorage.removeItem("vitrack_user_id");
    localStorage.removeItem("vitrack_telegram_id");
    router.push("/");
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#A1A1A1]">Caricamento...</div>
      </div>
    );
  }

  return (
    <PreferencesProvider>
      <Celebration>
        <ChatProvider>
          <div className="min-h-screen">
            <Sidebar currentPath={pathname} user={user} onLogout={handleLogout} />
            <main className="md:ml-60 pb-20 md:pb-0 min-h-screen">
              <PageTransition>{children}</PageTransition>
            </main>
            <BottomNav currentPath={pathname} />
            <ChatPanel />
          </div>
        </ChatProvider>
      </Celebration>
    </PreferencesProvider>
  );
}
