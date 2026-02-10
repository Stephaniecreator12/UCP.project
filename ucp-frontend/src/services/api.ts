/**
 * Service API pour appeler le backend Django (backend_PPM)
 * Ce service gère désormais les 3 types de marchés : Travaux, Biens, Consultance
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// Interface commune pour un marché (Travaux, Biens ou Consultance)
// Note: Les champs peuvent varier légèrement entre les modèles Django,
// on garde ici une interface assez large qui couvre les besoins.
export interface Procurement {
  id?: number;
  // Type de marché pour aider le frontend à savoir quelle API appeler
  type?: 'Travaux' | 'Biens' | 'Consultance';

  ref_number?: string; // Peut s'appeler num_ref dans certains modèles
  title?: string; // Peut s'appeler intitule_projet
  tracking_code?: string; // code_suivi
  estimated_amount?: number; // montant_estimatif

  // Champs communs
  method?: string; // mode
  review_notes?: string;

  // Dates prévues (Planifié)
  date_invitation?: string;
  date_opening_submissions?: string;
  date_contract_signed?: string;
  date_mission_end?: string;

  // Dates réelles (Exécuté) - À adapter selon les nouveaux modèles
  // Les modèles semblent utiliser des tables séparées pour les détails prévus/réels
  // Pour l'instant on garde une structure souple
  [key: string]: any;
}

/**
 * Utilitaires pour mapper les URLs selon le type
 */
const getEndpoint = (type: 'Travaux' | 'Biens' | 'Consultance') => {
  return `${API_BASE_URL}/api/${type}`;
};

/**
 * Récupérer TOUS les marchés (combine les 3 types)
 */
export async function getAllProcurements(): Promise<Procurement[]> {
  try {
    const urls = [
      `${API_BASE_URL}/api/Travaux/listTravaux/`,
      `${API_BASE_URL}/api/Biens/listBiens/`,
      `${API_BASE_URL}/api/Consultance/listConsultance/`
    ];

    const responses = await Promise.all(
      urls.map(url => fetch(url).then(res => res.json().catch(() => ({ travaux: [], biens: [], consultance: [] }))))
    );

    // Note: Le backend renvoie souvent { travaux: [...] } et non directement [...]
    // Il faut vérifier la structure exacte de la réponse JSON de tes vues 'listTravaux'
    // Tes vues renvoient: return JsonResponse({'travaux': data})

    const travauxList = responses[0].travaux || [];
    const biensList = responses[1].biens || [];
    const consultanceList = responses[2].consultance || [];

    // Fonction de mapping pour transformer un item Backend en Procurement Frontend
    const mapItem = (item: any, type: 'Travaux' | 'Biens' | 'Consultance'): Procurement => ({
      id: item.id,
      type: type,
      ref_number: item.code_suivi, // Ou null si pas de ref
      title: item.intitule,
      tracking_code: item.code_suivi,
      estimated_amount: parseFloat(item.montant_estimatif),
      method: item.methode_pm,
      approach: item.approches,
      review_notes: item.commentaire,

      // Dates
      date_invitation: item.date_lancement_prevu,
      date_opening_submissions: item.date_ouverture_prevu,
      date_contract_signed: item.date_signature_prevu,
      date_mission_end: item.date_livraison_prevu,
    });

    const travaux = travauxList.map((item: any) => mapItem(item, 'Travaux'));
    const biens = biensList.map((item: any) => mapItem(item, 'Biens'));
    const consultance = consultanceList.map((item: any) => mapItem(item, 'Consultance'));

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
  type: 'Travaux' | 'Biens' | 'Consultance'
): Promise<Procurement | null> {
  try {
    const endpoint = getEndpoint(type);
    // Note: Les URLs Django semblent être orientées action (list/add), 
    // il faudra vérifier s'il existe une vue 'detail' standard : api/Travaux/{id}/
    // Si ce n'est pas le cas, on devra peut-être filtrer la liste.
    // Supposons pour l'instant une URL standard REST :
    const response = await fetch(`${endpoint}/${id}/`);

    if (!response.ok) throw new Error("Marché non trouvé");
    return await response.json();
  } catch (error) {
    console.error("Erreur API:", error);
    return null;
  }
}

/**
 * CRÉER un nouveau marché
 */
export async function createProcurement(
  data: Procurement
): Promise<Procurement | null> {
  if (!data.type) {
    console.error("Type de marché manquant (Travaux, Biens, Consultance)");
    return null;
  }

  // 1. On prépare les données pour le Backend (Mapping)
  const payload = {
    // Champs communs
    code_suivi: data.tracking_code || "",

    // ICI : On met une valeur par défaut si c'est vide !
    intitule: data.title || "Sans Titre",
    montant_estimatif: data.estimated_amount || 0,

    // Champs spécifiques
    agmo: data.agmo || "Direction Générale",
    methode_pm: data.method || "Non défini",
    approches: data.approach || "Non défini",
    revue: data.review_notes || "Non défini",

    // Dates (null si vide)
    listesetspecifications: data.date_invitation || null,

    // Mapping des dates prévues
    date_lancement_prevu: data.date_invitation || null,
    date_ouverture_prevu: data.date_opening_submissions || null,
    date_signature_prevu: data.date_contract_signed || null,
    date_livraison_prevu: data.date_mission_end || null,

    commentaire: data.review_notes || ""
  };



  /**
   * MODIFIER un marché (Stub - Non implémenté sur le backend)
   */
  try {
    let endpoint = "";
    if (data.type === "Travaux") endpoint = `${API_BASE_URL}/api/Travaux/addTravaux/`;
    else if (data.type === "Biens") endpoint = `${API_BASE_URL}/api/Biens/addBiens/`;
    else if (data.type === "Consultance") endpoint = `${API_BASE_URL}/api/Consultance/addConsultance/`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || "Erreur lors de la création du marché";
      console.error("Erreur API:", errorMessage);
      throw new Error(errorMessage);
    }

    const createdItem = await response.json();
    return { ...data, id: createdItem.id };
  } catch (error: any) {
    console.error("Erreur API:", error);
    throw error; // Propagate error
  }
}

/**
 * MODIFIER un marché (Stub - Non implémenté sur le backend)
 */
export async function updateProcurement(
  id: number,
  data: Partial<Procurement>
): Promise<Procurement | null> {
  console.warn("Update non supporté par le backend actuel");
  return null;
}

/**
 * Calculer le planning (Appel Backend)
 */
export async function calculatePlanning(
  dateFin: string,
  methode: string = "AOI",
  duree: number = 60
): Promise<any> {
  const endpoint = `${API_BASE_URL}/api/Travaux/calculer_planning/`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date_fin: dateFin,
        methode: methode,
        duree: duree
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Erreur de calcul");
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur calcul:", error);
    throw error;
  }
}

/**
 * SUPPRIMER un marché (Stub - Non implémenté sur le backend)
 */
export async function deleteProcurement(id: number): Promise<boolean> {
  console.warn("Delete non supporté par le backend actuel");
  return false;
}
