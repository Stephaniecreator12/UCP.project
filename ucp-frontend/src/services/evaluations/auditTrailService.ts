import { httpClient } from "./httpClient";
import type { AuditTrail, PaginatedResponse } from "../../types/evaluations";

export const auditTrailService = {
  listForObject: (contentType: string, objectId: number) =>
    httpClient.get<PaginatedResponse<AuditTrail>>(
      `/audit-trail/?content_type=${encodeURIComponent(contentType)}&object_id=${objectId}`
    ),
};