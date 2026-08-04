import Cookies from "js-cookie";
import { API_BASE_URL, API_RH_URL } from "./api";
import type { UserProfile } from "@/types/profile";
import { getme } from "./profile";
export type { UserProfile };
import {
  PUBLIC as PUBLIC_GROUP,
  VALIDATEUR_HIERARCHIQUE,
  VALIDATEUR_TECHNIQUE,
  VALIDATEUR_PROGRAMMATIQUE,
  APPROBATEUR_NATIONAL,
  FINANCE,
  RAF,
  VALIDATEUR_BUDGETAIRE,
  AGENT_ACHAT as AGENT_ACHAT_GROUP,
  LOGISTIQUE as LOGISTIQUE_GROUP,
  AGENT_MARCHE as AGENT_MARCHE_GROUP,
  MARCHES as MARCHES_GROUP,
  SECRETAIRE as SECRETAIRE_GROUP,
  SECRETAIRE_CONTRACTUALISATION as SECRETAIRE_CONTRACTUALISATION_GROUP,
  VALIDATOR_GROUPS,
  FINANCE_GROUPS,
  MARCHE_GROUPS as MARKET_GROUPS,
} from "@/constants/groups";
interface LoginResult {
  status: number;
  success?: boolean;
  role?: string;
  groups?: string[];
  message?: string;
  data?: unknown;
  email?: string;
  password?: string;
}

interface RegisterResult {
  status: number;
  success: boolean;
  message: string;
}
export const login = async (
  email: string,
  password: string,
): Promise<LoginResult> => {
  try {
    if (isUCPDomain(email)) {
      const rhResponse = await fetch(`${API_RH_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });
      if (!rhResponse.ok) {
        return getLoginErrorMessage(await rhResponse.json());
      }
      await fetch(`${API_BASE_URL}/api/users/sync/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });
    }

    const response = await fetch(`${API_BASE_URL}/api/users/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (response.ok) {
      Cookies.set("access_token", data.access, { expires: 1, secure: process.env.NODE_ENV === 'production', path: '/' });
      Cookies.set("refresh_token", data.refresh, { expires: 1, secure: process.env.NODE_ENV === 'production', path: '/' });
      Cookies.set("groups", JSON.stringify(data.user.groups), { expires: 1, secure: process.env.NODE_ENV === 'production', path: '/' });
      Cookies.set("role", data.user.role, { expires: 1, secure: process.env.NODE_ENV === 'production', path: '/' });
      return { status: 200, success: true, groups: data.user.groups };
    }
    return getLoginErrorMessage(data);
  } catch {
    return {
      status: 500,
      success: false,
      message: "Erreur de connexion au serveur",
    };
  }
};

export const logout = () => {
  if (typeof window === "undefined") return;
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
  Cookies.remove("groups");
  Cookies.remove("role");
};

export const getToken = () => {
  if (typeof window === "undefined") return null;
  const cookieToken = Cookies.get("access_token");
  if (cookieToken) return cookieToken;
  return localStorage.getItem("access_token");
};

export const publicRegister = async (
  full_name: string,
  email: string,
  phone: string,
  type_entite: string,
  nif: string,
  password: string,
): Promise<RegisterResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/public/create/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name,
        email,
        phone,
        type_entite,
        nif,
        password,
        group: ["public"]
      }),
    });
    const result = await response.json();
    if (response.ok) {
      return { status: 201, success: true, message: "Profil enregistré" };
    }
    let errorMessage = "";

    if (result.message) {
      errorMessage = result.message;
    } else if (result.non_field_errors) {
      const err = result.non_field_errors[0];

      if (typeof err === "string") {
        errorMessage = err;
      } else if (err.message) {
        errorMessage = err.message;
      }
    } else if (result.email) {
      errorMessage = result.email[0];
    } else if (result.password) {
      errorMessage = result.password[0];
    } else if (result.phone) {
      errorMessage = result.phone[0];
    } else if (result.full_name) {
      errorMessage = result.full_name[0];
    } else if (result.type_entite) {
      errorMessage = result.type_entite[0];
    } else {
      return {
        status: 400,
        success: false,
        message: "Une erreur est survenue",
      };
    }
    return {
      status: response.status,
      success: false,
      message: errorMessage,
    };
  } catch {
    return {
      status: 500,
      success: false,
      message: "Erreur de connexion au serveur",
    };
  }
};
export const isUCPDomain = (email: string): boolean => {
  if (!email || !email.includes("@")) return false;
  const domain = email.split("@")[1].toLowerCase();
  return domain === "ucp.mg" || domain === "ucp";
};
const extractAuthErrorMessage = (data: unknown): string | null => {
  if (!data) return null;

  if (typeof data === "string") {
    const trimmed = data.trim();
    return trimmed || null;
  }

  if (typeof data === "object") {
    const record = data as Record<string, unknown>;
    const detail = record.detail;
    const error = record.error;

    if (typeof detail === "string" && detail.trim()) {
      return detail.trim();
    }

    if (typeof error === "string" && error.trim()) {
      return error.trim();
    }
  }

  return null;
};
const getLoginErrorMessage = (data: LoginResult): LoginResult => {
  if (data.status != 200) {
    if(data.email){
      return { status: 400, message: extractAuthErrorMessage(data) || "l'email est invalide", success: false }
    }
    if(data.password){
      return { status: 400, message: extractAuthErrorMessage(data) || "le mot de passe est invalide", success: false }
    }
    return { status: 400, message: extractAuthErrorMessage(data) || "quelque chose c'est mal passé", success: false }
  }
  return { status: 500, message: extractAuthErrorMessage(data) || "Connexion impossible pour le moment.", success: false }
};
export {
  PUBLIC_GROUP,
  VALIDATOR_GROUPS,
  FINANCE_GROUPS,
  AGENT_ACHAT_GROUP,
  LOGISTIQUE_GROUP,
  AGENT_MARCHE_GROUP,
  MARCHES_GROUP,
  MARKET_GROUPS,
  SECRETAIRE_GROUP,
  SECRETAIRE_CONTRACTUALISATION_GROUP,
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
export const isPublicUser = (user: UserProfile | null) =>
  !!user?.groups?.some((group): group is (typeof PUBLIC_GROUP)[number] =>
    PUBLIC_GROUP.includes(group as (typeof PUBLIC_GROUP)[number]),
  );

export const isValidatorUser = (user: UserProfile | null) =>
  !!user?.groups?.some((group): group is (typeof VALIDATOR_GROUPS)[number] =>
    VALIDATOR_GROUPS.includes(group as (typeof VALIDATOR_GROUPS)[number]),
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

export const getFinanceGroup = (user: UserProfile | null) =>
  user?.groups?.find((item): item is (typeof FINANCE_GROUPS)[number] =>
    FINANCE_GROUPS.includes(item as (typeof FINANCE_GROUPS)[number]),
  );
export const getPublicGroup = (user: UserProfile | null) =>
  user?.groups?.find((item): item is (typeof PUBLIC_GROUP)[number] =>
    PUBLIC_GROUP.includes(item as (typeof PUBLIC_GROUP)[number]),
  );

export const getValidatorStep = (user: UserProfile | null) => {
  const vGroup = getValidatorGroup(user);
  if (vGroup) return VALIDATOR_GROUP_TO_STEP[vGroup];

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
  if (isPublicUser(user)) return "/procurement";
  return "/personnel/log-dashboard";
};

export const fetchCurrentUser = async (): Promise<UserProfile> => {
  const result = await getme();
  if (result.error) {
    const detail =
      typeof result.message === "string" ? result.message : "";
    throw new Error(
      detail || "Impossible de récupérer le profil utilisateur",
    );
  }
  if (!result.data) {
    throw new Error("Impossible de récupérer le profil utilisateur");
  }
  return result.data;
};
