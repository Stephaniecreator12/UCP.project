import { getToken } from "@/services/auth";
import type {
  CreateSeancePayload,
  SeanceOuverture,
  UpdateSeancePayload,
  ValidationPayload,
  OuvertureUser,
} from "@/types/ouvertureOffre";

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

const formatApiErrorPayload = (payload: unknown, prefix = ""): string | null => {
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
  const response = await fetch("/api/ouverture/seances/", {
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
  const response = await fetch(`/api/ouverture/seances/${id}/`, {
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
  const response = await fetch("/api/ouverture/seances/", {
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
  const response = await fetch(`/api/ouverture/seances/${id}/`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as SeanceOuverture;
}

export async function validateMember(
  id: number,
  payload: ValidationPayload,
): Promise<SeanceOuverture> {
  const response = await fetch(`/api/ouverture/seances/${id}/valider-membre/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

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
    `/api/ouverture/seances/${id}/valider-president/`,
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
  const response = await fetch(`/api/ouverture/seances/${id}/rejeter-membre/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

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
    `/api/ouverture/seances/${id}/rejeter-president/`,
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
  const response = await fetch("/api/ouverture/utilisateurs/", {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as OuvertureUser[];
}

export async function downloadPV(id: number, referenceDossier: string): Promise<void> {
  const token = getToken();
  const response = await fetch(`/api/ouverture/seances/${id}/telecharger-pv/`, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `PV_Ouverture_${referenceDossier}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
