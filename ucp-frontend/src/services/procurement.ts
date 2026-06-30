import { ProcurementFormValues, ProcurementMarket } from "../types/procurement";
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
    if (data.financing_sources && data.financing_sources.length > 0) {
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
  try {
    const formData = new FormData();

    formData.append("market", String(marketId));

    formData.append("file", file);

    const res = await api.post(
      "/procurement/technical-documents/",
      formData
    );

    return res.data;
  } catch (error) {
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
  try {
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
  } catch (error) {
    return {
      error: true,
      message: parseApiError(error),
    };
  }

};
export const getMarkets = async (
  page: string,
  search: string = "",
  filters: { publishAfter?: string; publishBefore?: string; deadlineAfter?: string; deadlineBefore?: string } = {}
): Promise<PaginatedResponse<ProcurementMarket>> => {
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
    };
  }
}

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
    if (data.deletedAnnexIds && data.deletedAnnexIds.length > 0) {
      data.deletedAnnexIds.forEach((id) => {
        formData.append("deletedAnnexIds", String(id));
      });
    }
    if (data.deletedTechnicalDocumentIds && data.deletedTechnicalDocumentIds.length > 0) {
      data.deletedTechnicalDocumentIds.forEach((id) => {
        formData.append("deletedTechnicalDocumentIds", String(id));
      });
    }

    if (data.financing_sources && data.financing_sources.length > 0) {
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

