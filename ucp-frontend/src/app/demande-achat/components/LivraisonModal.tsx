"use client";

import { useEffect, useState } from "react";
import { X, Truck, CheckCircle } from "lucide-react";
import { DemandeAchat, UpdateDeliveryPayload, updateDeliveryDemandeAchat } from "@/services/achats";
import { getCompactNeedLabel } from "@/app/demande-achat/components/demandeAchatShared";
import PurchaseSelect from "@/app/demande-achat/components/PurchaseSelect";
import { FRENCH_DATE_INPUT_PROPS } from "@/lib/date";

type LivraisonModalProps = {
  demande: DemandeAchat | null;
  open: boolean;
  onClose: () => void;
  onOpenDetail: () => void;
  onSuccess: () => void;
};

type DeliveryFormState = Omit<UpdateDeliveryPayload, "etat_expedition"> & {
  etat_expedition: UpdateDeliveryPayload["etat_expedition"] | "";
};

const initialFormState: DeliveryFormState = {
  etat_expedition: "",
  date_arrivee_prevue: "",
  date_arrivee_effective: "",
};

const getTodayDate = () => new Date().toISOString().split("T")[0];

const expeditionOptions = [
  { value: "EN_TRANSIT", label: "En transit" },
  { value: "ARRIVE", label: "Arrivé sur site" },
  { value: "PARTIEL", label: "Arrivée partielle" },
  { value: "RETARD", label: "En retard" },
] as const;

export default function LivraisonModal({
  demande,
  open,
  onClose,
  onOpenDetail,
  onSuccess,
}: LivraisonModalProps) {
  const [form, setForm] = useState<DeliveryFormState>(initialFormState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && demande) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        etat_expedition: (demande.etat_expedition as UpdateDeliveryPayload["etat_expedition"]) || "",
        date_arrivee_prevue: demande.date_arrivee_prevue || demande.date_livraison_prevue || "",
        date_arrivee_effective: demande.date_arrivee_effective || "",
      });
      setError(null);
    }
  }, [open, demande]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", handleKeyDown); };
  }, [onClose, open]);

  if (!open || !demande) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demande) return;
    if (!form.etat_expedition) {
      setError("Veuillez sélectionner l'état de l'expédition.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateDeliveryDemandeAchat(demande.id, {
        etat_expedition: form.etat_expedition as UpdateDeliveryPayload["etat_expedition"],
        date_arrivee_prevue: form.date_arrivee_prevue || undefined,
        date_arrivee_effective: form.date_arrivee_effective || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour de la livraison");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="flex w-full max-w-xl flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.16)] animate-in zoom-in-95 duration-200"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-5 py-4">
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Marché : Suivi expédition {demande.numero_demande}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200/50 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-3 bg-slate-50 p-4">
          
          <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3.5 shadow-sm sm:flex-row">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-indigo-900 truncate" title={demande.objet}>{demande.objet}</p>
              <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-indigo-700">
                <span>{getCompactNeedLabel(demande)}</span>
                <span className="border-l border-indigo-200 pl-3">Fournisseur : {demande.fournisseur_retenu || "-"}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenDetail}
              className="shrink-0 rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-[11px] font-bold text-indigo-700 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50"
            >
              Voir détail
            </button>
          </div>

          <form id="livraison-form" onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
               <p className="mb-3 border-b border-slate-100 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Section 8.1 : Suivi expédition
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">État expédition</label>
                <PurchaseSelect
                  value={form.etat_expedition}
                  onChange={(value) => setForm({ ...form, etat_expedition: value as UpdateDeliveryPayload["etat_expedition"] })}
                  options={[...expeditionOptions]}
                  placeholder="Sélectionner..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm shadow-sm transition-colors outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Date arrivée prévue</label>
                <input
                  type="date"
                  min={getTodayDate()}
                  value={form.date_arrivee_prevue || ""}
                  onChange={(e) => setForm({ ...form, date_arrivee_prevue: e.target.value })}
                  {...FRENCH_DATE_INPUT_PROPS}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm shadow-sm transition-colors outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Date arrivée effective</label>
                <input
                  type="date"
                  min={getTodayDate()}
                  value={form.date_arrivee_effective || ""}
                  onChange={(e) => setForm({ ...form, date_arrivee_effective: e.target.value })}
                  {...FRENCH_DATE_INPUT_PROPS}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm shadow-sm transition-colors outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
            
            {error && <p className="ucp-inline-notice ucp-inline-notice--error">{error}</p>}
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-white px-5 py-4 flex items-center justify-between">
            <button
              onClick={onClose}
              disabled={saving}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="livraison-form"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2 text-sm font-bold text-white hover:bg-indigo-700 shadow-md transition-colors disabled:opacity-60"
            >
              {saving ? (
                <>Enregistrement...</>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Enregistrer le suivi
                </>
              )}
            </button>
        </div>

      </div>
    </div>
  );
}
