"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";
import ConfirmModal from "@/components/ConfirmModal";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editGoal, setEditGoal] = useState(false);
  const [goalValue, setGoalValue] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);

  // Reset data states
  const [resetType, setResetType] = useState<"meals" | "workouts" | "all" | null>(null);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState("");

  const userId = typeof window !== "undefined" ? localStorage.getItem("vitrack_user_id") : null;

  useEffect(() => {
    const telegramId = localStorage.getItem("vitrack_telegram_id");
    if (!telegramId) { router.push("/"); return; }
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/user?telegram_id=${encodeURIComponent(telegramId)}`);
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setGoalValue(String(data.daily_calorie_goal));
        }
      } catch { /* ignore */ } finally { setLoading(false); }
    };
    fetchUser();
  }, [router]);

  const handleSaveGoal = async () => {
    if (!user || !goalValue) return;
    setSavingGoal(true);
    try {
      const res = await fetch(`/api/user?id=${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daily_calorie_goal: parseInt(goalValue) }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        setEditGoal(false);
      }
    } catch { /* ignore */ } finally { setSavingGoal(false); }
  };

  const handleReset = async () => {
    if (!userId || !resetType) return;
    if (resetType === "all" && resetConfirmText !== "CONFERMA") return;
    setResetting(true);
    try {
      const res = await fetch(`/api/reset-data?user_id=${userId}&type=${resetType}`, { method: "DELETE" });
      if (res.ok) {
        setResetSuccess(
          resetType === "meals" ? "Dati dieta azzerati" :
          resetType === "workouts" ? "Dati allenamento azzerati" :
          "Tutti i dati azzerati"
        );
        setTimeout(() => setResetSuccess(""), 3000);
      }
    } catch { /* ignore */ } finally {
      setResetting(false);
      setResetType(null);
      setResetConfirmText("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("vitrack_user_id");
    localStorage.removeItem("vitrack_telegram_id");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="px-4 md:px-8 py-6 space-y-4">
        <div className="h-8 w-40 shimmer rounded-lg" />
        {[...Array(3)].map((_, i) => <div key={i} className="h-24 shimmer rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 space-y-6 animate-fade-in max-w-2xl">
      <h2 className="text-xl font-bold">Impostazioni</h2>

      {/* Success toast */}
      {resetSuccess && (
        <div className="p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-sm text-center animate-slide-up">
          {resetSuccess}
        </div>
      )}

      {/* Profile section */}
      <div>
        <h3 className="text-xs text-[#666] uppercase tracking-wider font-medium mb-3">Profilo</h3>
        <div className="glass-card divide-y divide-white/[0.06]">
          <div className="p-4 flex justify-between items-center">
            <span className="text-sm text-[#A1A1A1]">Nome</span>
            <span className="text-sm font-medium">{user?.first_name || "—"}</span>
          </div>
          <div className="p-4 flex justify-between items-center">
            <span className="text-sm text-[#A1A1A1]">Username</span>
            <span className="text-sm font-medium">{user?.username ? `@${user.username}` : "—"}</span>
          </div>
          <div className="p-4 flex justify-between items-center">
            <span className="text-sm text-[#A1A1A1]">Telegram ID</span>
            <span className="text-sm font-medium text-[#666]">{user?.telegram_id}</span>
          </div>
          <div className="p-4 flex justify-between items-center">
            <span className="text-sm text-[#A1A1A1]">Obiettivo calorie</span>
            {editGoal ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={goalValue}
                  onChange={(e) => setGoalValue(e.target.value)}
                  className="w-20 bg-transparent border-b border-white/10 text-sm text-right py-0.5 focus:outline-none focus:border-[#3B82F6]/50"
                  autoFocus
                />
                <span className="text-xs text-[#666]">kcal</span>
                <button onClick={handleSaveGoal} disabled={savingGoal} className="text-xs text-[#3B82F6] font-medium">
                  {savingGoal ? "..." : "Salva"}
                </button>
                <button onClick={() => setEditGoal(false)} className="text-xs text-[#666]">Annulla</button>
              </div>
            ) : (
              <button onClick={() => setEditGoal(true)} className="text-sm font-medium hover:text-[#3B82F6] transition-colors">
                {user?.daily_calorie_goal} kcal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div>
        <h3 className="text-xs text-[#666] uppercase tracking-wider font-medium mb-3">Gestione dati</h3>
        <div className="space-y-3">
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Azzera dati dieta</p>
                <p className="text-xs text-[#666] mt-0.5">Elimina tutti i pasti registrati</p>
              </div>
              <button
                onClick={() => setResetType("meals")}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 transition-colors"
              >
                Azzera
              </button>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Azzera dati allenamento</p>
                <p className="text-xs text-[#666] mt-0.5">Elimina tutti gli allenamenti registrati</p>
              </div>
              <button
                onClick={() => setResetType("workouts")}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 transition-colors"
              >
                Azzera
              </button>
            </div>
          </div>

          <div className="glass-card p-4 border-[#EF4444]/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#EF4444]">Azzera tutti i dati</p>
                <p className="text-xs text-[#666] mt-0.5">Elimina TUTTI i dati (pasti, allenamenti, acqua, peso)</p>
              </div>
              <button
                onClick={() => setResetType("all")}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-[#EF4444]/20 text-[#EF4444] hover:bg-[#EF4444]/30 transition-colors"
              >
                Azzera tutto
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-3 glass-card text-[#EF4444] text-sm font-medium hover:bg-white/[0.04] transition-colors"
      >
        Esci dall&apos;account
      </button>

      {/* Reset confirmation modals */}
      <ConfirmModal
        isOpen={resetType === "meals"}
        title="Azzera dati dieta"
        message="Tutti i pasti registrati verranno eliminati. Questa azione è irreversibile."
        confirmLabel="Azzera dieta"
        danger
        loading={resetting}
        onConfirm={handleReset}
        onCancel={() => setResetType(null)}
      />
      <ConfirmModal
        isOpen={resetType === "workouts"}
        title="Azzera dati allenamento"
        message="Tutti gli allenamenti registrati verranno eliminati. Questa azione è irreversibile."
        confirmLabel="Azzera allenamenti"
        danger
        loading={resetting}
        onConfirm={handleReset}
        onCancel={() => setResetType(null)}
      />

      {/* Double confirm for "all" */}
      {resetType === "all" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setResetType(null); setResetConfirmText(""); }} />
          <div className="relative glass-card-strong p-6 w-full max-w-sm animate-scale-in">
            <h3 className="text-lg font-bold text-[#EF4444] mb-2">Azzera tutti i dati</h3>
            <p className="text-sm text-[#A1A1A1] mb-4">
              Questa azione eliminerà TUTTI i tuoi dati: pasti, allenamenti, acqua e peso. Non sarà possibile recuperarli.
            </p>
            <p className="text-sm text-white mb-3">Digita <span className="font-bold text-[#EF4444]">CONFERMA</span> per procedere:</p>
            <input
              type="text"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              placeholder="CONFERMA"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#EF4444]/30 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setResetType(null); setResetConfirmText(""); }}
                className="flex-1 py-2.5 rounded-xl bg-[#111111] text-[#A1A1A1] text-sm font-medium">
                Annulla
              </button>
              <button
                onClick={handleReset}
                disabled={resetConfirmText !== "CONFERMA" || resetting}
                className="flex-1 py-2.5 rounded-xl bg-[#EF4444]/20 text-[#EF4444] text-sm font-medium disabled:opacity-30 transition-colors"
              >
                {resetting ? "..." : "Elimina tutto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
