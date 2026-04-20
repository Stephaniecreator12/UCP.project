"use client";

import { useEffect, useState } from "react";
import { X, Lock, CheckCircle, Star } from "lucide-react";
import { DemandeAchat, CloseDemandePayload, closeDemandeAchat } from "@/services/achats";
import { getCompactNeedLabel } from "@/app/demande-achat/components/demandeAchatShared";
import PurchaseSelect from "@/app/demande-achat/components/PurchaseSelect";

type ClotureModalProps = {
  demande: DemandeAchat | null;
  open: boolean;
  onClose: () => void;
  onOpenDetail: () => void;
  onSuccess: () => void;
};

const statutFinalOptions = [
  { value: "CLOTURE", label: "Clôturé avec succès" },
  { value: "PARTIELLEMENT_EXECUTE", label: "Partiellement exécuté" },
  { value: "ANNULE", label: "Annulé" },
] as const;

export default function ClotureModal({
  demande,
  open,
  onClose,
  onOpenDetail,
  onSuccess,
}: ClotureModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dateCloture, setDateCloture] = useState("");
  const [statutFinal, setStatutFinal] = useState<CloseDemandePayload["statut_final"] | "">("");
  const [niveauSatisfaction, setNiveauSatisfaction] = useState<number>(0);
  const [commentairesFinaux, setCommentairesFinaux] = useState("");

  useEffect(() => {
    if (open && demande) {
      const today = new Date().toISOString().split("T")[0];
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDateCloture(demande.date_cloture || today);
      setStatutFinal((demande.statut_final as CloseDemandePayload["statut_final"]) || "");
      setNiveauSatisfaction(demande.niveau_satisfaction || 0);
      setCommentairesFinaux(demande.commentaires_finaux || "");
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

    if (niveauSatisfaction === 0) {
      setError("Veuillez donner une note de satisfaction.");
      return;
    }
    if (!statutFinal) {
      setError("Veuillez sélectionner le statut de clôture.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await closeDemandeAchat(demande.id, {
        date_cloture: dateCloture || undefined,
        statut_final: statutFinal,
        niveau_satisfaction: niveauSatisfaction,
        commentaires_finaux: commentairesFinaux,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la clôture de la demande");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="flex w-full max-w-xl flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.16)] ring-1 ring-black/5 animate-in zoom-in-95 duration-200"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-5 py-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-slate-700" />
            <h2 className="text-base font-bold tracking-tight text-slate-900">Clôture finale : {demande.numero_demande}</h2>
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
        <div className="flex-1 min-h-0 space-y-4 bg-slate-50 p-4">
          
          <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:flex-row">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 truncate" title={demande.objet}>{demande.objet}</p>
              <div className="mt-0.5 flex flex-wrap gap-2 text-[11px] text-slate-600 font-medium">
                <span className="bg-slate-50 px-1.5 py-0.5 rounded-xl border border-slate-100">{getCompactNeedLabel(demande)}</span>
                <span className="bg-slate-50 px-1.5 py-0.5 rounded-xl border border-slate-100 italic">Commande: {demande.numero_bon_commande || "-"}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenDetail}
              className="shrink-0 rounded-xl bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors shadow-sm"
            >
              Détail
            </button>
          </div>

          <form id="cloture-form" onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
               <p className="mb-3 border-b border-slate-100 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Section 9 : Clôture finale
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Date de clôture</label>
                <input
                  type="date"
                  required
                  value={dateCloture}
                  onChange={(e) => setDateCloture(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm shadow-sm transition-colors outline-none focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Statut de la clôture</label>
                <PurchaseSelect
                  value={statutFinal}
                  onChange={(value) => setStatutFinal(value as CloseDemandePayload["statut_final"])}
                  options={[...statutFinalOptions]}
                  placeholder="Sélectionner..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm shadow-sm transition-colors outline-none focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-100"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 pt-2">
              <label className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Niveau de satisfaction globale</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNiveauSatisfaction(star)}
                    className="group transition-transform active:scale-95"
                  >
                    <Star 
                      className={`h-8 w-8 transition-colors ${star <= niveauSatisfaction ? "fill-amber-400 text-amber-500" : "fill-slate-100 text-slate-300 group-hover:fill-amber-100 group-hover:text-amber-200"}`} 
                    />
                  </button>
                ))}
                <span className="ml-3 text-xs font-bold text-slate-500">
                  {niveauSatisfaction === 0 ? "Non noté" : `${niveauSatisfaction} / 5`}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Commentaires et retour d&apos;expérience</label>
              <textarea
                value={commentairesFinaux}
                onChange={(e) => setCommentairesFinaux(e.target.value)}
                className="min-h-[88px] w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm shadow-sm transition-colors outline-none focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-100"
                placeholder="Renseignez le retour d&apos;expérience, les points positifs et les difficultés rencontrées..."
              />
            </div>
            
            {error && (
              <p className="text-xs font-medium text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100">
                {error}
              </p>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
            <button
              onClick={onClose}
              disabled={saving}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="cloture-form"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-6 py-2 text-sm font-bold text-white hover:bg-slate-900 shadow-md transition-colors disabled:opacity-60"
            >
              {saving ? (
                <>Archivage...</>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  Valider Clôture
                </>
              )}
            </button>
        </div>

      </div>
    </div>
  );
}
