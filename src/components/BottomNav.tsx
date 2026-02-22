"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useChat } from "@/lib/chat-context";
import { usePreferences } from "@/lib/preferences-context";
import { springs } from "@/lib/animation-config";

interface BottomNavProps {
  currentPath: string;
}

export default function BottomNav({ currentPath }: BottomNavProps) {
  const { toggleChat, isChatOpen } = useChat();
  const { accentHex } = usePreferences();

  const navItems = [
    { href: "/dashboard", label: "HOME" },
    { href: "/dashboard/meals", label: "PASTI" },
    { href: "/dashboard/workouts", label: "WORKOUT" },
    { href: "/dashboard/stats", label: "STATS" },
    { href: "/dashboard/profile", label: "PROFILO" },
    { href: "/dashboard/settings", label: "INFO" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-border z-20 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around py-3">
        {navItems.map((item) => {
          const isActive = item.href === "/dashboard"
            ? currentPath === "/dashboard"
            : currentPath.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-1 px-3 py-1 font-mono-label text-[10px] transition-colors duration-200 ${
                isActive ? "text-text-primary" : "text-text-tertiary"
              }`}
            >
              <span>{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="bottomnav-indicator"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ backgroundColor: accentHex }}
                  transition={springs.smooth}
                />
              )}
            </Link>
          );
        })}

        {/* Chat toggle */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={toggleChat}
          className={`relative flex flex-col items-center gap-1 px-3 py-1 font-mono-label text-[10px] transition-colors duration-200 ${
            isChatOpen ? "text-text-primary" : "text-text-tertiary"
          }`}
        >
          <span>···</span>
          {isChatOpen && (
            <motion.div
              layoutId="bottomnav-chat-indicator"
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
              style={{ backgroundColor: accentHex }}
              transition={springs.smooth}
            />
          )}
        </motion.button>
      </div>
    </nav>
  );
}
