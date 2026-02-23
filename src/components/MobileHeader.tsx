"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useUser } from "@/lib/user-provider";
import { useLanguage } from "@/lib/language-context";
import { usePreferences } from "@/lib/preferences-context";

const routeTitles: Record<string, string> = {
  "/dashboard": "nav.dashboard",
  "/dashboard/meals": "nav.meals",
  "/dashboard/workouts": "nav.workouts",
  "/dashboard/stats": "nav.stats",
  "/dashboard/settings": "nav.settings",
  "/dashboard/profile": "profile.title",
};

export default function MobileHeader() {
  const pathname = usePathname();
  const { user } = useUser();
  const { t } = useLanguage();
  const { accentHex } = usePreferences();

  const titleKey = Object.entries(routeTitles).find(
    ([route]) => pathname === route || (route !== "/dashboard" && pathname.startsWith(route))
  )?.[1] ?? "nav.dashboard";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const title = t(titleKey as any);
  const isProfilePage = pathname === "/dashboard/profile";

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border-subtle">
      <div className="flex items-center justify-between px-4 h-12">
        {/* Page title */}
        <h1 className="font-display text-base font-bold uppercase tracking-tight text-text-primary">
          {title}
        </h1>

        {/* Avatar → profile link */}
        {!isProfilePage && (
          <Link
            href="/dashboard/profile"
            className="relative flex items-center justify-center w-8 h-8 rounded-full overflow-hidden border-[1.5px] transition-transform active:scale-95"
            style={{ borderColor: accentHex }}
          >
            {user?.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.first_name || "Avatar"}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-surface border border-border flex items-center justify-center">
                <span className="font-mono-label text-[10px] text-text-secondary">
                  {user?.first_name?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
            )}
          </Link>
        )}
      </div>
    </header>
  );
}
