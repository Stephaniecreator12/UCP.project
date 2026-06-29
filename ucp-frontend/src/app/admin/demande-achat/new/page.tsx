"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, ArrowLeft, AlertCircle, FileText, Clock, ShoppingBag, Wrench, ShieldCheck, Sparkles, ChevronRight, Briefcase, Target, Layers } from "lucide-react";
import TopHeader from "@/app/components/TopHeader";
import PurchaseSelect from "@/app/admin/demande-achat/components/PurchaseSelect";
import { FRENCH_DATE_INPUT_PROPS, formatFrenchIsoDate } from "@/lib/date";

import {
  createDemandeAchat,
  submitDemandeAchat,
} from "@/services/achats";
import {
  getCurrentUser,
  getLandingRouteForUser,
  getToken,
  isAgentAchatUser,
  isFinanceUser,
  isValidatorUser,
} from "@/services/auth";
import {
  listExternalPersonnel,
  type PersonnelDirectoryOption,
} from "@/services/personnel";

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

type LigneModalProps = {
  open: boolean;
  mode: "create" | "edit";
  isServiceRequest: boolean;
  ligne: LigneForm;
  error: string | null;
  personnelOptions: PersonnelDirectoryOption[];
  personnelLoading: boolean;
  personnelError: string | null;
  onClose: () => void;
  onChange: (field: keyof LigneForm, value: string | number) => void;
  onSave: () => void;
};

type ServiceRoutingChoice = "DIRECT_VALIDATION" | "PREPARE_TDR" | "PREPARE_ST";

type ServiceRoutingModalProps = {
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onChoose: (choice: ServiceRoutingChoice) => void;
};

const uniteTechniqueOptions = [
  { value: "PASSATION", label: "Passation des marchés" },
  { value: "SUIVI_EVALUATION", label: "Suivi-évaluation" },
  { value: "FINANCE", label: "Finance" },
  { value: "LOGISTIQUE", label: "Logistique" },
  { value: "COORDINATION", label: "Coordination" },
  { value: "TECHNIQUE", label: "Technique" },
  { value: "RH_ADMIN", label: "Ressource humaine/administrative" },
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
  { value: "NORMAL", label: "Normal (5 jours)" },
  { value: "URGENT", label: "Urgent (48h)" },
] as const;

const fieldClass = "w-full rounded-xl border border-slate-200 bg-white/50 backdrop-blur-sm px-4 py-2.5 text-[13px] font-semibold text-slate-800 shadow-sm transition-all duration-300 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100 hover:border-slate-300";
const labelClass = "mb-1.5 block text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1";
const modalFieldClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100";
const modalAreaClass = `${modalFieldClass} min-h-[80px] resize-none leading-5`;
const modalLabelClass = "mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400";

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

const getTodayDate = () => new Date().toISOString().split("T")[0];

const formatFrenchDate = (value: string) => formatFrenchIsoDate(value);

const formatFrenchDateRange = (start: string, end: string) => {
  if (start && end) return `${formatFrenchDate(start)} au ${formatFrenchDate(end)}`;
  if (start) return `À partir du ${formatFrenchDate(start)}`;
  if (end) return `Jusqu'au ${formatFrenchDate(end)}`;
  return "Dates non définies";
};

const buildTdrStRedirectUrl = (demandeId: number, docType: "TDR" | "ST") =>
  `/TdrSt/new?demandeId=${demandeId}&source=demande-achat&docType=${docType}`;

function NotificationPopup({ message, type, onClose }: { message: string, type: 'error' | 'success', onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);
  
  const isError = type === 'error';
  
  // Positionné en bas à droite pour rester visible sans gêner la saisie.
  return (
    <div className={`ucp-toast ${isError ? "ucp-toast--error" : "ucp-toast--success"} animate-in slide-in-from-bottom-8 fade-in duration-300`}>
      <div className="ucp-toast__icon-shell">
        {isError ? <AlertCircle className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
      </div>
      <div className="min-w-0 flex-1 pr-1">
        <h4 className="ucp-toast__title">{isError ? "Action requise" : "Operation reussie"}</h4>
        <p className="ucp-toast__message whitespace-pre-line">{message}</p>
      </div>
      <button onClick={onClose} className="ucp-toast__close">
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function ServiceRoutingModal({
  open,
  saving,
  onClose,
  onChoose,
}: ServiceRoutingModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, saving]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-900">Choisir le document à produire</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Pour un petit service, choisissez le document à préparer ou envoyez directement le dossier en validation.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3 p-6">
          <button
            type="button"
            disabled={saving}
            onClick={() => onChoose("DIRECT_VALIDATION")}
            className="flex w-full items-start gap-4 rounded-[20px] border border-slate-200 bg-white p-4 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-50/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-slate-900">Validation directe</p>
              <p className="mt-1 text-sm text-slate-600">
                Le dossier est soumis immédiatement au circuit de validation de l&apos;état de besoins.
              </p>
            </div>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => onChoose("PREPARE_TDR")}
            className="flex w-full items-start gap-4 rounded-[20px] border border-slate-200 bg-white p-4 text-left transition-colors hover:border-sky-300 hover:bg-sky-50/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-slate-900">Préparer un TDR</p>
              <p className="mt-1 text-sm text-slate-600">
                Le dossier est enregistré puis vous êtes redirigé vers le formulaire TDR/ST avec le type TDR.
              </p>
            </div>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => onChoose("PREPARE_ST")}
            className="flex w-full items-start gap-4 rounded-[20px] border border-slate-200 bg-white p-4 text-left transition-colors hover:border-violet-300 hover:bg-violet-50/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-slate-900">Préparer une ST</p>
              <p className="mt-1 text-sm text-slate-600">
                Le dossier est enregistré puis vous êtes redirigé vers le formulaire TDR/ST avec le type ST.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function LigneBesoinModal({
  open,
  mode,
  isServiceRequest,
  ligne,
  error,
  personnelOptions,
  personnelLoading,
  personnelError,
  onClose,
  onChange,
  onSave,
}: LigneModalProps) {
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
  const personnelListId = "modal-destinataire-final-list";
  const hasPersonnelOptions = personnelOptions.length > 0;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-4 backdrop-blur-sm animate-in fade-in duration-300" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div 
        className="w-full max-w-4xl overflow-hidden rounded-[32px] border border-white/40 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] animate-in zoom-in-95 slide-in-from-bottom-8 duration-300"
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
            <div className="mb-5 ucp-inline-notice ucp-inline-notice--error animate-in shake duration-500">
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
                 <div><label className={modalLabelClass}>Date de début *</label><input id="modal_date_debut" type="date" min={getTodayDate()} value={ligne.date_debut} onChange={(e) => onChange("date_debut", e.target.value)} {...FRENCH_DATE_INPUT_PROPS} className={modalFieldClass} /></div>
                 <div><label className={modalLabelClass}>Date de fin *</label><input id="modal_date_fin" type="date" min={ligne.date_debut || getTodayDate()} value={ligne.date_fin} onChange={(e) => onChange("date_fin", e.target.value)} {...FRENCH_DATE_INPUT_PROPS} className={modalFieldClass} /></div>
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
                 <div className="md:col-span-2">
                   <label className={modalLabelClass}>Destinataire final *</label>
                   <input
                     id="modal_destinataire_final"
                     list={hasPersonnelOptions ? personnelListId : undefined}
                     value={ligne.destinataire_final}
                     onChange={(e) => onChange("destinataire_final", e.target.value)}
                     className={modalFieldClass}
                     placeholder={
                       personnelLoading
                         ? "Chargement du personnel..."
                         : "Choisir un agent ou saisir manuellement..."
                     }
                     autoComplete="off"
                   />
                   {hasPersonnelOptions ? (
                     <datalist id={personnelListId}>
                       {personnelOptions.map((option) => {
                         const optionLabel = option.subtitle
                           ? `${option.label} - ${option.subtitle}`
                           : option.label;

                         return (
                           <option
                             key={`${option.id}-${option.label}`}
                             value={option.label}
                             label={optionLabel}
                           >
                             {optionLabel}
                           </option>
                         );
                       })}
                     </datalist>
                   ) : null}
                   <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                     {personnelLoading
                       ? "Connexion a l'annuaire du personnel en cours."
                       : personnelError
                         ? "Annuaire externe indisponible pour l'instant. La saisie manuelle reste possible."
                         : hasPersonnelOptions
                           ? "Choisis un agent dans la liste synchronisee avec leur serveur."
                           : "La liste du personnel sera utilisee des qu'elle sera disponible."}
                   </p>
                 </div>
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
  
  // États du formulaire principal.
  const [uniteTechnique, setUniteTechnique] = useState("");
  const [categorieBesoin, setCategorieBesoin] = useState("");
  const [typeDemande, setTypeDemande] = useState("");
  const [priorite, setPriorite] = useState("");
  const [objet, setObjet] = useState("");
  const [justification, setJustification] = useState("");
  const [lienPtba, setLienPtba] = useState("");
  const [serviceBeneficiaire, setServiceBeneficiaire] = useState("");
  
  // Lignes de besoins ajoutées par l'utilisateur.
  const [lignes, setLignes] = useState<LigneForm[]>([]);
  const [ligneModalOpen, setLigneModalOpen] = useState(false);
  const [editingLigneIndex, setEditingLigneIndex] = useState<number | null>(null);
  const [ligneDraft, setLigneDraft] = useState<LigneForm>(emptyLigne("MATERIELS"));
  const [ligneModalError, setLigneModalError] = useState<string | null>(null);

  // États d'interface: chargement, popup, annuaire, etc.
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'error' | 'success'} | null>(null);
  const [serviceRoutingModalOpen, setServiceRoutingModalOpen] = useState(false);
  const [personnelOptions, setPersonnelOptions] = useState<PersonnelDirectoryOption[]>([]);
  const [personnelLoading, setPersonnelLoading] = useState(false);
  const [personnelError, setPersonnelError] = useState<string | null>(null);

  const isServiceRequest = typeDemande === "PETITS_SERVICES";
  
  useEffect(() => {
    if (!getToken()) return router.replace("/login");
    const u = getCurrentUser(); 
    if (isValidatorUser(u) || isAgentAchatUser(u) || isFinanceUser(u)) router.replace(getLandingRouteForUser(u));
  }, [router]);

  useEffect(() => {
    let active = true;

    // Le destinataire final peut venir d'un annuaire externe, mais
    // la saisie manuelle reste possible si cet annuaire est indisponible.
    const loadPersonnel = async () => {
      if (!getToken()) return;

      setPersonnelLoading(true);
      setPersonnelError(null);

      try {
        const personnel = await listExternalPersonnel();
        if (!active) return;
        setPersonnelOptions(personnel);
      } catch (error) {
        if (!active) return;
        setPersonnelOptions([]);
        setPersonnelError(
          error instanceof Error
            ? error.message
            : "Annuaire du personnel indisponible.",
        );
      } finally {
        if (active) setPersonnelLoading(false);
      }
    };

    loadPersonnel();

    return () => {
      active = false;
    };
  }, []);

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

  // On normalise ici la ligne de formulaire pour l'envoyer au backend
  // avec les bons types et sans valeurs vides parasites.
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

  // Toutes les validations bloquantes du formulaire passent ici afin
  // d'avoir un seul point de contrôle avant soumission.
  const validateBeforeSubmit = () => {
    if (!uniteTechnique) {
       setNotification({message: "La cellule est obligatoire.", type: 'error'});
       scrollToElement("uniteTechnique");
       return false;
    }
    if (!typeDemande) {
       setNotification({message: "Le type de besoin est obligatoire.", type: 'error'});
       scrollToElement("typeDemande");
       return false;
    }
    if (!categorieBesoin) {
       setNotification({message: "La catégorie de besoin est obligatoire.", type: 'error'});
       scrollToElement("categorieBesoin");
       return false;
    }
    if (!priorite) {
       setNotification({message: "La priorité est obligatoire.", type: 'error'});
       scrollToElement("priorite");
       return false;
    }
    if (!serviceBeneficiaire.trim()) {
       setNotification({message: "Le service bénéficiaire final est obligatoire.", type: 'error'});
       scrollToElement("serviceBeneficiaire");
       return false;
    }
    if (!lienPtba.trim()) {
       setNotification({message: "La référence au PTBA est obligatoire.", type: 'error'});
       scrollToElement("lienPtba");
       return false;
    }
    if (!objet.trim()) {
       setNotification({message: "L'objet de l'état de besoins est obligatoire.", type: 'error'});
       scrollToElement("objet");
       return false;
    }
    if (!justification.trim()) {
       setNotification({message: "La justification est obligatoire.", type: 'error'});
       scrollToElement("justification");
       return false;
    }
    if (lignes.length === 0) {
       setNotification({message: "Veuillez ajouter au moins une ligne de besoin.", type: 'error'});
       scrollToElement("lignesSection");
       return false;
    }

    return true;
  };

  // Cette fonction orchestre la création du dossier puis la bifurcation:
  // validation directe ou préparation d'un brouillon TDR/ST.
  const submitDemandeFlow = async (choice: ServiceRoutingChoice) => {
    setSaving(true);
    try {
      const res = await createDemandeAchat({
        requires_tdr: choice !== "DIRECT_VALIDATION",
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
      if (!res?.id) {
        throw new Error("Le dossier n'a pas pu être créé.");
      }

      if (choice === "DIRECT_VALIDATION") {
        await submitDemandeAchat(res.id);
        setNotification({message: "État de besoins soumis avec succès !", type: 'success'});
        setTimeout(() => router.push("/demande-achat/dashboard"), 1200);
        return;
      }

      const targetDocType = choice === "PREPARE_ST" ? "ST" : "TDR";
      const targetDocLabel = targetDocType === "ST" ? "spécification technique" : "TDR";

      setNotification({
        message: `Redirection vers le formulaire ${targetDocLabel}.`,
        type: "success",
      });
      setTimeout(
        () => {
          const targetUrl = buildTdrStRedirectUrl(res.id, targetDocType);
          if (typeof window !== "undefined") {
            window.location.assign(targetUrl);
            return;
          }
          router.push(targetUrl);
        },
        900,
      );
    } catch (err: unknown) { 
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur de connexion. Vérifiez les données.";
      setNotification({message: errorMessage, type: 'error'}); 
    } finally { 
      setSaving(false); 
    }
  };

  // Le bouton "soumettre" choisit d'abord le parcours métier à suivre
  // avant de lancer le flux réel d'enregistrement.
  const handleSubmit = async (e: FormEvent | null) => {
    if (e) e.preventDefault();
    if (!validateBeforeSubmit()) return;

    if (typeDemande === "PETITS_SERVICES") {
      setServiceRoutingModalOpen(true);
      return;
    }

    await submitDemandeFlow("PREPARE_TDR");
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

  const submitButtonLabel =
    typeDemande === "MATERIELS"
      ? "SOUMETTRE ET PREPARER LE TDR"
      : typeDemande === "PETITS_SERVICES"
        ? "SOUMETTRE ET CHOISIR LE PARCOURS"
        : "SOUMETTRE L'ÉTAT DE BESOINS";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#f6faf8_0%,transparent_25%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] text-slate-800 pb-24 font-sans antialiased selection:bg-emerald-200">
      <TopHeader />
      {notification && <NotificationPopup message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}

      <div className="zoom-content h-full">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 gap-6 mt-8 pb-12 flex flex-col animate-in slide-in-from-bottom-6 duration-700">
        
        {/* En-tête principal de l'écran de création. */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden group w-full">
           <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-100 to-teal-50 opacity-50 rounded-full blur-3xl -z-10 group-hover:scale-110 transition-transform duration-700"></div>
           
           <div className="flex items-center gap-4">
              <div className="relative">
                 <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 rotate-3 group-hover:rotate-6 transition-all duration-300">
                    <FileText className="h-6 w-6" />
                 </div>
                 <Sparkles className="absolute -top-2 -right-2 h-4 w-4 text-amber-400 animate-pulse" />
              </div>
              <div>
                 <h1 className="text-xl font-black text-slate-800 tracking-tight">ÉTAT DE BESOINS</h1>
                 <div className="flex items-center gap-2 mt-1">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest">Nouveau dossier de demande</p>
                 </div>
              </div>
           </div>
           
           <button type="button" onClick={() => router.push("/demande-achat/dashboard")} className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-sm">
              <ArrowLeft className="h-3.5 w-3.5" /> Retour
           </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 w-full">
          
          {/* Section 1: informations administratives de la demande. */}
          <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.05)] backdrop-blur-md transition-all duration-500 hover:shadow-[0_12px_48px_rgba(0,0,0,0.08)]">
             <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 bg-[length:200%_100%] animate-gradient"></div>
             <div className="p-6">
                <h2 className="mb-6 flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-800">
                   <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-600 shadow-sm backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                      <Briefcase className="h-5 w-5" />
                   </div>
                   1. Informations Administratives
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   <div className="lg:col-span-1">
                     <label className={labelClass}>Cellule *</label>
                     <PurchaseSelect
                       id="uniteTechnique"
                       value={uniteTechnique}
                       onChange={handleUniteTechniqueChange}
                       options={[...uniteTechniqueOptions]}
                       placeholder="Sélectionner une cellule..."
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
             <div className="p-6">
                <h2 className="mb-6 flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-800">
                   <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100/80 text-teal-600 shadow-sm backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
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
             <div className="p-6">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                   <h2 className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-800">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-600 shadow-sm backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                         <Layers className="h-5 w-5" />
                      </div>
                      3. Besoins (État quantitatif)
                   </h2>
                   <button type="button" onClick={openCreateLigneModal} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-700 hover:-translate-y-0.5 active:translate-y-0">
                      <Plus className="h-4 w-4" /> Ajouter un besoin
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
                                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1"><Clock className="w-3 h-3"/> {formatFrenchDateRange(l.date_debut, l.date_fin)}</span>
                                 ) : (
                                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[11px] font-bold border border-emerald-100">Quantité: {l.quantite} {l.unite}</span>
                                 )}
                                 {l.prix_unitaire_estime ? <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-bold block border border-slate-200">Est. {formatAmount(getLigneTotal(l, isServiceRequest))}</span> : null}
                               </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-2 self-end sm:self-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-50 w-full sm:w-auto">
                            <button type="button" onClick={() => openEditLigneModal(i)} className="flex-1 sm:flex-none text-slate-600 hover:text-slate-900 text-[10px] font-black uppercase tracking-widest px-3 py-2 flex items-center justify-center gap-2 border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-all">Modifier</button>
                            <button type="button" onClick={() => setLignes(prev => prev.filter((_, idx) => idx !== i))} className="flex-1 sm:flex-none text-red-500 hover:text-red-700 text-[10px] font-black uppercase tracking-widest px-3 py-2 flex items-center justify-center gap-2 border border-slate-200 rounded-lg shadow-sm hover:bg-red-50 transition-all">Supprimer</button>
                         </div>
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
                {saving ? "TRAITEMENT EN COURS..." : submitButtonLabel}
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
        personnelOptions={personnelOptions}
        personnelLoading={personnelLoading}
        personnelError={personnelError}
        onClose={closeLigneModal}
        onChange={handleLigneDraftChange}
        onSave={handleSaveLigne}
      />
      <ServiceRoutingModal
        open={serviceRoutingModalOpen}
        saving={saving}
        onClose={() => setServiceRoutingModalOpen(false)}
        onChoose={(choice) => {
          setServiceRoutingModalOpen(false);
          void submitDemandeFlow(choice);
        }}
      />
    </main>
  );
}
