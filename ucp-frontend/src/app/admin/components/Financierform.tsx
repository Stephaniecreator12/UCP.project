"use client";

import { useState } from "react";

import {
  evaluationFinanciereService,
  type EvaluationFinanciere,
} from "../../../services/evaluations/Index";

export default function FinancierForm({
  evaluationId,
  financiere,
  deverrouille,
  onSaved,
}: {
  evaluationId: number;
  financiere: EvaluationFinanciere | null;
  deverrouille: boolean;
  onSaved: (financiere: EvaluationFinanciere) => void;
}) {
  const [montantLu, setMontantLu] = useState(financiere?.montant_lu ?? "");
  const [corrections, setCorrections] = useState(financiere?.corrections_arithmetiques ?? "0");
  const [rabais, setRabais] = useState(financiere?.rabais_accordes ?? "0");
  const [montantMoinsDisant, setMontantMoinsDisant] = useState(
    financiere?.montant_moins_disant ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!deverrouille && !financiere) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Évaluation financière</h3>
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-4 flex items-center gap-2">
          🔒 Module verrouillé : le score technique doit d'abord être validé par le nombre
          requis d'évaluateurs (double aveugle).
        </div>
      </div>
    );
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        evaluation: evaluationId,
        montant_lu: montantLu,
        corrections_arithmetiques: corrections,
        rabais_accordes: rabais,
        montant_moins_disant: montantMoinsDisant,
      };
      const result = financiere
        ? await evaluationFinanciereService.update(financiere.id, payload)
        : await evaluationFinanciereService.create(payload);
      onSaved(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
      <h3 className="text-lg font-bold text-gray-900">Évaluation financière</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Montant lu de l'offre (MGA) :
          </label>
          <input
            type="number"
            value={montantLu}
            onChange={(e) => setMontantLu(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 text-gray-800 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Montant évalué le plus bas (MGA) :
          </label>
          <input
            type="number"
            value={montantMoinsDisant}
            onChange={(e) => setMontantMoinsDisant(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 text-gray-800 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Corrections arithmétiques (MGA) :
          </label>
          <input
            type="number"
            value={corrections}
            onChange={(e) => setCorrections(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 text-gray-800 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Rabais accordés (MGA) :
          </label>
          <input
            type="number"
            value={rabais}
            onChange={(e) => setRabais(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 text-gray-800 transition"
          />
        </div>
      </div>

      {financiere && (
        <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-gray-100 rounded-xl p-4 text-sm">
          <div>
            <span className="text-xs text-gray-400 block">Montant évalué final</span>
            <span className="font-bold text-gray-900">{financiere.montant_evalue_final} MGA</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block">Score financier</span>
            <span className="font-bold text-gray-900">{financiere.score_financier ?? "—"} / 100</span>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white font-medium text-sm rounded-lg shadow-sm hover:shadow transition-all duration-200 disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : financiere ? "Mettre à jour" : "Enregistrer l'offre financière"}
        </button>
      </div>
    </div>
  );
}