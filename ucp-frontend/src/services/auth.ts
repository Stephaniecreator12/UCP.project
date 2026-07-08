import Cookies from "js-cookie";
import { API_BASE_URL, API_RH_URL } from "./api";
import { UserProfileValue } from "@/types/profile";
interface LoginResult {
  status: number;
  success?: boolean;
  role?: string;
  message?: string;
  data?: unknown;
  email?:string;
  password?:string;
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
    let response;
    if (isUCPDomain(email)) {
      let isOnDb = false;
      const vERes = await fetch(`${API_BASE_URL}/api/user/by-email/`, {
        method: "GET",
        body: JSON.stringify({ email }),
      });
      const vEData = await vERes.json()
      if (vEData.status == 200) {
        isOnDb = true
      }
      if (isOnDb == true) {
        response = await fetch(`${API_RH_URL}/api/login/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
      }
      else {
        response = await fetch(`${API_RH_URL}/api/login/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const tempData = await response.json();

        if (tempData.status == 200) {
          await fetch(`${API_BASE_URL}/api/user/create/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
        }
      }
    }

    else {
      response = await fetch(`${API_BASE_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    }
    const data = await response.json();
    if (response.ok) {
      Cookies.set("access_token", data.access, { expires: 1, secure: process.env.NODE_ENV === 'production' });
      Cookies.set("refresh_token", data.refresh, { expires: 1, secure: process.env.NODE_ENV === 'production' });
      Cookies.set("groups", JSON.stringify(data.groups), { expires: 1, secure: process.env.NODE_ENV === 'production' });
      return { status: 200, success: true, role: data.group };
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
  Cookies.remove("role");
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
    const response = await fetch(`${API_BASE_URL}/api/public-profile/create/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name,
        email,
        phone,
        type_entite,
        nif,
        password,
        group:["public"]
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
    if (data.email){
      return { status: data.status, message: data.email[0], success: false };
    }
    if(data.password){
      return { status: data.status, message: data.password[0], success: false };
    }
    return { status: 400, message: extractAuthErrorMessage(data) || "quelque chose c'est mal passé", success: false }
  }
  return { status: 500, message: extractAuthErrorMessage(data) || "Connexion impossible pour le moment.", success: false }
};
export const getLandingRouteForUser = (user: UserProfileValue | null) => {
  if (isSecretaireUser(user)) return "/personnel/ouverture_offre";
  if (isFinanceUser(user) || isValidatorUser(user))
    return "/personnel/validation";
  if (isAgentAchatUser(user)) return "/personnel/passation";
  if (isAgentMarcheUser(user)) return "/personnel/marche";
  return "/personnel/dashboard";
};