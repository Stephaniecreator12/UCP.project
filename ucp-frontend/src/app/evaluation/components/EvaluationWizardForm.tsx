"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  ClipboardCheck,
  Clock,
  Coins,
  FileText,
  Loader,
  Lock,
  Save,
  Trophy,
  XCircle,
} from "lucide-react";
import {
  saveEvaluation,
  verifyEvaluateurPassword,
  type EvaluationDetail,
  type SaveEvaluationPayload,
} from "@/services/evaluationService";

const STEPS = [
  { id: 1, label: "Identification", icon: FileText },
  { id: 2, label: "Préliminaire", icon: ClipboardCheck },
  { id: 3, label: "Technique", icon: BarChart3 },
  { id: 4, label: "Financière", icon: Coins },
  { id: 5, label: "Score final", icon: Trophy },
  { id: 6, label: "Conclusion", icon: CheckCircle2 },
] as const;

const SEUIL_TECHNIQUE = 70;

const TECH_CRITERES = [
  { key: "note_conformite_technique", label: "Conformité spécifications techniques / OMS préqualifié", poids: 40 },
  { key: "note_delai_livraison", label: "Délai de livraison — Antananarivo + régions", poids: 25 },
  { key: "note_experience", label: "Expérience marchés similaires Fonds Mondial / UN", poids: 20 },
  { key: "note_sav_garantie", label: "SAV, garantie, formation, pharmacovigilance", poids: 15 },
] as const;

const EXAMEN_CRITERES = [
  { key: "offre_signee", label: "Offre signée par personne habilitée" },
  { key: "garantie_conforme", label: "Garantie de soumission conforme au DAO" },
  { key: "dossier_admin_complet", label: "Dossier administratif complet : NIF, STAT, RCS, Quitus fiscal" },
  { key: "validite_conforme", label: "Validité de l'offre conforme au DAO" },
  { key: "conditions_acceptees", label: "Acceptation des conditions du marché sans réserve" },
] as const;

type ExamenState = Record<(typeof EXAMEN_CRITERES)[number]["key"], boolean | null> & {
  commentaire: string;
};

type TechniqueState = Record<(typeof TECH_CRITERES)[number]["key"], number | null>;

function computeTechScore(technique: TechniqueState): number | null {
  const values = TECH_CRITERES.map((c) => technique[c.key]);
  if (values.some((v) => v === null || v === undefined)) return null;
  const score = TECH_CRITERES.reduce((sum, critere) => {
    const note = Number(technique[critere.key] || 0);
    return sum + (note / 5) * 100 * (critere.poids / 100);
  }, 0);
  return Math.round(score * 10) / 10;
}

function computeFinScore(montantFinal: number | null, moinsDisant: number | null): number | null {
  if (!montantFinal || !moinsDisant || montantFinal <= 0) return null;
  return Math.round((moinsDisant / montantFinal) * 1000) / 10;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 transition focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-50";

function WaitBanner({
  icon: Icon,
  title,
  message,
  avancement,
  section,
}: {
  icon: typeof Clock;
  title: string;
  message: string;
  avancement: EvaluationDetail["evaluateurs_avancement"];
  section: "examen" | "technique";
}) {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-amber-800/90">{message}</p>
        {avancement.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {avancement.map((ev) => {
              const done = section === "examen" ? ev.examen_termine : ev.technique_termine;
              return (
                <div
                  key={ev.nom}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                    done ? "bg-emerald-100/80 text-emerald-800" : "bg-white/70 text-slate-600"
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                  {ev.nom} — {done ? "terminé" : "en attente…"}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EvaluationWizardForm({
  detail,
  onSaved,
}: {
  detail: EvaluationDetail;
  onSaved: () => void;
}) {
  const seanceId = detail.offre_detail.seance_id;

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPassword, setModalPassword] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [pendingStep, setPendingStep] = useState<number | null>(null);

  const [examen, setExamen] = useState<ExamenState>({
    offre_signee: null,
    garantie_conforme: null,
    dossier_admin_complet: null,
    validite_conforme: null,
    conditions_acceptees: null,
    commentaire: "",
  });

  const [technique, setTechnique] = useState<TechniqueState>({
    note_conformite_technique: null,
    note_delai_livraison: null,
    note_experience: null,
    note_sav_garantie: null,
  });

  const [financiere, setFinanciere] = useState({
    montant_lu: "",
    corrections_arithmetiques: "",
    rabais_accordes: "",
  });

  const [conclusion, setConclusion] = useState({
    recommandation: "" as "" | "ATTRIBUER" | "REJETER" | "RELANCER",
    justification: "",
    noConflit: false,
    password: "",
  });

  useEffect(() => {
    const ex = detail.examen_preliminaire;
    if (ex) {
      setExamen({
        offre_signee: ex.offre_signee ?? null,
        garantie_conforme: ex.garantie_conforme ?? null,
        dossier_admin_complet: ex.dossier_admin_complet ?? null,
        validite_conforme: ex.validite_conforme ?? null,
        conditions_acceptees: ex.conditions_acceptees ?? null,
        commentaire: ex.commentaire || "",
      });
    }
    const tech = detail.evaluation_technique;
    if (tech) {
      setTechnique({
        note_conformite_technique: tech.note_conformite_technique ?? null,
        note_delai_livraison: tech.note_delai_livraison ?? null,
        note_experience: tech.note_experience ?? null,
        note_sav_garantie: tech.note_sav_garantie ?? null,
      });
    }
    const fin = detail.evaluation_financiere;
    if (fin) {
      setFinanciere({
        montant_lu: fin.montant_lu != null ? String(fin.montant_lu) : "",
        corrections_arithmetiques:
          fin.corrections_arithmetiques != null ? String(fin.corrections_arithmetiques) : "",
        rabais_accordes: fin.rabais_accordes != null ? String(fin.rabais_accordes) : "",
      });
    }
    const concl = detail.conclusion;
    if (concl) {
      setConclusion({
        recommandation: (concl.recommandation as typeof conclusion.recommandation) || "",
        justification: concl.justification || "",
        noConflit: concl.declaration_conflit === "OUI",
        password: "",
      });
    }
  }, [detail]);

  const examenAllAnswered = EXAMEN_CRITERES.every((c) => examen[c.key] !== null);
  const examenAnyNon = EXAMEN_CRITERES.some((c) => examen[c.key] === false);
  const examenConforme = examenAllAnswered && !examenAnyNon;
  const examenBlocked = examenAllAnswered && examenAnyNon;

  const techScore = computeTechScore(technique);
  const techQualifie = techScore != null && techScore >= SEUIL_TECHNIQUE;

  const montantFinal = useMemo(() => {
    const lu = parseFloat(financiere.montant_lu) || 0;
    const corr = parseFloat(financiere.corrections_arithmetiques) || 0;
    const rabais = parseFloat(financiere.rabais_accordes) || 0;
    const val = lu - corr - rabais;
    return val > 0 ? val : null;
  }, [financiere]);

  const moinsDisant = detail.moins_disant_calcule ? parseFloat(detail.moins_disant_calcule) : null;
  const finScore = computeFinScore(montantFinal, moinsDisant);
  const scoreTechPart = techScore != null ? Math.round(techScore * 0.6 * 10) / 10 : null;
  const scoreFinPart = finScore != null ? Math.round(finScore * 0.4 * 10) / 10 : null;
  const scoreFinal =
    scoreTechPart != null && scoreFinPart != null
      ? Math.round((scoreTechPart + scoreFinPart) * 10) / 10
      : null;

  const buildPayload = (includeConclusion = false): SaveEvaluationPayload => {
    const payload: SaveEvaluationPayload = {};
    if (step >= 2 || includeConclusion) {
      payload.examen = { ...examen };
    }
    if (step >= 3 || includeConclusion) {
      payload.technique = { ...technique };
    }
    if ((step >= 4 || includeConclusion) && detail.peut_saisir_financiere && financiere.montant_lu) {
      payload.financiere = {
        montant_lu: parseFloat(financiere.montant_lu),
        corrections_arithmetiques: parseFloat(financiere.corrections_arithmetiques) || 0,
        rabais_accordes: parseFloat(financiere.rabais_accordes) || 0,
      };
    }
    if (includeConclusion) {
      payload.conclusion = {
        recommandation: conclusion.recommandation || null,
        justification: conclusion.justification,
        declaration_conflit: conclusion.noConflit ? "OUI" : "NON",
        password: conclusion.password || undefined,
      };
    }
    return payload;
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await saveEvaluation(detail.offre, buildPayload(step === 6));
      setSuccess("Progression enregistrée.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!conclusion.recommandation) {
      setError("Choisissez une recommandation.");
      return;
    }
    if (!conclusion.noConflit) {
      setError("Cochez la déclaration de non-conflit d'intérêt.");
      return;
    }
    if (!conclusion.password.trim()) {
      setError("Saisissez votre mot de passe pour signer.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await saveEvaluation(detail.offre, buildPayload(true));
      setSuccess("Évaluation signée avec succès.");
      setTimeout(onSaved, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };

  const requestNext = (target: number) => {
    if (step === 2 && (!examenAllAnswered || examenBlocked)) return;
    if (step === 3 && (!techQualifie || !detail.peut_saisir_technique)) return;
    if (step === 4 && !detail.peut_saisir_financiere) return;
    setPendingStep(target);
    setModalPassword("");
    setModalError("");
    setModalOpen(true);
  };

  const confirmModal = async () => {
    if (!modalPassword.trim()) {
      setModalError("Saisissez votre mot de passe.");
      return;
    }
    setModalLoading(true);
    setModalError("");
    try {
      await verifyEvaluateurPassword(modalPassword, seanceId);
      await saveEvaluation(detail.offre, buildPayload(false));
      setModalOpen(false);
      if (pendingStep != null) setStep(pendingStep);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Mot de passe incorrect.");
    } finally {
      setModalLoading(false);
    }
  };

  const canGoNext = () => {
    if (step === 1) return true;
    if (step === 2) return examenConforme;
    if (step === 3) return techQualifie && detail.peut_saisir_technique;
    if (step === 4) return detail.peut_saisir_financiere && montantFinal != null && finScore != null;
    if (step === 5) return scoreFinal != null;
    return false;
  };

  const stepBlocked = (stepId: number) => {
    if (stepId >= 3 && examenBlocked) return true;
    if (stepId >= 4 && !detail.peut_saisir_technique) return true;
    if (stepId >= 5 && (!techQualifie || !detail.peut_saisir_financiere)) return true;
    return false;
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      {/* Stepper */}
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max items-center gap-1">
          {STEPS.map((item, idx) => {
            const blocked = stepBlocked(item.id);
            const done = step > item.id;
            const active = step === item.id;
            return (
              <div key={item.id} className="flex items-center">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition ${
                      blocked
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : done
                          ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                          : active
                            ? "border-emerald-700 bg-emerald-700 text-white"
                            : "border-slate-200 bg-white text-slate-400"
                    }`}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : item.id}
                  </div>
                  <span
                    className={`hidden text-[11px] font-semibold sm:inline ${
                      blocked
                        ? "text-rose-600"
                        : done
                          ? "text-emerald-700"
                          : active
                            ? "text-slate-900"
                            : "text-slate-400"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`mx-1 h-px w-4 sm:w-6 ${done ? "bg-emerald-400" : "bg-slate-200"}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      )}

      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400" />

        <div className="p-5 sm:p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <FileText className="h-5 w-5 text-emerald-600" />
                Identification de l&apos;offre
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["N° AO/DP", detail.offre_detail.reference_dossier],
                  ["Intitulé du marché", detail.offre_detail.objet_dossier],
                  ["Nom du soumissionnaire", detail.offre_detail.nom_soumissionnaire],
                  ["NIF / STAT", detail.offre_detail.nif_stat || "—"],
                  ["Lot n°", detail.offre_detail.lot_numero || "—"],
                  [
                    "Montant global",
                    `${Number(detail.offre_detail.montant_global).toLocaleString("fr-FR")} MGA`,
                  ],
                  ...detail.evaluateurs_seance.map(
                    (ev, i) => [`Évaluateur ${i + 1}`, ev.nom || ev.email] as const,
                  ),
                  ["Date d'évaluation", detail.date_evaluation || "—"],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {label}
                    </p>
                    <p className="mt-1 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
                      {val}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                Examen préliminaire
              </h2>
              <p className="text-xs text-slate-500">
                Si un critère = NON, l&apos;offre est non conforme et le passage aux étapes suivantes
                est bloqué.
              </p>
              <div className="space-y-2">
                {EXAMEN_CRITERES.map((critere) => (
                  <div
                    key={critere.key}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
                  >
                    <p className="min-w-0 flex-1 text-sm font-medium text-slate-800">
                      {critere.label}
                    </p>
                    <div className="flex shrink-0 gap-4">
                      {([true, false] as const).map((val) => (
                        <label
                          key={String(val)}
                          className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-slate-600"
                        >
                          <input
                            type="radio"
                            name={critere.key}
                            className="h-4 w-4 accent-emerald-600"
                            checked={examen[critere.key] === val}
                            onChange={() =>
                              setExamen((p) => ({ ...p, [critere.key]: val }))
                            }
                          />
                          {val ? "Oui" : "Non"}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Commentaire</span>
                <textarea
                  className={`${inputClass} mt-1 min-h-[72px] resize-y`}
                  value={examen.commentaire}
                  onChange={(e) => setExamen((p) => ({ ...p, commentaire: e.target.value }))}
                  placeholder="Commentaire général…"
                />
              </label>
              <div
                className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
                  !examenAllAnswered
                    ? "border-slate-200 bg-slate-50 text-slate-500"
                    : examenConforme
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-rose-200 bg-rose-50 text-rose-800"
                }`}
              >
                {!examenAllAnswered ? (
                  <>
                    <CircleDashed className="h-4 w-4" />
                    Statut : en attente de saisie
                  </>
                ) : examenConforme ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Statut : Conforme
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    Statut : Non conforme — passage bloqué
                  </>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
                Évaluation technique
              </h2>
              {!detail.peut_saisir_technique ? (
                <WaitBanner
                  icon={Clock}
                  title="En attente des autres évaluateurs"
                  message={detail.blocage_technique}
                  avancement={detail.evaluateurs_avancement}
                  section="examen"
                />
              ) : (
                <>
                  <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <span>Seuil éliminatoire :</span>
                    <strong className="text-slate-900">{SEUIL_TECHNIQUE} / 100</strong>
                  </div>
                  <div className="rounded-xl border border-slate-200">
                    <table className="w-full table-fixed text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          <th className="p-3">Critère</th>
                          <th className="p-3 text-center">Pond.</th>
                          <th className="p-3 text-center">Note /5</th>
                          <th className="p-3 text-center">Note /100</th>
                          <th className="p-3 text-center">Pondérée</th>
                        </tr>
                      </thead>
                      <tbody>
                        {TECH_CRITERES.map((critere) => {
                          const note = technique[critere.key];
                          const sur100 =
                            note != null ? Math.round((Number(note) / 5) * 100) : null;
                          const ponderee =
                            sur100 != null
                              ? Math.round(sur100 * (critere.poids / 100) * 10) / 10
                              : null;
                          return (
                            <tr key={critere.key} className="border-t border-slate-100">
                              <td className="p-3 font-medium text-slate-800 break-words">{critere.label}</td>
                              <td className="p-3 text-center text-slate-500">{critere.poids}%</td>
                              <td className="p-3 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={5}
                                  step={0.5}
                                  className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-sm"
                                  value={note ?? ""}
                                  onChange={(e) =>
                                    setTechnique((p) => ({
                                      ...p,
                                      [critere.key]: e.target.value
                                        ? parseFloat(e.target.value)
                                        : null,
                                    }))
                                  }
                                />
                              </td>
                              <td className="p-3 text-center font-medium">{sur100 ?? "—"}</td>
                              <td className="p-3 text-center font-medium">
                                {ponderee != null ? ponderee.toFixed(1) : "—"}
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="border-t border-slate-200 bg-slate-50 font-semibold">
                          <td className="p-3" colSpan={4}>
                            Total technique
                          </td>
                          <td className="p-3 text-center">
                            {techScore != null ? (
                              <span
                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                  techQualifie
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {techScore.toFixed(1)} / 100
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {techScore != null && (
                    <div
                      className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
                        techQualifie
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-rose-200 bg-rose-50 text-rose-800"
                      }`}
                    >
                      {techQualifie ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Qualifié pour ouverture financière
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4" />
                          Éliminé (score &lt; {SEUIL_TECHNIQUE})
                        </>
                      )}
                    </div>
                  )}
                  {detail.consensus_alerte && (
                    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>
                        Consensus recommandé — écart de {detail.consensus_ecart} pts entre
                        évaluateurs. Veuillez vous concerter.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Coins className="h-5 w-5 text-emerald-600" />
                Évaluation financière
              </h2>
              {!detail.peut_saisir_financiere ? (
                <WaitBanner
                  icon={Lock}
                  title="Double aveugle — section bloquée"
                  message={detail.blocage_financier}
                  avancement={detail.evaluateurs_avancement}
                  section="technique"
                />
              ) : (
                <div className="space-y-3">
                  {[
                    ["Montant lu de l'offre (MGA)", "montant_lu"],
                    ["Corrections arithmétiques (MGA)", "corrections_arithmetiques"],
                    ["Rabais accordés (MGA)", "rabais_accordes"],
                  ].map(([label, key]) => (
                    <div
                      key={key}
                      className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3"
                    >
                      <span className="text-sm text-slate-600">{label}</span>
                      <input
                        type="number"
                        className="w-44 rounded-xl border border-slate-200 px-3 py-2 text-right text-sm"
                        value={financiere[key as keyof typeof financiere]}
                        onChange={(e) =>
                          setFinanciere((p) => ({ ...p, [key]: e.target.value }))
                        }
                      />
                    </div>
                  ))}
                  <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
                    <span className="text-slate-600">Montant évalué final (MGA)</span>
                    <strong>{montantFinal ? montantFinal.toLocaleString("fr-FR") : "—"}</strong>
                  </div>
                  <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
                    <span className="text-slate-600">Offre la moins-disante (MGA)</span>
                    <strong>{moinsDisant ? moinsDisant.toLocaleString("fr-FR") : "—"}</strong>
                  </div>
                  <div className="flex justify-between rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-sm">
                    <span className="text-slate-600">Score financier</span>
                    <strong className="text-emerald-800">
                      {finScore != null ? `${finScore.toFixed(1)} / 100` : "—"}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Trophy className="h-5 w-5 text-emerald-600" />
                Score final
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-emerald-50 p-4 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Technique × 60%
                  </p>
                  <p className="mt-2 text-3xl font-bold text-emerald-700">
                    {scoreTechPart != null ? scoreTechPart.toFixed(1) : "—"}
                  </p>
                </div>
                <div className="rounded-2xl bg-sky-50 p-4 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Financière × 40%
                  </p>
                  <p className="mt-2 text-3xl font-bold text-sky-700">
                    {scoreFinPart != null ? scoreFinPart.toFixed(1) : "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Score total
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {scoreFinal != null ? `${scoreFinal.toFixed(1)}/100` : "—"}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Le classement par rang sera disponible une fois toutes les évaluations du DAO
                terminées.
              </p>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Conclusion et recommandation
              </h2>
              <div className="space-y-2">
                {[
                  { value: "ATTRIBUER", label: "Attribuer le marché" },
                  { value: "REJETER", label: "Rejeter l'offre" },
                  { value: "RELANCER", label: "Relancer l'appel d'offres" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                      conclusion.recommandation === opt.value
                        ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      className="accent-emerald-600"
                      checked={conclusion.recommandation === opt.value}
                      onChange={() =>
                        setConclusion((p) => ({
                          ...p,
                          recommandation: opt.value as typeof conclusion.recommandation,
                        }))
                      }
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Justification détaillée</span>
                <textarea
                  className={`${inputClass} mt-1 min-h-[100px] resize-y`}
                  value={conclusion.justification}
                  onChange={(e) =>
                    setConclusion((p) => ({ ...p, justification: e.target.value }))
                  }
                />
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-emerald-600"
                  checked={conclusion.noConflit}
                  onChange={(e) =>
                    setConclusion((p) => ({ ...p, noConflit: e.target.checked }))
                  }
                />
                <span>
                  Je déclare n&apos;avoir aucun lien avec ce soumissionnaire (déclaration de
                  non-conflit d&apos;intérêt)
                </span>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">
                  Signature électronique (mot de passe DAO)
                </span>
                <input
                  type="password"
                  className={`${inputClass} mt-1`}
                  value={conclusion.password}
                  onChange={(e) =>
                    setConclusion((p) => ({ ...p, password: e.target.value }))
                  }
                  placeholder="Mot de passe reçu par mail"
                />
              </label>
              {detail.conclusion?.signe_le && (
                <p className="text-sm font-medium text-emerald-700">
                  Signé le {new Date(detail.conclusion.signe_le).toLocaleString("fr-FR")}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Précédent
        </button>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
          >
            {saving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </button>
          {step < 6 ? (
            <button
              type="button"
              disabled={!canGoNext()}
              onClick={() => requestNext(step + 1)}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-40"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {saving ? <Loader className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Soumettre et retour liste
            </button>
          )}
        </div>
      </div>

      {/* Modal confirmation mdp */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Lock className="h-4 w-4 text-emerald-600" />
              Confirmation requise
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Saisissez votre mot de passe DAO pour passer à l&apos;étape suivante.
            </p>
            <input
              type="password"
              autoFocus
              className={`${inputClass} mt-4`}
              value={modalPassword}
              onChange={(e) => setModalPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void confirmModal()}
              placeholder="Mot de passe…"
            />
            {modalError && (
              <p className="mt-2 text-xs font-medium text-rose-600">{modalError}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={modalLoading}
                onClick={() => void confirmModal()}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {modalLoading ? <Loader className="h-4 w-4 animate-spin" /> : null}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
