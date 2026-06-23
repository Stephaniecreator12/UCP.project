"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import TopHeader from "@/app/components/TopHeader";
import StatutBadge from "../components/Statutbadge";
import {
  evaluationHeaderService,
  type EvaluationHeader,
  type StatutEvaluation,
} from "../../../services/evaluations/Index";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
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
    const router = useRouter();
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
  const handleAdminPageRedirection = () => {
       router.replace("/admin");
    }

  return (
  <div className="w-full min-h-screen bg-gray-50/60 pb-16 font-sans p-2.5 sm:p-4">
    <TopHeader />
    
    {/* Conteneur principal avec max-width pour éviter l'étirement sur les très grands écrans */}
    <div className=" mx-auto mt-6 sm:mt-8">
      
      {/* Bouton de retour amélioré (suppression du w-[17%] pour un w-fit) */}
      <button
        type="button"
        onClick={() => handleAdminPageRedirection()}
        className="group inline-flex w-fit items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all duration-200 mb-6 sm:mb-8"
      >
        <ArrowLeft size={16} className="text-slate-400 group-hover:-translate-x-1 transition-transform duration-200" />
        Retour vers l'administration
      </button>

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row w-full justify-between items-start sm:items-center gap-5 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Évaluations des offres
          </h1>
          <p className="text-sm text-gray-500 mt-1.5">
            Examen préliminaire, notation technique, financière et décision.
          </p>
        </div>
        <Link
          href="evaluations/create/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white font-medium text-sm rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 w-full sm:w-auto justify-center"
        >
          <span>➕</span> Nouvelle évaluation
        </Link>
      </div>

      {/* Section des filtres (passage en Flexbox pour mieux gérer 2 éléments) */}
      <div className="w-full bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
              Marché (référence)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                #
              </span>
              <input
                type="number"
                placeholder="ID du marché"
                value={marcheFilter}
                onChange={(e) => {
                  setPage(1);
                  setMarcheFilter(e.target.value);
                }}
                className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 text-gray-800 transition"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
              Statut
            </label>
            <select
              value={statutFilter}
              onChange={(e) => {
                setPage(1);
                setStatutFilter(e.target.value as StatutEvaluation | "");
              }}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 text-gray-800 transition bg-white appearance-none cursor-pointer"
            >
              <option value="">Tous les statuts</option>
              {STATUTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Gestion des erreurs */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl p-4 mb-8 flex items-center gap-3">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Liste des évaluations */}
      <div className="space-y-4 mb-8">
        {loading ? (
          <div className="bg-white p-12 rounded-xl border border-gray-100 text-center shadow-sm flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium text-sm animate-pulse">Chargement des évaluations...</p>
          </div>
        ) : (evaluations ?? []).length === 0 ? (
          <div className="text-gray-500 bg-white p-12 rounded-xl border border-gray-200 text-center shadow-sm">
            <span className="text-4xl block mb-3 opacity-80">📋</span>
            <p className="font-semibold text-gray-700">Aucune évaluation trouvée.</p>
            <p className="text-sm mt-1">Essayez de modifier vos filtres de recherche.</p>
          </div>
        ) : (
          (evaluations ?? []).map((evaluation) => (
            <Link
              key={evaluation.id}
              href={`/evaluations/${evaluation.id}`}
              className="block border border-gray-200 border-l-4 border-l-green-600 p-5 rounded-xl shadow-sm bg-white hover:border-green-600/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono bg-green-50 text-green-800 px-2.5 py-1 rounded-md font-bold border border-green-100">
                      Marché #{evaluation.marche}
                    </span>
                    {evaluation.lot_numero && (
                      <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md border border-gray-200">
                        Lot {evaluation.lot_numero}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5">
                    <span className="font-medium text-gray-700">Soumissionnaire #{evaluation.soumissionnaire}</span>
                    <span className="text-gray-300">•</span>
                    Créé le {new Date(evaluation.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <StatutBadge statut={evaluation.statut} />
                  <span className="text-gray-300 group-hover:text-green-600 transition-colors hidden sm:block">
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          ← <span className="hidden sm:inline">Précédent</span>
        </button>
        
        <span className="text-sm text-gray-600 font-semibold bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
          Page {page} <span className="text-gray-400 font-normal mx-1">sur</span> {totalPages}
        </span>
        
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span className="hidden sm:inline">Suivant</span> →
        </button>
      </div>
      
    </div>
  </div>
);
}