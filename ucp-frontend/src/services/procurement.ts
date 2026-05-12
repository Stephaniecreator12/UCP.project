"use client";
import { ProcurementFormValues,ProcurementMarket } from "../types/procurement";
import { api } from "./config";
import { parseApiError } from "./config";
export type ApiResult<T> =
  | {
      error: false;
      data: T;
    }
  | {
      error: true;
      message: string;
      status?: number;
    };
export const createMarket = async (
  data: ProcurementFormValues
): Promise<ApiResult<ProcurementMarket>> => {
  try {

    const formData = new FormData();

    formData.append("title", data.title);

    formData.append(
      "procedure_type",
      data.procedure_type
    );

    formData.append(
      "category",
      data.category
    );

    formData.append(
      "deadline",
      data.deadline
    );

    formData.append(
      "status",
      data.status
    );

    if (data.project_code) {
      formData.append(
        "project_code",
        data.project_code
      );
    }
    formData.append(
      "financing_sources",
      JSON.stringify(data.financing_sources)
    );

    if (data.reference_bailleur) {
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
) => {
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
) => {
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