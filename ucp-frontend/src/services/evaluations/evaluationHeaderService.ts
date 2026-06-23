import { httpClient } from "./httpClient";
import type {
  EvaluationHeader,
  EvaluationHeaderDetail,
  PaginatedResponse,
  StatutEvaluation,
} from "../../types/evaluations";

export interface EvaluationHeaderFilters {
  marche?: number;
  soumissionnaire?: number;
  statut?: StatutEvaluation;
  page?: number;
}

function buildQuery(filters?: EvaluationHeaderFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.marche) params.set("marche", String(filters.marche));
  if (filters.soumissionnaire) params.set("soumissionnaire", String(filters.soumissionnaire));
  if (filters.statut) params.set("statut", filters.statut);
  if (filters.page) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const evaluationHeaderService = {
  list: (filters?: EvaluationHeaderFilters) =>
    httpClient.get<PaginatedResponse<EvaluationHeader>>(
      `/evaluations/${buildQuery(filters)}`
    ),

  get: (id: number) => httpClient.get<EvaluationHeader>(`/evaluations/${id}/`),

  // Vue complète : examen préliminaire, évaluateurs, financier, score, décision.
  getDossier: (id: number) =>
    httpClient.get<EvaluationHeaderDetail>(`/evaluations/${id}/dossier/`),

  create: (payload: { marche: number; soumissionnaire: number; lot_numero?: string }) =>
    httpClient.post<EvaluationHeader>("/evaluations/", payload),
};