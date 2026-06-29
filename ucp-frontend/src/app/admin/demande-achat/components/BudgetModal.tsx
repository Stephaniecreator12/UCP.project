"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Landmark, X } from "lucide-react";

import PurchaseSelect from "@/app/admin/demande-achat/components/PurchaseSelect";
import {
  BudgetEstimationPayload,
  DemandeAchat,
  budgetDemandeAchat,
} from "@/services/achats";
import {
  formatMoney,
  getCompactNeedLabel,
} from "@/app/admin/demande-achat/components/demandeAchatShared";

type BudgetModalProps = {
  demande: DemandeAchat | null;
  open: boolean;
  onClose: () => void;
  onOpenDetail: () => void;
  onSuccess: () => void;
};

type BudgetFormState = {
  ligne_budgetaire: string;
  source_financement: BudgetEstimationPayload["source_financement"] | "";
};

const budgetLineOptions = [
  { value: "2.1.1 Fournitures bureau", label: "2.1.1 Fournitures bureau" },
  { value: "2.2.1 Materiel informatique", label: "2.2.1 Matériel informatique" },
  { value: "3.1.1 Services", label: "3.1.1 Services" },
] as const;

const fundingSourceOptions = [
  { value: "SRPS_CS7_FM", label: "SRPS / CS7 / Fonds Mondial" },
  { value: "RSS3_GAVI", label: "RSS3 / Alliance GAVI" },
  { value: "FAE_GAVI", label: "FAE / Alliance GAVI" },
  { value: "CDS_GAVI", label: "CDS / Alliance GAVI" },
  { value: "VAR_GAVI", label: "VAR / Alliance GAVI" },
  { value: "PARN2_BM", label: "PARN2 / Banque Mondiale" },
  { value: "PPSB_BM", label: "PPSB / Banque Mondiale" },
] as const;

const mockBudgetByLine: Record<string, Record<BudgetEstimationPayload["source_financement"], number>> = {
  "2.1.1 Fournitures bureau": {
    SRPS_CS7_FM: 3200000,
    RSS3_GAVI: 1800000,
    FAE_GAVI: 1000000,
    CDS_GAVI: 1000000,
    VAR_GAVI: 1000000,
    PARN2_BM: 2800000,
    PPSB_BM: 2000000,
  },
  "2.2.1 Materiel informatique": {
    SRPS_CS7_FM: 9500000,
    RSS3_GAVI: 4500000,
    FAE_GAVI: 2000000,
    CDS_GAVI: 2000000,
    VAR_GAVI: 2000000,
    PARN2_BM: 12000000,
    PPSB_BM: 8000000,
  },
  "3.1.1 Services": {
    SRPS_CS7_FM: 6400000,
    RSS3_GAVI: 3900000,
    FAE_GAVI: 1500000,
    CDS_GAVI: 1500000,
    VAR_GAVI: 1500000,
    PARN2_BM: 7100000,
    PPSB_BM: 5000000,
  },
};

const subventionNames: Record<BudgetEstimationPayload["source_financement"], string> = {
  SRPS_CS7_FM: "MDG - S MOH 4041",
  RSS3_GAVI: "MDG - HSS - 3",
  FAE_GAVI: "MDG - FAE",
  CDS_GAVI: "MDG - COVID19 - CDS",
  VAR_GAVI: "MDG - VAR Camp",
  PARN2_BM: "P175110, PAD 4924",
  PPSB_BM: "P174903",
};

const buildInitialForm = (
  demande: DemandeAchat | null,
): BudgetFormState => ({
  ligne_budgetaire:
    demande?.ligne_budgetaire?.trim() || "",
  source_financement:
    (demande?.source_financement as BudgetEstimationPayload["source_financement"]) ||
    "",
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
  const [form, setForm] = useState<BudgetFormState>(() =>
    buildInitialForm(demande),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    () =>
      form.ligne_budgetaire && form.source_financement
        ? getMockBalance(
            form.ligne_budgetaire,
            form.source_financement as BudgetEstimationPayload["source_financement"],
          )
        : 0,
    [form.ligne_budgetaire, form.source_financement],
  );
  const soldeApresEngagement = soldeDisponible - coutEstime;
  const numeroSubvention = useMemo(() => {
    return form.source_financement ? subventionNames[form.source_financement] : "-";
  }, [form.source_financement]);

  if (!open || !demande) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!demande) return;

    if (!form.ligne_budgetaire.trim() || !form.source_financement) {
      setError("La ligne budgétaire et la source de financement sont obligatoires.");
      return;
    }


    setSaving(true);
    setError(null);
    try {
      await budgetDemandeAchat(demande.id, {
        ligne_budgetaire: form.ligne_budgetaire,
        source_financement: form.source_financement as BudgetEstimationPayload["source_financement"],
      });
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
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="flex w-full max-w-4xl flex-col rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.16)] animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-5 py-4">
          <div className="flex items-center gap-3">
            <Landmark className="h-5 w-5 text-amber-600" />
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              Finance : {demande.numero_demande}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200/50 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3 bg-slate-50 p-4">
          <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-amber-50/60 p-3.5 shadow-sm sm:flex-row">
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-sm font-semibold text-amber-900"
                title={demande.objet}
              >
                {demande.objet}
              </p>
              <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-amber-700">
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
              className="shrink-0 rounded-xl border border-amber-200 bg-white px-3 py-1.5 text-[11px] font-bold text-amber-700 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50"
            >
              Voir détail
            </button>
          </div>

          <form
            id="budget-form"
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div>
              <p className="mb-3 border-b border-slate-100 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Section 4 : Estimation financière et budget
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
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
                  placeholder="Sélectionner..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm shadow-sm outline-none transition-colors focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
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
                  placeholder="Sélectionner..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm shadow-sm outline-none transition-colors focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  N° subvention
                </label>
                <input
                  readOnly
                  value={numeroSubvention}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-600 shadow-sm outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Coût estimé
                </label>
                <input
                  readOnly
                  value={formatMoney(demande.cout_total_estime)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-600 shadow-sm outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Solde disponible ligne budgétaire
                </label>
                <input
                  readOnly
                  value={formatMoney(soldeDisponible)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-600 shadow-sm outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Engagement budgétaire
                </label>
                <input
                  readOnly
                  value={demande.numero_engagement_budgetaire || "Généré après validation"}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-600 shadow-sm outline-none"
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
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
              <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/70 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
                  Rappel
                </p>
                <p className="mt-2 text-sm leading-relaxed text-amber-900">
                  Cette validation budgétaire place le dossier dans le statut
                  “Validé budgétairement”, puis le transmet à la passation.
                </p>
              </div>
            </div>

            {error ? <p className="ucp-inline-notice ucp-inline-notice--error">{error}</p> : null}
          </form>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-4">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="budget-form"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-2 text-sm font-bold text-white shadow-md transition-colors hover:bg-amber-700 disabled:opacity-60"
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
