const fs = require('fs');

const path = '/home/stephanie/firstStageDev/UCP/ucp-frontend/src/app/demande-achat/components/ReceptionModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. imports
content = content.replace(
  `import {
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
} from "@/services/achats";`,
  `import {
  X,
  Package,
  ClipboardCheck,
  AlertCircle,
  FileText,
  Check,
  CheckCircle,
  UploadCloud,
} from "lucide-react";

import {
  DemandeAchat,
  ReceiveDemandePayload,
  ReceptionLignePayload,
  receiveDemandeAchat,
  uploadDocumentDemandeAchat,
} from "@/services/achats";`
);

// 2. States and Memo
content = content.replace(
`  const [conformiteQuantite, setConformiteQuantite] = useState<
    ReceiveDemandePayload["conformite_quantite"] | ""
  >(() => (demande?.conformite_quantite as ReceiveDemandePayload["conformite_quantite"]) || "");
  const [conformiteQualite, setConformiteQualite] = useState<
    ReceiveDemandePayload["conformite_qualite"] | ""
  >(() => (demande?.conformite_qualite as ReceiveDemandePayload["conformite_qualite"]) || "");

  const [hasBL, setHasBL] = useState(false);
  const [hasPV, setHasPV] = useState(false);

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

  const [lignes, setLignes] = useState<ReceptionLignePayload[]>(() => buildInitialLignes(demande));

  const isProblemDetected = useMemo(() => {
    return (
      (conformiteQuantite !== "" && conformiteQuantite !== "CONFORME") ||
      (conformiteQualite !== "" && conformiteQualite !== "CONFORME")
    );
  }, [conformiteQuantite, conformiteQualite]);

  const calculatedStatus = useMemo(() => {
    if (conformiteQuantite === "" || conformiteQualite === "") return null;
    return isProblemDetected ? "ECART_DETECTE" : "RECEPTION_COMPLETE";
  }, [conformiteQualite, conformiteQuantite, isProblemDetected]);`,
`  const [conformiteQualite, setConformiteQualite] = useState<
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

  const [lignes, setLignes] = useState<ReceptionLignePayload[]>(() => buildInitialLignes(demande));

  const isDiffQuantite = useMemo(() => {
    return lignes.some((ligneState) => {
      const dbLigne = demande?.lignes_besoin.find(l => l.id === ligneState.ligne_id);
      return dbLigne && ligneState.quantite_recue < (dbLigne.quantite || 0);
    });
  }, [lignes, demande]);

  const conformiteQuantite = isDiffQuantite ? "PARTIELLE" : "CONFORME";

  const isProblemDetected = useMemo(() => {
    return isDiffQuantite || (conformiteQualite !== "" && conformiteQualite !== "CONFORME");
  }, [isDiffQuantite, conformiteQualite]);

  const statutReceptionDisplay = useMemo(() => {
    if (conformiteQualite === "") return "En attente";
    return isProblemDetected ? "Réceptionné partiel" : "Réceptionné complet";
  }, [conformiteQualite, isProblemDetected]);`
);


// 3. HandleSubmit
content = content.replace(
`  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!calculatedStatus) return;

    setSaving(true);
    setError(null);

    const payload: ReceiveDemandePayload = {
      date_reception: dateReception,
      receptionnaire,
      conformite_quantite: conformiteQuantite as ReceiveDemandePayload["conformite_quantite"],
      conformite_qualite: conformiteQualite as ReceiveDemandePayload["conformite_qualite"],
      observations_reception: "",
      statut_reception: calculatedStatus as ReceiveDemandePayload["statut_reception"],
      lignes,
    };

    if (isProblemDetected) {
      payload.type_ecart = typeEcart;
      payload.description_ecart = descriptionEcart;
      payload.action_corrective = actionCorrective;
    }

    try {
      await receiveDemandeAchat(demande.id, payload);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
      setSaving(false);
    }
  };`,
`  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (conformiteQualite === "") return;

    setSaving(true);
    setError(null);

    const payload: ReceiveDemandePayload = {
      date_reception: dateReception,
      receptionnaire,
      conformite_quantite: conformiteQuantite,
      conformite_qualite: conformiteQualite as ReceiveDemandePayload["conformite_qualite"],
      observations_reception: "",
      lignes,
      // On peut passer le statut mais c'est pas dans le type de base (ajout forcé par any ou pas)
    };

    if (isProblemDetected) {
      payload.type_ecart = typeEcart;
      payload.description_ecart = descriptionEcart;
      payload.action_corrective = actionCorrective;
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
  };`
);


// 4. Form structure layout & Quantite -> Qualite & Statut Badge & Documents Uploads
// Let's do string replacement for the big form areas.

content = content.replace(
  `overflow-hidden`,
  `overflow-y-auto`
);

// Top badge section
content = content.replace(
  `            <div className="flex items-center">
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold uppercase text-emerald-700">
                {demande.etat_expedition || "Arrivé"}
              </span>
            </div>`,
  `            <div className="flex items-center">
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold uppercase text-emerald-700">
                {demande.etat_expedition || "Arrivé"}
              </span>
            </div>
            <div className="h-4 w-px bg-slate-300"></div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Statut :</span>
              <span className={\`rounded-md px-2 py-0.5 text-xs font-bold uppercase \${statutReceptionDisplay === 'Réceptionné complet' ? 'bg-emerald-100 text-emerald-700' : statutReceptionDisplay === 'Réceptionné partiel' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}\`}>
                {statutReceptionDisplay}
              </span>
            </div>`
);


// Button Group Replacement
content = content.replace(
  `            {/* Décision Boutons */}
            <div className="flex flex-col gap-6 border-t border-slate-100 bg-slate-50/50 p-4 md:flex-row">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Conformité Quantité
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConformiteQuantite("CONFORME")}
                    className={\`flex-1 rounded-lg border py-2.5 text-sm font-bold transition \${
                      conformiteQuantite === "CONFORME"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }\`}
                  >
                    Conforme
                  </button>
                  <button
                    type="button"
                    onClick={() => setConformiteQuantite("PARTIELLE")}
                    className={\`flex-1 rounded-lg border py-2.5 text-sm font-bold transition \${
                      conformiteQuantite === "PARTIELLE"
                        ? "border-amber-500 bg-amber-50 text-amber-800"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }\`}
                  >
                    Partielle
                  </button>
                  <button
                    type="button"
                    onClick={() => setConformiteQuantite("NON_CONFORME")}
                    className={\`flex-1 rounded-lg border py-2.5 text-sm font-bold transition \${
                      conformiteQuantite === "NON_CONFORME"
                        ? "border-rose-500 bg-rose-50 text-rose-800"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }\`}
                  >
                    Non conforme
                  </button>
                </div>
              </div>

              <div className="hidden w-px bg-slate-200 md:block"></div>

              <div className="flex-1 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Conformité Qualité
                </label>`,
  `            {/* Décision Boutons */}
            <div className="flex flex-col gap-6 border-t border-slate-100 bg-slate-50/50 p-4 md:flex-row">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Conformité Qualité
                </label>`
);


// Documents and Submit Replacement
const docsRegex = /{[\s\S]*BLOC 4 & FOOTER - Documents et Validation[\s\S]*<\/form>/m;

const docsReplacement = `{/* BLOC 4 & FOOTER - Documents et Validation */}
          <div className="mt-auto flex flex-col md:flex-row items-end md:items-center justify-between gap-4 pt-2 border-t border-slate-100 mt-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
              {/* Upload Bon de Livraison */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="bl-upload"
                  className="hidden"
                  onChange={(e) => setFileBL(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="bl-upload"
                  className={\`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition \${
                    fileBL
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }\`}
                >
                  <FileText className="h-4 w-4" />
                  {fileBL ? <span className="max-w-[120px] truncate">{fileBL.name}</span> : "Ajouter bon de livraison"}
                  {fileBL && <Check className="h-4 w-4 shrink-0" />}
                </label>
              </div>

              {/* Upload PV de réception */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="pv-upload"
                  className="hidden"
                  onChange={(e) => setFilePV(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="pv-upload"
                  className={\`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition \${
                    filePV
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }\`}
                >
                  <FileText className="h-4 w-4" />
                  {filePV ? <span className="max-w-[120px] truncate">{filePV.name}</span> : "Ajouter PV de réception"}
                  {filePV && <Check className="h-4 w-4 shrink-0" />}
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || conformiteQualite === ""}
              className={\`inline-flex w-full md:w-auto items-center justify-center gap-2 rounded-xl px-8 py-3 text-sm font-bold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 \${
                isProblemDetected
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }\`}
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Traitement...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  {isProblemDetected ? "Valider avec écart" : "Valider la réception"}
                </>
              )}
            </button>
          </div>
        </form>`;

content = content.replace(docsRegex, docsReplacement);

fs.writeFileSync(path, content, 'utf8');
console.log('Done!');
