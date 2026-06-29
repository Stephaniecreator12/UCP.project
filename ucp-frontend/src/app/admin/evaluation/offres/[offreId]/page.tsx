"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader } from "lucide-react";
import EvaluatorHeader from "@/app/evaluation/components/EvaluatorHeader";
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
      <EvaluatorHeader seanceId={seanceId || undefined} />
      <main className="w-full px-5 py-4 sm:px-8 lg:px-12">
        {detail && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">
                {detail.offre_detail.nom_soumissionnaire}
              </h1>
              <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                {detail.offre_detail.reference_dossier} · Offre {detail.offre_detail.ordre_passage}
              </p>
            </div>
            <a
              href={backHref}
              className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100 hover:shadow-sm"
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
