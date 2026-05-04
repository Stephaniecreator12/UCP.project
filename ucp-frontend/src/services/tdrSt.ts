//Il sert a creer un brouillon TDR/ST quand la demande doit basculer vers ce module.
"use client";

import { getToken, logout } from "./auth";

export type TdrStDocumentType = "TDR" | "ST";
export type TdrStProcedure = "DC" | "AOI" | "AON" | "GRE_A_GRE";
export type TdrStDureeUnite = "JOURS" | "MOIS";
export type TdrStCategorieActivite =
  | "FORMATION"
  | "ATELIER"
  | "REUNION"
  | "REVUE"
  | "SUPERVISION"
  | "ETUDE"
  | "CONSULTANT"
  | "CABINET"
  | "BUREAU_ETUDES"
  | "ENTREPRISE"
  | "BIENS"
  | "INFRASTRUCTURE";

export interface CreateTdrStDraftPayload {
  demande_achat_id?: number;
  unite_technique: string;
  type_document: TdrStDocumentType;
  categorie_activite: TdrStCategorieActivite | "";
  intitule: string;
  reference_ptba: string;
  periode_debut: string;
  periode_fin: string;
  duree_estimee_valeur: number;
  duree_estimee_unite: TdrStDureeUnite;
  sources_financement: string[];
  numero_subvention?: string;
  ligne_budgetaire: string;
  montant_estime_usd: string;
  procedure_envisagee: TdrStProcedure;
}

export interface TdrStDraftDocument {
  id: number;
  numero_document: string;
  type_document: TdrStDocumentType;
  statut: string;
}

const SESSION_EXPIRED_MESSAGE = "Session expirée. Reconnecte-toi.";

const redirectToLogin = () => {
  if (typeof window === "undefined") return;
  window.location.href = "/login";
};

const extractHtmlTitle = (value: string) => {
  const match = value.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1]?.replace(/\s+/g, " ").trim() ?? "";
};

const parseApiError = async (response: Response) => {
  const text = await response.text().catch(() => "");
  if (!text.trim()) {
    return `Erreur API (HTTP ${response.status})`;
  }

  try {
    const data = JSON.parse(text) as Record<string, unknown>;
    const detail = data.detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
  } catch {
    // ignore JSON parse failure
  }

  const htmlTitle = extractHtmlTitle(text);
  if (htmlTitle) {
    return htmlTitle;
  }

  if (/<[a-z][\s\S]*>/i.test(text)) {
    return response.status >= 500
      ? `Erreur serveur (${response.status}). Vérifie le backend ou applique les migrations.`
      : `Erreur HTTP ${response.status}.`;
  }

  return text.slice(0, 400);
};

const apiFetch = async <T>(url: string, init: RequestInit): Promise<T> => {
  const token = getToken();
  const headers = new Headers(init.headers);

  if (!token) {
    logout();
    redirectToLogin();
    throw new Error(SESSION_EXPIRED_MESSAGE);
  }

  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers,
  });

  if (response.status === 401) {
    logout();
    redirectToLogin();
    throw new Error(SESSION_EXPIRED_MESSAGE);
  }

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return (await response.json()) as T;
};

export const createTdrStDraft = (payload: CreateTdrStDraftPayload) =>
  apiFetch<TdrStDraftDocument>("/api/TdrSt/documents/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
