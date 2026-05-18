import { getToken } from "@/services/auth";
import type {
  CreateSeancePayload,
  SeanceOuverture,
  UpdateSeancePayload,
  ValidationPayload,
  OuvertureUser,
} from "@/types/ouvertureOffre";

const readErrorMessage = async (response: Response): Promise<string> => {
  const payload = await response.json().catch(() => null);
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (typeof record.detail === "string" && record.detail.trim()) {
      return record.detail.trim();
    }

    if (typeof record.error === "string" && record.error.trim()) {
      return record.error.trim();
    }
  }

  return "Une erreur est survenue.";
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
