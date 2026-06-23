import { httpClient } from "./httpClient";
import type { CritereTechnique, EvaluationConfig, PaginatedResponse } from "../../types/evaluations";

export const evaluationConfigService = {
  getByMarche: async (marcheId: number) => {
    const data = await httpClient.get<PaginatedResponse<EvaluationConfig>>(
      `/configs/?marche=${marcheId}`
    );
    return data.results[0] ?? null;
  },
  create: (payload: Omit<EvaluationConfig, "id">) =>
    httpClient.post<EvaluationConfig>("/configs/", payload),
  update: (id: number, payload: Partial<Omit<EvaluationConfig, "id" | "marche">>) =>
    httpClient.patch<EvaluationConfig>(`/configs/${id}/`, payload),
};

export const critereTechniqueService = {
  listByMarche: (marcheId: number) =>
    httpClient.get<PaginatedResponse<CritereTechnique>>(
      `/criteres-techniques/?marche=${marcheId}`
    ),
  create: (payload: Omit<CritereTechnique, "id">) =>
    httpClient.post<CritereTechnique>("/criteres-techniques/", payload),
  update: (id: number, payload: Partial<Omit<CritereTechnique, "id" | "marche">>) =>
    httpClient.patch<CritereTechnique>(`/criteres-techniques/${id}/`, payload),
  remove: (id: number) => httpClient.delete<void>(`/criteres-techniques/${id}/`),
};