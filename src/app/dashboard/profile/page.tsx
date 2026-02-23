"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import type { User } from "@/lib/types";
import { staggerContainer, staggerItem } from "@/lib/animation-config";
import { useLanguage } from "@/lib/language-context";
import { useUser } from "@/lib/user-provider";

/** Call /api/recalculate to refresh TDEE, macros, and calorie targets */
async function recalculateStats(userId: string): Promise<User | null> {
  try {
    const res = await fetch("/api/recalculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    if (res.ok) return (await res.json()) as User;
  } catch {
    // non-fatal
  }
  return null;
}

const INPUT_CLASS =
  "w-full px-4 py-3 rounded-lg bg-transparent border border-border text-text-primary placeholder-text-tertiary text-sm font-body focus:outline-none focus:border-[var(--color-accent-dynamic)] transition-all";

const SELECT_CLASS =
  "w-full px-4 py-3 rounded-lg bg-transparent border border-border text-text-primary text-sm font-body focus:outline-none focus:border-[var(--color-accent-dynamic)] transition-all appearance-none";

/** Compute carbs from remaining calories after protein + fat */
function calcAutoCarbs(calories: number, proteinG: number, fatG: number): number {
  const remaining = calories - (proteinG * 4 + fatG * 9);
  return Math.max(0, Math.round(remaining / 4));
}

export default function ProfilePage() {
  const { t, language } = useLanguage();
  const locale = language === "en" ? "en-US" : "it-IT";
  const { user, saveUser: ctxSaveUser, updateUser } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);

  // Personal info form
  const [firstName, setFirstName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<string>("");
  const [heightCm, setHeightCm] = useState("");
  const [activityLevel, setActivityLevel] = useState("sedentary");

  // Nutritional goals form
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState("");
  const [proteinGoal, setProteinGoal] = useState("");
  const [carbsGoal, setCarbsGoal] = useState("");
  const [fatGoal, setFatGoal] = useState("");
  const [weightGoalKg, setWeightGoalKg] = useState("");
  const [waterGoalMl, setWaterGoalMl] = useState("");

  // Dietary preferences
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);

  // Save feedback
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [savedSection, setSavedSection] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Stats
  const [daysSinceJoin, setDaysSinceJoin] = useState(0);

  const dietaryOptions = [
    { value: "Vegano", labelKey: "dietary.vegan" as const },
    { value: "Vegetariano", labelKey: "dietary.vegetarian" as const },
    { value: "Celiaco", labelKey: "dietary.celiac" as const },
    { value: "Intollerante al lattosio", labelKey: "dietary.lactoseIntolerant" as const },
    { value: "Halal", labelKey: "dietary.halal" as const },
    { value: "Kosher", labelKey: "dietary.kosher" as const },
  ];

  const populateForm = useCallback((data: User) => {
    setFirstName(data.first_name || "");
    setDateOfBirth(data.date_of_birth || "");
    setGender(data.gender || "");
    setHeightCm(data.height_cm != null ? String(data.height_cm) : "");
    setActivityLevel(data.activity_level || "sedentary");

    const cal = Number(data.daily_calorie_target ?? data.daily_calorie_goal ?? 2000);
    const prot = Number(data.macro_protein_g ?? data.protein_goal ?? 0);
    const fat = Number(data.macro_fat_g ?? data.fat_goal ?? 0);
    setDailyCalorieGoal(String(cal));
    setProteinGoal(prot ? String(prot) : "");
    setFatGoal(fat ? String(fat) : "");
    // Carbs auto-calculated
    setCarbsGoal(String(calcAutoCarbs(cal, prot, fat)));

    setWeightGoalKg(data.weight_goal_kg != null ? String(data.weight_goal_kg) : "");
    setWaterGoalMl(String(data.water_goal_ml));
    setDietaryPreferences(data.dietary_preferences || []);

    const joinDate = new Date(data.created_at);
    setDaysSinceJoin(Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24)));
  }, []);

  // Populate form from context user (no API call)
  useEffect(() => {
    if (user) {
      populateForm(user);
      setLoading(false);
    }
  }, [user, populateForm]);

  const saveSection = async (section: string, fields: Record<string, unknown>) => {
    if (!user) return;
    setSavingSection(section);
    try {
      const updated = await ctxSaveUser(fields);
      if (updated) {
        setSavedSection(section);
        setTimeout(() => setSavedSection(null), 2000);
      }
    } catch {
      /* ignore */
    } finally {
      setSavingSection(null);
    }
  };

  const handleSavePersonal = async () => {
    if (!user) return;
    setSavingSection("personal");
    try {
      const updated = await ctxSaveUser({
        first_name: firstName || null,
        date_of_birth: dateOfBirth || null,
        gender: gender || null,
        height_cm: heightCm ? parseInt(heightCm) : null,
        activity_level: activityLevel,
      });
      if (updated) {
        // Recalculate TDEE & stats when metabolic-affecting fields change
        const recalculated = await recalculateStats(user.id);
        if (recalculated) updateUser(recalculated);
        setSavedSection("personal");
        setTimeout(() => setSavedSection(null), 2000);
      }
    } catch {
      /* ignore */
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveGoals = async () => {
    if (!user) return;
    setSavingSection("goals");
    try {
      // Save non-metabolic goals via PATCH
      const saved = await ctxSaveUser({
        weight_goal_kg: weightGoalKg ? parseFloat(weightGoalKg) : null,
        water_goal_ml: waterGoalMl ? parseInt(waterGoalMl) : 2000,
      });
      if (saved) {
        // Trigger full TDEE recalculation — updates calorie targets,
        // macros, reference cards (dimagrimento/mantenimento/massa)
        const recalculated = await recalculateStats(user.id);
        if (recalculated) updateUser(recalculated);
        setSavedSection("goals");
        setTimeout(() => setSavedSection(null), 2000);
      }
    } catch {
      /* ignore */
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveDietary = () => {
    saveSection("dietary", {
      dietary_preferences: dietaryPreferences,
    });
  };

  const handleToggleDietary = (value: string) => {
    setDietaryPreferences((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  // Macro consistency: when calories change, recalculate macros proportionally
  const handleCalorieChange = (value: string) => {
    const newCal = parseInt(value) || 0;
    const oldCal = parseInt(dailyCalorieGoal) || 1;
    setDailyCalorieGoal(value);

    if (newCal > 0 && oldCal > 0) {
      const ratio = newCal / oldCal;
      const newProt = Math.round((parseInt(proteinGoal) || 0) * ratio);
      const newFat = Math.round((parseInt(fatGoal) || 0) * ratio);
      setProteinGoal(String(newProt));
      setFatGoal(String(newFat));
      setCarbsGoal(String(calcAutoCarbs(newCal, newProt, newFat)));
    }
  };

  // Macro consistency: when protein changes, auto-adjust carbs
  const handleProteinChange = (value: string) => {
    setProteinGoal(value);
    const cal = parseInt(dailyCalorieGoal) || 0;
    const prot = parseInt(value) || 0;
    const fat = parseInt(fatGoal) || 0;
    setCarbsGoal(String(calcAutoCarbs(cal, prot, fat)));
  };

  // Macro consistency: when fat changes, auto-adjust carbs
  const handleFatChange = (value: string) => {
    setFatGoal(value);
    const cal = parseInt(dailyCalorieGoal) || 0;
    const prot = parseInt(proteinGoal) || 0;
    const fat = parseInt(value) || 0;
    setCarbsGoal(String(calcAutoCarbs(cal, prot, fat)));
  };

  // Computed: calories from current macro values
  const macroCalories = (parseInt(proteinGoal) || 0) * 4 + (parseInt(carbsGoal) || 0) * 4 + (parseInt(fatGoal) || 0) * 9;
  const targetCalories = parseInt(dailyCalorieGoal) || 0;
  const calorieDiff = Math.abs(macroCalories - targetCalories);
  const calorieMatch = calorieDiff <= 10; // within rounding tolerance

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      formData.append("user_id", user.id);
      const res = await fetch("/api/user/avatar", { method: "POST", body: formData });
      if (res.ok) {
        const updated = await res.json();
        updateUser(updated);
      }
    } catch {
      /* ignore */
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="px-4 md:px-8 py-6 space-y-6 max-w-2xl">
        <div className="h-8 w-32 shimmer rounded-lg" />
        <div className="flex flex-col items-center space-y-3">
          <div className="w-20 h-20 rounded-full shimmer" />
          <div className="h-5 w-40 shimmer rounded-lg" />
          <div className="h-4 w-28 shimmer rounded-lg" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 shimmer rounded-lg" />
        ))}
      </div>
    );
  }

  if (!user) return null;

  const initials = user.first_name
    ? user.first_name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const memberSince = new Date(user.created_at).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <motion.div className="px-4 md:px-8 py-6 space-y-10 max-w-2xl" initial="initial" animate="animate" variants={staggerContainer(0.08)}>
      <motion.div variants={staggerItem}>
        <h1 className="font-display text-2xl font-bold text-text-primary">{t("profile.title")}</h1>
      </motion.div>

      {/* --- Header / Avatar --- */}
      <motion.div variants={staggerItem} className="flex flex-col items-center space-y-3">
        <div className="relative">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt="Avatar"
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover border-2 border-border"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-surface border border-border flex items-center justify-center">
              <span className="font-display text-2xl font-bold text-text-primary">{initials}</span>
            </div>
          )}
          {uploadingAvatar && (
            <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-border border-t-text-primary rounded-full animate-spin" />
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingAvatar}
          className="font-mono-label text-[var(--color-accent-dynamic)] hover:opacity-80 transition-colors disabled:opacity-50"
        >
          {uploadingAvatar ? t("profile.uploading") : t("profile.changePhoto")}
        </button>

        <div className="text-center">
          <p className="font-display text-lg font-bold text-text-primary">{user.first_name || t("common.user")}</p>
          {user.email && <p className="font-body text-sm text-text-secondary">{user.email}</p>}
        </div>
      </motion.div>

      {/* --- Informazioni Personali --- */}
      <motion.div variants={staggerItem} className="data-card space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-mono-label text-text-tertiary">{t("profile.personalInfo")}</span>
          {savedSection === "personal" && (
            <span className="font-mono-label text-success">{t("common.saved")}</span>
          )}
        </div>

        {/* Nome */}
        <div>
          <label className="font-mono-label text-text-tertiary mb-2 block">{t("profile.name")}</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={t("profile.namePlaceholder")}
            className={INPUT_CLASS}
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="font-mono-label text-text-tertiary mb-2 block">{t("profile.email")}</label>
          <div className="w-full px-4 py-3 rounded-lg bg-surface border border-border-subtle text-text-tertiary text-sm font-body">
            {user.email || t("profile.emailNotSet")}
          </div>
        </div>

        {/* Data di nascita */}
        <div>
          <label className="font-mono-label text-text-tertiary mb-2 block">{t("profile.dateOfBirth")}</label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        {/* Sesso */}
        <div>
          <label className="font-mono-label text-text-tertiary mb-2 block">{t("profile.gender")}</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">{t("profile.genderNone")}</option>
            <option value="male">{t("profile.genderMale")}</option>
            <option value="female">{t("profile.genderFemale")}</option>
            <option value="other">{t("profile.genderOther")}</option>
          </select>
        </div>

        {/* Altezza */}
        <div>
          <label className="font-mono-label text-text-tertiary mb-2 block">{t("profile.height")}</label>
          <div className="relative">
            <input
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="175"
              className={INPUT_CLASS + " pr-12"}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono-label text-text-tertiary">cm</span>
          </div>
        </div>

        {/* Livello di attivita */}
        <div>
          <label className="font-mono-label text-text-tertiary mb-2 block">{t("profile.activityLevel")}</label>
          <select
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="sedentary">{t("profile.sedentary")}</option>
            <option value="light">{t("profile.light")}</option>
            <option value="moderate">{t("profile.moderate")}</option>
            <option value="active">{t("profile.active")}</option>
            <option value="very_active">{t("profile.veryActive")}</option>
          </select>
        </div>

        <button
          onClick={handleSavePersonal}
          disabled={savingSection === "personal"}
          className="w-full py-3 rounded-lg bg-[var(--color-accent-dynamic)] text-black text-sm font-mono-label hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {savingSection === "personal" ? t("common.saving") : t("common.save")}
        </button>
      </motion.div>

      {/* --- Obiettivi Nutrizionali --- */}
      <motion.div variants={staggerItem} className="data-card space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-mono-label text-text-tertiary">{t("profile.nutritionalGoals")}</span>
          {savedSection === "goals" && (
            <span className="font-mono-label text-success">{t("common.saved")}</span>
          )}
        </div>

        {/* Calorie giornaliere */}
        <div>
          <label className="font-mono-label text-text-tertiary mb-2 block">{t("profile.dailyCalories")}</label>
          <div className="relative">
            <input
              type="number"
              value={dailyCalorieGoal}
              onChange={(e) => handleCalorieChange(e.target.value)}
              placeholder="2000"
              className={INPUT_CLASS + " pr-14"}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono-label text-text-tertiary">kcal</span>
          </div>
        </div>

        {/* Proteine */}
        <div>
          <label className="font-mono-label text-text-tertiary mb-2 block">{t("macro.protein")}</label>
          <div className="relative">
            <input
              type="number"
              value={proteinGoal}
              onChange={(e) => handleProteinChange(e.target.value)}
              placeholder="150"
              className={INPUT_CLASS + " pr-10"}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono-label text-text-tertiary">g</span>
          </div>
        </div>

        {/* Carboidrati (auto-calculated) */}
        <div>
          <label className="font-mono-label text-text-tertiary mb-2 block">
            {t("macro.carbs")}
            <span className="ml-2 text-[10px] text-text-tertiary/60 font-body">({t("profile.carbsAutoAdjust")})</span>
          </label>
          <div className="relative">
            <input
              type="number"
              value={carbsGoal}
              readOnly
              className={INPUT_CLASS + " pr-10 opacity-60 cursor-not-allowed"}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono-label text-text-tertiary">g</span>
          </div>
        </div>

        {/* Grassi */}
        <div>
          <label className="font-mono-label text-text-tertiary mb-2 block">{t("macro.fat")}</label>
          <div className="relative">
            <input
              type="number"
              value={fatGoal}
              onChange={(e) => handleFatChange(e.target.value)}
              placeholder="65"
              className={INPUT_CLASS + " pr-10"}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono-label text-text-tertiary">g</span>
          </div>
        </div>

        {/* Live macro/calorie consistency preview */}
        {targetCalories > 0 && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono-label ${
            calorieMatch
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-amber-500/10 text-amber-400"
          }`}>
            <span>{t("profile.macroCalories")}: {macroCalories} kcal</span>
            {!calorieMatch && <span>({macroCalories > targetCalories ? "+" : ""}{macroCalories - targetCalories})</span>}
          </div>
        )}

        {/* Obiettivo peso */}
        <div>
          <label className="font-mono-label text-text-tertiary mb-2 block">{t("profile.weightGoal")}</label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              value={weightGoalKg}
              onChange={(e) => setWeightGoalKg(e.target.value)}
              placeholder="75"
              className={INPUT_CLASS + " pr-12"}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono-label text-text-tertiary">kg</span>
          </div>
        </div>

        {/* Obiettivo acqua */}
        <div>
          <label className="font-mono-label text-text-tertiary mb-2 block">{t("profile.waterGoal")}</label>
          <div className="relative">
            <input
              type="number"
              value={waterGoalMl}
              onChange={(e) => setWaterGoalMl(e.target.value)}
              placeholder="2000"
              className={INPUT_CLASS + " pr-12"}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono-label text-text-tertiary">ml</span>
          </div>
        </div>

        <button
          onClick={handleSaveGoals}
          disabled={savingSection === "goals"}
          className="w-full py-3 rounded-lg bg-[var(--color-accent-dynamic)] text-black text-sm font-mono-label hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {savingSection === "goals" ? t("common.saving") : t("common.save")}
        </button>
      </motion.div>

      {/* --- Preferenze Alimentari --- */}
      <motion.div variants={staggerItem} className="data-card space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-mono-label text-text-tertiary">{t("profile.dietaryPrefs")}</span>
          {savedSection === "dietary" && (
            <span className="font-mono-label text-success">{t("common.saved")}</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {dietaryOptions.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                dietaryPreferences.includes(opt.value)
                  ? "bg-[var(--color-accent-dynamic)]/10 border-[var(--color-accent-dynamic)]/30"
                  : "bg-transparent border-border hover:border-border"
              }`}
            >
              <input
                type="checkbox"
                checked={dietaryPreferences.includes(opt.value)}
                onChange={() => handleToggleDietary(opt.value)}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  dietaryPreferences.includes(opt.value)
                    ? "bg-[var(--color-accent-dynamic)] border-[var(--color-accent-dynamic)]"
                    : "border-border"
                }`}
              >
                {dietaryPreferences.includes(opt.value) && (
                  <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="font-body text-sm text-text-secondary">{t(opt.labelKey)}</span>
            </label>
          ))}
        </div>

        <button
          onClick={handleSaveDietary}
          disabled={savingSection === "dietary"}
          className="w-full py-3 rounded-lg bg-[var(--color-accent-dynamic)] text-black text-sm font-mono-label hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {savingSection === "dietary" ? t("common.saving") : t("common.save")}
        </button>
      </motion.div>

      {/* --- Statistiche --- */}
      <motion.div variants={staggerItem} className="data-card space-y-1">
        <span className="font-mono-label text-text-tertiary mb-3 block">{t("profile.stats")}</span>

        <div className="flex justify-between items-center py-2.5 border-b border-border-subtle">
          <span className="font-body text-sm text-text-secondary">{t("profile.memberSince")}</span>
          <span className="font-display text-sm font-bold text-text-primary">
            {daysSinceJoin} {t("common.days")} ({memberSince})
          </span>
        </div>

        <div className="flex justify-between items-center py-2.5 border-b border-border-subtle">
          <span className="font-body text-sm text-text-secondary">{t("profile.telegramId")}</span>
          <span className="font-mono-label text-text-tertiary">
            {user.telegram_id ?? t("profile.notLinked")}
          </span>
        </div>

        <div className="flex justify-between items-center py-2.5">
          <span className="font-body text-sm text-text-secondary">{t("profile.plan")}</span>
          <span className="font-display text-sm font-bold text-[var(--color-accent-dynamic)]">ViTrack</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
