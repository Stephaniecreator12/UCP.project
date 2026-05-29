import { getToken } from "@/services/auth";
import type {
  ApiResult,
  ProcurementFormValues,
  ProcurementMarket,
} from "@/types/procurement";

type ValidationError = Record<string, unknown>;

const getAuthHeaders = (): HeadersInit => {
  const token = getToken();

  return token ? { Authorization: `Bearer ${token}` } : {};
};

const parseApiError = async (
  response: Response,
): Promise<string | ValidationError> => {
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : null;

  if (!payload || typeof payload !== "object") {
    if (response.status >= 500) {
      return "Le backend ou la base de données est indisponible. Vérifie que Django et PostgreSQL sont lancés.";
    }

    return `Erreur API DAO / DC (HTTP ${response.status}).`;
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.detail === "string" && record.detail.trim()) {
    return record.detail.trim();
  }

  if (typeof record.error === "string" && record.error.trim()) {
    return record.error.trim();
  }

  return record;
};

export async function listMarkets(): Promise<ProcurementMarket[]> {
  const response = await fetch("/api/procurement/markets/", {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await parseApiError(response);
    throw new Error(
      typeof message === "string"
        ? message
        : "Impossible de charger les dossiers DAO / DC.",
    );
  }

  return (await response.json()) as ProcurementMarket[];
}

export async function createMarket(
  data: ProcurementFormValues,
): Promise<ApiResult<ProcurementMarket>> {
  try {
    const formData = new FormData();

    formData.append("title", data.title);
    formData.append("procedure_type", data.procedure_type);
    formData.append("category", data.category);
    formData.append("deadline", data.deadline);
    formData.append("status", data.status);

    if (data.publication_date?.trim()) {
      formData.append("publication_date", data.publication_date);
    }

    if (data.project_code?.trim()) {
      formData.append("project_code", data.project_code);
    }

    formData.append(
      "financing_sources",
      JSON.stringify(data.financing_sources ?? []),
    );

    if (data.reference_bailleur?.trim()) {
      formData.append("reference_bailleur", data.reference_bailleur);
    }

    if (data.submission_model) {
      formData.append("submission_model", data.submission_model);
    }

    const response = await fetch("/api/procurement/markets/", {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      return {
        error: true,
        message: await parseApiError(response),
        status: response.status,
      };
    }

    return {
      error: false,
      data: (await response.json()) as ProcurementMarket,
    };
  } catch (error) {
    return {
      error: true,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de créer le dossier DAO / DC.",
    };
  }
}

export async function uploadTechnicalDocument(
  marketId: number,
  file: File,
): Promise<ApiResult<ProcurementMarket>> {
  try {
    const formData = new FormData();
    formData.append("market", String(marketId));
    formData.append("file", file);

    const response = await fetch("/api/procurement/technical-documents/", {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      return {
        error: true,
        message: await parseApiError(response),
        status: response.status,
      };
    }

    return {
      error: false,
      data: (await response.json()) as ProcurementMarket,
    };
  } catch (error) {
    return {
      error: true,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de téléverser le document technique.",
    };
  }
}

export async function uploadAnnexDocument(
  marketId: number,
  file: File,
): Promise<ApiResult<ProcurementMarket>> {
  try {
    const formData = new FormData();
    formData.append("market", String(marketId));
    formData.append("file", file);

    const response = await fetch("/api/procurement/annexes/", {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      return {
        error: true,
        message: await parseApiError(response),
        status: response.status,
      };
    }

    return {
      error: false,
      data: (await response.json()) as ProcurementMarket,
    };
  } catch (error) {
    return {
      error: true,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de téléverser l'annexe.",
    };
  }
}
