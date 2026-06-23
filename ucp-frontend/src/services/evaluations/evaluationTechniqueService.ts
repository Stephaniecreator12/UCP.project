import { httpClient } from "./httpClient";
import type { EvaluationTechnique, PaginatedResponse } from "../../types/evaluations";

export const evaluationTechniqueService = {
  listByEvaluateur: (evaluateurId: number) =>
    httpClient.get<PaginatedResponse<EvaluationTechnique>>(
      `/notes-techniques/?evaluateur=${evaluateurId}`
    ),

  upsert: (payload: {
    id?: number;
    evaluation: number;
    evaluateur: number;
    critere: number;
    note_sur_5: number;
    commentaire?: string;
  }) => {
    if (payload.id) {
      const { id, ...rest } = payload;
      return httpClient.patch<EvaluationTechnique>(`/notes-techniques/${id}/`, rest);
    }
    return httpClient.post<EvaluationTechnique>("/notes-techniques/", payload);
  },
};