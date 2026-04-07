import { API_BASE_URL } from "./api";

interface LoginResult {
  success: boolean;
  error?: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  groups: string[];
}

const USER_STORAGE_KEY = "user_profile";
export const VALIDATOR_GROUPS = [
  "VALIDATEUR_HIERARCHIQUE",
  "VALIDATEUR_TECHNIQUE",
  "VALIDATEUR_BUDGETAIRE",
  "VALIDATEUR_PROGRAMMATIQUE",
  "APPROBATEUR_NATIONAL",
] as const;
export const AGENT_ACHAT_GROUP = "AGENT_ACHAT" as const;

const VALIDATOR_GROUP_LABELS: Record<(typeof VALIDATOR_GROUPS)[number], string> = {
  VALIDATEUR_HIERARCHIQUE: "Supérieur hiérarchique",
  VALIDATEUR_TECHNIQUE: "Responsable technique",
  VALIDATEUR_BUDGETAIRE: "Responsable administratif et financier",
  VALIDATEUR_PROGRAMMATIQUE: "Point focal programme",
  APPROBATEUR_NATIONAL: "Coordonnateur national",
};

const VALIDATOR_GROUP_TO_STEP: Record<(typeof VALIDATOR_GROUPS)[number], string> = {
  VALIDATEUR_HIERARCHIQUE: "HIERARCHIQUE",
  VALIDATEUR_TECHNIQUE: "TECHNIQUE",
  VALIDATEUR_BUDGETAIRE: "BUDGETAIRE",
  VALIDATEUR_PROGRAMMATIQUE: "PROGRAMMATIQUE",
  APPROBATEUR_NATIONAL: "APPROBATION_FINALE",
};

const clearStoredUser = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_STORAGE_KEY);
};

export const getCurrentUser = (): UserProfile | null => {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    clearStoredUser();
    return null;
  }
};

const storeCurrentUser = (user: UserProfile) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

export const isValidatorUser = (user: UserProfile | null) =>
  !!user?.groups?.some(
    (group): group is (typeof VALIDATOR_GROUPS)[number] =>
      VALIDATOR_GROUPS.includes(group as (typeof VALIDATOR_GROUPS)[number]),
  );

export const isAgentAchatUser = (user: UserProfile | null) =>
  !!user?.groups?.includes(AGENT_ACHAT_GROUP);

export const getValidatorGroup = (
  user: UserProfile | null,
): (typeof VALIDATOR_GROUPS)[number] | null => {
  const group = user?.groups?.find((item): item is (typeof VALIDATOR_GROUPS)[number] =>
    VALIDATOR_GROUPS.includes(item as (typeof VALIDATOR_GROUPS)[number]),
  );

  return group ?? null;
};

export const getValidatorRoleLabel = (user: UserProfile | null) => {
  const group = getValidatorGroup(user);
  return group ? VALIDATOR_GROUP_LABELS[group] : "";
};

export const getValidatorStep = (user: UserProfile | null) => {
  const group = getValidatorGroup(user);
  return group ? VALIDATOR_GROUP_TO_STEP[group] : null;
};

export const getAgentAchatRoleLabel = (user: UserProfile | null) =>
  isAgentAchatUser(user) ? "Agent achat" : "";

export const getLandingRouteForUser = (user: UserProfile | null) => {
  if (isValidatorUser(user)) return "/validation";
  if (isAgentAchatUser(user)) return "/passation";
  return "/dashboard";
};

export const fetchCurrentUser = async (): Promise<UserProfile> => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const response = await fetch(`${API_BASE_URL}/api/users/me/`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error("Impossible de récupérer le profil utilisateur");
  }

  const user = (await response.json()) as UserProfile;
  storeCurrentUser(user);
  return user;
};

export const login = async (
  username: string,
  password: string,
): Promise<LoginResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      await fetchCurrentUser();
      return { success: true };
    }

    return {
      success: false,
      error: "Nom d'utilisateur ou mot de passe incorrect",
    };
  } catch {
    return { success: false, error: "Erreur de connexion au serveur" };
  }
};

export const logout = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  clearStoredUser();
};

export const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
};
