// Types pour le module Contractualisation NOTI5

export type StatutContrat =
  | "BROUILLON"
  | "ATTENTE_SIGNATURE"
  | "EXECUTION"
  | "TERMINE"
  | "SUSPENDU"
  | "ANNULE";

export interface EcheancierLigne {
  id: number;
  montant: string;
  pourcentage: number;
  etape: string;
  date_prevue: string;
  statut: "EN_ATTENTE" | "FACTURE_RECUE" | "PAYE";
  created_at: string;
}

export interface DocumentContrat {
  id: number;
  type_document: "CONTRAT_SIGNE" | "AVENANT";
  fichier: string | null;
  hash_sha256: string;
  date_upload: string;
}

export interface AuditTrailEntry {
  id: number;
  action: string;
  action_label: string;
  utilisateur: number;
  utilisateur_nom: string;
  timestamp: string;
  description: string;
  ancienne_valeur: string;
  nouvelle_valeur: string;
  champ_modifie: string;
  ip_adresse: string | null;
  navigateur: string;
}

export interface Contrat {
  id: number;
  numero_marche: string;
  statut: StatutContrat;
  statut_label: string;
  seance_reference: string;
  seance_objet: string;
  offre_soumissionnaire: string;
  nom_prestataire: string;
  email_prestataire: string;
  telephone_prestataire: string;
  nif_prestataire: string;
  stat_prestataire: string;
  representant_signataire: string;
  montant_ttc: string;
  date_signature: string | null;
  duree_execution: string;
  clauses_particulieres: string;
  created_by_username: string;
  created_at: string;
  updated_at: string;
  echeancier: EcheancierLigne[];
  documents: DocumentContrat[];
  audit_trail: AuditTrailEntry[];
}

export interface ContratList {
  id: number;
  numero_marche: string;
  seance_reference: string;
  offre_soumissionnaire: string;
  statut: StatutContrat;
  statut_label: string;
  montant_ttc: string;
  created_at: string;
  updated_at: string;
}

export interface CreateContratPayload {
  seance_id: number;
  offre_id: number;
}

export interface UpdateContratPayload {
  email_prestataire?: string;
  telephone_prestataire?: string;
  representant_signataire?: string;
  date_signature?: string;
  duree_execution?: string;
  clauses_particulieres?: string;
}

export interface AjouterEcheancierPayload {
  montant: string;
  pourcentage: number;
  etape: string;
  date_prevue: string;
}
