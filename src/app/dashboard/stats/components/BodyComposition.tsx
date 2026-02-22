"use client";

import { motion } from "framer-motion";
import { useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import { springs } from "@/lib/animation-config";

interface BodyCompositionProps {
  bodyFatPercentage: number | null;
  leanMassKg: number | null;
  weightKg: number | null;
  gender: "male" | "female" | "other" | null;
}

interface Zone {
  label: string;
  min: number;
  max: number;
  color: string;
}

const maleZones: Zone[] = [
  { label: "Essenziale", min: 2, max: 5, color: "#EF4444" },
  { label: "Atleta", min: 6, max: 13, color: "#22C55E" },
  { label: "Fitness", min: 14, max: 17, color: "#3B82F6" },
  { label: "Accettabile", min: 18, max: 24, color: "#F59E0B" },
  { label: "Obeso", min: 25, max: 45, color: "#EF4444" },
];

const femaleZones: Zone[] = [
  { label: "Essenziale", min: 10, max: 13, color: "#EF4444" },
  { label: "Atleta", min: 14, max: 20, color: "#22C55E" },
  { label: "Fitness", min: 21, max: 24, color: "#3B82F6" },
  { label: "Accettabile", min: 25, max: 31, color: "#F59E0B" },
  { label: "Obeso", min: 32, max: 50, color: "#EF4444" },
];

function useAnimatedDecimal(value: number) {
  const motionValue = useMotionValue(value);
  const springValue = useSpring(motionValue, springs.number);
  const display = useTransform(springValue, (v) => v.toFixed(1));
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      motionValue.set(value);
      return;
    }
    motionValue.set(value);
  }, [value, motionValue]);

  return display;
}

export default function BodyComposition({ bodyFatPercentage, leanMassKg, weightKg, gender }: BodyCompositionProps) {
  if (bodyFatPercentage === null || bodyFatPercentage === undefined) {
    return (
      <div className="space-y-3">
        <p className="font-mono-label text-text-tertiary">Composizione corporea</p>
        <div className="data-card text-center py-6">
          <svg className="w-8 h-8 text-text-tertiary mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <p className="font-body text-sm text-text-secondary">
            Aggiungi le misure corporee per sbloccare questa sezione
          </p>
          <p className="font-body text-xs text-text-tertiary mt-1">Collo, vita e fianchi</p>
        </div>
      </div>
    );
  }

  const zones = gender === "female" ? femaleZones : maleZones;
  const totalRange = zones[zones.length - 1].max - zones[0].min;
  const rangeMin = zones[0].min;
  const clampedBf = Math.max(zones[0].min, Math.min(zones[zones.length - 1].max, bodyFatPercentage));
  const markerPosition = ((clampedBf - rangeMin) / totalRange) * 100;
  const currentZone = zones.find((z) => bodyFatPercentage >= z.min && bodyFatPercentage <= z.max);
  const fatMassKg = weightKg && leanMassKg ? Math.round((weightKg - leanMassKg) * 10) / 10 : null;

  const animBodyFat = useAnimatedDecimal(bodyFatPercentage);

  return (
    <div className="space-y-3">
      <p className="font-mono-label text-text-tertiary">Composizione corporea</p>
      <div className="data-card space-y-5">
        <div className="text-center">
          <p className="font-display text-3xl font-bold text-text-primary">
            <motion.span>{animBodyFat}</motion.span>%
          </p>
          <p className="font-body text-sm text-text-secondary">Massa grassa</p>
          {currentZone && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={springs.smooth}
              className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-body"
              style={{ backgroundColor: currentZone.color + "20", color: currentZone.color }}
            >
              {currentZone.label}
            </motion.span>
          )}
        </div>

        <div className="space-y-1">
          <div className="relative h-3 rounded-full overflow-hidden flex">
            {zones.map((zone) => {
              const width = ((zone.max - zone.min) / totalRange) * 100;
              return (
                <div key={zone.label} className="h-full" style={{ width: `${width}%`, backgroundColor: zone.color + "40" }} />
              );
            })}
            <motion.div
              className="absolute top-1/2 w-3 h-3 rounded-full border-2 border-text-primary bg-background"
              initial={{ left: "0%", y: "-50%" }}
              animate={{ left: `${markerPosition}%`, y: "-50%" }}
              transition={springs.smooth}
              style={{ x: "-50%" }}
            />
          </div>
          <div className="flex text-center">
            {zones.map((zone) => {
              const width = ((zone.max - zone.min) / totalRange) * 100;
              return (
                <div key={zone.label} style={{ width: `${width}%` }}>
                  <span className="font-body text-[9px] text-text-tertiary">{zone.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border-subtle p-3 text-center">
            <p className="font-display text-lg font-bold text-text-primary">
              {leanMassKg !== null ? leanMassKg.toFixed(1) : "--"} <span className="text-sm font-normal text-text-tertiary">kg</span>
            </p>
            <p className="font-mono-label text-text-tertiary">Massa magra</p>
          </div>
          <div className="rounded-lg border border-border-subtle p-3 text-center">
            <p className="font-display text-lg font-bold text-text-primary">
              {fatMassKg !== null ? fatMassKg.toFixed(1) : "--"} <span className="text-sm font-normal text-text-tertiary">kg</span>
            </p>
            <p className="font-mono-label text-text-tertiary">Massa grassa</p>
          </div>
        </div>
      </div>
    </div>
  );
}
