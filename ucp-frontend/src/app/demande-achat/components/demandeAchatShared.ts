import {
  DemandeAchat,
  EtapeValidation,
  ValidationDemandeItem,
} from "@/services/achats";
import {
  UserProfile,
  isAgentAchatUser,
  isAgentMarcheUser,
  isFinanceUser,
  isValidatorUser,
  isLogistiqueUser,
} from "@/services/auth";

export const statusLabels: Record<string, string> = {
  BROUILLON: "Brouillon",
  SOUMISE: "Soumise",
  A_COMPLETER: "À compléter",
  VALIDEE: "Validée",
  VALIDEE_BUDGETAIRE: "Validée budgétairement",
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

export const typeLabels: Record<string, string> = {
  MATERIELS: "Matériels",
  PETITS_SERVICES: "Petits services",
  SERVICES_RECURRENTS: "Services récurrents",
};

export const financementLabels: Record<string, string> = {
  NON_DEFINI: "Non défini",
  BANQUE_MONDIALE: "Banque mondiale",
  FONDS_MONDIAL: "Fonds mondial",
  GAVI: "Gavi",
  FONDS_PROPRES: "Budget interne",
  AUTRES: "Autres partenaires",
};

export const financementColors: Record<string, string> = {
  NON_DEFINI: "bg-amber-400",
  BANQUE_MONDIALE: "bg-blue-500",
  FONDS_MONDIAL: "bg-emerald-500",
  GAVI: "bg-sky-400",
  FONDS_PROPRES: "bg-indigo-500",
  AUTRES: "bg-slate-400",
};

export const procedureLabels: Record<string, string> = {
  DEMANDE_COTATION: "Demande de cotation",
  BON_COMMANDE_DIRECT: "Bon de commande direct",
  SELECTION_APRES_COTATION: "Sélection après cotation",
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
  ECART_DETECTE: "Écart détecté",
  ECART_RESOLU: "Écart résolu",
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
  "ECART_RESOLU",
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

export const needsIssueResolutionAction = (demande: DemandeAchat) =>
  demande.statut !== "CLOTUREE" &&
  demande.statut_reception === "ECART_DETECTE";

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

export const getCompactNeedLabel = (demande: any) => {
  // If we have optimized fields from DemandeAchatListSerializer
  if (demande.first_designation !== undefined) {
    const first = demande.first_designation || demande.objet;
    const count = demande.lignes_count || 0;
    if (count > 1) return `${first} (+${count - 1})`;
    return first;
  }

  const firstLine = demande.lignes_besoin?.[0];
  if (!firstLine) return demande.objet;

  const first = firstLine.designation || firstLine.description_service || firstLine.type_service || demande.objet;
  if (demande.lignes_besoin.length > 1) return `${first} (+${demande.lignes_besoin.length - 1})`;
  return first;
};

export const getCurrentValidationLabel = (demande: DemandeAchat) => {
  const current = timelineValidationSteps.find(
    (step) => step.key === demande.etape_validation_actuelle,
  );
  return current?.label.toLowerCase() ?? "validation";
};

export const getValidationDeadlineState = (demande: DemandeAchat) => {
  if (!["SOUMISE", "A_COMPLETER"].includes(demande.statut)) return null;
  
  const referenceDate = new Date(demande.updated_at || demande.submitted_at || demande.created_at).getTime();
  const deadline = referenceDate + 48 * 60 * 60 * 1000;
  const now = Date.now();
  
  const diffMs = Math.abs(deadline - now);
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (now > deadline) {
    return { status: "RETARD", hours: diffHours };
  }
  
  // Si moins de 24h restantes (mi-parcours de 48h)
  if (diffHours <= 24) {
    return { status: "ATTENTE_CRITIQUE", hours: diffHours };
  }
  
  return { status: "ATTENTE", hours: diffHours };
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
    "VALIDEE_BUDGETAIRE",
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
  const budgetHistory = [...(demande.historiques ?? [])]
    .reverse()
    .find((item) => item.action === "BUDGET_VALIDE");
  const hasBudget = Boolean(
    demande.numero_engagement_budgetaire ||
      ["VALIDEE_BUDGETAIRE", "EN_COMMANDE", "EN_LIVRAISON", "LIVREE", "CLOTUREE"].includes(
        demande.statut,
      ),
  );
  const isBudgetCurrent = demande.statut === "VALIDEE";
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
  const hasClosure = demande.statut === "CLOTUREE" || Boolean(demande.date_cloture);
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
      id: "budget",
      label: "Estimation financière",
      date: budgetHistory?.created_at ?? null,
      state: hasBudget ? "done" : isBudgetCurrent ? "current" : "pending",
      description:
        demande.numero_engagement_budgetaire ||
        (isBudgetCurrent ? "À compléter par la finance" : undefined),
    },
    {
      id: "order",
      label: "Bon de commande émis",
      date: demande.date_bon_commande,
      state:
        hasOrder
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
        expeditionLabels[demande.etat_expedition ?? ""] ||
        (isDeliveryCurrent ? "En préparation" : undefined),
    },
    {
      id: "reception",
      label: "Réception / écarts (Marché)",
      date: demande.date_reception,
      state: hasReception ? "done" : isReceptionCurrent ? "current" : "pending",
      description:
        receptionStatusLabels[demande.statut_reception ?? ""] || undefined,
    },
    {
      id: "issue-resolution",
      label: "Résolution écart",
      date: demande.date_resolution,
      state: hasIssueResolution ? "done" : isIssueCurrent ? "current" : hasIssue ? "pending" : "pending",
      description:
        hasIssue
          ? demande.suivi_resolution || toDisplayLabel(demande.type_ecart)
          : undefined,
    },
    {
      id: "closure",
      label: "Clôture finale",
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
  if (isFinanceUser(user)) {
    if (demande.statut === "VALIDEE") {
      return {
        href: `/demande-achat/${demande.id}/finance`,
        label: "Compléter budget",
        tone: "amber",
      };
    }

    return null;
  }

  if (isValidatorUser(user)) {
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

  // Normal user (Demandeur) sees closure
  if (needsClosureAction(demande)) {
    return {
      href: `/demande-achat/${demande.id}/cloture`,
      label: "Clôturer",
      tone: "slate",
    };
  }

  if (demande.statut === "A_COMPLETER") {
    return {
      href: `/demande-achat/corriger/${demande.id}`,
      label: "Modifier",
      tone: "amber",
    };
  }

  return null;
};
