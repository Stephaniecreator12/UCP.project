"use client";

import { useEffect, useMemo, useState } from "react";
import { X, ExternalLink, Activity } from "lucide-react";
import {
  DecisionValidation,
  DemandeAchat,
  EtapeValidation,
  validateDemandeAchat,
} from "@/services/achats";
import {
  formatMoney,
  getCompactNeedLabel,
  typeLabels,
} from "@/app/demande-achat/components/demandeAchatShared";
import { getCurrentUser, getValidatorStep } from "@/services/auth";

type ValidationModalProps = {
  demande: DemandeAchat | null;
  open: boolean;
  onClose: () => void;
  onOpenDetail: () => void;
  onValidationSuccess: () => void;
};

type ValidationFormState = {
  decision: DecisionValidation;
  commentaire: string;
  conformite_technique: string;
  verification_stock: string;
  disponibilite_budgetaire: string;
  conformite_financiere: string;
  respect_seuils: string;
  ligne_engagement: string;
  solde_apres_engagement: string;
};

type DecisionOption = {
  value: DecisionValidation;
  label: string;
  tone: "emerald" | "amber" | "rose";
};

const toneClasses = {
  emerald: {
    base: "border-emerald-200 text-emerald-800",
    active: "border-emerald-500 bg-emerald-50 text-emerald-900",
  },
  amber: {
    base: "border-amber-200 text-amber-800",
    active: "border-amber-500 bg-amber-50 text-amber-900",
  },
  rose: {
    base: "border-rose-200 text-rose-800",
    active: "border-rose-500 bg-rose-50 text-rose-900",
  },
} as const;

const createInitialForm = (step: EtapeValidation | null): ValidationFormState => {
  switch (step) {
    case "PROGRAMMATIQUE":
    case "APPROBATION_FINALE":
      return { decision: "APPROUVEE", commentaire: "", conformite_technique: "", verification_stock: "", disponibilite_budgetaire: "", conformite_financiere: "", respect_seuils: "", ligne_engagement: "", solde_apres_engagement: "" };
    case "TECHNIQUE":
      return { decision: "FAVORABLE", commentaire: "", conformite_technique: "CONFORME_STANDARDS", verification_stock: "STOCK_DISPONIBLE", disponibilite_budgetaire: "", conformite_financiere: "", respect_seuils: "", ligne_engagement: "", solde_apres_engagement: "" };
    case "BUDGETAIRE":
      return { decision: "FAVORABLE", commentaire: "", conformite_technique: "", verification_stock: "", disponibilite_budgetaire: "DISPONIBLE", conformite_financiere: "CONFORME_MANUEL", respect_seuils: "SEUIL_RESPECTE", ligne_engagement: "", solde_apres_engagement: "" };
    default:
      return { decision: "FAVORABLE", commentaire: "", conformite_technique: "", verification_stock: "", disponibilite_budgetaire: "", conformite_financiere: "", respect_seuils: "", ligne_engagement: "", solde_apres_engagement: "" };
  }
};

const getDecisionOptions = (step: EtapeValidation | null): DecisionOption[] => {
  if (step === "PROGRAMMATIQUE" || step === "APPROBATION_FINALE") {
    return [
      { value: "APPROUVEE", label: "Approuvé", tone: "emerald" },
      { value: "A_REVOIR", label: "À revoir", tone: "amber" },
      { value: "REJETEE", label: "Rejeté", tone: "rose" },
    ];
  }
  return [
    { value: "FAVORABLE", label: "Favorable", tone: "emerald" },
    { value: "A_COMPLETER", label: "À compléter", tone: "amber" },
    { value: "DEFAVORABLE", label: "Défavorable", tone: "rose" },
  ];
};

const buildValidationPayload = (step: EtapeValidation | null, form: ValidationFormState) => {
  const base = { decision: form.decision, commentaire: form.commentaire };
  if (step === "TECHNIQUE") return { ...base, donnees_etape: { conformite_technique: form.conformite_technique, verification_stock: form.verification_stock } };
  if (step === "BUDGETAIRE") return { ...base, donnees_etape: { disponibilite_budgetaire: form.disponibilite_budgetaire, conformite_financiere: form.conformite_financiere, respect_seuils: form.respect_seuils, ligne_engagement: form.ligne_engagement, solde_apres_engagement: form.solde_apres_engagement } };
  return { ...base, donnees_etape: {} };
};

export default function ValidationModal({
  demande,
  open,
  onClose,
  onOpenDetail,
  onValidationSuccess,
}: ValidationModalProps) {
  const [currentUser] = useState(() => getCurrentUser());
  const validatorStep = getValidatorStep(currentUser) as EtapeValidation | null;

  const [form, setForm] = useState<ValidationFormState>(() => createInitialForm(validatorStep));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedStep = (demande?.etape_validation_actuelle ?? validatorStep) as EtapeValidation | null;
  const decisionOptions = useMemo(() => getDecisionOptions(selectedStep), [selectedStep]);

  useEffect(() => {
    if (open) {
      setForm(createInitialForm(selectedStep));
      setError(null);
    }
  }, [open, selectedStep]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", handleKeyDown); };
  }, [onClose, open]);

  if (!open || !demande) return null;

  const handleSubmit = async () => {
    if (!demande || !selectedStep) return;

    if ((selectedStep === "PROGRAMMATIQUE" || selectedStep === "APPROBATION_FINALE") && (form.decision === "REJETEE" || form.decision === "A_REVOIR") && !form.commentaire.trim()) {
      setError("Les observations sont obligatoires pour un refus."); return;
    }
    if (form.decision === "DEFAVORABLE" && !form.commentaire.trim()) {
      setError("Les observations sont obligatoires pour un avis défavorable."); return;
    }

    setSaving(true);
    setError(null);
    try {
      await validateDemandeAchat(demande.id, buildValidationPayload(selectedStep, form));
      onValidationSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de validation");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] bg-slate-900/40 p-4 flex items-center justify-center animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Validation : {demande.numero_demande}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded bg-slate-200/50 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-5 space-y-4">
          
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500 uppercase">Infos Demande</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 truncate" title={demande.objet}>{demande.objet}</p>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-600">
                <span>{getCompactNeedLabel(demande)}</span>
                <span className="border-l border-slate-200 pl-3">{typeLabels[demande.type_demande] ?? demande.type_demande}</span>
                <span className="border-l border-slate-200 pl-3 font-semibold text-slate-800">{formatMoney(demande.cout_total_estime)} Ar</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenDetail}
              className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 hover:bg-sky-100 transition-colors"
            >
              Voir détail <ExternalLink className="h-3 w-3" />
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Justification du demandeur
            </p>
            <p className="whitespace-pre-wrap text-[0.85rem] leading-relaxed text-slate-700">
              {demande.justification}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
            <div>
               <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Avis & Décision
              </p>
              <div className="grid gap-2 grid-cols-3">
                {decisionOptions.map((option) => {
                  const isActive = form.decision === option.value;
                  const optionTone = toneClasses[option.tone];
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, decision: option.value }))}
                      className={`rounded-lg border px-3 py-2 text-center transition shadow-sm ${isActive ? optionTone.active : optionTone.base}`}
                    >
                      <p className="text-xs font-bold">{option.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedStep === "TECHNIQUE" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-700">Conformité technique</span>
                  <select
                    value={form.conformite_technique}
                    onChange={(e) => setForm({ ...form, conformite_technique: e.target.value })}
                    className="w-full rounded-md border border-slate-300 bg-white py-1.5 px-3 text-sm shadow-sm"
                  >
                    <option value="CONFORME_STANDARDS">Conforme standards</option>
                    <option value="NON_CONFORME">Non conforme</option>
                    <option value="A_PRECISER">À préciser</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-700">Vérification stock</span>
                  <select
                    value={form.verification_stock}
                    onChange={(e) => setForm({ ...form, verification_stock: e.target.value })}
                    className="w-full rounded-md border border-slate-300 bg-white py-1.5 px-3 text-sm shadow-sm"
                  >
                    <option value="STOCK_DISPONIBLE">Stock disponible</option>
                    <option value="STOCK_DISPONIBLE_PARTIELLEMENT">Dispo partiel</option>
                    <option value="STOCK_INSUFFISANT">Stock insuffisant</option>
                  </select>
                </div>
              </div>
            )}

            {selectedStep === "BUDGETAIRE" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-700">Disponibilité budgétaire</span>
                  <select
                    value={form.disponibilite_budgetaire}
                    onChange={(e) => setForm({ ...form, disponibilite_budgetaire: e.target.value })}
                    className="w-full rounded-md border border-slate-300 bg-white py-1.5 px-3 text-sm shadow-sm"
                  >
                    <option value="DISPONIBLE">Disponible</option>
                    <option value="PARTIELLE">Partielle</option>
                    <option value="NON_DISPONIBLE">Non disponible</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-700">Conformité financière</span>
                  <select
                    value={form.conformite_financiere}
                    onChange={(e) => setForm({ ...form, conformite_financiere: e.target.value })}
                    className="w-full rounded-md border border-slate-300 bg-white py-1.5 px-3 text-sm shadow-sm"
                  >
                    <option value="CONFORME_MANUEL">Conforme au manuel</option>
                    <option value="NON_CONFORME">Non conforme</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-700">Ligne d'engagement</span>
                  <input
                    value={form.ligne_engagement}
                    onChange={(e) => setForm((prev) => ({ ...prev, ligne_engagement: e.target.value }))}
                    className="w-full rounded-md border border-slate-300 bg-white py-1.5 px-3 text-sm shadow-sm"
                    placeholder="Ex: ENG-014"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-700">Solde après engagement</span>
                  <input
                    value={form.solde_apres_engagement}
                    onChange={(e) => setForm((prev) => ({ ...prev, solde_apres_engagement: e.target.value }))}
                    className="w-full rounded-md border border-slate-300 bg-white py-1.5 px-3 text-sm shadow-sm"
                    placeholder="Montant (Ar)"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-700">Observations</span>
              <textarea
                value={form.commentaire}
                onChange={(e) => setForm((prev) => ({ ...prev, commentaire: e.target.value }))}
                placeholder="Ajoutez vos remarques ici..."
                className="w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm shadow-sm min-h-[60px] resize-y"
              />
            </div>
            
            {error && (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2 rounded border border-rose-100">
                {error}
              </p>
            )}
            
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-white px-5 py-3 flex items-center justify-between">
            <button
              onClick={onClose}
              disabled={saving}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-bold text-white hover:bg-emerald-700 shadow-md transition-colors disabled:opacity-60"
            >
              {saving ? "Sauvegarde..." : "Valider la décision"}
            </button>
        </div>

      </div>
    </div>
  );
}
