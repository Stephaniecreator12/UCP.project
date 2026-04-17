"use client";

import { useEffect, useState } from "react";
import { X, AlertCircle, CheckCircle, Calendar, MessageSquare, ShieldAlert } from "lucide-react";
import { DemandeAchat, ResolveReceptionIssuePayload, resolveReceptionIssueDemandeAchat } from "@/services/achats";
import { toDisplayLabel } from "@/app/demande-achat/components/demandeAchatShared";

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
      const today = new Date().toISOString().split("T")[0];
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
      className="fixed inset-0 z-[120] grid place-items-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-md animate-in fade-in duration-300 py-10"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="w-full max-w-2xl rounded-3xl border border-white/20 bg-white shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden"
        style={{ zoom: 0.8 }}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-amber-50/50 px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 shadow-lg shadow-amber-200">
              <ShieldAlert className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">RÉSOLUTION D'ÉCART</h2>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">Mise à jour du statut de livraison</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-rose-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          
          {/* Ecart Summary Card */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-5 space-y-3">
            <div className="flex items-center justify-between">
               <span className="text-[10px] font-black text-amber-800 uppercase bg-amber-100 px-2 py-0.5 rounded-full">Écart constaté</span>
               <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">DA {demande.numero_demande}</span>
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">{toDisplayLabel(demande.type_ecart)}</p>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed italic">"{demande.description_ecart || "Aucune description fournie."}"</p>
            </div>
          </div>

          <form id="resolve-issue-form" onSubmit={handleSubmit} className="space-y-6">
             <div className="group space-y-2">
                <label className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase ml-1 group-focus-within:text-amber-600 transition-colors">
                  <Calendar className="h-3.5 w-3.5" />
                  Date de résolution <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dateResolution}
                  onChange={(e) => setDateResolution(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 px-5 text-sm font-bold shadow-sm transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-50 outline-none"
                />
             </div>

             <div className="group space-y-2">
                <label className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase ml-1 group-focus-within:text-amber-600 transition-colors">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Commentaire / Solution apportée <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  value={suiviResolution}
                  onChange={(e) => setSuiviResolution(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-4 px-5 text-sm font-medium shadow-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-50 min-h-[120px]"
                  placeholder="Expliquez comment l'écart a été résolu (remplacement reçu, avoir crédité, etc.)..."
                />
             </div>

             {error && (
              <div className="flex items-center gap-3 rounded-2xl bg-rose-50 p-4 border border-rose-100 shadow-sm">
                <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
                <p className="text-sm font-bold text-rose-600">{error}</p>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/80 px-8 py-6 flex items-center justify-between">
           <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="text-sm font-black text-slate-500 hover:text-slate-800 transition-colors"
            >
              ANNULER
            </button>
            <button
              type="submit"
              form="resolve-issue-form"
              disabled={saving || !suiviResolution}
              className="inline-flex items-center gap-3 rounded-2xl bg-slate-900 px-8 py-4 text-sm font-black text-white shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? "ENREGISTREMENT..." : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  CONFIRMER LA RÉSOLUTION
                </>
              )}
            </button>
        </div>
      </div>
    </div>
  );
}
