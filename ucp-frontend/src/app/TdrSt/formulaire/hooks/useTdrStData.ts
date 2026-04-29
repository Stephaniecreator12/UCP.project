"use client";

import { useState, useCallback } from "react";
import { getToken } from "@/services/auth";

export type DocumentType = "TDR" | "ST";
export type Statut =
  | "BROUILLON"
  | "SOUMIS"
  | "EN_VALIDATION"
  | "A_REVOIR"
  | "VALIDE"
  | "REJETE"
  | "SUSPENDU";

export type UserRole =
  | "demandeur"
  | "verificateur_technique"
  | "approbateur_final"
  | "auditeur";

type Procedure = "DC" | "AOI" | "AON" | "GRE_A_GRE";
type DureeUnite = "JOURS" | "MOIS";

type CategorieActivite =
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

export type ValidationAction = {
  id: number;
  etape: string;
  decision: string;
  observations: string;
  acteur: number;
  acteur_username: string;
  horodatage: string;
  meta: Record<string, unknown>;
};

export type DocumentVersion = {
  id: number;
  version: number;
  fichier_pdf: string;
  fichier_nom_original: string;
  fichier_taille_octets?: number;
  empreinte_sha256?: string;
  uploaded_by?: number;
  uploaded_at?: string;
  snapshot_data?: {
    unite_technique?: string;
    type_document?: DocumentType;
    categorie_activite?: CategorieActivite;
    intitule?: string;
    reference_ptba?: string;
    periode_debut?: string;
    periode_fin?: string;
    duree_estimee_valeur?: number;
    duree_estimee_unite?: DureeUnite;
    sources_financement?: string;
    numero_subvention?: string;
    ligne_budgetaire?: string;
    montant_estime_usd?: string;
    procedure_envisagee?: Procedure;
    statut?: Statut;
  };
};

export type TdrStDocument = {
  id: number;
  numero_document: string;
  version: number;
  created_at: string;
  updated_at: string;
  unite_technique: string;
  statut: Statut;
  type_document: DocumentType;
  categorie_activite: CategorieActivite;
  intitule: string;
  reference_ptba: string;
  periode_debut: string;
  periode_fin: string;
  duree_estimee_valeur: number;
  duree_estimee_unite: DureeUnite;
  sources_financement: string;
  numero_subvention: string;
  ligne_budgetaire: string;
  montant_estime_usd: string;
  procedure_envisagee: Procedure;
  requires_ano?: boolean;
  actions_validation?: ValidationAction[];
  fichier_courant?: {
    fichier_pdf?: string;
    empreinte_sha256?: string;
    uploaded_by?: number;
  };
  versions_fichier?: DocumentVersion[];
};

export type DocumentRow = {
  doc: TdrStDocument;
  versionNumber: number;
  uploadedAt?: string;
  snapshot?: DocumentVersion["snapshot_data"] | null;
};

export type TdrStFormState = {
  unite_technique: string;
  type_document: DocumentType;
  categorie_activite: CategorieActivite;
  intitule: string;
  reference_ptba: string;
  periode_debut: string;
  periode_fin: string;
  duree_estimee_valeur: number;
  duree_estimee_unite: DureeUnite;
  sources_financement: string;
  numero_subvention: string;
  ligne_budgetaire: string;
  montant_estime_usd: string;
  procedure_envisagee: Procedure;
};

const API_PREFIX = "/api/TdrSt";

export const STATUT_LABEL: Record<Statut, string> = {
  BROUILLON: "Brouillon",
  SOUMIS: "Soumis",
  EN_VALIDATION: "En validation",
  A_REVOIR: "À revoir",
  VALIDE: "Validé",
  REJETE: "Rejeté",
  SUSPENDU: "Suspendu",
};

export const STATUS_BADGE_CLASSES: Record<Statut, string> = {
  BROUILLON: "bg-slate-50 text-slate-700 border border-slate-200",
  SOUMIS: "bg-amber-50 text-amber-700 border border-amber-200",
  EN_VALIDATION: "bg-amber-50 text-amber-700 border border-amber-200",
  A_REVOIR: "bg-rose-50 text-rose-700 border border-rose-200",
  VALIDE: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  REJETE: "bg-rose-50 text-rose-700 border border-rose-200",
  SUSPENDU: "bg-slate-50 text-slate-700 border border-slate-200",
};

export const formatDateForRow = (value?: string): string => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export const formatAmountForRow = (value?: string): string => {
  if (!value) return "—";
  const normalized = String(value).replace(",", ".").replace(/[^0-9.-]/g, "");
  const num = Number(normalized);
  if (!Number.isFinite(num)) return value;
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

const toErrorMessage = async (res: Response): Promise<string> => {
  const text = await res.text().catch(() => "");
  if (!text.trim()) return `Erreur API (HTTP ${res.status})`;
  try {
    const data = JSON.parse(text) as unknown;
    if (data && typeof data === "object") {
      const maybe = (data as { detail?: unknown; error?: unknown }).detail ?? (data as { error?: unknown }).error;
      if (typeof maybe === "string" && maybe.trim()) return maybe;
    }
  } catch {
    // ignore
  }
  return text.slice(0, 300);
};

export async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(path, { ...init, headers });
  if (!res.ok) throw new Error(await toErrorMessage(res));
  return (await res.json()) as T;
}

export function useTdrStData() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>("");
  const [documents, setDocuments] = useState<TdrStDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refreshDocs = useCallback(
    async (r: UserRole) => {
      const url =
        r === "demandeur"
          ? `${API_PREFIX}/documents/me/`
          : r === "verificateur_technique"
            ? `${API_PREFIX}/validations/tech/documents/`
            : r === "approbateur_final"
              ? `${API_PREFIX}/validations/final/documents/`
              : r === "auditeur"
                ? `${API_PREFIX}/auditeur/documents/`
                : `${API_PREFIX}/documents/`;

      const data = await fetchJson<TdrStDocument[]>(url, { method: "GET", cache: "no-store" });
      setDocuments(data);
      return data;
    },
    [],
  );

  const loadUserAndDocs = useCallback(async () => {
    const token = getToken();
    if (!token) return null;

    try {
      const me = await fetchJson<{ role?: UserRole; username?: string }>(`/api/users/me/`, { method: "GET" });
      const r = me.role ?? null;
      if (!r) throw new Error("Rôle utilisateur introuvable.");
      setRole(r);
      setCurrentUsername(me.username || "");
      const docs = await refreshDocs(r);
      return { role: r, username: me.username, documents: docs };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      return null;
    }
  }, [refreshDocs]);

  const setNotification = (type: "error" | "success", message: string) => {
    if (type === "error") setError(message);
    else setSuccess(message);
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 3000);
  };

  return {
    role,
    currentUsername,
    documents,
    setDocuments,
    loading,
    setLoading,
    error,
    success,
    setError,
    setSuccess,
    setNotification,
    refreshDocs,
    loadUserAndDocs,
    fetchJson,
  };
}

export const makeEmptyForm = (): TdrStFormState => ({
  unite_technique: "",
  type_document: "TDR",
  categorie_activite: "FORMATION",
  intitule: "",
  reference_ptba: "",
  periode_debut: "",
  periode_fin: "",
  duree_estimee_valeur: 1,
  duree_estimee_unite: "MOIS",
  sources_financement: "",
  numero_subvention: "",
  ligne_budgetaire: "",
  montant_estime_usd: "",
  procedure_envisagee: "DC",
});

export type FundingSource = "Fonds mondial" | "Banque mondiale" | "Alliance GAVI";
