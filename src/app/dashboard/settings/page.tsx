"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import type { User } from "@/lib/types";
import ConfirmModal from "@/components/ConfirmModal";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { usePreferences, ACCENT_COLORS, type AccentColor } from "@/lib/preferences-context";

const sectionLabels: Record<string, string> = {
  greeting: "Saluto",
  quickadd: "Azioni rapide",
  calories: "Calorie e Macro",
  "water-streak": "Acqua e Streak",
  weight: "Peso",
  meals: "Pasti",
  workouts: "Allenamenti",
};

export default function SettingsPage() {
  const router = useRouter();
  const { accentColor, accentHex, setAccentColor, layoutMode, setLayoutMode, sectionOrder, setSectionOrder, saveError: prefSaveError } = usePreferences();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile editing states
  const [editGoal, setEditGoal] = useState(false);
  const [goalValue, setGoalValue] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);
  const [editWaterGoal, setEditWaterGoal] = useState(false);
  const [waterGoalValue, setWaterGoalValue] = useState("");
  const [editWeightGoal, setEditWeightGoal] = useState(false);
  const [weightGoalValue, setWeightGoalValue] = useState("");
  const [editHeight, setEditHeight] = useState(false);
  const [heightValue, setHeightValue] = useState("");
  const [savingField, setSavingField] = useState("");

  // Password change states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Telegram link states
  const [telegramInput, setTelegramInput] = useState("");
  const [telegramSaving, setTelegramSaving] = useState(false);
  const [telegramMsg, setTelegramMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Reset data states
  const [resetType, setResetType] = useState<"meals" | "workouts" | "all" | null>(null);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetError, setResetError] = useState("");

  // Personalization save feedback
  const [prefSaved, setPrefSaved] = useState(false);
  const prefSavedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Global save toast (success/error for any setting)
  const [saveToast, setSaveToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const saveToastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showSaveToast = useCallback((type: "success" | "error", text: string) => {
    setSaveToast({ type, text });
    if (saveToastTimer.current) clearTimeout(saveToastTimer.current);
    saveToastTimer.current = setTimeout(() => setSaveToast(null), 4000);
  }, []);

  const showPrefSaved = useCallback(() => {
    setPrefSaved(true);
    if (prefSavedTimer.current) clearTimeout(prefSavedTimer.current);
    prefSavedTimer.current = setTimeout(() => setPrefSaved(false), 2000);
  }, []);

  const userId = typeof window !== "undefined" ? localStorage.getItem("vitrack_user_id") : null;

  const fetchUser = useCallback(async () => {
    try {
      // Try Supabase Auth session first
      const supabase = createSupabaseBrowser();
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user?.id) {
        const res = await fetch(`/api/user?id=${encodeURIComponent(sessionData.session.user.id)}`);
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setGoalValue(String(data.daily_calorie_goal));
          setLoading(false);
          return;
        }
      }

      // Fallback to localStorage telegram_id
      const telegramId = localStorage.getItem("vitrack_telegram_id");
      if (!telegramId) {
        router.push("/");
        return;
      }
      const res = await fetch(`/api/user?telegram_id=${encodeURIComponent(telegramId)}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setGoalValue(String(data.daily_calorie_goal));
      } else {
        router.push("/");
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

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
      } else {
        showSaveToast("error", "Errore nel salvare l'obiettivo calorie");
      }
    } catch {
      showSaveToast("error", "Errore di connessione. Riprova.");
    } finally {
      setSavingGoal(false);
    }
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
      } else {
        showSaveToast("error", "Errore nel salvare l'impostazione");
      }
    } catch {
      showSaveToast("error", "Errore di connessione. Riprova.");
    } finally {
      setSavingField("");
    }
  };

  const handleQuickSave = async (field: string, value: unknown) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/user?id=${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
      } else {
        showSaveToast("error", "Errore nel salvare l'impostazione");
      }
    } catch {
      showSaveToast("error", "Errore di connessione. Riprova.");
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Le password non corrispondono" });
      setTimeout(() => setPasswordMsg(null), 4000);
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "La password deve essere di almeno 6 caratteri" });
      setTimeout(() => setPasswordMsg(null), 4000);
      return;
    }
    setPasswordSaving(true);
    try {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordMsg({ type: "error", text: error.message });
      } else {
        setPasswordMsg({ type: "success", text: "Password aggiornata con successo" });
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordForm(false);
      }
      setTimeout(() => setPasswordMsg(null), 4000);
    } catch {
      setPasswordMsg({ type: "error", text: "Errore durante l'aggiornamento" });
      setTimeout(() => setPasswordMsg(null), 4000);
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLinkTelegram = async () => {
    if (!user || !telegramInput.trim()) return;
    const parsed = parseInt(telegramInput.trim());
    if (isNaN(parsed)) {
      setTelegramMsg({ type: "error", text: "ID Telegram non valido" });
      setTimeout(() => setTelegramMsg(null), 4000);
      return;
    }
    setTelegramSaving(true);
    try {
      const res = await fetch(`/api/user?id=${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegram_id: parsed }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        setTelegramInput("");
        setTelegramMsg({ type: "success", text: "Telegram collegato con successo" });
      } else {
        setTelegramMsg({ type: "error", text: "Errore durante il collegamento" });
      }
      setTimeout(() => setTelegramMsg(null), 4000);
    } catch {
      setTelegramMsg({ type: "error", text: "Errore di connessione" });
      setTimeout(() => setTelegramMsg(null), 4000);
    } finally {
      setTelegramSaving(false);
    }
  };

  const handleUnlinkTelegram = async () => {
    if (!user) return;
    setTelegramSaving(true);
    try {
      const res = await fetch(`/api/user?id=${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegram_id: null }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        setTelegramMsg({ type: "success", text: "Telegram scollegato" });
      } else {
        setTelegramMsg({ type: "error", text: "Errore durante lo scollegamento" });
      }
      setTimeout(() => setTelegramMsg(null), 4000);
    } catch {
      setTelegramMsg({ type: "error", text: "Errore di connessione" });
      setTimeout(() => setTelegramMsg(null), 4000);
    } finally {
      setTelegramSaving(false);
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
          resetType === "meals"
            ? `Dati dieta azzerati (${data.deleted} record)`
            : resetType === "workouts"
            ? `Dati allenamento azzerati (${data.deleted} record)`
            : `Tutti i dati azzerati (${data.deleted} record)`
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

  const handleExportData = () => {
    if (!user) return;
    window.open(`/api/user/export?user_id=${user.id}`, "_blank");
  };

  const handleLogout = async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    localStorage.removeItem("vitrack_user_id");
    localStorage.removeItem("vitrack_telegram_id");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="px-4 md:px-8 py-6 space-y-4">
        <div className="h-8 w-40 shimmer rounded-lg" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 shimmer rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 space-y-6 animate-fade-in max-w-2xl">
      <h2 className="text-xl font-bold">Impostazioni</h2>

      {/* Global toasts */}
      {resetSuccess && (
        <div className="p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-sm text-center animate-slide-up">
          {resetSuccess}
        </div>
      )}
      {resetError && (
        <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-sm text-center animate-slide-up">
          {resetError}
        </div>
      )}
      {saveToast && (
        <div
          className={`p-3 rounded-xl text-sm text-center animate-slide-up ${
            saveToast.type === "error"
              ? "bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444]"
              : "bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E]"
          }`}
        >
          {saveToast.text}
        </div>
      )}
      {prefSaveError && (
        <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-sm text-center animate-slide-up">
          {prefSaveError}
        </div>
      )}
      {/* ──────────── 1. Account Section ──────────── */}
      <div className="glass-card-strong rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Account</h3>
        <div className="space-y-4">
          {/* Email */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#A1A1A1]">Email</span>
            <span className="text-sm font-medium text-white/70">
              {user?.email || "Non impostata"}
            </span>
          </div>

          {/* Password change */}
          <div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#A1A1A1]">Password</span>
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="text-xs text-[#3B82F6] font-medium hover:text-[#3B82F6]/80 transition-colors"
              >
                {showPasswordForm ? "Annulla" : "Cambio Password"}
              </button>
            </div>
            {showPasswordForm && (
              <div className="mt-3 space-y-3">
                <input
                  type="password"
                  placeholder="Nuova password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#3B82F6]/30"
                />
                <input
                  type="password"
                  placeholder="Conferma password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#3B82F6]/30"
                />
                {passwordMsg && (
                  <p
                    className={`text-xs ${
                      passwordMsg.type === "success" ? "text-[#22C55E]" : "text-[#EF4444]"
                    }`}
                  >
                    {passwordMsg.text}
                  </p>
                )}
                <button
                  onClick={handlePasswordChange}
                  disabled={passwordSaving || !newPassword || !confirmPassword}
                  className="w-full py-2.5 rounded-xl bg-[#3B82F6]/20 text-[#3B82F6] text-sm font-medium hover:bg-[#3B82F6]/30 transition-colors disabled:opacity-40"
                >
                  {passwordSaving ? "Aggiornamento..." : "Aggiorna Password"}
                </button>
              </div>
            )}
          </div>

          {/* Telegram link/unlink */}
          <div className="border-t border-white/[0.06] pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#A1A1A1]">Telegram</span>
              {user?.telegram_id ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/70">{user.telegram_id}</span>
                  <button
                    onClick={handleUnlinkTelegram}
                    disabled={telegramSaving}
                    className="text-xs text-[#EF4444] font-medium hover:text-[#EF4444]/80 transition-colors"
                  >
                    {telegramSaving ? "..." : "Scollega"}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Telegram ID"
                    value={telegramInput}
                    onChange={(e) => setTelegramInput(e.target.value)}
                    className="w-32 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#3B82F6]/30"
                  />
                  <button
                    onClick={handleLinkTelegram}
                    disabled={telegramSaving || !telegramInput.trim()}
                    className="text-xs text-[#3B82F6] font-medium hover:text-[#3B82F6]/80 transition-colors disabled:opacity-40"
                  >
                    {telegramSaving ? "..." : "Collega"}
                  </button>
                </div>
              )}
            </div>
            {telegramMsg && (
              <p
                className={`text-xs mt-2 ${
                  telegramMsg.type === "success" ? "text-[#22C55E]" : "text-[#EF4444]"
                }`}
              >
                {telegramMsg.text}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ──────────── Profile Section (kept from original) ──────────── */}
      <div className="glass-card-strong rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Profilo</h3>
        <div className="space-y-0 divide-y divide-white/[0.06]">
          <div className="py-3 flex justify-between items-center">
            <span className="text-sm text-[#A1A1A1]">Nome</span>
            <span className="text-sm font-medium">{user?.first_name || "\u2014"}</span>
          </div>
          <div className="py-3 flex justify-between items-center">
            <span className="text-sm text-[#A1A1A1]">Username</span>
            <span className="text-sm font-medium">{user?.username ? `@${user.username}` : "\u2014"}</span>
          </div>
        </div>
      </div>

      {/* ──────────── Obiettivi Section (kept from original) ──────────── */}
      <div className="glass-card-strong rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Obiettivi</h3>
        <div className="space-y-0 divide-y divide-white/[0.06]">
          {/* Calorie goal */}
          <div className="py-3 flex justify-between items-center">
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
                <button onClick={() => setEditGoal(false)} className="text-xs text-[#666]">
                  Annulla
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditGoal(true)}
                className="text-sm font-medium hover:text-[#3B82F6] transition-colors"
              >
                {user?.daily_calorie_goal} kcal
              </button>
            )}
          </div>

          {/* Water goal */}
          <div className="py-3 flex justify-between items-center">
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
                <button onClick={() => setEditWaterGoal(false)} className="text-xs text-[#666]">
                  Annulla
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditWaterGoal(true);
                  setWaterGoalValue(String(user?.water_goal_ml ?? 2000));
                }}
                className="text-sm font-medium text-[#06B6D4] hover:text-[#06B6D4]/80 transition-colors"
              >
                {user?.water_goal_ml ?? 2000} ml
              </button>
            )}
          </div>

          {/* Water tracking mode */}
          <div className="py-3 flex justify-between items-center">
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
          <div className="py-3 flex justify-between items-center">
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
                <button onClick={() => setEditWeightGoal(false)} className="text-xs text-[#666]">
                  Annulla
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditWeightGoal(true);
                  setWeightGoalValue(user?.weight_goal_kg ? String(user.weight_goal_kg) : "");
                }}
                className="text-sm font-medium text-[#A78BFA] hover:text-[#A78BFA]/80 transition-colors"
              >
                {user?.weight_goal_kg ? `${user.weight_goal_kg} kg` : "Non impostato"}
              </button>
            )}
          </div>

          {/* Height */}
          <div className="py-3 flex justify-between items-center">
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
                <button onClick={() => setEditHeight(false)} className="text-xs text-[#666]">
                  Annulla
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditHeight(true);
                  setHeightValue(user?.height_cm ? String(user.height_cm) : "");
                }}
                className="text-sm font-medium hover:text-[#22C55E] transition-colors"
              >
                {user?.height_cm ? `${user.height_cm} cm` : "Non impostato"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ──────────── Personalizzazione ──────────── */}
      <div className="glass-card-strong rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Personalizzazione</h3>
          <AnimatePresence>
            {prefSaved && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ backgroundColor: `${accentHex}20`, color: accentHex }}
              >
                Salvato
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="space-y-0 divide-y divide-white/[0.06]">
          {/* Accent color */}
          <div className="py-3">
            <span className="text-sm text-[#A1A1A1] block mb-3">Colore accento</span>
            <div className="flex gap-3">
              {(Object.entries(ACCENT_COLORS) as [AccentColor, string][]).map(([key, hex]) => (
                <motion.button
                  key={key}
                  onClick={() => { setAccentColor(key); showPrefSaved(); }}
                  className={`w-8 h-8 rounded-full border-2 transition-colors ${
                    accentColor === key ? "border-white" : "border-transparent"
                  }`}
                  style={{ backgroundColor: hex }}
                  whileTap={{ scale: 0.9 }}
                  animate={accentColor === key ? { scale: 1.1 } : { scale: 1 }}
                />
              ))}
            </div>
          </div>

          {/* Layout mode */}
          <div className="py-3 flex justify-between items-center">
            <div>
              <span className="text-sm text-[#A1A1A1]">Layout</span>
              <p className="text-[10px] text-[#666] mt-0.5">Compatto o espanso</p>
            </div>
            <div className="flex bg-white/[0.04] rounded-lg p-0.5">
              <button
                onClick={() => { setLayoutMode("compact"); showPrefSaved(); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all`}
                style={layoutMode === "compact" ? { backgroundColor: `${accentHex}20`, color: accentHex } : { color: "#666" }}
              >
                Compatto
              </button>
              <button
                onClick={() => { setLayoutMode("expanded"); showPrefSaved(); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all`}
                style={layoutMode === "expanded" ? { backgroundColor: `${accentHex}20`, color: accentHex } : { color: "#666" }}
              >
                Espanso
              </button>
            </div>
          </div>

          {/* Section order */}
          <div className="py-3">
            <span className="text-sm text-[#A1A1A1] block mb-3">Ordine sezioni dashboard</span>
            <Reorder.Group
              axis="y"
              values={sectionOrder}
              onReorder={(newOrder) => { setSectionOrder(newOrder); showPrefSaved(); }}
              className="space-y-1.5"
            >
              {sectionOrder.map((section, i) => (
                <Reorder.Item
                  key={section}
                  value={section}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] cursor-grab active:cursor-grabbing"
                >
                  <span className="text-[#666]">&#x2807;</span>
                  <span className="text-sm flex-1">{sectionLabels[section] || section}</span>
                  <span className="text-[10px] text-[#444] tabular-nums">{i + 1}</span>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>

          {/* Live preview */}
          <div className="py-3">
            <span className="text-sm text-[#A1A1A1] block mb-3">Anteprima</span>
            <div className="rounded-xl bg-black/40 border border-white/[0.06] p-3 overflow-hidden">
              {/* Mini sidebar + content preview */}
              <div className="flex gap-2">
                {/* Mini sidebar */}
                <div className="hidden sm:flex flex-col gap-1 w-10 shrink-0">
                  {[0,1,2,3,4].map((i) => (
                    <div
                      key={i}
                      className="h-2 rounded-full transition-all duration-300"
                      style={i === 0 ? { backgroundColor: `${accentHex}40`, border: `1px solid ${accentHex}30` } : { backgroundColor: "rgba(255,255,255,0.05)" }}
                    />
                  ))}
                </div>
                {/* Mini dashboard sections */}
                <div className={`flex-1 ${layoutMode === "compact" ? "space-y-1" : "space-y-2"} transition-all duration-300`}>
                  {sectionOrder.slice(0, 5).map((section, i) => (
                    <motion.div
                      key={section}
                      layout
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className={`rounded-md transition-all duration-300 flex items-center gap-1.5 px-2 ${
                        layoutMode === "compact" ? "h-4" : "h-6"
                      }`}
                      style={{
                        backgroundColor: i === 0 ? `${accentHex}15` : "rgba(255,255,255,0.03)",
                        borderLeft: i === 0 ? `2px solid ${accentHex}` : "2px solid transparent",
                      }}
                    >
                      <span className="text-[8px] text-white/40 truncate">{sectionLabels[section] || section}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────── 2. Aspetto Section ──────────── */}
      <div className="glass-card-strong rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Aspetto</h3>
        <div className="space-y-5">
          {/* Theme */}
          <div>
            <p className="text-sm text-[#A1A1A1] mb-2">Tema</p>
            <div className="flex gap-2">
              {(
                [
                  { value: "dark", label: "Scuro" },
                  { value: "light", label: "Chiaro" },
                  { value: "auto", label: "Auto" },
                ] as const
              ).map((opt) => {
                const isSelected = (user?.theme ?? "dark") === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleQuickSave("theme", opt.value)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                      isSelected
                        ? "border"
                        : "bg-white/5 border border-white/[0.06] text-[#A1A1A1] hover:text-white hover:bg-white/[0.08]"
                    }`}
                    style={isSelected ? { backgroundColor: `${accentHex}20`, borderColor: `${accentHex}66`, color: accentHex } : undefined}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language */}
          <div>
            <p className="text-sm text-[#A1A1A1] mb-2">Lingua</p>
            <div className="flex gap-2">
              {(
                [
                  { value: "it", label: "Italiano" },
                  { value: "en", label: "English" },
                ] as const
              ).map((opt) => {
                const isSelected = (user?.language ?? "it") === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleQuickSave("language", opt.value)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                      isSelected
                        ? "border"
                        : "bg-white/5 border border-white/[0.06] text-[#A1A1A1] hover:text-white hover:bg-white/[0.08]"
                    }`}
                    style={isSelected ? { backgroundColor: `${accentHex}20`, borderColor: `${accentHex}66`, color: accentHex } : undefined}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unit system */}
          <div>
            <p className="text-sm text-[#A1A1A1] mb-2">Unita di misura</p>
            <div className="flex gap-2">
              {(
                [
                  { value: "metric", label: "Metrico (kg/cm)" },
                  { value: "imperial", label: "Imperiale (lbs/in)" },
                ] as const
              ).map((opt) => {
                const isSelected = (user?.unit_system ?? "metric") === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleQuickSave("unit_system", opt.value)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                      isSelected
                        ? "border"
                        : "bg-white/5 border border-white/[0.06] text-[#A1A1A1] hover:text-white hover:bg-white/[0.08]"
                    }`}
                    style={isSelected ? { backgroundColor: `${accentHex}20`, borderColor: `${accentHex}66`, color: accentHex } : undefined}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ──────────── 3. Notifiche Section ──────────── */}
      <div className="glass-card-strong rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Notifiche</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white">
              {user?.notifications_enabled ? "Notifiche attive" : "Notifiche disattivate"}
            </p>
            <p className="text-[10px] text-[#666] mt-0.5">Ricevi promemoria e aggiornamenti</p>
          </div>
          <button
            onClick={() => handleQuickSave("notifications_enabled", !user?.notifications_enabled)}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              user?.notifications_enabled ? "" : "bg-white/10"
            }`}
            style={user?.notifications_enabled ? { backgroundColor: accentHex } : undefined}
            aria-label="Toggle notifiche"
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                user?.notifications_enabled ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* ──────────── 4. Gestione Dati Section ──────────── */}
      <div className="glass-card-strong rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Gestione Dati</h3>
        <div className="space-y-3">
          {/* Reset meals */}
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

          <div className="border-t border-white/[0.06]" />

          {/* Reset workouts */}
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

          <div className="border-t border-white/[0.06]" />

          {/* Reset all */}
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

          <div className="border-t border-white/[0.06]" />

          {/* Export data */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Esporta Dati</p>
              <p className="text-xs text-[#666] mt-0.5">Scarica tutti i tuoi dati</p>
            </div>
            <button
              onClick={handleExportData}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-[#3B82F6]/10 text-[#3B82F6] hover:bg-[#3B82F6]/20 transition-colors"
            >
              Esporta
            </button>
          </div>
        </div>
      </div>

      {/* ──────────── 5. Logout ──────────── */}
      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-sm font-medium hover:bg-[#EF4444]/20 transition-colors"
      >
        Esci dall&apos;account
      </button>

      {/* ──────────── Reset Confirmation Modals ──────────── */}
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
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              setResetType(null);
              setResetConfirmText("");
            }}
          />
          <div className="relative glass-card-strong p-6 w-full max-w-sm animate-scale-in">
            <h3 className="text-lg font-bold text-[#EF4444] mb-2">Azzera tutti i dati</h3>
            <p className="text-sm text-[#A1A1A1] mb-4">
              Questa azione eliminera TUTTI i tuoi dati: pasti, allenamenti, acqua e peso. Non sara possibile
              recuperarli.
            </p>
            <p className="text-sm text-white mb-3">
              Digita <span className="font-bold text-[#EF4444]">CONFERMA</span> per procedere:
            </p>
            <input
              type="text"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              placeholder="CONFERMA"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#EF4444]/30 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setResetType(null);
                  setResetConfirmText("");
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#111111] text-[#A1A1A1] text-sm font-medium"
              >
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
