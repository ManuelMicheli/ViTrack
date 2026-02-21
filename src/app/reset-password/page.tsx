"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La password deve essere di almeno 6 caratteri.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Le password non corrispondono.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowser();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        setError(updateError.message);
      } else {
        router.push("/dashboard");
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
          <p className="text-text-secondary mt-2 text-sm font-body">Nuova Password</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg p-6 space-y-4">
          <div>
            <label
              htmlFor="password"
              className="font-mono-label text-text-tertiary block mb-2"
            >
              Nuova Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimo 6 caratteri"
              className="w-full px-4 py-3 rounded-lg bg-transparent border border-border focus:outline-none focus:border-[var(--color-accent-dynamic)]/30 text-text-primary placeholder-text-tertiary font-body transition-all"
              required
              minLength={6}
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="font-mono-label text-text-tertiary block mb-2"
            >
              Conferma Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ripeti la password"
              className="w-full px-4 py-3 rounded-lg bg-transparent border border-border focus:outline-none focus:border-[var(--color-accent-dynamic)]/30 text-text-primary placeholder-text-tertiary font-body transition-all"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20">
              <p className="text-sm text-danger font-body">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[var(--color-accent-dynamic)] text-black rounded-lg font-mono-label transition-all disabled:opacity-50 hover:opacity-90 active:scale-[0.98]"
          >
            {loading ? "Reimpostazione..." : "Reimposta Password"}
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
