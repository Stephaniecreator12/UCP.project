export type OuvertureUser = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
};

export type MembreSeance = {
  id: number;
  utilisateur: number;
  utilisateur_detail: OuvertureUser;
  est_present: boolean;
  a_valide: boolean;
  commentaire: string;
  date_validation: string | null;
};

export type SeanceOuverture = {
  id: number;
  reference_dossier: string;
  objet_dossier: string;
  date_seance: string | null;
  heure_seance: string | null;
  lieu: string;
  observations: string;
  statut: "BROUILLON" | "EN_SAISIE" | "A_VALIDER" | "VALIDEE";
  secretaire: number;
  secretaire_detail: OuvertureUser;
  president: number | null;
  president_detail: OuvertureUser | null;
  membres: MembreSeance[];
  created_at: string;
  updated_at: string;
  president_a_valide: boolean;
  president_commentaire: string;
  date_validation_president: string | null;
};

export type CreateSeancePayload = {
  reference_dossier: string;
  objet_dossier: string;
  statut?: "BROUILLON" | "EN_SAISIE" | "A_VALIDER" | "VALIDEE";
};

export type UpdateSeancePayload = {
  president?: number;
  date_seance?: string;
  heure_seance?: string;
  lieu?: string;
  observations?: string;
  membre_ids?: number[];
  statut?: "BROUILLON" | "EN_SAISIE" | "A_VALIDER" | "VALIDEE";
};

export type ValidationPayload = {
  commentaire?: string;
};
