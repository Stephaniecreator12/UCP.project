import { httpClient } from "./httpClient";
import type { EvaluationFinanciere } from "../../types/evaluations";

export type EvaluationFinancierePayload = Pick<
  EvaluationFinanciere,
  "evaluation" | "montant_lu" | "corrections_arithmetiques" | "rabais_accordes" | "montant_moins_disant"
>;

export const evaluationFinanciereService = {
  get: (id: number) => httpClient.get<EvaluationFinanciere>(`/evaluations-financieres/${id}/`),

  create: (payload: EvaluationFinancierePayload) =>
    httpClient.post<EvaluationFinanciere>("/evaluations-financieres/", payload),

  update: (id: number, payload: Partial<Omit<EvaluationFinancierePayload, "evaluation">>) =>
    httpClient.patch<EvaluationFinanciere>(`/evaluations-financieres/${id}/`, payload),
};