"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader } from "lucide-react";
import TopHeader from "@/app/components/TopHeader";
import EvaluationWizardForm from "@/app/evaluation/components/EvaluationWizardForm";
import {
  fetchEvaluationDetail,
  type EvaluationDetail,
} from "@/services/evaluationService";
import { getToken } from "@/services/auth";

function EvaluationOffreFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f8faf9_0%,#f1f5f3_100%)]">
      <Loader className="h-8 w-8 animate-spin text-emerald-700" />
    </div>
  );
}

export default function EvaluationOffrePage() {
  return (
    <Suspense fallback={<EvaluationOffreFallback />}>
      <EvaluationOffreContent />
    </Suspense>
  );
}

function EvaluationOffreContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const offreId = Number(params.offreId);
  const seanceId = Number(searchParams.get("seance") || 0);

  const [detail, setDetail] = useState<EvaluationDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push(`/evaluation/login${seanceId ? `?seance=${seanceId}` : ""}`);
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offreId]);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      setDetail(await fetchEvaluationDetail(offreId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const backHref = seanceId
    ? `/evaluation/dao/${seanceId}/offres`
    : `/evaluation/dao/${detail?.offre_detail.seance_id || ""}/offres`;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8faf9_0%,#f1f5f3_100%)]">
      <TopHeader />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
        {detail && (
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Grille d&apos;évaluation
              </p>
              <h1 className="text-2xl font-bold text-slate-900">
                {detail.offre_detail.nom_soumissionnaire}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {detail.offre_detail.reference_dossier} · Offre {detail.offre_detail.ordre_passage}
              </p>
            </div>
            <a
              href={backHref}
              className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              ← Retour à la liste
            </a>
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader className="h-8 w-8 animate-spin text-emerald-700" />
          </div>
        )}
        {!loading && detail && (
          <EvaluationWizardForm detail={detail} onSaved={() => router.push(backHref)} />
        )}
      </main>
    </div>
  );
}
