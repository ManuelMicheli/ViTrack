"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { HomeIcon, UtensilsIcon, DumbbellIcon, ChartIcon, SettingsIcon, ChatIcon } from "./icons";
import VTLogoIcon from "./VTLogo";
import { useChat } from "@/lib/chat-context";
import { usePreferences } from "@/lib/preferences-context";
import { springs } from "@/lib/animation-config";

interface SidebarProps {
  currentPath: string;
  user: { first_name: string | null; username: string | null; avatar_url?: string | null } | null;
  onLogout: () => void;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/dashboard/meals", label: "Pasti", icon: UtensilsIcon },
  { href: "/dashboard/workouts", label: "Allenamenti", icon: DumbbellIcon },
  { href: "/dashboard/stats", label: "Statistiche", icon: ChartIcon },
  { href: "/dashboard/settings", label: "Impostazioni", icon: SettingsIcon },
];

export default function Sidebar({ currentPath, user, onLogout }: SidebarProps) {
  const { toggleChat, isChatOpen } = useChat();
  const { accentHex } = usePreferences();

  return (
    <aside className="hidden md:flex md:flex-col fixed left-0 top-0 h-full w-60 bg-[#0A0A0A]/80 backdrop-blur-xl border-r border-white/[0.06] z-20">
      <div className="p-6 flex items-center gap-3">
        <VTLogoIcon className="w-10 h-5" />
        <h1 className="text-xl font-bold tracking-tight text-white">ViTrack</h1>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = currentPath === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                isActive
                  ? "text-white bg-white/[0.08]"
                  : "text-white/60 hover:text-white hover:bg-white/[0.04]"
              }`}
              style={isActive ? { boxShadow: `0 0 12px ${accentHex}14` } : undefined}
            >
              <Icon className="w-5 h-5" filled={isActive} />
              {item.label}
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: accentHex }}
                  transition={springs.smooth}
                />
              )}
            </Link>
          );
        })}

        <div className="pt-2">
          <motion.button
            onClick={toggleChat}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 w-full ${
              isChatOpen
                ? "text-white bg-white/[0.08]"
                : "text-white/60 hover:text-white hover:bg-white/[0.04]"
            }`}
            style={isChatOpen ? { boxShadow: `0 0 12px ${accentHex}14` } : undefined}
          >
            <ChatIcon className="w-5 h-5" filled={isChatOpen} />
            Assistente
            {isChatOpen && (
              <motion.div
                layoutId="sidebar-chat-indicator"
                className="ml-auto w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: accentHex }}
                transition={springs.smooth}
              />
            )}
          </motion.button>
        </div>
      </nav>

      <div className="p-4 border-t border-white/[0.06]">
        {user && (
          <Link href="/dashboard/profile" className="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl hover:bg-white/[0.04] transition-all">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.first_name || "Avatar"}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: `linear-gradient(to bottom right, ${accentHex}, #8B5CF6)` }}>
                {user.first_name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.first_name || user.username || "Utente"}
              </p>
              {user.username && (
                <p className="text-xs text-[#666] truncate">@{user.username}</p>
              )}
            </div>
          </Link>
        )}
        <button
          onClick={onLogout}
          className="w-full text-left px-3 py-2 text-sm text-[#666] hover:text-[#EF4444] transition-colors rounded-xl hover:bg-white/[0.04]"
        >
          Esci
        </button>
      </div>
    </aside>
  );
}
