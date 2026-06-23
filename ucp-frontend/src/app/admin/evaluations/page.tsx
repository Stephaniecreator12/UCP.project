"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import StatutBadge from "../components/Statutbadge";
import {
  evaluationHeaderService,
  type EvaluationHeader,
  type StatutEvaluation,
} from "../../../services/evaluations/Index";

const STATUTS: { value: StatutEvaluation | ""; label: string }[] = [
  { value: "", label: "Tous les statuts" },
  { value: "EN_COURS", label: "En cours" },
  { value: "ELIMINE_PRELIMINAIRE", label: "Éliminé préliminaire" },
  { value: "ELIMINE_TECHNIQUE", label: "Éliminé technique" },
  { value: "CONSENSUS_REQUIS", label: "Consensus requis" },
  { value: "QUALIFIE_FINANCIER", label: "Qualifié financier" },
  { value: "FINALISE", label: "Finalisé" },
];

export default function EvaluationsListPage() {
  const [marcheFilter, setMarcheFilter] = useState("");
  const [statutFilter, setStatutFilter] = useState<StatutEvaluation | "">("");
  const [page, setPage] = useState(1);

  const [evaluations, setEvaluations] = useState<EvaluationHeader[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / 10)), [count]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    evaluationHeaderService
      .list({
        marche: marcheFilter ? Number(marcheFilter) : undefined,
        statut: statutFilter || undefined,
        page,
      })
      .then((data) => {
        if (cancelled) return;
        setEvaluations(data.results);
        setCount(data.count);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message ?? "Impossible de charger les évaluations.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [marcheFilter, statutFilter, page]);

  return (
    <div className="w-full min-h-screen bg-gray-50/60 pb-16 font-sans p-2.5">
      <div className="mx-auto px-4 mt-8">
        <div className="flex flex-col sm:flex-row w-full justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Évaluations des offres
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Examen préliminaire, notation technique, financier et décision
            </p>
          </div>
        </div>

        <div className="w-full bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Marché (référence interne) :
              </label>
              <input
                type="number"
                placeholder="ID du marché"
                value={marcheFilter}
                onChange={(e) => {
                  setPage(1);
                  setMarcheFilter(e.target.value);
                }}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 text-gray-800 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Statut :
              </label>
              <select
                value={statutFilter}
                onChange={(e) => {
                  setPage(1);
                  setStatutFilter(e.target.value as StatutEvaluation | "");
                }}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 text-gray-800 transition bg-white"
              >
                {STATUTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-8">
          {loading ? (
            <div className="text-gray-500 bg-white p-12 rounded-xl border border-gray-200 text-center shadow-sm">
              Chargement…
            </div>
          ) : evaluations.length === 0 ? (
            <div className="text-gray-500 bg-white p-12 rounded-xl border border-gray-200 text-center shadow-sm">
              <span className="text-3xl block mb-2">📋</span>
              <p className="font-medium">Aucune évaluation trouvée.</p>
            </div>
          ) : (
            evaluations.map((evaluation) => (
              <Link
                key={evaluation.id}
                href={`/evaluations/${evaluation.id}`}
                className="block border border-gray-200 border-l-4 border-l-green-600 p-5 rounded-xl shadow-sm bg-white hover:border-green-600/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-1.5">
                    <span className="text-xs font-mono bg-green-50 text-green-800 px-2 py-0.5 rounded-md font-semibold border border-green-100">
                      Marché #{evaluation.marche}
                      {evaluation.lot_numero ? ` · Lot ${evaluation.lot_numero}` : ""}
                    </span>
                    <p className="text-sm text-gray-500">
                      Soumissionnaire #{evaluation.soumissionnaire} · créé le{" "}
                      {new Date(evaluation.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <StatutBadge statut={evaluation.statut} />
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition shadow-2xs disabled:opacity-40 disabled:pointer-events-none"
          >
            ← Précédent
          </button>
          <span className="text-sm text-gray-600 font-semibold bg-gray-50 px-3 py-1.5 rounded-md border border-gray-100">
            Page {page} sur {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition shadow-2xs disabled:opacity-40 disabled:pointer-events-none"
          >
            Suivant →
          </button>
        </div>
      </div>
    </div>
  );
}