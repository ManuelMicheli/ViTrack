"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La password deve contenere almeno 6 caratteri.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Le password non corrispondono.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowser();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      setEmailSent(true);
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
          <p className="text-text-secondary mt-2 text-sm font-body">
            Crea il tuo account
          </p>
        </div>

        {emailSent ? (
          <div className="bg-surface border border-border rounded-lg p-6 space-y-4 text-center">
            <div className="text-4xl mb-2">&#9993;</div>
            <h2 className="font-display text-lg font-semibold text-text-primary">Controlla la tua email</h2>
            <p className="text-sm text-text-secondary font-body">
              Abbiamo inviato un link di conferma a <span className="text-text-primary font-medium">{email}</span>.
              Clicca il link nell&apos;email per attivare il tuo account.
            </p>
            <p className="text-xs text-text-tertiary mt-2 font-body">
              Non trovi l&apos;email? Controlla la cartella spam.
            </p>
            <Link
              href="/"
              className="inline-block mt-4 text-sm text-[var(--color-accent-dynamic)] hover:opacity-80 transition-colors"
            >
              Torna al login
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleRegister} className="bg-surface border border-border rounded-lg p-6 space-y-4">
              <div>
                <label htmlFor="first_name" className="font-mono-label text-text-tertiary block mb-2">
                  Nome
                </label>
                <input
                  id="first_name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Il tuo nome"
                  className="w-full px-4 py-3 rounded-lg bg-transparent border border-border focus:outline-none focus:border-[var(--color-accent-dynamic)]/30 text-text-primary placeholder-text-tertiary font-body transition-all"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="font-mono-label text-text-tertiary block mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@esempio.com"
                  className="w-full px-4 py-3 rounded-lg bg-transparent border border-border focus:outline-none focus:border-[var(--color-accent-dynamic)]/30 text-text-primary placeholder-text-tertiary font-body transition-all"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="font-mono-label text-text-tertiary block mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimo 6 caratteri"
                  className="w-full px-4 py-3 rounded-lg bg-transparent border border-border focus:outline-none focus:border-[var(--color-accent-dynamic)]/30 text-text-primary placeholder-text-tertiary font-body transition-all"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirm_password" className="font-mono-label text-text-tertiary block mb-2">
                  Conferma Password
                </label>
                <input
                  id="confirm_password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ripeti la password"
                  className="w-full px-4 py-3 rounded-lg bg-transparent border border-border focus:outline-none focus:border-[var(--color-accent-dynamic)]/30 text-text-primary placeholder-text-tertiary font-body transition-all"
                  required
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
                {loading ? "Registrazione..." : "Registrati"}
              </button>
            </form>

            <p className="text-center text-sm text-text-tertiary mt-6 font-body">
              Hai gia un account?{" "}
              <Link href="/" className="text-[var(--color-accent-dynamic)] hover:opacity-80 transition-colors">
                Accedi
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
