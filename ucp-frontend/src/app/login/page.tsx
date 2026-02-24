"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { login } from "@/services/auth"; // <--- On appelle notre nouveau portier
import TopHeader from "@/app/components/TopHeader";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter(); // <--- C'est le GPS pour changer de page

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Empêche la page de se recharger toute seule
    setError(""); // On efface les vieilles erreurs

    // On appelle notre service auth.ts
    const result = await login(username, password);

    if (result.success) {
      // ✅ SUCCÈS : Redirection vers le formulaire (etape principale)
      router.push("/formulaire");
    } else {
      // ❌ ERREUR : On affiche le message
      setError(result.error || "Une erreur est survenue");
    }
  };

  return (
    <div className="app-shell">
      <TopHeader />
      <div className="login-scene relative min-h-[calc(100vh-78px)] flex items-center justify-center overflow-hidden px-4 py-8 bg-[radial-gradient(circle_at_80%_10%,rgba(100,108,118,0.45),transparent_35%),linear-gradient(145deg,#05090d_0%,#111820_45%,#1a242e_100%)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,transparent_36%,rgba(71,85,105,0.22)_36%,rgba(71,85,105,0.22)_40%,transparent_40%,transparent_100%)]" />
        <div className="pointer-events-none absolute -top-24 -left-16 h-[360px] w-[370px] rotate-[-17deg] rounded-[42px] bg-[linear-gradient(140deg,#53f779_0%,#24c85a_62%,#148138_100%)] shadow-[0_45px_80px_-30px_rgba(28,197,84,0.6)]" />
        <div className="pointer-events-none absolute left-[10%] top-[26%] h-[230px] w-[230px] rotate-[-32deg] rounded-[34px] bg-[linear-gradient(150deg,rgba(57,67,79,0.95)_0%,rgba(16,22,29,0.95)_100%)]" />
        <div className="pointer-events-none absolute bottom-[-60px] right-[-24px] h-[240px] w-[440px] rotate-[-13deg] rounded-[26px] bg-[linear-gradient(125deg,rgba(58,69,82,0.5)_0%,rgba(15,20,27,0.15)_100%)]" />

        <div className="login-card relative w-full max-w-md rounded-3xl overflow-hidden border border-slate-400/25 bg-[linear-gradient(170deg,rgba(16,24,33,0.95)_0%,rgba(8,13,18,0.96)_100%)] shadow-[0_35px_85px_-28px_rgba(0,0,0,0.9)] backdrop-blur-md p-8 md:p-10">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#67ff87_0%,#25bd58_50%,#67ff87_100%)]" />
          <div className="pointer-events-none absolute -inset-px rounded-3xl border border-emerald-300/20" />
          <div className="max-w-sm mx-auto">
            <div className="flex items-center justify-center mb-5">
              <Image
                src="/ucp-sante-logo.svg"
                alt="Logo UCP"
                width={74}
                height={74}
                className="rounded-xl border border-emerald-300/60 bg-white/95 p-1 shadow-[0_0_26px_rgba(56,229,118,0.48)]"
              />
            </div>

            <div className="text-center mb-4">
              <p className="login-kicker text-xs font-semibold tracking-[0.16em] text-emerald-300 uppercase">
                Bienvenue
              </p>
              <h1 className="login-title text-3xl font-semibold text-slate-100 tracking-[0.09em]">
                UCP
              </h1>
              <p className="login-subtitle mt-2 text-sm text-slate-300 leading-relaxed">
                Unite de coordination de projet
                <br />
                e-Procurement
              </p>
            </div>

            {error && (
              <div className="login-error mt-5 bg-red-500/12 border border-red-400/40 text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label className="login-label block text-slate-200 text-sm font-semibold mb-2 tracking-wide">
                  Utilisateur
                </label>
                <input
                  type="text"
                  className="login-input w-full p-3 border border-slate-500/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-300 text-slate-100 placeholder:text-slate-400 bg-slate-800/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: stephanie"
                />
              </div>

              <div>
                <label className="login-label block text-slate-200 text-sm font-semibold mb-2 tracking-wide">
                  Mot de passe
                </label>
                <input
                  type="password"
                  className="login-input w-full p-3 border border-slate-500/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-300 text-slate-100 placeholder:text-slate-400 bg-slate-800/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="login-submit w-full mt-2 bg-[linear-gradient(96deg,#68ff8a_0%,#31d767_42%,#14943e_100%)] text-slate-950 font-bold tracking-wide py-3 px-4 rounded-xl hover:brightness-110 transition duration-200 shadow-[0_16px_26px_-14px_rgba(46,218,102,0.88)]"
              >
                Se connecter
              </button>
            </form>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
              <p className="login-foot text-slate-300">UCP</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
