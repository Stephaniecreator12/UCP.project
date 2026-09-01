import {
  AGENT_ACHAT_GROUP,
  AGENT_MARCHE_GROUP,
  COMPOSITION_VALIDATOR_GROUPS,
  FINANCE_GROUPS,
  LOGISTIQUE_GROUP,
  MARCHES_GROUP,
  MARKET_GROUPS,
  SECRETAIRE_CONTRACTUALISATION_GROUP,
  SECRETAIRE_GROUP,
  VALIDATOR_GROUPS,
} from "./constants";
import type { UserProfile } from "./types";

export {
  AGENT_ACHAT_GROUP,
  AGENT_MARCHE_GROUP,
  COMPOSITION_VALIDATOR_GROUPS,
  FINANCE_GROUPS,
  LOGISTIQUE_GROUP,
  MARCHES_GROUP,
  SECRETAIRE_CONTRACTUALISATION_GROUP,
  SECRETAIRE_GROUP,
  VALIDATOR_GROUPS,
};

const VALIDATOR_GROUP_LABELS: Record<
  (typeof VALIDATOR_GROUPS)[number],
  string
> = {
  VALIDATEUR_HIERARCHIQUE: "Supérieur hiérarchique",
  VALIDATEUR_TECHNIQUE: "Responsable technique",
  VALIDATEUR_PROGRAMMATIQUE: "Point focal programme",
  APPROBATEUR_NATIONAL: "Coordonnateur national",
};

const COMPOSITION_VALIDATOR_GROUP_LABELS: Record<
  (typeof COMPOSITION_VALIDATOR_GROUPS)[number],
  string
> = {
  RPM: "Responsable Passation de Marché",
  GP: "Gestionnaire de Programme",
  CN: "Coordonnateur national",
  VALIDATEUR_PROGRAMMATIQUE: "Responsable Passation de Marché",
  VALIDATEUR_TECHNIQUE: "Gestionnaire de Programme",
  APPROBATEUR_NATIONAL: "Coordonnateur national",
};

const FINANCE_GROUP_LABELS: Record<(typeof FINANCE_GROUPS)[number], string> = {
  FINANCE: "Finance",
  RAF: "Responsable administratif et financier",
  VALIDATEUR_BUDGETAIRE: "Responsable administratif et financier",
};

const VALIDATOR_GROUP_TO_STEP: Record<
  (typeof VALIDATOR_GROUPS)[number],
  string
> = {
  VALIDATEUR_HIERARCHIQUE: "HIERARCHIQUE",
  VALIDATEUR_TECHNIQUE: "TECHNIQUE",
  VALIDATEUR_PROGRAMMATIQUE: "PROGRAMMATIQUE",
  APPROBATEUR_NATIONAL: "APPROBATION_FINALE",
};

export const isValidatorUser = (user: UserProfile | null) =>
  !!user?.groups?.some((group): group is (typeof VALIDATOR_GROUPS)[number] =>
    VALIDATOR_GROUPS.includes(group as (typeof VALIDATOR_GROUPS)[number]),
  );

export const isCompositionValidatorUser = (user: UserProfile | null) =>
  !!user?.groups?.some(
    (group): group is (typeof COMPOSITION_VALIDATOR_GROUPS)[number] =>
      COMPOSITION_VALIDATOR_GROUPS.includes(
        group as (typeof COMPOSITION_VALIDATOR_GROUPS)[number],
      ),
  );

export const isAgentAchatUser = (user: UserProfile | null) =>
  !!user?.groups?.includes(AGENT_ACHAT_GROUP);

export const isFinanceUser = (user: UserProfile | null) =>
  !!user?.groups?.some((group): group is (typeof FINANCE_GROUPS)[number] =>
    FINANCE_GROUPS.includes(group as (typeof FINANCE_GROUPS)[number]),
  );

export const isAgentMarcheUser = (user: UserProfile | null) =>
  !!user?.groups?.some((group): group is (typeof MARKET_GROUPS)[number] =>
    MARKET_GROUPS.includes(group as (typeof MARKET_GROUPS)[number]),
  );

export const isSecretaireUser = (user: UserProfile | null) =>
  !!user?.groups?.includes(SECRETAIRE_GROUP);

export const isSecretaireContractualisationUser = (user: UserProfile | null) =>
  !!user?.groups?.includes(SECRETAIRE_CONTRACTUALISATION_GROUP);

export const isLogistiqueUser = (user: UserProfile | null) =>
  isAgentMarcheUser(user);

export const canUseGlobalDashboard = (user: UserProfile | null) => !!user;

export const getValidatorGroup = (
  user: UserProfile | null,
): (typeof VALIDATOR_GROUPS)[number] | null => {
  const group = user?.groups?.find(
    (item): item is (typeof VALIDATOR_GROUPS)[number] =>
      VALIDATOR_GROUPS.includes(item as (typeof VALIDATOR_GROUPS)[number]),
  );

  return group ?? null;
};

export const getValidatorRoleLabel = (user: UserProfile | null) => {
  const group = getValidatorGroup(user);
  return group ? VALIDATOR_GROUP_LABELS[group] : "";
};

export const getCompositionValidatorRoleLabel = (user: UserProfile | null) => {
  const group = user?.groups?.find(
    (item): item is (typeof COMPOSITION_VALIDATOR_GROUPS)[number] =>
      COMPOSITION_VALIDATOR_GROUPS.includes(
        item as (typeof COMPOSITION_VALIDATOR_GROUPS)[number],
      ),
  );

  return group ? COMPOSITION_VALIDATOR_GROUP_LABELS[group] : "";
};

export const getFinanceGroup = (user: UserProfile | null) =>
  user?.groups?.find((item): item is (typeof FINANCE_GROUPS)[number] =>
    FINANCE_GROUPS.includes(item as (typeof FINANCE_GROUPS)[number]),
  );

export const getValidatorStep = (user: UserProfile | null) => {
  const validatorGroup = getValidatorGroup(user);
  if (validatorGroup) return VALIDATOR_GROUP_TO_STEP[validatorGroup];

  if (isFinanceUser(user)) return "BUDGETAIRE";

  return null;
};

export const getFinanceRoleLabel = (user: UserProfile | null) => {
  const group = getFinanceGroup(user);
  return group ? FINANCE_GROUP_LABELS[group] : "";
};

export const getAgentAchatRoleLabel = (user: UserProfile | null) =>
  isAgentAchatUser(user) ? "Agent achat" : "";

export const getMarketRoleLabel = (user: UserProfile | null) => {
  if (user?.groups?.includes(LOGISTIQUE_GROUP)) return "Logistique";
  if (user?.groups?.includes(AGENT_MARCHE_GROUP)) return "Agent marché";
  if (user?.groups?.includes(MARCHES_GROUP)) return "Service marché";
  return "";
};

export const getLandingRouteForUser = (user: UserProfile | null) => {
  if (isSecretaireUser(user)) return "/personnel/ouverture_offre";
  if (isSecretaireContractualisationUser(user))
    return "/personnel/contractualisation";
  if (isFinanceUser(user)) return "/personnel/validation";
  if (isCompositionValidatorUser(user))
    return "/personnel/ouverture_offre/validation-membres";
  if (isValidatorUser(user)) return "/personnel/validation";
  if (isAgentAchatUser(user)) return "/personnel/passation";
  if (isAgentMarcheUser(user)) return "/personnel/marche";
  return "/personnel/dashboard";
};
