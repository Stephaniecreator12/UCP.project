import { API_BASE_URL } from "./api";

export const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
};

const refreshAccessToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) return null;

  const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) return null;
  const data = (await response.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const newAccess = typeof data?.access === "string" ? data.access : null;
  if (!newAccess) return null;

  localStorage.setItem("access_token", newAccess);
  return newAccess;
};

const fetchWithAuthRetry = async (
  url: string,
  init: RequestInit,
): Promise<Response> => {
  const token = getToken();
  const headers = {
    ...(init.headers ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  } as Record<string, string>;

  let response = await fetch(url, { ...init, headers });
  if (response.status === 401 || response.status === 403) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      const retryHeaders = {
        ...(init.headers ?? {}),
        Authorization: `Bearer ${newAccess}`,
      } as Record<string, string>;
      response = await fetch(url, { ...init, headers: retryHeaders });
    }
  }

  return response;
};

export type ProgressionStatut = "PAS_COMMENCE" | "EN_COURS" | "TERMINEE";
export type DeclarationConflit = "OUI" | "NON" | "";
export type RecommandationType = "ATTRIBUER" | "REJETER" | "RELANCER";

export interface DaoOffreItem {
  offre_id: number;
  ordre_passage: number;
  nom_soumissionnaire: string;
  montant_global: string;
  lot_numero?: string;
  nif_stat?: string;
  progression: ProgressionStatut;
  peut_saisir_financiere: boolean;
  blocage_financier: string;
  consensus_alerte: boolean;
  consensus_ecart: number;
}

export interface DaoOffresResponse {
  seance_id: number;
  reference_dossier: string;
  objet_dossier: string;
  date_seance?: string;
  offres: DaoOffreItem[];
}

export interface EvaluationDetail {
  id: number;
  offre: number;
  offre_detail: {
    id: number;
    seance_id: number;
    reference_dossier: string;
    objet_dossier: string;
    nom_soumissionnaire: string;
    montant_global: string;
    lot_numero?: string;
    nif_stat?: string;
    ordre_passage?: number;
  };
  evaluateur_nom_prenom: string;
  evaluateur_email: string;
  date_evaluation?: string;
  examen_preliminaire?: {
    offre_signee: boolean;
    garantie_conforme: boolean;
    dossier_admin_complet: boolean;
    validite_conforme: boolean;
    conditions_acceptees: boolean;
    commentaire?: string;
    est_conforme: boolean;
  };
  evaluation_technique?: {
    note_conformite_technique?: number;
    note_delai_livraison?: number;
    note_experience?: number;
    note_sav_garantie?: number;
    score_technique_total?: number;
    qualifie_technique: boolean;
  };
  evaluation_financiere?: {
    montant_lu?: number;
    corrections_arithmetiques?: number;
    rabais_accordes?: number;
    montant_evalue_final?: number;
    offre_moins_disante?: number;
    score_financier?: number;
  };
  conclusion?: {
    recommandation?: RecommandationType;
    justification?: string;
    declaration_conflit?: DeclarationConflit;
    signe_le?: string;
  };
  peut_saisir_technique: boolean;
  blocage_technique: string;
  peut_saisir_financiere: boolean;
  blocage_financier: string;
  evaluateurs_avancement: Array<{
    nom: string;
    examen_termine: boolean;
    technique_termine: boolean;
  }>;
  consensus_alerte: boolean;
  consensus_ecart: number;
  moins_disant_calcule?: string;
  score_final_individuel?: number;
  progression: ProgressionStatut;
  evaluateurs_seance: Array<{ nom: string; email: string; entite: string }>;
}

export interface SaveEvaluationPayload {
  examen?: {
    offre_signee?: boolean | null;
    garantie_conforme?: boolean | null;
    dossier_admin_complet?: boolean | null;
    validite_conforme?: boolean | null;
    conditions_acceptees?: boolean | null;
    commentaire?: string;
  };
  technique?: {
    note_conformite_technique?: number | null;
    note_delai_livraison?: number | null;
    note_experience?: number | null;
    note_sav_garantie?: number | null;
  };
  financiere?: {
    montant_lu?: number | null;
    corrections_arithmetiques?: number | null;
    rabais_accordes?: number | null;
  };
  conclusion?: {
    recommandation?: RecommandationType | null;
    justification?: string;
    declaration_conflit?: DeclarationConflit;
    password?: string;
  };
  email?: string;
  code?: string;
}

export interface ClassementLigne {
  offre_id: number;
  nom_soumissionnaire: string;
  score_technique: number | null;
  score_financier: number | null;
  score_total: number | null;
  rang: number | null;
  est_conforme: boolean | null;
  qualifie_technique: boolean;
  consensus_alerte: boolean;
}

export interface ClassementResponse {
  seance_id: number;
  reference_dossier: string;
  objet_dossier: string;
  classement_disponible: boolean;
  progression: string;
  lignes: ClassementLigne[];
}

export type StatutDao = "A_ASSIGNER" | "EN_EVALUATION" | "TERMINE";

export type StatutDashboard =
  | "A_ASSIGNER"
  | "EN_EVALUATION"
  | "CONSENSUS_REQUIS"
  | "NON_CONFORME"
  | "ELIMINEE"
  | "VALIDEE"
  | "REJETEE";

export interface DaoDashboardItem {
  seance_id: number;
  reference_dossier: string;
  objet_dossier: string;
  date_seance?: string;
  statut_dao: StatutDao;
  nb_offres: number;
  offres_terminees: number;
  evaluateurs_assignes: number;
}

export interface DaoOffreStatutDetail {
  offre_id: number;
  ordre_passage: number;
  nom_soumissionnaire: string;
  montant_global: string;
  lot_numero?: string;
  nif_stat?: string;
  evaluations_signees: number;
  evaluations_total: number;
  consensus_alerte: boolean;
  consensus_ecart: number;
  statut_synthese?: StatutDashboard | null;
  progression?: ProgressionStatut;
}

export interface DaoEvaluateurAssigne {
  id: number;
  nom: string;
  email: string;
  entite: string;
  poste: string;
  mdp_actif: boolean;
}

export interface OffreAssignationMeta {
  offre_id: number;
  lot_numero?: string;
  nif_stat?: string;
}

export interface DaoDetail {
  seance_id: number;
  reference_dossier: string;
  objet_dossier: string;
  date_seance?: string;
  lieu?: string;
  heure_seance?: string;
  observations?: string;
  secretaire_nom?: string;
  secretaire_email?: string;
  date_limite_soumission?: string;
  date_evaluation?: string;
  heure_evaluation?: string;
  statut_dao: StatutDao;
  nb_offres: number;
  offres_terminees: number;
  evaluateurs: DaoEvaluateurAssigne[];
  offres: DaoOffreStatutDetail[];
}

export interface OffreAssignation {
  offre_id: number;
  seance_id: number;
  reference_dossier: string;
  objet_dossier: string;
  statut_seance: string;
  statut_dashboard: StatutDashboard;
  consensus_alerte: boolean;
  ordre_passage: number;
  nom_soumissionnaire: string;
  montant_global: string;
  lot_numero?: string;
  nif_stat?: string;
  date_seance?: string;
  observations?: string;
  evaluateurs_assignes: Array<{
    id: number;
    evaluateur: number;
    evaluateur_nom_prenom: string;
    evaluateur_email: string;
    statut: string;
  }>;
}

export interface CommissionMemberPayload {
  nomPrenom: string;
  email: string;
  entite: string;
  poste: string;
  role?: string;
  cin: string;
}

export interface ExamenPreliminairePayload {
  email?: string;
  code?: string;
  offre_signee: boolean;
  garantie_conforme: boolean;
  dossier_admin_complet: boolean;
  validite_conforme: boolean;
  conditions_acceptees: boolean;
  commentaire?: string;
}

export interface EvaluationTechniquePayload {
  email?: string;
  code?: string;
  note_conformite_technique: number;
  note_delai_livraison: number;
  note_experience: number;
  note_sav_garantie: number;
}

export interface EvaluationFinancierePayload {
  email?: string;
  code?: string;
  montant_lu: number;
  corrections_arithmetiques?: number;
  rabais_accordes?: number;
  offre_moins_disante?: number;
}

export interface DecisionFinalePayload {
  email?: string;
  code?: string;
  recommandation: RecommandationType;
  justification: string;
  declaration_conflit: boolean;
  password?: string;
  classement?: number;
}

export interface AssignationPayload {
  evaluateur_ids?: number[];
  commission_members?: CommissionMemberPayload[];
  offres?: OffreAssignationMeta[];
  lot_numero?: string;
  nif_stat?: string;
  nom_soumissionnaire?: string;
  date_evaluation?: string;
  heure_evaluation?: string;
}

export interface EvaluationList {
  id: number;
  offre: number;
  seance_id: number;
  nom_soumissionnaire: string;
  reference_dossier: string;
  objet_dossier: string;
  statut: string;
  montant_global: string;
}

function flattenEvaluationDetail(data: Record<string, unknown>): EvaluationDetail {
  const offreDetail = (data.offre_detail ?? {}) as EvaluationDetail["offre_detail"];
  return {
    id: data.id as number,
    offre: data.offre as number,
    offre_detail: offreDetail,
    evaluateur_nom_prenom: (data.evaluateur_nom_prenom as string) || "",
    evaluateur_email: (data.evaluateur_email as string) || "",
    date_evaluation: data.date_evaluation as string | undefined,
    examen_preliminaire: data.examen_preliminaire as EvaluationDetail["examen_preliminaire"],
    evaluation_technique: data.evaluation_technique as EvaluationDetail["evaluation_technique"],
    evaluation_financiere: data.evaluation_financiere as EvaluationDetail["evaluation_financiere"],
    conclusion: data.conclusion as EvaluationDetail["conclusion"],
    peut_saisir_technique: Boolean(data.peut_saisir_technique ?? true),
    blocage_technique: (data.blocage_technique as string) || "",
    peut_saisir_financiere: Boolean(data.peut_saisir_financiere),
    blocage_financier: (data.blocage_financier as string) || "",
    evaluateurs_avancement:
      (data.evaluateurs_avancement as EvaluationDetail["evaluateurs_avancement"]) || [],
    consensus_alerte: Boolean(data.consensus_alerte),
    consensus_ecart: Number(data.consensus_ecart || 0),
    moins_disant_calcule: data.moins_disant_calcule as string | undefined,
    score_final_individuel: data.score_final_individuel as number | undefined,
    progression: (data.progression as ProgressionStatut) || "PAS_COMMENCE",
    evaluateurs_seance: (data.evaluateurs_seance as EvaluationDetail["evaluateurs_seance"]) || [],
  };
}

export async function fetchEvaluationList(): Promise<EvaluationList[]> {
  const res = await fetchWithAuthRetry(`${API_BASE_URL}/evaluation/`, {
    method: "GET",
  });
  if (!res.ok) throw new Error("Erreur lors de la récupération des évaluations");
  return res.json();
}

export async function fetchDaoOffres(seanceId: number): Promise<DaoOffresResponse> {
  const res = await fetchWithAuthRetry(
    `${API_BASE_URL}/evaluation/dao/${seanceId}/offres/`,
    { method: "GET" },
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Impossible de charger les offres du DAO");
  }
  return res.json();
}

export async function fetchClassement(seanceId: number): Promise<ClassementResponse> {
  const res = await fetchWithAuthRetry(
    `${API_BASE_URL}/evaluation/dao/${seanceId}/classement/`,
    { method: "GET" },
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Impossible de charger le classement");
  }
  return res.json();
}

export async function fetchEvaluationDetail(offreId: number): Promise<EvaluationDetail> {
  const res = await fetchWithAuthRetry(
    `${API_BASE_URL}/evaluation/${offreId}/`,
    { method: "GET" },
  );
  if (!res.ok) throw new Error("Erreur lors de la récupération du détail d'évaluation");
  const data = await res.json();
  return flattenEvaluationDetail(data);
}

export async function saveEvaluation(
  offreId: number,
  payload: SaveEvaluationPayload,
): Promise<EvaluationDetail> {
  const res = await fetchWithAuthRetry(
    `${API_BASE_URL}/evaluation/${offreId}/save/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Erreur lors de l'enregistrement");
  }
  const data = await res.json();
  return flattenEvaluationDetail(data);
}

export async function fetchAssignationList(): Promise<DaoDashboardItem[]> {
  const res = await fetchWithAuthRetry(
    `${API_BASE_URL}/evaluation/assignations/`,
    { method: "GET" },
  );
  if (!res.ok) throw new Error("Erreur lors de la récupération du tableau de bord");
  return res.json();
}

export async function fetchDaoDashboard(): Promise<DaoDashboardItem[]> {
  const res = await fetchWithAuthRetry(
    `${API_BASE_URL}/evaluation/dao/dashboard/`,
    { method: "GET" },
  );
  if (!res.ok) throw new Error("Erreur lors de la récupération du tableau de bord");
  return res.json();
}

export async function fetchDaoDetail(seanceId: number): Promise<DaoDetail> {
  const res = await fetchWithAuthRetry(
    `${API_BASE_URL}/evaluation/dao/${seanceId}/detail/`,
    { method: "GET" },
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Impossible de charger le détail du DAO");
  }
  return res.json();
}

export async function assignDaoEvaluators(
  seanceId: number,
  payload: AssignationPayload,
): Promise<{ detail: string }> {
  const res = await fetchWithAuthRetry(
    `${API_BASE_URL}/evaluation/dao/${seanceId}/assigner/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Erreur lors de l'assignation");
  }
  return res.json();
}

export async function loginEvaluationDao(
  email: string,
  password: string,
  seanceId?: number,
): Promise<{ seance_id: number; email: string }> {
  const res = await fetch(`${API_BASE_URL}/evaluation/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.trim(),
      password: password.trim(),
      ...(seanceId ? { seance_id: seanceId } : {}),
    }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      (typeof error.detail === "string" ? error.detail : null) ||
        "Identifiants incorrects.",
    );
  }
  const data = (await res.json()) as {
    access: string;
    refresh: string;
    seance_id: number;
    email: string;
  };
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", data.access);
    localStorage.setItem("refresh_token", data.refresh);
  }
  return { seance_id: data.seance_id, email: data.email };
}

export async function verifyEvaluateurPassword(
  password: string,
  seanceId: number,
): Promise<void> {
  const res = await fetchWithAuthRetry(`${API_BASE_URL}/evaluation/auth/verify/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: password.trim(), seance_id: seanceId }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      (typeof error.password === "string" ? error.password : null) ||
        (typeof error.detail === "string" ? error.detail : null) ||
        "Mot de passe incorrect.",
    );
  }
}

/** @deprecated Utiliser saveEvaluation — conservé pour compatibilité */
export async function submitExamenPreliminaire(
  offreId: number,
  payload: ExamenPreliminairePayload,
): Promise<unknown> {
  const res = await fetchWithAuthRetry(
    `${API_BASE_URL}/evaluation/${offreId}/examen-preliminaire/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Erreur lors de la soumission");
  }
  return res.json();
}

/** @deprecated Utiliser saveEvaluation */
export async function submitEvaluationTechnique(
  offreId: number,
  payload: EvaluationTechniquePayload,
): Promise<unknown> {
  const res = await fetchWithAuthRetry(
    `${API_BASE_URL}/evaluation/${offreId}/technique/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Erreur lors de la soumission");
  }
  return res.json();
}

/** @deprecated Utiliser saveEvaluation */
export async function submitEvaluationFinanciere(
  offreId: number,
  payload: EvaluationFinancierePayload,
): Promise<unknown> {
  const res = await fetchWithAuthRetry(
    `${API_BASE_URL}/evaluation/${offreId}/financiere/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Erreur lors de la soumission");
  }
  return res.json();
}

/** @deprecated Utiliser saveEvaluation */
export async function submitDecisionFinale(
  offreId: number,
  payload: DecisionFinalePayload,
): Promise<unknown> {
  const res = await fetchWithAuthRetry(
    `${API_BASE_URL}/evaluation/${offreId}/consolider/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Erreur lors de la consolidation");
  }
  return res.json();
}

export async function accessEvaluationByCode(
  offreId: number,
  email: string,
  code: string,
): Promise<unknown> {
  const res = await fetch(`${API_BASE_URL}/evaluation/${offreId}/access/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || error.password || "Accès refusé");
  }
  return res.json();
}

export async function assignEvaluators(
  offreId: number,
  payload: AssignationPayload,
): Promise<{ detail: string }> {
  const res = await fetchWithAuthRetry(
    `${API_BASE_URL}/evaluation/${offreId}/assigner/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Erreur lors de l'assignation");
  }
  return res.json();
}
