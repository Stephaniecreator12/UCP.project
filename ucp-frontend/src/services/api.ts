/**
 * Service API pour appeler le backend Django (backend_PPM)
 * Ce service gère désormais les 3 types de marchés : Travaux, Biens, Consultance
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const SESSION_EXPIRED_MESSAGE = "Session expirée. Connecte-toi puis réessaie.";

const clearSessionAndRedirectToLogin = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  window.location.href = "/login";
};

const throwSessionExpiredError = (): never => {
  clearSessionAndRedirectToLogin();
  throw new Error(SESSION_EXPIRED_MESSAGE);
};

// Interface commune pour un marché (Travaux, Biens ou Consultance)
// Note: Les champs peuvent varier légèrement entre les modèles Django,
// on garde ici une interface assez large qui couvre les besoins.
export interface Procurement {
  id?: number;
  // Type de marché pour aider le frontend à savoir quelle API appeler
  type?: "Travaux" | "Biens" | "Consultance";

  ref_number?: string; // Peut s'appeler num_ref dans certains modèles
  title?: string; // Peut s'appeler intitule_projet
  tracking_code?: string; // code_suivi
  estimated_amount?: number; // montant_estimatif

  // Champs communs
  method?: string; // mode
  approach?: string;
  status?: string;
  review_notes?: string;

  // Dates prévues (Planifié)
  date_invitation?: string;
  date_opening_submissions?: string;
  date_opening_financial?: string;
  date_contract_signed?: string;
  date_mission_end?: string;
  terms_of_reference?: string;
  ami?: string;
  restricted_list?: string;
  request_for_proposal?: string;
  invitation_date?: string;
  submissions_opening_date?: string;
  financial_opening_date?: string;
  contract_date?: string;
  mission_end_date?: string;

  // Dates réelles (Exécuté) - À adapter selon les nouveaux modèles
  // Les modèles semblent utiliser des tables séparées pour les détails prévus/réels
  // Pour l'instant on garde une structure souple
  [key: string]: unknown;
}

interface BackendListResponse {
  travaux?: BackendProcurementItem[];
  biens?: BackendProcurementItem[];
  consultance?: BackendProcurementItem[];
}

interface BackendProcurementItem {
  id?: number;
  code_suivi?: string;
  intitule?: string;
  montant_estimatif?: string | number;
  methode_pm?: string;
  methode_epm?: string;
  approches?: string;
  commentaire?: string;
  statut?: string;
  
  // Travaux & Biens - Dates prévues
  listesetspecifications_prevu?: string;
  dossiers_appel_prevu?: string;
  date_lancement_prevu?: string;
  date_ouverture_prevu?: string;
  rapport_evaluation_prevu?: string;
  date_signature_prevu?: string;
  date_livraison_prevu?: string;
  
  // Travaux & Biens - Dates réelles
  listesetspecifications_reel?: string;
  dossiers_appel_reel?: string;
  date_lancement_reel?: string;
  date_livraison_reel?: string;
  
  // Consultance - Dates prévues
  TdR_prevu?: string;
  ami_prevu?: string;
  liste_restreinte_prevu?: string;
  demande_proposition_prevu?: string;
  date_invitation_prevu?: string;
  ouverture_plis_prevu?: string;
  projet_contrat_prevu?: string;
  date_fin_prevu?: string;
  
  // Consultance - Dates réelles
  TdR_reel?: string;
  ami_reel?: string;
  liste_restreinte_reel?: string;
  demande_proposition_reel?: string;
  date_invitation_reel?: string;
  ouverture_plis_reel?: string;
  projet_contrat_reel?: string;
  date_fin_reel?: string;
  
  // champs communs
  date_ouverture_reel?: string;
  rapport_evaluation_reel?: string;
  date_signature_reel?: string;
  
  // Autres champs
  agmo?: string;
  agmoxdirection?: string;
  revue?: string;
  prevu?: string;
  reel?: string;
  forfaitxtemps?: string;
  methode?: string;
  approche?: string;
}

export interface PlanningResponse { 
  TdR_prevu?: string;
  ami_prevu?: string;
  demande_proposition_prevu?: string;
  dossiers_appel_prevu?: string;
  date_lancement_prevu?: string;
  date_ouverture_prevu?: string;
  ouverture_plis_prevu?: string;
  rapport_evaluation_prevu?: string;
  projet_contrat_prevu?: string;
  date_signature_prevu?: string;
  date_fin_prevu?: string;
  date_livraison_prevu?: string;
  date_invitation_prevu?: string;
  liste_restreinte_prevu?: string;
  listesetspecifications_prevu?: string;
  }

/**
 * Utilitaires pour mapper les URLs selon le type
 */
const getEndpoint = (type: "Travaux" | "Biens" | "Consultance") => {
  return `${API_BASE_URL}/api/${type}`;
};

const toDateValue = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v.length > 0 ? v : null;
};

/**
 * Récupérer TOUS les marchés (combine les 3 types)
 */
export async function getAllProcurements(): Promise<Procurement[]> {
  try {
    const urls = [
      `${API_BASE_URL}/api/Travaux/listTravaux/`,
      `${API_BASE_URL}/api/Biens/listBiens/`,
      `${API_BASE_URL}/api/Consultance/listConsultance/`,
    ];

    const responses = await Promise.all(
      urls.map(async (url): Promise<BackendListResponse> => {
        const res = await fetch(url, { cache: "no-store" }); // Ajout de no-store pour éviter les problèmes de cache
        const data = await res.json().catch(() => ({ travaux: [], biens: [], consultance: [] }));
        
        // 🔍 DEBUG - Voir ce que retourne chaque endpoint
        console.log(`Réponse de ${url}:`, data);
        
        return data;
      }),
    );

    const travauxList = responses[0].travaux || [];
    const biensList = responses[1].biens || [];
    const consultanceList = responses[2].consultance || [];

    // 🔍 DEBUG - Voir les données brutes
    console.log('Travaux bruts:', travauxList);
    console.log('Biens bruts:', biensList);
    console.log('Consultance bruts:', consultanceList);

    // Fonction de mapping pour transformer un item Backend en Procurement Frontend
  const mapItem = (
  item: BackendProcurementItem,
  type: "Travaux" | "Biens" | "Consultance",
   ): Procurement => {
  console.log(`Mapping item ${type}:`, item);

  const base: Procurement = {
    id: item.id,
    type,
    ref_number: item.code_suivi,
    title: item.intitule,
    tracking_code: item.code_suivi,
    estimated_amount: Number(item.montant_estimatif ?? 0),
    method: type === "Biens" ? item.methode_epm : (item.methode || item.methode_pm), // ← CORRECTION
    approach: item.approche || item.approches, // ← CORRECTION
    review_notes: item.commentaire,
    status: item.statut,
    agmo: item.agmo || item.agmoxdirection, // ← AJOUT
    pricing_type: item.forfaitxtemps, // ← AJOUT pour Consultance
  };

  if (type === "Consultance") {
    const mapped = {
      ...base,
      terms_of_reference: item.TdR_prevu,
      ami: item.ami_prevu,
      restricted_list: item.liste_restreinte_prevu,
      request_for_proposal: item.demande_proposition_prevu,
      invitation_date: item.date_invitation_prevu,
      submissions_opening_date: item.date_ouverture_prevu,
      technical_evaluation: item.rapport_evaluation_prevu,
      financial_opening_date: item.ouverture_plis_prevu,
      contract_draft: item.projet_contrat_prevu,
      contract_date: item.date_signature_prevu,
      mission_end_date: item.date_fin_prevu,
      // Dates réelles
      terms_of_reference_actual: item.TdR_reel,
      ami_actual: item.ami_reel,
      restricted_list_actual: item.liste_restreinte_reel,
      request_for_proposal_actual: item.demande_proposition_reel,
      invitation_date_actual: item.date_invitation_reel,
      submissions_opening_date_actual: item.date_ouverture_reel,
      technical_evaluation_actual: item.rapport_evaluation_reel,
      financial_opening_date_actual: item.ouverture_plis_reel,
      contract_draft_actual: item.projet_contrat_reel,
      contract_date_actual: item.date_signature_reel,
      mission_end_date_actual: item.date_fin_reel,
    };
    console.log('Mapped Consultance:', mapped);
    return mapped;
  }

// Pour Travaux et Biens
const mapped = {
  ...base,
  // Dates prévues
  specifications_date: item.listesetspecifications_prevu,
  tender_documents_date: item.dossiers_appel_prevu,
  launch_date: item.date_lancement_prevu,
  opening_date: item.date_ouverture_prevu,
  evaluation_report: item.rapport_evaluation_prevu,
  contract_date: item.date_signature_prevu,
  delivery_date: item.date_livraison_prevu,
  
  // Dates réelles
  specifications_date_actual: item.listesetspecifications_reel,
  tender_documents_date_actual: item.dossiers_appel_reel,
  launch_date_actual: item.date_lancement_reel,
  opening_date_actual: item.date_ouverture_reel,
  evaluation_report_actual: item.rapport_evaluation_reel,
  contract_date_actual: item.date_signature_reel,
  delivery_date_actual: item.date_livraison_reel,
  
  // Autres champs
  comments: item.commentaire,
  review_status: item.revue,
  prevu: item.prevu,
  reel: item.reel,
};
  console.log('Mapped Travaux/Biens:', mapped);
  return mapped;
};

    const travaux = travauxList.map((item) => mapItem(item, "Travaux"));
    const biens = biensList.map((item) => mapItem(item, "Biens"));
    const consultance = consultanceList.map((item) => mapItem(item, "Consultance"));

    return [...travaux, ...biens, ...consultance];
  } catch (error) {
    console.error("Erreur API:", error);
    return [];
  }
}

/**
 * Récupérer UN marché par son ID et son Type
 * Note: Il faut connaître le type pour savoir où chercher
 */
export async function getProcurementById(
  id: number,
  type?: "Travaux" | "Biens" | "Consultance",
): Promise<Procurement | null> {
  try {
    if (!type) {
      const all = await getAllProcurements();
      return all.find((item) => item.id === id) || null;
    }

    const endpoint = getEndpoint(type);
    // Note: Les URLs Django semblent être orientées action (list/add),
    // il faudra vérifier s'il existe une vue 'detail' standard : api/Travaux/{id}/
    // Si ce n'est pas le cas, on devra peut-être filtrer la liste.
    // Supposons pour l'instant une URL standard REST :
    const response = await fetch(`${endpoint}/${id}/`);

    if (!response.ok) throw new Error("Marché non trouvé");
    return (await response.json()) as Procurement;
  } catch (error) {
    console.error("Erreur API:", error);
    return null;
  }
}

/**
 * CRÉER un nouveau marché
 */
export async function createProcurement(
  data: Procurement,
): Promise<Procurement | null> {
  if (!data.type) {
    console.error("Type de marché manquant (Travaux, Biens, Consultance)");
    return null;
  }

  const payload = buildProcurementPayload(data);

  try {
    let endpoint = "";
    if (data.type === "Travaux")
      endpoint = `${API_BASE_URL}/api/Travaux/addTravaux/`;
    else if (data.type === "Biens")
      endpoint = `${API_BASE_URL}/api/Biens/addBiens/`;
    else if (data.type === "Consultance")
      endpoint = `${API_BASE_URL}/api/Consultance/addConsultance/`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error || "Erreur lors de la création du marché";
      console.error("Erreur API:", errorMessage);
      throw new Error(errorMessage);
    }

    const createdItem = await response.json();
    return { ...data, id: createdItem.id };
  } catch (error: unknown) {
    console.error("Erreur API:", error);
    throw error; // Propagate error
  }
}

/**
 * Construire le payload backend en fonction du type de marché
 */
function buildProcurementPayload(data: Procurement): Record<string, unknown> {
  const toBackendDate = (value: unknown): string | null => {
    if (value === null || value === undefined) return null;
    const raw = String(value).trim();
    if (!raw) return null;

    // Keep date part of full ISO timestamps.
    const datePart = raw.includes("T") ? raw.split("T")[0] : raw;

    // Normalize common human formats to YYYY-MM-DD.
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;
    if (/^\d{2}-\d{2}-\d{4}$/.test(datePart)) {
      const [day, month, year] = datePart.split("-");
      return `${year}-${month}-${day}`;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(datePart)) {
      const [day, month, year] = datePart.split("/");
      return `${year}-${month}-${day}`;
    }

    return null;
  };

  const dataExtras = data as unknown as Record<string, unknown>;

  const basePayload = {
    commentaire: data.review_notes || "",
    montant_estimatif: data.estimated_amount || 0,
  };

  if (data.type === "Consultance") {
  const consultancePayload: Record<string, unknown> = {
    ...basePayload,
    // Champs obligatoires pour Consultance
    methode: data.method ,
    approche: data.approach ,
    revue: data.review_notes || "",
    forfaitxtemps: data.pricing_type ,
    // Ajoute aussi ces champs
    ref_code_suivi: data.tracking_code ,
    agmoxdirection: data.agmo ,
   };
  
   console.log("Payload Consultance avant ajout dates:", consultancePayload); // DEBUG

   const addIfDate = (key: string, value: unknown) => {
    const normalized = toBackendDate(value);
    if (!normalized) return;
    consultancePayload[key] = normalized;
   };

     addIfDate("TdR_prevu", data.terms_of_reference);
     addIfDate("ami_prevu", data.ami);
     addIfDate("liste_restreinte_prevu", data.restricted_list);
     addIfDate("demande_proposition_prevu", data.request_for_proposal);
     addIfDate("date_invitation_prevu", data.invitation_date);
     addIfDate("date_ouverture_prevu", data.submissions_opening_date);
     addIfDate("ouverture_plis_prevu", data.financial_opening_date);
     addIfDate("date_signature_prevu", data.contract_date);
     addIfDate("date_fin_prevu", data.mission_end_date);
     addIfDate("rapport_evaluation_prevu", data.evaluation_report);
      addIfDate("projet_contrat_prevu", data.contract_draft);
      // Dates réelles
      addIfDate("TdR_reel", dataExtras["terms_of_reference_actual"]);
      addIfDate("ami_reel", dataExtras["ami_actual"]);
      addIfDate("liste_restreinte_reel", dataExtras["restricted_list_actual"]);
      addIfDate("demande_proposition_reel", dataExtras["request_for_proposal_actual"]);
      addIfDate("date_invitation_reel", dataExtras["invitation_date_actual"]);
      addIfDate("date_ouverture_reel", dataExtras["submissions_opening_date_actual"]);
      addIfDate("ouverture_plis_reel", dataExtras["financial_opening_date_actual"]);
      addIfDate("date_signature_reel", dataExtras["contract_date_actual"]);
      addIfDate("date_fin_reel", dataExtras["mission_end_date_actual"]);
      addIfDate("rapport_evaluation_reel", dataExtras["evaluation_report_actual"]);
      addIfDate("projet_contrat_reel", dataExtras["contract_draft_actual"]);

    console.log("Payload Consultance final:", consultancePayload); // DEBUG
    return consultancePayload;
  }

  // Pour Travaux et Biens
  return {
    code_suivi: data.tracking_code || "",
    ...basePayload,
    agmo: data.agmo ,
    ...(data.type === "Biens"
      ? { methode_epm: data.method }
      : { methode_pm: data.method }),
    approches: data.approach ,
    revue: data.review_notes || "",
    dossiers_appel_prevu: toBackendDate(data.tender_documents_date),
    date_lancement_prevu: toBackendDate(data.launch_date),
    date_ouverture_prevu: toBackendDate(data.opening_date),
    date_signature_prevu: toBackendDate(data.contract_date),
    date_livraison_prevu: toBackendDate(data.delivery_date),
    listesetspecifications_prevu: toBackendDate(data.specifications_date),
    rapport_evaluation_prevu: toBackendDate(data.evaluation_report),
    // Dates réelles (Réel)
    dossiers_appel_reel: toBackendDate(dataExtras["tender_documents_date_actual"]),
    date_lancement_reel: toBackendDate(dataExtras["launch_date_actual"]),
    date_ouverture_reel: toBackendDate(dataExtras["opening_date_actual"]),
    rapport_evaluation_reel: toBackendDate(dataExtras["evaluation_report_actual"]),
    date_signature_reel: toBackendDate(dataExtras["contract_date_actual"]),
    date_livraison_reel: toBackendDate(dataExtras["delivery_date_actual"]),
    listesetspecifications_reel: toBackendDate(dataExtras["specifications_date_actual"]),

  };
}

/**
 * MODIFIER un marché
 */
export async function updateProcurement(
  id: number,
  data: Partial<Procurement>,
): Promise<Procurement | null> {
  if (!data.type) {
    console.error("Type de marché manquant pour la mise à jour");
    return null;
  }

  const payload = buildProcurementPayload(data as Procurement);

  try {
    let endpoint = "";
    if (data.type === "Travaux")
      endpoint = `${API_BASE_URL}/api/Travaux/updateTravaux/${id}/`;
    else if (data.type === "Biens")
      endpoint = `${API_BASE_URL}/api/Biens/updateBiens/${id}/`;
    else if (data.type === "Consultance")
      endpoint = `${API_BASE_URL}/api/Consultance/updateConsultance/${id}/`;

    console.log("Envoi payload update:", payload); // DEBUG

    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error || "Erreur lors de la mise à jour du marché";
      console.error("Erreur API:", errorMessage);
      throw new Error(errorMessage);
    }

    const updatedItem = await response.json();
    return { ...(data as Procurement), id: updatedItem.id };
  } catch (error: unknown) {
    console.error("Erreur API:", error);
    throw error;
  }
}

/**
 * Calculer le planning (Appel Backend)
 */
export async function calculatePlanning(
  type: "Travaux" | "Biens" | "Consultance",
  dateFin: string,
  methode: string,
  duree: number = 60,
): Promise<PlanningResponse> {
  let endpoint = "";
  if (type === "Consultance") {
    endpoint = `${API_BASE_URL}/api/Consultance/calculerPlanningConsultance/`;
  } else if (type === "Biens") {
    endpoint = `${API_BASE_URL}/api/Biens/calculerPlanningBiens/`;
  } else {
    endpoint = `${API_BASE_URL}/api/Travaux/calculerPlanningTravaux/`;
  }
  try {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const payload =
      type === "Consultance"
        ? { date_fin: dateFin, methode, duree }
        : { date_livr: dateFin, methode, duree };

    console.log("🔵 calculatePlanning payload:", payload); // DEBUG
    console.log("🔵 calculatePlanning endpoint:", endpoint); // DEBUG
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (response.status === 401 || response.status === 403) {
      throwSessionExpiredError();
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || errorData.detail || "Erreur de calcul",
      );
    }

    const result = await response.json();
    console.log("🔵 calculatePlanning result:", result); // DEBUG
    return result;
  } catch (error) {
    console.error("Erreur calcul:", error);
    throw error;
  }
}

/**
 * Calculer le statut d'une ligne via les endpoints backend
 */
export async function getProcurementStatus(
  type: "Travaux" | "Biens" | "Consultance",
  row: Record<string, unknown>,
): Promise<string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let endpoint = "";
  let dates_prevues: Record<string, string | null> = {};
  let dates_reels: Record<string, string | null> = {};

  if (type === "Travaux" || type === "Biens") {
    endpoint =
      type === "Travaux"
        ? `${API_BASE_URL}/api/Travaux/statutTravaux/`
        : `${API_BASE_URL}/api/Biens/statutBiens/`;

    dates_prevues = {
      listesetspecifications_prevu: toDateValue(row.specifications_date),
      dossiers_appel_prevu: toDateValue(row.tender_documents_date),
      date_lancement_prevu: toDateValue(row.launch_date),
      date_ouverture_prevu: toDateValue(row.opening_date),
      rapport_evaluation_prevu: toDateValue(row.evaluation_report),
      date_signature_prevu: toDateValue(row.contract_date),
      date_livraison_prevu: toDateValue(row.delivery_date),
    };

    dates_reels = {
      listesetspecifications_reel: toDateValue(row.specifications_date_actual),
      dossiers_appel_reel: toDateValue(row.tender_documents_date_actual),
      date_lancement_reel: toDateValue(row.launch_date_actual),
      date_ouverture_reel: toDateValue(row.opening_date_actual),
      rapport_evaluation_reel: toDateValue(row.evaluation_report_actual),
      date_signature_reel: toDateValue(row.contract_date_actual),
      date_livraison_reel: toDateValue(row.delivery_date_actual),
    };
  } else {
    endpoint = `${API_BASE_URL}/api/Consultance/statutConsultance/`;

    dates_prevues = {
      TdR_prevu: toDateValue(row.terms_of_reference),
      ami_prevu: toDateValue(row.ami),
      liste_restreinte_prevu: toDateValue(row.restricted_list),
      demande_proposition_prevu: toDateValue(row.request_for_proposal),
      date_invitation_prevu: toDateValue(row.invitation_date),
      date_ouverture_prevu: toDateValue(row.submissions_opening_date),
      ouverture_plis_prevu: toDateValue(row.financial_opening_date),
      date_signature_prevu: toDateValue(row.contract_date),
      date_fin_prevu: toDateValue(row.mission_end_date),
    };

    dates_reels = {
      TdR_reel: toDateValue(row.terms_of_reference_actual),
      ami_reel: toDateValue(row.ami_actual),
      liste_restreinte_reel: toDateValue(row.restricted_list_actual),
      demande_proposition_reel: toDateValue(row.request_for_proposal_actual),
      date_invitation_reel: toDateValue(row.invitation_date_actual),
      date_ouverture_reel: toDateValue(row.submissions_opening_date_actual),
      ouverture_plis_reel: toDateValue(row.financial_opening_date_actual),
      date_signature_reel: toDateValue(row.contract_date_actual),
      date_fin_reel: toDateValue(row.mission_end_date_actual),
    };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ dates_prevues, dates_reels }),
  });

  if (response.status === 401 || response.status === 403) {
    throwSessionExpiredError();
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      data.detail || data.error || "Erreur lors du calcul du statut",
    );
  }

  return data.statut || "Statut indisponible";
}

/**
 * SUPPRIMER un marché
 */
export async function deleteProcurement(
  id: number,
  type: "Travaux" | "Biens" | "Consultance",
  password: string,
): Promise<boolean> {
  const getHeaders = (token: string | null): HeadersInit => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    if (typeof window === "undefined") return null;
    const refresh = localStorage.getItem("refresh_token");
    if (!refresh) return null;

    const refreshResponse = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!refreshResponse.ok) return null;
    const refreshData = await refreshResponse.json().catch(() => ({}));
    const newAccess = refreshData.access as string | undefined;
    if (!newAccess) return null;
    localStorage.setItem("access_token", newAccess);
    return newAccess;
  };

  let endpoint = "";
  if (type === "Travaux")
    endpoint = `${API_BASE_URL}/api/Travaux/deleteTravaux/${id}/`;
  else if (type === "Biens")
    endpoint = `${API_BASE_URL}/api/Biens/deleteBiens/${id}/`;
  else endpoint = `${API_BASE_URL}/api/Consultance/deleteConsultance/${id}/`;

  let accessToken =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (!accessToken) {
    throwSessionExpiredError();
  }

  let response = await fetch(endpoint, {
    method: "DELETE",
    headers: getHeaders(accessToken),
    body: JSON.stringify({ password }),
  });

  if (response.status === 401) {
    accessToken = await refreshAccessToken();
    if (!accessToken) {
      throwSessionExpiredError();
    }
    response = await fetch(endpoint, {
      method: "DELETE",
      headers: getHeaders(accessToken),
      body: JSON.stringify({ password }),
    });
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      data.detail || data.error || "Erreur lors de la suppression",
    );
  }

  return true;
}

export async function stopProcurement(
  id: number,
  type: "Travaux" | "Biens" | "Consultance",
  password: string,
): Promise<{ statut: string }> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (!token) {
    throwSessionExpiredError();
  }

  const headers: HeadersInit = { "Content-Type": "application/json" };
  headers.Authorization = `Bearer ${token}`;

  let endpoint = "";
  if (type === "Travaux")
    endpoint = `${API_BASE_URL}/api/Travaux/arreter/${id}/`;
  else if (type === "Biens")
    endpoint = `${API_BASE_URL}/api/Biens/arreter/${id}/`;
  else endpoint = `${API_BASE_URL}/api/Consultance/arreter/${id}/`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ password }),
  });

  if (res.status === 401 || res.status === 403) {
    throwSessionExpiredError();
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data.error || data.detail || "Erreur arrêt");
  return { statut: data.statut || "Arrêté" };
}
