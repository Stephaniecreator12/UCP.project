/**
 * Configuration de l'API Backend
 * 
 * Pour changer de backend, modifie simplement API_BASE_URL ci-dessous
 * 
 * Exemples :
 * - Django local : "http://localhost:8000"
 * - Node.js local : "http://localhost:3001"
 * - Production : "https://api.mon-serveur.com"
 */

// Option 1 : URL fixe (décommente celle que tu veux utiliser)
export const API_BASE_URL = "http://127.0.0.1:8000";

// Option 2 : Variable d'environnement (recommandé pour production)
// Crée un fichier .env.local avec : NEXT_PUBLIC_API_URL=http://localhost:8000
// export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Option 3 : Détection automatique (dev vs production)
// export const API_BASE_URL = 
//   process.env.NODE_ENV === 'production' 
//     ? 'https://api.mon-serveur.com'
//     : 'http://localhost:8000';

/**
 * Préfixe des endpoints API
 * Par défaut : "/api" (donc les URLs seront /api/procurements/)
 * Si ton backend utilise "/v1" ou autre, change ici
 */
export const API_PREFIX = "/api/test/";

/**
 * Fonction helper pour construire une URL complète
 * Exemple : buildApiUrl("procurements") → "http://localhost:8000/api/procurements"
 */
export function buildApiUrl(endpoint: string): string {
  // Enlève le slash initial s'il existe
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  // Enlève le slash final de API_PREFIX s'il existe
  const cleanPrefix = API_PREFIX.endsWith("/") ? API_PREFIX.slice(0, -1) : API_PREFIX;
  
  return `${API_BASE_URL}${cleanPrefix}/${cleanEndpoint}`;
}

/**
 * Test de connexion au backend
 * Retourne true si le backend est accessible
 */
export async function testBackendConnection(): Promise<boolean> {
  try {
    const response = await fetch(buildApiUrl("procurements/"), {
      method: "HEAD", // Juste vérifier que ça répond, sans charger les données
    });
    return response.ok || response.status === 405; // 405 = Method not allowed mais serveur répond
  } catch (error) {
    console.error("Backend non accessible:", error);
    return false;
  }
}
