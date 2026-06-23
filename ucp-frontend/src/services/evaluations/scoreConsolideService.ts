import { httpClient } from "./httpClient";
import type { PaginatedResponse, ScoreConsolide } from "../../types/evaluations";

export const scoreConsolideService = {
  listByMarche: (marcheId: number) =>
    httpClient.get<PaginatedResponse<ScoreConsolide>>(
      `/scores-consolides/?evaluation__marche=${marcheId}`
    ),

  get: (id: number) => httpClient.get<ScoreConsolide>(`/scores-consolides/${id}/`),

  // Recalcule le score total de cette évaluation puis le classement de l'AO.
  consolider: (id: number) =>
    httpClient.post<ScoreConsolide>(`/scores-consolides/${id}/consolider/`),
};