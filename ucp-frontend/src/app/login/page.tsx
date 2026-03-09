"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getToken, login } from "@/services/auth";
import TopHeader from "@/app/components/TopHeader";

const DEFAULT_AFTER_LOGIN_ROUTE = "/formulaire";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (getToken()) {
      router.replace(DEFAULT_AFTER_LOGIN_ROUTE);
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await login(username, password);

    if (result.success) {
      // Redirection immédiate vers le formulaire après connexion réussie
      router.push("/formulaire");
    } else {
      setError(result.error || "Une erreur est survenue");
    }
  };

  return (
    <div className="app-shell">
      <TopHeader />
      <div className="login-scene relative min-h-[calc(100vh-78px)] flex items-center justify-center overflow-hidden bg-background px-4 py-8">
        <div className="login-decor-overlay pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,transparent_36%,rgba(71,85,105,0.22)_36%,rgba(71,85,105,0.22)_40%,transparent_40%,transparent_100%)]" />
        <div className="login-decor-primary pointer-events-none absolute -top-24 -left-16 h-[360px] w-[370px] rotate-[-17deg] rounded-[42px] bg-[linear-gradient(140deg,var(--chart-2)_0%,var(--chart-1)_62%,var(--primary)_100%)] opacity-80 shadow-[0_45px_80px_-30px_rgba(0,0,0,0.45)]" />
        <div className="login-decor-secondary pointer-events-none absolute left-[10%] top-[26%] h-[230px] w-[230px] rotate-[-32deg] rounded-[34px] bg-[linear-gradient(150deg,rgba(57,67,79,0.95)_0%,rgba(16,22,29,0.95)_100%)]" />
        <div className="login-decor-bottom pointer-events-none absolute bottom-[-60px] right-[-24px] h-[240px] w-[440px] rotate-[-13deg] rounded-[26px] bg-[linear-gradient(125deg,rgba(58,69,82,0.35)_0%,rgba(15,20,27,0.12)_100%)]" />

        <div className="login-card relative w-full max-w-md overflow-hidden rounded-3xl border border-border/60 bg-card/90 p-8 shadow-[0_35px_85px_-28px_rgba(0,0,0,0.55)] backdrop-blur-md md:p-10">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,var(--chart-2)_0%,var(--chart-1)_50%,var(--chart-2)_100%)]" />
          <div className="pointer-events-none absolute -inset-px rounded-3xl border border-border/50" />
          <div className="max-w-sm mx-auto">
            <div className="flex items-center justify-center mb-5">
              <Image
                src="/ucp-sante-logo-color.png"
                alt="Logo UCP"
                width={74}
                height={74}
                className="rounded-xl border border-border/80 bg-card shadow-[0_0_26px_rgba(0,0,0,0.22)]"
              />
            </div>

            <div className="text-center mb-4">
              <p className="login-kicker text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Bienvenue
              </p>
              <h1 className="login-title text-3xl font-semibold tracking-[0.09em] text-foreground">
                UCP
              </h1>
              <p className="login-subtitle mt-2 text-sm leading-relaxed text-muted-foreground">
                Unite de coordination de projet
                <br />
                e-Procurement
              </p>
            </div>

            {error && (
              <div className="login-error mt-5 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label className="login-label mb-2 block text-sm font-semibold tracking-wide text-foreground">
                  Utilisateur
                </label>
                <input
                  type="text"
                  className="login-input w-full rounded-xl border border-input bg-background p-3 text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Votre nom d'utilisateur"
                />
              </div>

              <div>
                <label className="login-label mb-2 block text-sm font-semibold tracking-wide text-foreground">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="login-input w-full rounded-xl border border-input bg-background p-3 pr-11 text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Votre mot de passe"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md border border-border bg-secondary text-secondary-foreground transition hover:opacity-90"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    title={showPassword ? "Masquer" : "Afficher"}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                        <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M10.7 10.7a2 2 0 102.6 2.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M9.5 5.2A11.4 11.4 0 0112 4c5.5 0 9.5 4 10 8a10.5 10.5 0 01-3 5.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M6.2 7.1A11.6 11.6 0 002 12c.2 1.8 1.4 3.6 3.1 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                        <path d="M2 12c.5-4 4.5-8 10-8s9.5 4 10 8c-.5 4-4.5 8-10 8S2.5 16 2 12z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="login-submit mt-2 w-full rounded-xl bg-primary px-4 py-3 font-bold tracking-wide text-primary-foreground shadow-[0_16px_26px_-14px_rgba(0,0,0,0.42)] transition hover:opacity-90"
              >
                Se connecter
              </button>
            </form>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs tracking-wide">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              <p className="login-foot text-muted-foreground">UCP</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
