import type { ProcurementMarket } from "./procurement";

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
  nom_prenom: string;
  numero_carte: string;
  intitule: string;
  poste: string;
  est_present: boolean;
  a_valide: boolean;
  decision: "EN_ATTENTE" | "VALIDEE" | "REJETEE";
  commentaire: string;
  date_validation: string | null;
  ip_adresse?: string | null;
  navigateur?: string;
};

export type OffreOuverture = {
  id: number;
  ordre_passage: number;
  nom_soumissionnaire: string;
  pli_existe: boolean;
  motif_absence_pli: string;
  date_reception_pli: string | null;
  heure_reception_pli: string | null;
  enveloppe_administrative: "" | "DEPOSEE" | "MANQUANTE" | "RECU" | "INTEGRE" | "MANQUANT";
  enveloppe_technique: "" | "DEPOSEE" | "MANQUANTE" | "RECU" | "INTEGRE" | "MANQUANT";
  enveloppe_financiere: "" | "DEPOSEE" | "MANQUANTE" | "RECU" | "INTEGRE" | "MANQUANT";
  montant_global: string | number | null;
  observations: string;
};

export type SeanceStatut =
  | "BROUILLON"
  | "EN_SAISIE"
  | "A_VALIDER"
  | "EN_VALIDATION_MEMBRES"
  | "EN_VALIDATION_PRESIDENT"
  | "VALIDEE"
  | "REJETEE";

export type PVDocument = {
  id: number;
  fichier: string;
  version: number;
  hash_document: string;
  created_at: string;
};

export type SeanceOuverture = {
  id: number;
  reference_dossier: string;
  objet_dossier: string;
  date_seance: string | null;
  heure_seance: string | null;
  lieu: string;
  observations: string;
  statut: SeanceStatut;
  secretaire: number;
  secretaire_detail: OuvertureUser;
  president: number | null;
  president_detail: OuvertureUser | null;
  membres: MembreSeance[];
  created_at: string;
  updated_at: string;
  president_a_valide: boolean;
  president_decision: "EN_ATTENTE" | "VALIDEE" | "REJETEE" | "REPORTEE";
  president_commentaire: string;
  date_validation_president: string | null;
  president_ip_adresse?: string | null;
  president_navigateur?: string;
  etape_ouverture: "COMPLETE" | "ADMIN_TECH";
  etat_scelle: "" | "INTACT" | "ALTERE" | "ABSENT";
  presence_rature: boolean;
  description_rature: string;
  document_substitution_present: boolean;
  offres: OffreOuverture[];
  pv_document: PVDocument | null;
};

export type CreateSeancePayload = {
  reference_dossier: string;
  objet_dossier: string;
  statut?: SeanceStatut;
  commission_members?: CommissionMemberPayload[];
};

export type CommissionMemberPayload = {
  nomPrenom: string;
  email: string;
  cin: string;
  poste: string;
  entite: string;
};

export type UpdateSeancePayload = {
  reference_dossier?: string;
  objet_dossier?: string;
  president?: number | null;
  date_seance?: string | null;
  heure_seance?: string | null;
  lieu?: string;
  observations?: string;
  etape_ouverture?: "COMPLETE" | "ADMIN_TECH";
  etat_scelle?: "" | "INTACT" | "ALTERE" | "ABSENT";
  presence_rature?: boolean;
  description_rature?: string;
  document_substitution_present?: boolean;
  membre_ids?: number[];
  commission_members?: CommissionMemberPayload[];
  offres?: Omit<OffreOuverture, "id">[];
  statut?: SeanceStatut;
};

export type ValidationPayload = {
  commentaire?: string;
  password?: string;
};

export type PublicValidationRole = "membre" | "president";

export type PublicValidationDecision =
  | "VALIDER"
  | "APPROUVER"
  | "REJETER"
  | "REPORTER";

export type PublicValidationContext = {
  role: PublicValidationRole;
  participant: {
    id: number;
    full_name: string;
    email: string;
  };
  actions: PublicValidationDecision[];
  seance: SeanceOuverture;
  market?: ProcurementMarket | null;
};

export type PublicValidationAccessPayload = {
  role: PublicValidationRole;
  email: string;
  password: string;
};

export type PublicValidationDecisionPayload = PublicValidationAccessPayload & {
  decision: PublicValidationDecision;
  commentaire?: string;
  date_report?: string | null;
};
