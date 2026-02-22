"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceDot,
} from "recharts";
import { useLanguage } from "@/lib/language-context";

interface ProgressPoint {
  date: string;
  weight_kg: number;
  sets: number;
  reps: number;
  volume: number;
}

interface ExerciseProgressChartProps {
  data: ProgressPoint[];
}

const axisStyle = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 10,
  fill: '#585858',
};

const tooltipStyle = {
  backgroundColor: "#0A0A0A",
  border: "1px solid #1A1A1A",
  borderRadius: "8px",
  color: "#FFFFFF",
  fontSize: "12px",
  fontFamily: "'IBM Plex Mono', monospace",
};

export default function ExerciseProgressChart({ data }: ExerciseProgressChartProps) {
  const { t } = useLanguage();

  if (data.length === 0) {
    return (
      <div className="data-card text-center !py-8">
        <p className="text-text-tertiary font-body text-sm">{t("workoutsPage.noData")}</p>
      </div>
    );
  }

  // Find PR (max weight)
  const prPoint = data.reduce((max, p) => (p.weight_kg > max.weight_kg ? p : max), data[0]);
  const prIndex = data.indexOf(prPoint);

  // Format data with short date labels
  const chartData = data.map((p) => {
    const d = new Date(p.date);
    return {
      ...p,
      label: d.toLocaleDateString("it-IT", { day: "numeric", month: "short" }),
    };
  });

  return (
    <div className="data-card">
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono-label text-text-tertiary">{t("workoutsPage.maxWeight")}</span>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-accent-dynamic)]/10 border border-[var(--color-accent-dynamic)]/20">
            <span className="font-mono-label text-[var(--color-accent-dynamic)] text-xs">PR</span>
            <span className="font-display text-sm font-bold text-text-primary">{prPoint.weight_kg}kg</span>
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData}>
          <CartesianGrid stroke="#1A1A1A" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            stroke="#585858"
            style={axisStyle}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#585858"
            style={axisStyle}
            tickLine={false}
            axisLine={false}
            width={40}
            unit="kg"
            domain={["dataMin - 5", "dataMax + 5"]}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [`${value} kg`, "Peso"]}
          />
          <Line
            type="monotone"
            dataKey="weight_kg"
            stroke="var(--color-accent-dynamic)"
            strokeWidth={2}
            dot={{ fill: "var(--color-accent-dynamic)", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "var(--color-accent-dynamic)" }}
            name="weight_kg"
            animationDuration={1000}
          />
          {/* PR dot highlight */}
          <ReferenceDot
            x={chartData[prIndex]?.label}
            y={prPoint.weight_kg}
            r={7}
            fill="var(--color-accent-dynamic)"
            stroke="#0A0A0A"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
