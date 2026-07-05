import Cookies from "js-cookie";
import { API_BASE_URL, API_RH_URL } from "./api";
import CryptoJS from "crypto-js";
interface LoginResult {
  status: number;
  success?: boolean;
  accessType?: string;
  message?: string;
}
interface RegisterResult {
  status: number;
  success: boolean;
  message: string;
}
export const rhLogin = async (
  email: string,
  password: string,
  setAccess: (access: string) => void,
): Promise<LoginResult> => {
  // --- MODE SIMULATION POUR LE DÉVELOPPEMENT LOCAL ---
  const emailLower = email.strip
    ? email.strip().toLowerCase()
    : email.trim().toLowerCase();

  if (emailLower === "nalisoa@ucp.mg" || emailLower === "nalisoa@ucp") {
    Cookies.set("access_token", "mock_token_nalisoa_87", { expires: 1 });
    const stringUser = JSON.stringify({
      id: 87,
      email: "nalisoa@ucp.mg",
      nom: "NOMENJANAHARY",
      prenom: "Nalisoa",
    });
    const encryptedUser = CryptoJS.AES.encrypt(
      stringUser,
      process.env.NEXT_PUBLIC_COOKIE_SECRET || "default_secret_key",
    ).toString();
    Cookies.set("user_info", encryptedUser, { expires: 1 });
    const accessType = "private";
    storeCurrentUser({
      id: 87,
      username: "nalisoa",
      email: "nalisoa@ucp.mg",
      first_name: "Nalisoa",
      last_name: "NOMENJANAHARY",
      is_active: true,
      is_staff: false,
      groups: ["VALIDATEUR_HIERARCHIQUE"],
    });
    setAccess(accessType);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("access_token", "mock_token_nalisoa_87");
      } catch { }
    }
    // local profile already stored above
    return { status: 200, success: true, accessType: "private" };
  }
  if (emailLower === "pfgavi@ucp.mg" || emailLower === "pfgavi@ucp") {
    Cookies.set("access_token", "mock_token_anthony_32", { expires: 1 });
    const stringUser = JSON.stringify({
      id: 32,
      email: "pfgavi@ucp.mg",
      nom: "JOHN",
      prenom: "Anthony",
    });
    const encryptedUser = CryptoJS.AES.encrypt(
      stringUser,
      process.env.NEXT_PUBLIC_COOKIE_SECRET || "default_secret_key",
    ).toString();
    Cookies.set("user_info", encryptedUser, { expires: 1 });
    const accessType = "private";
    // mark this simulated account as an agent achat for testing
    storeCurrentUser({
      id: 32,
      username: "anthony",
      email: "pfgavi@ucp.mg",
      first_name: "Anthony",
      last_name: "JOHN",
      is_active: true,
      is_staff: false,
      groups: ["AGENT_ACHAT"],
    });
    setAccess(accessType);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("access_token", "mock_token_anthony_32");
      } catch { }
    }
    // profile stored above
    return { status: 200, success: true, accessType: "private" };
  }
  if (emailLower === "raf.gavi@ucp.mg" || emailLower === "raf.gavi@ucp") {
    Cookies.set("access_token", "mock_token_raf_gavi_33", { expires: 1 });
    const stringUser = JSON.stringify({
      id: 33,
      email: "raf.gavi@ucp.mg",
      nom: "RAF_GAVI",
      prenom: "Finance",
    });
    const encryptedUser = CryptoJS.AES.encrypt(
      stringUser,
      process.env.NEXT_PUBLIC_COOKIE_SECRET || "default_secret_key",
    ).toString();
    Cookies.set("user_info", encryptedUser, { expires: 1 });
    const accessType = "private";
    storeCurrentUser({
      id: 33,
      username: "raf.gavi",
      email: "raf.gavi@ucp.mg",
      first_name: "Finance",
      last_name: "RAF_GAVI",
      is_active: true,
      is_staff: false,
      groups: ["SECRETAIRE"], // ← SECRÉTAIRE (default role)
    });
    setAccess(accessType);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("access_token", "mock_token_raf_gavi_33");
      } catch { }
    }
    // profile stored above
    return { status: 200, success: true, accessType: "private" };
  }

  if (emailLower === "secretaire@ucp.mg" || emailLower === "secretaire@ucp") {
    Cookies.set("access_token", "mock_token_secretaire_50", { expires: 1 });
    const stringUser = JSON.stringify({
      id: 50,
      email: "secretaire@ucp.mg",
      nom: "RAKOTO",
      prenom: "Secrétaire",
    });
    const encryptedUser = CryptoJS.AES.encrypt(
      stringUser,
      process.env.NEXT_PUBLIC_COOKIE_SECRET || "default_secret_key",
    ).toString();
    Cookies.set("user_info", encryptedUser, { expires: 1 });
    const accessType = "private";
    storeCurrentUser({
      id: 50,
      username: "secretaire",
      email: "secretaire@ucp.mg",
      first_name: "Secrétaire",
      last_name: "RAKOTO",
      is_active: true,
      is_staff: false,
      groups: ["SECRETAIRE"],
    });
    setAccess(accessType);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("access_token", "mock_token_secretaire_50");
      } catch { }
    }
    return { status: 200, success: true, accessType: "private" };
  }

  if (emailLower === "alice@ucp.mg" || emailLower === "alice@ucp") {
    Cookies.set("access_token", "mock_token_alice_100", { expires: 1 });
    const stringUser = JSON.stringify({
      id: 100,
      email: "alice@ucp.mg",
      nom: "DUPONT",
      prenom: "Alice",
    });
    const encryptedUser = CryptoJS.AES.encrypt(
      stringUser,
      process.env.NEXT_PUBLIC_COOKIE_SECRET || "default_secret_key",
    ).toString();
    Cookies.set("user_info", encryptedUser, { expires: 1 });
    const accessType = "private";
    storeCurrentUser({
      id: 100,
      username: "alice",
      email: "alice@ucp.mg",
      first_name: "Alice",
      last_name: "DUPONT",
      is_active: true,
      is_staff: false,
      groups: [], // ← VIDE = DEMANDEUR (default role)
    });
    setAccess(accessType);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("access_token", "mock_token_alice_100");
      } catch { }
    }
    return { status: 200, success: true, accessType: "private" };
  }
  // ----------------------------------------------------

  try {
    const response = await fetch(`${API_RH_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    const accessType = "private";
    if (response.ok) {
      Cookies.set("access_token", data.token, {
        expires: 1,
        secure: process.env.NODE_ENV === "production",
      });
      const stringUser = JSON.stringify(data.user);
      const encryptedUser = CryptoJS.AES.encrypt(
        stringUser,
        process.env.NEXT_PUBLIC_COOKIE_SECRET || "default_secret_key",
      ).toString();
      Cookies.set("user_info", encryptedUser, {
        expires: 1,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      setAccess(accessType);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("access_token", data.token);
        } catch { }
      }
      try {
        if (data.user) storeCurrentUser(data.user as UserProfile);
      } catch { }
      return { status: 200, success: true, accessType };
    }
    if (response.status == 400) {
      return {
        status: response.status,
        success: false,
        message: data.message || "l'adresse e-mail ou mot de passe incorrect",
      };
    }
    return {
      status: 404,
      success: false,
      message: data.message || "Identifiants introuvable",
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
    const data = await response.json();
    const accessType = "public";
    if (response.ok) {
      Cookies.set("access_token", data.access, {
        expires: 1,
        secure: process.env.NODE_ENV === "production",
      });
      Cookies.set("refresh_token", data.refresh, {
        expires: 1,
        secure: process.env.NODE_ENV === "production",
      });
      setAccess(accessType);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("access_token", data.access);
          localStorage.setItem("refresh_token", data.refresh);
        } catch { }
      }
      try {
        // attempt to populate the stored user profile after public login
        await fetchCurrentUser().catch(() => null);
      } catch { }
      return { status: 200, success: true, accessType };
    }
    if (response.status == 404) {
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
        data.message || "l'adresse e-mail publique ou mot de passe incorrect",
    };
  } catch {
    return {
      status: 500,
      success: false,
      message: "serveur publique inaccessible",
    };
  }
};
export const login = async (
  email: string,
  password: string,
  setAccess: (access: string) => void,
): Promise<LoginResult> => {
  try {
    if (isUCPDomain(email)) {
      return await rhLogin(email, password, setAccess);
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

export const logout = () => {
  if (typeof window === "undefined") return;
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
  Cookies.remove("access_type");
  Cookies.remove("user_info");
};

export const getToken = () => {
  if (typeof window === "undefined") return null;
  return Cookies.get("access_token");
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

  return (
    extractAuthErrorMessage(data) ?? "Connexion impossible pour le moment."
  );
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
export const SECRETAIRE_GROUP = "SECRETAIRE" as const;

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
  if (isSecretaireUser(user)) return "/personnel/ouverture_offre";
  if (isFinanceUser(user) || isValidatorUser(user))
    return "/personnel/validation";
  if (isAgentAchatUser(user)) return "/personnel/passation";
  if (isAgentMarcheUser(user)) return "/personnel/marche";
  return "/personnel/dashboard";
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

  const rawData = (await readApiResponse(response)) as any;
  if (!rawData) {
    throw new Error("Réponse utilisateur invalide.");
  }

  const user = (rawData.data ? rawData.data : rawData) as UserProfile;
  storeCurrentUser(user);
  return user;
};
