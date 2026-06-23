"use client";

import { useState } from "react";

import NotesTechniquesGrid from "./Notestechniquesgrid";
import {
  evaluateurService,
  type CritereTechnique,
  type Evaluateur,
  type RoleEvaluateur,
} from "../../../services/evaluations/Index";

const ROLE_LABELS: Record<RoleEvaluateur, string> = {
  EVALUATEUR_1: "Évaluateur 1",
  EVALUATEUR_2: "Évaluateur 2",
  EVALUATEUR_3: "Évaluateur 3",
};

export default function EvaluateursPanel({
  evaluationId,
  evaluateurs,
  criteres,
  nombreValidateursRequis,
  onEvaluateurUpdated,
}: {
  evaluationId: number;
  evaluateurs: Evaluateur[];
  criteres: CritereTechnique[];
  nombreValidateursRequis: number;
  onEvaluateurUpdated: (evaluateur: Evaluateur) => void;
}) {
  const [expandedId, setExpandedId] = useState<number | null>(evaluateurs[0]?.id ?? null);
  const [validatingId, setValidatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nombreValides = evaluateurs.filter((e) => e.a_valide_score_technique).length;

  async function handleValider(evaluateur: Evaluateur) {
    setValidatingId(evaluateur.id);
    setError(null);
    try {
      const updated = await evaluateurService.validerScoreTechnique(evaluateur.id);
      onEvaluateurUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la validation.");
    } finally {
      setValidatingId(null);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Évaluation technique</h3>
        <span className="text-xs font-semibold bg-slate-50 border border-gray-200 text-gray-600 px-3 py-1 rounded-full">
          {nombreValides} / {nombreValidateursRequis} validations requises
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {evaluateurs.map((evaluateur) => {
          const isOpen = expandedId === evaluateur.id;
          return (
            <div
              key={evaluateur.id}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setExpandedId(isOpen ? null : evaluateur.id)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition text-left"
              >
                <div>
                  <span className="text-xs font-bold text-green-800 uppercase tracking-wide">
                    {ROLE_LABELS[evaluateur.role]}
                  </span>
                  <p className="text-sm font-semibold text-gray-800">{evaluateur.nom_affiche}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-900">
                    {evaluateur.score_technique_total ?? "—"} / 100
                  </span>
                  {evaluateur.a_valide_score_technique ? (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      ✓ Validé
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      En attente
                    </span>
                  )}
                  <span className="text-gray-400 text-xs">{isOpen ? "▲" : "▼"}</span>
                </div>
              </button>

              {isOpen && (
                <div className="p-4 space-y-4">
                  <NotesTechniquesGrid
                    evaluationId={evaluationId}
                    evaluateurId={evaluateur.id}
                    criteres={criteres}
                    locked={evaluateur.a_valide_score_technique}
                  />
                  <div className="flex justify-end pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      disabled={evaluateur.a_valide_score_technique || validatingId === evaluateur.id}
                      onClick={() => handleValider(evaluateur)}
                      className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold rounded-lg transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {validatingId === evaluateur.id
                        ? "Validation…"
                        : evaluateur.a_valide_score_technique
                        ? "Score déjà validé"
                        : "Valider le score technique"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}