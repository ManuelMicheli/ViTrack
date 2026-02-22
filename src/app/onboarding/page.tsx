"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import ProgressBar from "./components/ProgressBar";
import Step1Goal from "./components/Step1Goal";
import Step2Physical from "./components/Step2Physical";
import Step3Lifestyle from "./components/Step3Lifestyle";
import Step4Nutrition from "./components/Step4Nutrition";

const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [submitting, setSubmitting] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Step 1
  const [goal, setGoal] = useState<string | null>(null);

  // Step 2
  const [physical, setPhysical] = useState({
    age: "",
    gender: "",
    height_cm: "",
    weight_kg: "",
    target_weight_kg: "",
    neck_cm: "",
    waist_cm: "",
    hip_cm: "",
  });

  // Step 3
  const [lifestyle, setLifestyle] = useState({
    activity_level: "",
    workout_types: [] as string[],
    weekly_frequency: "",
    sleep_hours: "",
    stress_level: "",
  });

  // Step 4
  const [nutrition, setNutrition] = useState({
    diet_type: "",
    intolerances: [] as string[],
    meals_per_day: "",
    supplements: [] as string[],
  });

  useEffect(() => {
    const checkAuth = async () => {
      // Try Supabase Auth first
      const supabase = createSupabaseBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        try {
          const res = await fetch(`/api/user?id=${session.user.id}`);
          if (res.ok) {
            const userData = await res.json();
            if (userData.onboarding_completed) {
              router.push("/dashboard");
              return;
            }
            setUserId(userData.id);
            setCheckingAuth(false);
            return;
          }
        } catch {
          // Fall through
        }
      }

      // Fallback: localStorage
      const storedUserId = localStorage.getItem("vitrack_user_id");
      const telegramId = localStorage.getItem("vitrack_telegram_id");

      if (!storedUserId && !telegramId) {
        router.push("/");
        return;
      }

      try {
        const param = storedUserId
          ? `id=${storedUserId}`
          : `telegram_id=${encodeURIComponent(telegramId!)}`;
        const res = await fetch(`/api/user?${param}`);
        if (res.ok) {
          const userData = await res.json();
          if (userData.onboarding_completed) {
            router.push("/dashboard");
            return;
          }
          setUserId(userData.id);
        } else {
          router.push("/");
          return;
        }
      } catch {
        router.push("/");
        return;
      }

      setCheckingAuth(false);
    };

    checkAuth();
  }, [router]);

  const handlePhysicalChange = useCallback(
    (field: string, value: string) => {
      setPhysical((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleLifestyleChange = useCallback(
    (field: string, value: string | string[]) => {
      setLifestyle((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleNutritionChange = useCallback(
    (field: string, value: string | string[]) => {
      setNutrition((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const isStepValid = () => {
    switch (step) {
      case 1:
        return goal !== null;
      case 2:
        return (
          physical.age !== "" &&
          physical.gender !== "" &&
          physical.height_cm !== "" &&
          physical.weight_kg !== ""
        );
      case 3:
        return lifestyle.activity_level !== "";
      case 4:
        return true; // All optional
      default:
        return false;
    }
  };

  const goNext = () => {
    if (step < TOTAL_STEPS) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const handleSubmit = async () => {
    if (!userId || !goal) return;

    setSubmitting(true);
    try {
      const mealsNum =
        nutrition.meals_per_day === "5 o più"
          ? 5
          : nutrition.meals_per_day
          ? parseInt(nutrition.meals_per_day)
          : 3;

      const payload = {
        user_id: userId,
        goal,
        age: parseInt(physical.age),
        gender: physical.gender as "male" | "female" | "other",
        height_cm: parseInt(physical.height_cm),
        weight_kg: parseFloat(physical.weight_kg),
        target_weight_kg: physical.target_weight_kg
          ? parseFloat(physical.target_weight_kg)
          : undefined,
        neck_cm: physical.neck_cm ? parseFloat(physical.neck_cm) : undefined,
        waist_cm: physical.waist_cm ? parseFloat(physical.waist_cm) : undefined,
        hip_cm: physical.hip_cm ? parseFloat(physical.hip_cm) : undefined,
        activity_level: lifestyle.activity_level,
        workout_types: lifestyle.workout_types,
        weekly_frequency: lifestyle.weekly_frequency || "3-4 giorni",
        sleep_hours: lifestyle.sleep_hours || "7-8h",
        stress_level: lifestyle.stress_level || "Medio",
        diet_type: nutrition.diet_type || "Onnivoro",
        intolerances: nutrition.intolerances,
        meals_per_day: mealsNum,
        supplements: nutrition.supplements.filter((s) => s !== "Nessuno"),
      };

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        const err = await res.json().catch(() => null);
        console.error("Onboarding error:", err);
        setSubmitting(false);
      }
    } catch (error) {
      console.error("Onboarding submit error:", error);
      setSubmitting(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-border border-t-text-primary rounded-full animate-spin" />
      </div>
    );
  }

  const slideVariants = {
    enter: (d: number) => ({
      x: d > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (d: number) => ({
      x: d > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="px-6 pt-6 pb-2 max-w-lg mx-auto w-full">
        <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-6 pb-32 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="pt-4"
          >
            {step === 1 && <Step1Goal value={goal} onChange={setGoal} />}
            {step === 2 && (
              <Step2Physical
                data={physical}
                goal={goal || ""}
                onChange={handlePhysicalChange}
              />
            )}
            {step === 3 && (
              <Step3Lifestyle data={lifestyle} onChange={handleLifestyleChange} />
            )}
            {step === 4 && (
              <Step4Nutrition data={nutrition} onChange={handleNutritionChange} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border-subtle p-4">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 1 && (
            <button
              onClick={goBack}
              className="px-6 py-3 rounded-lg border border-border text-text-secondary font-mono-label hover:border-text-tertiary transition-all"
            >
              Indietro
            </button>
          )}
          <button
            onClick={step === TOTAL_STEPS ? handleSubmit : goNext}
            disabled={!isStepValid() || submitting}
            className="flex-1 py-3 rounded-lg bg-[var(--color-accent-dynamic)] text-black text-sm font-mono-label hover:opacity-90 transition-opacity disabled:opacity-30 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Salvataggio...
              </>
            ) : step === TOTAL_STEPS ? (
              "Completa"
            ) : (
              "Avanti"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
