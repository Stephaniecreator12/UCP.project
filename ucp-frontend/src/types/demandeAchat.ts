export type TypeMarche = "Biens" | "Services" | "Travaux";
export type NatureActivite =
  | "Formation / Atelier"
  | "Réunion / Séminaire"
  | "Mission de supervision / Suivi-évaluation"
  | "Revue"
  | "Construction / Réhabilitation"
  | "Autre";
export type SourceFinancementOption =
  | "Fonds Mondial"
  | "Gavi"
  | "Banque mondiale"
  | "Budget Etat (Contrepartie)"
  | "Autre";

export type StatutDemande =
  | "Brouillon"
  | "Soumise"
  | "Validée Budget"
  | "Validée Direction"
  | "Rejetée"
  | "Transmise aux Marchés";

export interface DemandeAchat {
  numero_demande: string;
  date_demande: string;
  service_demandeur: string;
  nom_demandeur: string;
  fonction_demandeur: string;
  activite_ptba: string;
  sous_activite_ptba: string;
  indicateur_performance: string;
  source_financement: SourceFinancementOption[];
  source_financement_subvention_fm: string;
  source_financement_projet_bm: string;
  source_financement_autre: string;
  ligne_budgetaire: string;
  budget_estime: string;
  devise: string;
  type_marche: TypeMarche | "";
  nature_activite: NatureActivite | "";
  nature_activite_autre: string;
  intitule_demande: string;
  description_detaillee: string;
  region_district: string;
  adresse_precise: string;
  date_debut_souhaitee: string;
  date_fin_souhaitee: string;
  urgent: boolean;
  justification_urgence: string;
  statut: StatutDemande;
  validateur1_nom: string;
  validateur1_date: string;
  validateur1_decision: "Approuvé" | "Rejeté" | "";
  validateur1_commentaire: string;
  validateur2_nom: string;
  validateur2_date: string;
  validateur2_fonds: "Fonds disponibles" | "Fonds insuffisants" | "";
  validateur2_visa: string;
  validateur3_nom: string;
  validateur3_date: string;
  validateur3_visa: string;
  date_transmission_marches: string;
}
