"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  getCurrentUser,
  getLandingRouteForUser,
  getToken,
  login,
} from "@/services/auth";
import { useAccess } from "@/context/accessContext";

const DEFAULT_PUBLIC_REGISTER_ROUTE = "/auth/public/register";
const DEFAULT_PUBLIC_ROUTE = "/procurement";
const DEFAULT_PRIVATE_ROUTE = "/personnel/log-dashboard";

export default function LoginPage() {
  const { setAccess } = useAccess();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const user = getCurrentUser();
    if (token && user) {
      router.push(getLandingRouteForUser(user));
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Veuillez saisir votre email.");
      return;
    }
    if (!password.trim()) {
      setError("Veuillez saisir votre mot de passe.");
      return;
    }

    setLoading(true);
    const result = await login(email, password, setAccess);
    setLoading(false);

    if (result.success) {
      const user = getCurrentUser();
      const target = user
        ? getLandingRouteForUser(user)
        : result.accessType === "private"
          ? DEFAULT_PRIVATE_ROUTE
          : DEFAULT_PUBLIC_ROUTE;
      router.push(target);
      return;
    }

    if (result.message === "identifiants publique introuvable") {
      setError("Compte introuvable. Redirection en cours...");
      setTimeout(() => router.push(DEFAULT_PUBLIC_REGISTER_ROUTE), 2000);
      return;
    }

    setError(result.message || "Une erreur est survenue. Veuillez réessayer.");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#f1f5f9] overflow-hidden px-4">
      {/* Décoration haut-gauche */}
      <div className="pointer-events-none absolute -top-20 -left-14 h-64 w-56 rotate-[-17deg] rounded-[40px] bg-gradient-to-br from-emerald-300 to-emerald-500 opacity-90 shadow-[0_40px_70px_-20px_rgba(16,120,60,0.5)]" />
      {/* Décoration haut-gauche secondaire */}
      <div className="pointer-events-none absolute left-[8%] top-[12%] h-44 w-48 rotate-[-30deg] rounded-[30px] bg-slate-400/20" />
      {/* Décoration bas-droite */}
      <div className="pointer-events-none absolute -bottom-12 -right-10 h-56 w-64 rotate-[-15deg] rounded-[30px] bg-slate-400/25" />

      {/* Carte */}
      <div className="relative w-full max-w-[400px] bg-white rounded-2xl shadow-[0_20px_60px_-20px_rgba(15,23,42,0.15)] border border-slate-200 px-8 py-10 z-10">
        {/* Barre couleur haut */}
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400" />

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden w-20 h-20">
            <Image
              src="/ucp-sante-logo-color.png"
              alt="Logo UCP"
              width={80}
              height={80}
              className="rounded-lg"
            />
          </div>
        </div>

        {/* Titre */}
        <div className="text-center mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 mb-2">
            E-Procurement Platform
          </p>
          <h1 className="text-2xl font-bold text-slate-900">Connexion</h1>
          <div className="mx-auto mt-2 h-0.5 w-10 rounded-full bg-emerald-500" />
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-rose-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-4.75a.75.75 0 001.5 0v-4.5a.75.75 0 00-1.5 0v4.5zm.75-7a.75.75 0 100 1.5.75.75 0 000-1.5z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5" noValidate>
          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="votre@email.com"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          {/* Mot de passe */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 pr-11 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                aria-label={showPassword ? "Masquer" : "Afficher"}
              >
                {showPassword ? (
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M3 3l18 18M10.7 10.7a2 2 0 102.6 2.6" />
                    <path d="M9.5 5.2A11 11 0 0122 12a10.5 10.5 0 01-3 5.2M6.2 7.1A11.6 11.6 0 002 12c.5 4 4.5 8 10 8a11 11 0 005-1.2" />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M2 12c.5-4 4.5-8 10-8s9.5 4 10 8c-.5 4-4.5 8-10 8S2.5 16 2 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Bouton */}
          <button
            type="submit"
            disabled={loading}
            className="relative w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:opacity-70"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                  />
                </svg>
                Connexion en cours…
              </span>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

        {/* Pied de carte */}
        <div className="mt-10 flex items-center justify-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-xs text-slate-400">
            Unité de Coordination des Projets
          </p>
        </div>
      </div>
    </div>
  );
}
