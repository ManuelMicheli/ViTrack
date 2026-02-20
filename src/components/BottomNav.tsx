"use client";

import Link from "next/link";
import { HomeIcon, UtensilsIcon, DumbbellIcon, ChartIcon, SettingsIcon } from "./icons";

interface BottomNavProps {
  currentPath: string;
}

const navItems = [
  { href: "/dashboard", label: "Home", icon: HomeIcon },
  { href: "/dashboard/meals", label: "Pasti", icon: UtensilsIcon },
  { href: "/dashboard/workouts", label: "Allenam.", icon: DumbbellIcon },
  { href: "/dashboard/stats", label: "Stats", icon: ChartIcon },
  { href: "/dashboard/settings", label: "Impostaz.", icon: SettingsIcon },
];

export default function BottomNav({ currentPath }: BottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/80 backdrop-blur-xl border-t border-white/[0.06] z-20 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = currentPath === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-all duration-200 ${
                isActive ? "text-white" : "text-[#666]"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" filled={isActive} />
                {isActive && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#3B82F6]" />
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
