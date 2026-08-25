export type StatutEvaluation =
  | "EN_COURS"
  | "CONSENSUS_REQUIS"
  | "COMPLETE"
  | "ELIMINEE";

export type RecommandationEvaluation = "ATTRIBUER" | "REJETER" | "RELANCER";

export type EvaluateurIdentityPayload = {
  nomPrenom: string;
  email: string;
  entite: string;
  poste: string;
  cin: string;
};

export type SimpleEvaluateur = {
  id: number;
  username: string;
  email: string;
  full_name: string;
};

export type ExamenPreliminaire = {
  id?: number;
  offre_signee: boolean;
  garantie_conforme: boolean;
  dossier_admin_complet: boolean;
  validite_conforme: boolean;
  conditions_acceptees: boolean;
  commentaire: string;
  est_conforme?: boolean;
};

export type EvaluationTechnique = {
  id?: number;
  score_technique_total?: string | number | null;
  qualifie_technique?: boolean;
  notes: Array<{
    id: number;
    critere_id: number;
    critere_nom: string;
    critere_ponderation: number;
    note: number;
    commentaire: string;
  }>;
};

export type EvaluationFinanciere = {
  id?: number;
  montant_lu: string | number | null;
  corrections_arithmetiques: string | number;
  rabais_accordes: string | number;
  montant_evalue_final?: string | number | null;
  offre_moins_disante: string | number | null;
  score_financier?: string | number | null;
};

export type DecisionFinale = {
  id: number;
  offre: number;
  score_technique_consolide: string | number | null;
  score_financier_consolide: string | number | null;
  score_final: string | number | null;
  classement: number | null;
  recommandation: RecommandationEvaluation | null;
  justification: string;
  declaration_conflit: "OUI" | "NON";
  created_at: string;
};

export type OffreEvaluationDetail = {
  id: number;
  seance_id: number;
  reference_dossier: string;
  objet_dossier: string;
  statut_seance: string;
  ordre_passage: number;
  nom_soumissionnaire: string;
  montant_global: string | number | null;
  observations: string;
};

export type EvaluationListItem = {
  id: number;
  offre: number;
  nom_soumissionnaire: string;
  reference_dossier: string;
  objet_dossier: string;
  montant_global: string | number | null;
  evaluateur_nom_prenom: string;
  evaluateur_email: string;
  evaluateur_entite: string;
  evaluateur_poste: string;
  evaluateur_numero_carte: string;
  statut: StatutEvaluation;
  date_evaluation: string;
};

export type EvaluationDetail = {
  id: number;
  offre: number;
  offre_detail: OffreEvaluationDetail;
  evaluateur: number;
  evaluateur_detail: SimpleEvaluateur;
  evaluateur_nom_prenom: string;
  evaluateur_email: string;
  evaluateur_entite: string;
  evaluateur_poste: string;
  evaluateur_numero_carte: string;
  statut: StatutEvaluation;
  date_evaluation: string;
  examen_preliminaire: ExamenPreliminaire | null;
  evaluation_technique: EvaluationTechnique | null;
  evaluation_financiere: EvaluationFinanciere | null;
  decision_finale: DecisionFinale | null;
  peut_saisir_financiere: boolean;
  blocage_financier: string;
  score_final_individuel: number | null;
  created_at: string;
  updated_at: string;
};

export type EvaluateurAssigne = {
  id: number;
  evaluateur: number;
  evaluateur_detail: SimpleEvaluateur;
  evaluateur_nom_prenom: string;
  evaluateur_email: string;
  evaluateur_entite: string;
  evaluateur_poste: string;
  evaluateur_numero_carte: string;
  statut: StatutEvaluation;
  date_evaluation: string;
  score_technique_total: string | number | null;
  score_financier: string | number | null;
};

export type OffreAssignation = {
  offre_id: number;
  seance_id: number;
  reference_dossier: string;
  objet_dossier: string;
  statut_seance: string;
  ordre_passage: number;
  nom_soumissionnaire: string;
  montant_global: string | number | null;
  observations: string;
  evaluateurs_assignes: EvaluateurAssigne[];
};

export type AssignEvaluateursPayload = {
  commission_members: EvaluateurIdentityPayload[];
};

export type ConclusionPayload = {
  recommandation: RecommandationEvaluation;
  justification: string;
  declaration_conflit: "OUI" | "NON";
  password: string;
};
