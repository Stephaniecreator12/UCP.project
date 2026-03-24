"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, CheckCircle2, FileText, User, Wallet } from "lucide-react";
import TopHeader from "@/app/components/TopHeader";
import { getToken } from "@/services/auth";
import {
  createDemandeAchat,
  decideDemandeAchat,
  getCurrentUserProfile,
  getPendingDemandesAchat,
  submitDemandeAchat,
  transmitDemandeAchat,
  updateDemandeAchat,
} from "@/services/demandeAchat";
import {
  CurrentUserProfile,
  DemandeAchat,
  NatureActivite,
  SourceFinancementOption,
  StatutDemande,
  TypeMarche,
} from "@/types/demandeAchat";

const SERVICES = [
  "Direction des Infrastructures",
  "Programme Paludisme",
  "Programme VIH/TB",
  "Administration & Finances",
  "Unité de Passation des Marchés",
  "Suivi-évaluation",
  "Logistique & Approvisionnement",
  "Coordination Générale",
];

const PERSONNEL_DIRECTORY = [
  {
    nom: "Andriamatoa Rakoto",
    fonction: "Chef de service infrastructures",
    service: "Direction des Infrastructures",
  },
  {
    nom: "Hanitra Raveloson",
    fonction: "Responsable programme paludisme",
    service: "Programme Paludisme",
  },
  {
    nom: "Miora Andrianina",
    fonction: "Chargée de programme VIH/TB",
    service: "Programme VIH/TB",
  },
  {
    nom: "Tiana Rasolo",
    fonction: "Responsable administratif et financier",
    service: "Administration & Finances",
  },
  {
    nom: "Sitraka Ranaivo",
    fonction: "Spécialiste passation des marchés",
    service: "Unité de Passation des Marchés",
  },
  {
    nom: "Fanja Razafindrakoto",
    fonction: "Chargée suivi-évaluation",
    service: "Suivi-évaluation",
  },
] as const;

const ACTIVITES_PTBA: Record<string, string[]> = {
  "Renforcement des capacités des districts": [
    "Atelier de formation sur la prise en charge du paludisme",
    "Supervision formative des centres de santé",
  ],
  "Approvisionnement en intrants": [
    "Acquisition de consommables médicaux",
    "Acquisition d'équipements biomédicaux",
  ],
  "Gouvernance et coordination": [
    "Réunion trimestrielle de revue programmatique",
    "Mission de suivi-évaluation conjointe",
  ],
};

const SOURCES_FINANCEMENT: SourceFinancementOption[] = [
  "Fonds Mondial",
  "Gavi",
  "Banque mondiale",
  "Budget Etat (Contrepartie)",
  "Autre",
];
const SOURCE_FINANCEMENT_HINT: Record<SourceFinancementOption, string> = {
  "Fonds Mondial": "Avec précision de la subvention",
  Gavi: "Financement vaccins et systèmes",
  "Banque mondiale": "Avec précision du projet",
  "Budget Etat (Contrepartie)": "Contrepartie nationale",
  Autre: "Source additionnelle à préciser",
};
const SOURCE_FINANCEMENT_DETAILS: Partial<
  Record<
    SourceFinancementOption,
    {
      label: string;
      field:
        | "source_financement_subvention_fm"
        | "source_financement_projet_bm"
        | "source_financement_autre";
      placeholder: string;
    }
  >
> = {
  "Fonds Mondial": {
    label: "Subvention Fonds Mondial",
    field: "source_financement_subvention_fm",
    placeholder: "Ex: Subvention VIH Round 10",
  },
  "Banque mondiale": {
    label: "Projet Banque mondiale",
    field: "source_financement_projet_bm",
    placeholder: "Préciser le projet",
  },
  Autre: {
    label: "Autre source",
    field: "source_financement_autre",
    placeholder: "Préciser la source",
  },
};
const SOURCE_FINANCEMENT_BADGE: Record<
  SourceFinancementOption,
  { icon: string; chipClass: string }
> = {
  "Fonds Mondial": { icon: "🌍", chipClass: "bg-emerald-100 text-emerald-700" },
  Gavi: { icon: "💉", chipClass: "bg-cyan-100 text-cyan-700" },
  "Banque mondiale": { icon: "🏦", chipClass: "bg-indigo-100 text-indigo-700" },
  "Budget Etat (Contrepartie)": { icon: "🏛️", chipClass: "bg-amber-100 text-amber-700" },
  Autre: { icon: "➕", chipClass: "bg-slate-100 text-slate-700" },
};

const REGIONS = [
  "Analamanga",
  "Atsinanana",
  "Boeny",
  "Haute Matsiatra",
  "Menabe",
  "SAVA",
];
const DEVISES = ["USD", "EUR", "FCFA", "MGA"];
const HEBERGEMENT_OPTIONS = ["Oui", "Non"];
const RESTAURATION_OPTIONS = [
  "Pause-café",
  "Pause-café et déjeuner",
  "Déjeuner",
  "Pension complète",
  "Aucune",
];
const UNITE_OPTIONS = ["Unités", "Kits", "Boîtes", "Lots", "Cartons", "Pièces"];
const URGENCY_OPTIONS = [
  { value: "non", label: "Non urgent" },
  { value: "oui", label: "Urgent" },
] as const;
const TYPE_MARCHE_OPTIONS: TypeMarche[] = ["Biens", "Services", "Travaux"];
const TYPE_MARCHE_DETAILS: Record<TypeMarche, string> = {
  Biens: "Fournitures, equipements, intrants medicaux, consommables",
  Services:
    "Prestations intellectuelles : formations, ateliers, etudes, supervisions",
  Travaux: "Construction, rehabilitation",
};
const NATURE_OPTIONS: NatureActivite[] = [
  "Formation / Atelier",
  "Réunion / Séminaire",
  "Mission de supervision / Suivi-évaluation",
  "Revue",
  "Construction / Réhabilitation",
  "Autre",
];
const APPROVAL_FLOW: StatutDemande[] = [
  "Brouillon",
  "Soumise",
  "Validée Service",
  "Validée Budget",
  "Validée Direction",
  "Transmise aux Marchés",
];
const SECTION_META = {
  identification: {
    step: "A",
    title: "Identification",
    tone: "Besoin émetteur et référence interne",
  },
  budget: {
    step: "B",
    title: "Cadre budgétaire",
    tone: "PTBA, financement et chiffrage",
  },
  besoin: {
    step: "C",
    title: "Expression du besoin",
    tone: "Objet, nature et pièces justificatives",
  },
  livraison: {
    step: "D",
    title: "Planification",
    tone: "Lieu, calendrier et urgence",
  },
  validation: {
    step: "E",
    title: "Validation",
    tone: "Circuit décisionnel et visas",
  },
} as const;

type GuidedScenario =
  | "pending"
  | "atelier"
  | "supervision"
  | "biens"
  | "standard";
type GuidedBrief = {
  theme: string;
  participants: string;
  duree: string;
  lieu: string;
  restauration: string;
  hebergement: string;
  zone: string;
  periode: string;
  agents: string;
  transport: string;
  objectif: string;
  designation: string;
  specs: string;
  quantite: string;
  unite: string;
  contraintes: string;
  contexte: string;
  beneficiaires: string;
  observations: string;
};

const nowDate = () => new Date().toISOString().slice(0, 10);
const getInitialNumeroDemande = () => {
  const year = new Date().getFullYear();
  if (typeof window === "undefined") return `UCP/DA/${year}/001`;
  const storageKey = `da-sequence-${year}`;
  const raw = window.localStorage.getItem(storageKey);
  const sequence = raw ? Number.parseInt(raw, 10) : 1;
  const safeSequence = Number.isFinite(sequence) && sequence > 0 ? sequence : 1;
  return `UCP/DA/${year}/${String(safeSequence).padStart(3, "0")}`;
};

const initialForm: DemandeAchat = {
  numero_demande: getInitialNumeroDemande(),
  date_demande: nowDate(),
  service_demandeur: "",
  nom_demandeur: "",
  fonction_demandeur: "",
  activite_ptba: "",
  sous_activite_ptba: "",
  indicateur_performance: "",
  source_financement: [],
  source_financement_subvention_fm: "",
  source_financement_projet_bm: "",
  source_financement_autre: "",
  ligne_budgetaire: "",
  budget_estime: "",
  devise: "USD",
  type_marche: "",
  nature_activite: "",
  nature_activite_autre: "",
  intitule_demande: "",
  description_detaillee: "",
  region_district: "",
  adresse_precise: "",
  date_debut_souhaitee: "",
  date_fin_souhaitee: "",
  urgent: false,
  justification_urgence: "",
  statut: "Brouillon",
  validateur1_nom: "",
  validateur1_date: "",
  validateur1_decision: "",
  validateur1_commentaire: "",
  validateur2_nom: "",
  validateur2_date: "",
  validateur2_fonds: "",
  validateur2_visa: "",
  validateur3_nom: "",
  validateur3_date: "",
  validateur3_visa: "",
  date_transmission_marches: "",
};
const initialGuidedBrief: GuidedBrief = {
  theme: "",
  participants: "",
  duree: "",
  lieu: "",
  restauration: "",
  hebergement: "",
  zone: "",
  periode: "",
  agents: "",
  transport: "",
  objectif: "",
  designation: "",
  specs: "",
  quantite: "",
  unite: "",
  contraintes: "",
  contexte: "",
  beneficiaires: "",
  observations: "",
};

const normalizeDemandeAchat = (data: DemandeAchat): DemandeAchat => ({
  ...data,
  budget_estime: String(data.budget_estime ?? ""),
  validateur1_date: data.validateur1_date || "",
  validateur2_date: data.validateur2_date || "",
  validateur3_date: data.validateur3_date || "",
  date_transmission_marches: data.date_transmission_marches || "",
});

export default function DemandeAchatPage() {
  const router = useRouter();
  const [form, setForm] = useState<DemandeAchat>(() => initialForm);
  const [currentProfile, setCurrentProfile] = useState<CurrentUserProfile | null>(null);
  const [guidedBrief, setGuidedBrief] = useState<GuidedBrief>(
    () => initialGuidedBrief,
  );
  const [showGuidedHelp, setShowGuidedHelp] = useState(false);
  const [descriptionHighlighted, setDescriptionHighlighted] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [piecesJointes, setPiecesJointes] = useState<File[]>([]);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const financeDetailRefs = useRef<
    Partial<
      Record<keyof typeof SOURCE_FINANCEMENT_DETAILS, HTMLDivElement | null>
    >
  >({});
  const financeDetailInputRefs = useRef<
    Partial<
      Record<keyof typeof SOURCE_FINANCEMENT_DETAILS, HTMLInputElement | null>
    >
  >({});
  const previousFinanceSelectionRef = useRef<SourceFinancementOption[]>(
    initialForm.source_financement,
  );
  const natureOtherRef = useRef<HTMLInputElement | null>(null);
  const previousNatureRef = useRef<NatureActivite | "">(
    initialForm.nature_activite,
  );
  const previousGeneratedDescriptionRef = useRef("");
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const guidedOptionsRef = useRef<HTMLDivElement | null>(null);
  const urgencyJustificationRef = useRef<HTMLInputElement | null>(null);
  const [urgencyPromptVisible, setUrgencyPromptVisible] = useState(false);
  const [urgencyHighlighted, setUrgencyHighlighted] = useState(false);
  const [openValidation, setOpenValidation] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!getToken()) return;

    const loadProfile = async () => {
      try {
        const profile = await getCurrentUserProfile();
        setCurrentProfile(profile);

        if (profile.role !== "demandeur") {
          const pending = await getPendingDemandesAchat();
          setPendingCount(pending.length);

          if (pending.length > 0) {
            setForm(normalizeDemandeAchat(pending[0]));
            setMessage(`1 demande chargée pour validation${pending.length > 1 ? ` (${pending.length} en attente)` : ""}.`);
            return;
          }

          setMessage("Aucune demande en attente pour votre rôle.");
        }

        setForm((prev) => ({
          ...prev,
          service_demandeur: prev.service_demandeur || profile.service || "",
          nom_demandeur:
            prev.nom_demandeur || profile.user.full_name || profile.user.username,
          fonction_demandeur: prev.fonction_demandeur || profile.fonction || "",
        }));
      } catch (error) {
        console.error(error);
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    const previous = previousFinanceSelectionRef.current;
    const added = form.source_financement.find(
      (source) =>
        !previous.includes(source) && source in SOURCE_FINANCEMENT_DETAILS,
    ) as keyof typeof SOURCE_FINANCEMENT_DETAILS | undefined;

    if (added) {
      financeDetailRefs.current[added]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
      window.requestAnimationFrame(() => {
        financeDetailInputRefs.current[added]?.focus();
      });
    }

    previousFinanceSelectionRef.current = form.source_financement;
  }, [form.source_financement]);

  useEffect(() => {
    if (
      form.nature_activite === "Autre" &&
      previousNatureRef.current !== "Autre"
    ) {
      natureOtherRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
      window.requestAnimationFrame(() => {
        natureOtherRef.current?.focus();
      });
    }

    previousNatureRef.current = form.nature_activite;
  }, [form.nature_activite]);

  useEffect(() => {
    if (!form.urgent) {
      setUrgencyPromptVisible(false);
      setUrgencyHighlighted(false);
      return;
    }

    setUrgencyPromptVisible(true);
    setUrgencyHighlighted(true);
    window.requestAnimationFrame(() => {
      urgencyJustificationRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      urgencyJustificationRef.current?.focus();
    });

    const promptTimeout = window.setTimeout(
      () => setUrgencyPromptVisible(false),
      2400,
    );
    const highlightTimeout = window.setTimeout(
      () => setUrgencyHighlighted(false),
      1800,
    );

    return () => {
      window.clearTimeout(promptTimeout);
      window.clearTimeout(highlightTimeout);
    };
  }, [form.urgent]);

  const sousActivites = form.activite_ptba
    ? (ACTIVITES_PTBA[form.activite_ptba] ?? [])
    : [];
  const activeScenario = useMemo<GuidedScenario>(() => {
    if (!form.type_marche && !form.nature_activite) return "pending";
    if (form.nature_activite === "Formation / Atelier") return "atelier";
    if (form.nature_activite === "Mission de supervision / Suivi-évaluation")
      return "supervision";
    if (form.type_marche === "Biens") return "biens";
    return "standard";
  }, [form.nature_activite, form.type_marche]);
  const generatedDescription = useMemo(() => {
    const lines: string[] = [];

    if (activeScenario === "atelier") {
      if (guidedBrief.theme.trim())
        lines.push(`Theme : ${guidedBrief.theme.trim()}`);
      if (guidedBrief.participants.trim())
        lines.push(
          `Nombre de participants : ${guidedBrief.participants.trim()}`,
        );
      if (guidedBrief.duree.trim())
        lines.push(`Duree : ${guidedBrief.duree.trim()}`);
      if (guidedBrief.lieu.trim())
        lines.push(`Lieu : ${guidedBrief.lieu.trim()}`);
      if (guidedBrief.restauration.trim())
        lines.push(`Restauration : ${guidedBrief.restauration.trim()}`);
      if (guidedBrief.hebergement.trim())
        lines.push(
          `Hebergement necessaire : ${guidedBrief.hebergement.trim()}`,
        );
      if (guidedBrief.contraintes.trim())
        lines.push(
          `Contraintes ou precisions utiles : ${guidedBrief.contraintes.trim()}`,
        );
      if (guidedBrief.observations.trim())
        lines.push(`Observations : ${guidedBrief.observations.trim()}`);
    } else if (activeScenario === "supervision") {
      if (guidedBrief.zone.trim())
        lines.push(`Zone geographique : ${guidedBrief.zone.trim()}`);
      if (guidedBrief.periode.trim())
        lines.push(`Periode : ${guidedBrief.periode.trim()}`);
      if (guidedBrief.agents.trim())
        lines.push(`Nombre d'agents concernes : ${guidedBrief.agents.trim()}`);
      if (guidedBrief.transport.trim())
        lines.push(
          `Moyens de transport necessaires : ${guidedBrief.transport.trim()}`,
        );
      if (guidedBrief.objectif.trim())
        lines.push(`Objectif de la mission : ${guidedBrief.objectif.trim()}`);
      if (guidedBrief.contraintes.trim())
        lines.push(
          `Contraintes ou precisions utiles : ${guidedBrief.contraintes.trim()}`,
        );
      if (guidedBrief.observations.trim())
        lines.push(`Observations : ${guidedBrief.observations.trim()}`);
    } else if (activeScenario === "biens") {
      if (guidedBrief.designation.trim())
        lines.push(`Designation du bien : ${guidedBrief.designation.trim()}`);
      if (guidedBrief.specs.trim())
        lines.push(
          `Caracteristiques techniques essentielles : ${guidedBrief.specs.trim()}`,
        );
      if (guidedBrief.quantite.trim()) {
        const quantityLine = guidedBrief.unite.trim()
          ? `${guidedBrief.quantite.trim()} ${guidedBrief.unite.trim()}`
          : guidedBrief.quantite.trim();
        lines.push(`Quantite : ${quantityLine}`);
      }
      if (guidedBrief.contraintes.trim())
        lines.push(
          `Contraintes de qualite ou compatibilite : ${guidedBrief.contraintes.trim()}`,
        );
      if (guidedBrief.observations.trim())
        lines.push(`Observations : ${guidedBrief.observations.trim()}`);
    } else {
      if (guidedBrief.contexte.trim())
        lines.push(`Contexte du besoin : ${guidedBrief.contexte.trim()}`);
      if (guidedBrief.beneficiaires.trim())
        lines.push(`Beneficiaires : ${guidedBrief.beneficiaires.trim()}`);
      if (guidedBrief.contraintes.trim())
        lines.push(
          `Contraintes importantes : ${guidedBrief.contraintes.trim()}`,
        );
      if (guidedBrief.observations.trim())
        lines.push(`Observations : ${guidedBrief.observations.trim()}`);
    }

    return lines.join("\n");
  }, [activeScenario, guidedBrief]);

  useEffect(() => {
    const previousGenerated = previousGeneratedDescriptionRef.current;
    const currentDescription = form.description_detaillee.trim();
    if (!generatedDescription.trim()) {
      if (currentDescription === previousGenerated.trim()) {
        setForm((prev) => ({ ...prev, description_detaillee: "" }));
      }
      previousGeneratedDescriptionRef.current = "";
      return;
    }

    if (
      !currentDescription ||
      currentDescription === previousGenerated.trim()
    ) {
      setForm((prev) => ({
        ...prev,
        description_detaillee: generatedDescription,
      }));
    }
    previousGeneratedDescriptionRef.current = generatedDescription;
  }, [generatedDescription, form.description_detaillee]);

  const errors = useMemo(() => {
    const list: string[] = [];
    if (!form.service_demandeur) list.push("Service demandeur obligatoire.");
    if (!form.nom_demandeur.trim()) list.push("Nom du demandeur obligatoire.");
    if (!form.fonction_demandeur.trim())
      list.push("Fonction du demandeur obligatoire.");
    if (!form.activite_ptba.trim()) list.push("Activité PTBA obligatoire.");
    if (!form.sous_activite_ptba.trim())
      list.push("Sous-activité PTBA obligatoire.");
    if (form.source_financement.length === 0)
      list.push("Source de financement obligatoire.");
    if (
      form.source_financement.includes("Fonds Mondial") &&
      !form.source_financement_subvention_fm.trim()
    ) {
      list.push("Précision de la subvention Fonds Mondial obligatoire.");
    }
    if (
      form.source_financement.includes("Banque mondiale") &&
      !form.source_financement_projet_bm.trim()
    ) {
      list.push("Précision du projet Banque mondiale obligatoire.");
    }
    if (
      form.source_financement.includes("Autre") &&
      !form.source_financement_autre.trim()
    ) {
      list.push("Précision 'Autre source de financement' obligatoire.");
    }
    if (!form.ligne_budgetaire.trim())
      list.push("Ligne budgétaire obligatoire.");
    if (!form.budget_estime || Number(form.budget_estime) <= 0) {
      list.push("Budget estimé doit être supérieur à 0.");
    }
    if (!form.intitule_demande.trim()) list.push("Intitulé obligatoire.");
    if (!form.description_detaillee.trim())
      list.push("Description obligatoire.");
    if (
      form.nature_activite === "Autre" &&
      !form.nature_activite_autre.trim()
    ) {
      list.push("Précision 'Autre nature d'activité' obligatoire.");
    }
    if (!form.region_district.trim())
      list.push("Région / district obligatoire.");
    if (!form.adresse_precise.trim()) list.push("Adresse précise obligatoire.");
    if (!form.date_debut_souhaitee || !form.date_fin_souhaitee) {
      list.push("Dates début et fin obligatoires.");
    } else if (form.date_fin_souhaitee < form.date_debut_souhaitee) {
      list.push("Date de fin doit être après la date de début.");
    }
    if (form.urgent && !form.justification_urgence.trim()) {
      list.push("Justification d'urgence obligatoire.");
    }
    return list;
  }, [form]);

  const onChange = <K extends keyof DemandeAchat>(
    key: K,
    value: DemandeAchat[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };
  const handleDemandeurChange = (value: string) => {
    const profile = PERSONNEL_DIRECTORY.find((person) => person.nom === value);
    setForm((prev) => ({
      ...prev,
      nom_demandeur: value,
      fonction_demandeur: profile?.fonction ?? prev.fonction_demandeur,
      service_demandeur: profile?.service ?? prev.service_demandeur,
    }));
  };
  const toggleFinanceSource = (source: SourceFinancementOption) => {
    setForm((prev) => {
      const already = prev.source_financement.includes(source);
      const next = already
        ? prev.source_financement.filter((s) => s !== source)
        : [...prev.source_financement, source];

      return {
        ...prev,
        source_financement: next,
        source_financement_subvention_fm: next.includes("Fonds Mondial")
          ? prev.source_financement_subvention_fm
          : "",
        source_financement_projet_bm: next.includes("Banque mondiale")
          ? prev.source_financement_projet_bm
          : "",
        source_financement_autre: next.includes("Autre")
          ? prev.source_financement_autre
          : "",
      };
    });
  };
  const updateGuidedBrief = <K extends keyof GuidedBrief>(
    key: K,
    value: GuidedBrief[K],
  ) => {
    setGuidedBrief((prev) => ({ ...prev, [key]: value }));
  };
  const updateGuidedNumber = (
    key: "participants" | "agents" | "quantite",
    value: string,
  ) => {
    const digitsOnly = value.replace(/\D+/g, "");
    updateGuidedBrief(key, digitsOnly);
  };
  const applyGuidedDescription = () => {
    if (!generatedDescription) return;
    onChange("description_detaillee", generatedDescription);
    setShowGuidedHelp(false);
    setDescriptionHighlighted(true);
    window.requestAnimationFrame(() => {
      descriptionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      descriptionRef.current?.focus();
    });
  };

  useEffect(() => {
    if (!descriptionHighlighted) return;
    const timeout = window.setTimeout(() => {
      setDescriptionHighlighted(false);
    }, 1600);
    return () => window.clearTimeout(timeout);
  }, [descriptionHighlighted]);

  const activateScenario = (
    scenario: Exclude<GuidedScenario, "pending" | "standard">,
  ) => {
    setForm((prev) => {
      if (scenario === "atelier") {
        return {
          ...prev,
          type_marche: "Services",
          nature_activite: "Formation / Atelier",
          nature_activite_autre: "",
        };
      }
      if (scenario === "supervision") {
        return {
          ...prev,
          type_marche: "Services",
          nature_activite: "Mission de supervision / Suivi-évaluation",
          nature_activite_autre: "",
        };
      }
      return {
        ...prev,
        type_marche: "Biens",
        nature_activite:
          prev.nature_activite === "Formation / Atelier" ||
          prev.nature_activite === "Mission de supervision / Suivi-évaluation"
            ? ""
            : prev.nature_activite,
      };
    });
  };

  const handleFilesChange = (files: FileList | null) => {
    if (!files) return;
    setPiecesJointes(Array.from(files));
  };

  const persistDraft = async (): Promise<DemandeAchat> => {
    const payload = {
      ...form,
      statut: form.statut || "Brouillon",
    };

    const saved = form.id
      ? await updateDemandeAchat(form.id, payload)
      : await createDemandeAchat(payload);

    const normalized = normalizeDemandeAchat(saved);
    setForm(normalized);
    return normalized;
  };

  const handleSaveDraft = async () => {
    setIsSubmittingAction(true);
    try {
      await persistDraft();
      setMessage("Brouillon enregistré.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erreur d'enregistrement.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    if (errors.length > 0) {
      setMessage("Corrige les erreurs avant soumission.");
      return;
    }

    setIsSubmittingAction(true);
    try {
      const saved = await persistDraft();
      if (!saved.id) {
        throw new Error("La demande n'a pas pu être enregistrée avant soumission.");
      }
      const submitted = await submitDemandeAchat(saved.id);
      setForm(normalizeDemandeAchat(submitted));
      setMessage("Demande soumise. Workflow initié.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erreur de soumission.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const approvalStatusIndex = APPROVAL_FLOW.indexOf(form.statut);
  const nextApprovalStatus =
    approvalStatusIndex >= 0 && approvalStatusIndex < APPROVAL_FLOW.length - 1
      ? APPROVAL_FLOW[approvalStatusIndex + 1]
      : null;
  const currentRole = currentProfile?.role || "demandeur";
  const canSubmit = currentRole === "demandeur" && form.statut === "Brouillon";
  const canValidateService =
    currentRole === "responsable_service" && form.statut === "Soumise";
  const canValidateBudget =
    currentRole === "controle_budget" && form.statut === "Validée Service";
  const canValidateDirection =
    currentRole === "directeur" && form.statut === "Validée Budget";
  const canTransmit =
    (currentRole === "directeur" || currentRole === "marches") &&
    form.statut === "Validée Direction";
  const workflowSteps = [
    { key: "Brouillon", label: "Brouillon" },
    { key: "Soumise", label: "Soumise" },
    { key: "Validée Service", label: "Service" },
    { key: "Validée Budget", label: "Budget" },
    { key: "Validée Direction", label: "Direction" },
    { key: "Transmise aux Marchés", label: "Marchés" },
  ];
  const isRejected = form.statut === "Rejetée";
  const currentWorkflowIndex = isRejected
    ? workflowSteps.findIndex((s) => s.key === "Soumise")
    : workflowSteps.findIndex((s) => s.key === form.statut);
  useEffect(() => {
    if (canValidateService) setOpenValidation("service");
    else if (canValidateBudget) setOpenValidation("budget");
    else if (canValidateDirection) setOpenValidation("direction");
    else setOpenValidation(null);
  }, [canValidateService, canValidateBudget, canValidateDirection, form.statut]);
  const validationHistory = [
    {
      validator: form.validateur1_nom,
      role: "Responsable service",
      decision: form.validateur1_decision,
      date: form.validateur1_date,
    },
    {
      validator: form.validateur2_nom,
      role: "Contrôle budget",
      decision: form.validateur2_fonds || form.validateur2_visa ? "Approuvé" : "",
      date: form.validateur2_date,
    },
    {
      validator: form.validateur3_nom,
      role: "Direction",
      decision: form.validateur3_visa ? "Approuvé" : "",
      date: form.validateur3_date,
    },
  ];
  const handleWorkflowDecision = async (decision: "Approuvé" | "Rejeté") => {
    if (!form.id) {
      setMessage("Enregistre d'abord la demande.");
      return;
    }

    setIsSubmittingAction(true);
    try {
      const updated = await decideDemandeAchat(form.id, {
        decision,
        commentaire: form.validateur1_commentaire,
        fonds_statut:
          currentRole === "controle_budget" ? form.validateur2_fonds : undefined,
        visa:
          currentRole === "controle_budget"
            ? form.validateur2_visa
            : currentRole === "directeur"
              ? form.validateur3_visa
              : undefined,
      });
      setForm(normalizeDemandeAchat(updated));
      setMessage(
        decision === "Approuvé"
          ? "Décision enregistrée."
          : "Demande rejetée.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erreur de validation.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleTransmission = async () => {
    if (!form.id) {
      setMessage("Enregistre d'abord la demande.");
      return;
    }
    setIsSubmittingAction(true);
    try {
      const updated = await transmitDemandeAchat(form.id);
      setForm(normalizeDemandeAchat(updated));
      setMessage("Demande transmise à l'Unité de Passation des Marchés.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erreur de transmission.");
    } finally {
      setIsSubmittingAction(false);
    }
  };
  const completionChecks = [
    form.service_demandeur,
    form.nom_demandeur,
    form.activite_ptba,
    form.sous_activite_ptba,
    form.source_financement.length > 0 ? "ok" : "",
    form.ligne_budgetaire,
    form.budget_estime,
    form.intitule_demande,
    form.description_detaillee,
    form.region_district,
    form.adresse_precise,
    form.date_debut_souhaitee,
    form.date_fin_souhaitee,
  ];
  const completionRate = Math.round(
    (completionChecks.filter((value) => String(value).trim().length > 0)
      .length /
      completionChecks.length) *
      100,
  );

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-all duration-200 placeholder:text-slate-400 hover:border-emerald-300 hover:shadow-[0_6px_18px_rgba(16,185,129,0.08)] focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/12 disabled:cursor-not-allowed disabled:bg-slate-100";
  const labelClass = "text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-700";
  const sectionClass =
    "relative overflow-hidden rounded-2xl border border-emerald-200 bg-white/98 p-4 shadow-[0_18px_32px_-22px_rgba(15,23,42,0.32)] transition duration-200 hover:-translate-y-[1px] hover:shadow-[0_22px_42px_-24px_rgba(15,23,42,0.42)] md:p-5";
  const sectionTitleClass =
    "font-[var(--font-display)] text-[18px] font-semibold tracking-[-0.02em] text-slate-900 flex items-center gap-2";
  const sectionHintClass =
    "mt-0.5 max-w-3xl text-[12px] leading-5 text-slate-600";
  const sectionHeaderClass =
    "mb-3.5 flex flex-col gap-1 border-b border-emerald-100 pb-2.5";
  const choicePanelClass =
    "rounded-[18px] border border-border/80 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--background)_82%,white),color-mix(in_srgb,var(--muted)_22%,var(--background)))] p-3";
  const statStripClass =
    "grid gap-px overflow-hidden rounded-[16px] border border-border/60 bg-border/50 md:grid-cols-4";

  return (
    <div className="app-shell h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_30%),linear-gradient(180deg,#f7f9fb,#eef2f7)]">
      <TopHeader />
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 md:p-5">
        <div className="mx-auto w-full max-w-5xl space-y-4.5 pb-8">
          <section className="relative overflow-hidden rounded-[24px] border border-emerald-900/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(245,252,249,0.98)_52%,rgba(236,250,244,0.96))] px-5 py-4 shadow-[0_16px_42px_rgba(15,23,42,0.07)] md:px-6 md:py-5">
            <div
              className="absolute -top-14 right-0 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="absolute left-0 top-0 h-1 w-full bg-[linear-gradient(90deg,#0f766e,#34d399_55%,transparent)]"
              aria-hidden="true"
            />
            <div className="relative space-y-3.5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-700/20 bg-emerald-50 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-emerald-800 shadow-sm">
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">★</span>
                  Achat institutionnel
                </div>
                <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      Document de demande interne
                    </p>
                    <h1 className="mt-2 font-[var(--font-display)] text-2xl tracking-[-0.04em] text-foreground md:text-3xl">
                      Formulaire de demande d&apos;achat
                    </h1>
                    <div className="mt-3 h-1 w-28 rounded-full bg-[linear-gradient(90deg,#0f766e,#34d399)] shadow-[0_6px_18px_rgba(16,185,129,0.28)]" />
                  </div>
                  <div className="rounded-xl border border-border/70 bg-white/68 px-3 py-2 shadow-[0_6px_18px_rgba(15,23,42,0.04)] backdrop-blur">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      Dossier prêt à présenter
                    </p>
                    <div className="mt-2 flex items-end gap-2">
                      <span className="font-[var(--font-display)] text-2xl tracking-[-0.05em] text-foreground">
                        {completionRate}%
                      </span>
                      <span className="pb-1 text-sm text-muted-foreground">
                        complété
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={statStripClass}>
                {[
                  ["Référence", form.numero_demande, "Numérotation interne"],
                  ["Statut", form.statut, "Position dans le workflow"],
                  [
                    "Pièces jointes",
                    `${piecesJointes.length} document(s)`,
                    "TDR, notes et annexes",
                  ],
                  [
                    currentRole === "demandeur" ? "Circuit" : "File d'attente",
                    currentRole === "demandeur"
                      ? nextApprovalStatus
                        ? `Prochaine étape: ${nextApprovalStatus}`
                        : "Workflow complété"
                      : `${pendingCount} demande(s) à traiter`,
                    currentRole === "demandeur"
                      ? "Validation hiérarchique"
                      : "Demandes en attente pour votre rôle",
                  ],
                ].map(([label, value, note]) => (
                  <div key={label} className="bg-white/68 p-3 backdrop-blur">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      {label}
                    </p>
                    <p className="mt-1.5 text-sm font-semibold text-foreground">
                      {value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{note}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <section className={sectionClass}>
              <div className={sectionHeaderClass}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-emerald-700" />
                      <h2 className={sectionTitleClass}>Section A — Identification</h2>
                    </div>
                    <p className={sectionHintClass}>
                      Référence, date, service émetteur et identité du porteur du besoin.
                    </p>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {SECTION_META.identification.tone}
                  </p>
                </div>
              </div>
              <div className="grid gap-2.5 md:grid-cols-2">
                <label className={labelClass}>
                  Numéro de la demande
                  <input
                    className={inputClass}
                    value={form.numero_demande}
                    readOnly
                  />
                </label>
                <label className={labelClass}>
                  Date de la demande
                  <input
                    className={inputClass}
                    type="date"
                    value={form.date_demande}
                    onChange={(e) => onChange("date_demande", e.target.value)}
                  />
                </label>
                <label className={labelClass}>
                  Service/Direction demandeur
                  <select
                    className={inputClass}
                    value={form.service_demandeur}
                    onChange={(e) =>
                      onChange("service_demandeur", e.target.value)
                    }
                  >
                    <option value="" disabled hidden>
                      Sélectionner
                    </option>
                    {SERVICES.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={labelClass}>
                  Demandeur (Nom &amp; Prénom)
                  <input
                    className={inputClass}
                    list="demandeur-options"
                    value={form.nom_demandeur}
                    onChange={(e) => handleDemandeurChange(e.target.value)}
                    placeholder="Sélectionner ou saisir un nom"
                  />
                  <datalist id="demandeur-options">
                    {PERSONNEL_DIRECTORY.map((person) => (
                      <option key={person.nom} value={person.nom}>
                        {person.fonction}
                      </option>
                    ))}
                  </datalist>
                </label>
                <label className={labelClass}>
                  Fonction du demandeur
                  <input
                    className={inputClass}
                    value={form.fonction_demandeur}
                    onChange={(e) =>
                      onChange("fonction_demandeur", e.target.value)
                    }
                  />
                </label>
              </div>
            </section>

            <section className={sectionClass}>
              <div className={sectionHeaderClass}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-emerald-700" />
                      <h2 className={sectionTitleClass}>Section B — Cadre programmatique et financier</h2>
                    </div>
                    <p className={sectionHintClass}>
                      Aligne la demande sur l&apos;activité PTBA, le bailleur et le budget prévisionnel.
                    </p>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {SECTION_META.budget.tone}
                  </p>
                </div>
              </div>
              <div className="grid gap-2.5 md:grid-cols-2">
                <label className={labelClass}>
                  Activité PTBA
                  <select
                    className={inputClass}
                    value={form.activite_ptba}
                    onChange={(e) => {
                      onChange("activite_ptba", e.target.value);
                      onChange("sous_activite_ptba", "");
                    }}
                  >
                    <option value="" disabled hidden>
                      Sélectionner
                    </option>
                    {Object.keys(ACTIVITES_PTBA).map((activity) => (
                      <option key={activity} value={activity}>
                        {activity}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={labelClass}>
                  Sous-activité PTBA
                  <select
                    className={inputClass}
                    value={form.sous_activite_ptba}
                    onChange={(e) =>
                      onChange("sous_activite_ptba", e.target.value)
                    }
                    disabled={!form.activite_ptba}
                  >
                    <option value="" disabled hidden>
                      Sélectionner
                    </option>
                    {sousActivites.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={`${labelClass} md:col-span-2`}>
                  Lien avec le cadre de performance (indicateur)
                  <input
                    className={inputClass}
                    value={form.indicateur_performance}
                    onChange={(e) =>
                      onChange("indicateur_performance", e.target.value)
                    }
                    placeholder="Ex: Indicateur 2.1a : Nombre d'agents formés"
                  />
                </label>
                <fieldset className={`md:col-span-2 ${choicePanelClass}`}>
                  <legend className="px-2 text-sm font-medium text-muted-foreground">
                    Source de Financement (Bailleur)
                  </legend>
                  <div className="grid gap-2 lg:grid-cols-[1fr_1.05fr]">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {SOURCES_FINANCEMENT.map((source) => {
                        const { icon, chipClass } = SOURCE_FINANCEMENT_BADGE[source];
                        const active = form.source_financement.includes(source);
                        return (
                          <button
                            key={source}
                            type="button"
                            onClick={() => toggleFinanceSource(source)}
                            className={`group flex items-center justify-between rounded-2xl border px-3 py-2.5 text-left shadow-[0_4px_12px_rgba(15,23,42,0.06)] transition ${
                              active
                                ? "border-emerald-400 bg-emerald-50/80 text-emerald-900"
                                : "border-slate-200 bg-white/90 text-slate-800 hover:border-emerald-200 hover:shadow-[0_8px_18px_rgba(16,185,129,0.10)]"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex h-9 w-9 items-center justify-center rounded-xl text-base ${chipClass}`}
                              >
                                {icon}
                              </span>
                              <div className="space-y-0.5">
                                <p className="text-[13px] font-semibold leading-5">
                                  {source}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {SOURCE_FINANCEMENT_HINT[source]}
                                </p>
                              </div>
                            </div>
                            <div
                              className={`h-4 w-4 rounded-full border ${
                                active
                                  ? "border-emerald-500 bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.16)]"
                                  : "border-slate-300 bg-white"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <div className="grid gap-2">
                      {SOURCES_FINANCEMENT.map((source) => {
                        const details = SOURCE_FINANCEMENT_DETAILS[source];
                        const isSelected = form.source_financement.includes(source);
                        if (!details || !isSelected) return null;
                        return (
                          <label
                            key={source}
                            ref={(node) => {
                              financeDetailRefs.current[source] = node;
                            }}
                            className="rounded-2xl border border-emerald-200 bg-white/90 px-3 py-2.5 shadow-[0_8px_18px_rgba(15,23,42,0.06)]"
                          >
                            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              {details.label}
                            </span>
                            <input
                              ref={(node) => {
                                financeDetailInputRefs.current[source] = node;
                              }}
                              className={`${inputClass} mt-0 py-3 text-[15px]`}
                              value={form[details.field]}
                              onChange={(e) => onChange(details.field, e.target.value)}
                              placeholder={details.placeholder}
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </fieldset>
                <label className={labelClass}>
                  Ligne Budgétaire / Code Projet
                  <input
                    className={inputClass}
                    value={form.ligne_budgetaire}
                    onChange={(e) =>
                      onChange("ligne_budgetaire", e.target.value)
                    }
                    placeholder="Ex: FM-PAL-2024-02"
                  />
                </label>
                <label className={labelClass}>
                  Budget estimé
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    value={form.budget_estime}
                    onChange={(e) => onChange("budget_estime", e.target.value)}
                  />
                </label>
                <label className={labelClass}>
                  Devise
                  <select
                    className={inputClass}
                    value={form.devise}
                    onChange={(e) => onChange("devise", e.target.value)}
                  >
                    {DEVISES.map((devise) => (
                      <option key={devise} value={devise}>
                        {devise}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className={sectionClass}>
              <div className={sectionHeaderClass}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-emerald-700" />
                      <h2 className={sectionTitleClass}>Section C — Nature et description du besoin</h2>
                    </div>
                    <p className={sectionHintClass}>
                      Nature du marché, formulation du besoin et pièces justificatives jointes.
                    </p>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {SECTION_META.besoin.tone}
                  </p>
                </div>
              </div>
              <div className="grid gap-2.5 md:grid-cols-2">
                <label className={labelClass}>
                  Type de Marché
                  <select
                    className={inputClass}
                    value={form.type_marche}
                    onChange={(e) =>
                      onChange("type_marche", e.target.value as TypeMarche | "")
                    }
                  >
                    <option value="">Sélectionner</option>
                    {TYPE_MARCHE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {form.type_marche && (
                    <div className="mt-2 rounded-lg border border-border/70 bg-white/80 px-3 py-2 text-xs text-muted-foreground">
                      {TYPE_MARCHE_DETAILS[form.type_marche]}
                    </div>
                  )}
                </label>

                <label className={labelClass}>
                  Nature de l&apos;activité
                  <select
                    className={inputClass}
                    value={form.nature_activite}
                    onChange={(e) =>
                      onChange(
                        "nature_activite",
                        e.target.value as NatureActivite | "",
                      )
                    }
                  >
                    <option value="">Sélectionner</option>
                    {NATURE_OPTIONS.map((nature) => (
                      <option key={nature} value={nature}>
                        {nature}
                      </option>
                    ))}
                  </select>
                </label>

                {form.nature_activite === "Autre" && (
                  <label className={`${labelClass} md:col-span-2`}>
                    Précision &quot;Autre nature&quot;
                    <input
                      ref={natureOtherRef}
                      className={inputClass}
                      value={form.nature_activite_autre}
                      onChange={(e) =>
                        onChange("nature_activite_autre", e.target.value)
                      }
                      placeholder="Preciser la finalite ou le type exact de l'activite"
                    />
                  </label>
                )}

                <label className={`${labelClass} md:col-span-2`}>
                  Intitulé / Objet de la Demande
                  <input
                    className={inputClass}
                    value={form.intitule_demande}
                    onChange={(e) =>
                      onChange("intitule_demande", e.target.value)
                    }
                  />
                </label>

                <div className="md:col-span-2">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <label className={`${labelClass} flex-1`}>
                      Description détaillée du besoin
                      <textarea
                        ref={descriptionRef}
                        className={`${inputClass} ${
                          descriptionHighlighted
                            ? "border-emerald-500 bg-emerald-50/70 shadow-[0_0_0_4px_rgba(16,185,129,0.12),0_16px_30px_rgba(16,185,129,0.12)]"
                            : ""
                        }`}
                        rows={5}
                        value={form.description_detaillee}
                        onChange={(e) =>
                          onChange("description_detaillee", e.target.value)
                        }
                        placeholder="Décrivez le besoin librement ou activez l'aide guidée."
                      />
                    </label>
                    <div className="flex items-center gap-2 self-start md:mt-7">
                      <button
                        type="button"
                        onClick={() => setShowGuidedHelp(true)}
                        className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition ${
                          showGuidedHelp
                            ? "border-emerald-500/30 bg-[linear-gradient(180deg,rgba(236,253,245,0.96),rgba(220,252,231,0.92))] text-emerald-950 shadow-[0_10px_24px_rgba(16,185,129,0.15)]"
                            : "border-border/80 bg-white text-foreground shadow-[0_8px_18px_rgba(15,23,42,0.06)] hover:-translate-y-[1px] hover:border-slate-300 hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)]"
                        }`}
                      >
                        {showGuidedHelp ? "Guide ouvert" : "Aide guidée"}
                      </button>
                    </div>
                  </div>

                  {showGuidedHelp && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm">
                      <div
                        className="absolute inset-0"
                        onClick={() => setShowGuidedHelp(false)}
                        aria-hidden="true"
                      />
                      <div className="relative z-10 max-h-[88vh] w-full max-w-5xl overflow-y-auto rounded-[28px] border border-white/65 bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(244,252,249,0.98)_52%,rgba(240,249,255,0.96))] p-4 shadow-[0_28px_80px_rgba(15,23,42,0.28)] md:p-5">
                        <div className="flex items-start justify-between gap-4 border-b border-emerald-900/10 pb-4">
                          <div>
                            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-emerald-800">
                              Assistant guidé
                            </p>
                            <h3 className="mt-2 font-[var(--font-display)] text-2xl tracking-[-0.03em] text-foreground">
                              Choisissez un parcours
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                              Sélectionnez l&apos;un des 3 types pour afficher
                              les bons champs.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowGuidedHelp(false)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-white text-lg text-foreground shadow-[0_8px_18px_rgba(15,23,42,0.06)] transition hover:-translate-y-[1px] hover:border-slate-300"
                            aria-label="Fermer le guide"
                          >
                            ×
                          </button>
                        </div>

                        <div
                          ref={guidedOptionsRef}
                          className="mt-4 grid gap-2.5 md:grid-cols-3"
                        >
                          {[
                            {
                              key: "atelier" as const,
                              label: "Atelier",
                              note: "Thème, participants, durée, lieu, restauration, hébergement",
                            },
                            {
                              key: "supervision" as const,
                              label: "Supervision",
                              note: "Zone, période, agents, transport, objectif",
                            },
                            {
                              key: "biens" as const,
                              label: "Biens",
                              note: "Désignation, spécifications, quantité, unité",
                            },
                          ].map((item) => (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => activateScenario(item.key)}
                              className={`group rounded-[20px] border p-3 text-left transition duration-200 ${
                                activeScenario === item.key
                                  ? "border-emerald-500 bg-[linear-gradient(160deg,rgba(5,150,105,0.98),rgba(4,120,87,0.96))] text-white shadow-[0_18px_38px_rgba(16,185,129,0.28)]"
                                  : "border-slate-200 bg-white/92 text-foreground shadow-[0_10px_24px_rgba(15,23,42,0.05)] hover:-translate-y-[3px] hover:border-emerald-400 hover:bg-[linear-gradient(160deg,rgba(255,255,255,1),rgba(236,253,245,0.95))] hover:shadow-[0_22px_40px_rgba(16,185,129,0.16)]"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span
                                    className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold ${
                                    activeScenario === item.key
                                      ? "bg-white/18 text-white"
                                      : "bg-emerald-50 text-emerald-800 transition group-hover:bg-emerald-100"
                                  }`}
                                >
                                  {item.label.slice(0, 1)}
                                </span>
                                <span
                                  className={`h-3 w-3 rounded-full ${
                                    activeScenario === item.key
                                      ? "bg-white shadow-[0_0_0_6px_rgba(255,255,255,0.16)]"
                                      : "bg-emerald-300 transition group-hover:bg-emerald-500 group-hover:shadow-[0_0_0_8px_rgba(16,185,129,0.12)]"
                                  }`}
                                />
                              </div>
                              <p className="mt-3 text-base font-semibold tracking-[-0.02em]">
                                {item.label}
                              </p>
                              <p
                                className={`mt-2 text-sm leading-6 ${
                                  activeScenario === item.key
                                    ? "text-white/84"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {item.note}
                              </p>
                            </button>
                          ))}
                        </div>

                        {activeScenario !== "pending" && (
                          <>
                            <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                              <div className="grid gap-2.5 md:grid-cols-2">
                                {activeScenario === "atelier" && (
                                  <>
                                    <label className={labelClass}>
                                      Thème
                                      <input
                                        className={inputClass}
                                        value={guidedBrief.theme}
                                        onChange={(e) =>
                                          updateGuidedBrief(
                                            "theme",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="Ex: Formation sur la prise en charge du paludisme"
                                      />
                                    </label>
                                    <label className={labelClass}>
                                      Nombre de participants
                                      <input
                                        className={inputClass}
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={guidedBrief.participants}
                                        onChange={(e) =>
                                          updateGuidedNumber(
                                            "participants",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="Ex: 35"
                                      />
                                    </label>
                                    <label className={labelClass}>
                                      Durée
                                      <input
                                        className={inputClass}
                                        value={guidedBrief.duree}
                                        onChange={(e) =>
                                          updateGuidedBrief(
                                            "duree",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="Ex: 3 jours"
                                      />
                                    </label>
                                    <label className={labelClass}>
                                      Lieu
                                      <input
                                        className={inputClass}
                                        value={guidedBrief.lieu}
                                        onChange={(e) =>
                                          updateGuidedBrief(
                                            "lieu",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="Ex: Antananarivo"
                                      />
                                    </label>
                                    <label className={labelClass}>
                                      Type de restauration
                                      <input
                                        className={inputClass}
                                        value={guidedBrief.restauration}
                                        onChange={(e) =>
                                          updateGuidedBrief(
                                            "restauration",
                                            e.target.value,
                                          )
                                        }
                                        list="restauration-options"
                                        placeholder="Type de restauration"
                                      />
                                      <datalist id="restauration-options">
                                        {RESTAURATION_OPTIONS.map((option) => (
                                          <option key={option} value={option} />
                                        ))}
                                      </datalist>
                                    </label>
                                    <label className={labelClass}>
                                      Hébergement nécessaire
                                      <select
                                        className={inputClass}
                                        value={guidedBrief.hebergement}
                                        onChange={(e) =>
                                          updateGuidedBrief(
                                            "hebergement",
                                            e.target.value,
                                          )
                                        }
                                      >
                                        <option value="" disabled hidden>
                                          Sélectionner
                                        </option>
                                        {HEBERGEMENT_OPTIONS.map((option) => (
                                          <option key={option} value={option}>
                                            {option}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                  </>
                                )}

                                {activeScenario === "supervision" && (
                                  <>
                                    <label className={labelClass}>
                                      Zone géographique
                                      <input
                                        className={inputClass}
                                        value={guidedBrief.zone}
                                        onChange={(e) =>
                                          updateGuidedBrief(
                                            "zone",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="Ex: Districts d'Analamanga et Atsinanana"
                                      />
                                    </label>
                                    <label className={labelClass}>
                                      Période
                                      <input
                                        className={inputClass}
                                        value={guidedBrief.periode}
                                        onChange={(e) =>
                                          updateGuidedBrief(
                                            "periode",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="Ex: du 12 au 18 avril 2026"
                                      />
                                    </label>
                                    <label className={labelClass}>
                                      Nombre d&apos;agents
                                      <input
                                        className={inputClass}
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={guidedBrief.agents}
                                        onChange={(e) =>
                                          updateGuidedNumber(
                                            "agents",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="Ex: 8"
                                      />
                                    </label>
                                    <label className={labelClass}>
                                      Moyens de transport
                                      <input
                                        className={inputClass}
                                        value={guidedBrief.transport}
                                        onChange={(e) =>
                                          updateGuidedBrief(
                                            "transport",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="Ex: 2 véhicules 4x4 et carburant"
                                      />
                                    </label>
                                    <label
                                      className={`${labelClass} md:col-span-2`}
                                    >
                                      Objectif de la mission
                                      <input
                                        className={inputClass}
                                        value={guidedBrief.objectif}
                                        onChange={(e) =>
                                          updateGuidedBrief(
                                            "objectif",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="Ex: Vérifier la mise en oeuvre des activités dans les centres de santé"
                                      />
                                    </label>
                                  </>
                                )}

                                {activeScenario === "biens" && (
                                  <>
                                    <label
                                      className={`${labelClass} md:col-span-2`}
                                    >
                                      Désignation du bien
                                      <input
                                        className={inputClass}
                                        value={guidedBrief.designation}
                                        onChange={(e) =>
                                          updateGuidedBrief(
                                            "designation",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="Ex: Tests rapides, équipements biomédicaux, consommables"
                                      />
                                    </label>
                                    <label
                                      className={`${labelClass} md:col-span-2`}
                                    >
                                      Caractéristiques techniques essentielles
                                      <textarea
                                        className={inputClass}
                                        rows={4}
                                        value={guidedBrief.specs}
                                        onChange={(e) =>
                                          updateGuidedBrief(
                                            "specs",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="Décrire les spécifications utiles sans jargon inutile"
                                      />
                                    </label>
                                    <label className={labelClass}>
                                      Quantité
                                      <input
                                        className={inputClass}
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={guidedBrief.quantite}
                                        onChange={(e) =>
                                          updateGuidedNumber(
                                            "quantite",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="Ex: 250"
                                      />
                                    </label>
                                    <label className={labelClass}>
                                      Unité
                                      <input
                                        className={inputClass}
                                        value={guidedBrief.unite}
                                        onChange={(e) =>
                                          updateGuidedBrief(
                                            "unite",
                                            e.target.value,
                                          )
                                        }
                                        list="unite-options"
                                        placeholder="Ex: unités, kits, boîtes"
                                      />
                                      <datalist id="unite-options">
                                        {UNITE_OPTIONS.map((option) => (
                                          <option key={option} value={option} />
                                        ))}
                                      </datalist>
                                    </label>
                                  </>
                                )}

                                <label
                                  className={`${labelClass} ${activeScenario === "supervision" || activeScenario === "biens" ? "md:col-span-2" : ""}`}
                                >
                                  Contraintes / précisions utiles
                                  <textarea
                                    className={inputClass}
                                    rows={3}
                                    value={guidedBrief.contraintes}
                                    onChange={(e) =>
                                      updateGuidedBrief(
                                        "contraintes",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Ex: délai, qualité attendue, compatibilité, contraintes terrain"
                                  />
                                </label>
                                <label
                                  className={`${labelClass} md:col-span-2`}
                                >
                                  Observations complémentaires
                                  <textarea
                                    className={inputClass}
                                    rows={3}
                                    value={guidedBrief.observations}
                                    onChange={(e) =>
                                      updateGuidedBrief(
                                        "observations",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Ajouter toute précision utile pour la préparation du dossier"
                                  />
                                </label>
                              </div>

                              <div className="rounded-[24px] border border-slate-200/80 bg-white/85 p-4 shadow-[0_14px_28px_rgba(15,23,42,0.05)]">
                                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                  Aperçu
                                </p>
                                <div className="mt-4 rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-50/45 p-4 text-sm leading-6 text-foreground">
                                  {generatedDescription ? (
                                    <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-foreground">
                                      {generatedDescription}
                                    </pre>
                                  ) : (
                                    <p className="text-muted-foreground">
                                      Remplissez quelques champs. L&apos;aperçu
                                      se construit ici.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                              <button
                                type="button"
                                onClick={applyGuidedDescription}
                                disabled={!generatedDescription}
                                className="inline-flex items-center rounded-full border border-emerald-500/20 bg-[linear-gradient(180deg,rgba(236,253,245,0.95),rgba(209,250,229,0.92))] px-4 py-2 text-sm font-semibold text-emerald-950 shadow-[0_10px_22px_rgba(16,185,129,0.14)] transition hover:-translate-y-[1px] hover:border-emerald-500/40 hover:shadow-[0_14px_28px_rgba(16,185,129,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Appliquer le guide
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <label className={`${labelClass} md:col-span-2`}>
                  Pièces jointes (TDR, Spécifications, Note de justification)
                  <div className={`${inputClass} flex flex-col gap-3`}>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center rounded-full border border-emerald-500/20 bg-[linear-gradient(180deg,rgba(236,253,245,0.96),rgba(220,252,231,0.92))] px-4 py-2 text-sm font-semibold text-emerald-950 shadow-[0_10px_22px_rgba(16,185,129,0.12)] transition hover:-translate-y-[1px] hover:border-emerald-500/35 hover:shadow-[0_14px_26px_rgba(16,185,129,0.16)]">
                        Choisir des fichiers
                        <input
                          className="sr-only"
                          type="file"
                          multiple
                          onChange={(e) => handleFilesChange(e.target.files)}
                        />
                      </label>
                      <span className="text-sm text-muted-foreground">
                        {piecesJointes.length > 0
                          ? `${piecesJointes.length} fichier(s) sélectionné(s)`
                          : "Aucun fichier sélectionné"}
                      </span>
                    </div>
                  </div>
                </label>

                {piecesJointes.length > 0 && (
                  <div className="md:col-span-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-foreground">
                    <p className="font-semibold">Fichiers sélectionnés :</p>
                    <ul className="mt-1 list-disc pl-5">
                      {piecesJointes.map((file) => (
                        <li key={`${file.name}-${file.size}`}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>

            <section className={sectionClass}>
              <div className={sectionHeaderClass}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-5 w-5 text-emerald-700" />
                      <h2 className={sectionTitleClass}>Section D — Planification et livraison</h2>
                    </div>
                    <p className={sectionHintClass}>
                      Zone de livraison, calendrier souhaité et justification du degré d&apos;urgence.
                    </p>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {SECTION_META.livraison.tone}
                  </p>
                </div>
              </div>
              <div className="grid gap-2.5 md:grid-cols-2">
                <label className={labelClass}>
                  Région / District sanitaire
                  <select
                    className={inputClass}
                    value={form.region_district}
                    onChange={(e) =>
                      onChange("region_district", e.target.value)
                    }
                  >
                    <option value="" disabled hidden>
                      Sélectionner
                    </option>
                    {REGIONS.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={labelClass}>
                  Adresse précise / Formation sanitaire
                  <input
                    className={inputClass}
                    value={form.adresse_precise}
                    onChange={(e) =>
                      onChange("adresse_precise", e.target.value)
                    }
                  />
                </label>
                <label className={labelClass}>
                  Date de début souhaitée
                  <input
                    className={inputClass}
                    type="date"
                    value={form.date_debut_souhaitee}
                    onChange={(e) =>
                      onChange("date_debut_souhaitee", e.target.value)
                    }
                  />
                </label>
                <label className={labelClass}>
                  Date de fin souhaitée
                  <input
                    className={inputClass}
                    type="date"
                    value={form.date_fin_souhaitee}
                    onChange={(e) =>
                      onChange("date_fin_souhaitee", e.target.value)
                    }
                  />
                </label>
                <label className={`${labelClass} md:col-span-2`}>
                  Niveau d&apos;urgence
                  <select
                    className={inputClass}
                    value={form.urgent ? "oui" : "non"}
                    onChange={(e) => onChange("urgent", e.target.value === "oui")}
                  >
                    {URGENCY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Une urgence déclenche une alerte hiérarchique et doit être justifiée.
                  </span>
                </label>
                {form.urgent && (
                  <div className="relative">
                    {urgencyPromptVisible && (
                      <div className="absolute -top-16 right-0 z-10 max-w-xs rounded-2xl border border-amber-300/60 bg-[linear-gradient(180deg,rgba(255,251,235,0.98),rgba(254,243,199,0.96))] px-4 py-3 text-sm text-amber-950 shadow-[0_18px_38px_rgba(245,158,11,0.18)]">
                        Justifiez brièvement l&apos;urgence pour faciliter la
                        validation.
                      </div>
                    )}
                    <label className={labelClass}>
                      Justification d&apos;urgence
                      <input
                        ref={urgencyJustificationRef}
                        className={`${inputClass} ${
                          urgencyHighlighted
                            ? "border-amber-400 bg-amber-50/80 shadow-[0_0_0_4px_rgba(245,158,11,0.12),0_16px_30px_rgba(245,158,11,0.10)]"
                            : ""
                        }`}
                        value={form.justification_urgence}
                        onChange={(e) =>
                          onChange("justification_urgence", e.target.value)
                        }
                        placeholder="Ex: activité à lancer avant le 15 mai pour éviter un retard opérationnel"
                      />
                    </label>
                  </div>
                )}
              </div>
            </section>

            <section className={sectionClass}>
              <div className={sectionHeaderClass}>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-800">
                    {SECTION_META.validation.step}
                  </span>
                  <h2 className={sectionTitleClass}>
                    <CheckCircle2 className="mr-1 h-5 w-5 text-emerald-700" />
                    Section E - Validation & Workflow
                  </h2>
                </div>
                <p className={sectionHintClass}>
                  Suivi clair du workflow, un seul bloc à la fois pour réduire le bruit.
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Workflow
                  </p>
                  <ol className="mt-3 flex items-center gap-3 overflow-x-auto">
                    {workflowSteps.map((step, index) => {
                      const isDone = !isRejected && currentWorkflowIndex > index;
                      const isCurrent = !isRejected && currentWorkflowIndex === index;
                      const base =
                        isRejected && index === 1
                          ? "border-rose-300 bg-rose-50 text-rose-800"
                          : isDone
                            ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                            : isCurrent
                              ? "border-emerald-500 bg-white text-emerald-700"
                              : "border-slate-200 bg-white text-slate-500";
                      return (
                        <li key={step.key} className="flex items-center gap-2">
                          <span className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${base}`}>
                            {isDone ? "✓" : step.label.charAt(0)}
                          </span>
                          <span className="text-sm font-semibold text-slate-700">
                            {step.label}
                          </span>
                          {index < workflowSteps.length - 1 && (
                            <span className="h-px w-10 bg-slate-200" />
                          )}
                        </li>
                      );
                    })}
                    {isRejected && (
                      <li className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-rose-400 bg-rose-50 text-sm font-semibold text-rose-800">
                          !
                        </span>
                        <span className="text-sm font-semibold text-rose-800">
                          Rejetée
                        </span>
                      </li>
                    )}
                  </ol>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      id: "service",
                      title: "Validation Service",
                      role: "Responsable de service / superviseur",
                      name: form.validateur1_nom,
                      date: form.validateur1_date,
                      decision: form.validateur1_decision,
                      editable: canValidateService,
                      content: (
                        <>
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                                Nom
                              </p>
                              <p className="text-sm font-semibold text-slate-900">
                                {form.validateur1_nom || "-"}
                              </p>
                            </div>
                            <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                                Date
                              </p>
                              <p className="text-sm font-semibold text-slate-900">
                                {form.validateur1_date || "-"}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {(["Approuvé", "Rejeté"] as const).map((decision) => (
                              <button
                                key={decision}
                                type="button"
                                onClick={() => onChange("validateur1_decision", decision)}
                                disabled={!canValidateService}
                                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                  form.validateur1_decision === decision
                                    ? decision === "Approuvé"
                                      ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                                      : "border-rose-300 bg-rose-50 text-rose-800"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200"
                                }`}
                              >
                                {decision}
                              </button>
                            ))}
                          </div>
                          <label className="mt-3 block text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-700">
                            Commentaire
                            <textarea
                              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                              rows={2}
                              value={form.validateur1_commentaire}
                              onChange={(e) => onChange("validateur1_commentaire", e.target.value)}
                              readOnly={!canValidateService}
                              placeholder="Observation complémentaire du responsable"
                            />
                          </label>
                        </>
                      ),
                    },
                    {
                      id: "budget",
                      title: "Validation Budgétaire",
                      role: "Contrôleur budgétaire",
                      name: form.validateur2_nom,
                      date: form.validateur2_date,
                      decision: form.validateur2_fonds || form.validateur2_visa ? "Approuvé" : "",
                      editable: canValidateBudget,
                      content: (
                        <>
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Date</p>
                              <p className="text-sm font-semibold text-slate-900">
                                {form.validateur2_date || "-"}
                              </p>
                            </div>
                            <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Visa</p>
                              {canValidateBudget ? (
                                <input
                                  className={`${inputClass} mt-1`}
                                  value={form.validateur2_visa}
                                  onChange={(e) => onChange("validateur2_visa", e.target.value)}
                                  placeholder="Visa numérique"
                                />
                              ) : (
                                <p className="text-sm font-semibold text-slate-900">
                                  {form.validateur2_visa || "—"}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="mt-3">
                            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                              Disponibilité des fonds
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {(["Fonds disponibles", "Fonds insuffisants"] as const).map((fonds) => (
                                <button
                                  key={fonds}
                                  type="button"
                                  onClick={() => onChange("validateur2_fonds", fonds)}
                                  disabled={!canValidateBudget}
                                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                    form.validateur2_fonds === fonds
                                      ? fonds === "Fonds disponibles"
                                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                                        : "border-amber-300 bg-amber-50 text-amber-800"
                                      : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200"
                                  }`}
                                >
                                  {fonds}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      ),
                    },
                    {
                      id: "direction",
                      title: "Validation Direction",
                      role: "Coordonnateur / Directeur",
                      name: form.validateur3_nom,
                      date: form.validateur3_date,
                      decision: form.validateur3_visa ? "Approuvé" : "",
                      editable: canValidateDirection,
                      content: (
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Date</p>
                            <p className="text-sm font-semibold text-slate-900">
                              {form.validateur3_date || "-"}
                            </p>
                          </div>
                          <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Visa</p>
                            {canValidateDirection ? (
                              <input
                                className={`${inputClass} mt-1`}
                                value={form.validateur3_visa}
                                onChange={(e) => onChange("validateur3_visa", e.target.value)}
                                placeholder="Visa numérique"
                              />
                            ) : (
                              <p className="text-sm font-semibold text-slate-900">
                                {form.validateur3_visa || "—"}
                              </p>
                            )}
                          </div>
                        </div>
                      ),
                    },
                  ].map((block) => {
                    const isOpen = openValidation === block.id || block.editable;
                    const pill =
                      block.decision === "Rejeté"
                        ? "border-rose-300 bg-rose-50 text-rose-800"
                        : block.decision === "Approuvé"
                          ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                          : "border-slate-200 bg-white text-slate-600";
                    return (
                      <div key={block.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <button
                          type="button"
                          onClick={() => setOpenValidation(isOpen && !block.editable ? null : block.id)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-800">
                              {block.title.charAt(0)}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{block.title}</p>
                              <p className="text-xs text-slate-500">{block.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${pill}`}>
                              {block.decision || "En attente"}
                            </span>
                            <span className={`text-lg text-slate-500 transition ${isOpen ? "rotate-90" : ""}`}>
                              ›
                            </span>
                          </div>
                        </button>
                        {isOpen && (
                          <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3">
                            {block.content}
                            <div className="mt-3 flex flex-wrap gap-2">
                              {block.id === "service" && canValidateService && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleWorkflowDecision("Approuvé")}
                                    disabled={isSubmittingAction}
                                    className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:-translate-y-[1px]"
                                  >
                                    Valider Service
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleWorkflowDecision("Rejeté")}
                                    disabled={isSubmittingAction}
                                    className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 hover:-translate-y-[1px]"
                                  >
                                    Rejeter
                                  </button>
                                </>
                              )}
                              {block.id === "budget" && canValidateBudget && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleWorkflowDecision("Approuvé")}
                                    disabled={isSubmittingAction || !form.validateur2_fonds}
                                    className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:-translate-y-[1px] disabled:opacity-60"
                                  >
                                    Valider Budget
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleWorkflowDecision("Rejeté")}
                                    disabled={isSubmittingAction}
                                    className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 hover:-translate-y-[1px]"
                                  >
                                    Rejeter
                                  </button>
                                </>
                              )}
                              {block.id === "direction" && canValidateDirection && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleWorkflowDecision("Approuvé")}
                                    disabled={isSubmittingAction}
                                    className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:-translate-y-[1px]"
                                  >
                                    Valider Direction
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleWorkflowDecision("Rejeté")}
                                    disabled={isSubmittingAction}
                                    className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 hover:-translate-y-[1px]"
                                  >
                                    Rejeter
                                  </button>
                                </>
                              )}
                              {canTransmit && block.id === "direction" && (
                                <button
                                  type="button"
                                  onClick={handleTransmission}
                                  disabled={isSubmittingAction}
                                  className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:-translate-y-[1px]"
                                >
                                  Transmettre aux Marchés
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Historique des validations
                    </p>
                    <span className="text-xs text-slate-500">
                      Transmission : {form.date_transmission_marches || "—"}
                    </span>
                  </div>
                  <div className="mt-2 overflow-x-auto">
                    <table className="min-w-full text-sm text-slate-800">
                      <thead className="text-xs uppercase text-slate-500">
                        <tr>
                          <th className="py-2 text-left">Validateur</th>
                          <th className="py-2 text-left">Rôle</th>
                          <th className="py-2 text-left">Décision</th>
                          <th className="py-2 text-left">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validationHistory.map((item, idx) => (
                          <tr key={idx} className="border-t border-slate-100">
                            <td className="py-2">{item.validator || "—"}</td>
                            <td className="py-2 text-slate-600">{item.role}</td>
                            <td className="py-2">{item.decision || "En attente"}</td>
                            <td className="py-2 text-slate-600">{item.date || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </section>

            {submitAttempted && errors.length > 0 && (
              <div className="rounded-xl border border-destructive/35 bg-destructive/10 p-4 text-sm text-destructive">
                <p className="font-semibold">Erreurs à corriger:</p>
                <ul className="list-disc pl-5">
                  {errors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {message && (
              <div className="rounded-xl border border-primary/20 bg-primary/10 p-4 text-sm text-foreground">
                {message}
              </div>
            )}

            <div className="sticky bottom-0 left-0 right-0 z-10 -mx-4 -mb-4 bg-gradient-to-t from-white via-white/95 to-white/40 px-4 py-3 shadow-[0_-6px_16px_rgba(15,23,42,0.08)] md:-mx-6 md:px-6">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-200"
                >
                  Précédent
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSubmittingAction}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800 transition hover:border-emerald-400 disabled:opacity-60"
                >
                  {isSubmittingAction ? "Traitement..." : "Enregistrer brouillon"}
                </button>
                {canSubmit && (
                  <button
                    type="submit"
                    disabled={isSubmittingAction}
                    className="rounded-xl bg-[linear-gradient(135deg,#0f766e,#10b981)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(16,185,129,0.22)] transition hover:translate-y-[-1px] hover:shadow-[0_18px_36px_rgba(16,185,129,0.28)] disabled:opacity-50"
                  >
                    Soumettre
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
