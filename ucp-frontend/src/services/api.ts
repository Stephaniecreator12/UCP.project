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
  specifications_date?: string;
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
  date_lancement_prevu?: string;
  listesetspecifications?: string;
  date_ouverture_prevu?: string;
  date_signature_prevu?: string;
  date_livraison_prevu?: string;
  // Consultance-specific fields (based on planning payload)
  TdR_prevu?: string;
  ami_prevu?: string;
  liste_restreinte_prevu?: string;
  demande_proposition_prevu?: string;
  date_invitation_prevu?: string;
  ouverture_plis_prevu?: string;
  date_fin_prevu?: string;
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
  date_signature_prevu?: string;
  date_fin_prevu?: string;
  listesetspecifications?: string;
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
        const res = await fetch(url);
        return res
          .json()
          .catch(() => ({ travaux: [], biens: [], consultance: [] }));
      }),
    );

    // Note: Le backend renvoie souvent { travaux: [...] } et non directement [...]
    // Il faut vérifier la structure exacte de la réponse JSON de tes vues 'listTravaux'
    // Tes vues renvoient: return JsonResponse({'travaux': data})

    const travauxList = responses[0].travaux || [];
    const biensList = responses[1].biens || [];
    const consultanceList = responses[2].consultance || [];

    // Fonction de mapping pour transformer un item Backend en Procurement Frontend
    const mapItem = (
      item: BackendProcurementItem,
      type: "Travaux" | "Biens" | "Consultance",
    ): Procurement => {
      const base: Procurement = {
        id: item.id,
        type,
        ref_number: item.code_suivi, // Ou null si pas de ref
        title: item.intitule,
        tracking_code: item.code_suivi,
        estimated_amount: Number(item.montant_estimatif ?? 0),
        method: type === "Biens" ? item.methode_epm : item.methode_pm,
        approach: item.approches,
        review_notes: item.commentaire,
        status: item.statut,
      };

      if (type === "Consultance") {
        return {
          ...base,
          terms_of_reference: item.TdR_prevu,
          ami: item.ami_prevu,
          restricted_list: item.liste_restreinte_prevu,
          request_for_proposal: item.demande_proposition_prevu,
          invitation_date: item.date_invitation_prevu,
          submissions_opening_date: item.date_ouverture_prevu,
          financial_opening_date: item.ouverture_plis_prevu,
          contract_date: item.date_signature_prevu,
          mission_end_date: item.date_fin_prevu,
        };
      }

      return {
        ...base,
        specifications_date: item.listesetspecifications,
        date_invitation: item.date_lancement_prevu,
        date_opening_submissions: item.date_ouverture_prevu,
        date_contract_signed: item.date_signature_prevu,
        date_mission_end: item.date_livraison_prevu,
      };
    };

    const travaux = travauxList.map((item) => mapItem(item, "Travaux"));
    const biens = biensList.map((item) => mapItem(item, "Biens"));
    const consultance = consultanceList.map((item) =>
      mapItem(item, "Consultance"),
    );

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
  const basePayload = {
    intitule: data.title || "Sans Titre",
    montant_estimatif: data.estimated_amount || 0,
    commentaire: data.review_notes || "",
  };

  if (data.type === "Consultance") {
    const consultancePayload: Record<string, unknown> = {
      ...basePayload,
    };
    const addIfValue = (key: string, value: unknown) => {
      if (value === null || value === undefined || String(value).trim() === "") return;
      consultancePayload[key] = value;
    };

    addIfValue("TdR_prevu", data.terms_of_reference);
    addIfValue("ami_prevu", data.ami);
    addIfValue("demande_proposition_prevu", data.request_for_proposal);
    addIfValue("date_ouverture_prevu", data.submissions_opening_date);
    addIfValue("ouverture_plis_prevu", data.financial_opening_date);
    addIfValue("date_signature_prevu", data.contract_date);
    addIfValue("date_fin_prevu", data.mission_end_date);
    addIfValue("date_invitation_prevu", data.invitation_date);
    addIfValue("liste_restreinte_prevu", data.restricted_list);

    return consultancePayload;
  }

  return {
    code_suivi: data.tracking_code || "",
    ...basePayload,
    agmo: data.agmo || "Direction Générale",
    ...(data.type === "Biens"
      ? { methode_epm: data.method || "aoi" }
      : { methode_pm: data.method || "aoi" }),
    approches: data.approach || "Non défini",
    revue: data.review_notes || "Non défini",
    listesetspecifications: data.specifications_date || null,
    date_lancement_prevu: data.date_invitation || null,
    date_ouverture_prevu: data.date_opening_submissions || null,
    date_signature_prevu: data.date_contract_signed || null,
    date_livraison_prevu: data.date_mission_end || null,
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

    return await response.json();
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
      dossiers_appel_prevu: toDateValue(row.tender_documents_date),
      date_lancement_prevu: toDateValue(row.launch_date),
      date_ouverture_prevu: toDateValue(row.opening_date),
      rapport_evaluation_prevu: toDateValue(row.evaluation_report),
      date_signature_prevu: toDateValue(row.contract_date),
      date_livraison_prevu: toDateValue(row.delivery_date),
    };

    dates_reels = {
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
