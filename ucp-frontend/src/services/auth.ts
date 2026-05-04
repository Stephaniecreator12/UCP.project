import { API_BASE_URL } from "./api";

interface LoginResult {
  success: boolean;
  error?: string;
}

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

const readApiResponse = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }

  const text = await response.text().catch(() => "");
  return text || null;
};

const getLoginErrorMessage = (status: number, data: unknown) => {
  if (status === 401) {
    return "Nom d'utilisateur ou mot de passe incorrect";
  }

  if (status === 404) {
    return "Endpoint de connexion introuvable. Vérifie l'URL du backend et le proxy /api/login.";
  }

  if (status >= 500) {
    return "Le serveur d'authentification est indisponible pour le moment.";
  }

  return extractAuthErrorMessage(data) ?? "Connexion impossible pour le moment.";
};

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
  "VALIDATEUR_PROGRAMMATIQUE",
  "APPROBATEUR_NATIONAL",
] as const;
export const FINANCE_GROUPS = [
  "FINANCE",
  "RAF",
  "VALIDATEUR_BUDGETAIRE",
] as const;
export const AGENT_ACHAT_GROUP = "AGENT_ACHAT" as const;
export const LOGISTIQUE_GROUP = "LOGISTIQUE" as const;
export const AGENT_MARCHE_GROUP = "AGENT_MARCHE" as const;
export const MARCHES_GROUP = "MARCHES" as const;
const MARKET_GROUPS = [
  AGENT_MARCHE_GROUP,
  MARCHES_GROUP,
  LOGISTIQUE_GROUP,
] as const;

const VALIDATOR_GROUP_LABELS: Record<(typeof VALIDATOR_GROUPS)[number], string> = {
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

const VALIDATOR_GROUP_TO_STEP: Record<(typeof VALIDATOR_GROUPS)[number], string> = {
  VALIDATEUR_HIERARCHIQUE: "HIERARCHIQUE",
  VALIDATEUR_TECHNIQUE: "TECHNIQUE",
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

export const isFinanceUser = (user: UserProfile | null) =>
  !!user?.groups?.some(
    (group): group is (typeof FINANCE_GROUPS)[number] =>
      FINANCE_GROUPS.includes(group as (typeof FINANCE_GROUPS)[number]),
  );

export const isAgentMarcheUser = (user: UserProfile | null) =>
  !!user?.groups?.some(
    (group): group is (typeof MARKET_GROUPS)[number] =>
      MARKET_GROUPS.includes(group as (typeof MARKET_GROUPS)[number]),
  );

export const isLogistiqueUser = (user: UserProfile | null) =>
  isAgentMarcheUser(user);

export const canUseGlobalDashboard = (user: UserProfile | null) =>
  !!user;

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

export const getFinanceGroup = (user: UserProfile | null) => user?.groups?.find((item): item is (typeof FINANCE_GROUPS)[number] =>
    FINANCE_GROUPS.includes(item as (typeof FINANCE_GROUPS)[number]),
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
  if (isFinanceUser(user) || isValidatorUser(user)) return "/validation";
  if (isAgentAchatUser(user)) return "/passation";
  if (isAgentMarcheUser(user)) return "/marche";
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
    const data = await readApiResponse(response);
    throw new Error(
      extractAuthErrorMessage(data) ??
        "Impossible de récupérer le profil utilisateur",
    );
  }

  const user = (await readApiResponse(response)) as UserProfile | null;
  if (!user) {
    throw new Error("Réponse utilisateur invalide.");
  }
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

    const data = await readApiResponse(response);

    if (response.ok) {
      const payload = data as
        | {
            access?: string;
            refresh?: string;
          }
        | null;

      if (!payload?.access || !payload?.refresh) {
        return {
          success: false,
          error: "Réponse de connexion invalide.",
        };
      }

      localStorage.setItem("access_token", payload.access);
      localStorage.setItem("refresh_token", payload.refresh);
      // The profile is fetched right after token creation because the frontend
      // routing logic depends on groups and email, not only on the JWT itself.
      await fetchCurrentUser();
      return { success: true };
    }

    return {
      success: false,
      error: getLoginErrorMessage(response.status, data),
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
