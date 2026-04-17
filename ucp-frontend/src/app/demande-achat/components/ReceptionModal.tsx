"use client";

import { useEffect, useMemo, useState } from "react";
import {
  X,
  Package,
  ClipboardCheck,
  AlertCircle,
  FileText,
  Check,
  CheckCircle,
} from "lucide-react";

import {
  DemandeAchat,
  ReceiveDemandePayload,
  ReceptionLignePayload,
  receiveDemandeAchat,
  uploadDocumentDemandeAchat,
} from "@/services/achats";
import { getCurrentUser } from "@/services/auth";
import PurchaseSelect from "@/app/demande-achat/components/PurchaseSelect";

type ReceptionModalProps = {
  demande: DemandeAchat | null;
  open: boolean;
  onClose: () => void;
  onOpenDetail: () => void;
  onSuccess: () => void;
};

const getTodayDate = () => new Date().toISOString().split("T")[0];

const getDefaultReceptionnaire = (
  demande: DemandeAchat | null,
  currentUser: ReturnType<typeof getCurrentUser>,
) => {
  if (demande?.receptionnaire) return demande.receptionnaire;
  if (!currentUser) return "";
  return `${currentUser.first_name} ${currentUser.last_name}`.trim();
};

const buildInitialLignes = (demande: DemandeAchat | null): ReceptionLignePayload[] => {
  if (!demande) return [];
  return demande.lignes_besoin.map((ligne) => ({
    ligne_id: ligne.id!,
    quantite_recue: ligne.quantite_recue ?? ("" as any),
    observation_reception: ligne.observation_reception || "",
  }));
};

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "Non définie";
  return new Date(dateStr).toLocaleDateString("fr-FR");
};

const typeEcartOptions = [
  { value: "MANQUANT", label: "Manquant" },
  { value: "DEFECTUEUX", label: "Défectueux" },
  { value: "NON_CONFORME", label: "Non conforme" },
  { value: "HORS_SPECIFICATIONS", label: "Hors spécifications" },
] as const;

const actionCorrectiveOptions = [
  { value: "REMPLACEMENT", label: "Remplacement" },
  { value: "REPARATION", label: "Réparation" },
  { value: "AVOIR", label: "Avoir / Rembours." },
  { value: "REJET", label: "Rejet définitif" },
] as const;

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

  const [dateReception, setDateReception] = useState(() => demande?.date_reception || "");
  const [receptionnaire, setReceptionnaire] = useState(() => demande?.receptionnaire || "");

  const [conformiteQuantite, setConformiteQuantite] = useState<ReceiveDemandePayload["conformite_quantite"] | "">(() => (demande?.conformite_quantite as ReceiveDemandePayload["conformite_quantite"]) || "");
  const [conformiteQualite, setConformiteQualite] = useState<
    ReceiveDemandePayload["conformite_qualite"] | ""
  >(() => (demande?.conformite_qualite as ReceiveDemandePayload["conformite_qualite"]) || "");

  const [fileBL, setFileBL] = useState<File | null>(null);
  const [filePV, setFilePV] = useState<File | null>(null);

  const [typeEcart, setTypeEcart] = useState<ReceiveDemandePayload["type_ecart"]>(
    () => (demande?.type_ecart as ReceiveDemandePayload["type_ecart"]) || "MANQUANT",
  );
  const [descriptionEcart, setDescriptionEcart] = useState(() => demande?.description_ecart || "");
  const [actionCorrective, setActionCorrective] = useState<
    ReceiveDemandePayload["action_corrective"]
  >(
    () =>
      (demande?.action_corrective as ReceiveDemandePayload["action_corrective"]) || "REMPLACEMENT",
  );
  const [dateResolution, setDateResolution] = useState(() => demande?.date_resolution || "");
  const [suiviResolution, setSuiviResolution] = useState(() => demande?.suivi_resolution || "");
  const [observationsReception, setObservationsReception] = useState(() => demande?.observations_reception || "");

  const [lignes, setLignes] = useState<ReceptionLignePayload[]>(() => buildInitialLignes(demande));

  // Compute quantity diff automatically
  const isQuantiteDiff = useMemo(() => {
    if (!demande) return false;
    // Don't trigger diff if no quantities are entered yet
    if (lignes.every(l => l.quantite_recue === "" as any)) return false;
    return lignes.some((ligneState) => {
      const dbLigne = demande.lignes_besoin.find(l => l.id === ligneState.ligne_id);
      return dbLigne && ligneState.quantite_recue !== "" && ligneState.quantite_recue !== (dbLigne.quantite || 0);
    });
  }, [lignes, demande]);

  const isProblemDetected = useMemo(() => {
    return (conformiteQuantite !== "" && conformiteQuantite !== "CONFORME") || 
           (conformiteQualite !== "" && conformiteQualite !== "CONFORME") || 
           isQuantiteDiff;
  }, [conformiteQuantite, conformiteQualite, isQuantiteDiff]);

  const statutReceptionDisplay = useMemo(() => {
    if (conformiteQualite === "") return "En attente";
    return isProblemDetected ? "Réceptionné partiel" : "Réceptionné complet";
  }, [conformiteQualite, isProblemDetected]);

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

  // Reset lines state when demande changes
  useEffect(() => {
    if (open) {
      setLignes(buildInitialLignes(demande));
    }
  }, [demande, open]);

  // Reset files when closing
  useEffect(() => {
    if (!open) {
      setFileBL(null);
      setFilePV(null);
    }
  }, [open]);

  if (!open || !demande) return null;

  const handleLigneChange = (
    ligneId: number,
    field: keyof ReceptionLignePayload,
    value: number | string,
  ) => {
    setLignes((previous) =>
      previous.map((ligne) => (ligne.ligne_id === ligneId ? { ...ligne, [field]: value } : ligne)),
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (conformiteQualite === "" || conformiteQuantite === "" || !dateReception || !receptionnaire) return;

    setSaving(true);
    setError(null);

    const payload: ReceiveDemandePayload & { date_resolution?: string, suivi_resolution?: string } = {
      date_reception: dateReception,
      receptionnaire,
      conformite_quantite: conformiteQuantite as ReceiveDemandePayload["conformite_quantite"],
      conformite_qualite: conformiteQualite as ReceiveDemandePayload["conformite_qualite"],
      observations_reception: observationsReception,
      lignes,
    };

    if (isProblemDetected) {
      payload.type_ecart = typeEcart;
      payload.description_ecart = descriptionEcart;
      payload.action_corrective = actionCorrective;
      if (dateResolution) payload.date_resolution = dateResolution;
      if (suiviResolution) payload.suivi_resolution = suiviResolution;
    }

    try {
      if (fileBL) {
        const formDataBL = new FormData();
        formDataBL.append("type_document", "BON_LIVRAISON");
        formDataBL.append("fichier", fileBL);
        await uploadDocumentDemandeAchat(demande.id, formDataBL);
      }
      if (filePV) {
        const formDataPV = new FormData();
        formDataPV.append("type_document", "PV_RECEPTION");
        formDataPV.append("fichier", filePV);
        await uploadDocumentDemandeAchat(demande.id, formDataPV);
      }

      await receiveDemandeAchat(demande.id, payload as any);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full max-w-5xl w-[95vw] rounded-2xl bg-white shadow-2xl flex flex-col max-h-[95vh]"
        style={{ zoom: 0.8 }}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                Dossier: {demande.numero_demande}
              </div>
              <h2 className="text-lg font-black text-slate-800 leading-tight">
                Valider la réception
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* CONTENU PRINCIPAL */}
        <form onSubmit={handleSubmit} className="flex flex-col p-4 md:p-5 gap-4 overflow-hidden">
          
          {/* BLOC 1 - EXPÉDITION (compact) */}
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] shrink-0">
            <div className="flex items-center font-bold text-slate-700">
              <Package className="mr-2 h-4 w-4 text-slate-500" />
              Livraison
            </div>
            <div className="h-4 w-px bg-slate-300"></div>
            <div className="text-slate-600">
              Prévue : <span className="font-semibold text-slate-900">{formatDate(demande.date_arrivee_prevue)}</span>
            </div>
            <div className="h-4 w-px bg-slate-300"></div>
            <div className="text-slate-600">
              Arrivée : <span className="font-semibold text-slate-900">{formatDate(demande.date_arrivee_effective || getTodayDate())}</span>
            </div>
            <div className="h-4 w-px bg-slate-300"></div>
            <div className="flex items-center">
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold uppercase text-emerald-700">
                {demande.etat_expedition || "Arrivé"}
              </span>
            </div>
            <div className="h-4 w-px bg-slate-300"></div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Statut :</span>
              <span className={`rounded-md px-2 py-0.5 text-xs font-bold uppercase ${statutReceptionDisplay === 'Réceptionné complet' ? 'bg-emerald-100 text-emerald-700' : statutReceptionDisplay === 'Réceptionné partiel' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>
                {statutReceptionDisplay}
              </span>
            </div>
            <div className="h-4 w-px bg-slate-300 hidden md:block"></div>
            <div className="text-slate-600 flex items-center gap-2">
              <span className="font-bold">Date réelle:</span>
              <input type="date" required value={dateReception} onChange={(e) => setDateReception(e.target.value)} className="w-[120px] rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 outline-none focus:border-emerald-500" />
            </div>
            <div className="h-4 w-px bg-slate-300 hidden md:block"></div>
            <div className="text-slate-600 flex items-center gap-2 flex-1">
              <span className="font-bold">Reçu par:</span>
              <input type="text" required value={receptionnaire} onChange={(e) => setReceptionnaire(e.target.value)} placeholder="Nom..." className="min-w-[120px] flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 outline-none focus:border-emerald-500" />
            </div>
          </div>

          {/* BLOC 2 - ARTICLES (Tableau scrollable) */}
          <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex-1 min-h-0">
            {/* Haut de Bloc 2: Infos Base (Ultra compact sur 1 ligne) */}
            <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 px-4 py-2 bg-slate-50/50 rounded-t-xl">
              <div className="flex items-center gap-2 flex-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  Observations
                </label>
                <input value={observationsReception} onChange={(e) => setObservationsReception(e.target.value)} placeholder="Constats finaux..." className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 outline-none focus:border-emerald-500" />
              </div>
            </div>

            {/* Tableau compact avec scroll */}
            <div className="overflow-y-auto overflow-x-hidden border-t border-slate-100">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-slate-50 text-xs font-bold text-slate-500 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-2 border-b border-slate-100">Désignation</th>
                    <th className="w-20 border-b border-slate-100 px-4 py-2 text-center text-slate-400">Prévu</th>
                    <th className="w-32 border-b border-slate-100 px-4 py-2 text-center text-slate-700">Reçu</th>
                    
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {demande.lignes_besoin.map((ligne) => {
                    const ligneState = lignes.find((i) => i.ligne_id === ligne.id);
                    if (!ligneState) return null;
                    const isDiff = ligneState.quantite_recue !== (ligne.quantite || 0);

                    return (
                      <tr key={ligne.id} className={isDiff ? "bg-amber-50/30" : ""}>
                        <td className="px-4 py-2">
                          <p className="font-semibold text-slate-900 truncate max-w-sm" title={ligne.designation || ligne.description_service}>
                            {ligne.designation || ligne.description_service}
                          </p>
                          <p className="text-xs text-slate-500">{ligne.unite || "unité"}</p>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className="rounded bg-slate-100 px-2 py-1 font-semibold text-slate-700">
                            {ligne.quantite || 0}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={ligneState.quantite_recue === "" ? "" : ligneState.quantite_recue}
                              onChange={(e) => handleLigneChange(ligne.id!, "quantite_recue", e.target.value === "" ? "" : Number(e.target.value))}
                              className={`w-full rounded border-2 bg-slate-50 focus:bg-white px-2 py-1 text-center text-[13px] font-bold outline-none transition-all placeholder:font-normal placeholder:text-slate-400 focus:ring-2 ${
                                ligneState.quantite_recue === "" ? "border-amber-400 focus:border-amber-500 focus:ring-amber-100" : 
                                isDiff ? "border-amber-300 text-amber-700 focus:border-amber-500 focus:ring-amber-100" : "border-emerald-300 text-emerald-800 focus:border-emerald-500 focus:ring-emerald-100"
                              }`}
                            />
                            {ligneState.quantite_recue === "" && (
                              <div className="absolute -top-2 -right-2 right-0">
                                <span className="flex h-3 w-3 rounded-full bg-amber-500 shadow-sm animate-pulse"></span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Décision Boutons */}
            <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-4 py-3 md:flex-row items-center justify-center">
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Quantité :</span>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => setConformiteQuantite("CONFORME")} className={`rounded-lg border px-4 py-2 text-sm font-bold shadow-sm transition ${conformiteQuantite === "CONFORME" ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                    Conforme
                  </button>
                  <button type="button" onClick={() => setConformiteQuantite("PARTIELLE")} className={`rounded-lg border px-4 py-2 text-sm font-bold shadow-sm transition ${conformiteQuantite === "PARTIELLE" ? "border-amber-500 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                    Partielle
                  </button>
                  <button type="button" onClick={() => setConformiteQuantite("NON_CONFORME")} className={`rounded-lg border px-4 py-2 text-sm font-bold shadow-sm transition ${conformiteQuantite === "NON_CONFORME" ? "border-rose-500 bg-rose-50 text-rose-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                    Non conforme
                  </button>
                </div>
              </div>

              <div className="hidden h-6 w-px bg-slate-300 md:block mx-1"></div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Qualité :</span>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => setConformiteQualite("CONFORME")} className={`rounded-lg border px-4 py-2 text-sm font-bold shadow-sm transition ${conformiteQualite === "CONFORME" ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                    Conforme
                  </button>
                  <button type="button" onClick={() => setConformiteQualite("NON_CONFORME")} className={`rounded-lg border px-4 py-2 text-sm font-bold shadow-sm transition ${conformiteQualite === "NON_CONFORME" || conformiteQualite === "DEFECTUEUX" ? "border-amber-500 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                    Problème
                  </button>
                </div>
              </div>

            </div>
          </div>
          {/* BLOC 3 - ÉCART (Conditionnel) */}
          {isProblemDetected && (
            <div className="flex animate-in fade-in slide-in-from-top-2 gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 flex-col shrink-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="rounded-full bg-rose-100 p-1.5 text-rose-600 shrink-0">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-rose-800">Gestion des écarts détectés</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <PurchaseSelect
                  value={typeEcart}
                  onChange={(value) => setTypeEcart(value as ReceiveDemandePayload["type_ecart"])}
                  options={[...typeEcartOptions]}
                  className="rounded border border-rose-200 bg-white px-2 py-1.5 text-xs font-semibold text-rose-900 outline-none"
                />
                <PurchaseSelect
                  value={actionCorrective}
                  onChange={(value) => setActionCorrective(value as ReceiveDemandePayload["action_corrective"])}
                  options={[...actionCorrectiveOptions]}
                  className="rounded border border-rose-200 bg-white px-2 py-1.5 text-xs font-semibold text-rose-900 outline-none"
                />
                <input type="text" required value={descriptionEcart} onChange={(e) => setDescriptionEcart(e.target.value)} placeholder="Détail du problème..." className="rounded border border-rose-200 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none placeholder:text-rose-300" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 bg-white rounded border border-rose-200 px-2 py-1">
                  <label className="text-xs font-bold text-rose-800 whitespace-nowrap">Date de résolution</label>
                  <input type="date" value={dateResolution} onChange={(e) => setDateResolution(e.target.value)} className="w-full bg-transparent text-xs text-slate-800 outline-none" />
                </div>
                <div className="flex items-center gap-2 bg-white rounded border border-rose-200 px-2 py-1">
                  <label className="text-xs font-bold text-rose-800 whitespace-nowrap">Suivi résol.</label>
                  <input type="text" value={suiviResolution} onChange={(e) => setSuiviResolution(e.target.value)} placeholder="Commentaires..." className="w-full bg-transparent text-xs text-slate-800 outline-none" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-medium text-rose-600">
              {error}
            </div>
          )}

          {/* BLOC 4 & FOOTER - Documents et Validation */}
          <div className="mt-auto flex flex-col items-center justify-between gap-3 pt-3 border-t border-slate-100 shrink-0 md:flex-row">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto pt-4">
              {/* Documents (Compact) */}
              <div className="flex gap-3">
                <input type="file" id="bl-upload" className="hidden" onChange={(e) => setFileBL(e.target.files?.[0] || null)} />
                <label htmlFor="bl-upload" className="flex cursor-pointer items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 shadow-sm">
                  <FileText className="h-4 w-4 text-slate-400" />
                  {fileBL ? `BL: ${fileBL.name.substring(0,10)}...` : <span>Bon livraison <span className="ml-1 text-slate-400 font-normal">[+]</span></span>}
                  {fileBL && <Check className="h-3 w-3 text-emerald-600" />}
                </label>

                <input type="file" id="pv-upload" className="hidden" onChange={(e) => setFilePV(e.target.files?.[0] || null)} />
                <label htmlFor="pv-upload" className="flex cursor-pointer items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 shadow-sm">
                  <FileText className="h-4 w-4 text-slate-400" />
                  {filePV ? `PV: ${filePV.name.substring(0,10)}...` : <span>PV réception <span className="ml-1 text-slate-400 font-normal">[+]</span></span>}
                  {filePV && <Check className="h-3 w-3 text-emerald-600" />}
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || conformiteQualite === "" || conformiteQuantite === "" || lignes.some(l => l.quantite_recue === "" as any) || !dateReception || !receptionnaire}
              className={`inline-flex w-full md:w-auto shrink-0 items-center justify-center gap-2 rounded-xl px-8 py-3 text-[13px] font-black uppercase tracking-wider text-white shadow-[0_8px_20px_rgba(5,150,105,0.3)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0 ${
                isProblemDetected
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Traitement...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  {isProblemDetected ? "Valider avec écart" : "Valider définitivement"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
