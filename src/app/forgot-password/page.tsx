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
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-background">
      <div className="w-full max-w-sm relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-text-primary">ViTrack</h1>
          <p className="text-text-secondary mt-2 text-sm font-body">Recupera Password</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg p-6 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="font-mono-label text-text-tertiary block mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="esempio@email.com"
              className="w-full px-4 py-3 rounded-lg bg-transparent border border-border focus:outline-none focus:border-[var(--color-accent-dynamic)]/30 text-text-primary placeholder-text-tertiary font-body transition-all"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20">
              <p className="text-sm text-danger font-body">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-success/10 border border-success/20">
              <p className="text-sm text-success font-body">
                Controlla la tua email per il link di reset
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[var(--color-accent-dynamic)] text-black rounded-lg font-mono-label transition-all disabled:opacity-50 hover:opacity-90 active:scale-[0.98]"
          >
            {loading ? "Invio in corso..." : "Invia link di reset"}
          </button>
        </form>

        <p className="text-center text-sm text-text-tertiary mt-6 font-body">
          <Link href="/" className="text-[var(--color-accent-dynamic)] hover:opacity-80 transition-colors">
            Torna al login
          </Link>
        </p>
      </div>
    </div>
  );
}
