"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, Package } from "lucide-react";
import { DemandeAchat, IssueOrderPayload, issueOrderDemandeAchat, listFournisseurs, Fournisseur } from "@/services/achats";
import { formatMoney, getCompactNeedLabel } from "@/app/demande-achat/components/demandeAchatShared";
import PurchaseSelect from "@/app/demande-achat/components/PurchaseSelect";
import { FRENCH_DATE_INPUT_PROPS } from "@/lib/date";

type PassationFormState = Omit<IssueOrderPayload, "type_procedure" | "delai_livraison_contractuel" | "fournisseur"> & {
  type_procedure: IssueOrderPayload["type_procedure"] | "";
  fournisseur: number | "";
  delai_livraison_contractuel: number | "";
};

type PassationModalProps = {
  demande: DemandeAchat | null;
  open: boolean;
  onClose: () => void;
  onOpenDetail: () => void;
  onSuccess: () => void;
};

const initialFormState: PassationFormState = {
  type_procedure: "",
  fournisseur: "",
  fournisseur_retenu: "",
  email_fournisseur: "",
  numero_bon_commande: "",
  date_bon_commande: "",
  montant_commande: "",
  delai_livraison_contractuel: "",
  conditions_livraison: "",
  garantie: "",
};

const procedureOptions = [
  { value: "DEMANDE_COTATION", label: "Demande de cotation" },
  { value: "BON_COMMANDE_DIRECT", label: "Bon de commande direct" },
  { value: "SELECTION_APRES_COTATION", label: "Sélection après cotation" },
] as const;

const getTodayDate = () => new Date().toISOString().split("T")[0];

export default function PassationModal({
  demande,
  open,
  onClose,
  onOpenDetail,
  onSuccess,
}: PassationModalProps) {
  const [form, setForm] = useState<PassationFormState>(initialFormState);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loadingFournisseurs, setLoadingFournisseurs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fieldLabelClass = "text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500";

  useEffect(() => {
    if (open && demande) {
      setForm({
        ...initialFormState,
        montant_commande: demande.cout_total_estime,
      });
      setError(null);
      
      const loadFournisseurs = async () => {
        setLoadingFournisseurs(true);
        try {
          const data = await listFournisseurs();
          setFournisseurs(data);
        } catch (err) {
          console.error("Erreur chargement fournisseurs:", err);
        } finally {
          setLoadingFournisseurs(false);
        }
      };
      loadFournisseurs();
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
    if (
      !form.fournisseur ||
      !form.date_bon_commande ||
      form.delai_livraison_contractuel === ""
    ) {
      setError("Veuillez remplir les informations obligatoires concernant le bon de commande.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await issueOrderDemandeAchat(demande.id, {
        ...form,
        type_procedure: form.type_procedure as IssueOrderPayload["type_procedure"],
        fournisseur: Number(form.fournisseur),
        delai_livraison_contractuel: Number(form.delai_livraison_contractuel),
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création de la commande");
      setSaving(false);
    }
  };

  const handleFournisseurChange = (id: string) => {
    const fId = Number(id);
    const selected = fournisseurs.find(f => f.id === fId);
    if (selected) {
      setForm({
        ...form,
        fournisseur: fId,
        fournisseur_retenu: selected.nom,
        email_fournisseur: selected.email,
      });
    } else {
      setForm({
        ...form,
        fournisseur: "",
        fournisseur_retenu: "",
        email_fournisseur: "",
      });
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
        className="flex w-full max-w-4xl flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.16)] animate-in zoom-in-95 duration-200"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-5 py-4">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-sky-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Passation : Commande {demande.numero_demande}</h2>
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
          
          <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:flex-row">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-bold text-slate-900" title={demande.objet}>{demande.objet}</p>
              <div className="mt-1 flex flex-wrap gap-2 text-[11px] font-medium text-slate-600">
                <span className="rounded-md border border-slate-100 bg-slate-50 px-1.5 py-0.5">{getCompactNeedLabel(demande)}</span>
                <span className="rounded-md border border-sky-100 bg-sky-50 px-1.5 py-0.5 font-bold text-sky-700">{formatMoney(demande.cout_total_estime)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenDetail}
              className="inline-flex shrink-0 items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Voir détail
            </button>
          </div>

          <form id="passation-form" onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
               <p className="mb-2 border-b border-slate-100 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Section 7 : Passation et Commande
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label className={fieldLabelClass}>Type de procédure</label>
                <PurchaseSelect
                  value={form.type_procedure}
                  onChange={(value) => setForm({ ...form, type_procedure: value as IssueOrderPayload["type_procedure"] })}
                  options={[...procedureOptions]}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm shadow-sm transition-colors outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={fieldLabelClass}>Sélection Fournisseur</label>
                <PurchaseSelect
                  value={form.fournisseur.toString()}
                  onChange={handleFournisseurChange}
                  options={fournisseurs.map(f => ({ value: f.id.toString(), label: f.nom }))}
                  placeholder={loadingFournisseurs ? "Chargement..." : "Choisir un fournisseur..."}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm shadow-sm transition-colors outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={fieldLabelClass}>Email fournisseur</label>
                <input
                  type="email"
                  readOnly
                  value={form.email_fournisseur}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-500 shadow-sm outline-none cursor-not-allowed"
                  placeholder="contact@fournisseur.com"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={fieldLabelClass}>N° bon de commande</label>
                <div className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm font-mono text-slate-500 shadow-sm">
                  {demande.numero_bon_commande || (demande.numero_demande ? demande.numero_demande.replace("DA", "BC") : "Généré automatiquement")}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={fieldLabelClass}>Date bon de commande</label>
                <input
                  type="date"
                  min={getTodayDate()}
                  required
                  value={form.date_bon_commande || ""}
                  onChange={(e) => setForm({ ...form, date_bon_commande: e.target.value })}
                  {...FRENCH_DATE_INPUT_PROPS}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm shadow-sm transition-colors outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={fieldLabelClass}>Montant commandé</label>
                <input
                  type="number"
                  required
                  value={form.montant_commande}
                  onChange={(e) => setForm({ ...form, montant_commande: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm shadow-sm transition-colors outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                  placeholder="Montant total TTC"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={fieldLabelClass}>Délai livraison contractuel (Jours)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={form.delai_livraison_contractuel}
                  onChange={(e) => setForm({ ...form, delai_livraison_contractuel: e.target.value === "" ? "" : Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm shadow-sm transition-colors outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                  placeholder="Nombre de jours"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={fieldLabelClass}>Conditions de livraison</label>
                <input
                  value={form.conditions_livraison || ""}
                  onChange={(e) => setForm({ ...form, conditions_livraison: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm shadow-sm transition-colors outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                  placeholder="Livraison sur site / Retrait"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={fieldLabelClass}>Garantie</label>
                <input
                  value={form.garantie || ""}
                  onChange={(e) => setForm({ ...form, garantie: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm shadow-sm transition-colors outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                  placeholder="Durée et conditions"
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
              form="passation-form"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-2 text-sm font-bold text-white hover:bg-sky-700 shadow-md transition-colors disabled:opacity-60"
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
