import { httpClient } from "./httpClient";
import type { EvaluationDecision, RecommandationFinale } from "../../types/evaluations";

export const evaluationDecisionService = {
  create: (payload: {
    evaluation: number;
    recommandation: RecommandationFinale;
    justification: string;
    declaration_absence_conflit_interet: boolean;
  }) => httpClient.post<EvaluationDecision>("/decisions/", payload),

  get: (id: number) => httpClient.get<EvaluationDecision>(`/decisions/${id}/`),
};