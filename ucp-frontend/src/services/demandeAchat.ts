import { API_BASE_URL } from "./api";
import { getToken } from "./auth";
import {
  CurrentUserProfile,
  DemandeAchat,
} from "@/types/demandeAchat";

const getHeaders = (isJson = true): HeadersInit => {
  const token = getToken();
  return {
    ...(isJson ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const parseJson = async <T>(response: Response): Promise<T> => {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (data && typeof data === "object" && "detail" in data && data.detail) ||
      "Erreur serveur";
    throw new Error(String(message));
  }
  return data as T;
};

export async function getCurrentUserProfile(): Promise<CurrentUserProfile> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me/`, {
    headers: getHeaders(false),
  });
  return parseJson<CurrentUserProfile>(response);
}

export async function getPendingDemandesAchat(): Promise<DemandeAchat[]> {
  const response = await fetch(`${API_BASE_URL}/api/achats/pending/`, {
    headers: getHeaders(false),
  });
  return parseJson<DemandeAchat[]>(response);
}

export async function getMyDemandesAchat(): Promise<DemandeAchat[]> {
  const response = await fetch(`${API_BASE_URL}/api/achats/me/`, {
    headers: getHeaders(false),
  });
  return parseJson<DemandeAchat[]>(response);
}

export async function getDemandeAchatList(): Promise<DemandeAchat[]> {
  const response = await fetch(`${API_BASE_URL}/api/achats/`, {
    headers: getHeaders(false),
  });
  return parseJson<DemandeAchat[]>(response);
}

export async function createDemandeAchat(
  payload: DemandeAchat,
): Promise<DemandeAchat> {
  const response = await fetch(`${API_BASE_URL}/api/achats/`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return parseJson<DemandeAchat>(response);
}

export async function updateDemandeAchat(
  id: number,
  payload: DemandeAchat,
): Promise<DemandeAchat> {
  const response = await fetch(`${API_BASE_URL}/api/achats/${id}/`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return parseJson<DemandeAchat>(response);
}

export async function submitDemandeAchat(id: number): Promise<DemandeAchat> {
  const response = await fetch(`${API_BASE_URL}/api/achats/${id}/submit/`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({}),
  });
  return parseJson<DemandeAchat>(response);
}

export async function decideDemandeAchat(
  id: number,
  payload: {
    decision: "Approuvé" | "Rejeté";
    commentaire?: string;
    fonds_statut?: "Fonds disponibles" | "Fonds insuffisants";
    visa?: string;
  },
): Promise<DemandeAchat> {
  const response = await fetch(`${API_BASE_URL}/api/achats/${id}/decision/`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return parseJson<DemandeAchat>(response);
}

export async function transmitDemandeAchat(
  id: number,
  commentaire = "",
): Promise<DemandeAchat> {
  const response = await fetch(`${API_BASE_URL}/api/achats/${id}/transmit/`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ commentaire }),
  });
  return parseJson<DemandeAchat>(response);
}
