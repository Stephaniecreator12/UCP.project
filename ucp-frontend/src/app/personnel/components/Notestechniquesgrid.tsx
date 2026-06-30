"use client";

import { useEffect, useState } from "react";

import {
  evaluationTechniqueService,
  type CritereTechnique,
  type EvaluationTechnique,
} from "../../../services/evaluations/Index";

export default function NotesTechniquesGrid({
  evaluationId,
  evaluateurId,
  criteres,
  locked,
}: {
  evaluationId: number;
  evaluateurId: number;
  criteres: CritereTechnique[];
  locked: boolean;
}) {
  const [notes, setNotes] = useState<Record<number, EvaluationTechnique>>({});
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [savingCritere, setSavingCritere] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    evaluationTechniqueService.listByEvaluateur(evaluateurId).then((data) => {
      const byCritere: Record<number, EvaluationTechnique> = {};
      const draftValues: Record<number, string> = {};
      data.results.forEach((note) => {
        byCritere[note.critere] = note;
        draftValues[note.critere] = note.note_sur_5;
      });
      setNotes(byCritere);
      setDrafts(draftValues);
    });
  }, [evaluateurId]);

  async function handleSave(critere: CritereTechnique) {
    const raw = drafts[critere.id];
    const noteValue = Number(raw);
    if (Number.isNaN(noteValue) || noteValue < 0 || noteValue > 5) {
      setError(`Note invalide pour « ${critere.libelle} » (attendu entre 0 et 5).`);
      return;
    }
    setSavingCritere(critere.id);
    setError(null);
    try {
      const existing = notes[critere.id];
      const saved = await evaluationTechniqueService.upsert({
        id: existing?.id,
        evaluation: evaluationId,
        evaluateur: evaluateurId,
        critere: critere.id,
        note_sur_5: noteValue,
      });
      setNotes((prev) => ({ ...prev, [critere.id]: saved }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement de la note.");
    } finally {
      setSavingCritere(null);
    }
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-400 uppercase tracking-wider">
            <th className="py-1.5 font-semibold">Critère</th>
            <th className="py-1.5 font-semibold w-20">Poids</th>
            <th className="py-1.5 font-semibold w-28">Note / 5</th>
            <th className="py-1.5 font-semibold w-24"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {criteres.map((critere) => (
            <tr key={critere.id}>
              <td className="py-2 text-gray-700">{critere.libelle}</td>
              <td className="py-2 text-gray-500">{critere.ponderation}%</td>
              <td className="py-2">
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.25}
                  disabled={locked}
                  value={drafts[critere.id] ?? ""}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [critere.id]: e.target.value }))
                  }
                  className="w-20 p-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 text-gray-800 transition disabled:bg-gray-100 disabled:text-gray-400"
                />
              </td>
              <td className="py-2">
                <button
                  type="button"
                  disabled={locked || savingCritere === critere.id}
                  onClick={() => handleSave(critere)}
                  className="text-xs font-semibold text-green-700 hover:text-green-900 disabled:text-gray-300 disabled:cursor-not-allowed"
                >
                  {savingCritere === critere.id ? "…" : "Enregistrer"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}