"use client";

import { useMemo } from "react";

interface WorkoutCalendarProps {
  workoutDates: string[]; // YYYY-MM-DD strings
  days?: number;
}

export default function WorkoutCalendar({ workoutDates, days = 90 }: WorkoutCalendarProps) {
  const { grid, monthLabels } = useMemo(() => {
    // Count workouts per date
    const countMap = new Map<string, number>();
    for (const d of workoutDates) {
      const key = d.split("T")[0];
      countMap.set(key, (countMap.get(key) || 0) + 1);
    }

    // Build grid: 7 rows (Mon=0..Sun=6) x N columns
    const today = new Date();
    const endDate = new Date(today);
    endDate.setHours(0, 0, 0, 0);

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days + 1);
    // Align start to Monday
    const startDay = startDate.getDay(); // 0=Sun
    const offset = startDay === 0 ? 6 : startDay - 1; // days since Monday
    startDate.setDate(startDate.getDate() - offset);

    const cells: { date: string; count: number; isInRange: boolean }[] = [];
    const labels: { col: number; label: string }[] = [];
    let lastMonth = -1;

    const cursor = new Date(startDate);
    let col = 0;
    while (cursor <= endDate) {
      for (let row = 0; row < 7; row++) {
        const dateStr = cursor.toISOString().split("T")[0];
        const inRange = cursor >= startDate && cursor <= endDate;
        cells.push({
          date: dateStr,
          count: countMap.get(dateStr) || 0,
          isInRange: inRange,
        });

        // Month label on first row
        if (row === 0) {
          const month = cursor.getMonth();
          if (month !== lastMonth) {
            labels.push({
              col,
              label: cursor.toLocaleDateString("it-IT", { month: "short" }),
            });
            lastMonth = month;
          }
        }

        cursor.setDate(cursor.getDate() + 1);
      }
      col++;
    }

    const numCols = col;
    return { grid: cells, numCols, monthLabels: labels };
  }, [workoutDates, days]);

  const numCols = Math.ceil(grid.length / 7);

  return (
    <div className="overflow-x-auto">
      {/* Month labels */}
      <div
        className="grid gap-1 mb-1"
        style={{
          gridTemplateColumns: `repeat(${numCols}, 12px)`,
        }}
      >
        {Array.from({ length: numCols }).map((_, col) => {
          const label = monthLabels.find((l) => l.col === col);
          return (
            <span key={col} className="font-mono-label text-[9px] text-text-tertiary truncate">
              {label?.label || ""}
            </span>
          );
        })}
      </div>
      {/* Calendar grid: 7 rows, N columns */}
      <div
        className="grid gap-[3px]"
        style={{
          gridTemplateRows: "repeat(7, 12px)",
          gridTemplateColumns: `repeat(${numCols}, 12px)`,
          gridAutoFlow: "column",
        }}
      >
        {grid.map((cell, i) => {
          if (!cell.isInRange && cell.count === 0) {
            return <div key={i} className="rounded-[2px]" />;
          }
          let bg = "bg-surface";
          if (cell.count === 1) bg = "bg-[var(--color-accent-dynamic)]/30";
          if (cell.count >= 2) bg = "bg-[var(--color-accent-dynamic)]/70";
          return (
            <div
              key={i}
              className={`rounded-[2px] ${bg}`}
              title={`${cell.date}: ${cell.count} workout${cell.count !== 1 ? "s" : ""}`}
            />
          );
        })}
      </div>
    </div>
  );
}
