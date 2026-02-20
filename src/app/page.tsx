"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [telegramId, setTelegramId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/user?telegram_id=${encodeURIComponent(telegramId)}`);
      if (!res.ok) {
        setError("Utente non trovato. Assicurati di aver avviato il bot Telegram con /start");
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

        <form onSubmit={handleLogin} className="glass-card-strong p-6 space-y-4">
          <div>
            <label htmlFor="telegram_id" className="block text-xs text-white/60 uppercase tracking-wider font-medium mb-2">
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
              Puoi trovare il tuo Telegram ID inviando /start al bot @userinfobot
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

        <p className="text-center text-xs text-white/50 mt-6">
          Non hai un account? Avvia il bot Telegram per registrarti.
        </p>
      </div>
    </div>
  );
}
