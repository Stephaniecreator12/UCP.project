"use client";

import { useEffect, useState } from "react";
import { X, AlertCircle, CheckCircle, Calendar, MessageSquare, ShieldAlert } from "lucide-react";
import { DemandeAchat, ResolveReceptionIssuePayload, resolveReceptionIssueDemandeAchat } from "@/services/achats";
import { toDisplayLabel } from "@/app/admin/demande-achat/components/demandeAchatShared";
import { FRENCH_DATE_INPUT_PROPS } from "@/lib/date";

const getTodayDate = () => new Date().toISOString().split("T")[0];

type ResolveIssueModalProps = {
  demande: DemandeAchat | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ResolveIssueModal({
  demande,
  open,
  onClose,
  onSuccess,
}: ResolveIssueModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateResolution, setDateResolution] = useState("");
  const [suiviResolution, setSuiviResolution] = useState("");

  useEffect(() => {
    if (open && demande) {
      const today = getTodayDate();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDateResolution(today);
      setSuiviResolution("");
      setError(null);
    }
  }, [open, demande]);

  if (!open || !demande) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: ResolveReceptionIssuePayload = {
      date_resolution: dateResolution,
      suivi_resolution: suiviResolution,
    };

    try {
      await resolveReceptionIssueDemandeAchat(demande.id, payload);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la résolution");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-300"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="w-full max-w-xl overflow-hidden rounded-[32px] border border-white/20 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] animate-in zoom-in-95 duration-300"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-amber-50/60 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 shadow-lg shadow-amber-200/70">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">Résolution d&apos;écart</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">Mise à jour du statut de livraison</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 p-5">
          
          {/* Ecart Summary Card */}
          <div className="space-y-2.5 rounded-2xl border border-amber-200 bg-amber-50/30 p-4">
            <div className="flex items-center justify-between">
               <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-800">Écart constaté</span>
               <span className="text-[11px] font-bold uppercase tracking-tight text-slate-500">DA {demande.numero_demande}</span>
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">{toDisplayLabel(demande.type_ecart)}</p>
              <p className="mt-1 text-sm italic leading-relaxed text-slate-600">&quot;{demande.description_ecart || "Aucune description fournie."}&quot;</p>
            </div>
          </div>

          <form id="resolve-issue-form" onSubmit={handleSubmit} className="space-y-4">
             <div className="group space-y-1.5">
                <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 transition-colors group-focus-within:text-amber-600">
                  <Calendar className="h-3.5 w-3.5" />
                  Date de résolution <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  min={getTodayDate()}
                  required
                  value={dateResolution}
                  onChange={(e) => setDateResolution(e.target.value)}
                  {...FRENCH_DATE_INPUT_PROPS}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold shadow-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-50"
                />
             </div>

             <div className="group space-y-1.5">
                <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 transition-colors group-focus-within:text-amber-600">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Commentaire / Solution apportée <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  value={suiviResolution}
                  onChange={(e) => setSuiviResolution(e.target.value)}
                  className="min-h-[104px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium shadow-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-50"
                  placeholder="Expliquez comment l'écart a été résolu (remplacement reçu, avoir crédité, etc.)..."
                />
             </div>

             {error && (
              <div className="ucp-inline-notice ucp-inline-notice--error">
                <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
                <p>{error}</p>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-5 py-4">
           <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="resolve-issue-form"
              disabled={saving || !suiviResolution}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-black active:scale-95 disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Confirmer la résolution
                </>
              )}
            </button>
        </div>
      </div>
    </div>
  );
}
