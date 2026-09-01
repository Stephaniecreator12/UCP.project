import { API_BASE_URL, API_RH_URL } from "./api";
import {
  asRecord,
  extractAuthErrorMessage,
  getLoginErrorMessage,
  getStringField,
  readApiResponse,
} from "./auth/http";
import { persistAuthSession, storeCurrentUser } from "./auth/session";
import type { LegacyUserInfo, LoginResult, RegisterResult, UserProfile } from "./auth/types";

export type { LoginResult, RegisterResult, UserProfile } from "./auth/types";
export { getCurrentUser, getToken, logout } from "./auth/session";
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
  canUseGlobalDashboard,
  getAgentAchatRoleLabel,
  getCompositionValidatorRoleLabel,
  getFinanceGroup,
  getFinanceRoleLabel,
  getLandingRouteForUser,
  getMarketRoleLabel,
  getValidatorGroup,
  getValidatorRoleLabel,
  getValidatorStep,
  isAgentAchatUser,
  isAgentMarcheUser,
  isCompositionValidatorUser,
  isFinanceUser,
  isLogistiqueUser,
  isSecretaireContractualisationUser,
  isSecretaireUser,
  isValidatorUser,
} from "./auth/roles";

const getNumberField = (
  data: Record<string, unknown> | null,
  key: string,
): number | null => {
  const value = data?.[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const getBooleanField = (
  data: Record<string, unknown> | null,
  key: string,
  fallback: boolean,
) => (typeof data?.[key] === "boolean" ? data[key] : fallback);

const getStringArrayField = (
  data: Record<string, unknown> | null,
  key: string,
) => {
  const value = data?.[key];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
};

const normalizeUserProfile = (data: unknown): UserProfile | null => {
  const record = asRecord(data);
  if (!record) return null;

  const email = getStringField(record, "email") ?? "";
  const fullName = getStringField(record, "full_name") ?? "";
  const username =
    getStringField(record, "username") ||
    email ||
    fullName ||
    `user-${getNumberField(record, "id") ?? "unknown"}`;

  return {
    id: getNumberField(record, "id") ?? 0,
    username,
    email,
    first_name: getStringField(record, "first_name") ?? fullName,
    last_name: getStringField(record, "last_name") ?? "",
    is_active: getBooleanField(record, "is_active", true),
    is_staff: getBooleanField(record, "is_staff", false),
    groups: getStringArrayField(record, "groups"),
  };
};

const getUserFromApiPayload = (payload: unknown): UserProfile | null => {
  const record = asRecord(payload);
  if (!record) return normalizeUserProfile(payload);

  return normalizeUserProfile(record.data) ?? normalizeUserProfile(record.user);
};

const getLegacyUserInfo = (user: UserProfile | null): LegacyUserInfo | null =>
  user
    ? {
        id: user.id,
        email: user.email,
        nom: user.last_name,
        prenom: user.first_name,
      }
    : null;

const getRefreshToken = (payload: unknown) => {
  const record = asRecord(payload);
  return getStringField(record, "refresh");
};

export const rhLogin = async (
  email: string,
  password: string,
  setAccess: (access: string) => void,
): Promise<LoginResult> => {
  try {
    const response = await fetch(`${API_RH_URL}/api/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await readApiResponse(response);
    const record = asRecord(data);
    const token = getStringField(record, "token");
    const user = getUserFromApiPayload(data);
    const accessType = "private";

    if (response.ok && token) {
      persistAuthSession({
        accessToken: token,
        refreshToken: getRefreshToken(data),
        accessType,
        user,
        legacyUserInfo: getLegacyUserInfo(user),
        setAccess,
      });

      return { status: 200, success: true, accessType };
    }

    return {
      status: response.status,
      success: false,
      message: getLoginErrorMessage(response.status, data),
    };
  } catch {
    return { status: 500, success: false, message: "serveur RH inaccessible" };
  }
};

export const publicLogin = async (
  email: string,
  password: string,
  setAccess: (access: string) => void,
): Promise<LoginResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/public/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await readApiResponse(response);
    const record = asRecord(data);
    const access = getStringField(record, "access");
    const refresh = getStringField(record, "refresh");
    const accessType = "public";

    if (response.ok && access) {
      persistAuthSession({
        accessToken: access,
        refreshToken: refresh,
        accessType,
        setAccess,
      });

      await fetchCurrentUser().catch(() => null);
      return { status: 200, success: true, accessType };
    }

    if (response.status === 404) {
      return {
        message: "identifiants publique introuvable",
        success: false,
        status: 404,
      };
    }

    return {
      status: response.status,
      success: false,
      message:
        extractAuthErrorMessage(data) ??
        "l'adresse e-mail publique ou mot de passe incorrect",
    };
  } catch {
    return {
      status: 500,
      success: false,
      message: "serveur publique inaccessible",
    };
  }
};

export const isUCPDomain = (email: string): boolean => {
  if (!email || !email.includes("@")) return false;
  const domain = email.split("@")[1].toLowerCase();
  return domain === "ucp.mg" || domain === "ucp";
};

export const isPrivatePersonnelEmail = (email: string): boolean =>
  isUCPDomain(email.trim().toLowerCase());

export const login = async (
  email: string,
  password: string,
  setAccess: (access: string) => void,
): Promise<LoginResult> => {
  try {
    const privateResult = await rhLogin(email, password, setAccess);
    if (privateResult.success || isPrivatePersonnelEmail(email)) {
      return privateResult;
    }

    return await publicLogin(email, password, setAccess);
  } catch {
    return {
      status: 500,
      success: false,
      message: "Erreur de connexion au serveur",
    };
  }
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
    const response = await fetch(`${API_BASE_URL}/api/users/create/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name,
        email,
        phone,
        type_entite,
        nif,
        password,
      }),
    });
    const result = await readApiResponse(response);

    if (response.ok) {
      return { status: 201, success: true, message: "Profil enregistré" };
    }

    return {
      status: response.status,
      success: false,
      message: extractAuthErrorMessage(result) ?? "Une erreur est survenue",
    };
  } catch {
    return {
      status: 500,
      success: false,
      message: "Erreur de connexion au serveur",
    };
  }
};

export const fetchCurrentUser = async (): Promise<UserProfile> => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const response = await fetch(`${API_BASE_URL}/api/users/me/`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await readApiResponse(response);

  if (!response.ok) {
    throw new Error(
      extractAuthErrorMessage(data) ??
        "Impossible de récupérer le profil utilisateur",
    );
  }

  const user = getUserFromApiPayload(data);
  if (!user) {
    throw new Error("Réponse utilisateur invalide.");
  }

  storeCurrentUser(user);
  return user;
};
