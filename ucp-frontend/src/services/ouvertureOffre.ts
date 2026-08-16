import { getToken } from "@/services/auth";
import type {
  CreateSeancePayload,
  CommissionMemberPayload,
  PublicValidationAccessPayload,
  PublicValidationContext,
  PublicValidationDecisionPayload,
  PublicValidationRole,
  SeanceOuverture,
  UpdateSeancePayload,
  ValidationPayload,
  OuvertureUser,
} from "@/types/ouvertureOffre";
import type { ProcurementMarket } from "@/types/procurement";
import { API_BASE_URL } from "@/services/api";

const PUBLIC_VALIDATION_SESSION_KEY = "ucp.ouverture.publicValidation";
const PUBLIC_VALIDATION_SESSION_TTL_MS = 30 * 60 * 1000;

export type StoredPublicValidationSession = {
  seanceId: number;
  role: PublicValidationRole;
  email: string;
  password: string;
  createdAt: number;
};

const isStoredPublicValidationSession = (
  value: unknown,
): value is StoredPublicValidationSession => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.seanceId === "number" &&
    (record.role === "membre" || record.role === "president") &&
    typeof record.email === "string" &&
    typeof record.password === "string" &&
    typeof record.createdAt === "number"
  );
};

export const savePublicValidationSession = (
  session: StoredPublicValidationSession,
) => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    PUBLIC_VALIDATION_SESSION_KEY,
    JSON.stringify(session),
  );
};

export const readPublicValidationSession = (
  seanceId?: number,
): StoredPublicValidationSession | null => {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(PUBLIC_VALIDATION_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isStoredPublicValidationSession(parsed)) {
      window.sessionStorage.removeItem(PUBLIC_VALIDATION_SESSION_KEY);
      return null;
    }

    const isExpired =
      Date.now() - parsed.createdAt > PUBLIC_VALIDATION_SESSION_TTL_MS;
    if (isExpired || (seanceId && parsed.seanceId !== seanceId)) {
      window.sessionStorage.removeItem(PUBLIC_VALIDATION_SESSION_KEY);
      return null;
    }

    return parsed;
  } catch {
    window.sessionStorage.removeItem(PUBLIC_VALIDATION_SESSION_KEY);
    return null;
  }
};

export const clearPublicValidationSession = () => {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PUBLIC_VALIDATION_SESSION_KEY);
};

const readErrorMessage = async (response: Response): Promise<string> => {
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : null;

  if (payload && typeof payload === "object") {
    const message = formatApiErrorPayload(payload);
    if (message) {
      return message;
    }
  }

  if (response.status >= 500) {
    return "Le backend ou la base de données est indisponible. Vérifie que Django et PostgreSQL sont lancés.";
  }

  return `Erreur API ouverture (HTTP ${response.status}).`;
};

const formatApiErrorPayload = (
  payload: unknown,
  prefix = "",
): string | null => {
  if (!payload) return null;

  if (typeof payload === "string") {
    const trimmed = payload.trim();
    return trimmed ? `${prefix}${trimmed}` : null;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const message = formatApiErrorPayload(item, prefix);
      if (message) return message;
    }
    return null;
  }

  if (typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    for (const preferredKey of ["detail", "error", "non_field_errors"]) {
      const message = formatApiErrorPayload(record[preferredKey], prefix);
      if (message) return message;
    }

    for (const [field, value] of Object.entries(record)) {
      const label = field === "non_field_errors" ? "" : `${field} : `;
      const message = formatApiErrorPayload(value, label);
      if (message) return message;
    }
  }

  return null;
};

const getAuthHeaders = () => {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export async function getSeances(): Promise<SeanceOuverture[]> {
  const response = await fetch(`${API_BASE_URL}/api/ouverture/seances/`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as SeanceOuverture[];
}

export async function getSeanceById(id: number): Promise<SeanceOuverture> {
  const response = await fetch(`${API_BASE_URL}/api/ouverture/seances/${id}/`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as SeanceOuverture;
}

export async function createSeance(
  payload: CreateSeancePayload,
): Promise<SeanceOuverture> {
  const response = await fetch(`${API_BASE_URL}/api/ouverture/seances/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as SeanceOuverture;
}

export async function updateSeance(
  id: number,
  payload: UpdateSeancePayload,
): Promise<SeanceOuverture> {
  const response = await fetch(`${API_BASE_URL}/api/ouverture/seances/${id}/`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as SeanceOuverture;
}

export async function resendOpeningInvitations(
  id: number,
): Promise<{ detail: string; emails_envoyes: number }> {
  const response = await fetch(
    `${API_BASE_URL}/api/ouverture/seances/${id}/renvoyer-invitations/`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as {
    detail: string;
    emails_envoyes: number;
  };
}

export type CompositionValidationRole = "CN" | "GP" | "RPM";
export type CompositionValidationDecision = "EN_ATTENTE" | "VALIDEE" | "REJETEE";
export type CompositionDashboardStatut =
  | "BROUILLON"
  | "EN_ATTENTE_RPM"
  | "EN_ATTENTE_GP"
  | "EN_ATTENTE_CN"
  | "VALIDEE"
  | "REJETEE";

export interface CompositionValidationSummary {
  role: CompositionValidationRole;
  decision: CompositionValidationDecision;
  validateur: number | null;
  date_validation: string | null;
  commentaire?: string;
  notification_sent_at?: string | null;
}

export interface CompositionMemberItem {
  nom_prenom: string;
  email: string;
  poste: string;
  entite: string;
  numero_carte: string;
}

export interface CompositionPendingItem {
  seance_id: number;
  reference_dossier: string;
  objet_dossier: string;
  date_soumission_membres: string | null;
  membres_count: number;
  statut_dashboard: CompositionDashboardStatut;
  est_urgent?: boolean;
  validations: CompositionValidationSummary[];
  ma_decision: CompositionValidationDecision;
}

export interface CompositionDetail {
  seance_id: number;
  reference_dossier: string;
  objet_dossier: string;
  statut: string;
  membres: CompositionMemberItem[];
  statut_dashboard: CompositionDashboardStatut;
  est_urgent?: boolean;
  ma_decision: CompositionValidationDecision;
  validations: Array<{
    role: CompositionValidationRole;
    decision: CompositionValidationDecision;
    commentaire?: string;
    date_validation: string | null;
    notification_sent_at?: string | null;
  }>;
}

export interface CompositionDecisionPayload {
  commentaire?: string;
}

export interface SubmitCommissionMembersResponse {
  detail: string;
  seance: SeanceOuverture;
  emails_envoyes?: number;
}

export async function submitCommissionMembers(
  id: number,
  payload: { commission_members: CommissionMemberPayload[] },
): Promise<SubmitCommissionMembersResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/ouverture/seances/${id}/soumettre-membres/`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as SubmitCommissionMembersResponse;
}

export async function fetchCompositionPending(): Promise<
  CompositionPendingItem[]
> {
  const response = await fetch(
    `${API_BASE_URL}/api/ouverture/validations-membres/pending/`,
    {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as CompositionPendingItem[];
}

export async function fetchCompositionDetail(
  seanceId: number,
): Promise<CompositionDetail> {
  const response = await fetch(
    `${API_BASE_URL}/api/ouverture/validations-membres/${seanceId}/`,
    {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as CompositionDetail;
}

export async function validateComposition(
  seanceId: number,
  payload: CompositionDecisionPayload = {},
): Promise<Record<string, unknown>> {
  const response = await fetch(
    `${API_BASE_URL}/api/ouverture/validations-membres/${seanceId}/valider/`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

export async function rejectComposition(
  seanceId: number,
  payload: CompositionDecisionPayload = {},
): Promise<Record<string, unknown>> {
  const response = await fetch(
    `${API_BASE_URL}/api/ouverture/validations-membres/${seanceId}/rejeter/`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

export async function validateMember(
  id: number,
  payload: ValidationPayload,
): Promise<SeanceOuverture> {
  const response = await fetch(
    `${API_BASE_URL}/api/ouverture/seances/${id}/valider-membre/`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as SeanceOuverture;
}

export async function validatePresident(
  id: number,
  payload: ValidationPayload,
): Promise<SeanceOuverture> {
  const response = await fetch(
    `${API_BASE_URL}/api/ouverture/seances/${id}/valider-president/`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as SeanceOuverture;
}

export async function rejectMember(
  id: number,
  payload: ValidationPayload,
): Promise<SeanceOuverture> {
  const response = await fetch(
    `${API_BASE_URL}/api/ouverture/seances/${id}/rejeter-membre/`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as SeanceOuverture;
}

export async function rejectPresident(
  id: number,
  payload: ValidationPayload,
): Promise<SeanceOuverture> {
  const response = await fetch(
    `${API_BASE_URL}/api/ouverture/seances/${id}/rejeter-president/`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as SeanceOuverture;
}

export async function getAvailableUsers(): Promise<OuvertureUser[]> {
  const response = await fetch(`${API_BASE_URL}/api/ouverture/utilisateurs/`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as OuvertureUser[];
}

export async function downloadPV(
  id: number,
  referenceDossier: string,
  openInNewTab = false,
): Promise<void> {
  const token = getToken();
  const response = await fetch(
    `${API_BASE_URL}/api/ouverture/seances/${id}/telecharger-pv/`,
    {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);

  if (openInNewTab) {
    // Open preview in a new tab (user can then download from browser viewer)
    window.open(url, "_blank");
    // Do not revoke immediately - allow browser to load. Revoke after short timeout.
    window.setTimeout(() => window.URL.revokeObjectURL(url), 30000);
    return;
  }

  const a = document.createElement("a");
  a.href = url;
  a.download = `PV_Ouverture_${referenceDossier}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function openPublicValidationSession(
  id: number,
  payload: PublicValidationAccessPayload,
): Promise<PublicValidationContext> {
  const response = await fetch(
    `${API_BASE_URL}/api/ouverture/seances/${id}/validation-acces/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as PublicValidationContext;
}

export async function submitPublicValidationDecision(
  id: number,
  payload: PublicValidationDecisionPayload,
): Promise<{
  detail: string;
  seance: SeanceOuverture | null;
  market?: ProcurementMarket | null;
}> {
  const response = await fetch(
    `${API_BASE_URL}/api/ouverture/seances/${id}/validation-decision/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as {
    detail: string;
    seance: SeanceOuverture | null;
    market?: ProcurementMarket | null;
  };
}
