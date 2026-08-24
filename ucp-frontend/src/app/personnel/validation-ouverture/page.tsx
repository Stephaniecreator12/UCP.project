"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Key, Lock, Mail, ArrowLeft } from "lucide-react";
import TopHeader from "@/app/components/TopHeader";
import { getToken, fetchCurrentUser, isAdminUser, isSecretaireUser } from "@/services/auth";

export default function ValidationOuvertureLandingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<"secretaire" | "admin" | "member" | "president" | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      const token = getToken();
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      try {
        const user = await fetchCurrentUser();
        if (isAdminUser(user) || isSecretaireUser(user)) {
          setUserRole(isSecretaireUser(user) ? "secretaire" : "admin");
        } else {
          setUserRole("member");
        }
      } catch {
        setUserRole("member");
      } finally {
        setIsLoading(false);
      }
    };
    checkAccess();
  }, [router]);

  const prefilledRole = searchParams.get("role");
  const prefilledEmail = searchParams.get("email");

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent" />
      </main>
    );
  }

  if (userRole === "secretaire" || userRole === "admin") {
    return (
      <main className="min-h-screen bg-slate-50">
        <TopHeader />
        <div className="mx-auto max-w-[1680px] px-4 py-12">
          <div className="rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-bold text-slate-900">Validation Ouverture</h1>
            <p className="mt-4 text-slate-600">
              En tant que secrétaire, gérez les séances depuis le module principal :
            </p>
            <div className="mt-6 flex gap-4">
              <a
                href="/personnel/ouverture_offre"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-white font-semibold shadow hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-5 w-5" />
                Ouvrir le module Ouverture des offres
              </a>
              <a
                href="/personnel/ouverture_offre/membres"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-slate-700 font-semibold hover:bg-slate-50"
              >
                <Mail className="h-5 w-5" />
                Gérer les membres de commission
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#f6faf8_0%,transparent_25%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] pb-12">
      <TopHeader />

      <div className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-900">Validation Ouverture des Offres</h1>
                <p className="mt-1 text-sm text-slate-600">Accès réservé aux membres de commission et président</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Comment accéder à la validation</h2>
              <div className="space-y-3 text-sm text-slate-700">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold">Recevez l'invitation par email</p>
                    <p className="text-slate-500">Le secrétaire envoie les invitations quand la séance est prête pour validation</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <Key className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold">Cliquez sur le lien dans l'email</p>
                    <p className="text-slate-500">Le lien contient votre rôle (membre/président) et votre email pré-remplis</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold">Entrez le mot de passe reçu</p>
                    <p className="text-slate-500">Le mot de passe unique se trouve dans le même email d'invitation</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold">Validez ou rejetez</p>
                    <p className="text-slate-500">Consultez le PV et donnez votre décision (Validation/Rejet/Report)</p>
                  </div>
                </div>
              </div>
            </div>

            {!showAuthForm ? (
              <button
                onClick={() => setShowAuthForm(true)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition"
              >
                <ArrowLeft className="h-5 w-5" />
                J'ai mon lien d'invitation — Accéder à la validation
              </button>
            ) : (
              <div className="space-y-4 border-t border-slate-200 pt-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Accès direct (si lien perdu)</h3>
                <p className="text-sm text-slate-600">
                  Si vous n'avez pas le lien, vous pouvez entrer manuellement l'ID de séance, votre rôle et email :
                </p>
                <div className="flex gap-2">
                  <a
                    href={`/personnel/ouverture_offre/validation/${searchParams.get("seance") || "1"}?role=${prefilledRole || "membre"}&email=${prefilledEmail || ""}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    <Key className="h-4 w-4" />
                    Aller à la validation
                  </a>
                </div>
                <button
                  onClick={() => setShowAuthForm(false)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Revenir aux instructions
                </button>
              </div>
            )}

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div className="text-sm text-amber-900">
                  <p className="font-semibold">Lien expiré ou introuvable ?</p>
                  <p className="mt-1">Contactez le secrétaire de commission pour qu'il renvoie l'invitation.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/personnel/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au dashboard
          </a>
        </div>
      </div>
    </main>
  );
}