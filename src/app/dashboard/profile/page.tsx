"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalMeals: 0, totalWorkouts: 0, daysSinceJoin: 0 });

  useEffect(() => {
    const telegramId = localStorage.getItem("vitrack_telegram_id");
    if (!telegramId) { router.push("/"); return; }

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/user?telegram_id=${encodeURIComponent(telegramId)}`);
        if (res.ok) {
          const data = await res.json();
          setUser(data);

          const joinDate = new Date(data.created_at);
          const daysSince = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
          setStats(s => ({ ...s, daysSinceJoin: daysSince }));
        }
      } catch { /* ignore */ } finally { setLoading(false); }
    };
    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="px-4 md:px-8 py-6 space-y-6">
        <div className="h-8 w-32 shimmer rounded-lg" />
        <div className="flex flex-col items-center space-y-3">
          <div className="w-24 h-24 rounded-full shimmer" />
          <div className="h-6 w-40 shimmer rounded-lg" />
        </div>
        <div className="h-40 shimmer rounded-2xl" />
      </div>
    );
  }

  if (!user) return null;

  const initials = user.first_name
    ? user.first_name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const memberSince = new Date(user.created_at).toLocaleDateString("it-IT", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="px-4 md:px-8 py-6 space-y-6 animate-fade-in max-w-2xl">
      <h2 className="text-xl font-bold">Profilo</h2>

      {/* Avatar */}
      <div className="flex flex-col items-center space-y-3">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center gradient-border">
          <span className="text-3xl font-bold">{initials}</span>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold">{user.first_name || "Utente"}</p>
          {user.username && <p className="text-sm text-[#666]">@{user.username}</p>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4 text-center">
          <p className="text-xl font-bold">{stats.daysSinceJoin}</p>
          <p className="text-[10px] text-[#666] uppercase tracking-wider mt-1">Giorni</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xl font-bold text-[#3B82F6]">{user.daily_calorie_goal}</p>
          <p className="text-[10px] text-[#666] uppercase tracking-wider mt-1">Ob. Calorie</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xl font-bold gradient-text">ViTrack</p>
          <p className="text-[10px] text-[#666] uppercase tracking-wider mt-1">Piano</p>
        </div>
      </div>

      {/* Info */}
      <div className="glass-card divide-y divide-white/[0.06]">
        <div className="p-4 flex justify-between items-center">
          <span className="text-sm text-[#A1A1A1]">Membro dal</span>
          <span className="text-sm font-medium">{memberSince}</span>
        </div>
        <div className="p-4 flex justify-between items-center">
          <span className="text-sm text-[#A1A1A1]">Telegram ID</span>
          <span className="text-sm font-medium text-[#666]">{user.telegram_id}</span>
        </div>
        <div className="p-4 flex justify-between items-center">
          <span className="text-sm text-[#A1A1A1]">Obiettivo calorie</span>
          <span className="text-sm font-medium">{user.daily_calorie_goal} kcal</span>
        </div>
      </div>

      <Link
        href="/dashboard/settings"
        className="block w-full py-3 glass-card text-center text-sm font-medium text-[#A1A1A1] hover:text-white transition-colors"
      >
        Vai alle impostazioni →
      </Link>
    </div>
  );
}
