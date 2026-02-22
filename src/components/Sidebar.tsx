"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { HomeIcon, UtensilsIcon, DumbbellIcon, ChartIcon, SettingsIcon, ChatIcon } from "./icons";
import { useChat } from "@/lib/chat-context";
import { usePreferences } from "@/lib/preferences-context";
import { useLanguage } from "@/lib/language-context";
import { springs } from "@/lib/animation-config";

interface SidebarProps {
  currentPath: string;
  user: { first_name: string | null; username: string | null; avatar_url?: string | null } | null;
  onLogout: () => void;
}

export default function Sidebar({ currentPath, user, onLogout }: SidebarProps) {
  const { toggleChat, isChatOpen } = useChat();
  const { accentHex } = usePreferences();
  const { t } = useLanguage();

  const navItems = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: HomeIcon },
    { href: "/dashboard/meals", label: t("nav.meals"), icon: UtensilsIcon },
    { href: "/dashboard/workouts", label: t("nav.workouts"), icon: DumbbellIcon },
    { href: "/dashboard/stats", label: t("nav.stats"), icon: ChartIcon },
  ];

  return (
    <aside className="hidden md:flex md:flex-col fixed left-0 top-0 h-full w-[220px] bg-black border-r border-border z-20">
      {/* Logo */}
      <div className="p-6">
        <h1 className="font-display text-lg font-bold uppercase tracking-tight text-text-primary">
          VITRACK
        </h1>
      </div>

      {/* Separator */}
      <div className="mx-4 border-t border-border-subtle" />

      {/* Navigation */}
      <nav className="flex-1 px-4 pt-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.href === "/dashboard"
            ? currentPath === "/dashboard"
            : currentPath.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-3 py-2.5 text-sm font-body transition-colors duration-200 ${
                isActive
                  ? "text-text-primary"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full"
                  style={{ backgroundColor: accentHex }}
                  transition={springs.smooth}
                />
              )}
              <Icon className="w-4 h-4 opacity-40" filled={false} />
              {item.label}
            </Link>
          );
        })}

        {/* Chat button */}
        <div className="pt-1">
          <motion.button
            onClick={toggleChat}
            whileTap={{ scale: 0.98 }}
            className={`relative flex items-center gap-3 px-3 py-2.5 text-sm font-body transition-colors duration-200 w-full text-left ${
              isChatOpen
                ? "text-text-primary"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            {isChatOpen && (
              <motion.div
                layoutId="sidebar-chat-indicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full"
                style={{ backgroundColor: accentHex }}
                transition={springs.smooth}
              />
            )}
            <ChatIcon className="w-4 h-4 opacity-40" filled={false} />
            {t("nav.assistant")}
          </motion.button>
        </div>
      </nav>

      {/* Separator */}
      <div className="mx-4 border-t border-border-subtle" />

      {/* User section */}
      <div className="p-4">
        {user && (
          <Link href="/dashboard/profile" className="flex items-center gap-3 px-3 py-2 mb-2 transition-colors hover:opacity-80">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.first_name || "Avatar"}
                width={28}
                height={28}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center">
                <span className="font-mono-label text-[9px] text-text-secondary">
                  {user.first_name?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-mono-label text-text-secondary truncate">
                {user.first_name || user.username || t("nav.user")}
              </p>
            </div>
          </Link>
        )}
        <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 text-xs text-text-tertiary hover:text-text-secondary transition-colors">
          <SettingsIcon className="w-3.5 h-3.5 opacity-40" filled={false} />
          {t("nav.settings")}
        </Link>
        <button
          onClick={onLogout}
          className="w-full text-left px-3 py-2 text-xs text-text-tertiary hover:text-danger transition-colors"
        >
          {t("nav.logout")}
        </button>
      </div>
    </aside>
  );
}
