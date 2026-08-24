"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader,
} from "lucide-react";
import {
  submitDecisionFinale,
  submitEvaluationFinanciere,
  submitEvaluationTechnique,
  submitExamenPreliminaire,
  fetchCriteres,
  type DecisionFinalePayload,
  type EvaluationFinancierePayload,
  type EvaluationTechniquePayload,
  type ExamenPreliminairePayload,
  type CritereTechniqueApi,
} from "@/services/evaluationService";
import { getToken } from "@/services/auth";

interface ExamenPreliminaireData {
  offre_signee?: boolean;
  garantie_conforme?: boolean;
  dossier_admin_complet?: boolean;
  validite_conforme?: boolean;
  conditions_acceptees?: boolean;
  commentaire?: string;
  comment_offre_signee?: string;
  comment_garantie_conforme?: string;
  comment_dossier_admin_complet?: string;
  comment_validite_conforme?: string;
  comment_conditions_acceptees?: string;
}

interface EvaluationTechniqueData {
  notes?: Record<number, number>;
}

interface EvaluationFinanciereData {
  montant_lu?: number;
  corrections_arithmetiques?: number;
  rabais_accordes?: number;
  offre_moins_disante?: number;
}

interface DecisionFinaleData {
  recommandation?: "ATTRIBUER" | "REJETER" | "RELANCER";
  justification?: string;
  declaration_conflit?: boolean;
}

interface OffreDetail {
  id: number;
  reference_dossier: string;
  objet_dossier: string;
  nom_soumissionnaire: string;
  montant_global: string;
  nif_stat?: string;
  examen_preliminaire?: ExamenPreliminaireData;
  evaluation_technique?: EvaluationTechniqueData;
  evaluation_financiere?: EvaluationFinanciereData;
  decision_finale?: DecisionFinaleData;
  peut_saisir_financiere?: boolean;
  blocage_financier?: string;
}

type ExamenStep = {
  offre_signee: boolean | null;
  garantie_conforme: boolean | null;
  dossier_admin_complet: boolean | null;
  validite_conforme: boolean | null;
  conditions_acceptees: boolean | null;
  commentaire: string;
  comment_offre_signee?: string;
  comment_garantie_conforme?: string;
  comment_dossier_admin_complet?: string;
  comment_validite_conforme?: string;
  comment_conditions_acceptees?: string;
  completed?: boolean;
};

type TechniqueStep = {
  notes: Record<number, number | null>;
  score?: number | null;
  completed?: boolean;
};

type FinanciereStep = {
  montant_lu: number | null;
  corrections_arithmetiques: number | null;
  rabais_accordes: number | null;
  offre_moins_disante: number | null;
  montant_evalue_final?: number | null;
  score?: number | null;
  completed?: boolean;
};

type TechniqueNoteKey = string;

type ExamenCommentKey =
  | "comment_offre_signee"
  | "comment_garantie_conforme"
  | "comment_dossier_admin_complet"
  | "comment_validite_conforme"
  | "comment_conditions_acceptees";

type DecisionStep = {
  recommandation: "ATTRIBUER" | "REJETER" | "RELANCER" | null;
  justification: string;
  declaration_conflit: boolean;
  password: string;
  completed?: boolean;
};

interface EvaluationFormProps {
  offre: OffreDetail;
  onSuccess: () => void;
  authEmail?: string;
  authCode?: string;
}

const initialExamen: ExamenStep = {
  offre_signee: null,
  garantie_conforme: null,
  dossier_admin_complet: null,
  validite_conforme: null,
  conditions_acceptees: null,
  commentaire: "",
};

const initialTechnique: TechniqueStep = {
  notes: {},
};

const initialFinanciere: FinanciereStep = {
  montant_lu: null,
  corrections_arithmetiques: null,
  rabais_accordes: null,
  offre_moins_disante: null,
};

const initialDecision: DecisionStep = {
  recommandation: null,
  justification: "",
  declaration_conflit: false,
  password: "",
};

const computeTechniqueScore = (
  data: TechniqueStep,
  criteres: CritereTechniqueApi[],
): number | null => {
  if (criteres.length === 0) return null;
  const values = criteres.map((c) => data.notes[c.id]);
  if (values.some((value) => value === null || value === undefined)) {
    return null;
  }
  const score = criteres.reduce((sum, critere) => {
    const note = Number(data.notes[critere.id] || 0);
    return sum + (note / 5) * 100 * (critere.ponderation / 100);
  }, 0);
  return Math.round(score * 10) / 10;
};

const computeFinancialScore = (
  montantFinal: number | null,
  offreMoinsDisante: number | null,
): number | null => {
  if (!montantFinal || !offreMoinsDisante || montantFinal <= 0) {
    return null;
  }
  return Math.round((Number(offreMoinsDisante) / montantFinal) * 1000) / 10;
};

const formatAmount = (value: number | null): string => {
  if (value === null || Number.isNaN(value)) return "—";
  return `${Number(value).toLocaleString("fr-FR")} MGA`;
};

export default function EvaluationForm({
  offre,
  onSuccess,
  authEmail,
  authCode,
}: EvaluationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [examen, setExamen] = useState<ExamenStep>(initialExamen);
  const [technique, setTechnique] = useState<TechniqueStep>(initialTechnique);
  const [financiere, setFinanciere] =
    useState<FinanciereStep>(initialFinanciere);
  const [decision, setDecision] = useState<DecisionStep>(initialDecision);
  const [loading, setLoading] = useState(false);
  const [criteres, setCriteres] = useState<CritereTechniqueApi[]>([]);
  const [popup, setPopup] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "warning";
    title: string;
    message: string;
    list?: string[];
  }>({ isOpen: false, type: "success", title: "", message: "" });

  const token = getToken();

  useEffect(() => {
    if (offre?.id) {
      fetchCriteres(offre.id)
        .then(setCriteres)
        .catch(() => setCriteres([]));
    }
  }, [offre?.id]);

  useEffect(() => {
    if (!offre) return;
    if (offre.examen_preliminaire) {
      setExamen({
        offre_signee: offre.examen_preliminaire.offre_signee ?? null,
        garantie_conforme: offre.examen_preliminaire.garantie_conforme ?? null,
        dossier_admin_complet:
          offre.examen_preliminaire.dossier_admin_complet ?? null,
        validite_conforme: offre.examen_preliminaire.validite_conforme ?? null,
        conditions_acceptees:
          offre.examen_preliminaire.conditions_acceptees ?? null,
        commentaire: offre.examen_preliminaire.commentaire || "",
        comment_offre_signee:
          offre.examen_preliminaire.comment_offre_signee || "",
        comment_garantie_conforme:
          offre.examen_preliminaire.comment_garantie_conforme || "",
        comment_dossier_admin_complet:
          offre.examen_preliminaire.comment_dossier_admin_complet || "",
        comment_validite_conforme:
          offre.examen_preliminaire.comment_validite_conforme || "",
        comment_conditions_acceptees:
          offre.examen_preliminaire.comment_conditions_acceptees || "",
        completed: true,
      });
      setCurrentStep(2);
    }
    if (offre.evaluation_technique) {
      const notesMap: Record<number, number | null> = {};
      const techNotes = (offre.evaluation_technique as Record<string, unknown>).notes;
      if (Array.isArray(techNotes)) {
        for (const n of techNotes as Array<{ critere_id: number; note: number }>) {
          notesMap[n.critere_id] = n.note;
        }
      }
      const techniqueData: TechniqueStep = {
        notes: notesMap,
        completed: true,
      };
      techniqueData.score = computeTechniqueScore(techniqueData, criteres);
      setTechnique(techniqueData);
      setCurrentStep(3);
    }
    if (offre.evaluation_financiere) {
      const financiereData: FinanciereStep = {
        montant_lu: offre.evaluation_financiere.montant_lu ?? null,
        corrections_arithmetiques:
          offre.evaluation_financiere.corrections_arithmetiques ?? null,
        rabais_accordes: offre.evaluation_financiere.rabais_accordes ?? null,
        offre_moins_disante:
          offre.evaluation_financiere.offre_moins_disante ?? null,
        completed: true,
      };
      financiereData.montant_evalue_final =
        (financiereData.montant_lu || 0) -
        (financiereData.corrections_arithmetiques || 0) -
        (financiereData.rabais_accordes || 0);
      financiereData.score = computeFinancialScore(
        financiereData.montant_evalue_final,
        financiereData.offre_moins_disante,
      );
      setFinanciere(financiereData);
      setCurrentStep(4);
    }
    if (offre.decision_finale) {
      setDecision({
        recommandation:
          offre.decision_finale.recommandation ||
          initialDecision.recommandation,
        justification: offre.decision_finale.justification || "",
        declaration_conflit: offre.decision_finale.declaration_conflit ?? false,
        password: "",
        completed: true,
      });
    }
  }, [offre]);

  useEffect(() => {
    const score = computeTechniqueScore(technique, criteres);
    if (score !== technique.score) {
      setTechnique((current) => ({ ...current, score }));
    }
  }, [technique, criteres]);

  useEffect(() => {
    const montantFinal =
      (financiere.montant_lu || 0) -
      (financiere.corrections_arithmetiques || 0) -
      (financiere.rabais_accordes || 0);
    const score = computeFinancialScore(
      montantFinal,
      financiere.offre_moins_disante,
    );
    if (
      montantFinal !== financiere.montant_evalue_final ||
      score !== financiere.score
    ) {
      setFinanciere((current) => ({
        ...current,
        montant_evalue_final: montantFinal,
        score,
      }));
    }
  }, [financiere]);

  const isExamenComplete =
    examen.offre_signee !== null &&
    examen.garantie_conforme !== null &&
    examen.dossier_admin_complet !== null &&
    examen.validite_conforme !== null &&
    examen.conditions_acceptees !== null;

  const isExamenConforme =
    isExamenComplete &&
    examen.offre_signee &&
    examen.garantie_conforme &&
    examen.dossier_admin_complet &&
    examen.validite_conforme &&
    examen.conditions_acceptees;

  const canSubmitDecision =
    !!decision.recommandation &&
    decision.justification.trim().length >= 10 &&
    decision.declaration_conflit &&
    (!!token || decision.password.trim().length >= 6);

  const techniqueScore = technique.score;
  const financiereScore = financiere.score;
  const summaryScore =
    techniqueScore != null && financiereScore != null
      ? Math.round((techniqueScore * 0.6 + financiereScore * 0.4) * 10) / 10
      : null;

  const showPopup = (
    type: "success" | "error" | "warning",
    title: string,
    message: string,
    list?: string[],
  ) => setPopup({ isOpen: true, type, title, message, list });

  const handleSubmitStep = async (step: number) => {
    if (loading) return;
    setLoading(true);
    try {
      if (step === 1) {
        if (!isExamenComplete) {
          showPopup(
            "warning",
            "Examen incomplet",
            "Répondez à tous les critères du contrôle préliminaire.",
          );
          return;
        }
        const payload: ExamenPreliminairePayload = {
          ...(authEmail && authCode
            ? { email: authEmail, code: authCode }
            : {}),
          offre_signee: examen.offre_signee || false,
          garantie_conforme: examen.garantie_conforme || false,
          dossier_admin_complet: examen.dossier_admin_complet || false,
          validite_conforme: examen.validite_conforme || false,
          conditions_acceptees: examen.conditions_acceptees || false,
          commentaire: examen.commentaire,
        };
        await submitExamenPreliminaire(offre.id, payload);
        setExamen({
          offre_signee: payload.offre_signee,
          garantie_conforme: payload.garantie_conforme,
          dossier_admin_complet: payload.dossier_admin_complet,
          validite_conforme: payload.validite_conforme,
          conditions_acceptees: payload.conditions_acceptees,
          commentaire: payload.commentaire || "",
          completed: true,
        });
        if (!isExamenConforme) {
          showPopup(
            "error",
            "Offre éliminée",
            "Au moins un critère est non conforme. L'évaluation technique est bloquée.",
          );
          return;
        }
        showPopup(
          "success",
          "Examen validé",
          "Le contrôle préliminaire est conforme. Vous pouvez poursuivre.",
        );
        setCurrentStep(2);
      }
      if (step === 2) {
        const invalid = criteres
          .map((c) => ({
            value: technique.notes[c.id],
            label: c.nom,
          }))
          .filter((item) => item.value === null || item.value === undefined);
        if (invalid.length > 0) {
          showPopup(
            "warning",
            "Notes manquantes",
            "Veuillez remplir toutes les notes techniques.",
            invalid.map((item) => item.label),
          );
          return;
        }
        const notes = criteres.map((c) => ({
          critere_id: c.id,
          note: Number(technique.notes[c.id] ?? 0),
          commentaire: "",
        }));
        const payload: EvaluationTechniquePayload = {
          ...(authEmail && authCode
            ? { email: authEmail, code: authCode }
            : {}),
          notes,
        } as unknown as EvaluationTechniquePayload;
        await submitEvaluationTechnique(offre.id, payload);
        const score = computeTechniqueScore(
          { notes: Object.fromEntries(criteres.map((c) => [c.id, technique.notes[c.id]])) },
          criteres,
        );
        setTechnique({
          notes: { ...technique.notes },
          score,
          completed: true,
        });
        if (score === null || score < 70) {
          showPopup(
            "error",
            "Seuil technique non atteint",
            "Le score technique est inférieur à 70/100. L'évaluation financière est bloquée.",
          );
          return;
        }
        showPopup(
          "success",
          "Évaluation technique validée",
          "Le score technique est suffisant pour passer à l'évaluation financière.",
        );
        setCurrentStep(3);
      }
      if (step === 3) {
        if (financiere.montant_lu === null || financiere.montant_lu <= 0) {
          showPopup(
            "warning",
            "Montant requis",
            "Le montant lu est obligatoire pour l'évaluation financière.",
          );
          return;
        }
        const montantFinal =
          (financiere.montant_lu || 0) -
          (financiere.corrections_arithmetiques || 0) -
          (financiere.rabais_accordes || 0);
        if (montantFinal <= 0) {
          showPopup(
            "error",
            "Montant invalide",
            "Le montant évalué final doit être supérieur à zéro.",
          );
          return;
        }
        const payload: EvaluationFinancierePayload = {
          ...(authEmail && authCode
            ? { email: authEmail, code: authCode }
            : {}),
          montant_lu: financiere.montant_lu || 0,
          corrections_arithmetiques:
            financiere.corrections_arithmetiques ?? undefined,
          rabais_accordes: financiere.rabais_accordes ?? undefined,
          offre_moins_disante: financiere.offre_moins_disante ?? undefined,
        };
        await submitEvaluationFinanciere(offre.id, payload);
        const score = computeFinancialScore(
          montantFinal,
          financiere.offre_moins_disante,
        );
        setFinanciere({
          ...financiere,
          montant_evalue_final: montantFinal,
          score,
          completed: true,
        });
        showPopup(
          "success",
          "Évaluation financière enregistrée",
          "L'évaluation financière a été enregistrée avec succès.",
        );
        setCurrentStep(4);
      }
      if (step === 4) {
        if (!canSubmitDecision) {
          showPopup(
            "warning",
            "Formulaire incomplet",
            "Complétez la recommandation, la justification, la déclaration et le mot de passe si nécessaire.",
          );
          return;
        }
        const payload: DecisionFinalePayload = {
          ...(authEmail && authCode
            ? { email: authEmail, code: authCode }
            : {}),
          recommandation: decision.recommandation || "REJETER",
          justification: decision.justification,
          declaration_conflit: decision.declaration_conflit,
          password: decision.password,
        };
        await submitDecisionFinale(offre.id, payload);
        setDecision({ ...decision, completed: true });
        showPopup(
          "success",
          "Évaluation consolidée",
          "La décision finale a été enregistrée avec succès.",
        );
        setTimeout(onSuccess, 1200);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur inconnue";
      showPopup("error", "Erreur serveur", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto px-4 sm:px-0">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
        <Image
          src="/ucp-sante-logo-color.png"
          alt="Logo UCP"
          width={44}
          height={44}
          className="rounded-2xl border border-slate-200 bg-white object-contain"
          style={{ width: "auto", height: "auto" }}
        />
        <div>
          <p className="text-sm font-bold text-slate-900">
            Évaluation des offres
          </p>
          <p className="text-xs text-slate-500">
            Flux en 4 étapes inspiré du prototype, avec votre logo et vos
            styles.
          </p>
        </div>
      </div>

      <ModernPopup
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        list={popup.list}
        onClose={() => setPopup((prev) => ({ ...prev, isOpen: false }))}
      />

      <div className="flex items-center gap-3 overflow-x-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        {["Examen", "Technique", "Financière", "Conclusion"].map(
          (label, idx) => {
            const step = idx + 1;
            const active = currentStep === step;
            const done = currentStep > step;
            return (
              <div key={label} className="flex-1 min-w-[110px] text-center">
                <div
                  className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                    done
                      ? "bg-emerald-700 text-white"
                      : active
                        ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {done ? "✓" : step}
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {label}
                </p>
              </div>
            );
          },
        )}
      </div>

      <StepCard
        step={1}
        title="Examen Préliminaire"
        completed={examen.completed}
        isExpanded={currentStep === 1}
        onToggle={() => setCurrentStep(1)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Vérifiez la conformité de l&apos;offre avant l&apos;évaluation
            technique.
          </p>
          {[
            {
              key: "offre_signee",
              label: "Offre signée par personne habilitée",
            },
            { key: "garantie_conforme", label: "Garantie conforme au DAO" },
            {
              key: "dossier_admin_complet",
              label: "Dossier administratif complet",
            },
            { key: "validite_conforme", label: "Validité conforme" },
            { key: "conditions_acceptees", label: "Conditions acceptées" },
          ].map(({ key, label }) => {
            const value = examen[key as keyof ExamenStep] as boolean | null;
            return (
              <div
                key={key}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold text-slate-900">{label}</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExamen((current) => ({ ...current, [key]: true }))
                      }
                      className={`h-10 w-10 rounded-full border text-sm font-semibold transition ${
                        value === true
                          ? "bg-emerald-700 text-white border-emerald-700"
                          : "bg-white text-slate-600 border-slate-300 hover:border-emerald-700"
                      }`}
                    >
                      O
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setExamen((current) => ({ ...current, [key]: false }))
                      }
                      className={`h-10 w-10 rounded-full border text-sm font-semibold transition ${
                        value === false
                          ? "bg-rose-600 text-white border-rose-600"
                          : "bg-white text-slate-600 border-slate-300 hover:border-rose-600"
                      }`}
                    >
                      N
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-medium text-slate-700 mb-2">
                    Commentaire (optionnel)
                  </label>
                  <input
                    type="text"
                    value={examen[`comment_${key}` as ExamenCommentKey] || ""}
                    onChange={(e) =>
                      setExamen((current) => ({
                        ...current,
                        [`comment_${key}` as ExamenCommentKey]: e.target.value,
                      }))
                    }
                    placeholder="Commentaire spécifique"
                    className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  />
                </div>
              </div>
            );
          })}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-900">
              Commentaire général
            </label>
            <textarea
              value={examen.commentaire}
              onChange={(e) =>
                setExamen((current) => ({
                  ...current,
                  commentaire: e.target.value,
                }))
              }
              rows={3}
              className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
              placeholder="Ajouter un commentaire global"
            />
          </div>
          {isExamenComplete && (
            <div
              className={`rounded-3xl border px-4 py-4 text-sm ${isExamenConforme ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-rose-50 border-rose-200 text-rose-900"}`}
            >
              {isExamenConforme ? (
                <p>
                  Conforme — l&apos;offre peut passer à l&apos;évaluation
                  technique.
                </p>
              ) : (
                <p>
                  Non conforme — l&apos;évaluation technique est bloquée tant
                  que les critères ne sont pas tous cochés O.
                </p>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => handleSubmitStep(1)}
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:bg-slate-300"
          >
            {loading ? (
              <Loader className="inline-block w-4 h-4 animate-spin" />
            ) : (
              "Valider l'examen préliminaire"
            )}
          </button>
        </div>
      </StepCard>

      <StepCard
        step={2}
        title="Évaluation Technique"
        completed={technique.completed}
        isExpanded={currentStep === 2}
        onToggle={() => setCurrentStep(2)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Chaque note est sur 5 points. Le score final technique est calculé
            sur 100.
          </p>
          {criteres.map((critere) => (
            <div key={critere.id} className="space-y-2">
              <label className="block text-sm font-semibold text-slate-900">
                {critere.nom} ({critere.ponderation}%)
              </label>
              <input
                type="number"
                min={0}
                max={5}
                step={0.5}
                value={technique.notes[critere.id] ?? ""}
                onChange={(e) =>
                  setTechnique((current) => ({
                    ...current,
                    notes: {
                      ...current.notes,
                      [critere.id]:
                        e.target.value === "" ? null : Number(e.target.value),
                    },
                  }))
                }
                className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
              />
            </div>
          ))}
          {technique.score !== undefined && technique.score !== null && (
            <div
              className={`rounded-3xl border px-4 py-4 text-sm ${technique.score >= 70 ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-rose-50 border-rose-200 text-rose-900"}`}
            >
              <p className="font-semibold">
                Score technique: {technique.score}/100
              </p>
              <p className="mt-2 text-sm">
                {technique.score >= 70
                  ? "Le score est suffisant pour accéder à l’évaluation financière."
                  : "Le score est inférieur à 70/100. L’évaluation financière est bloquée."}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={() => handleSubmitStep(2)}
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:bg-slate-300"
          >
            {loading ? (
              <Loader className="inline-block w-4 h-4 animate-spin" />
            ) : (
              "Valider l'évaluation technique"
            )}
          </button>
        </div>
      </StepCard>

      <StepCard
        step={3}
        title="Évaluation Financière"
        completed={financiere.completed}
        isExpanded={currentStep === 3}
        onToggle={() => setCurrentStep(3)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Saisissez les montants pour calculer automatiquement le score
            financier.
          </p>
          {offre.peut_saisir_financiere === false && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <p className="font-semibold">Accès financier restreint</p>
              <p className="mt-2 text-sm">
                {offre.blocage_financier ||
                  "La saisie financière est actuellement verrouillée."}
              </p>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-900">
                Montant lu (MGA)
              </label>
              <input
                type="number"
                value={financiere.montant_lu ?? ""}
                onChange={(e) =>
                  setFinanciere((current) => ({
                    ...current,
                    montant_lu:
                      e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-900">
                Corrections (MGA)
              </label>
              <input
                type="number"
                value={financiere.corrections_arithmetiques ?? ""}
                onChange={(e) =>
                  setFinanciere((current) => ({
                    ...current,
                    corrections_arithmetiques:
                      e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-900">
                Rabais (MGA)
              </label>
              <input
                type="number"
                value={financiere.rabais_accordes ?? ""}
                onChange={(e) =>
                  setFinanciere((current) => ({
                    ...current,
                    rabais_accordes:
                      e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-900">
                Offre moins-disante (MGA)
              </label>
              <input
                type="number"
                value={financiere.offre_moins_disante ?? ""}
                onChange={(e) =>
                  setFinanciere((current) => ({
                    ...current,
                    offre_moins_disante:
                      e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
              />
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p>
              Montant évalué final:{" "}
              <span className="font-semibold">
                {formatAmount(financiere.montant_evalue_final ?? null)}
              </span>
            </p>
            <p className="mt-2">
              Score financier:{" "}
              <span className="font-semibold">
                {financiere.score !== undefined
                  ? `${financiere.score}/100`
                  : "—"}
              </span>
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Le score financier est calculé automatiquement lorsque le montant
              final et le montant moins-disant sont renseignés.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleSubmitStep(3)}
            disabled={loading || offre.peut_saisir_financiere === false}
            className="w-full rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:bg-slate-300"
          >
            {loading ? (
              <Loader className="inline-block w-4 h-4 animate-spin" />
            ) : (
              "Valider l'évaluation financière"
            )}
          </button>
        </div>
      </StepCard>

      <StepCard
        step={4}
        title="Conclusion"
        completed={decision.completed}
        isExpanded={currentStep === 4}
        onToggle={() => setCurrentStep(4)}
      >
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p>
              Score technique:{" "}
              <span className="font-semibold">
                {technique.score ?? "—"}/100
              </span>
            </p>
            <p className="mt-2">
              Score financier:{" "}
              <span className="font-semibold">
                {financiere.score ?? "—"}/100
              </span>
            </p>
            <p className="mt-2">
              Score final pondéré:{" "}
              <span className="font-semibold">
                {summaryScore !== null ? `${summaryScore}/100` : "—"}
              </span>
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-900">
              Recommandation
            </label>
            <select
              value={decision.recommandation ?? "REJETER"}
              onChange={(e) =>
                setDecision((current) => ({
                  ...current,
                  recommandation: e.target
                    .value as DecisionStep["recommandation"],
                }))
              }
              className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            >
              <option value="ATTRIBUER">Attribuer</option>
              <option value="REJETER">Rejeter</option>
              <option value="RELANCER">Relancer</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-900">
              Justification
            </label>
            <textarea
              value={decision.justification}
              onChange={(e) =>
                setDecision((current) => ({
                  ...current,
                  justification: e.target.value,
                }))
              }
              rows={4}
              className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
              placeholder="Détaillez votre recommandation"
            />
            <p className="text-xs text-slate-500">
              {decision.justification.trim().length} caractères (minimum 10).
            </p>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-3xl border border-slate-200 bg-white p-4">
            <input
              type="checkbox"
              checked={decision.declaration_conflit}
              onChange={(e) =>
                setDecision((current) => ({
                  ...current,
                  declaration_conflit: e.target.checked,
                }))
              }
              className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700"
            />
            <span className="text-sm text-slate-900">
              Je déclare qu&apos;il n&apos;existe aucun conflit d&apos;intérêt
              avec le soumissionnaire.
            </span>
          </label>
          {!token && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-900">
                Mot de passe
              </label>
              <input
                type="password"
                value={decision.password}
                onChange={(e) =>
                  setDecision((current) => ({
                    ...current,
                    password: e.target.value,
                  }))
                }
                className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                placeholder="Saisir votre mot de passe pour signer"
              />
            </div>
          )}
          <button
            type="button"
            onClick={() => handleSubmitStep(4)}
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:bg-slate-300"
          >
            {loading ? (
              <Loader className="inline-block w-4 h-4 animate-spin" />
            ) : (
              "Consolider l'évaluation"
            )}
          </button>
        </div>
      </StepCard>
    </div>
  );
}

interface StepCardProps {
  step: number;
  title: string;
  completed?: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

function StepCard({
  step,
  title,
  completed,
  isExpanded,
  onToggle,
  children,
}: StepCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${completed ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-700"}`}
          >
            {completed ? <CheckCircle2 className="w-5 h-5" /> : step}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">
              {completed ? "Étape complétée" : "Étape en cours"}
            </p>
          </div>
        </div>
        <div className="text-slate-500">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>
      </button>
      {isExpanded && <div className="px-5 py-5 bg-slate-50">{children}</div>}
    </div>
  );
}

interface ModernPopupProps {
  isOpen: boolean;
  type: "success" | "error" | "warning";
  title: string;
  message: string;
  list?: string[];
  onClose: () => void;
}

function ModernPopup({
  isOpen,
  type,
  title,
  message,
  list,
  onClose,
}: ModernPopupProps) {
  if (!isOpen) return null;
  const config = {
    success: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      iconBg: "bg-emerald-600",
      titleColor: "text-emerald-950",
      button: "bg-emerald-700 hover:bg-emerald-800",
    },
    error: {
      bg: "bg-rose-500/10",
      border: "border-rose-500/30",
      iconBg: "bg-rose-600",
      titleColor: "text-rose-950",
      button: "bg-rose-700 hover:bg-rose-800",
    },
    warning: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      iconBg: "bg-amber-600",
      titleColor: "text-amber-950",
      button: "bg-amber-700 hover:bg-amber-800",
    },
  }[type];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300">
      <div className="absolute inset-0 bg-slate-950/40" onClick={onClose} />
      <div
        className={`relative w-full max-w-md overflow-hidden rounded-[2.5rem] border ${config.border} bg-white/70 backdrop-blur-xl p-8 shadow-[0_32px_64px_-12px_rgba(15,23,42,0.25)] transition-all duration-300 animate-in zoom-in-95`}
      >
        <div
          className={`absolute -top-6 right-8 flex h-16 w-16 items-center justify-center rounded-2xl ${config.iconBg} text-white shadow-lg shadow-black/10`}
        >
          <AlertCircle className="h-7 w-7" />
        </div>
        <div className="mt-8 text-center">
          <h2
            className={`text-2xl font-black tracking-tight ${config.titleColor}`}
          >
            {title}
          </h2>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-700">
            {message}
          </p>
          {list && list.length > 0 && (
            <div className="mt-4 rounded-3xl border border-slate-200/50 bg-slate-50/55 backdrop-blur-md p-4 text-left text-sm text-slate-700">
              <ul className="space-y-2">
                {list.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-700" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className={`${config.button} mt-6 inline-flex rounded-full px-6 py-3 text-sm font-black tracking-wider uppercase text-white shadow-lg transition duration-200 hover:-translate-y-0.5 active:translate-y-0`}
          >
            D&apos;accord
          </button>
        </div>
      </div>
    </div>
  );
}
