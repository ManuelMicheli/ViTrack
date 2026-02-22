// ---------------------------------------------------------------------------
// localStorage-based food history (recent + frequent)
// ---------------------------------------------------------------------------

import type { FoodItem } from "./food-database/types";

const RECENT_KEY = "vitrack_recent_foods";
const FREQUENT_KEY = "vitrack_frequent_foods";
const MAX_RECENT = 20;
const MAX_FREQUENT = 10;

// ---------------------------------------------------------------------------
// Recent foods
// ---------------------------------------------------------------------------
export function getRecentFoods(): FoodItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FoodItem[];
  } catch {
    return [];
  }
}

export function addToRecent(food: FoodItem): void {
  if (typeof window === "undefined") return;
  try {
    const recent = getRecentFoods().filter((f) => f.id !== food.id);
    recent.unshift(food);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {
    // ignore quota errors
  }
}

// ---------------------------------------------------------------------------
// Frequent foods
// ---------------------------------------------------------------------------
interface FrequentEntry {
  id: string;
  count: number;
}

function getFrequentEntries(): FrequentEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FREQUENT_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FrequentEntry[];
  } catch {
    return [];
  }
}

export function incrementFrequency(foodId: string): void {
  if (typeof window === "undefined") return;
  try {
    const entries = getFrequentEntries();
    const existing = entries.find((e) => e.id === foodId);
    if (existing) {
      existing.count++;
    } else {
      entries.push({ id: foodId, count: 1 });
    }
    // Sort by count descending and keep top entries
    entries.sort((a, b) => b.count - a.count);
    localStorage.setItem(FREQUENT_KEY, JSON.stringify(entries.slice(0, MAX_FREQUENT * 2)));
  } catch {
    // ignore quota errors
  }
}

export function getFrequentFoodIds(): string[] {
  return getFrequentEntries()
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_FREQUENT)
    .map((e) => e.id);
}
