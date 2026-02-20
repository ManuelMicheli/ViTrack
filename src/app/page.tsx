"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

type Tab = "email" | "telegram";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<Tab>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createSupabaseBrowser();
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError("Credenziali non valide. Riprova.");
        return;
      }

      // Fetch user record for backward compat
      const res = await fetch(
        `/api/user?id=${encodeURIComponent(data.user.id)}`
      );
      if (res.ok) {
        const user = await res.json();
        localStorage.setItem("vitrack_user_id", user.id);
      }

      router.push("/dashboard");
    } catch {
      setError("Errore di connessione. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `/api/user?telegram_id=${encodeURIComponent(telegramId)}`
      );
      if (!res.ok) {
        setError(
          "Utente non trovato. Assicurati di aver avviato il bot Telegram con /start"
        );
        return;
      }
      const user = await res.json();
      localStorage.setItem("vitrack_user_id", user.id);
      localStorage.setItem("vitrack_telegram_id", telegramId);
      router.push("/dashboard");
    } catch {
      setError("Errore di connessione. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  const tabClass = (tab: Tab) =>
    `flex-1 pb-3 text-sm font-medium transition-all cursor-pointer ${
      activeTab === tab
        ? "text-white border-b-2 border-transparent"
        : "text-white/40 hover:text-white/60"
    }`;

  const tabStyle = (tab: Tab) =>
    activeTab === tab
      ? { borderImage: "linear-gradient(to right, #3B82F6, #8B5CF6) 1" }
      : undefined;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#3B82F6]/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-[#8B5CF6]/[0.03] rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-sm relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">ViTrack</h1>
          <p className="text-white/60 mt-2 text-sm">
            Tracker calorie e allenamenti
          </p>
        </div>

        <div className="glass-card-strong p-6">
          {/* Tabs */}
          <div className="flex text-center mb-6">
            <button
              type="button"
              className={tabClass("email")}
              style={tabStyle("email")}
              onClick={() => {
                setActiveTab("email");
                setError("");
              }}
            >
              Email
            </button>
            <button
              type="button"
              className={tabClass("telegram")}
              style={tabStyle("telegram")}
              onClick={() => {
                setActiveTab("telegram");
                setError("");
              }}
            >
              Telegram ID
            </button>
          </div>

          {/* Email tab */}
          {activeTab === "email" && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs text-white/60 uppercase tracking-wider font-medium mb-2"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@esempio.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] focus:outline-none focus:border-[#3B82F6]/30 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] text-white placeholder-[#444] transition-all"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs text-white/60 uppercase tracking-wider font-medium mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="La tua password"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] focus:outline-none focus:border-[#3B82F6]/30 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] text-white placeholder-[#444] transition-all"
                  required
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20">
                  <p className="text-sm text-[#EF4444]">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-xl font-medium transition-all disabled:opacity-50 hover:shadow-[0_0_25px_rgba(59,130,246,0.25)] active:scale-[0.98]"
              >
                {loading ? "Accesso..." : "Accedi"}
              </button>
            </form>
          )}

          {/* Telegram ID tab */}
          {activeTab === "telegram" && (
            <form onSubmit={handleTelegramLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="telegram_id"
                  className="block text-xs text-white/60 uppercase tracking-wider font-medium mb-2"
                >
                  Telegram ID
                </label>
                <input
                  id="telegram_id"
                  type="text"
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                  placeholder="Es. 123456789"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] focus:outline-none focus:border-[#3B82F6]/30 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] text-white placeholder-[#444] transition-all"
                  required
                />
                <p className="text-xs text-white/50 mt-2">
                  Puoi trovare il tuo Telegram ID inviando /start al bot
                  @userinfobot
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20">
                  <p className="text-sm text-[#EF4444]">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-xl font-medium transition-all disabled:opacity-50 hover:shadow-[0_0_25px_rgba(59,130,246,0.25)] active:scale-[0.98]"
              >
                {loading ? "Accesso..." : "Accedi"}
              </button>
            </form>
          )}
        </div>

        {/* Links below card */}
        <div className="mt-6 space-y-3 text-center">
          <p className="text-sm text-white/50">
            <Link
              href="/forgot-password"
              className="text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
            >
              Password dimenticata?
            </Link>
          </p>
          <p className="text-sm text-white/50">
            Non hai un account?{" "}
            <Link
              href="/register"
              className="text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
            >
              Registrati
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
