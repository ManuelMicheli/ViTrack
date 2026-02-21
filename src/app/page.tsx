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
    `flex-1 pb-3 text-sm transition-all cursor-pointer font-mono-label text-[11px] ${
      activeTab === tab
        ? "text-text-primary border-b-2"
        : "text-text-tertiary hover:text-text-secondary border-b-2 border-transparent"
    }`;

  const tabStyle = (tab: Tab) =>
    activeTab === tab
      ? { borderBottomColor: 'var(--color-accent-dynamic)' }
      : undefined;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[360px] space-y-8">
        <h1 className="font-display text-5xl font-bold text-text-primary text-center">
          VITRACK
        </h1>

        <div className="bg-surface border border-border rounded-lg p-6">
          <p className="font-body text-sm text-text-tertiary text-center mb-6">
            Track. Train. Transform.
          </p>

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
                  className="block font-mono-label text-text-tertiary mb-2"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@esempio.com"
                  className="w-full px-4 py-3 rounded-lg bg-transparent border border-border focus:outline-none focus:border-[var(--color-accent-dynamic)] text-text-primary placeholder-text-tertiary transition-all font-body"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block font-mono-label text-text-tertiary mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="La tua password"
                  className="w-full px-4 py-3 rounded-lg bg-transparent border border-border focus:outline-none focus:border-[var(--color-accent-dynamic)] text-text-primary placeholder-text-tertiary transition-all font-body"
                  required
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-danger/10 border border-danger/20">
                  <p className="text-sm text-danger">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[var(--color-accent-dynamic)] text-black rounded-lg font-mono-label tracking-widest transition-all disabled:opacity-50 hover:opacity-90 active:scale-[0.98]"
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
                  className="block font-mono-label text-text-tertiary mb-2"
                >
                  Telegram ID
                </label>
                <input
                  id="telegram_id"
                  type="text"
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                  placeholder="Es. 123456789"
                  className="w-full px-4 py-3 rounded-lg bg-transparent border border-border focus:outline-none focus:border-[var(--color-accent-dynamic)] text-text-primary placeholder-text-tertiary transition-all font-body"
                  required
                />
                <p className="text-xs text-text-tertiary mt-2">
                  Puoi trovare il tuo Telegram ID inviando /start al bot
                  @userinfobot
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-danger/10 border border-danger/20">
                  <p className="text-sm text-danger">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[var(--color-accent-dynamic)] text-black rounded-lg font-mono-label tracking-widest transition-all disabled:opacity-50 hover:opacity-90 active:scale-[0.98]"
              >
                {loading ? "Accesso..." : "Accedi"}
              </button>
            </form>
          )}
        </div>

        {/* Links below card */}
        <div className="space-y-3 text-center">
          <p className="text-sm text-text-tertiary">
            <Link
              href="/forgot-password"
              className="text-text-secondary hover:text-text-primary transition-colors underline"
            >
              Password dimenticata?
            </Link>
          </p>
          <p className="text-sm text-text-tertiary">
            Non hai un account?{" "}
            <Link
              href="/register"
              className="text-text-secondary hover:text-text-primary transition-colors underline"
            >
              Registrati
            </Link>
          </p>
        </div>

        {/* Decorative typographic line */}
        <div className="mt-8 flex items-center justify-center gap-1 opacity-30">
          <div className="w-12 h-px" style={{ backgroundColor: 'var(--color-accent-dynamic)' }} />
          <div className="w-8 h-px" style={{ backgroundColor: 'var(--color-accent-dynamic)' }} />
          <div className="w-4 h-px" style={{ backgroundColor: 'var(--color-accent-dynamic)' }} />
          <div className="w-2 h-px" style={{ backgroundColor: 'var(--color-accent-dynamic)' }} />
          <div className="w-1 h-px" style={{ backgroundColor: 'var(--color-accent-dynamic)' }} />
        </div>
      </div>
    </div>
  );
}
