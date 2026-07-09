import { getToken, logout } from "./auth";
import { API_BASE_URL } from "./api";
import { Contrat } from "@/types/contractualisation";

const CONTRATS_API_BASE = `${API_BASE_URL || "http://localhost:8000"}/api/contrats`;

const fetchWithAuthRetry = async (url: string, options: RequestInit = {}) => {
  let token = getToken();
  if (!token) {
    throw new Error("Token non disponible. Reconnecte-toi.");
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  let response = await fetch(url, { ...options, headers });

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
  return res.json();
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
  data: any,
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
): Promise<any> => {
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
// UPLOAD DOCUMENT
// ============================================================
export const uploadDocument = async (
  contratId: number,
  file: File,
): Promise<any> => {
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
// TÉLÉCHARGER UN DOCUMENT
// ============================================================
export const downloadDocument = async (
  contratId: number,
  documentId: number,
) => {
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
    const error = await res.json();
    throw new Error(error.detail || "Erreur lors du téléchargement");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${contratId}_${documentId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
