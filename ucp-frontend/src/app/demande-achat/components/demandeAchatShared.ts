import {
  DemandeAchat,
  EtapeValidation,
  ValidationDemandeItem,
} from "@/services/achats";
import {
  UserProfile,
  isAgentAchatUser,
  isValidatorUser,
} from "@/services/auth";

export const statusLabels: Record<string, string> = {
  BROUILLON: "Brouillon",
  SOUMISE: "Soumise",
  A_COMPLETER: "À compléter",
  VALIDEE: "Validée",
  EN_COMMANDE: "En commande",
  EN_LIVRAISON: "En livraison",
  LIVREE: "Livrée",
  CLOTUREE: "Clôturée",
  REJETEE: "Rejetée",
};

export const statusClasses: Record<string, string> = {
  BROUILLON: "bg-slate-100 text-slate-700",
  SOUMISE: "bg-amber-100 text-amber-800",
  A_COMPLETER: "bg-orange-100 text-orange-800",
  VALIDEE: "bg-emerald-100 text-emerald-800",
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

export const typeLabels: Record<string, string> = {
  MATERIELS: "Matériels",
  PETITS_SERVICES: "Petits services",
  SERVICES_RECURRENTS: "Services récurrents",
};

export const procedureLabels: Record<string, string> = {
  DEMANDE_COTATION: "Demande de cotation",
  BON_COMMANDE_DIRECT: "Bon de commande direct",
};

export const expeditionLabels: Record<string, string> = {
  EN_TRANSIT: "En transit",
  ARRIVE: "Arrivé",
  PARTIEL: "Partiel",
  RETARD: "Retard",
};

export const receptionStatusLabels: Record<string, string> = {
  EN_ATTENTE: "En attente",
  RECEPTION_PARTIELLE: "Réception partielle",
  RECEPTION_COMPLETE: "Réception complète",
};

export const finalStatusLabels: Record<string, string> = {
  CLOTURE: "Clôturé",
  PARTIELLEMENT_EXECUTE: "Partiellement exécuté",
  ANNULE: "Annulé",
};

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

const finalReceptionStatuses = [
  "RECEPTION_COMPLETE",
  "RECEPTION_PARTIELLE",
] as const;

export const formatDate = (value: string | null | undefined) => {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "-";

  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

export const needsReceptionAction = (demande: DemandeAchat) =>
  demande.statut !== "CLOTUREE" &&
  !hasRecordedReception(demande) &&
  (demande.statut === "LIVREE" ||
    demande.etat_expedition === "ARRIVE" ||
    demande.etat_expedition === "PARTIEL");

export const needsClosureAction = (demande: DemandeAchat) =>
  demande.statut !== "CLOTUREE" && hasRecordedReception(demande);

export const isAttentionRequired = (demande: DemandeAchat) =>
  demande.statut === "A_COMPLETER" ||
  needsReceptionAction(demande) ||
  needsClosureAction(demande);

export const isAwaitingProgress = (demande: DemandeAchat) =>
  demande.statut === "SOUMISE" || demande.statut === "VALIDEE";

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

export const getCompactNeedLabel = (demande: DemandeAchat) => {
  const firstLine = demande.lignes_besoin[0];
  if (!firstLine) return demande.objet;

  return (
    firstLine.designation ||
    firstLine.description_service ||
    firstLine.type_service ||
    demande.objet
  );
};

export const getCurrentValidationLabel = (demande: DemandeAchat) => {
  const current = timelineValidationSteps.find(
    (step) => step.key === demande.etape_validation_actuelle,
  );
  return current?.label.toLowerCase() ?? "validation";
};

const getValidationForStep = (
  validations: ValidationDemandeItem[],
  step: EtapeValidation,
) => validations.find((validation) => validation.etape === step);

export const buildLifecycleTimeline = (demande: DemandeAchat): TimelineItem[] => {
  const currentValidationIndex = timelineValidationSteps.findIndex(
    (step) => step.key === demande.etape_validation_actuelle,
  );
  const validationComplete = [
    "VALIDEE",
    "EN_COMMANDE",
    "EN_LIVRAISON",
    "LIVREE",
    "CLOTUREE",
  ].includes(demande.statut);

  const validationItems = timelineValidationSteps.map((step, index) => {
    const validation = getValidationForStep(demande.validations ?? [], step.key);
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
    demande.date_reception || hasRecordedReception(demande),
  );
  const isReceptionCurrent = needsReceptionAction(demande);
  const hasClosure = demande.statut === "CLOTUREE" || Boolean(demande.date_cloture);
  const isClosureCurrent = needsClosureAction(demande);

  return [
    {
      id: "created",
      label: "Demande créée",
      date: demande.created_at,
      state: "done",
      description: demande.numero_demande,
    },
    {
      id: "submitted",
      label: "Demande soumise",
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
      state: hasOrder ? "done" : demande.statut === "VALIDEE" ? "current" : "pending",
      description: demande.numero_bon_commande || undefined,
    },
    {
      id: "delivery",
      label: "Livraison",
      date: demande.date_arrivee_effective ?? demande.date_arrivee_prevue,
      state: hasDelivery ? "done" : isDeliveryCurrent ? "current" : "pending",
      description:
        expeditionLabels[demande.etat_expedition ?? ""] ||
        (isDeliveryCurrent ? "En préparation" : undefined),
    },
    {
      id: "reception",
      label: "Réception",
      date: demande.date_reception,
      state: hasReception ? "done" : isReceptionCurrent ? "current" : "pending",
      description:
        receptionStatusLabels[demande.statut_reception ?? ""] || undefined,
    },
    {
      id: "closure",
      label: "Clôture",
      date: demande.date_cloture,
      state: hasClosure ? "done" : isClosureCurrent ? "current" : "pending",
      description: finalStatusLabels[demande.statut_final ?? ""] || undefined,
    },
  ];
};

export const getDemandePrimaryAction = (
  demande: DemandeAchat,
  user: UserProfile | null,
): DemandePrimaryAction | null => {
  if (isValidatorUser(user)) {
    return {
      href: `/demande-achat/${demande.id}/validation`,
      label: "Valider",
      tone: "emerald",
    };
  }

  if (isAgentAchatUser(user)) {
    if (demande.statut === "VALIDEE") {
      return {
        href: `/demande-achat/${demande.id}/passation`,
        label: "Passation",
        tone: "emerald",
      };
    }

    if (["EN_COMMANDE", "EN_LIVRAISON"].includes(demande.statut)) {
      return {
        href: `/demande-achat/${demande.id}/livraison`,
        label: "Livraison",
        tone: "sky",
      };
    }

    return null;
  }

  if (needsClosureAction(demande)) {
    return {
      href: `/demande-achat/${demande.id}/cloture`,
      label: "Clôturer",
      tone: "slate",
    };
  }

  if (needsReceptionAction(demande)) {
    return {
      href: `/demande-achat/${demande.id}/reception`,
      label: "Réceptionner",
      tone: "emerald",
    };
  }

  if (demande.statut === "A_COMPLETER") {
    return null;
  }

  return null;
};
