"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";
import { createContrat } from "@/services/contractualisation";
import { getSeances } from "@/services/ouvertureOffre";
import { fetchClassement, ClassementLigne } from "@/services/evaluationService";
import { SeanceOuverture } from "@/types/ouvertureOffre";
import TopHeader from "@/app/components/TopHeader";

export default function CreateContratPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingSeances, setLoadingSeances] = useState(true);
  const [loadingClassement, setLoadingClassement] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lists & Choices
  const [seances, setSeances] = useState<SeanceOuverture[]>([]);
  const [selectedSeanceId, setSelectedSeanceId] = useState<string>("");
  const [classementLines, setClassementLines] = useState<ClassementLigne[]>([]);
  const [selectedOffreId, setSelectedOffreId] = useState<string>("");

  useEffect(() => {
    loadSeances();
  }, []);

  const loadSeances = async () => {
    try {
      setLoadingSeances(true);
      setError(null);
      const data = await getSeances();
      // Only show validation completed/validee/etc or all seances that might be evaluated
      setSeances(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des séances"
      );
    } finally {
      setLoadingSeances(false);
    }
  };

  const handleSeanceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idStr = e.target.value;
    setSelectedSeanceId(idStr);
    setSelectedOffreId("");
    setClassementLines([]);

    if (!idStr) return;

    try {
      setLoadingClassement(true);
      setError(null);
      const classement = await fetchClassement(parseInt(idStr));
      if (classement && classement.lignes) {
        setClassementLines(classement.lignes);
        // Auto select rank 1
        const rank1 = classement.lignes.find((l) => l.rang === 1);
        if (rank1) {
          setSelectedOffreId(rank1.offre_id.toString());
        }
      } else {
        setError("Aucun classement disponible pour cette séance.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la récupération du classement de la séance."
      );
    } finally {
      setLoadingClassement(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedSeanceId || !selectedOffreId) return;

    try {
      setLoading(true);
      setError(null);
      const contract = await createContrat(
        parseInt(selectedSeanceId),
        parseInt(selectedOffreId)
      );
      router.push(`/personnel/contractualisation/${contract.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la création du contrat"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#f6faf8_0%,transparent_25%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] pb-12 text-slate-800 antialiased selection:bg-emerald-200">
      <TopHeader />

      <div className="zoom-content mx-auto mt-2 max-w-[1000px] px-4 pb-12 pt-6">
        {/* Header Block */}
        <div className="group relative flex w-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_8px_24px_rgb(0,0,0,0.035)] md:flex-row md:items-center mb-6">
          <div className="absolute right-0 top-0 -z-10 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 opacity-50 blur-3xl transition-transform duration-700 group-hover:scale-110" />

          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20">
                <ClipboardList className="h-4 w-4" />
              </div>
            </div>
            <div>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                UCP e-Procurement
              </span>
              <h1 className="mt-0.5 text-lg font-black tracking-tight text-slate-850">
                Créer un Nouveau Contrat (NOTI5)
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <button
              onClick={() => router.push("/personnel/contractualisation")}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard Contractualisation
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-800 mb-6 text-sm flex items-center gap-2 shadow-sm">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <div>{error}</div>
          </div>
        )}

        {/* Unified Selection Card */}
        <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md p-6">
          <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />

          {loadingSeances ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-sm font-semibold">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-555 mb-2" />
              Chargement des séances de décision...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Séance Selection Dropdown */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block mb-2">
                  1. Sélectionner la séance d&apos;ouverture / d&apos;évaluation
                </label>
                <select
                  value={selectedSeanceId}
                  onChange={handleSeanceChange}
                  className="w-full rounded-xl border border-slate-250 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition-all focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="">-- Choisissez une Séance d&apos;évaluation --</option>
                  {seances.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.reference_dossier}] {s.objet_dossier}
                    </option>
                  ))}
                </select>
              </div>

              {/* Classement & Offers selection */}
              {selectedSeanceId && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block mb-2">
                    2. Sélectionner l&apos;offre gagnante
                  </label>

                  {loadingClassement ? (
                    <div className="flex flex-col items-center justify-center py-6 text-slate-400 text-xs font-semibold">
                      <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mb-2" />
                      Récupération du classement et des soumissionnaires...
                    </div>
                  ) : classementLines.length === 0 ? (
                    <div className="text-xs text-amber-600 font-semibold italic bg-amber-50 rounded-xl p-3 border border-amber-100">
                      ⚠ Aucun classement disponible ou aucun soumissionnaire validé trouvé pour cette séance.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {classementLines.map((line) => {
                        const isSelected = selectedOffreId === line.offre_id.toString();
                        const isRank1 = line.rang === 1;

                        return (
                          <div
                            key={line.offre_id}
                            onClick={() => setSelectedOffreId(line.offre_id.toString())}
                            className={`group cursor-pointer relative flex flex-col justify-between items-start p-4 border rounded-2xl shadow-sm transition-all sm:flex-row sm:items-center ${
                              isSelected
                                ? "border-emerald-500 bg-emerald-50/40 shadow-md ring-2 ring-emerald-500/10"
                                : "border-slate-200 bg-white hover:border-slate-350 hover:bg-slate-50/30"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-black text-xs ${
                                  isRank1
                                    ? "bg-amber-100 text-amber-700 shadow-sm"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {line.rang ? `#${line.rang}` : "—"}
                              </div>
                              <div>
                                <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                                  {line.nom_soumissionnaire}
                                  {isRank1 && (
                                    <span className="inline-flex items-center gap-1 rounded bg-amber-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-sm">
                                      <Award className="h-3 w-3" /> Lauréat recommandé
                                    </span>
                                  )}
                                </h3>
                                <div className="text-[11px] font-semibold text-slate-550 mt-1">
                                  Score global :{" "}
                                  <strong className="text-slate-700">
                                    {line.score_total !== null
                                      ? `${line.score_total.toFixed(2)}/100`
                                      : "Non noté"}
                                  </strong>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 mt-3 sm:mt-0">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                                  line.est_conforme
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-slate-200 bg-slate-50 text-slate-500"
                                }`}
                              >
                                {line.est_conforme ? "Conforme" : "Non Conforme"}
                              </span>

                              <div
                                className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
                                  isSelected
                                    ? "border-emerald-600 bg-emerald-600 text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {isSelected && <CheckCircle2 className="h-4 w-4" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Action Button */}
              {selectedOffreId && (
                <div className="pt-6 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={handleCreate}
                    disabled={loading}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-750"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Création du contrat...
                      </>
                    ) : (
                      <>
                        Créer le contrat & passer au NOTI5
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// Simple fallback icon
function AlertCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
