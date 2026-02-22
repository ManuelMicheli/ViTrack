"use client";

import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { useLanguage } from "@/lib/language-context";

interface DayData {
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  goal: number;
}

interface TrackingChartsProps {
  data: DayData[];
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

export default function TrackingCharts({ data }: TrackingChartsProps) {
  const { t } = useLanguage();
  const calorieGoal = data.length > 0 ? data[data.length - 1].goal : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="data-card">
        <span className="font-mono-label text-text-tertiary mb-4 block">{t("statsPage.calorieTrend")}</span>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid stroke="#1A1A1A" strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="#585858" style={axisStyle} tickLine={false} axisLine={false} />
            <YAxis stroke="#585858" style={axisStyle} tickLine={false} axisLine={false} width={40} />
            <Tooltip contentStyle={tooltipStyle} />
            {calorieGoal > 0 && (
              <ReferenceLine y={calorieGoal} stroke="#1A1A1A" strokeDasharray="5 5"
                label={{ value: t("weight.objective"), position: "insideTopRight", fill: "#585858", fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }} />
            )}
            <Line type="monotone" dataKey="calories" stroke="#E8E4DE" strokeWidth={2}
              dot={{ fill: "#E8E4DE", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: "#E8E4DE" }} name={t("statsPage.calories")} animationDuration={1000} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="data-card">
        <span className="font-mono-label text-text-tertiary mb-4 block">{t("statsPage.macroDistribution")}</span>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid stroke="#1A1A1A" strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="#585858" style={axisStyle} tickLine={false} axisLine={false} />
            <YAxis stroke="#585858" style={axisStyle} tickLine={false} axisLine={false} width={40} unit="g" />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="protein" stackId="macro" fill="var(--color-protein)" name={t("macro.protein")} radius={[0, 0, 0, 0]} animationDuration={800} />
            <Bar dataKey="carbs" stackId="macro" fill="var(--color-carbs)" name={t("macro.carbs")} animationDuration={800} />
            <Bar dataKey="fat" stackId="macro" fill="var(--color-fat)" name={t("macro.fat")} animationDuration={800} />
            <Bar dataKey="fiber" stackId="macro" fill="var(--color-fiber)" name={t("macro.fiber")} radius={[4, 4, 0, 0]} animationDuration={800} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
