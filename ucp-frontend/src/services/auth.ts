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
  const emailLower = email.trim().toLowerCase();

  if (
    emailLower === "hashlah940@gmail.com" ||
    emailLower === "cn@ucp.mg" ||
    emailLower === "cn"
  ) {
    Cookies.set("access_token", "mock_token_cn_hashlah_940", { expires: 1 });
    const stringUser = JSON.stringify({
      id: 940,
      email: "hashlah940@gmail.com",
      nom: "CN",
      prenom: "Validateur CN",
    });
    const encryptedUser = CryptoJS.AES.encrypt(
      stringUser,
      process.env.NEXT_PUBLIC_COOKIE_SECRET || "default_secret_key",
    ).toString();
    Cookies.set("user_info", encryptedUser, { expires: 1 });
    const accessType = "private";
    storeCurrentUser({
      id: 940,
      username: "validateur5",
      email: "hashlah940@gmail.com",
      first_name: "Validateur CN",
      last_name: "CN",
      is_active: true,
      is_staff: false,
      groups: ["APPROBATEUR_NATIONAL", "CN"],
    });
    setAccess(accessType);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("access_token", "mock_token_cn_hashlah_940");
      } catch {}
    }
    return { status: 200, success: true, accessType: "private" };
  }

  if (
    emailLower === "raknaliarisoa@gmail.com" ||
    emailLower === "rpm@ucp.mg" ||
    emailLower === "rpm"
  ) {
    Cookies.set("access_token", "mock_token_rpm_raknaliarisoa", { expires: 1 });
    const stringUser = JSON.stringify({
      id: 941,
      email: "raknaliarisoa@gmail.com",
      nom: "RAKOTO",
      prenom: "RPM Validateur",
    });
    const encryptedUser = CryptoJS.AES.encrypt(
      stringUser,
      process.env.NEXT_PUBLIC_COOKIE_SECRET || "default_secret_key",
    ).toString();
    Cookies.set("user_info", encryptedUser, { expires: 1 });
    const accessType = "private";
    storeCurrentUser({
      id: 941,
      username: "rpm_validation",
      email: "raknaliarisoa@gmail.com",
      first_name: "RPM Validateur",
      last_name: "RAKOTO",
      is_active: true,
      is_staff: false,
      groups: ["RPM", "VALIDATEUR_PROGRAMMATIQUE"],
    });
    setAccess(accessType);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("access_token", "mock_token_rpm_raknaliarisoa");
      } catch {}
    }
    return { status: 200, success: true, accessType: "private" };
  }

  if (
    emailLower === "razafimahaleomami@gmail.com" ||
    emailLower === "gp@ucp.mg" ||
    emailLower === "gp"
  ) {
    Cookies.set("access_token", "mock_token_gp_razafi", { expires: 1 });
    const stringUser = JSON.stringify({
      id: 942,
      email: "razafimahaleomami@gmail.com",
      nom: "RAZAFY",
      prenom: "GP Validateur",
    });
    const encryptedUser = CryptoJS.AES.encrypt(
      stringUser,
      process.env.NEXT_PUBLIC_COOKIE_SECRET || "default_secret_key",
    ).toString();
    Cookies.set("user_info", encryptedUser, { expires: 1 });
    const accessType = "private";
    storeCurrentUser({
      id: 942,
      username: "razafimahaleomami",
      email: "razafimahaleomami@gmail.com",
      first_name: "GP Validateur",
      last_name: "RAZAFY",
      is_active: true,
      is_staff: false,
      groups: ["GP", "VALIDATEUR_TECHNIQUE"],
    });
    setAccess(accessType);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("access_token", "mock_token_gp_razafi");
      } catch {}
    }
    return { status: 200, success: true, accessType: "private" };
  }

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
      } catch {}
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
      } catch {}
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
      groups: ["SECRETAIRE"],
    });
    setAccess(accessType);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("access_token", "mock_token_raf_gavi_33");
      } catch {}
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
      } catch {}
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
      } catch {}
    }
    return { status: 200, success: true, accessType: "private" };
  }

  if (
    emailLower === "contractualisation@ucp.mg" ||
    emailLower === "contractualisation@ucp"
  ) {
    Cookies.set("access_token", "mock_token_contractualisation_101", {
      expires: 1,
    });
    const stringUser = JSON.stringify({
      id: 101,
      email: "contractualisation@ucp.mg",
      nom: "RAKOTO",
      prenom: "Contractualisation",
    });
    const encryptedUser = CryptoJS.AES.encrypt(
      stringUser,
      process.env.NEXT_PUBLIC_COOKIE_SECRET || "default_secret_key",
    ).toString();
    Cookies.set("user_info", encryptedUser, { expires: 1 });
    const accessType = "private";
    storeCurrentUser({
      id: 101,
      username: "contractualisation",
      email: "contractualisation@ucp.mg",
      first_name: "Contractualisation",
      last_name: "RAKOTO",
      is_active: true,
      is_staff: false,
      groups: ["LOGISTIQUE"],
    });
    setAccess(accessType);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "access_token",
          "mock_token_contractualisation_101",
        );
      } catch {}
    }
    return { status: 200, success: true, accessType: "private" };
  }
  // ----------------------------------------------------

  try {
    const response = await fetch(`${API_RH_URL}/api/login/`, {
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
        } catch {}
      }
      try {
        if (data.user) storeCurrentUser(data.user as UserProfile);
      } catch {}
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
        } catch {}
      }
      try {
        // attempt to populate the stored user profile after public login
        await fetchCurrentUser().catch(() => null);
      } catch {}
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
    if (isPrivatePersonnelEmail(email)) {
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
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user_profile");
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

const getPrivateLoginEmails = () => {
  const configuredEmails = (process.env.NEXT_PUBLIC_PRIVATE_LOGIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return [...DEFAULT_PRIVATE_LOGIN_EMAILS, ...configuredEmails];
};

export const isPrivatePersonnelEmail = (email: string): boolean => {
  const emailLower = email.trim().toLowerCase();
  return (
    isUCPDomain(emailLower) || getPrivateLoginEmails().includes(emailLower)
  );
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
const DEFAULT_PRIVATE_LOGIN_EMAILS = [
  "raknaliarisoa@gmail.com",
  "razafimahaleomami@gmail.com",
  "stephanie.maminiaina23@gmail.com",
] as const;
export const VALIDATOR_GROUPS = [
  "VALIDATEUR_HIERARCHIQUE",
  "VALIDATEUR_TECHNIQUE",
  "VALIDATEUR_PROGRAMMATIQUE",
  "APPROBATEUR_NATIONAL",
] as const;
export const COMPOSITION_VALIDATOR_GROUPS = [
  "RPM",
  "GP",
  "CN",
  "VALIDATEUR_PROGRAMMATIQUE",
  "VALIDATEUR_TECHNIQUE",
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
export const SECRETAIRE_CONTRACTUALISATION_GROUP =
  "SECRETAIRE_CONTRACTUALISATION" as const;

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

  const rawData = (await readApiResponse(response)) as
    | UserProfile
    | { data?: UserProfile }
    | null;
  if (!rawData) {
    throw new Error("Réponse utilisateur invalide.");
  }

  const user = "data" in rawData && rawData.data ? rawData.data : rawData;
  storeCurrentUser(user);
  return user;
};
