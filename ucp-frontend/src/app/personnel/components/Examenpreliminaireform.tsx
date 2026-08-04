"use client";

import { useState } from "react";

import {
  examenPreliminaireService,
  type ExamenPreliminaire,
} from "../../../services/evaluations/Index";

type CritereKey =
  | "offre_signee_personne_habilitee"
  | "garantie_soumission_conforme"
  | "dossier_administratif_complet"
  | "validite_offre_conforme"
  | "acceptation_conditions_sans_reserve";

const CRITERES: { key: CritereKey; label: string }[] = [
  { key: "offre_signee_personne_habilitee", label: "Offre signée par une personne habilitée" },
  { key: "garantie_soumission_conforme", label: "Garantie de soumission conforme" },
  {
    key: "dossier_administratif_complet",
    label: "Dossier administratif complet (NIF, STAT, RCS, Quitus fiscal)",
  },
  { key: "validite_offre_conforme", label: "Validité de l'offre conforme" },
  {
    key: "acceptation_conditions_sans_reserve",
    label: "Acceptation des conditions sans réserve",
  },
];

function TriStateToggle({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (v: boolean | null) => void;
}) {
  const options: { value: boolean | null; label: string; activeClasses: string }[] = [
    { value: true, label: "Oui", activeClasses: "bg-green-700 text-white border-green-700" },
    { value: false, label: "Non", activeClasses: "bg-red-600 text-white border-red-600" },
    { value: null, label: "—", activeClasses: "bg-gray-300 text-gray-800 border-gray-300" },
  ];
  return (
    <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-xs font-semibold transition ${
            value === opt.value
              ? opt.activeClasses
              : "bg-white text-gray-500 hover:bg-gray-50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function ExamenPreliminaireForm({
  evaluationId,
  examen,
  onSaved,
}: {
  evaluationId: number;
  examen: ExamenPreliminaire | null;
  onSaved: (examen: ExamenPreliminaire) => void;
}) {
  const [values, setValues] = useState<Record<CritereKey, boolean | null>>({
    offre_signee_personne_habilitee: examen?.offre_signee_personne_habilitee ?? null,
    garantie_soumission_conforme: examen?.garantie_soumission_conforme ?? null,
    dossier_administratif_complet: examen?.dossier_administratif_complet ?? null,
    validite_offre_conforme: examen?.validite_offre_conforme ?? null,
    acceptation_conditions_sans_reserve: examen?.acceptation_conditions_sans_reserve ?? null,
  });
  const [commentaire, setCommentaire] = useState(examen?.commentaire ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasNonConforme = Object.values(values).some((v) => v === false);

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      const payload = { ...values, evaluation: evaluationId, commentaire };
      const result = examen
        ? await examenPreliminaireService.update(examen.id, payload)
        : await examenPreliminaireService.create(payload);
      onSaved(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
      <h3 className="text-lg font-bold text-gray-900">Examen préliminaire</h3>
      <p className="text-xs text-gray-500">
        Un seul critère à « Non » élimine l&apos;offre et bloque le passage à l&apos;étape suivante.
      </p>

      {hasNonConforme && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          ⚠️ Au moins un critère est non conforme : cette offre sera éliminée à l&apos;examen préliminaire.
        </div>
      )}

      <div className="divide-y divide-gray-100">
        {CRITERES.map((critere) => (
          <div
            key={critere.key}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3"
          >
            <span className="text-sm text-gray-700">{critere.label}</span>
            <TriStateToggle
              value={values[critere.key]}
              onChange={(v) => setValues((prev) => ({ ...prev, [critere.key]: v }))}
            />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Commentaire :</label>
        <textarea
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 text-gray-800 transition"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white font-medium text-sm rounded-lg shadow-sm hover:shadow transition-all duration-200 disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer l'examen préliminaire"}
        </button>
      </div>
    </div>
  );
}