"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X, ArrowLeft, Edit2, AlertCircle, FileText, UploadCloud, Clock, ShoppingBag, Wrench, ShieldCheck, Sparkles, ChevronRight, Briefcase, Target, Layers, FolderArchive } from "lucide-react";
import TopHeader from "@/app/components/TopHeader";
import PurchaseSelect from "@/app/demande-achat/components/PurchaseSelect";

import {
  createDemandeAchat,
  submitDemandeAchat,
  uploadDocumentDemandeAchat,
} from "@/services/achats";
import {
  getCurrentUser,
  getLandingRouteForUser,
  getToken,
  isAgentAchatUser,
  isFinanceUser,
  isValidatorUser,
} from "@/services/auth";

type LigneForm = {
  designation: string;
  marque_modele: string;
  caracteristiques_techniques: string;
  quantite: number;
  unite: string;
  prix_unitaire_estime: string;
  lieu_livraison: string;
  destinataire_final: string;
  type_service: string;
  description_service: string;
  date_debut: string;
  date_fin: string;
  duree_estimee: string;
  lieu_execution: string;
  livrables_attendus: string;
  nombre_beneficiaires: string;
};

type DocumentForm = {
  type_document: string;
  commentaire: string;
  fichier: File | null;
};

type LigneModalProps = {
  open: boolean;
  mode: "create" | "edit";
  isServiceRequest: boolean;
  ligne: LigneForm;
  error: string | null;
  onClose: () => void;
  onChange: (field: keyof LigneForm, value: string | number) => void;
  onSave: () => void;
};

const uniteTechniqueOptions = [
  { value: "PASSATION", label: "Passation des marchés" },
  { value: "SUIVI_EVALUATION", label: "Suivi-évaluation" },
  { value: "FINANCE", label: "Finance" },
  { value: "LOGISTIQUE", label: "Logistique" },
  { value: "COORDINATION", label: "Coordination" },
  { value: "TECHNIQUE", label: "Technique" },
] as const;

const typeServiceOptions = [
  { value: "FORMATION", label: "Formation" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "REPARATION", label: "Réparation" },
  { value: "NETTOYAGE", label: "Nettoyage" },
  { value: "PRESTATION_PONCTUELLE", label: "Prestation ponctuelle" },
] as const;

const typeDemandeOptions = [
  { value: "MATERIELS", label: "Matériels" },
  { value: "PETITS_SERVICES", label: "Petits services" },
] as const;

const categorieBesoinOptions = [
  { value: "NOUVEAU_BESOIN", label: "Nouveau besoin" },
  { value: "REAPPROVISIONNEMENT", label: "Réapprovisionnement stock" },
  { value: "REMPLACEMENT", label: "Remplacement équipement défectueux" },
  { value: "URGENCE", label: "Urgence opérationnelle" },
] as const;

const prioriteOptions = [
  { value: "NORMAL", label: "Normale (48h)" },
  { value: "URGENT", label: "Urgente (24h)" },
] as const;

const documentTypesOptions = [
  { value: "SPECIFICATIONS_TECHNIQUES", label: "Spécifications techniques détaillées (PDF/Excel)" },
  { value: "TDR_SIMPLIFIE", label: "Termes de Référence simplifiés (PDF)" },
  { value: "DEVIS_ESTIMATIF", label: "Devis estimatif (PDF/Excel)" },
  { value: "BON_SORTIE_STOCK", label: "Bon de sortie stock (PDF)" },
] as const;

const fieldClass = "w-full rounded-xl border border-slate-200 bg-white/50 backdrop-blur-sm px-4 py-3 text-[14px] text-slate-800 shadow-sm transition-all duration-300 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 hover:border-slate-300";
const labelClass = "mb-2 block text-[13px] font-bold uppercase tracking-wider text-slate-600 ml-1";
const modalFieldClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";
const modalAreaClass = `${modalFieldClass} min-h-[92px] resize-none leading-5`;
const modalLabelClass = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500";

const emptyLigne = (typeDemande: string = "MATERIELS"): LigneForm => ({
  designation: "",
  marque_modele: "",
  caracteristiques_techniques: "",
  quantite: 1,
  unite: typeDemande === "MATERIELS" ? "Pièce" : "Service",
  prix_unitaire_estime: "",
  lieu_livraison: "",
  destinataire_final: "",
  type_service: "",
  description_service: "",
  date_debut: "",
  date_fin: "",
  duree_estimee: "",
  lieu_execution: "",
  livrables_attendus: "",
  nombre_beneficiaires: "",
});

const formatAmount = (value: number) =>
  `${value.toLocaleString("fr-FR", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })} Ar`;

const getLigneTotal = (ligne: LigneForm, isServiceRequest: boolean) =>
  Number(ligne.prix_unitaire_estime || 0) * Number(isServiceRequest ? 1 : ligne.quantite || 0);

const normalizeText = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const normalizeInteger = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
};

function NotificationPopup({ message, type, onClose }: { message: string, type: 'error' | 'success', onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);
  
  const isError = type === 'error';
  
  // Positionné en bas à droite pour être bien visible mais sans bloquer l'interface, style très clean type "Sonner"
  return (
    <div className={`fixed inset-x-4 bottom-4 z-[9999] flex items-start gap-4 rounded-2xl border px-5 py-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.3)] ring-1 ring-white/15 backdrop-blur-sm animate-in slide-in-from-bottom-8 fade-in duration-300 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-[34rem] sm:min-w-[24rem] sm:px-6 sm:py-5 ${isError ? 'bg-red-600/95 border-red-500' : 'bg-emerald-600/95 border-emerald-500'}`}>
      <div className="rounded-xl bg-white/20 p-3 shadow-inner">
        {isError ? <AlertCircle className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
      </div>
      <div className="min-w-0 flex-1 pr-1">
        <h4 className="mb-1 text-base font-black tracking-wide">{isError ? "Action requise" : "Operation reussie"}</h4>
        <p className="whitespace-pre-line text-[15px] font-semibold leading-6 text-white/95 sm:text-base">{message}</p>
      </div>
      <button onClick={onClose} className="ml-1 rounded-xl p-2.5 transition-colors hover:bg-white/20">
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function LigneBesoinModal({ open, mode, isServiceRequest, ligne, error, onClose, onChange, onSave }: LigneModalProps) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => { window.removeEventListener("keydown", h); };
  }, [open, onClose]);

  if (!open) return null;

  const handleInnerSave = () => {
    onSave();
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-4 backdrop-blur-sm animate-in fade-in duration-300" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div 
        className="w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/40 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] animate-in zoom-in-95 slide-in-from-bottom-8 duration-300"
      >
        <div className="relative border-b border-slate-100 bg-slate-50/80 px-5 py-4">
           <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500"></div>
           <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                 <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
                   {isServiceRequest ? <Wrench className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
                 </div>
                 <div>
                    <h2 className="text-lg font-black tracking-tight text-slate-800">{mode === "edit" ? "Modifier le besoin" : "Ajouter un besoin"}</h2>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{isServiceRequest ? "Prestation compacte" : "Ligne article compacte"}</p>
                 </div>
              </div>
              <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition-all duration-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600">
                <X className="h-4 w-4" />
              </button>
           </div>
        </div>
        
        <div className="p-5 sm:p-6">
          {error && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 shadow-sm animate-in shake duration-500">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
             {isServiceRequest ? (
               <>
                 <div>
                   <label className={modalLabelClass}>Type de service *</label>
                   <PurchaseSelect
                     id="modal_type_service"
                     value={ligne.type_service}
                     onChange={(value) => onChange("type_service", value)}
                     options={[...typeServiceOptions]}
                     placeholder="Sélectionner..."
                     className={modalFieldClass}
                   />
                 </div>
                 <div className="md:col-span-2 xl:col-span-3">
                   <label className={modalLabelClass}>Description du service *</label>
                   <textarea id="modal_description" value={ligne.description_service} onChange={(e) => onChange("description_service", e.target.value)} className={modalAreaClass} placeholder="Décrivez la prestation attendue avec précision..." />
                 </div>
                 <div><label className={modalLabelClass}>Date de début *</label><input id="modal_date_debut" type="date" value={ligne.date_debut} onChange={(e) => onChange("date_debut", e.target.value)} className={modalFieldClass} /></div>
                 <div><label className={modalLabelClass}>Date de fin *</label><input id="modal_date_fin" type="date" value={ligne.date_fin} onChange={(e) => onChange("date_fin", e.target.value)} className={modalFieldClass} /></div>
                 <div>
                   <label className={modalLabelClass}>Nb. bénéficiaires</label>
                   <input type="number" min="0" step="1" value={ligne.nombre_beneficiaires} onChange={(e) => onChange("nombre_beneficiaires", e.target.value)} className={modalFieldClass} placeholder="Ex: 10" />
                 </div>
                 <div>
                   <label className={modalLabelClass}>Coût estimé total *</label>
                   <div className="relative">
                     <input id="modal_prix_service" type="number" min="0" step="0.01" value={ligne.prix_unitaire_estime} onChange={(e) => onChange("prix_unitaire_estime", e.target.value)} className={`${modalFieldClass} pr-11 font-semibold text-emerald-700`} placeholder="0" />
                     <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">Ar</span>
                   </div>
                 </div>
                 <div className="md:col-span-2">
                   <label className={modalLabelClass}>Lieu d&apos;exécution *</label>
                   <input id="modal_lieu_execution" value={ligne.lieu_execution} onChange={(e) => onChange("lieu_execution", e.target.value)} className={modalFieldClass} placeholder="Ex: Campus A, Bloc hospitalier..." />
                 </div>
                 <div className="md:col-span-2 xl:col-span-3">
                   <label className={modalLabelClass}>Livrables attendus *</label>
                   <input id="modal_livrables" value={ligne.livrables_attendus} onChange={(e) => onChange("livrables_attendus", e.target.value)} className={modalFieldClass} placeholder="Rapports, certificats, équipements..." />
                 </div>
               </>
             ) : (
               <>
                 <div className="md:col-span-2 xl:col-span-3"><label className={modalLabelClass}>Désignation de l&apos;article *</label><input id="modal_designation" value={ligne.designation} onChange={(e) => onChange("designation", e.target.value)} className={`${modalFieldClass} font-semibold`} placeholder="Nom du matériel..." /></div>
                 <div><label className={modalLabelClass}>Marque / Modèle</label><input value={ligne.marque_modele} onChange={(e) => onChange("marque_modele", e.target.value)} className={modalFieldClass} placeholder="Spécifier si nécessaire..." /></div>
                 <div><label className={modalLabelClass}>Quantité *</label><input id="modal_quantite" type="number" min="1" value={ligne.quantite} onChange={(e) => onChange("quantite", Number(e.target.value))} className={`${modalFieldClass} font-semibold`} /></div>
                 <div><label className={modalLabelClass}>Unité *</label><input id="modal_unite" value={ligne.unite} onChange={(e) => onChange("unite", e.target.value)} className={modalFieldClass} placeholder="Pièce, lot..." /></div>
                 <div className="md:col-span-2 xl:col-span-1">
                   <label className={modalLabelClass}>Prix estimé unitaire</label>
                   <div className="relative">
                     <input type="number" value={ligne.prix_unitaire_estime} onChange={(e) => onChange("prix_unitaire_estime", e.target.value)} className={`${modalFieldClass} pr-11`} placeholder="0" />
                     <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">Ar</span>
                   </div>
                 </div>
                 <div className="md:col-span-2 xl:col-span-3"><label className={modalLabelClass}>Caractéristiques techniques détaillées *</label><textarea id="modal_caracteristiques" value={ligne.caracteristiques_techniques} onChange={(e) => onChange("caracteristiques_techniques", e.target.value)} className={modalAreaClass} placeholder="Spécificités techniques, puissance, dimensions, normes..." /></div>
                 <div><label className={modalLabelClass}>Lieu de livraison *</label><input id="modal_lieu_livraison" value={ligne.lieu_livraison} onChange={(e) => onChange("lieu_livraison", e.target.value)} className={modalFieldClass} placeholder="Destination..." /></div>
                 <div className="md:col-span-2"><label className={modalLabelClass}>Destinataire final *</label><input id="modal_destinataire_final" value={ligne.destinataire_final} onChange={(e) => onChange("destinataire_final", e.target.value)} className={modalFieldClass} placeholder="Service ou unité..." /></div>
               </>
             )}
          </div>
        </div>
        
        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-100 active:scale-95">Annuler</button>
          <button type="button" onClick={handleInnerSave} className="rounded-2xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(5,150,105,0.24)] transition-all hover:bg-emerald-700 hover:-translate-y-0.5 active:translate-y-0">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

export default function NouvelleDemandePage() {
  const router = useRouter();
  
  // Section A states
  const [uniteTechnique, setUniteTechnique] = useState("");
  const [categorieBesoin, setCategorieBesoin] = useState("");
  const [typeDemande, setTypeDemande] = useState("");
  const [priorite, setPriorite] = useState("");
  const [objet, setObjet] = useState("");
  const [justification, setJustification] = useState("");
  const [lienPtba, setLienPtba] = useState("");
  const [serviceBeneficiaire, setServiceBeneficiaire] = useState("");
  
  // Besoins
  const [lignes, setLignes] = useState<LigneForm[]>([]);
  const [ligneModalOpen, setLigneModalOpen] = useState(false);
  const [editingLigneIndex, setEditingLigneIndex] = useState<number | null>(null);
  const [ligneDraft, setLigneDraft] = useState<LigneForm>(emptyLigne("MATERIELS"));
  const [ligneModalError, setLigneModalError] = useState<string | null>(null);
  
  // Documents
  const [documents, setDocuments] = useState<DocumentForm[]>([]);
  
  // UI states
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'error' | 'success'} | null>(null);

  const isServiceRequest = typeDemande === "PETITS_SERVICES";
  
  useEffect(() => {
    if (!getToken()) return router.replace("/login");
    const u = getCurrentUser(); 
    if (isValidatorUser(u) || isAgentAchatUser(u) || isFinanceUser(u)) router.replace(getLandingRouteForUser(u));
  }, [router]);

  const handleUniteTechniqueChange = (value: string) => {
    setUniteTechnique(value);
  };

  const scrollToElement = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus({ preventScroll: true }); // Ensure focus visibly happens
    }
  };

  const getDocumentRecommendations = () => {
    const recs: { label: string; required: boolean }[] = [];
    if (typeDemande === "MATERIELS") {
       recs.push({ label: "Spécifications techniques détaillées (Obligatoire pour matériels complexes)", required: true });
    } else if (typeDemande === "PETITS_SERVICES") {
       recs.push({ label: "Termes de Référence simplifiés (Obligatoire pour petits services simplifiés)", required: true });
    }
    if (categorieBesoin === "REAPPROVISIONNEMENT") {
       recs.push({ label: "Bon de sortie stock (Obligatoire pour Réapprovisionnement)", required: true });
    }
    
    // Devis estimatif est généralement requis au delà de certains montants (ex: 300 000 Ar)
    const totalEstime = lignes.reduce((acc, l) => acc + getLigneTotal(l, isServiceRequest), 0);
    if (totalEstime > 0) {
       recs.push({ label: "Devis estimatif (Obligatoire pour toute demande chiffrée)", required: true });
    }
    
    return recs;
  };

  const buildLignePayload = (ligne: LigneForm) => ({
    designation: normalizeText(ligne.designation),
    marque_modele: normalizeText(ligne.marque_modele),
    caracteristiques_techniques: normalizeText(ligne.caracteristiques_techniques),
    quantite: isServiceRequest ? 1 : Number(ligne.quantite || 1),
    unite: normalizeText(ligne.unite),
    prix_unitaire_estime: normalizeText(ligne.prix_unitaire_estime),
    lieu_livraison: normalizeText(ligne.lieu_livraison),
    destinataire_final: normalizeText(ligne.destinataire_final),
    type_service: normalizeText(ligne.type_service),
    description_service: normalizeText(ligne.description_service),
    date_debut: normalizeText(ligne.date_debut),
    date_fin: normalizeText(ligne.date_fin),
    duree_estimee: normalizeText(ligne.duree_estimee),
    lieu_execution: normalizeText(ligne.lieu_execution),
    livrables_attendus: normalizeText(ligne.livrables_attendus),
    nombre_beneficiaires: normalizeInteger(ligne.nombre_beneficiaires),
  });

  const handleSubmit = async (e: FormEvent | null) => {
    if (e) e.preventDefault();
    
    // Auto-scroll Validations
    if (!uniteTechnique) {
       setNotification({message: "L'Unité technique est obligatoire.", type: 'error'});
       return scrollToElement("uniteTechnique");
    }
    if (!typeDemande) {
       setNotification({message: "Le type de besoin est obligatoire.", type: 'error'});
       return scrollToElement("typeDemande");
    }
    if (!categorieBesoin) {
       setNotification({message: "La catégorie de besoin est obligatoire.", type: 'error'});
       return scrollToElement("categorieBesoin");
    }
    if (!priorite) {
       setNotification({message: "La priorité est obligatoire.", type: 'error'});
       return scrollToElement("priorite");
    }
    if (!serviceBeneficiaire.trim()) {
       setNotification({message: "Le service bénéficiaire final est obligatoire.", type: 'error'});
       return scrollToElement("serviceBeneficiaire");
    }
    if (!lienPtba.trim()) {
       setNotification({message: "La référence au PTBA est obligatoire.", type: 'error'});
       return scrollToElement("lienPtba");
    }
    if (!objet) {
       setNotification({message: "L'objet de l'état de besoins est obligatoire.", type: 'error'});
       return scrollToElement("objet");
    }
    if (!justification) {
       setNotification({message: "La justification est obligatoire.", type: 'error'});
       return scrollToElement("justification");
    }
    if (lignes.length === 0) {
       setNotification({message: "Veuillez ajouter au moins une ligne de besoin.", type: 'error'});
       return scrollToElement("lignesSection");
    }

    const hasIncompleteDocumentType = documents.some((doc) => doc.fichier && !doc.type_document);
    if (hasIncompleteDocumentType) {
       setNotification({message: "Choisissez un type pour chaque document ajouté.", type: 'error'});
       return scrollToElement("documentsSection");
    }

    // --- VALIDATION DES DOCUMENTS OBLIGATOIRES ---
    const uploadedTypes = documents.filter(d => d.fichier).map(d => d.type_document);
    
    if (typeDemande === "MATERIELS" && !uploadedTypes.includes("SPECIFICATIONS_TECHNIQUES")) {
       setNotification({message: "Les Spécifications techniques détaillées sont obligatoires pour les matériels.", type: 'error'});
       return scrollToElement("documentsSection");
    }
    
    if (typeDemande === "PETITS_SERVICES" && !uploadedTypes.includes("TDR_SIMPLIFIE")) {
       setNotification({message: "Les Termes de Référence (TDR) sont obligatoires pour les services.", type: 'error'});
       return scrollToElement("documentsSection");
    }
    
    if (categorieBesoin === "REAPPROVISIONNEMENT" && !uploadedTypes.includes("BON_SORTIE_STOCK")) {
       setNotification({message: "Le Bon de sortie stock est obligatoire pour un réapprovisionnement.", type: 'error'});
       return scrollToElement("documentsSection");
    }
    
    const totalEstime = lignes.reduce((acc, l) => acc + getLigneTotal(l, isServiceRequest), 0);
    if (totalEstime > 0 && !uploadedTypes.includes("DEVIS_ESTIMATIF")) {
       setNotification({message: "Le Devis estimatif est obligatoire car la demande comporte un montant estimé.", type: 'error'});
       return scrollToElement("documentsSection");
    }
    // ---------------------------------------------
    
    setSaving(true);
    try {
      const res = await createDemandeAchat({
        unite_technique: uniteTechnique, 
        categorie_besoin: categorieBesoin,
        type_demande: typeDemande,
        priorite: priorite, 
        objet: objet.trim(), 
        justification: justification.trim(), 
        lien_ptba: lienPtba.trim(),
        service_beneficiaire: serviceBeneficiaire.trim(), 
        lignes_besoin: lignes.map(buildLignePayload)
      });
      
      if (res?.id) { 
        // Handles Document Uploads
        for (const doc of documents) {
           if (doc.fichier) {
               if (!documentTypesOptions.some((option) => option.value === doc.type_document)) {
                  throw new Error("Le type de document selectionne est invalide.");
               }

               const fd = new FormData();
               fd.append("fichier", doc.fichier);
               fd.append("type_document", doc.type_document);
               fd.append("commentaire", doc.commentaire || "");
               await uploadDocumentDemandeAchat(res.id, fd);
           }
        }
        
        await submitDemandeAchat(res.id); 
        setNotification({message: "État de besoins soumis avec succès !", type: 'success'}); 
        setTimeout(() => router.push("/demande-achat/dashboard"), 2000); 
      }
    } catch (err: unknown) { 
      const errorMessage = err instanceof Error ? err.message : "Erreur de connexion. Vérifiez les données.";
      setNotification({message: errorMessage, type: 'error'}); 
    } finally { 
      setSaving(false); 
    }
  };

  const focusModalInput = (id: string) => {
    setTimeout(() => document.getElementById(id)?.focus(), 50);
  };

  const handleLigneDraftChange = (field: keyof LigneForm, value: string | number) => {
    setLigneModalError(null);
    setLigneDraft((prev) => ({ ...prev, [field]: value }));
  };

  const openCreateLigneModal = () => {
    if (!typeDemande) {
      setNotification({message: "Sélectionnez d'abord le type de besoin.", type: 'error'});
      return scrollToElement("typeDemande");
    }
    setEditingLigneIndex(null);
    setLigneDraft(emptyLigne(typeDemande));
    setLigneModalError(null);
    setLigneModalOpen(true);
  };

  const openEditLigneModal = (index: number) => {
    setEditingLigneIndex(index);
    setLigneDraft({ ...lignes[index] });
    setLigneModalError(null);
    setLigneModalOpen(true);
  };

  const closeLigneModal = () => {
    setLigneModalOpen(false);
    setLigneModalError(null);
  };

  const handleSaveLigne = () => {
    const isService = typeDemande !== "MATERIELS";
    if (isService) {
      if (!ligneDraft.type_service.trim()) {
         setLigneModalError("Le type de service est obligatoire.");
         return focusModalInput("modal_type_service");
      }
      if (!ligneDraft.description_service.trim()) {
         setLigneModalError("La description du service est obligatoire.");
         return focusModalInput("modal_description");
      }
      if (!ligneDraft.date_debut) {
         setLigneModalError("La date de début est obligatoire.");
         return focusModalInput("modal_date_debut");
      }
      if (!ligneDraft.date_fin) {
         setLigneModalError("La date de fin est obligatoire.");
         return focusModalInput("modal_date_fin");
      }
      if (ligneDraft.date_fin < ligneDraft.date_debut) {
         setLigneModalError("La date de fin doit être postérieure ou égale à la date de début.");
         return focusModalInput("modal_date_fin");
      }
      if (!ligneDraft.lieu_execution.trim()) {
         setLigneModalError("Le lieu d'exécution est obligatoire.");
         return focusModalInput("modal_lieu_execution");
      }
      if (!ligneDraft.livrables_attendus.trim()) {
         setLigneModalError("Les livrables attendus sont obligatoires.");
         return focusModalInput("modal_livrables");
      }
      if (!ligneDraft.prix_unitaire_estime || Number(ligneDraft.prix_unitaire_estime) <= 0) {
         setLigneModalError("Le coût estimé total doit être supérieur à 0.");
         return focusModalInput("modal_prix_service");
      }
    } else {
      if (!ligneDraft.designation.trim()) {
         setLigneModalError("La désignation est obligatoire.");
         return focusModalInput("modal_designation");
      }
      if (!ligneDraft.caracteristiques_techniques.trim()) {
         setLigneModalError("Les caractéristiques techniques sont obligatoires.");
         return focusModalInput("modal_caracteristiques");
      }
      if (!ligneDraft.quantite || ligneDraft.quantite < 1) {
         setLigneModalError("La quantité doit être supérieure à 0.");
         return focusModalInput("modal_quantite");
      }
      if (!ligneDraft.unite.trim()) {
         setLigneModalError("L'unité est obligatoire.");
         return focusModalInput("modal_unite");
      }
      if (!ligneDraft.lieu_livraison.trim()) {
         setLigneModalError("Le lieu de livraison est obligatoire.");
         return focusModalInput("modal_lieu_livraison");
      }
      if (!ligneDraft.destinataire_final.trim()) {
         setLigneModalError("Le destinataire final est obligatoire.");
         return focusModalInput("modal_destinataire_final");
      }
    }
    
    setLignes(p => (editingLigneIndex === null ? [...p, ligneDraft] : p.map((l, i) => i === editingLigneIndex ? ligneDraft : l))); 
    closeLigneModal();
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#f6faf8_0%,transparent_25%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] text-slate-800 pb-24 font-sans antialiased selection:bg-emerald-200">
      <TopHeader />
      {notification && <NotificationPopup message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}

      <div className="zoom-content h-full">
        <div className="max-w-container-zoomed mx-auto px-4 md:px-6 gap-8 mt-10 pb-12 flex flex-col animate-in slide-in-from-bottom-6 duration-700">
        
        {/* EN-TETE HERO - MODERN, COLORFUL LOGO & RETURN BTN */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden group w-full">
           <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-100 to-teal-50 opacity-50 rounded-full blur-3xl -z-10 group-hover:scale-110 transition-transform duration-700"></div>
           
           <div className="flex items-center gap-5">
              <div className="relative">
                 <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 rotate-3 group-hover:rotate-6 transition-all duration-300">
                    <FileText className="h-7 w-7" />
                 </div>
                 <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-amber-400 animate-pulse" />
              </div>
              <div>
                 <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-tight">ÉTAT DE BESOINS DE BIENS ET SERVICES</h1>
                 <div className="flex items-center gap-2 mt-1.5">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <p className="text-sm text-slate-500 font-medium tracking-wide">Formulaire officiel de remontée des besoins</p>
                 </div>
              </div>
           </div>
           
           <button type="button" onClick={() => router.push("/demande-achat/dashboard")} className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-sm">
              <ArrowLeft className="h-4 w-4" /> Retour
           </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 w-full">
          
          {/* SECTION 1: INFORMATIONS ADMINISTRATIVES */}
          <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.05)] backdrop-blur-md transition-all duration-500 hover:shadow-[0_12px_48px_rgba(0,0,0,0.08)]">
             <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 bg-[length:200%_100%] animate-gradient"></div>
             <div className="p-8">
                <h2 className="mb-8 flex items-center gap-4 text-base font-black uppercase tracking-tight text-slate-800">
                   <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100/80 text-emerald-600 shadow-sm backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                      <Briefcase className="h-5 w-5" />
                   </div>
                   1. Informations Administratives
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   <div className="lg:col-span-1">
                     <label className={labelClass}>Unité technique *</label>
                     <PurchaseSelect
                       id="uniteTechnique"
                       value={uniteTechnique}
                       onChange={handleUniteTechniqueChange}
                       options={[...uniteTechniqueOptions]}
                       placeholder="Sélectionner une unité..."
                       className={fieldClass}
                     />
                   </div>
                   <div className="lg:col-span-1">
                     <label className={labelClass}>Type de besoin *</label>
                     <PurchaseSelect
                       id="typeDemande"
                       value={typeDemande}
                       onChange={(value) => { setTypeDemande(value); setLignes([]); }}
                       options={[...typeDemandeOptions]}
                       placeholder="Sélectionner..."
                       className={fieldClass}
                     />
                   </div>
                   <div className="lg:col-span-1">
                     <label className={labelClass}>Catégorie de besoin *</label>
                     <PurchaseSelect
                       id="categorieBesoin"
                       value={categorieBesoin}
                       onChange={setCategorieBesoin}
                       options={[...categorieBesoinOptions]}
                       placeholder="Sélectionner..."
                       className={fieldClass}
                     />
                   </div>
                   <div className="lg:col-span-1">
                     <label className={labelClass}>Priorité *</label>
                     <PurchaseSelect
                       id="priorite"
                       value={priorite}
                       onChange={setPriorite}
                       options={[...prioriteOptions]}
                       placeholder="Sélectionner..."
                       className={fieldClass}
                     />
                   </div>
                </div>
             </div>
          </div>

          {/* SECTION 2: IDENTIFICATION DU BESOIN */}
          <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.05)] backdrop-blur-md transition-all duration-500 hover:shadow-[0_12px_48px_rgba(0,0,0,0.08)]">
             <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-500 bg-[length:200%_100%] animate-gradient"></div>
             <div className="p-8">
                <h2 className="mb-8 flex items-center gap-4 text-base font-black uppercase tracking-tight text-slate-800">
                   <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-100/80 text-teal-600 shadow-sm backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                      <Target className="h-5 w-5" />
                   </div>
                   2. Identification du besoin
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="col-span-2">
                     <label className={labelClass}>Objet de l&apos;état de besoins *</label>
                     <input id="objet" value={objet} onChange={(e) => setObjet(e.target.value)} className={`${fieldClass} !text-[15px] !font-semibold`} placeholder="Ex: Besoin en équipements informatiques..." />
                   </div>
                   <div>
                      <label className={labelClass}>Service bénéficiaire final *</label>
                      <input id="serviceBeneficiaire" value={serviceBeneficiaire} onChange={(e) => setServiceBeneficiaire(e.target.value)} className={fieldClass} placeholder="Ex: Service RH, Pharmacie..." />
                   </div>
                   <div>
                      <label className={labelClass}>Référence au PTBA *</label>
                      <input id="lienPtba" value={lienPtba} onChange={(e) => setLienPtba(e.target.value)} className={fieldClass} placeholder="Activité correspondante..." />
                   </div>
                   <div className="col-span-2">
                      <label className={labelClass}>Justification opérationnelle détaillée *</label>
                      <textarea id="justification" value={justification} onChange={(e) => setJustification(e.target.value)} className={`${fieldClass} min-h-[90px] leading-relaxed resize-y`} placeholder="Expliquez en détail pourquoi ce besoin est nécessaire à l'activité ou au projet..." />
                   </div>
                </div>
             </div>
          </div>

          {/* SECTION 3: LIGNES DE BESOINS */}
          <div id="lignesSection" className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.05)] backdrop-blur-md transition-all duration-500 hover:shadow-[0_12px_48px_rgba(0,0,0,0.08)]">
             <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-emerald-500 via-sky-400 to-emerald-500 bg-[length:200%_100%] animate-gradient"></div>
             <div className="p-8">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                   <h2 className="flex items-center gap-4 text-base font-black uppercase tracking-tight text-slate-800">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100/80 text-emerald-600 shadow-sm backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                         <Layers className="h-5 w-5" />
                      </div>
                      3. Besoins (État quantitatif)
                   </h2>
                   <button type="button" onClick={openCreateLigneModal} className="group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-emerald-600 px-6 py-3 text-[14px] font-black uppercase tracking-wider text-white shadow-[0_10px_20px_rgba(5,150,105,0.2)] transition-all hover:bg-emerald-700 hover:shadow-[0_15px_30px_rgba(5,150,105,0.3)] hover:-translate-y-0.5 active:translate-y-0">
                      <Plus className="h-5 w-5" /> Ajouter un besoin
                   </button>
                </div>
                
                {lignes.length === 0 ? (
                   <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-300 transition-colors hover:bg-slate-100 cursor-pointer relative z-10" onClick={openCreateLigneModal}>
                      <p className="text-[13px] font-medium text-slate-500">Aucun besoin renseigné pour le moment.</p>
                      <p className="text-[12px] text-slate-400 mt-1">Cliquez sur « Ajouter un besoin » pour préciser votre état de besoins.</p>
                   </div>
                ) : (
                  <div className="space-y-3">
                    {lignes.map((l, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-xl bg-white shadow-sm hover:border-emerald-300 transition-colors gap-4">
                         <div className="flex items-start gap-4">
                            <span className="flex-shrink-0 bg-slate-100 text-slate-600 font-black text-xs w-8 h-8 rounded-lg flex items-center justify-center">{i+1}</span>
                            <div>
                               <p className="text-[13.5px] font-bold text-slate-800">{isServiceRequest ? l.description_service : l.designation}</p>
                               <div className="flex items-center gap-2 mt-1 flex-wrap">
                                 {isServiceRequest ? (
                                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1"><Clock className="w-3 h-3"/> {l.date_debut && l.date_fin ? `${l.date_debut} au ${l.date_fin}` : 'Dates non définies'}</span>
                                 ) : (
                                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[11px] font-bold border border-emerald-100">Quantité: {l.quantite} {l.unite}</span>
                                 )}
                                 {l.prix_unitaire_estime ? <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-bold block border border-slate-200">Est. {formatAmount(getLigneTotal(l, isServiceRequest))}</span> : null}
                               </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-2 self-end sm:self-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto">
                            <button type="button" onClick={() => openEditLigneModal(i)} className="flex-1 sm:flex-none text-blue-600 hover:text-blue-800 text-[13px] font-bold px-3 py-2 flex items-center justify-center gap-2 border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"><Edit2 className="h-4 w-4" /> Modifier</button>
                            <button type="button" onClick={() => setLignes(prev => prev.filter((_, idx) => idx !== i))} className="flex-1 sm:flex-none text-red-600 hover:text-red-800 text-[13px] font-bold px-3 py-2 flex items-center justify-center gap-2 border border-slate-200 rounded-lg shadow-sm hover:bg-red-50 transition-colors"><Trash2 className="h-4 w-4" /> Supprimer</button>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>

          {/* SECTION 4: PIECES JOINTES */}
          <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.05)] backdrop-blur-md transition-all duration-500 hover:shadow-[0_12px_48px_rgba(0,0,0,0.08)]">
             <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500 bg-[length:200%_100%] animate-gradient"></div>
             <div className="p-8">
                <div id="documentsSection" className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                   <h2 className="flex items-center gap-4 text-base font-black uppercase tracking-tight text-slate-800">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100/80 text-amber-600 shadow-sm backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                         <FolderArchive className="h-5 w-5" />
                      </div>
                      4. Documents justificatifs
                   </h2>
                   <button type="button" onClick={() => setDocuments([...documents, { type_document: "", commentaire: "", fichier: null }])} className="flex items-center gap-3 overflow-hidden rounded-2xl bg-white border border-slate-200 px-6 py-3 text-[14px] font-black uppercase tracking-wider text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95">
                      <Plus className="h-5 w-5" /> Ajouter un fichier
                   </button>
                </div>
                   {getDocumentRecommendations().length > 0 && (
                      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/50 p-5 text-amber-800 text-[12px] font-bold shadow-sm backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-500">
                         <p className="flex items-center gap-2.5 mb-2.5 text-amber-700"><AlertCircle className="w-5 h-5"/> Documents recommandés pour cette configuration :</p>
                         <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 list-none">
                            {getDocumentRecommendations().map((r, i) => (
                               <li key={i} className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                  <span>{r.label} {r.required && <span className="text-rose-500 font-extrabold ml-1">*</span>}</span>
                                </li>
                            ))}
                         </ul>
                      </div>
                   )}
                
                {documents.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {documents.map((d, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors relative">
                         <div className="flex-1 space-y-3 min-w-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm w-10 h-10 flex items-center justify-center shrink-0 border border-slate-100">
                                   <UploadCloud className={`h-5 w-5 ${d.fichier ? 'text-emerald-500' : 'text-slate-400 animate-pulse'}`} />
                                </div>
                                <div className="flex-1 relative overflow-hidden">
                                   <input title="Upload" type="file" onChange={(e) => setDocuments(p => p.map((item, idx) => idx === i ? {...item, fichier: e.target.files?.[0] || null} : item))} className="opacity-0 absolute inset-0 z-10 cursor-pointer w-full h-full" />
                                   <div className={`p-2 border-2 border-dashed rounded-lg flex items-center justify-center text-[13px] font-bold truncate transition-colors cursor-pointer ${d.fichier ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-300 hover:border-emerald-400 hover:bg-white text-slate-500 bg-slate-100/50'}`}>
                                      {d.fichier ? <span className="truncate w-full text-center">{d.fichier.name}</span> : "Cliquez ou glissez un fichier..."}
                                   </div>
                                </div>
                            </div>
                         </div>
                         <div className="flex-1 min-w-[200px]">
                             <PurchaseSelect
                               value={d.type_document}
                               onChange={(value) => setDocuments(p => p.map((item, idx) => idx === i ? {...item, type_document: value} : item))}
                               options={[...documentTypesOptions]}
                               placeholder="Sélectionner..."
                               className={fieldClass}
                             />
                         </div>
                         <button type="button" onClick={() => setDocuments(p => p.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 sm:static sm:w-auto p-2 bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full sm:rounded-lg shadow-sm border border-slate-200 transition-colors">
                           <Trash2 className="h-4 w-4" />
                         </button>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>

          {/* SUBMIT BUTTON SECTION */}
          <div className="flex items-center justify-end pt-5 pb-12 w-full">
             <button type="submit" disabled={saving} className="w-full md:w-auto lg:w-1/3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-12 py-4 rounded-xl text-[16px] font-black uppercase tracking-wider shadow-[0_10px_30px_rgba(5,150,105,0.4)] hover:shadow-[0_15px_40px_rgba(5,150,105,0.5)] hover:-translate-y-1 transition-all disabled:opacity-70 disabled:pointer-events-none disabled:-translate-y-0 disabled:shadow-none flex items-center justify-center gap-3">
                {saving && <div className="h-5 w-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>}
                {saving ? "SOUMISSION EN COURS..." : "SOUMETTRE L'ÉTAT DE BESOINS"}
                {!saving && <ChevronRight className="h-5 w-5" />}
             </button>
          </div>

        </form>
      </div>
    </div>
      <LigneBesoinModal
        open={ligneModalOpen}
        mode={editingLigneIndex === null ? "create" : "edit"}
        isServiceRequest={isServiceRequest}
        ligne={ligneDraft}
        error={ligneModalError}
        onClose={closeLigneModal}
        onChange={handleLigneDraftChange}
        onSave={handleSaveLigne}
      />
    </main>
  );
}
