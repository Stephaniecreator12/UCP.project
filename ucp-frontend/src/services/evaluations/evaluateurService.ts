import { httpClient } from "./httpClient";
import type { Evaluateur, PaginatedResponse, RoleEvaluateur } from "../../types/evaluations";

export const evaluateurService = {
  listByEvaluation: (evaluationId: number) =>
    httpClient.get<PaginatedResponse<Evaluateur>>(
      `/evaluateurs/?evaluation=${evaluationId}`
    ),

  create: (payload: {
    evaluation: number;
    role: RoleEvaluateur;
    external_user_id: string;
    nom_affiche: string;
  }) => httpClient.post<Evaluateur>("/evaluateurs/", payload),

  // Confirmation explicite : recalcule le score puis vérifie le consensus
  // éval1/éval2 côté backend.
  validerScoreTechnique: (evaluateurId: number) =>
    httpClient.post<Evaluateur>(`/evaluateurs/${evaluateurId}/valider-score-technique/`),
};