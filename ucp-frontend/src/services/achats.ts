import { getToken, logout } from "./auth";

export type StatutDemande =
  | "BROUILLON"
  | "SOUMISE"
  | "A_COMPLETER"
  | "VALIDEE"
  | "VALIDEE_BUDGETAIRE"
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
  demandeur_nom?: string;
  demandeur_group?: string;
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
  ligne_budgetaire?: string;
  source_financement?: string;
  numero_subvention?: string;
  solde_disponible_ligne_budgetaire?: string;
  lignes_besoin: LigneBesoin[];
  documents?: DocumentDemande[];
}

export type UpdateDemandePayload = Partial<CreateDemandePayload>;
export interface BudgetEstimationPayload {
  ligne_budgetaire: string;
  source_financement: "FONDS_MONDIAL" | "BANQUE_MONDIALE" | "GAVI";
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
  type_ecart?: "MANQUANT" | "DEFECTUEUX" | "NON_CONFORME" | "HORS_SPECIFICATIONS";
  description_ecart?: string;
  action_corrective?: "REMPLACEMENT" | "AVOIR" | "REJET" | "REPARATION";
  lignes?: ReceptionLignePayload[];
}

export interface ResolveReceptionIssuePayload {
  date_resolution?: string;
  suivi_resolution: string;
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

const errorFieldLabels: Record<string, string> = {
  action_corrective: "Action corrective",
  categorie_besoin: "Categorie de besoin",
  conformite_qualite: "Conformite qualite",
  conformite_quantite: "Conformite quantite",
  date_arrivee_effective: "Date d'arrivee effective",
  date_arrivee_prevue: "Date d'arrivee prevue",
  date_bon_commande: "Date du bon de commande",
  date_cloture: "Date de cloture",
  date_debut: "Date de debut",
  date_fin: "Date de fin",
  date_livraison_prevue: "Date de livraison prevue",
  date_reception: "Date de reception",
  date_resolution: "Date de resolution",
  delai_livraison_contractuel: "Delai de livraison",
  description_ecart: "Description de l'ecart",
  description_service: "Description du service",
  destinataire_final: "Destinataire final",
  etat_expedition: "Etat d'expedition",
  justification: "Justification",
  lien_ptba: "Reference PTBA",
  ligne_budgetaire: "Ligne budgetaire",
  lignes: "Lignes",
  lignes_besoin: "Lignes de besoin",
  lieu_execution: "Lieu d'execution",
  lieu_livraison: "Lieu de livraison",
  livrables_attendus: "Livrables attendus",
  montant_commande: "Montant commande",
  nombre_beneficiaires: "Nombre de beneficiaires",
  numero_bon_commande: "Numero du bon de commande",
  numero_engagement_budgetaire: "Numero d'engagement budgetaire",
  numero_subvention: "Numero de subvention",
  objet: "Objet",
  observations_reception: "Observations de reception",
  prix_unitaire_estime: "Cout estime",
  priorite: "Priorite",
  quantite: "Quantite",
  quantite_recue: "Quantite recue",
  receptionnaire: "Receptionnaire",
  service_beneficiaire: "Service beneficiaire",
  solde_apres_engagement: "Solde apres engagement",
  solde_disponible_ligne_budgetaire: "Solde disponible",
  source_financement: "Source de financement",
  statut_final: "Statut final",
  statut_reception: "Statut de reception",
  type_demande: "Type de demande",
  type_ecart: "Type d'ecart",
  type_procedure: "Type de procedure",
  type_service: "Type de service",
  unite: "Unite",
  unite_technique: "Unite technique",
};

const translateApiMessage = (message: string) => {
  const trimmed = message.trim();

  if (!trimmed) {
    return "Une erreur est survenue.";
  }

  if (/^".+" is not a valid choice\.$/.test(trimmed)) {
    return "Selectionnez une valeur valide.";
  }

  if (
    trimmed ===
    "Date has wrong format. Use one of these formats instead: YYYY-MM-DD."
  ) {
    return "Utilisez le format AAAA-MM-JJ.";
  }

  if (trimmed === "A valid integer is required.") {
    return "Saisissez un nombre entier valide.";
  }

  if (trimmed === "A valid number is required.") {
    return "Saisissez un nombre valide.";
  }

  if (trimmed === "This field is required.") {
    return "Ce champ est obligatoire.";
  }

  if (trimmed === "This field may not be blank.") {
    return "Ce champ ne peut pas etre vide.";
  }

  return trimmed;
};

const humanizeErrorField = (field: string) =>
  errorFieldLabels[field] ?? field.replace(/_/g, " ");

const collectApiErrorMessages = (
  value: unknown,
  path: string[] = [],
): string[] => {
  if (typeof value === "string") {
    const message = translateApiMessage(value);
    return path.length > 0 ? [`${path.join(" - ")}: ${message}`] : [message];
  }

  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === "string")) {
      const label = path.join(" - ");
      return value.flatMap((item) => {
        const message = translateApiMessage(String(item));
        return label ? [`${label}: ${message}`] : [message];
      });
    }

    return value.flatMap((item, index) => {
      const nextPath =
        path[path.length - 1] === errorFieldLabels.lignes_besoin
          ? [...path.slice(0, -1), `Ligne ${index + 1}`]
          : [...path, `Element ${index + 1}`];

      return collectApiErrorMessages(item, nextPath);
    });
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(
      ([field, nestedValue]) => {
        if ((field === "detail" || field === "error") && typeof nestedValue === "string") {
          return collectApiErrorMessages(nestedValue, path);
        }

        const nextPath =
          field === "lignes_besoin" && typeof nestedValue === "string"
            ? path
            : [...path, humanizeErrorField(field)];

        return collectApiErrorMessages(nestedValue, nextPath);
      },
    );
  }

  return [];
};

const formatApiError = (data: unknown) => {
  const messages = Array.from(new Set(collectApiErrorMessages(data)));

  if (messages.length > 0) {
    return messages.join("\n");
  }

  if (typeof data === "string" && data.trim()) {
    return translateApiMessage(data);
  }

  return "Erreur API";
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
    const detail = formatApiError(data);

    throw new Error(String(detail));
  }

  return data as T;
};

const apiFetchBlob = async (
  path: string,
  init: RequestInit = {},
): Promise<Blob> => {
  const token = getToken();
  const headers = new Headers(init.headers);

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

  if (!response.ok) {
    const errorPayload = await response
      .clone()
      .json()
      .catch(async () => await response.text().catch(() => ""));

    throw new Error(String(formatApiError(errorPayload)));
  }

  return await response.blob();
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

export const updateDemandeAchat = (id: number, payload: UpdateDemandePayload) =>
  apiFetch<DemandeAchat>(`/api/achats/demandes/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const resubmitDemandeAchat = (id: number) =>
  // Can reuse submit, or if backend expects something else, we use /submit/
  apiFetch<DemandeAchat>(`/api/achats/demandes/${id}/submit/`, {
    method: "POST",
    body: JSON.stringify({}),
  });

export const uploadDocumentDemandeAchat = (id: number, payload: FormData) =>
  apiFetch<DocumentDemande>(`/api/achats/demandes/${id}/documents/`, {
    method: "POST",
    body: payload,
  });

export const fetchDemandeDocumentBlob = (id: number) =>
  apiFetchBlob(`/api/achats/documents/${id}/file/`, {
    method: "GET",
  });

export const getDemandeAchatById = (id: number) =>
  apiFetch<DemandeAchat>(`/api/achats/demandes/${id}/`, {
    method: "GET",
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

export const listDemandesFinance = () =>
  apiFetch<DemandeAchat[]>("/api/achats/finance/pending/", {
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

export const budgetDemandeAchat = (id: number, payload: BudgetEstimationPayload) =>
  apiFetch<DemandeAchat>(`/api/achats/demandes/${id}/budget/`, {
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

export const resolveReceptionIssueDemandeAchat = (
  id: number,
  payload: ResolveReceptionIssuePayload,
) =>
  apiFetch<DemandeAchat>(`/api/achats/demandes/${id}/resolve-issue/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const closeDemandeAchat = (id: number, payload: CloseDemandePayload) =>
  apiFetch<DemandeAchat>(`/api/achats/demandes/${id}/close/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
