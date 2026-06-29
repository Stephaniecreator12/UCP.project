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

const STEP_THEMES: Record<
  number,
  { gradient: string; border: string; iconBg: string; accent: string }
> = {
  1: {
    gradient: "from-emerald-50 via-white to-teal-50",
    border: "border-emerald-100",
    iconBg: "bg-emerald-600/10 text-emerald-700",
    accent: "text-emerald-700",
  },
  2: {
    gradient: "from-blue-50 via-white to-sky-50",
    border: "border-blue-100",
    iconBg: "bg-blue-600/10 text-blue-700",
    accent: "text-blue-700",
  },
  3: {
    gradient: "from-violet-50 via-white to-purple-50",
    border: "border-violet-100",
    iconBg: "bg-violet-600/10 text-violet-700",
    accent: "text-violet-700",
  },
  4: {
    gradient: "from-amber-50 via-white to-orange-50",
    border: "border-amber-100",
    iconBg: "bg-amber-600/10 text-amber-700",
    accent: "text-amber-700",
  },
  5: {
    gradient: "from-teal-50 via-white to-emerald-50",
    border: "border-teal-100",
    iconBg: "bg-teal-600/10 text-teal-700",
    accent: "text-teal-700",
  },
  6: {
    gradient: "from-emerald-50 via-white to-green-50",
    border: "border-emerald-100",
    iconBg: "bg-emerald-600/10 text-emerald-700",
    accent: "text-emerald-700",
  },
};

const SEUIL_TECHNIQUE = 70;

const TECH_CRITERES = [
  {
    key: "note_conformite_technique",
    label: "Conformité spécifications techniques / OMS préqualifié",
    poids: 40,
  },
  {
    key: "note_delai_livraison",
    label: "Délai de livraison — Antananarivo + régions",
    poids: 25,
  },
  {
    key: "note_experience",
    label: "Expérience marchés similaires Fonds Mondial / UN",
    poids: 20,
  },
  {
    key: "note_sav_garantie",
    label: "SAV, garantie, formation, pharmacovigilance",
    poids: 15,
  },
] as const;

const EXAMEN_CRITERES = [
  { key: "offre_signee", label: "Offre signée par personne habilitée" },
  { key: "garantie_conforme", label: "Garantie de soumission conforme au DAO" },
  {
    key: "dossier_admin_complet",
    label: "Dossier administratif complet : NIF, STAT, RCS, Quitus fiscal",
  },
  { key: "validite_conforme", label: "Validité de l'offre conforme au DAO" },
  {
    key: "conditions_acceptees",
    label: "Acceptation des conditions du marché sans réserve",
  },
] as const;

type ExamenState = Record<
  (typeof EXAMEN_CRITERES)[number]["key"],
  boolean | null
> & {
  commentaire: string;
};

type TechniqueState = Record<
  (typeof TECH_CRITERES)[number]["key"],
  number | null
>;

function computeTechScore(technique: TechniqueState): number | null {
  const values = TECH_CRITERES.map((c) => technique[c.key]);
  if (values.some((v) => v === null || v === undefined)) return null;
  const score = TECH_CRITERES.reduce((sum, critere) => {
    const note = Number(technique[critere.key] || 0);
    return sum + (note / 5) * 100 * (critere.poids / 100);
  }, 0);
  return Math.round(score * 10) / 10;
}

function computeFinScore(
  montantFinal: number | null,
  moinsDisant: number | null,
): number | null {
  if (!montantFinal || !moinsDisant || montantFinal <= 0) return null;
  return Math.round((moinsDisant / montantFinal) * 1000) / 10;
}

function isExamenCompleteOnServer(detail: EvaluationDetail): boolean {
  const ex = detail.examen_preliminaire;
  if (!ex) return false;
  return EXAMEN_CRITERES.every(
    (c) => ex[c.key as keyof typeof ex] !== null && ex[c.key as keyof typeof ex] !== undefined,
  );
}

function isTechniqueCompleteOnServer(detail: EvaluationDetail): boolean {
  const tech = detail.evaluation_technique;
  if (!tech) return false;
  return TECH_CRITERES.every((c) => tech[c.key] != null);
}

function isFinanciereCompleteOnServer(detail: EvaluationDetail): boolean {
  return detail.evaluation_financiere?.montant_lu != null;
}

function isStepComplete(stepId: number, detail: EvaluationDetail): boolean {
  switch (stepId) {
    case 1:
      return true;
    case 2:
      return isExamenCompleteOnServer(detail);
    case 3:
      return isTechniqueCompleteOnServer(detail);
    case 4:
      return isFinanciereCompleteOnServer(detail);
    case 5:
      return isTechniqueCompleteOnServer(detail) && isFinanciereCompleteOnServer(detail);
    case 6:
      return Boolean(detail.conclusion?.signe_le);
    default:
      return false;
  }
}

function computeInitialStep(detail: EvaluationDetail): number {
  if (detail.conclusion?.signe_le) return 6;
  if (isFinanciereCompleteOnServer(detail)) return 5;
  if (isTechniqueCompleteOnServer(detail)) return 4;
  if (isExamenCompleteOnServer(detail)) return 3;
  return 1;
}

function allExamenDone(
  avancement: EvaluationDetail["evaluateurs_avancement"],
): boolean {
  return avancement.length >= 3 && avancement.every((ev) => ev.examen_termine);
}

function allTechniqueDone(
  avancement: EvaluationDetail["evaluateurs_avancement"],
): boolean {
  return avancement.length >= 3 && avancement.every((ev) => ev.technique_termine);
}

const CONSENSUS_SEUIL = 15;

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 transition-all duration-200 hover:border-slate-300 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-50";

const cardHover =
  "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg";

function SectionHeader({
  stepId,
  title,
  subtitle,
}: {
  stepId: number;
  title: string;
  subtitle: string;
}) {
  const step = STEPS.find((s) => s.id === stepId);
  const theme = STEP_THEMES[stepId];
  const Icon = step?.icon ?? FileText;

  return (
    <div
      className={`mb-3 flex items-center gap-3 rounded-2xl border bg-gradient-to-br px-4 py-3 ${theme.gradient} ${theme.border}`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm ${theme.iconBg}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p
          className={`text-[10px] font-bold uppercase tracking-[0.18em] ${theme.accent}`}
        >
          Étape {stepId} / {STEPS.length} · {step?.label}
        </p>
        <h2 className="text-sm font-bold text-slate-900 sm:text-base">
          {title}
        </h2>
        <p className="truncate text-xs text-slate-600">{subtitle}</p>
      </div>
    </div>
  );
}

function SyncStatusBanner({
  tone,
  title,
  message,
  avancement,
  section,
}: {
  tone: "amber" | "emerald" | "rose";
  title: string;
  message: string;
  avancement?: EvaluationDetail["evaluateurs_avancement"];
  section?: "examen" | "technique";
}) {
  const styles = {
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    rose: "border-rose-200 bg-rose-50 text-rose-900",
  }[tone];
  const Icon =
    tone === "emerald" ? CheckCircle2 : tone === "rose" ? AlertTriangle : Clock;

  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${styles}`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p className="mt-1 opacity-90">{message}</p>
        {avancement && avancement.length > 0 && section && (
          <div className="mt-3 space-y-1.5">
            {avancement.map((ev) => {
              const done =
                section === "examen" ? ev.examen_termine : ev.technique_termine;
              return (
                <div
                  key={ev.nom}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium ${
                    done
                      ? "bg-emerald-100/80 text-emerald-800"
                      : "bg-white/70 text-slate-600"
                  }`}
                >
                  {done ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Clock className="h-3.5 w-3.5" />
                  )}
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
              const done =
                section === "examen" ? ev.examen_termine : ev.technique_termine;
              return (
                <div
                  key={ev.nom}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                    done
                      ? "bg-emerald-100/80 text-emerald-800"
                      : "bg-white/70 text-slate-600"
                  }`}
                >
                  {done ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Clock className="h-3.5 w-3.5" />
                  )}
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
  detail: initialDetail,
  onSaved,
}: {
  detail: EvaluationDetail;
  onSaved: () => void;
}) {
  const [detail, setDetail] = useState(initialDetail);

  useEffect(() => {
    setDetail(initialDetail);
    const initial = computeInitialStep(initialDetail);
    setStep(initial);
    setMaxStepReached(initial);
  }, [initialDetail]);

  const seanceId = detail.offre_detail.seance_id;

  const [step, setStep] = useState(() => computeInitialStep(initialDetail));
  const [maxStepReached, setMaxStepReached] = useState(() =>
    computeInitialStep(initialDetail),
  );
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
          fin.corrections_arithmetiques != null
            ? String(fin.corrections_arithmetiques)
            : "",
        rabais_accordes:
          fin.rabais_accordes != null ? String(fin.rabais_accordes) : "",
      });
    }
    const concl = detail.conclusion;
    if (concl) {
      setConclusion({
        recommandation:
          (concl.recommandation as typeof conclusion.recommandation) || "",
        justification: concl.justification || "",
        noConflit: concl.declaration_conflit === "OUI",
        password: "",
      });
    }
  }, [detail]);

  const examenAllAnswered = EXAMEN_CRITERES.every(
    (c) => examen[c.key] !== null,
  );
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

  const moinsDisant = useMemo(() => {
    if (detail.moins_disant_calcule) {
      return parseFloat(detail.moins_disant_calcule);
    }
    if (detail.evaluation_financiere?.offre_moins_disante != null) {
      return Number(detail.evaluation_financiere.offre_moins_disante);
    }
    const global = Number(detail.offre_detail.montant_global);
    return global > 0 ? global : null;
  }, [detail]);
  const finScore = computeFinScore(montantFinal, moinsDisant);
  const scoreTechPart =
    techScore != null ? Math.round(techScore * 0.6 * 10) / 10 : null;
  const scoreFinPart =
    finScore != null ? Math.round(finScore * 0.4 * 10) / 10 : null;
  const scoreFinal =
    scoreTechPart != null && scoreFinPart != null
      ? Math.round((scoreTechPart + scoreFinPart) * 10) / 10
      : null;
  const isReadOnly = step > 1 && isStepComplete(step, detail);
  const examenSaved = isExamenCompleteOnServer(detail);
  const techniqueSaved = isTechniqueCompleteOnServer(detail);

  const getSaveSuccessMessage = (updated: EvaluationDetail) => {
    if (step === 2) {
      if (!allExamenDone(updated.evaluateurs_avancement)) {
        return "Enregistré — en attente des autres évaluateurs.";
      }
      return "Enregistré — tous les évaluateurs ont terminé l'examen. Vous pouvez passer à l'étape technique.";
    }
    if (step === 3) {
      if (updated.consensus_alerte) {
        return `Enregistré — consensus requis (écart ${updated.consensus_ecart} pts). Ajustez vos notes.`;
      }
      if (!allTechniqueDone(updated.evaluateurs_avancement)) {
        return "Enregistré — en attente des autres évaluateurs.";
      }
      return "Enregistré — vous pouvez passer à l'évaluation financière.";
    }
    return "Progression enregistrée.";
  };

  const getStepSyncStatus = (): {
    tone: "amber" | "emerald" | "rose";
    title: string;
    message: string;
    section?: "examen" | "technique";
  } | null => {
    if (step === 2 && examenSaved) {
      if (!detail.peut_saisir_technique) {
        return {
          tone: "amber",
          title: "En attente des autres évaluateurs",
          message:
            "Votre examen est enregistré. Le bouton Suivant sera disponible lorsque les 3 évaluateurs auront terminé.",
          section: "examen",
        };
      }
      return {
        tone: "emerald",
        title: "Examen collectif terminé",
        message: "Tous les évaluateurs ont validé l'examen préliminaire. Vous pouvez continuer.",
        section: "examen",
      };
    }
    if (step === 3 && techniqueSaved) {
      if (detail.consensus_alerte) {
        return {
          tone: "rose",
          title: "Consensus requis",
          message: `Écart de ${detail.consensus_ecart} pts entre évaluateurs (seuil ${CONSENSUS_SEUIL} pts). Ajustez vos notes et enregistrez jusqu'à accord.`,
          section: "technique",
        };
      }
      if (!detail.peut_saisir_financiere) {
        return {
          tone: "amber",
          title: "En attente des autres évaluateurs",
          message:
            "Votre évaluation technique est enregistrée. Le bouton Suivant sera disponible lorsque les 3 évaluateurs auront terminé.",
          section: "technique",
        };
      }
      return {
        tone: "emerald",
        title: "Évaluation technique collective terminée",
        message: "Tous les évaluateurs sont prêts. Vous pouvez passer à l'évaluation financière.",
        section: "technique",
      };
    }
    return null;
  };

  const stepSyncStatus = getStepSyncStatus();

  const buildPayload = (includeConclusion = false): SaveEvaluationPayload => {
    const payload: SaveEvaluationPayload = {};
    if (step >= 2 || includeConclusion) {
      payload.examen = { ...examen };
    }
    if (step >= 3 || includeConclusion) {
      payload.technique = { ...technique };
    }
    if (
      (step >= 4 || includeConclusion) &&
      detail.peut_saisir_financiere &&
      financiere.montant_lu
    ) {
      payload.financiere = {
        montant_lu: parseFloat(financiere.montant_lu),
        corrections_arithmetiques:
          parseFloat(financiere.corrections_arithmetiques) || 0,
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
      const updatedDetail = await saveEvaluation(
        detail.offre,
        buildPayload(step === 6),
      );
      setDetail(updatedDetail);
      setSuccess(getSaveSuccessMessage(updatedDetail));
      const reached = computeInitialStep(updatedDetail);
      setMaxStepReached((prev) => Math.max(prev, reached));
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
      const updatedDetail = await saveEvaluation(
        detail.offre,
        buildPayload(true),
      );
      setDetail(updatedDetail);
      setSuccess("Évaluation signée avec succès.");
      setTimeout(onSaved, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };

  const advanceToStep = (target: number) => {
    setStep(target);
    setMaxStepReached((prev) => Math.max(prev, target));
  };

  const requestNext = (target: number) => {
    if (step === 2 && (!examenAllAnswered || examenBlocked)) return;
    if (step === 3 && (!techQualifie || !techniqueSaved)) return;
    if (step === 4 && !isFinanciereCompleteOnServer(detail) && !financiere.montant_lu)
      return;

    if (step === 1) {
      advanceToStep(target);
      return;
    }

    if (isStepComplete(step, detail)) {
      advanceToStep(target);
      return;
    }

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
      const updatedDetail = await saveEvaluation(
        detail.offre,
        buildPayload(false),
      );
      setDetail(updatedDetail);
      setModalOpen(false);
      if (pendingStep != null) advanceToStep(pendingStep);
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : "Mot de passe incorrect.",
      );
    } finally {
      setModalLoading(false);
    }
  };

  const canGoNext = () => {
    if (step === 1) return true;
    if (step === 2) {
      return (
        examenConforme &&
        examenSaved &&
        detail.peut_saisir_technique
      );
    }
    if (step === 3) {
      return (
        techQualifie &&
        techniqueSaved &&
        !detail.consensus_alerte &&
        detail.peut_saisir_financiere
      );
    }
    if (step === 4) {
      return (
        detail.peut_saisir_financiere &&
        montantFinal != null &&
        finScore != null &&
        isFinanciereCompleteOnServer(detail)
      );
    }
    if (step === 5) return scoreFinal != null;
    return false;
  };

  const canJumpToStep = (stepId: number) => {
    if (stepBlocked(stepId)) return false;
    if (isStepComplete(stepId, detail)) return true;
    if (stepId <= maxStepReached) return true;
    return stepId === step;
  };

  const stepBlocked = (stepId: number) => {
    if (stepId >= 3 && examenBlocked) return true;
    if (stepId >= 4 && !detail.peut_saisir_technique) return true;
    if (stepId >= 5 && (!techQualifie || !detail.peut_saisir_financiere))
      return true;
    return false;
  };

  return (
    <div className="w-full">
      {/* Navigation horizontale — pleine largeur */}
      <nav className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-0.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400" />
        <div className="grid grid-cols-3 gap-1.5 p-2 sm:grid-cols-6 sm:gap-2 sm:p-2.5">
          {STEPS.map((item) => {
            const blocked = stepBlocked(item.id);
            const done = isStepComplete(item.id, detail);
            const active = step === item.id;
            const Icon = item.icon;
            const theme = STEP_THEMES[item.id];
            const canJump = canJumpToStep(item.id);

            return (
              <button
                key={item.id}
                type="button"
                disabled={!canJump}
                onClick={() => canJump && setStep(item.id)}
                className={`group flex flex-col items-center gap-1 rounded-xl border px-2 py-2 text-center transition-all duration-200 sm:flex-row sm:gap-2 sm:px-3 sm:py-2.5 sm:text-left ${
                  active
                    ? `${theme.border} bg-gradient-to-r ${theme.gradient} shadow-md ring-1 ring-emerald-200/60`
                    : done
                      ? "border-slate-200 bg-slate-100/80 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-100 hover:shadow-md"
                      : blocked
                        ? "cursor-not-allowed border-rose-100 bg-rose-50/40 opacity-60"
                        : canJump
                          ? "border-slate-100 bg-slate-50/70 hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md"
                          : "border-slate-100 bg-slate-50/50 opacity-50"
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110 sm:h-8 sm:w-8 ${
                    active || done
                      ? theme.iconBg
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {done && !active ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Icon className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-[10px] font-bold sm:text-xs ${
                      active
                        ? "text-slate-900"
                        : done
                          ? "text-emerald-800"
                          : blocked
                            ? "text-rose-700"
                            : "text-slate-500"
                    }`}
                  >
                    {item.label}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="space-y-3">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-800">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
            {success}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)]">
          <div className="h-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400" />

          <div className={`p-4 sm:p-5 lg:p-6 ${isReadOnly ? "opacity-75" : ""}`}>
            {isReadOnly && (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600">
                <Lock className="h-4 w-4 shrink-0" />
                Étape verrouillée — consultation seule
              </div>
            )}
            {stepSyncStatus && (
              <div className="mb-3">
                <SyncStatusBanner
                  tone={stepSyncStatus.tone}
                  title={stepSyncStatus.title}
                  message={stepSyncStatus.message}
                  avancement={detail.evaluateurs_avancement}
                  section={stepSyncStatus.section}
                />
              </div>
            )}
            <fieldset disabled={isReadOnly} className={isReadOnly ? "pointer-events-none" : undefined}>
            {step === 1 && (
              <div className="space-y-3">
                <SectionHeader
                  stepId={1}
                  title="Identification de l'offre"
                  subtitle="Informations clés du soumissionnaire et du DAO."
                />
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {[
                    ["N° AO/DP", detail.offre_detail.reference_dossier],
                    ["Intitulé du marché", detail.offre_detail.objet_dossier],
                    [
                      "Nom du soumissionnaire",
                      detail.offre_detail.nom_soumissionnaire,
                    ],
                    ["NIF / STAT", detail.offre_detail.nif_stat || "—"],
                    ["Lot n°", detail.offre_detail.lot_numero || "—"],
                    [
                      "Montant global",
                      `${Number(detail.offre_detail.montant_global).toLocaleString("fr-FR")} MGA`,
                    ],
                    ...detail.evaluateurs_seance.map(
                      (ev, i) =>
                        [`Évaluateur ${i + 1}`, ev.nom || ev.email] as const,
                    ),
                    ["Date d'évaluation", detail.date_evaluation || "—"],
                  ].map(([label, val]) => (
                    <div
                      key={label}
                      className={`rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3.5 shadow-sm hover:border-emerald-300 ${cardHover}`}
                    >
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-600/80">
                        {label}
                      </p>
                      <p className="mt-1.5 text-sm font-bold leading-snug text-slate-900">
                        {val}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <SectionHeader
                  stepId={2}
                  title="Examen préliminaire"
                  subtitle="Un « Non » bloque la suite de l'évaluation."
                />
                <div className="grid gap-2.5 lg:grid-cols-2 xl:grid-cols-3">
                  {EXAMEN_CRITERES.map((critere) => (
                    <div
                      key={critere.key}
                      className={`flex flex-col justify-between gap-3 rounded-xl border border-slate-100 bg-gradient-to-br from-white to-blue-50/30 p-3.5 shadow-sm hover:border-blue-300 sm:flex-row sm:items-center ${cardHover}`}
                    >
                      <p className="min-w-0 flex-1 text-xs font-medium text-slate-800 sm:text-sm">
                        {critere.label}
                      </p>
                      <div className="flex shrink-0 gap-3">
                        {([true, false] as const).map((val) => (
                          <label
                            key={String(val)}
                            className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-slate-600 transition-all duration-200 hover:bg-white hover:shadow-sm"
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
                  <span className="text-xs font-semibold text-slate-600">
                    Commentaire
                  </span>
                  <textarea
                    className={`${inputClass} mt-1 min-h-[48px] resize-y`}
                    value={examen.commentaire}
                    onChange={(e) =>
                      setExamen((p) => ({ ...p, commentaire: e.target.value }))
                    }
                    placeholder="Notes…"
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
                      En attente…
                    </>
                  ) : examenConforme ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Conforme
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      Non conforme — passage bloqué
                    </>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <SectionHeader
                  stepId={3}
                  title="Évaluation technique"
                  subtitle="Notation sur 4 critères — seuil éliminatoire 70/100."
                />
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
                    <div className="overflow-hidden rounded-xl border border-violet-100 shadow-sm">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gradient-to-r from-violet-50 to-purple-50 text-left text-[10px] font-bold uppercase tracking-wider text-violet-800">
                            <th className="p-2.5 sm:p-3">Critère</th>
                            <th className="p-2.5 text-center sm:p-3">Pond.</th>
                            <th className="p-2.5 text-center sm:p-3">
                              Note /5
                            </th>
                            <th className="p-2.5 text-center sm:p-3">/100</th>
                            <th className="p-2.5 text-center sm:p-3">
                              Pondérée
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {TECH_CRITERES.map((critere, idx) => {
                            const note = technique[critere.key];
                            const sur100 =
                              note != null
                                ? Math.round((Number(note) / 5) * 100)
                                : null;
                            const ponderee =
                              sur100 != null
                                ? Math.round(
                                    sur100 * (critere.poids / 100) * 10,
                                  ) / 10
                                : null;
                            return (
                              <tr
                                key={critere.key}
                                className={`border-t border-slate-100 transition-colors duration-200 hover:bg-violet-50/40 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}
                              >
                                <td className="p-2.5 text-xs font-medium leading-tight text-slate-800 break-words sm:p-3">
                                  {critere.label}
                                </td>
                                <td className="p-2.5 text-center text-xs text-slate-500 sm:p-3">
                                  {critere.poids}%
                                </td>
                                <td className="p-2.5 text-center sm:p-3">
                                  <input
                                    type="number"
                                    min={0}
                                    max={5}
                                    step={0.5}
                                    className="w-14 rounded-lg border border-slate-200 px-2 py-1 text-center text-xs font-semibold transition-all duration-200 hover:border-purple-300 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-50"
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
                                <td className="p-2.5 text-center text-xs font-semibold sm:p-3">
                                  {sur100 ?? "—"}
                                </td>
                                <td className="p-2.5 text-center text-xs font-semibold text-purple-700 sm:p-3">
                                  {ponderee != null ? ponderee.toFixed(1) : "—"}
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="border-t-2 border-slate-200 bg-gradient-to-r from-slate-100 to-slate-50 text-sm font-bold">
                            <td
                              className="p-2.5 text-slate-900 sm:p-3"
                              colSpan={4}
                            >
                              Total technique
                            </td>
                            <td className="p-2.5 text-center sm:p-3">
                              {techScore != null ? (
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                                    techQualifie
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-rose-100 text-rose-800"
                                  }`}
                                >
                                  {techScore.toFixed(1)}
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
                  </>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3">
                <SectionHeader
                  stepId={4}
                  title="Évaluation financière"
                  subtitle="Montant et score financier automatique."
                />
                {!detail.peut_saisir_financiere ? (
                  <WaitBanner
                    icon={Lock}
                    title="Double aveugle — section bloquée"
                    message={detail.blocage_financier}
                    avancement={detail.evaluateurs_avancement}
                    section="technique"
                  />
                ) : (
                  <>
                    <p className="text-xs text-slate-500">
                      Les montants et le score financier se calculent automatiquement à la saisie.
                    </p>
                    <div className="grid gap-2.5 lg:grid-cols-3">
                      {([
                        ["Montant lu (MGA)", "montant_lu", Coins],
                        [
                          "Corrections (MGA)",
                          "corrections_arithmetiques",
                          BarChart3,
                        ],
                        ["Rabais (MGA)", "rabais_accordes", Trophy],
                      ] as const).map(([label, key, Icon]) => (
                        <div
                          key={key}
                          className={`rounded-xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/40 p-3.5 shadow-sm hover:border-amber-300 ${cardHover}`}
                        >
                          <label className="block">
                            <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-800">
                              <Icon className="h-4 w-4" />
                              {label}
                            </span>
                            <input
                              type="number"
                              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-right text-sm font-semibold text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-50"
                              value={financiere[key as keyof typeof financiere]}
                              onChange={(e) =>
                                setFinanciere((p) => ({
                                  ...p,
                                  [key]: e.target.value,
                                }))
                              }
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-2.5 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-3">
                        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Montant final
                        </p>
                        <p className="text-lg font-bold text-slate-900">
                          {montantFinal
                            ? montantFinal.toLocaleString("fr-FR")
                            : "—"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-3">
                        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Offre moins-disante
                        </p>
                        <p className="text-lg font-bold text-slate-900">
                          {moinsDisant
                            ? moinsDisant.toLocaleString("fr-FR")
                            : "—"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-3">
                        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                          Score financier
                        </p>
                        <p className="text-2xl font-bold text-emerald-900">
                          {finScore != null
                            ? `${finScore.toFixed(1)} / 100`
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {step === 5 && (
              <div className="space-y-3">
                <SectionHeader
                  stepId={5}
                  title="Score final"
                  subtitle="60 % technique + 40 % financière."
                />
                <div className="grid gap-2.5 lg:grid-cols-3">
                  <div
                    className={`rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 text-center shadow-sm hover:border-emerald-300 ${cardHover}`}
                  >
                    <BarChart3 className="mx-auto h-5 w-5 text-emerald-600" />
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Technique × 60%
                    </p>
                    <p className="mt-1 text-3xl font-bold text-emerald-700">
                      {scoreTechPart != null ? scoreTechPart.toFixed(1) : "—"}
                    </p>
                  </div>
                  <div
                    className={`rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50 p-4 text-center shadow-sm hover:border-sky-300 ${cardHover}`}
                  >
                    <Coins className="mx-auto h-5 w-5 text-sky-600" />
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Financière × 40%
                    </p>
                    <p className="mt-1 text-3xl font-bold text-sky-700">
                      {scoreFinPart != null ? scoreFinPart.toFixed(1) : "—"}
                    </p>
                  </div>
                  <div
                    className={`rounded-xl border-2 border-slate-300 bg-gradient-to-br from-white to-slate-50 p-4 text-center shadow-md hover:border-slate-400 ${cardHover}`}
                  >
                    <Trophy className="mx-auto h-5 w-5 text-slate-700" />
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Score total
                    </p>
                    <p className="mt-1 text-3xl font-bold text-slate-900">
                      {scoreFinal != null
                        ? `${scoreFinal.toFixed(1)}/100`
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-3">
                <SectionHeader
                  stepId={6}
                  title="Conclusion et recommandation"
                  subtitle="Recommandation finale et signature électronique."
                />
                <div className="grid gap-2.5 lg:grid-cols-3">
                  {[
                    { value: "ATTRIBUER", label: "Attribuer le marché" },
                    { value: "REJETER", label: "Rejeter l'offre" },
                    { value: "RELANCER", label: "Relancer l'appel d'offres" },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer flex-col gap-1.5 rounded-xl border px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${
                        conclusion.recommandation === opt.value
                          ? "border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-900 shadow-md ring-1 ring-emerald-200/60"
                          : `border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/30 hover:shadow-md ${cardHover}`
                      }`}
                    >
                      <input
                        type="radio"
                        className="accent-emerald-600"
                        checked={conclusion.recommandation === opt.value}
                        onChange={() =>
                          setConclusion((p) => ({
                            ...p,
                            recommandation:
                              opt.value as typeof conclusion.recommandation,
                          }))
                        }
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600">
                      Justification détaillée
                    </span>
                    <textarea
                      className={`${inputClass} mt-1 min-h-[72px] resize-y`}
                      value={conclusion.justification}
                      onChange={(e) =>
                        setConclusion((p) => ({
                          ...p,
                          justification: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50/30 lg:col-span-2">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 accent-emerald-600"
                      checked={conclusion.noConflit}
                      onChange={(e) =>
                        setConclusion((p) => ({
                          ...p,
                          noConflit: e.target.checked,
                        }))
                      }
                    />
                    <span>
                      Je déclare n&apos;avoir aucun lien avec ce soumissionnaire
                      (déclaration de non-conflit d&apos;intérêt)
                    </span>
                  </label>
                  <label className="block lg:col-span-2">
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-800">
                      <Lock className="h-4 w-4" />
                      Signature électronique (mot de passe DAO)
                    </span>
                    <input
                      type="password"
                      className={`${inputClass} mt-1`}
                      value={conclusion.password}
                      onChange={(e) =>
                        setConclusion((p) => ({
                          ...p,
                          password: e.target.value,
                        }))
                      }
                      placeholder="Mot de passe reçu par mail"
                    />
                  </label>
                  {detail.conclusion?.signe_le && (
                    <p className="text-sm font-medium text-emerald-700 lg:col-span-2">
                      Signé le{" "}
                      {new Date(detail.conclusion.signe_le).toLocaleString(
                        "fr-FR",
                      )}
                    </p>
                  )}
                </div>
              </div>
            )}
            </fieldset>
          </div>
        </div>

        {/* Navigation sticky en bas */}
        <div className="sticky bottom-0 z-30 mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-4px_24px_-8px_rgba(15,23,42,0.12)] backdrop-blur-md sm:px-5">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </button>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || isReadOnly}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-sm disabled:opacity-40"
            >
              {saving ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Enregistrer
            </button>
            {step < 6 ? (
              <button
                type="button"
                disabled={!canGoNext()}
                onClick={() => requestNext(step + 1)}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-2 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-md disabled:opacity-40"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-2 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-md disabled:opacity-60"
              >
                {saving ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Soumettre
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Modal confirmation mdp */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) =>
            e.target === e.currentTarget && setModalOpen(false)
          }
        >
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Lock className="h-4 w-4 text-emerald-600" />
              Confirmation requise
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Saisissez votre mot de passe DAO pour passer à l&apos;étape
              suivante.
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
              <p className="mt-2 text-xs font-medium text-rose-600">
                {modalError}
              </p>
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
                {modalLoading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : null}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
