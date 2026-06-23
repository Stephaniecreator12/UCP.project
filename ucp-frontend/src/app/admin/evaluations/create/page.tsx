"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import SoumissionnairePicker from "../../components/Soumissionnairepicker";
import { evaluationHeaderService, type Soumissionnaire } from "../../../../services/evaluations/Index";

export default function NewEvaluationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [marcheId, setMarcheId] = useState(searchParams.get("marche") ?? "");
  const [lotNumero, setLotNumero] = useState("");
  const [soumissionnaire, setSoumissionnaire] = useState<Soumissionnaire | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!marcheId || !soumissionnaire) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await evaluationHeaderService.create({
        marche: Number(marcheId),
        soumissionnaire: soumissionnaire.id,
        lot_numero: lotNumero.trim() || undefined,
      });
      router.replace(`/admin/evaluations/${created.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la création de l'évaluation."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full min-h-screen bg-gray-50/60 pb-16 font-sans p-2.5">
      <div className="mx-auto px-4 mt-8 max-w-2xl">
        <Link
          href="/admin/evaluations"
          className="text-sm text-green-700 hover:text-green-900 font-medium inline-flex items-center gap-1 mb-4"
        >
          ← Retour à la liste des évaluations
        </Link>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-1">
          Nouvelle évaluation
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Évalue l'offre d'un soumissionnaire pour un marché déjà publié.
        </p>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Marché (AO) à évaluer :
            </label>
            <input
              type="number"
              placeholder="ID du marché, ex: 42"
              value={marcheId}
              onChange={(e) => setMarcheId(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 text-gray-800 transition"
            />
            <p className="text-xs text-gray-400 mt-1">
              Retrouve l'ID sur la fiche du marché, page « Marchés de l'UCP ».
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Lot (optionnel) :
            </label>
            <input
              type="text"
              placeholder="Numéro de lot si l'AO est découpé en lots"
              value={lotNumero}
              onChange={(e) => setLotNumero(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 text-gray-800 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Soumissionnaire à évaluer :
            </label>
            <SoumissionnairePicker value={soumissionnaire} onChange={setSoumissionnaire} />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !marcheId || !soumissionnaire}
              className="px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white font-medium text-sm rounded-lg shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Création…" : "Créer l'évaluation"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}