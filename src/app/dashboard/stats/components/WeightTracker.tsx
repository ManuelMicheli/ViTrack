"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useAnimatedNumber, motion } from "@/hooks/useAnimatedNumber";
import type { WeightLog } from "@/lib/types";

const INPUT_CLASS =
  "w-full px-4 py-3 rounded-lg bg-transparent border border-border text-text-primary placeholder-text-tertiary text-sm font-body focus:outline-none focus:border-[var(--color-accent-dynamic)] transition-all";

interface WeightTrackerProps {
  userId: string;
  weightLogs: WeightLog[];
  startingWeight: number | null;
  targetWeight: number | null;
  onWeightLogged: () => void;
}

export default function WeightTracker({ userId, weightLogs, startingWeight, targetWeight, onWeightLogged }: WeightTrackerProps) {
  const [newWeight, setNewWeight] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const w = parseFloat(newWeight);
    if (!w || w < 20 || w > 400) return;
    setSaving(true);
    try {
      const res = await fetch("/api/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, weight_kg: w }),
      });
      if (res.ok) {
        setNewWeight("");
        onWeightLogged();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const chartData = [...weightLogs].reverse().map((log) => ({
    date: new Date(log.logged_at).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }),
    weight: log.weight_kg,
  }));

  const currentWeight = weightLogs.length > 0 ? weightLogs[0].weight_kg : null;
  const start = startingWeight ?? (weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight_kg : null);
  const diff = currentWeight !== null && start !== null ? currentWeight - start : null;

  let progressPct: number | null = null;
  if (start !== null && targetWeight !== null && currentWeight !== null && start !== targetWeight) {
    progressPct = Math.round(((start - currentWeight) / (start - targetWeight)) * 100);
    progressPct = Math.max(0, Math.min(100, progressPct));
  }

  const animProgress = useAnimatedNumber(progressPct ?? 0);

  return (
    <div className="space-y-3">
      <p className="font-mono-label text-text-tertiary">Peso</p>
      <div className="data-card space-y-5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              step="0.1"
              min={20}
              max={400}
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="Peso di oggi..."
              className={INPUT_CLASS + " pr-12"}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono-label text-text-tertiary">kg</span>
          </div>
          <button
            onClick={handleSave}
            disabled={!newWeight || saving}
            className="px-5 py-3 rounded-lg bg-[var(--color-accent-dynamic)] text-black text-sm font-mono-label hover:opacity-90 transition-opacity disabled:opacity-30"
          >
            {saving ? "..." : "Salva"}
          </button>
        </div>

        {chartData.length > 1 && (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{ fill: "#585858", fontSize: 10, fontFamily: "var(--font-mono)" }} tickLine={false} axisLine={false} />
                <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fill: "#585858", fontSize: 10, fontFamily: "var(--font-mono)" }} tickLine={false} axisLine={false} width={40} />
                <Tooltip
                  contentStyle={{ background: "#0A0A0A", border: "1px solid #1A1A1A", borderRadius: 8, fontSize: 12, fontFamily: "var(--font-body)" }}
                  labelStyle={{ color: "#A0A0A0" }}
                  itemStyle={{ color: "#FFFFFF" }}
                />
                <Line type="monotone" dataKey="weight" stroke="var(--color-accent-dynamic)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "var(--color-accent-dynamic)" }} animationDuration={1000} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {chartData.length <= 1 && (
          <div className="h-24 flex items-center justify-center">
            <p className="font-body text-sm text-text-tertiary">Registra almeno 2 pesate per vedere il grafico</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="text-center">
            <p className="font-display text-sm font-bold text-text-primary">
              {currentWeight !== null ? `${currentWeight.toFixed(1)}` : "--"}
              {currentWeight !== null && <span className="text-xs font-normal text-text-tertiary"> kg</span>}
            </p>
            <p className="font-body text-xs text-text-tertiary">Attuale</p>
          </div>
          <div className="text-center">
            <p className="font-display text-sm font-bold text-text-primary">
              {start !== null ? `${start.toFixed(1)}` : "--"}
              {start !== null && <span className="text-xs font-normal text-text-tertiary"> kg</span>}
            </p>
            <p className="font-body text-xs text-text-tertiary">Inizio</p>
          </div>
          <div className="text-center">
            <p className={`font-display text-sm font-bold ${diff !== null ? (diff < 0 ? "text-success" : diff > 0 ? "text-danger" : "text-text-primary") : "text-text-primary"}`}>
              {diff !== null ? `${diff > 0 ? "+" : ""}${diff.toFixed(1)} kg` : "--"}
            </p>
            <p className="font-body text-xs text-text-tertiary">Differenza</p>
          </div>
          {targetWeight && (
            <div className="text-center">
              <p className="font-display text-sm font-bold text-[var(--color-accent-dynamic)]">
                {progressPct !== null ? <><motion.span>{animProgress}</motion.span>%</> : "--"}
              </p>
              <p className="font-body text-xs text-text-tertiary">Progresso</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
