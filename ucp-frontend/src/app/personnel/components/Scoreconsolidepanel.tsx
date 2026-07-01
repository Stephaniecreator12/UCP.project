"use client";

import { useState } from "react";

import { scoreConsolideService, type ScoreConsolide } from "../../../services/evaluations/Index";

export default function ScoreConsolidePanel({
  score,
  onUpdated,
}: {
  score: ScoreConsolide | null;
  onUpdated: (score: ScoreConsolide) => void;
}) {
  const [recalculing, setRecalculing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!score) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Score consolidé</h3>
        <p className="text-sm text-gray-400 italic">
          Pas encore disponible : la saisie financière doit être complétée.
        </p>
      </div>
    );
  }

  async function handleConsolider() {
    setRecalculing(true);
    setError(null);
    try {
      const updated = await scoreConsolideService.consolider(score?score.id:-1);
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du recalcul.");
    } finally {
      setRecalculing(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Score consolidé</h3>
        {score.rang && (
          <span className="text-xs font-bold bg-green-50 text-green-800 border border-green-200 px-3 py-1 rounded-full">
            Rang #{score.rang}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-slate-50 border border-gray-100 rounded-xl p-3">
          <span className="text-xs text-gray-400 block mb-1">Technique</span>
          <span className="font-bold text-gray-900">{score.score_technique ?? "—"}</span>
        </div>
        <div className="bg-slate-50 border border-gray-100 rounded-xl p-3">
          <span className="text-xs text-gray-400 block mb-1">Financier</span>
          <span className="font-bold text-gray-900">{score.score_financier ?? "—"}</span>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <span className="text-xs text-green-700 block mb-1">Total</span>
          <span className="font-bold text-green-900">{score.score_total ?? "—"}</span>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Pondération : {score.poids_technique}% technique / {score.poids_financier}% financier
        {score.calcule_le &&
          ` · calculé le ${new Date(score.calcule_le).toLocaleString("fr-FR")}`}
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleConsolider}
          disabled={recalculing}
          className="px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white font-medium text-sm rounded-lg shadow-sm hover:shadow transition-all duration-200 disabled:opacity-60"
        >
          {recalculing ? "Calcul…" : "Recalculer le score et le classement"}
        </button>
      </div>
    </div>
  );
}