"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Landmark, X } from "lucide-react";

import PurchaseSelect from "@/app/demande-achat/components/PurchaseSelect";
import {
  BudgetEstimationPayload,
  DemandeAchat,
  budgetDemandeAchat,
} from "@/services/achats";
import {
  formatMoney,
  getCompactNeedLabel,
} from "@/app/demande-achat/components/demandeAchatShared";

type BudgetModalProps = {
  demande: DemandeAchat | null;
  open: boolean;
  onClose: () => void;
  onOpenDetail: () => void;
  onSuccess: () => void;
};

const budgetLineOptions = [
  { value: "2.1.1 Fournitures bureau", label: "2.1.1 Fournitures bureau" },
  { value: "2.2.1 Materiel informatique", label: "2.2.1 Matériel informatique" },
  { value: "3.1.1 Services", label: "3.1.1 Services" },
] as const;

const fundingSourceOptions = [
  { value: "FONDS_MONDIAL", label: "Fonds mondial" },
  { value: "BANQUE_MONDIALE", label: "Banque mondiale" },
  { value: "GAVI", label: "Alliance Gavi" },
] as const;

const mockBudgetByLine: Record<string, Record<BudgetEstimationPayload["source_financement"], number>> = {
  "2.1.1 Fournitures bureau": {
    FONDS_MONDIAL: 3200000,
    BANQUE_MONDIALE: 2800000,
    GAVI: 1800000,
  },
  "2.2.1 Materiel informatique": {
    FONDS_MONDIAL: 9500000,
    BANQUE_MONDIALE: 12000000,
    GAVI: 4500000,
  },
  "3.1.1 Services": {
    FONDS_MONDIAL: 6400000,
    BANQUE_MONDIALE: 7100000,
    GAVI: 3900000,
  },
};

const subventionPrefixes: Record<BudgetEstimationPayload["source_financement"], string> = {
  FONDS_MONDIAL: "FM",
  BANQUE_MONDIALE: "BM",
  GAVI: "GAVI",
};

const buildInitialForm = (
  demande: DemandeAchat | null,
): BudgetEstimationPayload => ({
  ligne_budgetaire:
    demande?.ligne_budgetaire?.trim() || budgetLineOptions[0].value,
  source_financement:
    (demande?.source_financement as BudgetEstimationPayload["source_financement"]) ||
    "FONDS_MONDIAL",
});

const getMockBalance = (ligneBudgetaire: string, sourceFinancement: BudgetEstimationPayload["source_financement"]) =>
  mockBudgetByLine[ligneBudgetaire]?.[sourceFinancement] ?? 2500000;

export default function BudgetModal({
  demande,
  open,
  onClose,
  onOpenDetail,
  onSuccess,
}: BudgetModalProps) {
  const [form, setForm] = useState<BudgetEstimationPayload>(() =>
    buildInitialForm(demande),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(buildInitialForm(demande));
      setError(null);
      setSaving(false);
    }
  }, [demande, open]);

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

  const coutEstime = Number(demande?.cout_total_estime || 0);
  const soldeDisponible = useMemo(
    () => getMockBalance(form.ligne_budgetaire, form.source_financement),
    [form.ligne_budgetaire, form.source_financement],
  );
  const soldeApresEngagement = soldeDisponible - coutEstime;
  const numeroSubvention = useMemo(() => {
    const year = new Date().getFullYear();
    return `SUBV/${subventionPrefixes[form.source_financement]}/${year}`;
  }, [form.source_financement]);

  if (!open || !demande) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!demande) return;

    if (!form.ligne_budgetaire.trim()) {
      setError("La ligne budgétaire est obligatoire.");
      return;
    }

    if (soldeApresEngagement < 0) {
      setError("Le solde disponible est insuffisant pour engager cette demande.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await budgetDemandeAchat(demande.id, form);
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la validation budgétaire.",
      );
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="my-8 flex w-full max-w-5xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl animate-in zoom-in-95 duration-200"
        style={{ zoom: 0.8 }}
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-3">
            <Landmark className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Finance : {demande.numero_demande}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded bg-slate-200/50 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 bg-slate-50 p-5">
          <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-amber-100 bg-amber-50/60 p-4 shadow-sm sm:flex-row">
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-sm font-semibold text-amber-900"
                title={demande.objet}
              >
                {demande.objet}
              </p>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-amber-700">
                <span>{getCompactNeedLabel(demande)}</span>
                <span className="border-l border-amber-200 pl-3 font-semibold">
                  {formatMoney(demande.cout_total_estime)}
                </span>
                <span className="border-l border-amber-200 pl-3">
                  Validation finale terminée
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenDetail}
              className="shrink-0 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-bold text-amber-700 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50"
            >
              Voir détail
            </button>
          </div>

          <form
            id="budget-form"
            onSubmit={handleSubmit}
            className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div>
              <p className="mb-4 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                Section 4 : Estimation financière et budget
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Ligne budgétaire
                </label>
                <PurchaseSelect
                  value={form.ligne_budgetaire}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      ligne_budgetaire: value,
                    }))
                  }
                  options={[...budgetLineOptions]}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm shadow-sm outline-none transition-colors focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Source de financement
                </label>
                <PurchaseSelect
                  value={form.source_financement}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      source_financement:
                        value as BudgetEstimationPayload["source_financement"],
                    }))
                  }
                  options={[...fundingSourceOptions]}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm shadow-sm outline-none transition-colors focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  N° subvention
                </label>
                <input
                  readOnly
                  value={numeroSubvention}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Coût estimé
                </label>
                <input
                  readOnly
                  value={formatMoney(demande.cout_total_estime)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Solde disponible ligne budgétaire
                </label>
                <input
                  readOnly
                  value={formatMoney(soldeDisponible)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Engagement budgétaire
                </label>
                <input
                  readOnly
                  value={demande.numero_engagement_budgetaire || "Généré après validation"}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm outline-none"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Vérification auto
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  Solde après engagement
                </p>
                <p
                  className={`mt-1 text-lg font-black ${
                    soldeApresEngagement < 0 ? "text-rose-600" : "text-emerald-700"
                  }`}
                >
                  {formatMoney(soldeApresEngagement)}
                </p>
              </div>
              <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/70 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                  Rappel
                </p>
                <p className="mt-2 text-sm leading-relaxed text-amber-900">
                  Cette validation budgétaire place le dossier dans le statut
                  “Validé budgétairement”, puis le transmet à la passation.
                </p>
              </div>
            </div>

            {error ? (
              <p className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-xs font-medium text-rose-600">
                {error}
              </p>
            ) : null}
          </form>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-4">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="budget-form"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-6 py-2 text-sm font-bold text-white shadow-md transition-colors hover:bg-amber-700 disabled:opacity-60"
          >
            {saving ? (
              <>Enregistrement...</>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Valider le budget
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
