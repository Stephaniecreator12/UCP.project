import { httpClient } from "./httpClient";
import type { PaginatedResponse, Soumissionnaire } from "../../types/evaluations";

export const soumissionnaireService = {
  list: (params?: { search?: string }) => {
    const query = params?.search ? `?search=${encodeURIComponent(params.search)}` : "";
    return httpClient.get<PaginatedResponse<Soumissionnaire>>(`/soumissionnaires/${query}`);
  },
  get: (id: number) => httpClient.get<Soumissionnaire>(`/soumissionnaires/${id}/`),
  create: (payload: Pick<Soumissionnaire, "nom" | "nif_stat">) =>
    httpClient.post<Soumissionnaire>("/soumissionnaires/", payload),
  update: (id: number, payload: Partial<Pick<Soumissionnaire, "nom" | "nif_stat">>) =>
    httpClient.patch<Soumissionnaire>(`/soumissionnaires/${id}/`, payload),
};