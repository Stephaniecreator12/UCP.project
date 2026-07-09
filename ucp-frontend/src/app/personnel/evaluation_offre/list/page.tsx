"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader, CheckCircle2, Clock } from "lucide-react";
import TopHeader from "@/app/components/TopHeader";
import {
  fetchEvaluationList,
  type EvaluationList,
} from "@/services/evaluationService";
import { getToken } from "@/services/auth";

type ScreenState = "loading" | "ready" | "error";

const getStatusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case "EXAMEN":
      return "bg-blue-50 text-blue-900 border-blue-300";
    case "TECHNIQUE":
      return "bg-purple-50 text-purple-900 border-purple-300";
    case "FINANCIERE":
      return "bg-yellow-50 text-yellow-900 border-yellow-300";
    case "CONSOLIDEE":
      return "bg-green-50 text-green-900 border-green-300";
    default:
      return "bg-slate-50 text-slate-900 border-slate-300";
  }
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    EXAMEN: "Examen préliminaire",
    TECHNIQUE: "Évaluation technique",
    FINANCIERE: "Évaluation financière",
    CONSOLIDEE: "Consolidée",
  };
  return labels[status?.toUpperCase()] || status;
};

export default function EvaluationListPage() {
  const router = useRouter();
  const [state, setState] = useState<ScreenState>("loading");
  const [evaluations, setEvaluations] = useState<EvaluationList[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    loadEvaluations();
  }, []);

  const loadEvaluations = async () => {
    try {
      setState("loading");
      const data = await fetchEvaluationList();
      setEvaluations(data);
      setState("ready");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(msg);
      setState("error");
    }
  };

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopHeader />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader className="w-8 h-8 animate-spin text-emerald-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader />

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Mes évaluations assignées
          </h1>
          <p className="text-slate-600 mt-2">
            Consultez et complétez vos évaluations d'offres.
          </p>
        </div>

        {/* Error Display */}
        {state === "error" && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-red-700 text-sm">{error}</div>
          </div>
        )}

        {/* Evaluations List */}
        {evaluations.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-6 text-center">
            <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-yellow-800 font-semibold">
              Aucune évaluation assignée
            </p>
            <p className="text-yellow-700 text-sm mt-1">
              Vous recevrez une notification par email quand une offre vous sera
              assignée.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {evaluations.map((eval_item) => (
              <div
                key={eval_item.id}
                className="bg-white rounded-lg border border-slate-300 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-slate-900 text-lg">
                      {eval_item.reference_dossier}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {eval_item.objet_dossier}
                    </p>
                    <p className="text-sm text-slate-600">
                      Soumissionnaire:{" "}
                      <strong>{eval_item.nom_soumissionnaire}</strong>
                    </p>
                    <p className="text-xs text-slate-500">
                      Montant:{" "}
                      {parseFloat(eval_item.montant_global).toLocaleString(
                        "fr-FR",
                        {
                          style: "currency",
                          currency: "MGA",
                        },
                      )}
                    </p>

                    {/* Status Badge */}
                    <div className="mt-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(
                          eval_item.statut,
                        )}`}
                      >
                        {getStatusLabel(eval_item.statut)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      router.push(
                        `/personnel/evaluation/offres/${eval_item.offre}?seance=${eval_item.seance_id}`,
                      )
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold transition-colors whitespace-nowrap"
                  >
                    {eval_item.statut === "CONSOLIDEE" ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Voir le détail
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4" />
                        Continuer
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
