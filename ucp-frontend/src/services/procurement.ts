import { ProcurementFormValues,ProcurementMarket } from "../types/procurement";
import { api } from "./config";
import { parseApiError } from "./config";
import { ApiResult } from "../types/procurement";
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
    formData.append(
      "dates_atelier",
      JSON.stringify(data.dates_atelier)
    );
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
export const getMarkets = async(page: string): Promise<PaginatedResponse<ProcurementMarket>>=> {
  try {
    const res = await api.get(`/procurement/market-list/?page=${page}`);
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

export const getMarketById = async(reference_number: string): Promise<ApiResult<ProcurementMarket>>=> {
  try {
    const res = await api.get(`/procurement/markets/${reference_number}`);
    return res.data; 
  } catch (e) {

    return {
      error: true,
      message: parseApiError(e),
    };
  }
}

