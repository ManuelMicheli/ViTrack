"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import type { User } from "@/lib/types";
import ConfirmModal from "@/components/ConfirmModal";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { usePreferences, ACCENT_COLORS, type AccentColor } from "@/lib/preferences-context";
import { useTheme, type Theme } from "@/lib/theme-context";
import { useLanguage } from "@/lib/language-context";

const SECTION_KEYS = ["greeting", "quickadd", "calories", "water-streak", "weight", "meals", "workouts"] as const;

const sectionTranslationKeys: Record<string, string> = {
  greeting: "section.greeting",
  quickadd: "section.quickadd",
  calories: "section.calories",
  "water-streak": "section.waterStreak",
  weight: "section.weight",
  meals: "section.meals",
  workouts: "section.workouts",
};

const ACCENT_COLOR_LABELS: Record<AccentColor, string> = {
  ivory: "Ivory",
  red: "Signal Red",
  blue: "Cold Blue",
};

export default function SettingsPage() {
  const router = useRouter();
  const { accentColor, accentHex, setAccentColor, layoutMode, setLayoutMode, sectionOrder, setSectionOrder, saveError: prefSaveError } = usePreferences();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
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
  const [showTelegramGuide, setShowTelegramGuide] = useState(false);

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
    if (!user) return;
    const parsed = parseInt(goalValue);
    if (isNaN(parsed) || parsed <= 0) {
      showSaveToast("error", t("error.saveGoal"));
      return;
    }
    setSavingGoal(true);
    try {
      const res = await fetch(`/api/user?id=${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daily_calorie_goal: parsed }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        setEditGoal(false);
        showSaveToast("success", t("settings.saved"));
      } else {
        showSaveToast("error", t("error.saveGoal"));
      }
    } catch {
      showSaveToast("error", t("error.connection"));
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
        showSaveToast("success", t("settings.saved"));
      } else {
        showSaveToast("error", t("error.saveSetting"));
      }
    } catch {
      showSaveToast("error", t("error.connection"));
    } finally {
      setSavingField("");
    }
  };

  const handleQuickSave = async (field: string, value: unknown) => {
    if (!user) return;
    // Apply theme/language changes immediately to context
    if (field === "theme") {
      setTheme(value as Theme);
    }
    if (field === "language") {
      setLanguage(value as "it" | "en");
    }
    try {
      const res = await fetch(`/api/user?id=${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        showSaveToast("success", t("settings.saved"));
      } else {
        showSaveToast("error", t("error.saveSetting"));
      }
    } catch {
      showSaveToast("error", t("error.connection"));
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: t("settings.passwordMismatch") });
      setTimeout(() => setPasswordMsg(null), 4000);
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: t("settings.passwordTooShort") });
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
        setPasswordMsg({ type: "success", text: t("settings.passwordUpdated") });
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordForm(false);
      }
      setTimeout(() => setPasswordMsg(null), 4000);
    } catch {
      setPasswordMsg({ type: "error", text: t("settings.passwordError") });
      setTimeout(() => setPasswordMsg(null), 4000);
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLinkTelegram = async () => {
    if (!user || !telegramInput.trim()) return;
    const parsed = parseInt(telegramInput.trim());
    if (isNaN(parsed)) {
      setTelegramMsg({ type: "error", text: t("settings.telegramInvalid") });
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
        setTelegramMsg({ type: "success", text: t("settings.telegramLinked") });
      } else {
        setTelegramMsg({ type: "error", text: t("settings.telegramLinkError") });
      }
      setTimeout(() => setTelegramMsg(null), 4000);
    } catch {
      setTelegramMsg({ type: "error", text: t("error.connection") });
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
        setTelegramMsg({ type: "success", text: t("settings.telegramUnlinked") });
      } else {
        setTelegramMsg({ type: "error", text: t("settings.telegramUnlinkError") });
      }
      setTimeout(() => setTelegramMsg(null), 4000);
    } catch {
      setTelegramMsg({ type: "error", text: t("error.connection") });
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
            ? `${t("settings.resetSuccessMeals")} (${data.deleted} record)`
            : resetType === "workouts"
            ? `${t("settings.resetSuccessWorkouts")} (${data.deleted} record)`
            : `${t("settings.resetSuccessAll")} (${data.deleted} record)`
        );
        setTimeout(() => setResetSuccess(""), 4000);
      } else {
        setResetError(data.error || t("settings.resetError"));
        setTimeout(() => setResetError(""), 5000);
      }
    } catch {
      setResetError(t("error.connection"));
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

  // Helper to get section label with i18n
  const getSectionLabel = (key: string) => {
    const tKey = sectionTranslationKeys[key];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return tKey ? t(tKey as any) : key;
  };

  if (loading) {
    return (
      <div className="px-4 md:px-8 py-6 space-y-4">
        <div className="h-8 w-40 shimmer rounded-lg" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 shimmer rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 space-y-10 animate-fade-in max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-text-primary">{t("settings.title").toUpperCase()}</h1>

      {/* Global toasts */}
      {resetSuccess && (
        <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm text-center animate-slide-up">
          {resetSuccess}
        </div>
      )}
      {resetError && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm text-center animate-slide-up">
          {resetError}
        </div>
      )}
      {saveToast && (
        <div
          className={`p-3 rounded-lg text-sm text-center animate-slide-up ${
            saveToast.type === "error"
              ? "bg-danger/10 border border-danger/20 text-danger"
              : "bg-success/10 border border-success/20 text-success"
          }`}
        >
          {saveToast.text}
        </div>
      )}
      {prefSaveError && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm text-center animate-slide-up">
          {prefSaveError}
        </div>
      )}

      {/* ──────────── 1. Account Section ──────────── */}
      <div>
        <h3 className="font-mono-label text-text-tertiary mb-4">{t("settings.account")}</h3>
        <div className="space-y-4">
          {/* Email */}
          <div className="flex justify-between items-center">
            <span className="font-body text-sm text-text-secondary">{t("settings.email")}</span>
            <span className="font-body text-sm text-text-tertiary">
              {user?.email || t("settings.emailNotSet")}
            </span>
          </div>

          {/* Password change */}
          <div>
            <div className="flex justify-between items-center">
              <span className="font-body text-sm text-text-secondary">{t("settings.password")}</span>
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="font-mono-label text-[var(--color-accent-dynamic)] hover:opacity-80 transition-colors"
              >
                {showPasswordForm ? t("settings.cancel") : t("settings.changePassword")}
              </button>
            </div>
            {showPasswordForm && (
              <div className="mt-3 space-y-3">
                <input
                  type="password"
                  placeholder={t("settings.newPassword")}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-transparent border border-border focus:outline-none focus:border-[var(--color-accent-dynamic)] text-text-primary placeholder-text-tertiary font-body transition-all"
                />
                <input
                  type="password"
                  placeholder={t("settings.confirmPassword")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-transparent border border-border focus:outline-none focus:border-[var(--color-accent-dynamic)] text-text-primary placeholder-text-tertiary font-body transition-all"
                />
                {passwordMsg && (
                  <p
                    className={`text-xs ${
                      passwordMsg.type === "success" ? "text-success" : "text-danger"
                    }`}
                  >
                    {passwordMsg.text}
                  </p>
                )}
                <button
                  onClick={handlePasswordChange}
                  disabled={passwordSaving || !newPassword || !confirmPassword}
                  className="w-full px-4 py-2 bg-[var(--color-accent-dynamic)] text-black rounded-lg font-mono-label tracking-wider transition-all hover:opacity-90 disabled:opacity-50"
                >
                  {passwordSaving ? t("settings.updating") : t("settings.updatePassword")}
                </button>
              </div>
            )}
          </div>

          {/* Telegram link/unlink */}
          <div className="border-t border-border pt-4">
            {user?.telegram_id ? (
              /* ── Connected state ── */
              <div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="font-body text-sm text-text-secondary">{t("settings.telegramConnected")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono-label text-xs text-text-tertiary">ID: {user.telegram_id}</span>
                    <button
                      onClick={handleUnlinkTelegram}
                      disabled={telegramSaving}
                      className="font-mono-label text-xs text-danger hover:opacity-80 transition-colors"
                    >
                      {telegramSaving ? "..." : t("settings.unlink")}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Unconnected state with tutorial ── */
              <div>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-body text-sm text-text-secondary">{t("settings.telegram")}</span>
                    <p className="font-body text-xs text-text-tertiary mt-0.5">{t("settings.telegramSetupDesc")}</p>
                  </div>
                  <button
                    onClick={() => setShowTelegramGuide(!showTelegramGuide)}
                    className="font-mono-label text-sm text-[var(--color-accent-dynamic)] hover:opacity-80 transition-colors shrink-0 ml-4"
                  >
                    {showTelegramGuide ? t("settings.telegramHide") : t("settings.telegramSetup")}
                  </button>
                </div>

                <AnimatePresence>
                  {showTelegramGuide && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-4">
                        {/* Steps */}
                        <div className="space-y-3">
                          {/* Step 1 */}
                          <div className="flex gap-3 items-start">
                            <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--color-accent-dynamic)]/15 text-[var(--color-accent-dynamic)] flex items-center justify-center font-mono-label text-xs">1</span>
                            <div>
                              <p className="font-body text-sm text-text-primary">{t("settings.telegramStep1")} <span className="font-mono-label text-[var(--color-accent-dynamic)]">@userinfobot</span></p>
                            </div>
                          </div>
                          {/* Step 2 */}
                          <div className="flex gap-3 items-start">
                            <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--color-accent-dynamic)]/15 text-[var(--color-accent-dynamic)] flex items-center justify-center font-mono-label text-xs">2</span>
                            <p className="font-body text-sm text-text-primary">{t("settings.telegramStep2")}</p>
                          </div>
                          {/* Step 3 */}
                          <div className="flex gap-3 items-start">
                            <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--color-accent-dynamic)]/15 text-[var(--color-accent-dynamic)] flex items-center justify-center font-mono-label text-xs">3</span>
                            <p className="font-body text-sm text-text-primary">{t("settings.telegramStep3")}</p>
                          </div>
                        </div>

                        {/* Input field */}
                        <div className="space-y-2">
                          <label className="font-mono-label text-xs text-text-tertiary">{t("settings.telegramIdLabel")}</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder={t("settings.telegramIdPlaceholder")}
                              value={telegramInput}
                              onChange={(e) => setTelegramInput(e.target.value.replace(/\D/g, ""))}
                              className="flex-1 px-4 py-3 rounded-lg bg-transparent border border-border text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-[var(--color-accent-dynamic)] font-body transition-all"
                            />
                            <button
                              onClick={handleLinkTelegram}
                              disabled={telegramSaving || !telegramInput.trim()}
                              className="px-5 py-3 bg-[var(--color-accent-dynamic)] text-black rounded-lg font-mono-label text-sm tracking-wider transition-all hover:opacity-90 disabled:opacity-40 shrink-0"
                            >
                              {telegramSaving ? "..." : t("settings.link")}
                            </button>
                          </div>
                        </div>

                        {/* Step 4 - after linking */}
                        <div className="flex gap-3 items-start pt-1 border-t border-border/50">
                          <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--color-accent-dynamic)]/15 text-[var(--color-accent-dynamic)] flex items-center justify-center font-mono-label text-xs">4</span>
                          <p className="font-body text-sm text-text-tertiary">{t("settings.telegramStep4")}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            {telegramMsg && (
              <p
                className={`text-xs mt-2 ${
                  telegramMsg.type === "success" ? "text-success" : "text-danger"
                }`}
              >
                {telegramMsg.text}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ──────────── Profile Section ──────────── */}
      <div>
        <h3 className="font-mono-label text-text-tertiary mb-4">{t("settings.profile")}</h3>
        <div className="space-y-0 divide-y divide-border">
          <div className="py-3 flex justify-between items-center">
            <span className="font-body text-sm text-text-secondary">{t("settings.name")}</span>
            <span className="font-body text-sm text-text-primary">{user?.first_name || "\u2014"}</span>
          </div>
          <div className="py-3 flex justify-between items-center">
            <span className="font-body text-sm text-text-secondary">{t("settings.username")}</span>
            <span className="font-body text-sm text-text-primary">{user?.username ? `@${user.username}` : "\u2014"}</span>
          </div>
        </div>
      </div>

      {/* ──────────── Obiettivi Section ──────────── */}
      <div>
        <h3 className="font-mono-label text-text-tertiary mb-4">{t("settings.goals")}</h3>
        <div className="space-y-0 divide-y divide-border">
          {/* Calorie goal */}
          <div className="py-3 flex justify-between items-center">
            <span className="font-body text-sm text-text-secondary">{t("settings.calorieGoal")}</span>
            {editGoal ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={goalValue}
                  onChange={(e) => setGoalValue(e.target.value)}
                  className="w-20 bg-transparent border-b border-border text-sm text-right py-0.5 focus:outline-none focus:border-[var(--color-accent-dynamic)] text-text-primary font-body"
                  autoFocus
                />
                <span className="text-xs text-text-tertiary">kcal</span>
                <button onClick={handleSaveGoal} disabled={savingGoal} className="font-mono-label text-[var(--color-accent-dynamic)]">
                  {savingGoal ? t("settings.saving") : t("settings.save")}
                </button>
                <button onClick={() => setEditGoal(false)} className="font-mono-label text-text-tertiary">
                  {t("settings.cancel")}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditGoal(true)}
                className="font-body text-sm text-text-primary hover:text-[var(--color-accent-dynamic)] transition-colors"
              >
                {user?.daily_calorie_goal} kcal
              </button>
            )}
          </div>

          {/* Water goal */}
          <div className="py-3 flex justify-between items-center">
            <div>
              <span className="font-body text-sm text-text-secondary">{t("settings.waterGoal")}</span>
              <p className="text-[10px] text-text-tertiary mt-0.5">{t("settings.waterGoalDesc")}</p>
            </div>
            {editWaterGoal ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={waterGoalValue}
                  onChange={(e) => setWaterGoalValue(e.target.value)}
                  className="w-20 bg-transparent border-b border-border text-sm text-right py-0.5 focus:outline-none focus:border-[var(--color-accent-dynamic)] text-text-primary font-body"
                  autoFocus
                />
                <span className="text-xs text-text-tertiary">ml</span>
                <button
                  onClick={async () => {
                    const val = parseInt(waterGoalValue);
                    if (val > 0 && val <= 10000) {
                      await handleSaveField("water_goal_ml", val);
                      setEditWaterGoal(false);
                    } else {
                      showSaveToast("error", t("error.saveSetting"));
                    }
                  }}
                  disabled={savingField === "water_goal_ml"}
                  className="font-mono-label text-[var(--color-accent-dynamic)]"
                >
                  {savingField === "water_goal_ml" ? t("settings.saving") : t("settings.save")}
                </button>
                <button onClick={() => setEditWaterGoal(false)} className="font-mono-label text-text-tertiary">
                  {t("settings.cancel")}
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditWaterGoal(true);
                  setWaterGoalValue(String(user?.water_goal_ml ?? 2000));
                }}
                className="font-body text-sm text-text-primary hover:text-[var(--color-accent-dynamic)] transition-colors"
              >
                {user?.water_goal_ml ?? 2000} ml
              </button>
            )}
          </div>

          {/* Water tracking mode */}
          <div className="py-3 flex justify-between items-center">
            <div>
              <span className="font-body text-sm text-text-secondary">{t("settings.trackingMode")}</span>
              <p className="text-[10px] text-text-tertiary mt-0.5">{t("settings.trackingModeDesc")}</p>
            </div>
            <div className="flex bg-surface-raised rounded-lg p-0.5">
              <button
                onClick={() => handleSaveField("water_tracking_mode", "glasses")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  (user?.water_tracking_mode ?? "glasses") === "glasses"
                    ? "bg-[var(--color-accent-dynamic)]/20 text-[var(--color-accent-dynamic)]"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
                style={(user?.water_tracking_mode ?? "glasses") === "glasses" ? { backgroundColor: `${accentHex}20`, color: accentHex } : undefined}
              >
                {t("settings.glasses")}
              </button>
              <button
                onClick={() => handleSaveField("water_tracking_mode", "ml")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  user?.water_tracking_mode === "ml"
                    ? ""
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
                style={user?.water_tracking_mode === "ml" ? { backgroundColor: `${accentHex}20`, color: accentHex } : undefined}
              >
                ML
              </button>
            </div>
          </div>

          {/* Weight goal */}
          <div className="py-3 flex justify-between items-center">
            <div>
              <span className="font-body text-sm text-text-secondary">{t("settings.weightGoal")}</span>
              <p className="text-[10px] text-text-tertiary mt-0.5">{t("settings.weightGoalDesc")}</p>
            </div>
            {editWeightGoal ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={weightGoalValue}
                  onChange={(e) => setWeightGoalValue(e.target.value)}
                  className="w-20 bg-transparent border-b border-border text-sm text-right py-0.5 focus:outline-none focus:border-[var(--color-accent-dynamic)] text-text-primary font-body"
                  autoFocus
                />
                <span className="text-xs text-text-tertiary">kg</span>
                <button
                  onClick={async () => {
                    const val = parseFloat(weightGoalValue);
                    if (val > 0 && val < 500) {
                      await handleSaveField("weight_goal_kg", val);
                      setEditWeightGoal(false);
                    } else {
                      showSaveToast("error", t("error.saveSetting"));
                    }
                  }}
                  disabled={savingField === "weight_goal_kg"}
                  className="font-mono-label text-[var(--color-accent-dynamic)]"
                >
                  {savingField === "weight_goal_kg" ? t("settings.saving") : t("settings.save")}
                </button>
                <button onClick={() => setEditWeightGoal(false)} className="font-mono-label text-text-tertiary">
                  {t("settings.cancel")}
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditWeightGoal(true);
                  setWeightGoalValue(user?.weight_goal_kg ? String(user.weight_goal_kg) : "");
                }}
                className="font-body text-sm text-text-primary hover:text-[var(--color-accent-dynamic)] transition-colors"
              >
                {user?.weight_goal_kg ? `${user.weight_goal_kg} kg` : t("settings.notSet")}
              </button>
            )}
          </div>

          {/* Height */}
          <div className="py-3 flex justify-between items-center">
            <div>
              <span className="font-body text-sm text-text-secondary">{t("settings.height")}</span>
              <p className="text-[10px] text-text-tertiary mt-0.5">{t("settings.heightDesc")}</p>
            </div>
            {editHeight ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={heightValue}
                  onChange={(e) => setHeightValue(e.target.value)}
                  className="w-20 bg-transparent border-b border-border text-sm text-right py-0.5 focus:outline-none focus:border-[var(--color-accent-dynamic)] text-text-primary font-body"
                  autoFocus
                />
                <span className="text-xs text-text-tertiary">cm</span>
                <button
                  onClick={async () => {
                    const val = parseInt(heightValue);
                    if (val > 50 && val < 300) {
                      await handleSaveField("height_cm", val);
                      setEditHeight(false);
                    } else {
                      showSaveToast("error", t("error.saveSetting"));
                    }
                  }}
                  disabled={savingField === "height_cm"}
                  className="font-mono-label text-[var(--color-accent-dynamic)]"
                >
                  {savingField === "height_cm" ? t("settings.saving") : t("settings.save")}
                </button>
                <button onClick={() => setEditHeight(false)} className="font-mono-label text-text-tertiary">
                  {t("settings.cancel")}
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditHeight(true);
                  setHeightValue(user?.height_cm ? String(user.height_cm) : "");
                }}
                className="font-body text-sm text-text-primary hover:text-[var(--color-accent-dynamic)] transition-colors"
              >
                {user?.height_cm ? `${user.height_cm} cm` : t("settings.notSet")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ──────────── Personalizzazione ──────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-mono-label text-text-tertiary">{t("settings.personalization")}</h3>
          <AnimatePresence>
            {prefSaved && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="font-mono-label px-2.5 py-1 rounded-lg bg-success/10 border border-success/20 text-success"
              >
                {t("settings.saved")}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="space-y-0 divide-y divide-border">
          {/* Accent color */}
          <div className="py-3">
            <span className="font-mono-label text-text-tertiary mb-3 block">{t("settings.accentColor")}</span>
            <div className="flex gap-4">
              {(Object.entries(ACCENT_COLORS) as [AccentColor, string][]).map(([key, hex]) => (
                <motion.button
                  key={key}
                  onClick={() => { setAccentColor(key); showPrefSaved(); }}
                  className="flex flex-col items-center gap-1.5"
                  whileTap={{ scale: 0.95 }}
                >
                  <div
                    className={`w-8 h-8 rounded-full border-2 transition-colors ${
                      accentColor === key ? "border-text-primary" : "border-transparent"
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                  <span className={`text-[10px] font-body transition-colors ${
                    accentColor === key ? "text-text-primary" : "text-text-tertiary"
                  }`}>
                    {ACCENT_COLOR_LABELS[key]}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Layout mode */}
          <div className="py-3 flex justify-between items-center">
            <div>
              <span className="font-body text-sm text-text-secondary">{t("settings.layout")}</span>
              <p className="text-[10px] text-text-tertiary mt-0.5">{t("settings.layoutDesc")}</p>
            </div>
            <div className="flex bg-surface-raised rounded-lg p-0.5">
              <button
                onClick={() => { setLayoutMode("compact"); showPrefSaved(); }}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={layoutMode === "compact" ? { backgroundColor: `${accentHex}20`, color: accentHex } : { color: "var(--color-text-tertiary)" }}
              >
                {t("settings.compact")}
              </button>
              <button
                onClick={() => { setLayoutMode("expanded"); showPrefSaved(); }}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={layoutMode === "expanded" ? { backgroundColor: `${accentHex}20`, color: accentHex } : { color: "var(--color-text-tertiary)" }}
              >
                {t("settings.expanded")}
              </button>
            </div>
          </div>

          {/* Section order */}
          <div className="py-3">
            <span className="font-mono-label text-text-tertiary mb-3 block">{t("settings.sectionOrder")}</span>
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
                  className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-border cursor-grab active:cursor-grabbing"
                >
                  <span className="text-text-tertiary">&#x2807;</span>
                  <span className="font-body text-sm text-text-primary flex-1">{getSectionLabel(section)}</span>
                  <span className="text-[10px] text-text-tertiary tabular-nums">{i + 1}</span>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>

          {/* Live preview */}
          <div className="py-3">
            <span className="font-mono-label text-text-tertiary mb-3 block">{t("settings.preview")}</span>
            <div className="rounded-lg bg-surface border border-border p-3 overflow-hidden">
              <div className="flex gap-2">
                <div className="hidden sm:flex flex-col gap-1 w-10 shrink-0">
                  {[0,1,2,3,4].map((i) => (
                    <div
                      key={i}
                      className="h-2 rounded-full transition-all duration-300"
                      style={i === 0 ? { backgroundColor: `${accentHex}40`, border: `1px solid ${accentHex}30` } : { backgroundColor: "var(--color-surface-raised)" }}
                    />
                  ))}
                </div>
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
                        backgroundColor: i === 0 ? `${accentHex}15` : "var(--color-surface)",
                        borderLeft: i === 0 ? `2px solid ${accentHex}` : "2px solid transparent",
                      }}
                    >
                      <span className="text-[8px] text-text-tertiary truncate">{getSectionLabel(section)}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────── 2. Aspetto Section ──────────── */}
      <div>
        <h3 className="font-mono-label text-text-tertiary mb-4">{t("settings.appearance")}</h3>
        <div className="space-y-5">
          {/* Theme */}
          <div>
            <p className="font-mono-label text-text-tertiary mb-2">{t("settings.theme")}</p>
            <div className="flex gap-2">
              {(
                [
                  { value: "dark", labelKey: "settings.themeDark" },
                  { value: "light", labelKey: "settings.themeLight" },
                  { value: "auto", labelKey: "settings.themeAuto" },
                ] as const
              ).map((opt) => {
                const isSelected = theme === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleQuickSave("theme", opt.value)}
                    className={`flex-1 py-2 rounded-lg text-sm font-body transition-all ${
                      isSelected
                        ? "border border-[var(--color-accent-dynamic)] text-text-primary"
                        : "border border-border text-text-tertiary hover:text-text-primary hover:bg-surface-raised"
                    }`}
                  >
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {t(opt.labelKey as any)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language */}
          <div>
            <p className="font-mono-label text-text-tertiary mb-2">{t("settings.language")}</p>
            <div className="flex gap-2">
              {(
                [
                  { value: "it", labelKey: "settings.langIt" },
                  { value: "en", labelKey: "settings.langEn" },
                ] as const
              ).map((opt) => {
                const isSelected = language === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleQuickSave("language", opt.value)}
                    className={`flex-1 py-2 rounded-lg text-sm font-body transition-all ${
                      isSelected
                        ? "border border-[var(--color-accent-dynamic)] text-text-primary"
                        : "border border-border text-text-tertiary hover:text-text-primary hover:bg-surface-raised"
                    }`}
                  >
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {t(opt.labelKey as any)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unit system */}
          <div>
            <p className="font-mono-label text-text-tertiary mb-2">{t("settings.units")}</p>
            <div className="flex gap-2">
              {(
                [
                  { value: "metric", labelKey: "settings.metric" },
                  { value: "imperial", labelKey: "settings.imperial" },
                ] as const
              ).map((opt) => {
                const isSelected = (user?.unit_system ?? "metric") === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleQuickSave("unit_system", opt.value)}
                    className={`flex-1 py-2 rounded-lg text-sm font-body transition-all ${
                      isSelected
                        ? "border border-[var(--color-accent-dynamic)] text-text-primary"
                        : "border border-border text-text-tertiary hover:text-text-primary hover:bg-surface-raised"
                    }`}
                  >
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {t(opt.labelKey as any)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ──────────── 3. Notifiche Section ──────────── */}
      <div>
        <h3 className="font-mono-label text-text-tertiary mb-4">{t("settings.notifications")}</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-body text-sm text-text-primary">
              {user?.notifications_enabled ? t("settings.notificationsActive") : t("settings.notificationsOff")}
            </p>
            <p className="text-[10px] text-text-tertiary mt-0.5">{t("settings.notificationsDesc")}</p>
          </div>
          <button
            onClick={() => handleQuickSave("notifications_enabled", !user?.notifications_enabled)}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              user?.notifications_enabled ? "" : "bg-surface-raised"
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
      <div className="border border-danger/20 rounded-lg p-5">
        <h3 className="font-mono-label text-text-tertiary mb-4">{t("settings.dataManagement")}</h3>
        <div className="space-y-3">
          {/* Reset meals */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-body text-sm text-text-primary">{t("settings.resetMeals")}</p>
              <p className="text-xs text-text-tertiary mt-0.5">{t("settings.resetMealsDesc")}</p>
            </div>
            <button
              onClick={() => setResetType("meals")}
              className="px-4 py-2 bg-danger/10 border border-danger/20 text-danger rounded-lg font-mono-label tracking-wider transition-all hover:bg-danger/20"
            >
              {t("settings.reset")}
            </button>
          </div>

          <div className="border-t border-border" />

          {/* Reset workouts */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-body text-sm text-text-primary">{t("settings.resetWorkouts")}</p>
              <p className="text-xs text-text-tertiary mt-0.5">{t("settings.resetWorkoutsDesc")}</p>
            </div>
            <button
              onClick={() => setResetType("workouts")}
              className="px-4 py-2 bg-danger/10 border border-danger/20 text-danger rounded-lg font-mono-label tracking-wider transition-all hover:bg-danger/20"
            >
              {t("settings.reset")}
            </button>
          </div>

          <div className="border-t border-border" />

          {/* Reset all */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-body text-sm text-danger">{t("settings.resetAll")}</p>
              <p className="text-xs text-text-tertiary mt-0.5">{t("settings.resetAllDesc")}</p>
            </div>
            <button
              onClick={() => setResetType("all")}
              className="px-4 py-2 bg-danger/10 border border-danger/20 text-danger rounded-lg font-mono-label tracking-wider transition-all hover:bg-danger/20"
            >
              {t("settings.resetAllBtn")}
            </button>
          </div>

          <div className="border-t border-border" />

          {/* Export data */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-body text-sm text-text-primary">{t("settings.exportData")}</p>
              <p className="text-xs text-text-tertiary mt-0.5">{t("settings.exportDataDesc")}</p>
            </div>
            <button
              onClick={handleExportData}
              className="px-4 py-2 border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-all font-body text-sm"
            >
              {t("settings.export")}
            </button>
          </div>
        </div>
      </div>

      {/* ──────────── 5. Logout ──────────── */}
      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-lg bg-danger/10 border border-danger/20 text-danger font-mono-label tracking-wider transition-all hover:bg-danger/20"
      >
        {t("settings.logoutBtn")}
      </button>

      {/* ──────────── Reset Confirmation Modals ──────────── */}
      <ConfirmModal
        isOpen={resetType === "meals"}
        title={t("settings.resetMealsTitle")}
        message={t("settings.resetMealsMsg")}
        confirmLabel={t("settings.resetMealsConfirm")}
        danger
        loading={resetting}
        onConfirm={handleReset}
        onCancel={() => setResetType(null)}
      />
      <ConfirmModal
        isOpen={resetType === "workouts"}
        title={t("settings.resetWorkoutsTitle")}
        message={t("settings.resetWorkoutsMsg")}
        confirmLabel={t("settings.resetWorkoutsConfirm")}
        danger
        loading={resetting}
        onConfirm={handleReset}
        onCancel={() => setResetType(null)}
      />

      {/* Double confirm for "all" */}
      {resetType === "all" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => {
              setResetType(null);
              setResetConfirmText("");
            }}
          />
          <div className="relative bg-surface border border-border rounded-lg p-6 w-full max-w-sm animate-scale-in">
            <h3 className="font-display text-lg font-bold text-danger mb-2">{t("settings.resetAllTitle")}</h3>
            <p className="font-body text-sm text-text-secondary mb-4">
              {t("settings.resetAllMsg")}
            </p>
            <p className="font-body text-sm text-text-primary mb-3">
              {t("settings.resetAllType")} <span className="font-bold text-danger">CONFERMA</span> {t("settings.resetAllToProceed")}
            </p>
            <input
              type="text"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              placeholder="CONFERMA"
              className="w-full px-4 py-3 rounded-lg bg-transparent border border-border focus:outline-none focus:border-danger text-text-primary placeholder-text-tertiary font-body transition-all mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setResetType(null);
                  setResetConfirmText("");
                }}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-all font-body text-sm"
              >
                {t("settings.cancel")}
              </button>
              <button
                onClick={handleReset}
                disabled={resetConfirmText !== "CONFERMA" || resetting}
                className="flex-1 px-4 py-2 bg-danger/10 border border-danger/20 text-danger rounded-lg font-mono-label tracking-wider transition-all hover:bg-danger/20 disabled:opacity-30"
              >
                {resetting ? "..." : t("settings.deleteAll")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
