"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, Package } from "lucide-react";
import { DemandeAchat, IssueOrderPayload, issueOrderDemandeAchat } from "@/services/achats";
import { formatMoney, getCompactNeedLabel } from "@/app/demande-achat/components/demandeAchatShared";
import PurchaseSelect from "@/app/demande-achat/components/PurchaseSelect";

type PassationModalProps = {
  demande: DemandeAchat | null;
  open: boolean;
  onClose: () => void;
  onOpenDetail: () => void;
  onSuccess: () => void;
};

const initialFormState: IssueOrderPayload = {
  type_procedure: "BON_COMMANDE_DIRECT",
  fournisseur_retenu: "",
  numero_bon_commande: "",
  date_bon_commande: "",
  montant_commande: "",
  delai_livraison_contractuel: 0,
  conditions_livraison: "",
  garantie: "",
};

const procedureOptions = [
  { value: "DEMANDE_COTATION", label: "Demande de cotation" },
  { value: "BON_COMMANDE_DIRECT", label: "Bon de commande direct" },
  { value: "SELECTION_APRES_COTATION", label: "Sélection après cotation" },
] as const;

export default function PassationModal({
  demande,
  open,
  onClose,
  onOpenDetail,
  onSuccess,
}: PassationModalProps) {
  const [form, setForm] = useState<IssueOrderPayload>(initialFormState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && demande) {
      setForm({
        ...initialFormState,
        montant_commande: demande.cout_total_estime,
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

    if (!form.fournisseur_retenu.trim() || !form.numero_bon_commande?.trim() || !form.date_bon_commande) {
      setError("Veuillez remplir les informations obligatoires concernant le bon de commande.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await issueOrderDemandeAchat(demande.id, {
        ...form,
        delai_livraison_contractuel: Number(form.delai_livraison_contractuel),
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création de la commande");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] bg-slate-900/40 p-4 flex items-start justify-center overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="my-8 flex w-full max-w-5xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl animate-in zoom-in-95 duration-200"
        style={{ zoom: 0.8 }}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-sky-600" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Passation : Commande {demande.numero_demande}</h2>
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
        <div className="flex-1 bg-slate-50 p-5 space-y-4">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-sky-100 bg-sky-50/50 p-4 shadow-sm">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-sky-900 truncate" title={demande.objet}>{demande.objet}</p>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-sky-700">
                <span>{getCompactNeedLabel(demande)}</span>
                <span className="border-l border-sky-200 pl-3 font-semibold">{formatMoney(demande.cout_total_estime)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenDetail}
              className="shrink-0 rounded-lg bg-white border border-sky-200 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-50 hover:border-sky-300 transition-colors shadow-sm"
            >
              Voir détail
            </button>
          </div>

          <form id="passation-form" onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
            <div>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                Section 7 : Passation et Commande
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Type de procédure</label>
                <PurchaseSelect
                  value={form.type_procedure}
                  onChange={(value) => setForm({ ...form, type_procedure: value as IssueOrderPayload["type_procedure"] })}
                  options={[...procedureOptions]}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm shadow-sm transition-colors outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Fournisseur retenu</label>
                <input
                  required
                  value={form.fournisseur_retenu}
                  onChange={(e) => setForm({ ...form, fournisseur_retenu: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 focus:bg-white py-2 px-3 text-sm shadow-sm transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                  placeholder="Nom du fournisseur"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">N° bon de commande</label>
                <input
                  required
                  value={form.numero_bon_commande || ""}
                  onChange={(e) => setForm({ ...form, numero_bon_commande: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 focus:bg-white py-2 px-3 text-sm shadow-sm transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none font-mono"
                  placeholder="UCP/BC/YYYY/XXXXX"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Date bon de commande</label>
                <input
                  type="date"
                  required
                  value={form.date_bon_commande || ""}
                  onChange={(e) => setForm({ ...form, date_bon_commande: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 focus:bg-white py-2 px-3 text-sm shadow-sm transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Montant commandé</label>
                <input
                  type="number"
                  required
                  value={form.montant_commande}
                  onChange={(e) => setForm({ ...form, montant_commande: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 focus:bg-white py-2 px-3 text-sm shadow-sm transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                  placeholder="Montant total TTC"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Délai livraison contractuel (Jours)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={form.delai_livraison_contractuel}
                  onChange={(e) => setForm({ ...form, delai_livraison_contractuel: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 focus:bg-white py-2 px-3 text-sm shadow-sm transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Conditions de livraison</label>
                <input
                  value={form.conditions_livraison || ""}
                  onChange={(e) => setForm({ ...form, conditions_livraison: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 focus:bg-white py-2 px-3 text-sm shadow-sm transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                  placeholder="Livraison sur site / Retrait"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Garantie</label>
                <input
                  value={form.garantie || ""}
                  onChange={(e) => setForm({ ...form, garantie: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 focus:bg-white py-2 px-3 text-sm shadow-sm transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                  placeholder="Durée et conditions"
                />
              </div>
            </div>
            
            {error && (
              <p className="text-xs font-medium text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100">
                {error}
              </p>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-white px-5 py-4 flex items-center justify-between">
            <button
              onClick={onClose}
              disabled={saving}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="passation-form"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-6 py-2 text-sm font-bold text-white hover:bg-sky-700 shadow-md transition-colors disabled:opacity-60"
            >
              {saving ? (
                <>Enregistrement...</>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Créer le bon de commande
                </>
              )}
            </button>
        </div>

      </div>
    </div>
  );
}
