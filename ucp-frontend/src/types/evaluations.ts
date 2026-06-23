export type StatutEvaluation =
  | "EN_COURS"
  | "ELIMINE_PRELIMINAIRE"
  | "ELIMINE_TECHNIQUE"
  | "CONSENSUS_REQUIS"
  | "QUALIFIE_FINANCIER"
  | "FINALISE";

export type RoleEvaluateur = "EVALUATEUR_1" | "EVALUATEUR_2" | "EVALUATEUR_3";

export type RecommandationFinale = "ATTRIBUER" | "REJETER" | "RELANCER";

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Soumissionnaire {
  id: number;
  nom: string;
  nif_stat: string | null;
  created_at: string;
}

export interface EvaluationConfig {
  id: number;
  marche: number;
  seuil_elimination_technique: number;
  poids_technique: number;
  poids_financier: number;
  seuil_ecart_consensus: number;
  nombre_validateurs_requis_double_aveugle: number;
}

export interface CritereTechnique {
  id: number;
  marche: number;
  libelle: string;
  ponderation: number;
  ordre: number;
  actif: boolean;
}

export interface EvaluationHeader {
  id: number;
  marche: number;
  soumissionnaire: number;
  lot_numero: string | null;
  statut: StatutEvaluation;
  cree_par_external_id: string;
  cree_par_label: string;
  created_at: string;
  updated_at: string;
  bloquer_etape_suivante: boolean;
  financier_deverrouille: boolean;
  nombre_evaluateurs_ayant_valide_technique: number;
}

export interface ExamenPreliminaire {
  id: number;
  evaluation: number;
  offre_signee_personne_habilitee: boolean | null;
  garantie_soumission_conforme: boolean | null;
  dossier_administratif_complet: boolean | null;
  validite_offre_conforme: boolean | null;
  acceptation_conditions_sans_reserve: boolean | null;
  commentaire: string;
  is_conforme: boolean | null;
  evalue_par_external_id: string;
  evalue_par_label: string;
  evalue_le: string | null;
}

export interface Evaluateur {
  id: number;
  evaluation: number;
  role: RoleEvaluateur;
  external_user_id: string;
  nom_affiche: string;
  score_technique_total: string | null;
  a_valide_score_technique: boolean;
  a_signe: boolean;
  date_signature: string | null;
  signature_hash: string;
}

export interface EvaluationTechnique {
  id: number;
  evaluation: number;
  evaluateur: number;
  critere: number;
  note_sur_5: string;
  note_sur_100: string;
  note_ponderee: string;
  commentaire: string;
}

export interface EvaluationFinanciere {
  id: number;
  evaluation: number;
  montant_lu: string;
  corrections_arithmetiques: string;
  rabais_accordes: string;
  montant_evalue_final: string;
  montant_moins_disant: string;
  score_financier: string | null;
  saisi_par_external_id: string;
  saisi_par_label: string;
  saisi_le: string;
}

export interface ScoreConsolide {
  id: number;
  evaluation: number;
  soumissionnaire: string;
  score_technique: string | null;
  score_financier: string | null;
  poids_technique: number;
  poids_financier: number;
  score_total: string | null;
  rang: number | null;
  calcule_le: string | null;
}

export interface EvaluationDecision {
  id: number;
  evaluation: number;
  recommandation: RecommandationFinale;
  justification: string;
  declaration_absence_conflit_interet: boolean;
  decide_par_external_id: string;
  decide_par_label: string;
  decide_le: string;
}

export interface AuditTrail {
  id: number;
  content_type: number;
  content_type_label: string;
  object_id: number;
  action: "CREATE" | "UPDATE" | "DELETE";
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  external_user_id: string;
  external_user_label: string;
  timestamp: string;
}

export interface EvaluationHeaderDetail extends EvaluationHeader {
  examen_preliminaire: ExamenPreliminaire | null;
  evaluateurs: Evaluateur[];
  evaluation_financiere: EvaluationFinanciere | null;
  score_consolide: ScoreConsolide | null;
  decision: EvaluationDecision | null;
}