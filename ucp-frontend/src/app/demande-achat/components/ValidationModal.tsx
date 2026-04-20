"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, ExternalLink, X } from "lucide-react";
import PurchaseSelect from "@/app/demande-achat/components/PurchaseSelect";
import {
  formatMoney,
  getCompactNeedLabel,
  typeLabels,
} from "@/app/demande-achat/components/demandeAchatShared";
import {
  DecisionValidation,
  DemandeAchat,
  EtapeValidation,
  validateDemandeAchat,
} from "@/services/achats";
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
  numero_engagement_budgetaire: string;
  solde_apres_engagement: string;
  ligne_budgetaire: string;
  source_financement: string;
  numero_subvention: string;
  solde_disponible_ligne_budgetaire: string;
};

type DecisionOption = {
  value: DecisionValidation;
  label: string;
  tone: "emerald" | "amber" | "rose";
};

const toneClasses = {
  emerald: {
    base: "border-slate-200 text-slate-600 bg-white",
    active: "border-emerald-300 bg-emerald-50 text-emerald-800",
  },
  amber: {
    base: "border-slate-200 text-slate-600 bg-white",
    active: "border-amber-300 bg-amber-50 text-amber-800",
  },
  rose: {
    base: "border-slate-200 text-slate-600 bg-white",
    active: "border-rose-300 bg-rose-50 text-rose-800",
  },
} as const;

const techniqueConformiteOptions = [
  { value: "CONFORME_STANDARDS", label: "Conforme standards" },
  { value: "NON_CONFORME", label: "Non conforme" },
  { value: "A_PRECISER", label: "A preciser" },
] as const;

const verificationStockOptions = [
  { value: "STOCK_DISPONIBLE", label: "Stock disponible" },
  { value: "STOCK_DISPONIBLE_PARTIELLEMENT", label: "Dispo partiel" },
  { value: "STOCK_INSUFFISANT", label: "Stock insuffisant" },
] as const;

const disponibiliteBudgetaireOptions = [
  { value: "DISPONIBLE", label: "Disponible" },
  { value: "PARTIELLE", label: "Partielle" },
  { value: "NON_DISPONIBLE", label: "Non disponible" },
] as const;

const conformiteFinanciereOptions = [
  { value: "CONFORME_MANUEL", label: "Conforme manuel procedures" },
  { value: "NON_CONFORME", label: "Non conforme" },
] as const;

const respectSeuilsOptions = [
  { value: "SEUIL_RESPECTE", label: "Seuil respecte" },
  { value: "PROCEDURE_ADAPTEE", label: "Procedure adaptee" },
] as const;

const fundingSourceOptions = [
  { value: "FM", label: "Fonds mondial" },
  { value: "GAVI", label: "Alliance GAVI" },
  { value: "BM", label: "Banque mondiale" },
] as const;

const financeCatalog = [
  {
    value: "SRPS_CS7_FM",
    family: "FM",
    sourceLabel: "SRPS / CS7 / Fonds Mondial",
    budgetLabel: "SRPS",
    subvention: "MDG-S-MOH-4041",
  },
  {
    value: "RSS3_GAVI",
    family: "GAVI",
    sourceLabel: "RSS3 - MDG-HSS-3",
    budgetLabel: "RSS3",
    subvention: "MDG-HSS-3",
  },
  {
    value: "FAE_GAVI",
    family: "GAVI",
    sourceLabel: "FAE - MDG-FAE",
    budgetLabel: "FAE",
    subvention: "MDG-FAE",
  },
  {
    value: "CDS_GAVI",
    family: "GAVI",
    sourceLabel: "CDS - MDG-COVID19-CDS",
    budgetLabel: "CDS",
    subvention: "MDG-COVID19-CDS",
  },
  {
    value: "VAR_GAVI",
    family: "GAVI",
    sourceLabel: "VAR - MDG-VAR Camp",
    budgetLabel: "VAR",
    subvention: "MDG-VAR Camp",
  },
  {
    value: "PARN2_BM",
    family: "BM",
    sourceLabel: "PARN2 - P175110",
    budgetLabel: "PARN2",
    subvention: "P175110",
  },
  {
    value: "PPSB_BM",
    family: "BM",
    sourceLabel: "PPSB - P174903",
    budgetLabel: "PPSB",
    subvention: "P174903",
  },
] as const;

const DEFAULT_FINANCE = financeCatalog[0];

const parseAmount = (value: string) => {
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatAmountInput = (value: number) =>
  value.toLocaleString("fr-FR", { maximumFractionDigits: 0 });

const buildEngagementNumber = (demande: DemandeAchat | null) =>
  `ENG-${new Date().getFullYear()}-${String(demande?.id ?? 1).padStart(4, "0")}`;

const getCatalogByValue = (value: string) =>
  financeCatalog.find((item) => item.value === value) ?? DEFAULT_FINANCE;

const findCatalog = (value: string) =>
  financeCatalog.find((item) => item.value === value || item.family === value) ?? null;

const getCatalogForFundingSource = (family: string) =>
  financeCatalog.filter((item) => item.family === family);

const createInitialForm = (step: EtapeValidation | null): ValidationFormState => {
  const base: ValidationFormState = {
    decision: step === "PROGRAMMATIQUE" || step === "APPROBATION_FINALE" ? "APPROUVEE" : "FAVORABLE",
    commentaire: "",
    conformite_technique: "",
    verification_stock: "",
    disponibilite_budgetaire: "",
    conformite_financiere: "",
    respect_seuils: "",
    numero_engagement_budgetaire: "",
    solde_apres_engagement: "",
    ligne_budgetaire: "",
    source_financement: "",
    numero_subvention: "",
    solde_disponible_ligne_budgetaire: "",
  };

  return base;
};

const getDecisionOptions = (step: EtapeValidation | null): DecisionOption[] => {
  if (step === "PROGRAMMATIQUE" || step === "APPROBATION_FINALE") {
    return [
      { value: "APPROUVEE", label: "Approuve", tone: "emerald" },
      { value: "A_REVOIR", label: "A revoir", tone: "amber" },
      { value: "REJETEE", label: "Rejete", tone: "rose" },
    ];
  }

  return [
    { value: "FAVORABLE", label: "Favorable", tone: "emerald" },
    { value: "A_COMPLETER", label: "A completer", tone: "amber" },
    { value: "DEFAVORABLE", label: "Defavorable", tone: "rose" },
  ];
};

const buildValidationPayload = (
  step: EtapeValidation | null,
  form: ValidationFormState,
) => {
  const base = { decision: form.decision, commentaire: form.commentaire };

  if (step === "TECHNIQUE") {
    return {
      ...base,
      donnees_etape: {
        conformite_technique: form.conformite_technique,
        verification_stock: form.verification_stock,
      },
    };
  }

  if (step === "BUDGETAIRE") {
    const selectedBudgetLine = getCatalogByValue(form.ligne_budgetaire);
    return {
      ...base,
      donnees_etape: {
        disponibilite_budgetaire: form.disponibilite_budgetaire,
        conformite_financiere: form.conformite_financiere,
        respect_seuils: form.respect_seuils,
        ligne_budgetaire: form.ligne_budgetaire,
        source_financement: selectedBudgetLine.value,
        numero_subvention: form.numero_subvention,
        numero_engagement_budgetaire: form.numero_engagement_budgetaire,
        solde_disponible_ligne_budgetaire: form.solde_disponible_ligne_budgetaire,
        solde_apres_engagement: form.solde_apres_engagement,
      },
    };
  }

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
  const budgetLineCatalog = useMemo(
    () => getCatalogForFundingSource(form.source_financement),
    [form.source_financement],
  );
  const estimatedCost = useMemo(() => Number(demande?.cout_total_estime ?? 0), [demande?.cout_total_estime]);
  const availableBalance = useMemo(() => parseAmount(form.solde_disponible_ligne_budgetaire), [form.solde_disponible_ligne_budgetaire]);
  const remainingBalance = useMemo(() => availableBalance - estimatedCost, [availableBalance, estimatedCost]);

  useEffect(() => {
    if (!open) return;

    const initial = createInitialForm(selectedStep);
    const currentCatalog = findCatalog(
      (demande?.source_financement as string) || (demande?.ligne_budgetaire as string) || "",
    );

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      ...initial,
      source_financement: currentCatalog?.family || "",
      ligne_budgetaire: currentCatalog?.value || "",
      numero_subvention: demande?.numero_subvention || currentCatalog?.subvention || "",
      solde_disponible_ligne_budgetaire: demande?.solde_disponible_ligne_budgetaire
        ? String(demande.solde_disponible_ligne_budgetaire)
        : "",
      solde_apres_engagement: demande?.solde_apres_engagement
        ? String(demande.solde_apres_engagement)
        : "",
      numero_engagement_budgetaire:
        demande?.numero_engagement_budgetaire || "",
    });
    setError(null);
    setSaving(false);
  }, [open, selectedStep, demande]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open || selectedStep !== "BUDGETAIRE") return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm((prev) => {
      const selectedBudgetLine = prev.ligne_budgetaire
        ? getCatalogByValue(prev.ligne_budgetaire)
        : null;
      const forcedAvailability =
        remainingBalance < 0
          ? "NON_DISPONIBLE"
          : prev.disponibilite_budgetaire === "NON_DISPONIBLE"
            ? "DISPONIBLE"
            : prev.disponibilite_budgetaire;
      const forcedDecision =
        remainingBalance < 0 || forcedAvailability === "NON_DISPONIBLE"
          ? "DEFAVORABLE"
          : prev.decision === "DEFAVORABLE"
            ? "FAVORABLE"
            : prev.decision;

      return {
        ...prev,
        disponibilite_budgetaire: forcedAvailability,
        decision: forcedDecision,
        numero_subvention: selectedBudgetLine?.subvention ?? prev.numero_subvention,
        solde_apres_engagement: String(remainingBalance),
        numero_engagement_budgetaire:
          forcedDecision === "FAVORABLE"
            ? prev.numero_engagement_budgetaire ||
              demande?.numero_engagement_budgetaire ||
              buildEngagementNumber(demande)
            : prev.numero_engagement_budgetaire,
      };
    });
  }, [open, selectedStep, remainingBalance, demande]);

  if (!open || !demande) return null;

  const handleSubmit = async () => {
    if (!selectedStep) return;

    if (
      (selectedStep === "PROGRAMMATIQUE" || selectedStep === "APPROBATION_FINALE") &&
      (form.decision === "REJETEE" || form.decision === "A_REVOIR") &&
      !form.commentaire.trim()
    ) {
      setError("Les observations sont obligatoires pour un refus.");
      return;
    }

    if (form.decision === "A_COMPLETER" && !form.commentaire.trim()) {
      setError("Vous devez preciser quelles corrections sont attendues.");
      return;
    }

    if (selectedStep === "TECHNIQUE" && form.verification_stock === "STOCK_DISPONIBLE" && form.decision === "FAVORABLE" && !form.commentaire.trim()) {
      setError("Ajoutez une justification si le stock est deja disponible.");
      return;
    }

    if (selectedStep === "TECHNIQUE" && (!form.conformite_technique || !form.verification_stock)) {
      setError("Renseignez toutes les listes techniques avant de valider.");
      return;
    }

    if (selectedStep === "BUDGETAIRE") {
      if (!form.source_financement || !form.ligne_budgetaire) {
        setError("Selectionnez la source de financement et la ligne budgetaire.");
        return;
      }
      if (!form.disponibilite_budgetaire || !form.conformite_financiere || !form.respect_seuils) {
        setError("Renseignez toutes les listes budgetaires avant de valider.");
        return;
      }
      if (!form.solde_disponible_ligne_budgetaire.trim()) {
        setError("Le solde disponible avant marche est obligatoire.");
        return;
      }
      if (remainingBalance < 0 && form.decision !== "DEFAVORABLE") {
        setError("Un solde negatif impose un avis defavorable.");
        return;
      }
      if (form.disponibilite_budgetaire === "NON_DISPONIBLE" && form.decision !== "DEFAVORABLE") {
        setError("La non disponibilite impose un avis defavorable.");
        return;
      }
      if (form.decision === "DEFAVORABLE" && !form.commentaire.trim()) {
        setError("Les observations sont obligatoires pour un avis defavorable.");
        return;
      }
    } else if (
      (form.decision === "DEFAVORABLE" || form.decision === "REJETEE" || form.decision === "A_REVOIR") &&
      !form.commentaire.trim()
    ) {
      setError("Les observations sont obligatoires pour cette decision.");
      return;
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
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="my-4 flex w-full max-w-5xl flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_48px_rgba(15,23,42,0.12)] animate-in zoom-in-95 duration-200"
        style={{ zoom: 0.82 }}
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Validation Budgetaire
              </p>
              <h2 className="text-base font-bold tracking-tight text-slate-900">
                {demande.numero_demande}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200/50 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 bg-slate-50 p-4">
          <div className="flex flex-col items-center justify-between gap-3 rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
            <div className="min-w-0">
              <p className="truncate text-[14px] font-bold text-slate-900" title={demande.objet}>
                {demande.objet}
              </p>
              <div className="mt-1 flex flex-wrap gap-2 text-[11px] font-medium text-slate-600">
                <span className="rounded-md border border-slate-100 bg-slate-50 px-1.5 py-0.5">
                  {getCompactNeedLabel(demande)}
                </span>
                <span className="rounded-md border border-slate-100 bg-slate-50 px-1.5 py-0.5">
                  {typeLabels[demande.type_demande] ?? demande.type_demande}
                </span>
                <span className="rounded-md border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 font-bold text-emerald-700">
                  {formatMoney(demande.cout_total_estime)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenDetail}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-[14px] border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Detail <ExternalLink className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-4 rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Decision
              </p>
              <div className="grid grid-cols-3 gap-2">
                {decisionOptions.map((option) => {
                  const isActive = form.decision === option.value;
                  const tone = toneClasses[option.tone];
                  const isLocked =
                    selectedStep === "BUDGETAIRE" &&
                    (remainingBalance < 0 || form.disponibilite_budgetaire === "NON_DISPONIBLE") &&
                    option.value !== "DEFAVORABLE";

                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={isLocked}
                      onClick={() => setForm((prev) => ({ ...prev, decision: option.value }))}
                      className={`rounded-[14px] border px-3 py-2 text-center transition ${isActive ? tone.active : tone.base} disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      <p className="text-[11px] font-bold">{option.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedStep === "TECHNIQUE" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-700">Conformite technique</span>
                  <PurchaseSelect
                    value={form.conformite_technique}
                    onChange={(value) => setForm((prev) => ({ ...prev, conformite_technique: value }))}
                    options={[...techniqueConformiteOptions]}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-700">Verification stock</span>
                  <PurchaseSelect
                    value={form.verification_stock}
                    onChange={(value) => setForm((prev) => ({ ...prev, verification_stock: value }))}
                    options={[...verificationStockOptions]}
                    className={`w-full rounded-md border px-3 py-1.5 text-sm shadow-sm ${form.verification_stock === "STOCK_DISPONIBLE" ? "border-amber-500 bg-amber-50" : "border-slate-300 bg-white"}`}
                  />
                </div>
              </div>
            )}

            {selectedStep === "BUDGETAIRE" && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                <div className="rounded-[16px] border border-slate-200 bg-slate-50/70 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <p className="text-sm font-semibold text-slate-900">Choix budgetaire</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Source de financement</label>
                      <PurchaseSelect
                        value={form.source_financement}
                        onChange={(value) => {
                          setForm((prev) => ({
                            ...prev,
                            source_financement: value,
                            ligne_budgetaire: "",
                            numero_subvention: "",
                          }));
                        }}
                        options={[...fundingSourceOptions]}
                        className="w-full rounded-[14px] border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Ligne budgetaire</label>
                      <PurchaseSelect
                        value={form.ligne_budgetaire}
                        onChange={(value) => {
                          const next = getCatalogByValue(value);
                          setForm((prev) => ({
                            ...prev,
                            ligne_budgetaire: next.value,
                            numero_subvention: next.subvention,
                          }));
                        }}
                        options={budgetLineCatalog.map((item) => ({ value: item.value, label: item.budgetLabel }))}
                        className="w-full rounded-[14px] border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Numero subvention</label>
                      <input
                        readOnly
                        value={form.numero_subvention}
                        className="w-full rounded-[14px] border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-[16px] border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-sky-500" />
                    <p className="text-sm font-semibold text-slate-900">Analyse budgetaire</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Cout estime</label>
                      <input
                        readOnly
                        value={formatMoney(demande.cout_total_estime)}
                        className="w-full rounded-[14px] border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Solde disponible avant marche</label>
                      <input
                        value={form.solde_disponible_ligne_budgetaire}
                        onChange={(e) => setForm((prev) => ({ ...prev, solde_disponible_ligne_budgetaire: e.target.value }))}
                        placeholder="Ex: 5 000 000"
                        className="w-full rounded-[14px] border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-emerald-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Solde apres engagement</label>
                      <input
                        readOnly
                        value={formatAmountInput(remainingBalance)}
                        className={`w-full rounded-[14px] border px-3 py-2 text-sm font-bold ${remainingBalance < 0 ? "border-rose-300 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Disponibilite budgetaire</label>
                      <PurchaseSelect
                        value={form.disponibilite_budgetaire}
                        onChange={(value) => setForm((prev) => ({ ...prev, disponibilite_budgetaire: value }))}
                        options={[...disponibiliteBudgetaireOptions]}
                        className="w-full rounded-[14px] border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-[16px] border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-violet-500" />
                    <p className="text-sm font-semibold text-slate-900">Controles et decision</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Conformite financiere</label>
                      <PurchaseSelect
                        value={form.conformite_financiere}
                        onChange={(value) => setForm((prev) => ({ ...prev, conformite_financiere: value }))}
                        options={[...conformiteFinanciereOptions]}
                        className="w-full rounded-[14px] border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Respect des seuils</label>
                      <PurchaseSelect
                        value={form.respect_seuils}
                        onChange={(value) => setForm((prev) => ({ ...prev, respect_seuils: value }))}
                        options={[...respectSeuilsOptions]}
                        className="w-full rounded-[14px] border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Avis financier</label>
                      <input
                        readOnly
                        value={decisionOptions.find((item) => item.value === form.decision)?.label ?? form.decision}
                        className={`w-full rounded-[14px] border px-3 py-2 text-sm font-bold ${form.decision === "DEFAVORABLE" ? "border-rose-300 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Numero engagement</label>
                      <input
                        readOnly
                        value={form.decision === "FAVORABLE" ? form.numero_engagement_budgetaire : "Genere si avis favorable"}
                        className="w-full rounded-[14px] border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-500"
                      />
                    </div>
                  </div>
                </div>

                {remainingBalance < 0 && (
                  <div className="rounded-[14px] border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">
                    Depassement budgetaire detecte. Un avis defavorable est requis.
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-slate-600">Observations</span>
              <textarea
                value={form.commentaire}
                onChange={(e) => setForm((prev) => ({ ...prev, commentaire: e.target.value }))}
                placeholder="Renseignez vos observations ici..."
                className="min-h-[56px] w-full resize-none rounded-[14px] border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
              />
            </div>

            {error && (
              <p className="rounded-[14px] border border-rose-100 bg-rose-50 p-2.5 text-xs font-semibold text-rose-600">
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-[14px] px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-[14px] bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-md transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? "..." : "Valider la decision"}
          </button>
        </div>
      </div>
    </div>
  );
}
