"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { createContrat } from "@/services/contractualisation";
import { fetchClassement } from "@/services/evaluationService";
import TopHeader from "@/app/components/TopHeader";

function CreateContratPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const seanceIdStr = searchParams.get("seance_id");
    const offreIdStr = searchParams.get("offre_id");

    if (!seanceIdStr) {
      setError("Aucune séance spécifiée pour la création du contrat.");
      return;
    }

    const initContract = async () => {
      try {
        const seanceId = parseInt(seanceIdStr);
        let offreId = offreIdStr ? parseInt(offreIdStr) : null;

        // If no offre_id provided, fetch the ranking to find Rank 1
        if (!offreId) {
          const classement = await fetchClassement(seanceId);
          if (!classement || !classement.lignes) {
            throw new Error(
              "Impossible de récupérer le classement de la séance.",
            );
          }
          const rank1 = classement.lignes.find((l) => l.rang === 1);
          if (!rank1) {
            throw new Error(
              "Aucune offre classée Rang 1 trouvée pour cette séance.",
            );
          }
          offreId = rank1.offre_id;
        }

        // Auto-create or get existing draft contract
        const contract = await createContrat(seanceId, offreId);

        // Redirect immediately to the actual contract edit form
        router.replace(`/personnel/contractualisation/${contract.id}`);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors de l'initialisation du contrat",
        );
      }
    };

    initContract();
  }, [searchParams, router]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#f6faf8_0%,transparent_25%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] pb-12 text-slate-800 antialiased selection:bg-emerald-200">
      <TopHeader />
      <div className="zoom-content mx-auto mt-12 max-w-[800px] px-4">
        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-white p-8 shadow-lg">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <AlertCircle className="h-8 w-8" />
              <h1 className="text-xl font-black">Création impossible</h1>
            </div>
            <p className="text-slate-600 mb-6">{error}</p>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-slate-800 hover:-translate-y-0.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-emerald-100 opacity-75"></div>
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/20">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            </div>
            <h2 className="mt-8 text-lg font-black text-slate-800">
              Initialisation du dossier contractuel...
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Veuillez patienter pendant que nous préparons le formulaire NOTI5.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function CreateContratPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#f6faf8_0%,transparent_25%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] pb-12 text-slate-800 antialiased selection:bg-emerald-200">
          <div className="mx-auto mt-12 max-w-[800px] px-4 py-24 text-center">
            <div className="text-slate-500">Chargement...</div>
          </div>
        </main>
      }
    >
      <CreateContratPageContent />
    </Suspense>
  );
}
