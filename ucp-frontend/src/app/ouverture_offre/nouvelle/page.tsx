"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopHeader from "@/app/components/TopHeader";
import { fetchCurrentUser, getCurrentUser, getToken, isSecretaireUser } from "@/services/auth";
import { createSeance } from "@/services/ouvertureOffre";

export default function NouvelleSeancePage() {
  const router = useRouter();
  const [referenceDossier, setReferenceDossier] = useState("");
  const [objetDossier, setObjetDossier] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const bootstrap = async () => {
      if (!getToken()) {
        router.replace("/login");
        return;
      }

      try {
        const user = getCurrentUser() ?? (await fetchCurrentUser());
        if (!isSecretaireUser(user)) {
          router.replace("/dashboard");
          return;
        }
      } catch {
        router.replace("/login");
        return;
      }

      setBooting(false);
    };

    void bootstrap();
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    const cleanedReference = referenceDossier.trim();
    const cleanedObjet = objetDossier.trim();

    if (!cleanedReference) {
      setError("La référence dossier est obligatoire.");
      return;
    }

    if (!cleanedObjet) {
      setError("L'objet du dossier est obligatoire.");
      return;
    }

    try {
      setSubmitting(true);
      const seance = await createSeance({
        reference_dossier: cleanedReference,
        objet_dossier: cleanedObjet,
        statut: "BROUILLON",
      });

      setSuccessMessage(`Séance ${seance.reference_dossier} créée en brouillon.`);
      setReferenceDossier("");
      setObjetDossier("");

      setTimeout(() => {
        router.push("/ouverture_offre");
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Création impossible pour le moment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <TopHeader />
      <main className="min-h-[calc(100vh-2cm)] bg-[#f5f7fb] px-4 py-6 md:px-8">
        <div className="mx-auto max-w-3xl">
          <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.28)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#0e7f47]">
                  Création rapide
                </p>
                <h1 className="mt-2 text-3xl font-black text-slate-900">
                  Nouvelle séance
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Cette première version crée une séance en brouillon avant l&apos;enrichissement complet.
                </p>
              </div>

              <Link
                href="/ouverture_offre"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Retour au dashboard
              </Link>
            </div>

            {booting ? (
              <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-sm text-slate-500">
                Vérification de l&apos;accès en cours...
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="grid gap-5">
                  <label className="grid gap-2">
                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-600">
                      Référence dossier
                    </span>
                    <input
                      type="text"
                      value={referenceDossier}
                      onChange={(event) => setReferenceDossier(event.target.value)}
                      placeholder="Ex. DAO-003"
                      className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none ring-0 transition focus:border-[#0e7f47] focus:shadow-[0_0_0_4px_rgba(14,127,71,0.08)]"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-600">
                      Objet du dossier
                    </span>
                    <textarea
                      value={objetDossier}
                      onChange={(event) => setObjetDossier(event.target.value)}
                      placeholder="Décris brièvement l'objet concerné par l'ouverture."
                      rows={4}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-[#0e7f47] focus:shadow-[0_0_0_4px_rgba(14,127,71,0.08)]"
                    />
                  </label>
                </div>

                {error && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {successMessage}
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-2xl bg-[#0e7f47] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0b693a] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Création..." : "Créer en brouillon"}
                  </button>

                  <p className="text-xs text-slate-500">
                    Le secrétaire connecté sera associé automatiquement par le backend.
                  </p>
                </div>
              </form>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
