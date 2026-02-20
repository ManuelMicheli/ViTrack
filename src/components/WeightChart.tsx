"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

interface WeightChartProps {
  userId: string;
}

export default function WeightChart({ userId }: WeightChartProps) {
  const [data, setData] = useState<{ date: string; weight: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeight = async () => {
      try {
        const res = await fetch(`/api/weight?user_id=${userId}&limit=14`);
        if (res.ok) {
          const logs = await res.json();
          const chartData = logs
            .reverse()
            .map((log: { weight_kg: number; logged_at: string }) => ({
              date: new Date(log.logged_at).toLocaleDateString("it-IT", { day: "numeric", month: "short" }),
              weight: log.weight_kg,
            }));
          setData(chartData);
        }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    };
    fetchWeight();
  }, [userId]);

  const latest = data.length > 0 ? data[data.length - 1].weight : null;
  const previous = data.length > 1 ? data[data.length - 2].weight : null;
  const delta = latest && previous ? (latest - previous).toFixed(1) : null;

  const tooltipStyle = {
    backgroundColor: "#111111",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px",
    color: "#FFFFFF",
    fontSize: "12px",
  };

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">⚖️</span>
          <h3 className="text-sm font-medium">Peso</h3>
        </div>
        <div className="text-right">
          {latest ? (
            <>
              <span className="text-sm font-bold">{latest} kg</span>
              {delta && (
                <span className={`text-xs ml-1.5 ${parseFloat(delta) > 0 ? "text-[#EF4444]" : parseFloat(delta) < 0 ? "text-[#22C55E]" : "text-[#666]"}`}>
                  {parseFloat(delta) > 0 ? "+" : ""}{delta}
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-[#666]">Nessun dato</span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-16 shimmer rounded-lg" />
      ) : data.length > 1 ? (
        <ResponsiveContainer width="100%" height={60}>
          <LineChart data={data}>
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#A78BFA"
              strokeWidth={2}
              dot={false}
              name="Peso (kg)"
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-xs text-[#666] text-center py-4">Aggiungi il tuo peso per vedere il trend</p>
      )}
    </div>
  );
}
