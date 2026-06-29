<<<<<<< HEAD
import { ProcurementFormValues,ProcurementMarket } from "../types/procurement";
import { api } from "./config";
import { parseApiError } from "./config";
import { ApiResult } from "../types/api";
import { PaginatedResponse } from "../types/procurement";
export const createMarket = async (
  data: ProcurementFormValues
): Promise<ApiResult<ProcurementMarket>> => {
  try {

    const formData = new FormData();
    if (data.title && data.title.trim() !== "") {
    formData.append("title", data.title);
    }
    if (data.procedure_type && data.procedure_type.trim() !== "") {
    formData.append(
      "procedure_type",
      data.procedure_type
    );
  }
    if (data.category && data.category.trim() !== "") {
    formData.append(
      "category",
      data.category
    );
  }
  if (data.dates_atelier && data.dates_atelier.length > 0) {
    data.dates_atelier.forEach((date) => {
      formData.append("dates_atelier", date);
    });
  }
  if (data.publication_date && data.publication_date.trim() !== "") {
    formData.append(
      "publication_date",
      data.publication_date
    );
  }
    if (data.deadline && data.deadline.trim() !== "") {
    formData.append(
      "deadline",
      data.deadline
    );
  }
    if (data.status && data.status.trim() !== "") {
    formData.append(
      "status",
      data.status
    );
  }

    if (data.project_code && data.project_code.trim() !== "") {
      formData.append(
        "project_code",
        data.project_code
      );
    }
    if (data.financing_sources && data.financing_sources.length>0) {
    formData.append(
      "financing_sources",
      JSON.stringify(data.financing_sources)
    );
  }

    if (data.reference_bailleur && data.reference_bailleur.trim() !== "") {
      formData.append(
        "reference_bailleur",
        data.reference_bailleur
      );
    }

    if (data.submission_model) {
      formData.append(
        "submission_model",
        data.submission_model
      );
    }

    const res = await api.post(
      "/procurement/markets/",
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    );

    return {
      error: false,
      data: res.data,
    };

  } catch (e) {

    return {
      error: true,
      message: parseApiError(e),
    };

  }
};
export const uploadTechnicalDocument = async (
  marketId: number,
  file: File
): Promise<ApiResult<ProcurementMarket>> => {
  try{
    const formData = new FormData();

  formData.append("market", String(marketId));
  
  formData.append("file", file);

  const res = await api.post(
    "/procurement/technical-documents/",
    formData
  );

  return res.data;
  }catch (error) {
    return {
      error: true,
      message: parseApiError(error),
    };
  }
  
};
export const uploadAnnexDocument = async (
  marketId: number,
  file: File
): Promise<ApiResult<ProcurementMarket>> => {
  try{
    const formData = new FormData();

  formData.append("market", String(marketId));
  formData.append("file", file);

  const res = await api.post(
    `/procurement/annexes/`,
    formData,
    {
      headers: {
        "Content-Type":
          "multipart/form-data",
      },
    }
  );

  return res.data;
  }catch (error) {
    return {
      error: true,
      message: parseApiError(error),
    };
  }
  
};
export const getMarkets = async(
  page: string, 
  search: string = "",
  filters: { publishAfter?: string; publishBefore?: string; deadlineAfter?: string; deadlineBefore?: string } = {}
): Promise<PaginatedResponse<ProcurementMarket>>=> {
  try {
    const params = new URLSearchParams({
      page,
      search,
      ...(filters.publishAfter && { publish_after: filters.publishAfter }),
      ...(filters.publishBefore && { publish_before: filters.publishBefore }),
      ...(filters.deadlineAfter && { deadline_after: filters.deadlineAfter }),
      ...(filters.deadlineBefore && { deadline_before: filters.deadlineBefore }),
    });
    const res = await api.get(`/procurement/market-list/?${params.toString()}`);
    return res.data; 
  } catch (e) {
    console.error("Erreur API getMarkets:", e);
    return {
      count: 0,
      next: null,
      previous: null,
      results: [],
=======
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
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
    };
  }
}

<<<<<<< HEAD
export const getMarketById = async (id: string): Promise<ApiResult<ProcurementMarket>> => {
  try {
    const res = await api.get(`/procurement/markets/${id}/`);
    return {
      error: false,
      data: res.data
    };
  } catch (e) {
    return {
      error: true,
      message: parseApiError(e),
    };
  }
};
export const updateMarketById = async (id: string, data: ProcurementFormValues): Promise<ApiResult<ProcurementMarket>> => {
  
  try {
    const formData = new FormData();
    if (data.title && data.title.trim() !== "") {
    formData.append("title", data.title);
    }
    if (data.procedure_type && data.procedure_type.trim() !== "") {
    formData.append(
      "procedure_type",
      data.procedure_type
    );
  }
    if (data.category && data.category.trim() !== "") {
    formData.append(
      "category",
      data.category
    );
  }
  if (data.dates_atelier && data.dates_atelier.length > 0) {
    data.dates_atelier.forEach((date) => {
      formData.append("dates_atelier", date);
    });
  }
  if (data.publication_date && data.publication_date.trim() !== "") {
    formData.append(
      "publication_date",
      data.publication_date
    );
  }
    if (data.deadline && data.deadline.trim() !== "") {
    formData.append(
      "deadline",
      data.deadline
    );
  }
    if (data.status && data.status.trim() !== "") {
    formData.append(
      "status",
      data.status
    );
  }

    if (data.project_code && data.project_code.trim() !== "") {
      formData.append(
        "project_code",
        data.project_code
      );
    }
    if (data.financing_sources && data.financing_sources.length>0) {
    formData.append(
      "financing_sources",
      JSON.stringify(data.financing_sources)
    );
  }

    if (data.reference_bailleur && data.reference_bailleur.trim() !== "") {
      formData.append(
        "reference_bailleur",
        data.reference_bailleur
      );
    }

    if (data.submission_model) {
      formData.append(
        "submission_model",
        data.submission_model
      );
    }
    const res = await api.put(
      `/procurement/markets/${id}/`,
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    );
    
    return {
      error: false,
      data: res.data
    };
  } catch (e) {
    return {
      error: true,
      message: parseApiError(e),
    };
  }
};
export const deleteMarketById = async (id: string): Promise<ApiResult<ProcurementMarket>> => {
  try {
    const res = await api.delete(`/procurement/markets/${id}/`);
    return {
      error: false,
      data: res.data
    };
  } catch (e) {
    return {
      error: true,
      message: parseApiError(e),
    };
  }
};

=======
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
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
