import {
  DemandeAchat,
  EtapeValidation,
  ValidationDemandeItem,
} from "@/services/achats";
import {
  UserProfile,
  getValidatorStep,
  isAgentAchatUser,
  isAgentMarcheUser,
  isLogistiqueUser,
} from "@/services/auth";
import { formatFrenchDate, formatFrenchDateTime } from "@/lib/date";
import { type ReferenceChoiceOption } from "@/services/choices";

// Ces dictionnaires centralisent les libellés métier du module
// "état de besoins" pour garder la même terminologie partout.
// Les constantes servent de fallback statique ; les fonctions getXXXLabels
// fusionnent les choix dynamiques du backend avec ces defaults.
export const statusLabels: Record<string, string> = {
  BROUILLON: "Brouillon",
  SOUMISE: "Soumise",
  A_COMPLETER: "À corriger",
  VALIDEE: "Validée",
  VALIDEE_BUDGETAIRE: "Validée pour passation",
  EN_COMMANDE: "En commande",
  EN_LIVRAISON: "En livraison",
  LIVREE: "Livrée",
  CLOTUREE: "Clôturée",
  REJETEE: "Rejetée",
};

export function getStatusLabels(
  choices: ReferenceChoiceOption[] = [],
): Record<string, string> {
  const labels = { ...statusLabels };
  for (const c of choices) labels[c.code] = c.label;
  return labels;
}

export const statusClasses: Record<string, string> = {
  BROUILLON: "bg-slate-100 text-slate-700",
  SOUMISE: "bg-amber-100 text-amber-800",
  A_COMPLETER: "bg-orange-100 text-orange-800",
  VALIDEE: "bg-emerald-100 text-emerald-800",
  VALIDEE_BUDGETAIRE: "bg-violet-100 text-violet-800",
  EN_COMMANDE: "bg-sky-100 text-sky-800",
  EN_LIVRAISON: "bg-indigo-100 text-indigo-800",
  LIVREE: "bg-cyan-100 text-cyan-800",
  CLOTUREE: "bg-teal-100 text-teal-800",
  REJETEE: "bg-rose-100 text-rose-800",
};

export const stepLabels: Record<string, string> = {
  HIERARCHIQUE: "Validation hiérarchique",
  TECHNIQUE: "Validation technique",
  BUDGETAIRE: "Validation budgétaire",
  PROGRAMMATIQUE: "Validation programmatique",
  APPROBATION_FINALE: "Approbation finale",
  TERMINEE: "Terminée",
};

export function getStepLabels(
  choices: ReferenceChoiceOption[] = [],
): Record<string, string> {
  const labels = { ...stepLabels };
  for (const c of choices) labels[c.code] = c.label;
  return labels;
}

export const typeLabels: Record<string, string> = {
  MATERIELS: "Matériels",
  PETITS_SERVICES: "Petits services",
  SERVICES_RECURRENTS: "Services récurrents",
};

export function getTypeLabels(
  choices: ReferenceChoiceOption[] = [],
): Record<string, string> {
  const labels = { ...typeLabels };
  for (const c of choices) labels[c.code] = c.label;
  return labels;
}

export const financementLabels: Record<string, string> = {
  NON_DEFINI: "Non défini",
  SRPS_CS7_FM: "SRPS / CS7 / Fonds Mondial",
  RSS3_GAVI: "RSS3 / Alliance GAVI",
  FAE_GAVI: "FAE / Alliance GAVI",
  CDS_GAVI: "CDS / Alliance GAVI",
  VAR_GAVI: "VAR / Alliance GAVI",
  PARN2_BM: "PARN2 / Banque Mondiale",
  PPSB_BM: "PPSB / Banque Mondiale",
  FONDS_PROPRES: "Budget interne",
  AUTRES: "Autres partenaires",
};

export function getFinancementLabels(
  choices: ReferenceChoiceOption[] = [],
): Record<string, string> {
  const labels = { ...financementLabels };
  for (const c of choices) labels[c.code] = c.label;
  return labels;
}

export const financementColors: Record<string, string> = {
  NON_DEFINI: "bg-amber-400",
  SRPS_CS7_FM: "bg-emerald-500",
  RSS3_GAVI: "bg-sky-400",
  FAE_GAVI: "bg-sky-500",
  CDS_GAVI: "bg-sky-600",
  VAR_GAVI: "bg-teal-500",
  PARN2_BM: "bg-blue-500",
  PPSB_BM: "bg-blue-600",
  FONDS_PROPRES: "bg-indigo-500",
  AUTRES: "bg-slate-400",
};

export const procedureLabels: Record<string, string> = {
  DEMANDE_COTATION: "Demande de cotation",
  BON_COMMANDE_DIRECT: "Bon de commande direct",
  SELECTION_APRES_COTATION: "Sélection après cotation",
};

export function getProcedureLabels(
  choices: ReferenceChoiceOption[] = [],
): Record<string, string> {
  const labels = { ...procedureLabels };
  for (const c of choices) labels[c.code] = c.label;
  return labels;
}

export const expeditionLabels: Record<string, string> = {
  EN_TRANSIT: "En transit",
  ARRIVE: "Arrivé",
  PARTIEL: "Partiel",
  RETARD: "Retard",
};

export function getExpeditionLabels(
  choices: ReferenceChoiceOption[] = [],
): Record<string, string> {
  const labels = { ...expeditionLabels };
  for (const c of choices) labels[c.code] = c.label;
  return labels;
}

export const receptionStatusLabels: Record<string, string> = {
  EN_ATTENTE: "En attente",
  RECEPTION_PARTIELLE: "Réception partielle",
  RECEPTION_COMPLETE: "Réception complète",
  ECART_DETECTE: "Écart détecté",
  ECART_RESOLU: "Écart résolu",
};

export function getReceptionStatusLabels(
  choices: ReferenceChoiceOption[] = [],
): Record<string, string> {
  const labels = { ...receptionStatusLabels };
  for (const c of choices) labels[c.code] = c.label;
  return labels;
}

export const finalStatusLabels: Record<string, string> = {
  CLOTURE: "Clôturé",
  PARTIELLEMENT_EXECUTE: "Partiellement exécuté",
  ANNULE: "Annulé",
};

export function getFinalStatusLabels(
  choices: ReferenceChoiceOption[] = [],
): Record<string, string> {
  const labels = { ...finalStatusLabels };
  for (const c of choices) labels[c.code] = c.label;
  return labels;
}

export const timelineValidationSteps: Array<{
  key: EtapeValidation;
  label: string;
}> = [
  { key: "HIERARCHIQUE", label: "Validation hiérarchique" },
  { key: "TECHNIQUE", label: "Validation technique" },
  { key: "BUDGETAIRE", label: "Validation budgétaire" },
  { key: "PROGRAMMATIQUE", label: "Validation programmatique" },
  { key: "APPROBATION_FINALE", label: "Approbation finale" },
];

export function getTimelineValidationSteps(
  choices: ReferenceChoiceOption[] = [],
): Array<{ key: EtapeValidation; label: string }> {
  const choiceMap = new Map(choices.map((c) => [c.code, c.label]));
  return timelineValidationSteps.map((step) => ({
    ...step,
    label: choiceMap.get(step.key) ?? step.label,
  }));
}

export type DashboardFilterKey =
  | "toutes"
  | "actions"
  | "attente"
  | "encours"
  | "reception"
  | "cloture";

export type TimelineState = "done" | "current" | "pending";

export type TimelineItem = {
  id: string;
  label: string;
  date?: string | null;
  state: TimelineState;
  description?: string;
};

export type DemandePrimaryAction = {
  href: string;
  label: string;
  tone: "emerald" | "sky" | "slate" | "amber";
};

// Une réception est considérée comme finalisée seulement si elle se trouve
// dans l'un de ces états de sortie.
const finalReceptionStatuses = [
  "RECEPTION_COMPLETE",
  "RECEPTION_PARTIELLE",
  "ECART_RESOLU",
] as const;

export const formatDate = (value: string | null | undefined) => {
  return formatFrenchDate(value);
};

export const formatDateTime = (value: string | null | undefined) => {
  return formatFrenchDateTime(value);
};

export const formatMoney = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return "-";

  const amount = Number(value);
  if (!Number.isFinite(amount)) return String(value);

  return `${amount.toLocaleString("fr-FR")} Ar`;
};

export const toDisplayLabel = (value: unknown) => {
  if (!value) return "-";
  return String(value).replace(/_/g, " ");
};

export const sortDemandesByRecent = (items: DemandeAchat[]) =>
  [...items].sort(
    (a, b) =>
      new Date(b.updated_at || b.created_at).getTime() -
      new Date(a.updated_at || a.created_at).getTime(),
  );

export const hasRecordedReception = (demande: DemandeAchat) =>
  finalReceptionStatuses.includes(
    (demande.statut_reception ?? "") as (typeof finalReceptionStatuses)[number],
  );

export const needsIssueResolutionAction = (demande: DemandeAchat) =>
  demande.statut !== "CLOTUREE" && demande.statut_reception === "ECART_DETECTE";

export const needsReceptionAction = (demande: DemandeAchat) =>
  demande.statut !== "CLOTUREE" &&
  !needsIssueResolutionAction(demande) &&
  !hasRecordedReception(demande) &&
  (demande.statut === "LIVREE" ||
    demande.statut === "EN_COMMANDE" ||
    demande.statut === "EN_LIVRAISON" ||
    demande.etat_expedition === "ARRIVE" ||
    demande.etat_expedition === "PARTIEL");

export const needsClosureAction = (demande: DemandeAchat) =>
  demande.statut !== "CLOTUREE" && hasRecordedReception(demande);

export const isAttentionRequired = (demande: DemandeAchat) =>
  demande.statut === "A_COMPLETER" ||
  needsReceptionAction(demande) ||
  needsIssueResolutionAction(demande) ||
  needsClosureAction(demande);

export const isAwaitingProgress = (demande: DemandeAchat) =>
  demande.statut === "SOUMISE" ||
  demande.statut === "VALIDEE" ||
  demande.statut === "VALIDEE_BUDGETAIRE";

export const isProcurementInProgress = (demande: DemandeAchat) =>
  ["EN_COMMANDE", "EN_LIVRAISON"].includes(demande.statut) &&
  !needsClosureAction(demande);

export const matchesDashboardFilter = (
  demande: DemandeAchat,
  filter: DashboardFilterKey,
) => {
  if (filter === "toutes") return true;
  if (filter === "actions") return isAttentionRequired(demande);
  if (filter === "attente") return isAwaitingProgress(demande);
  if (filter === "encours") return isProcurementInProgress(demande);
  if (filter === "reception") return needsReceptionAction(demande);
  if (filter === "cloture") return needsClosureAction(demande);
  return true;
};

type DashboardDisplayDemande = DemandeAchat & {
  first_designation?: string | null;
  lignes_count?: number | null;
};

export const getCompactNeedLabel = (demande: DashboardDisplayDemande) => {
  // Si la liste provient du serializer optimisé, on exploite directement
  // les champs condensés envoyés par le backend.
  if (demande.first_designation !== undefined) {
    const first = demande.first_designation || demande.objet;
    const count = demande.lignes_count || 0;
    if (count > 1) return `${first} (+${count - 1})`;
    return first;
  }

  const firstLine = demande.lignes_besoin?.[0];
  if (!firstLine) return demande.objet;

  const first =
    firstLine.designation ||
    firstLine.description_service ||
    firstLine.type_service ||
    demande.objet;
  if (demande.lignes_besoin.length > 1)
    return `${first} (+${demande.lignes_besoin.length - 1})`;
  return first;
};

export const getCurrentValidationLabel = (
  demande: DemandeAchat,
  steps?: Array<{ key: EtapeValidation; label: string }>,
) => {
  const validationSteps = steps ?? timelineValidationSteps;
  const current = validationSteps.find(
    (step) => step.key === demande.etape_validation_actuelle,
  );
  return current?.label.toLowerCase() ?? "validation";
};

const currentOwnerLabels: Record<string, string> = {
  HIERARCHIQUE: "Supérieur hiérarchique",
  TECHNIQUE: "Responsable technique",
  BUDGETAIRE: "Finance / RAF",
  PROGRAMMATIQUE: "Point focal programme",
  APPROBATION_FINALE: "Approbateur final",
  TERMINEE: "Circuit terminé",
};

// Ce helper regroupe les statuts techniques dans une étape lisible
// pour l'utilisateur final: validation, passation, livraison, etc.
export const getDemandeTrackingStageLabel = (
  demande: DemandeAchat,
  labels?: { step?: Record<string, string>; status?: Record<string, string> },
) => {
  const step = labels?.step ?? stepLabels;
  const status = labels?.status ?? statusLabels;
  if (demande.statut === "BROUILLON") return "En préparation";
  if (demande.statut === "A_COMPLETER") return "À corriger";
  if (["SOUMISE", "VALIDEE"].includes(demande.statut)) {
    return step[demande.etape_validation_actuelle] ?? "Validation";
  }
  if (demande.statut === "VALIDEE_BUDGETAIRE") return "Passation";
  if (
    ["EN_COMMANDE", "EN_LIVRAISON", "LIVREE"].includes(demande.statut) ||
    needsReceptionAction(demande) ||
    needsIssueResolutionAction(demande)
  ) {
    return "Réception";
  }
  if (needsClosureAction(demande)) {
    return "Clôture";
  }
  if (demande.statut === "CLOTUREE") return "Archivé - clôturé";
  if (demande.statut === "REJETEE") return "Archivé - rejeté";

  return status[demande.statut] ?? demande.statut;
};

// Le "responsable courant" affiché dans le dashboard dépend à la fois
// du statut global et de l'étape de validation réellement en cours.
export const getDemandeCurrentOwnerLabel = (demande: DemandeAchat) => {
  if (demande.statut === "BROUILLON") return "Demandeur";
  if (demande.statut === "A_COMPLETER") return "Demandeur";
  if (demande.statut === "VALIDEE_BUDGETAIRE") return "Agent achat";
  if (["EN_COMMANDE", "EN_LIVRAISON"].includes(demande.statut)) {
    return "Service logistique";
  }
  if (needsReceptionAction(demande) || demande.statut === "LIVREE") {
    return "Service logistique";
  }
  if (needsClosureAction(demande)) {
    return "Demandeur";
  }
  if (demande.statut === "CLOTUREE" || demande.statut === "REJETEE") {
    return "Dossier terminé";
  }
  if (["SOUMISE", "VALIDEE"].includes(demande.statut)) {
    return (
      currentOwnerLabels[demande.etape_validation_actuelle] ??
      "Validation en cours"
    );
  }

  return "Traitement en cours";
};

const isWeekendDate = (value: Date) => {
  const day = value.getDay();
  return day === 0 || day === 6;
};

const addBusinessDays = (value: Date, days: number) => {
  const deadline = new Date(value);
  let daysAdded = 0;

  while (daysAdded < days) {
    deadline.setDate(deadline.getDate() + 1);
    if (!isWeekendDate(deadline)) {
      daysAdded++;
    }
  }

  return deadline;
};

const getBusinessMsBetween = (start: Date, end: Date) => {
  if (end <= start) return 0;

  let total = 0;
  let cursor = new Date(start);

  while (cursor < end) {
    const nextDay = new Date(cursor);
    nextDay.setHours(24, 0, 0, 0);
    const sliceEnd = nextDay < end ? nextDay : end;

    if (!isWeekendDate(cursor)) {
      total += sliceEnd.getTime() - cursor.getTime();
    }

    cursor = nextDay;
  }

  return total;
};

// Les alertes de délai du dashboard sont calculées en jours ouvrés
// pour coller au rythme réel du traitement administratif.
export const getValidationDeadlineState = (demande: DemandeAchat) => {
  if (!["SOUMISE", "A_COMPLETER"].includes(demande.statut)) return null;

  const referenceDate = new Date(
    demande.updated_at || demande.submitted_at || demande.created_at,
  );
  const durationDays = demande.priorite === "URGENT" ? 2 : 5;
  const deadlineDate = addBusinessDays(referenceDate, durationDays);
  const nowDate = new Date();
  const diffMs =
    nowDate > deadlineDate
      ? getBusinessMsBetween(deadlineDate, nowDate)
      : getBusinessMsBetween(nowDate, deadlineDate);
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (nowDate.getTime() > deadlineDate.getTime()) {
    return { status: "RETARD", hours: diffHours };
  }

  const totalHours = durationDays * 24;
  if (diffHours <= totalHours / 2) {
    return { status: "ATTENTE_CRITIQUE", hours: diffHours };
  }

  return { status: "ATTENTE", hours: diffHours };
};

const getValidationForStep = (
  validations: ValidationDemandeItem[],
  step: EtapeValidation,
) => validations.find((validation) => validation.etape === step);

// On reconstruit ici la chronologie complète du dossier afin d'alimenter
// la vue timeline affichée dans le détail.
export const buildLifecycleTimeline = (
  demande: DemandeAchat,
  labels?: {
    steps?: Array<{ key: EtapeValidation; label: string }>;
    expedition?: Record<string, string>;
    reception?: Record<string, string>;
    final?: Record<string, string>;
  },
): TimelineItem[] => {
  const steps = labels?.steps ?? timelineValidationSteps;
  const expedition = labels?.expedition ?? expeditionLabels;
  const reception = labels?.reception ?? receptionStatusLabels;
  const final_ = labels?.final ?? finalStatusLabels;

  const currentValidationIndex = steps.findIndex(
    (step) => step.key === demande.etape_validation_actuelle,
  );
  const validationComplete = [
    "VALIDEE",
    "VALIDEE_BUDGETAIRE",
    "EN_COMMANDE",
    "EN_LIVRAISON",
    "LIVREE",
    "CLOTUREE",
  ].includes(demande.statut);

  const validationItems = steps.map((step, index) => {
    const validation = getValidationForStep(
      demande.validations ?? [],
      step.key,
    );
    let state: TimelineState = "pending";

    if (validation) {
      state = "done";
    } else if (
      ["SOUMISE", "A_COMPLETER"].includes(demande.statut) &&
      currentValidationIndex === index
    ) {
      state = "current";
    } else if (validationComplete && currentValidationIndex >= index) {
      state = "done";
    }

    return {
      id: step.key,
      label: step.label,
      date: validation?.created_at,
      state,
      description: validation?.decision_label,
    };
  });

  const hasOrder = Boolean(
    demande.numero_bon_commande ||
    demande.date_bon_commande ||
    ["EN_COMMANDE", "EN_LIVRAISON", "LIVREE", "CLOTUREE"].includes(
      demande.statut,
    ),
  );
  const isDeliveryCurrent = ["EN_COMMANDE", "EN_LIVRAISON"].includes(
    demande.statut,
  );
  const hasDelivery = ["LIVREE", "CLOTUREE"].includes(demande.statut);
  const hasReception = Boolean(
    demande.date_reception ||
    hasRecordedReception(demande) ||
    demande.statut_reception === "ECART_DETECTE",
  );
  const isReceptionCurrent = needsReceptionAction(demande);
  const hasIssue = Boolean(
    demande.type_ecart ||
    demande.statut_reception === "ECART_DETECTE" ||
    demande.statut_reception === "ECART_RESOLU",
  );
  const hasIssueResolution = demande.statut_reception === "ECART_RESOLU";
  const isIssueCurrent = needsIssueResolutionAction(demande);
  const hasClosure =
    demande.statut === "CLOTUREE" || Boolean(demande.date_cloture);
  const isClosureCurrent = needsClosureAction(demande);

  return [
    {
      id: "created",
      label: "État créé",
      date: demande.created_at,
      state: "done",
      description: demande.numero_demande,
    },
    {
      id: "submitted",
      label: "État soumis",
      date: demande.submitted_at,
      state: demande.submitted_at
        ? "done"
        : demande.statut === "BROUILLON"
          ? "pending"
          : "current",
    },
    ...validationItems,
    {
      id: "order",
      label: "Bon de commande émis",
      date: demande.date_bon_commande,
      state: hasOrder
        ? "done"
        : demande.statut === "VALIDEE_BUDGETAIRE"
          ? "current"
          : "pending",
      description: demande.numero_bon_commande || undefined,
    },
    {
      id: "delivery",
      label: "Suivi expédition (Marché)",
      date: demande.date_arrivee_effective ?? demande.date_arrivee_prevue,
      state: hasDelivery ? "done" : isDeliveryCurrent ? "current" : "pending",
      description:
        expedition[demande.etat_expedition ?? ""] ||
        (isDeliveryCurrent ? "En préparation" : undefined),
    },
    {
      id: "reception",
      label: "Réception / écarts (Marché)",
      date: demande.date_reception,
      state: hasReception ? "done" : isReceptionCurrent ? "current" : "pending",
      description:
        reception[demande.statut_reception ?? ""] || undefined,
    },
    {
      id: "issue-resolution",
      label: "Résolution écart",
      date: demande.date_resolution,
      state: hasIssueResolution
        ? "done"
        : isIssueCurrent
          ? "current"
          : hasIssue
            ? "pending"
            : "pending",
      description: hasIssue
        ? demande.suivi_resolution || toDisplayLabel(demande.type_ecart)
        : undefined,
    },
    {
      id: "closure",
      label: "Clôture finale",
      date: demande.date_cloture,
      state: hasClosure ? "done" : isClosureCurrent ? "current" : "pending",
      description: final_[demande.statut_final ?? ""] || undefined,
    },
  ];
};

// Point central qui décide quel bouton principal afficher selon
// le rôle connecté et l'avancement du dossier.
export const getDemandePrimaryAction = (
  demande: DemandeAchat,
  user: UserProfile | null,
): DemandePrimaryAction | null => {
  const isOwner = !!user && demande.demandeur === Number(user.id);
  const validatorStep = getValidatorStep(user);

  if (
    validatorStep &&
    demande.statut === "SOUMISE" &&
    demande.etape_validation_actuelle === validatorStep
  ) {
    return {
      href: `/demande-achat/${demande.id}/validation`,
      label: "Valider",
      tone: "emerald",
    };
  }

  if (isAgentAchatUser(user)) {
    if (demande.statut === "VALIDEE_BUDGETAIRE") {
      return {
        href: `/demande-achat/${demande.id}/passation`,
        label: "Passation",
        tone: "emerald",
      };
    }

    return null;
  }

  if (isAgentMarcheUser(user) || isLogistiqueUser(user)) {
    if (needsIssueResolutionAction(demande)) {
      return {
        href: `/demande-achat/${demande.id}/resolve-issue`,
        label: "Résoudre écart",
        tone: "amber",
      };
    }

    if (needsReceptionAction(demande)) {
      return {
        href: `/demande-achat/${demande.id}/reception`,
        label: "Faire réception",
        tone: "emerald",
      };
    }

    if (["EN_COMMANDE", "EN_LIVRAISON"].includes(demande.statut)) {
      return {
        href: `/demande-achat/${demande.id}/livraison`,
        label: "Suivi expédition",
        tone: "sky",
      };
    }

    return null;
  }

  // Le demandeur reprend la main au moment de la clôture finale.
  if (needsClosureAction(demande) && isOwner) {
    return {
      href: `/demande-achat/${demande.id}/cloture`,
      label: "Clôturer",
      tone: "slate",
    };
  }

  if (demande.statut === "A_COMPLETER" && isOwner) {
    return {
      href: `/demande-achat/corriger/${demande.id}`,
      label: "Modifier",
      tone: "amber",
    };
  }

  return null;
};
