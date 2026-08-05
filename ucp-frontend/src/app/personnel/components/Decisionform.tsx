"use client";

import { useState } from "react";

import {
  evaluationDecisionService,
  type EvaluationDecision,
  type RecommandationFinale,
  type StatutEvaluation,
} from "../../../services/evaluations/Index";

const RECOMMANDATIONS: { value: RecommandationFinale; label: string }[] = [
  { value: "ATTRIBUER", label: "Attribuer le marché" },
  { value: "REJETER", label: "Rejeter l'offre" },
  { value: "RELANCER", label: "Relancer l'appel d'offres" },
];

export default function DecisionForm({
  evaluationId,
  statut,
  decision,
  onSaved,
}: {
  evaluationId: number;
  statut: StatutEvaluation;
  decision: EvaluationDecision | null;
  onSaved: (decision: EvaluationDecision) => void;
}) {
  const [recommandation, setRecommandation] = useState<RecommandationFinale>("ATTRIBUER");
  const [justification, setJustification] = useState("");
  const [declarationConflit, setDeclarationConflit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (decision) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-3">
        <h3 className="text-lg font-bold text-gray-900">Décision</h3>
        <span className="inline-block text-xs font-bold bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1 rounded-full">
          {RECOMMANDATIONS.find((r) => r.value === decision.recommandation)?.label}
        </span>
        <p className="text-sm text-gray-700">{decision.justification}</p>
        <p className="text-xs text-gray-400">
          Décidé le {new Date(decision.decide_le).toLocaleString("fr-FR")} par{" "}
          {decision.decide_par_label || decision.decide_par_external_id}
        </p>
      </div>
    );
  }

  if (statut === "CONSENSUS_REQUIS") {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Décision</h3>
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-4">
          ⚠️ Conclusion impossible : un consensus est requis entre les évaluateurs
          (écart de score technique au-delà du seuil toléré).
        </div>
      </div>
    );
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      const result = await evaluationDecisionService.create({
        evaluation: evaluationId,
        recommandation,
        justification,
        declaration_absence_conflit_interet: declarationConflit,
      });
      onSaved(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement de la décision.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
      <h3 className="text-lg font-bold text-gray-900">Décision finale</h3>
      <p className="text-xs text-gray-500">
        Cette action est définitive : la décision ne pourra plus être modifiée une fois enregistrée.
      </p>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Recommandation :</label>
        <div className="flex gap-2 flex-wrap">
          {RECOMMANDATIONS.map((rec) => (
            <button
              key={rec.value}
              type="button"
              onClick={() => setRecommandation(rec.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                recommandation === rec.value
                  ? "bg-green-700 text-white border-green-700"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {rec.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Justification :</label>
        <textarea
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 text-gray-800 transition"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={declarationConflit}
          onChange={(e) => setDeclarationConflit(e.target.checked)}
          className="rounded border-gray-300 text-green-700 focus:ring-green-600"
        />
        Le comité déclare n&apos;avoir aucun lien avec le soumissionnaire.
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !justification.trim()}
          className="px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white font-medium text-sm rounded-lg shadow-sm hover:shadow transition-all duration-200 disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer la décision"}
        </button>
      </div>
    </div>
  );
}