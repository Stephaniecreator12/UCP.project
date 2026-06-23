import { httpClient } from "./httpClient";
import type { ExamenPreliminaire, PaginatedResponse } from "../../types/evaluations";

export type ExamenPreliminairePayload = Pick<
  ExamenPreliminaire,
  | "evaluation"
  | "offre_signee_personne_habilitee"
  | "garantie_soumission_conforme"
  | "dossier_administratif_complet"
  | "validite_offre_conforme"
  | "acceptation_conditions_sans_reserve"
  | "commentaire"
>;

export const examenPreliminaireService = {
  getByEvaluation: async (evaluationId: number) => {
    const data = await httpClient.get<PaginatedResponse<ExamenPreliminaire>>(
      `/examens-preliminaires/?evaluation=${evaluationId}`
    );
    return data.results[0] ?? null;
  },

  create: (payload: ExamenPreliminairePayload) =>
    httpClient.post<ExamenPreliminaire>("/examens-preliminaires/", payload),

  update: (id: number, payload: Partial<Omit<ExamenPreliminairePayload, "evaluation">>) =>
    httpClient.patch<ExamenPreliminaire>(`/examens-preliminaires/${id}/`, payload),
};