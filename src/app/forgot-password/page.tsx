"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);
    try {
      const supabase = createSupabaseBrowser();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: window.location.origin + "/auth/callback?next=/reset-password" }
      );
      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccess(true);
      }
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
          <p className="text-white/60 mt-2 text-sm">Recupera Password</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card-strong p-6 space-y-4">
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
              placeholder="esempio@email.com"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] focus:outline-none focus:border-[#3B82F6]/30 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] text-white placeholder-[#444] transition-all"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20">
              <p className="text-sm text-[#EF4444]">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20">
              <p className="text-sm text-[#22C55E]">
                Controlla la tua email per il link di reset
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-xl font-medium transition-all disabled:opacity-50 hover:shadow-[0_0_25px_rgba(59,130,246,0.25)] active:scale-[0.98]"
          >
            {loading ? "Invio in corso..." : "Invia link di reset"}
          </button>
        </form>

        <p className="text-center text-sm text-white/50 mt-6">
          <Link href="/" className="text-[#3B82F6] hover:text-[#3B82F6]/80 transition-colors">
            Torna al login
          </Link>
        </p>
      </div>
    </div>
  );
}
