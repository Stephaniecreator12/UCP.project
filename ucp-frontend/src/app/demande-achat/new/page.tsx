"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2, UploadCloud, X } from "lucide-react";

import TopHeader from "@/app/components/TopHeader";
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

type LigneMetaItemProps = {
  label: string;
  value: ReactNode;
};

const categorieOptions = [
  { value: "NOUVEAU_BESOIN", label: "Nouveau besoin" },
  { value: "REAPPROVISIONNEMENT", label: "Réapprovisionnement stock" },
  { value: "REMPLACEMENT", label: "Remplacement équipement défectueux" },
  { value: "URGENCE", label: "Urgence opérationnelle" },
] as const;

const typeOptions = [
  { value: "MATERIELS", label: "Matériels" },
  { value: "PETITS_SERVICES", label: "Petits services" },
  { value: "SERVICES_RECURRENTS", label: "Services récurrents" },
] as const;

const prioriteOptions = [
  { value: "NORMAL", label: "Normal (5 jours)" },
  { value: "URGENT", label: "Urgent (48h)" },
] as const;

const typeServiceOptions = [
  { value: "FORMATION", label: "Formation" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "REPARATION", label: "Réparation" },
  { value: "NETTOYAGE", label: "Nettoyage" },
  { value: "PRESTATION_PONCTUELLE", label: "Prestation ponctuelle" },
] as const;

const documentOptions = [
  { value: "SPECIFICATIONS_TECHNIQUES", label: "Spécifications techniques détaillées" },
  { value: "TDR_SIMPLIFIE", label: "TDR simplifié" },
  { value: "DEVIS_ESTIMATIF", label: "Devis estimatif" },
  { value: "BON_SORTIE_STOCK", label: "Bon de sortie stock" },
] as const;

// VERY COMPACT AND CLINICAL CLASSES MATCHING MOCKUP
const fieldClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[0.85rem] text-slate-800 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500";
const areaClass = `${fieldClass} min-h-16 resize-y py-2`;
const labelClass = "mb-1 block text-[0.8rem] font-semibold text-slate-700";

const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-md bg-[#008f4c] px-6 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#007a41] focus:outline-none focus:ring-2 focus:ring-[#008f4c] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-6 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2";
const addOutlineButtonClass =
  "inline-flex items-center gap-1.5 rounded border border-[#008f4c] bg-white px-3 py-1.5 text-[0.8rem] font-semibold text-[#008f4c] transition-colors hover:bg-emerald-50";
const deleteButtonClass =
  "inline-flex items-center justify-center text-rose-500 hover:text-rose-700 transition-colors p-1.5 rounded hover:bg-rose-50";
const smallSecondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2";

const emptyLigne = (typeDemande: string = "MATERIELS"): LigneForm => ({
  designation: "",
  marque_modele: "",
  caracteristiques_techniques: "",
  quantite: 1,
  unite: typeDemande === "MATERIELS" ? "Pièce" : "Service",
  prix_unitaire_estime: "",
  lieu_livraison: "",
  destinataire_final: "",
  type_service: "FORMATION",
  description_service: "",
  date_debut: "",
  date_fin: "",
  duree_estimee: "",
  lieu_execution: "",
  livrables_attendus: "",
  nombre_beneficiaires: "",
});

const emptyDocument = (defaultType: string = "SPECIFICATIONS_TECHNIQUES"): DocumentForm => ({
  type_document: defaultType,
  commentaire: "",
  fichier: null,
});

const computeDurationEstimate = (dateDebut: string, dateFin: string) => {
  if (!dateDebut || !dateFin) return "";
  const start = new Date(dateDebut);
  const end = new Date(dateFin);
  const diff = end.getTime() - start.getTime();
  if (Number.isNaN(diff) || diff < 0) return "";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  return `${days} jour(s)`;
};

const formatAmount = (value: number) =>
  `${value.toLocaleString("fr-FR", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })} Ar`;

const getOptionLabel = (
  options: ReadonlyArray<{ readonly value: string; readonly label: string }>,
  value: string,
) => options.find((option) => option.value === value)?.label ?? value;

const getLigneTotal = (ligne: LigneForm, isServiceRequest: boolean) =>
  Number(ligne.prix_unitaire_estime || 0) *
  Number(isServiceRequest ? 1 : ligne.quantite || 0);

const getLigneValidationMessage = (
  ligne: LigneForm,
  isServiceRequest: boolean,
) => {
  if (isServiceRequest) {
    if (!ligne.description_service.trim()) {
      return "Veuillez renseigner la description du service.";
    }
    if (String(ligne.prix_unitaire_estime).trim() === "") {
      return "Veuillez renseigner le coût estimé.";
    }
    if (!ligne.date_debut || !ligne.date_fin) {
      return "Veuillez renseigner les dates.";
    }
    if (!ligne.lieu_execution.trim()) {
      return "Veuillez renseigner le lieu d'exécution.";
    }
    if (!ligne.livrables_attendus.trim()) {
      return "Veuillez renseigner les livrables attendus.";
    }
    return null;
  }

  if (!ligne.designation.trim()) {
    return "Veuillez renseigner la désignation.";
  }
  if (!ligne.caracteristiques_techniques.trim()) {
    return "Veuillez renseigner les spécifications techniques.";
  }
  if (!ligne.quantite || Number(ligne.quantite) <= 0) {
    return "Veuillez renseigner la quantité.";
  }
  if (!ligne.unite.trim()) {
    return "Veuillez renseigner l'unité.";
  }
  if (String(ligne.prix_unitaire_estime).trim() === "") {
    return "Veuillez renseigner le prix unitaire estimé.";
  }
  if (!ligne.lieu_livraison.trim()) {
    return "Veuillez renseigner le lieu de livraison.";
  }
  if (!ligne.destinataire_final.trim()) {
    return "Veuillez renseigner le destinataire final.";
  }
  return null;
};

const getFrenchSubmissionError = (err: unknown) => {
  if (err instanceof Error) {
    const normalized = err.message.toLowerCase();
    if (normalized.includes("failed to fetch") || normalized.includes("network")) return "Erreur réseau. Vérifiez votre connexion.";
    if (normalized.includes("unauthorized") || normalized.includes("forbidden")) return "Non autorisé.";
  }
  return "Une erreur est survenue lors de l'enregistrement.";
};

function LigneMetaItem({ label, value }: LigneMetaItemProps) {
  if (value === "" || value === null || value === undefined) return null;

  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <div className="mt-1 text-sm font-semibold text-slate-800">{value}</div>
    </div>
  );
}

function LigneBesoinModal({
  open,
  mode,
  isServiceRequest,
  ligne,
  error,
  onClose,
  onChange,
  onSave,
}: LigneModalProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open) return;

    const targetId = isServiceRequest
      ? "modal_ligne_service_description"
      : "modal_ligne_designation";

    const timeout = window.setTimeout(() => {
      (document.getElementById(targetId) as HTMLElement | null)?.focus?.();
    }, 60);

    return () => window.clearTimeout(timeout);
  }, [isServiceRequest, open]);

  if (!open) return null;

  const modalTitle =
    mode === "edit"
      ? "Modifier la ligne de besoin"
      : "Ajouter une ligne de besoin";

  return (
    <div
      className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ligne-besoin-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_28px_70px_-36px_rgba(15,23,42,0.45)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Ligne de besoin
            </p>
            <h2
              id="ligne-besoin-modal-title"
              className="mt-1 text-xl font-bold tracking-tight text-slate-900"
            >
              {modalTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {isServiceRequest
                ? "Renseignez les détails du service à demander."
                : "Renseignez les détails de l'article à demander."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          {error ? (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          ) : null}



          {isServiceRequest ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className={labelClass}>Type *</label>
                <select
                  value={ligne.type_service}
                  onChange={(e) => onChange("type_service", e.target.value)}
                  className={fieldClass}
                >
                  {typeServiceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass} htmlFor="modal_ligne_prix">
                  Coût estimé total *
                </label>
                <input
                  id="modal_ligne_prix"
                  type="number"
                  min="0"
                  value={ligne.prix_unitaire_estime}
                  onChange={(e) =>
                    onChange("prix_unitaire_estime", e.target.value)
                  }
                  className={fieldClass}
                />
              </div>

              <div className="md:col-span-2">
                <label
                  className={labelClass}
                  htmlFor="modal_ligne_service_description"
                >
                  Description / Nom *
                </label>
                <input
                  id="modal_ligne_service_description"
                  value={ligne.description_service}
                  onChange={(e) =>
                    onChange("description_service", e.target.value)
                  }
                  className={fieldClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="modal_ligne_date_debut">
                  Date début *
                </label>
                <input
                  id="modal_ligne_date_debut"
                  type="date"
                  value={ligne.date_debut}
                  onChange={(e) => onChange("date_debut", e.target.value)}
                  className={fieldClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="modal_ligne_date_fin">
                  Date fin *
                </label>
                <input
                  id="modal_ligne_date_fin"
                  type="date"
                  value={ligne.date_fin}
                  onChange={(e) => onChange("date_fin", e.target.value)}
                  className={fieldClass}
                />
              </div>

              <div>
                <label
                  className={labelClass}
                  htmlFor="modal_ligne_lieu_execution"
                >
                  Lieu d'exécution *
                </label>
                <input
                  id="modal_ligne_lieu_execution"
                  value={ligne.lieu_execution}
                  onChange={(e) => onChange("lieu_execution", e.target.value)}
                  className={fieldClass}
                />
              </div>

              <div>
                <label
                  className={labelClass}
                  htmlFor="modal_ligne_beneficiaires"
                >
                  Bénéficiaires (nb)
                </label>
                <input
                  id="modal_ligne_beneficiaires"
                  type="number"
                  min="0"
                  value={ligne.nombre_beneficiaires}
                  onChange={(e) =>
                    onChange("nombre_beneficiaires", e.target.value)
                  }
                  className={fieldClass}
                />
              </div>

              <div className="md:col-span-2">
                <label
                  className={labelClass}
                  htmlFor="modal_ligne_livrables"
                >
                  Livrables attendus *
                </label>
                <textarea
                  id="modal_ligne_livrables"
                  value={ligne.livrables_attendus}
                  onChange={(e) =>
                    onChange("livrables_attendus", e.target.value)
                  }
                  className={areaClass}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label
                  className={labelClass}
                  htmlFor="modal_ligne_designation"
                >
                  Désignation exacte *
                </label>
                <input
                  id="modal_ligne_designation"
                  value={ligne.designation}
                  onChange={(e) => onChange("designation", e.target.value)}
                  className={fieldClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="modal_ligne_marque">
                  Marque / Modèle attendu
                </label>
                <input
                  id="modal_ligne_marque"
                  value={ligne.marque_modele}
                  onChange={(e) => onChange("marque_modele", e.target.value)}
                  className={fieldClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="modal_ligne_quantite">
                  Quantité *
                </label>
                <input
                  id="modal_ligne_quantite"
                  type="number"
                  min="1"
                  value={ligne.quantite}
                  onChange={(e) => onChange("quantite", Number(e.target.value))}
                  className={fieldClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass} htmlFor="modal_ligne_specs">
                  Spécifications Techniques *
                </label>
                <textarea
                  id="modal_ligne_specs"
                  value={ligne.caracteristiques_techniques}
                  onChange={(e) =>
                    onChange("caracteristiques_techniques", e.target.value)
                  }
                  className={areaClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="modal_ligne_unite">
                  Unité *
                </label>
                <input
                  id="modal_ligne_unite"
                  value={ligne.unite}
                  onChange={(e) => onChange("unite", e.target.value)}
                  className={fieldClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="modal_ligne_prix">
                  Prix unitaire estimé *
                </label>
                <input
                  id="modal_ligne_prix"
                  type="number"
                  min="0"
                  value={ligne.prix_unitaire_estime}
                  onChange={(e) =>
                    onChange("prix_unitaire_estime", e.target.value)
                  }
                  className={fieldClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="modal_ligne_livraison">
                  Lieu de livraison *
                </label>
                <input
                  id="modal_ligne_livraison"
                  value={ligne.lieu_livraison}
                  onChange={(e) => onChange("lieu_livraison", e.target.value)}
                  className={fieldClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="modal_ligne_destinataire">
                  Destinataire final *
                </label>
                <input
                  id="modal_ligne_destinataire"
                  value={ligne.destinataire_final}
                  onChange={(e) => onChange("destinataire_final", e.target.value)}
                  className={fieldClass}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className={secondaryButtonClass}
          >
            Annuler
          </button>
          <button type="button" onClick={onSave} className={primaryButtonClass}>
            {mode === "edit" ? (
              <>
                <Save className="h-4 w-4" />
                Enregistrer la ligne
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Ajouter la ligne
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NouvelleDemandePage() {
  const router = useRouter();

  const [categorieBesoin, setCategorieBesoin] = useState("NOUVEAU_BESOIN");
  const [typeDemande, setTypeDemande] = useState("MATERIELS");
  const [priorite, setPriorite] = useState("NORMAL");
  const [objet, setObjet] = useState("");
  const [justification, setJustification] = useState("");
  const [lienPtba, setLienPtba] = useState("");
  const [serviceBeneficiaire, setServiceBeneficiaire] = useState("");
  const [ligneBudgetaire, setLigneBudgetaire] = useState("");
  const [sourceFinancement, setSourceFinancement] = useState("GAVI");

  const [lignes, setLignes] = useState<LigneForm[]>([]);
  const [ligneModalOpen, setLigneModalOpen] = useState(false);
  const [editingLigneIndex, setEditingLigneIndex] = useState<number | null>(
    null,
  );
  const [ligneDraft, setLigneDraft] = useState<LigneForm>(
    emptyLigne("MATERIELS"),
  );
  const [ligneModalError, setLigneModalError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentForm[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isServiceRequest = typeDemande !== "MATERIELS";

  const totalEstime = useMemo(
    () => lignes.reduce((sum, ligne) => sum + Number(ligne.prix_unitaire_estime || 0) * Number(isServiceRequest ? 1 : ligne.quantite || 0), 0),
    [isServiceRequest, lignes],
  );
  
  const totalEstimeLabel = useMemo(() => formatAmount(totalEstime), [totalEstime]);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    const currentUser = getCurrentUser();
    if (isValidatorUser(currentUser) || isAgentAchatUser(currentUser)) {
      router.replace(getLandingRouteForUser(currentUser));
    }
  }, [router]);

  useEffect(() => {
    if (error) {
      const timeout = window.setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timeout);
    }
  }, [error]);

  const handleTypeDemandeChange = (nextType: string) => {
    if (nextType === typeDemande) return;
    setTypeDemande(nextType);
    setLignes([]);
    setEditingLigneIndex(null);
    setLigneDraft(emptyLigne(nextType));
    setLigneModalError(null);
    setLigneModalOpen(false);
  };

  const updateLigneDraft = (
    field: keyof LigneForm,
    value: string | number,
  ) => {
    setLigneDraft((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "date_debut" || field === "date_fin") {
        next.duree_estimee = computeDurationEstimate(
          String(field === "date_debut" ? value : next.date_debut),
          String(field === "date_fin" ? value : next.date_fin),
        );
      }
      return next;
    });
  };

  const openCreateLigneModal = (initialError?: string | null) => {
    setEditingLigneIndex(null);
    setLigneDraft(emptyLigne(typeDemande));
    setLigneModalError(initialError ?? null);
    setLigneModalOpen(true);
  };

  const openEditLigneModal = (index: number, initialError?: string | null) => {
    setEditingLigneIndex(index);
    setLigneDraft({ ...lignes[index] });
    setLigneModalError(initialError ?? null);
    setLigneModalOpen(true);
  };

  const closeLigneModal = () => {
    setLigneModalOpen(false);
    setEditingLigneIndex(null);
    setLigneModalError(null);
  };

  const saveLigneDraft = () => {
    const validationMessage = getLigneValidationMessage(
      ligneDraft,
      isServiceRequest,
    );

    if (validationMessage) {
      setLigneModalError(validationMessage);
      return;
    }

    const nextLigne = { ...ligneDraft };

    setLignes((prev) => {
      if (editingLigneIndex === null) {
        return [...prev, nextLigne];
      }

      const next = [...prev];
      next[editingLigneIndex] = nextLigne;
      return next;
    });

    setError(null);
    closeLigneModal();
  };

  const focusField = (targetId: string) => {
    if (typeof document === "undefined") return;
    const element = document.getElementById(targetId);
    if (!element) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const y = element.getBoundingClientRect().top + window.scrollY - 150;
    window.scrollTo({ top: y, behavior: "smooth" });
    window.setTimeout(() => {
      (element as HTMLElement).focus?.();
    }, 100);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    if (!objet.trim()) {
      setError("Veuillez renseigner l'objet de la demande.");
      focusField("field_objet");
      return;
    }
    if (!justification.trim()) {
      setError("Veuillez renseigner la justification.");
      focusField("field_justification");
      return;
    }
    if (!serviceBeneficiaire.trim()) {
      setError("Veuillez renseigner le service bénéficiaire.");
      focusField("field_service");
      return;
    }
    if (!lienPtba.trim()) {
      setError("Veuillez renseigner la référence PTBA.");
      focusField("field_ptba");
      return;
    }
    if (!ligneBudgetaire.trim()) {
      setError("Veuillez renseigner la ligne budgétaire.");
      focusField("field_budget");
      return;
    }

    if (lignes.length === 0) {
      setError("Ajoutez au moins une ligne de besoin.");
      openCreateLigneModal();
      return;
    }

    for (let i = 0; i < lignes.length; i++) {
      const validationMessage = getLigneValidationMessage(
        lignes[i],
        isServiceRequest,
      );

      if (validationMessage) {
        setError(`Ligne ${i + 1} : ${validationMessage}`);
        openEditLigneModal(i, validationMessage);
        return;
      }
    }

    if (documents.some((doc) => doc.type_document && !doc.fichier)) {
      setError("Veuillez choisir un fichier pour chaque document ou supprimer la ligne.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const created = await createDemandeAchat({
        unite_technique: "Service",
        categorie_besoin: categorieBesoin,
        type_demande: typeDemande,
        priorite,
        objet,
        justification,
        lien_ptba: lienPtba,
        service_beneficiaire: serviceBeneficiaire,
        ligne_budgetaire: ligneBudgetaire,
        source_financement: sourceFinancement,
        lignes_besoin: lignes.map((ligne, index) => ({
          ordre: index + 1,
          designation: isServiceRequest ? "" : ligne.designation,
          marque_modele: isServiceRequest ? "" : ligne.marque_modele,
          caracteristiques_techniques: isServiceRequest ? "" : ligne.caracteristiques_techniques,
          quantite: Number(isServiceRequest ? 1 : ligne.quantite),
          unite: isServiceRequest ? "Service" : ligne.unite,
          prix_unitaire_estime: ligne.prix_unitaire_estime,
          lieu_livraison: isServiceRequest ? "" : ligne.lieu_livraison,
          destinataire_final: isServiceRequest ? "" : ligne.destinataire_final,
          type_service: isServiceRequest ? ligne.type_service : "",
          description_service: isServiceRequest ? ligne.description_service : "",
          date_debut: isServiceRequest ? ligne.date_debut : undefined,
          date_fin: isServiceRequest ? ligne.date_fin : undefined,
          duree_estimee: isServiceRequest ? ligne.duree_estimee : "",
          lieu_execution: isServiceRequest ? ligne.lieu_execution : "",
          livrables_attendus: isServiceRequest ? ligne.livrables_attendus : "",
          nombre_beneficiaires: isServiceRequest && ligne.nombre_beneficiaires ? Number(ligne.nombre_beneficiaires) : undefined,
        })),
        documents: [],
      });

      for (const document of documents) {
        if (!document.fichier) continue;
        const payload = new FormData();
        payload.append("type_document", document.type_document);
        payload.append("commentaire", document.commentaire || "");
        payload.append("fichier", document.fichier);
        await uploadDocumentDemandeAchat(created.id, payload);
      }

      const submitted = await submitDemandeAchat(created.id);
      router.push(`/demande-achat/${submitted.id}`);
    } catch (err) {
      setError(getFrenchSubmissionError(err));
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f1f5f9] text-slate-800 pb-16">
      <TopHeader />

      {error && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[150] animate-in slide-in-from-top-4 fade-in duration-300 w-full max-w-md px-4">
          <div className="bg-rose-600 text-white px-5 py-4 rounded-lg shadow-2xl text-sm font-semibold flex items-center justify-between border border-rose-500">
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="ml-3 shrink-0 opacity-70 hover:opacity-100 transition-opacity">
              <span className="sr-only">Fermer</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto mt-2 px-4">
        
        {/* HEADER CARD - MATCHING MOCKUP */}
        <section className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-3">
          <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#006e3b] uppercase">
                Unité de Coordination des Projets
              </h1>
              <p className="text-sm font-semibold text-slate-600 uppercase tracking-widest mt-1">
                Formulaire de demande d&apos;achat
              </p>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* SECTION: INFORMATIONS ADMINISTRATIVES */}
          <section className="bg-white rounded-lg shadow-sm border border-slate-200 border-t-4 border-t-[#008f4c]">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-[13px] font-bold text-[#008f4c] uppercase tracking-wider">Identifiants et Généralités</h2>
            </div>
            <div className="p-5 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              
              <div className="sm:col-span-1">
                <label className={labelClass}>Numéro demande</label>
                <input value="[Généré automatiquement]" disabled className={fieldClass} />
              </div>
              
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="field_objet">Objet de la demande <span className="text-rose-500">*</span></label>
                <input id="field_objet" value={objet} onChange={(e) => setObjet(e.target.value)} required className={fieldClass} placeholder="Description synthétique..." />
              </div>

              <div>
                <label className={labelClass}>Type de demande *</label>
                <select value={typeDemande} onChange={(e) => handleTypeDemandeChange(e.target.value)} className={fieldClass}>
                  {typeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div>
                <label className={labelClass}>Catégorie de besoin *</label>
                <select value={categorieBesoin} onChange={(e) => setCategorieBesoin(e.target.value)} className={fieldClass}>
                  {categorieOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div>
                <label className={labelClass}>Priorité *</label>
                <select value={priorite} onChange={(e) => setPriorite(e.target.value)} className={fieldClass}>
                  {prioriteOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div className="md:col-span-3">
                <label className={labelClass} htmlFor="field_justification">Justification du besoin <span className="text-rose-500">*</span></label>
                <textarea id="field_justification" value={justification} onChange={(e) => setJustification(e.target.value)} required className={areaClass} placeholder="Expliquez pourquoi cet achat est nécessaire..." />
              </div>
            </div>
          </section>

          {/* SECTION: IMPUTATION / BUDGET */}
          <section className="bg-white rounded-lg shadow-sm border border-slate-200 border-t-4 border-t-[#008f4c]">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-[13px] font-bold text-[#008f4c] uppercase tracking-wider">Imputation et Financement</h2>
            </div>
            <div className="p-5 grid gap-4 grid-cols-1 sm:grid-cols-2">
              
              <div>
                <label className={labelClass} htmlFor="field_service">Service bénéficiaire <span className="text-rose-500">*</span></label>
                <input id="field_service" value={serviceBeneficiaire} onChange={(e) => setServiceBeneficiaire(e.target.value)} required className={fieldClass} />
              </div>

              <div>
                <label className={labelClass} htmlFor="field_ptba">Référence PTBA <span className="text-rose-500">*</span></label>
                <input id="field_ptba" value={lienPtba} onChange={(e) => setLienPtba(e.target.value)} required className={fieldClass} placeholder="Ex: PTBA-2026-X" />
              </div>

              <div>
                <label className={labelClass} htmlFor="field_budget">Ligne Budgétaire <span className="text-rose-500">*</span></label>
                <input id="field_budget" value={ligneBudgetaire} onChange={(e) => setLigneBudgetaire(e.target.value)} required className={fieldClass} placeholder="Saisir la ligne..." />
              </div>

              <div>
                <label className={labelClass}>Source de Financement *</label>
                <select value={sourceFinancement} onChange={(e) => setSourceFinancement(e.target.value)} className={fieldClass}>
                  <option value="GAVI">Alliance Gavi</option>
                  <option value="FONDS_MONDIAL">Fonds mondial</option>
                  <option value="BANQUE_MONDIALE">Banque mondiale</option>
                </select>
              </div>

            </div>
          </section>

          {/* SECTION: LIGNES DE BESOIN */}
          <section className="bg-white rounded-lg shadow-sm border border-slate-200 border-t-4 border-t-[#008f4c]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-[13px] font-bold text-[#008f4c] uppercase tracking-wider">Lignes de la demande</h2>
              <button
                type="button"
                onClick={() => openCreateLigneModal()}
                className={addOutlineButtonClass}
              >
                <Plus className="h-3.5 w-3.5" /> Ajouter ligne
              </button>
            </div>

            <div className="p-5 space-y-6">
              {lignes.length === 0 ? (
                <div className="rounded border border-dashed border-slate-300 bg-slate-50 py-8 text-center text-[13px] text-slate-500">
                  Aucune ligne de besoin ajoutée pour le moment.
                </div>
              ) : (
                <div className="space-y-4">
                  {lignes.map((ligne, i) => (
                    <div
                      key={`${i}-${isServiceRequest ? ligne.description_service : ligne.designation}`}
                      className="rounded border border-slate-200 bg-white px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex-shrink-0 inline-flex items-center justify-center rounded bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                          #{i + 1}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-slate-800">
                            {isServiceRequest
                              ? ligne.description_service || "Service"
                              : ligne.designation || "Article"}
                          </h3>
                          <p className="truncate text-[11px] text-slate-500 mt-0.5">
                            {isServiceRequest
                              ? getOptionLabel(typeServiceOptions, ligne.type_service)
                              : ligne.marque_modele || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right hidden sm:block">
                            <span className="block text-sm font-bold text-slate-800">
                              {formatAmount(getLigneTotal(ligne, isServiceRequest))}
                            </span>
                            {!isServiceRequest && (
                              <span className="block text-xs text-slate-500">
                                Qté: {ligne.quantite}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => openEditLigneModal(i)}
                            className={smallSecondaryButtonClass}
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setLignes((prev) =>
                                prev.filter((_, index) => index !== i),
                              )
                            }
                            className={deleteButtonClass}
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end px-2 pt-2 border-t border-slate-200">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mr-4">Coût estimé total :</p>
                <p className="text-xl font-black text-slate-800">{totalEstimeLabel}</p>
              </div>

            </div>
          </section>

          {/* SECTION: PIÈCES JOINTES */}
          <section className="bg-white rounded-lg shadow-sm border border-slate-200 border-t-4 border-t-[#008f4c]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-[13px] font-bold text-[#008f4c] uppercase tracking-wider">Pièces Jointes</h2>
              <button type="button" onClick={() => setDocuments([...documents, emptyDocument()])} className={addOutlineButtonClass}>
                <Plus className="h-3.5 w-3.5" /> Ajouter un fichier
              </button>
            </div>
            <div className="p-5">
              {documents.length === 0 ? (
                <div className="rounded border border-dashed border-slate-300 py-6 text-center text-[13px] text-slate-500">
                  <UploadCloud className="mx-auto h-6 w-6 text-slate-300 mb-2" />
                  Aucun fichier joint à cette demande.
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc, i) => (
                    <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <select value={doc.type_document} onChange={(e) => { const n = [...documents]; n[i].type_document = e.target.value; setDocuments(n); }} className={`${fieldClass} sm:w-1/3`}>
                        {documentOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <input type="file" onChange={(e) => { const n = [...documents]; n[i].fichier = e.target.files?.[0] || null; setDocuments(n); }} className={`${fieldClass} sm:w-1/3 cursor-pointer file:cursor-pointer`} />
                      <input placeholder="Commentaire optionnel..." value={doc.commentaire} onChange={(e) => { const n = [...documents]; n[i].commentaire = e.target.value; setDocuments(n); }} className={`${fieldClass} sm:w-1/3`} />
                      <button type="button" onClick={() => setDocuments(documents.filter((_, idx) => idx !== i))} className={deleteButtonClass}>
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ACTIONS */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-start items-center gap-4 py-8">
            <button type="button" onClick={() => router.push("/demande-achat/dashboard")} className={secondaryButtonClass} disabled={saving}>
              Annuler
            </button>
            <button type="submit" disabled={saving} className={primaryButtonClass}>
              {saving ? "Sauvegarde en cours..." : (
                <>
                  <Save className="h-4 w-4" /> Enregistrer & Soumettre
                </>
              )}
            </button>
          </div>

        </form>
      </div>

      <LigneBesoinModal
        open={ligneModalOpen}
        mode={editingLigneIndex === null ? "create" : "edit"}
        isServiceRequest={isServiceRequest}
        ligne={ligneDraft}
        error={ligneModalError}
        onClose={closeLigneModal}
        onChange={updateLigneDraft}
        onSave={saveLigneDraft}
      />
    </main>
  );
}
