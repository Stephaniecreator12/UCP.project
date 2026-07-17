"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { getme } from "@/services/profile";
import PurchaseSelect from "@/app/personnel/demande-achat/components/PurchaseSelect";
import { FRENCH_DATE_INPUT_PROPS, formatFrenchDate as formatDate } from "@/lib/date";
import { UserProfile } from "@/types/profile";

type ReceptionModalProps = {
  demande: DemandeAchat | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type ReceptionFormLigne = Omit<ReceptionLignePayload, "quantite_recue"> & {
  quantite_recue: number | "";
};

const getTodayDate = () => new Date().toISOString().split("T")[0];

const isPdfFile = (file: File | null) =>
  !file || file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

const getDefaultReceptionnaire = (
  demande: DemandeAchat | null,
  currentUser: ReturnType<typeof getme>,
) => {
  if (demande?.receptionnaire) return demande.receptionnaire;
  if (!currentUser) return "Service logistique";
  return `${getme()}`.trim() || "Service logistique";
};

const buildInitialLignes = (demande: DemandeAchat | null): ReceptionFormLigne[] => {
  if (!demande) return [];
  const lignesBesoin = Array.isArray(demande.lignes_besoin) ? demande.lignes_besoin : [];
  return lignesBesoin.map((ligne) => ({
    ligne_id: ligne.id!,
    quantite_recue: ligne.quantite_recue ?? "",
    observation_reception: ligne.observation_reception || "",
  }));
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
  onSuccess,
}: ReceptionModalProps) {
  const issueBlockRef = useRef<HTMLDivElement | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile>();
  useEffect(() => {
    async function handleGetMe() {
      const res = await getme();
      if (!res.error) {
        const data = res.data
        setCurrentUser(data);
      }
      return;
    }
    handleGetMe();
  }, [])
  const lignesBesoin = useMemo(
    () => (Array.isArray(demande?.lignes_besoin) ? demande.lignes_besoin : []),
    [demande],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dateReception, setDateReception] = useState(() => demande?.date_reception || "");
  const [receptionnaire, setReceptionnaire] = useState(() =>
    getDefaultReceptionnaire(demande, getme()),
  );

  const [conformiteQuantite, setConformiteQuantite] = useState<ReceiveDemandePayload["conformite_quantite"] | "">(() => (demande?.conformite_quantite as ReceiveDemandePayload["conformite_quantite"]) || "");
  const [conformiteQualite, setConformiteQualite] = useState<
    ReceiveDemandePayload["conformite_qualite"] | ""
  >(() => (demande?.conformite_qualite as ReceiveDemandePayload["conformite_qualite"]) || "");

  const [fileBL, setFileBL] = useState<File | null>(null);
  const [filePV, setFilePV] = useState<File | null>(null);
  const [fileNotification, setFileNotification] = useState<string | null>(null);

  const [typeEcart, setTypeEcart] = useState<ReceiveDemandePayload["type_ecart"] | "">(
    () => (demande?.type_ecart as ReceiveDemandePayload["type_ecart"]) || "",
  );
  const [descriptionEcart, setDescriptionEcart] = useState(() => demande?.description_ecart || "");
  const [actionCorrective, setActionCorrective] = useState<
    ReceiveDemandePayload["action_corrective"] | ""
  >(
    () =>
      (demande?.action_corrective as ReceiveDemandePayload["action_corrective"]) || "",
  );
  const [dateResolution, setDateResolution] = useState(() => demande?.date_resolution || "");
  const [suiviResolution, setSuiviResolution] = useState(() => demande?.suivi_resolution || "");
  const [observationsReception, setObservationsReception] = useState(() => demande?.observations_reception || "");

  const [lignes, setLignes] = useState<ReceptionFormLigne[]>(() => buildInitialLignes(demande));

  // Compute quantity diff automatically
  const isQuantiteDiff = useMemo(() => {
    if (!demande) return false;
    // Don't trigger diff if no quantities are entered yet
    if (lignes.every((ligne) => ligne.quantite_recue === "")) return false;
    return lignes.some((ligneState) => {
      const dbLigne = lignesBesoin.find((ligne) => ligne.id === ligneState.ligne_id);
      return dbLigne && ligneState.quantite_recue !== "" && ligneState.quantite_recue !== (dbLigne.quantite || 0);
    });
  }, [lignes, lignesBesoin, demande]);

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
    if (!fileNotification) return;

    const timeout = window.setTimeout(() => setFileNotification(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [fileNotification]);

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

  useEffect(() => {
    if (!open) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDateReception(demande?.date_reception || "");
    setReceptionnaire(getDefaultReceptionnaire(demande, getme()));
    setConformiteQuantite(
      (demande?.conformite_quantite as ReceiveDemandePayload["conformite_quantite"]) || "",
    );
    setConformiteQualite(
      (demande?.conformite_qualite as ReceiveDemandePayload["conformite_qualite"]) || "",
    );
    setTypeEcart((demande?.type_ecart as ReceiveDemandePayload["type_ecart"]) || "");
    setDescriptionEcart(demande?.description_ecart || "");
    setActionCorrective(
      (demande?.action_corrective as ReceiveDemandePayload["action_corrective"]) || "",
    );
    setDateResolution(demande?.date_resolution || "");
    setSuiviResolution(demande?.suivi_resolution || "");
    setObservationsReception(demande?.observations_reception || "");
    setLignes(buildInitialLignes(demande));
    setFileBL(null);
    setFilePV(null);
    setFileNotification(null);
    setError(null);
    setSaving(false);
  }, [currentUser, demande, open]);

  useEffect(() => {
    if (!open || !isProblemDetected) return;

    const timeout = window.setTimeout(() => {
      issueBlockRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [isProblemDetected, open]);

  if (!open || !demande) return null;

  const handleLigneChange = (
    ligneId: number,
    field: keyof ReceptionFormLigne,
    value: number | string,
  ) => {
    setLignes((previous) =>
      previous.map((ligne) => (ligne.ligne_id === ligneId ? { ...ligne, [field]: value } : ligne)),
    );
  };

  const handlePdfFileChange = (file: File | null, target: "BL" | "PV") => {
    if (!isPdfFile(file)) {
      setFileNotification("Seuls les fichiers PDF sont acceptés.");
      if (target === "BL") setFileBL(null);
      else setFilePV(null);
      return false;
    }

    setFileNotification(null);
    if (target === "BL") setFileBL(file);
    else setFilePV(file);
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!dateReception || conformiteQualite === "" || conformiteQuantite === "") return;

    if (!isPdfFile(fileBL) || !isPdfFile(filePV)) {
      setFileNotification("Seuls les fichiers PDF sont acceptés.");
      return;
    }

    if (isProblemDetected && (!typeEcart || !actionCorrective || !descriptionEcart.trim())) {
      setError("Renseignez le type d'écart, l'action corrective et le détail du problème.");
      return;
    }

    setSaving(true);
    setError(null);

    const payloadLignes: ReceptionLignePayload[] = lignes
      .filter(
        (
          ligne,
        ): ligne is ReceptionFormLigne & {
          quantite_recue: number;
        } => ligne.quantite_recue !== "",
      )
      .map((ligne) => ({
        ligne_id: ligne.ligne_id,
        quantite_recue: ligne.quantite_recue,
        observation_reception: ligne.observation_reception,
      }));

    const payload: ReceiveDemandePayload & { date_resolution?: string, suivi_resolution?: string } = {
      date_reception: dateReception,
      receptionnaire,
      conformite_quantite: conformiteQuantite as ReceiveDemandePayload["conformite_quantite"],
      conformite_qualite: conformiteQualite as ReceiveDemandePayload["conformite_qualite"],
      observations_reception: observationsReception,
      lignes: payloadLignes,
    };

    if (isProblemDetected) {
      payload.type_ecart = typeEcart as ReceiveDemandePayload["type_ecart"];
      payload.description_ecart = descriptionEcart.trim();
      payload.action_corrective = actionCorrective as ReceiveDemandePayload["action_corrective"];
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

      await receiveDemandeAchat(demande.id, payload);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-slate-950/60 px-3 py-3 backdrop-blur-sm sm:px-4 sm:py-6"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="my-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-3rem)]"
      >
        {/* HEADER */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-3 backdrop-blur shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
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
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-5">

          {/* BLOC 1 - EXPÉDITION (compact) */}
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm shrink-0">
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
              <input type="date" required min={getTodayDate()} value={dateReception} onChange={(e) => setDateReception(e.target.value)} {...FRENCH_DATE_INPUT_PROPS} className="w-[128px] rounded-xl border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900 outline-none focus:border-emerald-500" />
            </div>
          </div>

          {/* BLOC 2 - ARTICLES (Tableau scrollable) */}
          <div className="flex shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Haut de Bloc 2: Infos Base (Ultra compact sur 1 ligne) */}
            <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 px-4 py-2 bg-slate-50/50 rounded-t-xl">
              <div className="flex items-center gap-2 flex-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  Observations
                </label>
                <input value={observationsReception} onChange={(e) => setObservationsReception(e.target.value)} placeholder="Constats finaux..." className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1 text-sm text-slate-800 outline-none focus:border-emerald-500" />
              </div>
            </div>

            {/* Tableau compact avec scroll */}
            <div className="border-t border-slate-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[13px] font-bold text-slate-500 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-2 border-b border-slate-100">Désignation</th>
                    <th className="w-20 border-b border-slate-100 px-4 py-2 text-center text-slate-400">Prévu</th>
                    <th className="w-32 border-b border-slate-100 px-4 py-2 text-center text-slate-700">Reçu</th>

                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lignesBesoin.map((ligne) => {
                    const ligneState = lignes.find((i) => i.ligne_id === ligne.id);
                    if (!ligneState) return null;
                    const isDiff = ligneState.quantite_recue !== (ligne.quantite || 0);

                    return (
                      <tr key={ligne.id} className={isDiff ? "bg-amber-50/30" : ""}>
                        <td className="px-4 py-2">
                          <p className="font-semibold text-slate-900 truncate max-w-sm" title={ligne.designation || ligne.description_service}>
                            {ligne.designation || ligne.description_service}
                          </p>
                          <p className="text-[13px] text-slate-500">{ligne.unite || "unité"}</p>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className="rounded-xl bg-slate-100 px-2 py-1 font-semibold text-slate-700">
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
                              className={`w-full rounded-xl border-2 bg-slate-50 focus:bg-white px-2 py-1 text-center text-[13px] font-bold outline-none transition-all placeholder:font-normal placeholder:text-slate-400 focus:ring-2 ${ligneState.quantite_recue === "" ? "border-amber-400 focus:border-amber-500 focus:ring-amber-100" :
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
                  {lignesBesoin.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-sm text-slate-500">
                        Aucune ligne de besoin n&apos;a pu être chargée pour cette demande.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Décision Boutons */}
            <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-4 py-3 md:flex-row items-center justify-center">

              <div className="flex items-center gap-3 w-full md:w-auto">
                <span className="text-sm font-bold uppercase tracking-wider text-slate-500">Quantité :</span>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => setConformiteQuantite("CONFORME")} className={`rounded-xl border px-4 py-2 text-sm font-bold shadow-sm transition ${conformiteQuantite === "CONFORME" ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                    Totalité
                  </button>
                  <button type="button" onClick={() => setConformiteQuantite("PARTIELLE")} className={`rounded-xl border px-4 py-2 text-sm font-bold shadow-sm transition ${conformiteQuantite === "PARTIELLE" ? "border-amber-500 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                    Partielle
                  </button>
                </div>
              </div>

              <div className="hidden h-6 w-px bg-slate-300 md:block mx-1"></div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <span className="text-sm font-bold uppercase tracking-wider text-slate-500">Qualité :</span>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => setConformiteQualite("CONFORME")} className={`rounded-xl border px-4 py-2 text-sm font-bold shadow-sm transition ${conformiteQualite === "CONFORME" ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                    Conforme
                  </button>
                  <button type="button" onClick={() => setConformiteQualite("NON_CONFORME")} className={`rounded-xl border px-4 py-2 text-sm font-bold shadow-sm transition ${conformiteQualite === "NON_CONFORME" || conformiteQualite === "DEFECTUEUX" ? "border-amber-500 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                    Non conforme
                  </button>
                </div>
              </div>

            </div>
          </div>
          {/* BLOC 3 - ÉCART (Conditionnel) */}
          {isProblemDetected && (
            <div
              ref={issueBlockRef}
              className="flex animate-in fade-in slide-in-from-top-2 gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 flex-col shrink-0"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="rounded-full bg-rose-100 p-1.5 text-rose-600 shrink-0">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-rose-800">Gestion des écarts détectés</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <PurchaseSelect
                  value={typeEcart ?? ""}
                  onChange={(value) => setTypeEcart(value as ReceiveDemandePayload["type_ecart"])}
                  options={[...typeEcartOptions]}
                  className="rounded-xl border border-rose-200 bg-white px-2 py-1.5 text-sm font-semibold text-rose-900 outline-none"
                />
                <PurchaseSelect
                  value={actionCorrective ?? ""}
                  onChange={(value) => setActionCorrective(value as ReceiveDemandePayload["action_corrective"])}
                  options={[...actionCorrectiveOptions]}
                  className="rounded-xl border border-rose-200 bg-white px-2 py-1.5 text-sm font-semibold text-rose-900 outline-none"
                />
                <input type="text" required value={descriptionEcart} onChange={(e) => setDescriptionEcart(e.target.value)} placeholder="Détail du problème..." className="rounded-xl border border-rose-200 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none placeholder:text-rose-300" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 bg-white rounded-xl border border-rose-200 px-2 py-1">
                  <label className="text-sm font-bold text-rose-800 whitespace-nowrap">Date de résolution</label>
                  <input type="date" min={getTodayDate()} value={dateResolution} onChange={(e) => setDateResolution(e.target.value)} {...FRENCH_DATE_INPUT_PROPS} className="w-full bg-transparent text-sm text-slate-800 outline-none" />
                </div>
                <div className="flex items-center gap-2 bg-white rounded-xl border border-rose-200 px-2 py-1">
                  <label className="text-sm font-bold text-rose-800 whitespace-nowrap">Suivi résol.</label>
                  <input type="text" value={suiviResolution} onChange={(e) => setSuiviResolution(e.target.value)} placeholder="Commentaires..." className="w-full bg-transparent text-sm text-slate-800 outline-none" />
                </div>
              </div>
            </div>
          )}

          {error && <div className="ucp-inline-notice ucp-inline-notice--error">{error}</div>}

          {/* BLOC 4 & FOOTER - Documents et Validation */}
          <div className="mt-auto flex flex-col items-center justify-between gap-3 pt-3 border-t border-slate-100 shrink-0 md:flex-row">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto pt-4">
              {/* Documents (Compact) */}
              <div className="flex gap-3">
                <input type="file" id="bl-upload" accept=".pdf,application/pdf" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (!handlePdfFileChange(file, "BL")) {
                    e.currentTarget.value = "";
                  }
                }} />
                <label htmlFor="bl-upload" className="flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-[15px] font-bold text-slate-700 transition hover:bg-slate-100 shadow-sm">
                  <FileText className="h-5 w-5 text-slate-400" />
                  {fileBL ? <span className="max-w-[170px] truncate" title={fileBL.name}>BL: {fileBL.name}</span> : <span>Bon livraison <span className="ml-1 text-slate-400 font-normal">[+]</span></span>}
                  {fileBL && <Check className="h-4 w-4 text-emerald-600" />}
                </label>

                <input type="file" id="pv-upload" accept=".pdf,application/pdf" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (!handlePdfFileChange(file, "PV")) {
                    e.currentTarget.value = "";
                  }
                }} />
                <label htmlFor="pv-upload" className="flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-[15px] font-bold text-slate-700 transition hover:bg-slate-100 shadow-sm">
                  <FileText className="h-5 w-5 text-slate-400" />
                  {filePV ? <span className="max-w-[170px] truncate" title={filePV.name}>PV: {filePV.name}</span> : <span>PV réception <span className="ml-1 text-slate-400 font-normal">[+]</span></span>}
                  {filePV && <Check className="h-4 w-4 text-emerald-600" />}
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || conformiteQualite === "" || conformiteQuantite === "" || lignes.some((ligne) => ligne.quantite_recue === "") || !dateReception}
              className={`inline-flex w-full md:w-auto shrink-0 items-center justify-center gap-2 rounded-xl px-8 py-3 text-sm font-black uppercase tracking-wider text-white shadow-[0_8px_20px_rgba(5,150,105,0.3)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0 ${isProblemDetected
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

      {fileNotification && (
        <div className="pointer-events-none ucp-toast ucp-toast--error animate-in slide-in-from-bottom-8 fade-in duration-300">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <span className="ucp-toast__message">{fileNotification}</span>
        </div>
      )}
    </div>
  );
}
