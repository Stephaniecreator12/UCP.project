"use client";

import { useEffect, useState } from "react";
import { X, ClipboardCheck, AlertTriangle, CheckCircle } from "lucide-react";
import { DemandeAchat, ReceiveDemandePayload, ReceptionLignePayload, receiveDemandeAchat } from "@/services/achats";
import { getCompactNeedLabel } from "@/app/demande-achat/components/demandeAchatShared";
import { getCurrentUser } from "@/services/auth";

type ReceptionModalProps = {
  demande: DemandeAchat | null;
  open: boolean;
  onClose: () => void;
  onOpenDetail: () => void;
  onSuccess: () => void;
};

export default function ReceptionModal({
  demande,
  open,
  onClose,
  onOpenDetail,
  onSuccess,
}: ReceptionModalProps) {
  const [currentUser] = useState(() => getCurrentUser());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dateReception, setDateReception] = useState("");
  const [receptionnaire, setReceptionnaire] = useState("");
  const [conformiteQuantite, setConformiteQuantite] = useState<ReceiveDemandePayload["conformite_quantite"]>("CONFORME");
  const [conformiteQualite, setConformiteQualite] = useState<ReceiveDemandePayload["conformite_qualite"]>("CONFORME");
  const [observations, setObservations] = useState("");
  const [statutReception, setStatutReception] = useState<ReceiveDemandePayload["statut_reception"]>("RECEPTION_COMPLETE");
  
  // Ecarts
  const [hasEcart, setHasEcart] = useState(false);
  const [typeEcart, setTypeEcart] = useState<ReceiveDemandePayload["type_ecart"]>("MANQUANT");
  const [descriptionEcart, setDescriptionEcart] = useState("");
  const [actionCorrective, setActionCorrective] = useState<ReceiveDemandePayload["action_corrective"]>("REMPLACEMENT");

  const [lignes, setLignes] = useState<ReceptionLignePayload[]>([]);

  useEffect(() => {
    if (open && demande) {
      const today = new Date().toISOString().split("T")[0];
      setDateReception(demande.date_reception || today);
      setReceptionnaire(demande.receptionnaire || (currentUser ? `${currentUser.first_name} ${currentUser.last_name}`.trim() : ""));
      setConformiteQuantite((demande.conformite_quantite as any) || "CONFORME");
      setConformiteQualite((demande.conformite_qualite as any) || "CONFORME");
      setObservations(demande.observations_reception || "");
      setStatutReception((demande.statut_reception as any) === "RECEPTION_PARTIELLE" ? "RECEPTION_PARTIELLE" : "RECEPTION_COMPLETE");
      
      const hasExistingEcart = !!demande.type_ecart;
      setHasEcart(hasExistingEcart);
      setTypeEcart((demande.type_ecart as any) || "MANQUANT");
      setDescriptionEcart(demande.description_ecart || "");
      setActionCorrective((demande.action_corrective as any) || "REMPLACEMENT");

      setLignes(
        demande.lignes_besoin.map((l) => ({
          ligne_id: l.id!,
          quantite_recue: l.quantite_recue ?? l.quantite ?? 0,
          observation_reception: l.observation_reception || "",
        }))
      );
      setError(null);
    }
  }, [open, demande, currentUser]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", handleKeyDown); };
  }, [onClose, open]);

  if (!open || !demande) return null;

  const handleLigneChange = (id: number, field: keyof ReceptionLignePayload, value: any) => {
    setLignes((prev) =>
      prev.map((l) => (l.ligne_id === id ? { ...l, [field]: value } : l))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demande) return;

    setSaving(true);
    setError(null);

    const payload: ReceiveDemandePayload = {
      date_reception: dateReception || undefined,
      receptionnaire,
      conformite_quantite: conformiteQuantite,
      conformite_qualite: conformiteQualite,
      observations_reception: observations,
      statut_reception: statutReception,
      lignes,
    };

    if (hasEcart) {
      payload.type_ecart = typeEcart;
      payload.description_ecart = descriptionEcart;
      payload.action_corrective = actionCorrective;
    }

    try {
      await receiveDemandeAchat(demande.id, payload);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement de la réception");
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
            <ClipboardCheck className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Réception : {demande.numero_demande}</h2>
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
          
          {/* Quick Info Box */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emerald-900 truncate" title={demande.objet}>{demande.objet}</p>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-emerald-700">
                <span>{getCompactNeedLabel(demande)}</span>
                <span className="border-l border-emerald-200 pl-3">Commande: {demande.numero_bon_commande || "-"}</span>
                <span className="border-l border-emerald-200 pl-3">Fournisseur : {demande.fournisseur_retenu || "-"}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenDetail}
              className="shrink-0 rounded-lg bg-white border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-colors shadow-sm"
            >
              Voir détail
            </button>
          </div>

          <form id="reception-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2">
                Détails de réception
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Date réception</label>
                  <input
                    type="date"
                    required
                    value={dateReception}
                    onChange={(e) => setDateReception(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 focus:bg-white py-2 px-3 text-sm shadow-sm transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Réceptionnaire</label>
                  <input
                    required
                    value={receptionnaire}
                    onChange={(e) => setReceptionnaire(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 focus:bg-white py-2 px-3 text-sm shadow-sm transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                    placeholder="Nom complet"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Conformité Qualité</label>
                  <select
                    value={conformiteQualite}
                    onChange={(e) => setConformiteQualite(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 focus:bg-white py-2 px-3 text-sm shadow-sm transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                  >
                    <option value="CONFORME">Dégâts et conformité OK</option>
                    <option value="NON_CONFORME">Non conforme aux specs</option>
                    <option value="DEFECTUEUX">Produits défectueux</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Conformité Quantité</label>
                  <select
                    value={conformiteQuantite}
                    onChange={(e) => setConformiteQuantite(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 focus:bg-white py-2 px-3 text-sm shadow-sm transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                  >
                    <option value="CONFORME">Totale</option>
                    <option value="PARTIELLE">Partielle</option>
                    <option value="NON_CONFORME">Anormale (Autre écart)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2">
                Lignes de Commande
              </p>
              <div className="space-y-3">
                {demande.lignes_besoin.map((ligne) => {
                  const stateLigne = lignes.find((l) => l.ligne_id === ligne.id);
                  if (!stateLigne) return null;
                  
                  const isEcart = stateLigne.quantite_recue !== (ligne.quantite || 0);

                  return (
                    <div key={ligne.id} className={`flex flex-wrap items-center gap-4 rounded-lg p-3 border ${isEcart ? "border-amber-200 bg-amber-50/30" : "border-slate-100 bg-slate-50"}`}>
                      <div className="flex-1 min-w-[200px]">
                        <p className="text-sm font-semibold text-slate-800">{ligne.designation || ligne.description_service}</p>
                        <p className="text-xs text-slate-500">Commandé: {ligne.quantite || "-"} {ligne.unite || ""}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Qte Reçue</label>
                          <input
                            type="number"
                            min="0"
                            value={stateLigne.quantite_recue}
                            onChange={(e) => handleLigneChange(ligne.id!, "quantite_recue", Number(e.target.value))}
                            className={`w-full rounded border py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 ${isEcart ? "border-amber-300 text-amber-900 bg-white" : "border-slate-300 bg-white"}`}
                          />
                        </div>
                        {isEcart && (
                           <div className="text-amber-600 flex items-center justify-center p-1">
                             <AlertTriangle className="h-5 w-5" />
                           </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {(conformiteQualite !== "CONFORME" || conformiteQuantite !== "CONFORME" || hasEcart) && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between mb-2 border-b border-amber-200/50 pb-2">
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                    Déclaration d'écart
                  </p>
                  <label className="flex items-center gap-2 text-sm font-semibold text-amber-800 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={hasEcart} 
                      onChange={(e) => setHasEcart(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    Renseigner un écart
                  </label>
                </div>
                
                {hasEcart && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-amber-900">Type d'écart</label>
                        <select
                          value={typeEcart}
                          onChange={(e) => setTypeEcart(e.target.value as any)}
                          className="w-full rounded-lg border border-amber-300 bg-white py-2 px-3 text-sm shadow-sm transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                        >
                          <option value="MANQUANT">Manquant</option>
                          <option value="DEFECTUEUX">Défectueux</option>
                          <option value="NON_CONFORME">Non conforme</option>
                          <option value="HORS_SPECIFICATIONS">Hors spécifications</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-amber-900">Action Corrective</label>
                        <select
                          value={actionCorrective}
                          onChange={(e) => setActionCorrective(e.target.value as any)}
                          className="w-full rounded-lg border border-amber-300 bg-white py-2 px-3 text-sm shadow-sm transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                        >
                          <option value="REMPLACEMENT">Remplacement</option>
                          <option value="REPARATION">Réparation</option>
                          <option value="AVOIR">Avoir / Remboursement</option>
                          <option value="REJET">Rejet définitif</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-amber-900">Description détaillée de l'écart</label>
                      <textarea
                        required
                        value={descriptionEcart}
                        onChange={(e) => setDescriptionEcart(e.target.value)}
                        className="w-full rounded-lg border border-amber-300 bg-white py-2 px-3 text-sm shadow-sm transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none min-h-[60px]"
                        placeholder="Précisez le problème..."
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Observations Globales</label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 focus:bg-white py-2 px-3 text-sm shadow-sm transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none min-h-[60px]"
                  placeholder="Remarques éventuelles sur la livraison..."
                />
              </div>

              <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">Décision de réception</p>
                  <p className="text-xs text-slate-500">
                    Si tout est réglé et reçu, clôturez la réception. Sinon, laissez-la partielle.
                  </p>
                </div>
                <div className="w-full sm:w-64">
                  <select
                    value={statutReception}
                    onChange={(e) => setStatutReception(e.target.value as any)}
                    className="w-full font-bold rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm shadow-sm transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                  >
                    <option value="RECEPTION_PARTIELLE">Réception Partielle</option>
                    <option value="RECEPTION_COMPLETE">Réception Complète</option>
                  </select>
                </div>
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
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="reception-form"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-bold text-white hover:bg-emerald-700 shadow-md transition-colors disabled:opacity-60"
            >
              {saving ? (
                <>Enregistrement...</>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Valider Réception
                </>
              )}
            </button>
        </div>

      </div>
    </div>
  );
}
