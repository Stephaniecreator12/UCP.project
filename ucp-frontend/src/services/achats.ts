import { getToken, logout } from "./auth";

export type StatutDemande =
  | "BROUILLON"
  | "SOUMISE"
  | "A_COMPLETER"
  | "VALIDEE"
  | "EN_COMMANDE"
  | "EN_LIVRAISON"
  | "LIVREE"
  | "CLOTUREE"
  | "REJETEE";

export type EtapeValidation =
  | "HIERARCHIQUE"
  | "TECHNIQUE"
  | "BUDGETAIRE"
  | "PROGRAMMATIQUE"
  | "APPROBATION_FINALE"
  | "TERMINEE";

export type DecisionValidation =
  | "FAVORABLE"
  | "DEFAVORABLE"
  | "A_COMPLETER"
  | "APPROUVEE"
  | "REJETEE"
  | "A_REVOIR";

export interface LigneBesoin {
  id?: number;
  ordre?: number;
  designation?: string;
  marque_modele?: string;
  caracteristiques_techniques?: string;
  quantite?: number | null;
  unite?: string;
  prix_unitaire_estime?: string;
  cout_total_estime?: string;
  lieu_livraison?: string;
  destinataire_final?: string;
  type_service?: string;
  description_service?: string;
  date_debut?: string | null;
  date_fin?: string | null;
  duree_estimee?: string;
  lieu_execution?: string;
  livrables_attendus?: string;
  nombre_beneficiaires?: number | null;
  quantite_recue?: number | null;
  observation_reception?: string;
}

export interface DocumentDemande {
  id?: number;
  type_document: string;
  fichier?: string | null;
  commentaire?: string;
  uploaded_at?: string;
}

export interface ValidationDemandeItem {
  id: number;
  etape: EtapeValidation;
  etape_label: string;
  decision: DecisionValidation;
  decision_label: string;
  commentaire?: string;
  donnees_etape: Record<string, unknown>;
  created_at: string;
  validateur_username?: string;
  validateur_nom?: string;
  signature_electronique?: string;
}

export interface HistoriqueDemandeItem {
  id: number;
  action: string;
  action_label: string;
  description?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  user_username?: string;
  user_nom?: string;
}

export interface DemandeAchat {
  id: number;
  numero_demande: string;
  version: number;
  demandeur: number;
  unite_technique: string;
  statut: StatutDemande;
  etape_validation_actuelle: EtapeValidation;
  categorie_besoin: string;
  type_demande: string;
  priorite: string;
  objet: string;
  justification: string;
  lien_ptba: string;
  service_beneficiaire: string;
  ligne_budgetaire: string;
  source_financement: string;
  numero_subvention?: string;
  solde_disponible_ligne_budgetaire?: string | null;
  numero_engagement_budgetaire?: string;
  solde_apres_engagement?: string | null;
  cout_total_estime: string;
  type_procedure?: string;
  fournisseur_retenu?: string;
  numero_bon_commande?: string;
  date_bon_commande?: string | null;
  montant_commande?: string | null;
  delai_livraison_contractuel?: number | null;
  date_livraison_prevue?: string | null;
  conditions_livraison?: string;
  garantie?: string;
  date_arrivee_prevue?: string | null;
  date_arrivee_effective?: string | null;
  etat_expedition?: string;
  date_reception?: string | null;
  receptionnaire?: string;
  conformite_quantite?: string;
  conformite_qualite?: string;
  observations_reception?: string;
  statut_reception?: string;
  type_ecart?: string;
  description_ecart?: string;
  action_corrective?: string;
  date_resolution?: string | null;
  suivi_resolution?: string;
  statut_final?: string;
  date_cloture?: string | null;
  niveau_satisfaction?: number | null;
  commentaires_finaux?: string;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  lignes_besoin: LigneBesoin[];
  documents: DocumentDemande[];
  validations: ValidationDemandeItem[];
  historiques: HistoriqueDemandeItem[];
}

export interface CreateDemandePayload {
  unite_technique: string;
  categorie_besoin: string;
  type_demande: string;
  priorite: string;
  objet: string;
  justification: string;
  lien_ptba: string;
  service_beneficiaire: string;
  ligne_budgetaire: string;
  source_financement: string;
  lignes_besoin: LigneBesoin[];
  documents?: DocumentDemande[];
}

export interface IssueOrderPayload {
  type_procedure: "DEMANDE_COTATION" | "BON_COMMANDE_DIRECT" | "SELECTION_APRES_COTATION";
  fournisseur_retenu: string;
  montant_commande: string;
  delai_livraison_contractuel: number;
  conditions_livraison?: string;
  garantie?: string;
  date_bon_commande?: string;
}

export interface UpdateDeliveryPayload {
  date_arrivee_prevue?: string;
  date_arrivee_effective?: string;
  etat_expedition: "EN_TRANSIT" | "ARRIVE" | "PARTIEL" | "RETARD";
}

export interface ReceptionLignePayload {
  ligne_id: number;
  quantite_recue: number;
  observation_reception?: string;
}

export interface ReceiveDemandePayload {
  date_reception?: string;
  receptionnaire: string;
  conformite_quantite: "CONFORME" | "NON_CONFORME" | "PARTIELLE";
  conformite_qualite: "CONFORME" | "NON_CONFORME" | "DEFECTUEUX";
  observations_reception?: string;
  statut_reception: "EN_ATTENTE" | "RECEPTION_PARTIELLE" | "RECEPTION_COMPLETE";
  type_ecart?: "MANQUANT" | "DEFECTUEUX" | "NON_CONFORME" | "HORS_SPECIFICATIONS";
  description_ecart?: string;
  action_corrective?: "REMPLACEMENT" | "REPARATION" | "AVOIR" | "REJET";
  date_resolution?: string;
  suivi_resolution?: string;
  lignes?: ReceptionLignePayload[];
}

export interface CloseDemandePayload {
  statut_final: "CLOTURE" | "PARTIELLEMENT_EXECUTE" | "ANNULE";
  niveau_satisfaction: number;
  commentaires_finaux?: string;
  date_cloture?: string;
}

const handleUnauthorized = (): never => {
  logout();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
  throw new Error("Session expirée. Reconnecte-toi.");
};

const apiFetch = async <T>(
  path: string,
  init: RequestInit = {},
): Promise<T> => {
  const token = getToken();
  const headers = new Headers(init.headers);
  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;

  if (init.body && !headers.has("Content-Type") && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(path, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "Impossible de joindre le serveur. Vérifie que le backend et le frontend sont bien lancés.",
    );
  }

  if (response.status === 401 || response.status === 403) {
    handleUnauthorized();
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail =
      typeof data === "object" && data !== null
        ? ((data as { detail?: unknown; error?: unknown }).detail ??
          (data as { detail?: unknown; error?: unknown }).error ??
          JSON.stringify(data))
        : "Erreur API";

    throw new Error(String(detail));
  }

  return data as T;
};

export const listMesDemandesAchat = () =>
  apiFetch<DemandeAchat[]>("/api/achats/demandes/", { method: "GET" });

export const getDemandeAchat = (id: number) =>
  apiFetch<DemandeAchat>(`/api/achats/demandes/${id}/`, { method: "GET" });

export const createDemandeAchat = (payload: CreateDemandePayload) =>
  apiFetch<DemandeAchat>("/api/achats/demandes/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const uploadDocumentDemandeAchat = (id: number, payload: FormData) =>
  apiFetch<DocumentDemande>(`/api/achats/demandes/${id}/documents/`, {
    method: "POST",
    body: payload,
  });

export const submitDemandeAchat = (id: number) =>
  apiFetch<DemandeAchat>(`/api/achats/demandes/${id}/submit/`, {
    method: "POST",
    body: JSON.stringify({}),
  });

export const listDemandesEnAttenteValidation = () =>
  apiFetch<DemandeAchat[]>("/api/achats/validations/pending/", {
    method: "GET",
  });

export const listDemandesPassation = () =>
  apiFetch<DemandeAchat[]>("/api/achats/passation/pending/", {
    method: "GET",
  });

export const validateDemandeAchat = (
  id: number,
  payload: {
    decision: DecisionValidation;
    commentaire?: string;
    donnees_etape?: Record<string, unknown>;
  },
) =>
  apiFetch<DemandeAchat>(`/api/achats/demandes/${id}/validate/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const issueOrderDemandeAchat = (id: number, payload: IssueOrderPayload) =>
  apiFetch<DemandeAchat>(`/api/achats/demandes/${id}/issue-order/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateDeliveryDemandeAchat = (
  id: number,
  payload: UpdateDeliveryPayload,
) =>
  apiFetch<DemandeAchat>(`/api/achats/demandes/${id}/delivery/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const receiveDemandeAchat = (id: number, payload: ReceiveDemandePayload) =>
  apiFetch<DemandeAchat>(`/api/achats/demandes/${id}/receive/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const closeDemandeAchat = (id: number, payload: CloseDemandePayload) =>
  apiFetch<DemandeAchat>(`/api/achats/demandes/${id}/close/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
