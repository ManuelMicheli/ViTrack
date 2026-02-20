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

  // Goals states
  const [editWaterGoal, setEditWaterGoal] = useState(false);
  const [waterGoalValue, setWaterGoalValue] = useState("");
  const [editWeightGoal, setEditWeightGoal] = useState(false);
  const [weightGoalValue, setWeightGoalValue] = useState("");
  const [editHeight, setEditHeight] = useState(false);
  const [heightValue, setHeightValue] = useState("");
  const [savingField, setSavingField] = useState("");

  // Reset data states
  const [resetType, setResetType] = useState<"meals" | "workouts" | "all" | null>(null);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetError, setResetError] = useState("");

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

  const handleSaveField = async (field: string, value: unknown) => {
    if (!user) return;
    setSavingField(field);
    try {
      const res = await fetch(`/api/user?id=${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
      }
    } catch { /* ignore */ } finally {
      setSavingField("");
    }
  };

  const handleReset = async () => {
    if (!userId || !resetType) return;
    if (resetType === "all" && resetConfirmText !== "CONFERMA") return;
    setResetting(true);
    setResetError("");
    try {
      const res = await fetch(`/api/reset-data?user_id=${userId}&type=${resetType}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setResetSuccess(
          resetType === "meals" ? `Dati dieta azzerati (${data.deleted} record)` :
          resetType === "workouts" ? `Dati allenamento azzerati (${data.deleted} record)` :
          `Tutti i dati azzerati (${data.deleted} record)`
        );
        setTimeout(() => setResetSuccess(""), 4000);
      } else {
        setResetError(data.error || "Errore durante l'eliminazione");
        setTimeout(() => setResetError(""), 5000);
      }
    } catch {
      setResetError("Errore di connessione. Riprova.");
      setTimeout(() => setResetError(""), 5000);
    } finally {
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

      {/* Error toast */}
      {resetError && (
        <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-sm text-center animate-slide-up">
          {resetError}
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

      {/* Obiettivi section */}
      <div>
        <h3 className="text-xs text-[#666] uppercase tracking-wider font-medium mb-3">Obiettivi</h3>
        <div className="glass-card divide-y divide-white/[0.06]">
          {/* Water goal */}
          <div className="p-4 flex justify-between items-center">
            <div>
              <span className="text-sm text-[#A1A1A1]">Obiettivo acqua</span>
              <p className="text-[10px] text-[#666] mt-0.5">Consumo giornaliero target</p>
            </div>
            {editWaterGoal ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={waterGoalValue}
                  onChange={(e) => setWaterGoalValue(e.target.value)}
                  className="w-20 bg-transparent border-b border-white/10 text-sm text-right py-0.5 focus:outline-none focus:border-[#06B6D4]/50"
                  autoFocus
                />
                <span className="text-xs text-[#666]">ml</span>
                <button
                  onClick={() => {
                    const val = parseInt(waterGoalValue);
                    if (val > 0 && val <= 10000) {
                      handleSaveField("water_goal_ml", val);
                      setEditWaterGoal(false);
                    }
                  }}
                  disabled={savingField === "water_goal_ml"}
                  className="text-xs text-[#06B6D4] font-medium"
                >
                  {savingField === "water_goal_ml" ? "..." : "Salva"}
                </button>
                <button onClick={() => setEditWaterGoal(false)} className="text-xs text-[#666]">Annulla</button>
              </div>
            ) : (
              <button
                onClick={() => { setEditWaterGoal(true); setWaterGoalValue(String(user?.water_goal_ml ?? 2000)); }}
                className="text-sm font-medium text-[#06B6D4] hover:text-[#06B6D4]/80 transition-colors"
              >
                {user?.water_goal_ml ?? 2000} ml
              </button>
            )}
          </div>

          {/* Water tracking mode */}
          <div className="p-4 flex justify-between items-center">
            <div>
              <span className="text-sm text-[#A1A1A1]">Modalita tracciamento</span>
              <p className="text-[10px] text-[#666] mt-0.5">Bicchieri o millilitri</p>
            </div>
            <div className="flex bg-white/[0.04] rounded-lg p-0.5">
              <button
                onClick={() => handleSaveField("water_tracking_mode", "glasses")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  (user?.water_tracking_mode ?? "glasses") === "glasses"
                    ? "bg-[#06B6D4]/20 text-[#06B6D4]"
                    : "text-[#666] hover:text-[#999]"
                }`}
              >
                Bicchieri
              </button>
              <button
                onClick={() => handleSaveField("water_tracking_mode", "ml")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  user?.water_tracking_mode === "ml"
                    ? "bg-[#06B6D4]/20 text-[#06B6D4]"
                    : "text-[#666] hover:text-[#999]"
                }`}
              >
                ML
              </button>
            </div>
          </div>

          {/* Weight goal */}
          <div className="p-4 flex justify-between items-center">
            <div>
              <span className="text-sm text-[#A1A1A1]">Peso obiettivo</span>
              <p className="text-[10px] text-[#666] mt-0.5">Il tuo peso target</p>
            </div>
            {editWeightGoal ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={weightGoalValue}
                  onChange={(e) => setWeightGoalValue(e.target.value)}
                  className="w-20 bg-transparent border-b border-white/10 text-sm text-right py-0.5 focus:outline-none focus:border-[#A78BFA]/50"
                  autoFocus
                />
                <span className="text-xs text-[#666]">kg</span>
                <button
                  onClick={() => {
                    const val = parseFloat(weightGoalValue);
                    if (val > 0 && val < 500) {
                      handleSaveField("weight_goal_kg", val);
                      setEditWeightGoal(false);
                    }
                  }}
                  disabled={savingField === "weight_goal_kg"}
                  className="text-xs text-[#A78BFA] font-medium"
                >
                  {savingField === "weight_goal_kg" ? "..." : "Salva"}
                </button>
                <button onClick={() => setEditWeightGoal(false)} className="text-xs text-[#666]">Annulla</button>
              </div>
            ) : (
              <button
                onClick={() => { setEditWeightGoal(true); setWeightGoalValue(user?.weight_goal_kg ? String(user.weight_goal_kg) : ""); }}
                className="text-sm font-medium text-[#A78BFA] hover:text-[#A78BFA]/80 transition-colors"
              >
                {user?.weight_goal_kg ? `${user.weight_goal_kg} kg` : "Non impostato"}
              </button>
            )}
          </div>

          {/* Height */}
          <div className="p-4 flex justify-between items-center">
            <div>
              <span className="text-sm text-[#A1A1A1]">Altezza</span>
              <p className="text-[10px] text-[#666] mt-0.5">Per il calcolo del BMI</p>
            </div>
            {editHeight ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={heightValue}
                  onChange={(e) => setHeightValue(e.target.value)}
                  className="w-20 bg-transparent border-b border-white/10 text-sm text-right py-0.5 focus:outline-none focus:border-[#22C55E]/50"
                  autoFocus
                />
                <span className="text-xs text-[#666]">cm</span>
                <button
                  onClick={() => {
                    const val = parseInt(heightValue);
                    if (val > 50 && val < 300) {
                      handleSaveField("height_cm", val);
                      setEditHeight(false);
                    }
                  }}
                  disabled={savingField === "height_cm"}
                  className="text-xs text-[#22C55E] font-medium"
                >
                  {savingField === "height_cm" ? "..." : "Salva"}
                </button>
                <button onClick={() => setEditHeight(false)} className="text-xs text-[#666]">Annulla</button>
              </div>
            ) : (
              <button
                onClick={() => { setEditHeight(true); setHeightValue(user?.height_cm ? String(user.height_cm) : ""); }}
                className="text-sm font-medium hover:text-[#22C55E] transition-colors"
              >
                {user?.height_cm ? `${user.height_cm} cm` : "Non impostato"}
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
