import { getToken, logout } from "./auth";
import { API_BASE_URL } from "./api";
import { Contrat } from "@/types/contractualisation";

const CONTRATS_API_BASE = `${API_BASE_URL || "http://localhost:8000"}/api/contrats`;

const fetchWithAuthRetry = async (url: string, options: RequestInit = {}) => {
  const token = getToken();
  if (!token) {
    throw new Error("Token non disponible. Reconnecte-toi.");
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    logout();
    throw new Error("Session expirée. Reconnecte-toi.");
  }

  return response;
};

// ============================================================
// LISTER LES CONTRATS
// ============================================================
export const listContrats = async (): Promise<Contrat[]> => {
  const res = await fetchWithAuthRetry(`${CONTRATS_API_BASE}/`);
  if (!res.ok) {
    throw new Error("Erreur lors du chargement des contrats");
  }
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
};

// ============================================================
// CRÉER UN CONTRAT
// ============================================================
export const createContrat = async (
  seanceId: number,
  offreId: number,
): Promise<Contrat> => {
  const res = await fetchWithAuthRetry(`${CONTRATS_API_BASE}/create/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seance_id: seanceId, offre_id: offreId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Erreur lors de la création du contrat");
  }
  return res.json();
};

// ============================================================
// RÉCUPÉRER UN CONTRAT
// ============================================================
export const getContrat = async (contratId: number): Promise<Contrat> => {
  const res = await fetchWithAuthRetry(`${CONTRATS_API_BASE}/${contratId}/`);
  if (!res.ok) {
    throw new Error("Erreur lors du chargement du contrat");
  }
  return res.json();
};

// ============================================================
// METTRE À JOUR UN CONTRAT
// ============================================================
export const updateContrat = async (
  contratId: number,
  data: Record<string, unknown>,
): Promise<Contrat> => {
  const res = await fetchWithAuthRetry(
    `${CONTRATS_API_BASE}/${contratId}/update/`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Erreur lors de la mise à jour");
  }
  return res.json();
};

// ============================================================
// AJOUTER UN ÉCHÉANCIER
// ============================================================
export const addEcheancier = async (
  contratId: number,
  data: {
    montant: string;
    pourcentage: number;
    etape: string;
    date_prevue: string;
  },
): Promise<Record<string, unknown>> => {
  const res = await fetchWithAuthRetry(
    `${CONTRATS_API_BASE}/${contratId}/echeancier/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Erreur lors de l'ajout");
  }
  return res.json();
};

// ============================================================
// MODIFIER UN ÉCHÉANCIER
// ============================================================
export const updateEcheancier = async (
  contratId: number,
  echeancierID: number,
  data: {
    montant?: string;
    pourcentage?: number;
    etape?: string;
    date_prevue?: string;
  },
): Promise<Record<string, unknown>> => {
  const res = await fetchWithAuthRetry(
    `${CONTRATS_API_BASE}/${contratId}/echeancier/${echeancierID}/`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Erreur lors de la modification");
  }
  return res.json();
};

// ============================================================
// SUPPRIMER UN ÉCHÉANCIER
// ============================================================
export const deleteEcheancier = async (
  contratId: number,
  echeancierID: number,
): Promise<void> => {
  const res = await fetchWithAuthRetry(
    `${CONTRATS_API_BASE}/${contratId}/echeancier/${echeancierID}/`,
    {
      method: "DELETE",
    },
  );
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Erreur lors de la suppression");
  }
};

// ============================================================
// UPLOAD DOCUMENT
// ============================================================
export const uploadDocument = async (
  contratId: number,
  file: File,
): Promise<Record<string, unknown>> => {
  const formData = new FormData();
  formData.append("fichier", file);

  const token = getToken();
  if (!token) throw new Error("Token non disponible");

  const res = await fetch(`${CONTRATS_API_BASE}/${contratId}/upload/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Erreur lors de l'upload");
  }
  return res.json();
};

// ============================================================
// SUPPRIMER UN DOCUMENT CONTRACTUEL
// ============================================================
export const deleteDocument = async (
  contratId: number,
  documentId: number,
): Promise<void> => {
  const res = await fetchWithAuthRetry(
    `${CONTRATS_API_BASE}/${contratId}/documents/${documentId}/`,
    {
      method: "DELETE",
    },
  );
  if (!res.ok) {
    const error = await res.json();
    throw new Error(
      error.detail || "Erreur lors de la suppression du document",
    );
  }
};

// ============================================================
// ENVOYER LE CONTRAT
// ============================================================
export const sendContrat = async (contratId: number): Promise<Contrat> => {
  const res = await fetchWithAuthRetry(
    `${CONTRATS_API_BASE}/${contratId}/send/`,
    {
      method: "POST",
    },
  );
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Erreur lors de l'envoi");
  }
  const response = await res.json();
  return response.contrat;
};

// ============================================================
// VISUALISER UN DOCUMENT
// ============================================================
export const viewDocument = async (contratId: number, documentId: number) => {
  const token = getToken();
  if (!token) throw new Error("Token non disponible");

  const res = await fetch(
    `${CONTRATS_API_BASE}/${contratId}/documents/${documentId}/download/`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    let errorDetail = "Erreur lors de l'ouverture du document";
    try {
      const errorJson = await res.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      // ignore parse failure
    }
    throw new Error(errorDetail);
  }

  const contentType = res.headers.get("content-type") || "";
  const blob = await res.blob();

  if (!contentType.includes("pdf")) {
    const text = await blob.text();
    try {
      const json = JSON.parse(text);
      throw new Error(json.detail || "Le document n'a pas pu être ouvert.");
    } catch {
      throw new Error(
        "Le document n'a pas pu être ouvert. Vérifiez que le fichier est bien un PDF.",
      );
    }
  }

  const url = window.URL.createObjectURL(blob);
  const newTab = window.open(url, "_blank", "noopener,noreferrer");
  if (!newTab) {
    window.URL.revokeObjectURL(url);
    throw new Error("Impossible d'ouvrir le document. Autorisez les popups.");
  }
  // Keep the object URL until the tab is closed.
  newTab.addEventListener("unload", () => {
    window.URL.revokeObjectURL(url);
  });
};
