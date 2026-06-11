"use client";

import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getToken } from "@/services/auth";
import { loginEvaluationDao } from "@/services/evaluationService";

function LoginFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[linear-gradient(180deg,#f5f6f6_0%,#eef1f0_100%)]">
      <div className="h-96 w-full max-w-md animate-pulse rounded-[30px] bg-white/80" />
    </div>
  );
}

export default function EvaluationLoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <EvaluationLoginContent />
    </Suspense>
  );
}

function EvaluationLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const seanceParam = searchParams.get("seance");
  const emailParam = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getToken() && seanceParam) {
      router.push(`/evaluation/dao/${seanceParam}/offres`);
    }
  }, [router, seanceParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const seanceId = seanceParam ? parseInt(seanceParam, 10) : undefined;
      const result = await loginEvaluationDao(
        email.trim(),
        password.trim(),
        Number.isFinite(seanceId) ? seanceId : undefined,
      );
      const targetSeance = seanceParam || String(result.seance_id);
      router.push(`/evaluation/dao/${targetSeance}/offres`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[linear-gradient(180deg,#f5f6f6_0%,#eef1f0_100%)] px-4 py-10">
      <div className="pointer-events-none absolute -top-16 left-8 h-56 w-48 rotate-[-18deg] rounded-[42px] bg-[linear-gradient(140deg,#a2f3b5_0%,#41f37c_62%,#a2f8be_100%)] opacity-80" />
      <div className="relative mx-auto max-w-md">
        <div className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_28px_70px_-42px_rgba(15,23,42,0.34)]">
          <div className="h-1 bg-[linear-gradient(90deg,#0f9f63_0%,#35b27f_46%,#d7f1e6_100%)]" />
          <div className="px-7 py-8 sm:px-8">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                <Image
                  src="/ucp-sante-logo-color.png"
                  alt="Logo UCP"
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">
                Évaluation des offres
              </p>
              <h1 className="mt-2 text-2xl font-bold text-slate-950">Connexion évaluateur</h1>
              <p className="mt-2 text-sm text-slate-500">
                Utilisez l&apos;email et le mot de passe reçus par mail pour ce DAO.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-50"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">Mot de passe DAO</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-50"
                />
              </label>
              {error && (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-emerald-700 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60"
              >
                {loading ? "Connexion…" : "Accéder aux offres"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
