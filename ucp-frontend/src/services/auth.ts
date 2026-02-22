import { API_BASE_URL } from "./api"; // On réutilise l'adresse du backend

// C'est ici qu'on demande le "Bracelet VIP" (Token) au serveur
export const login = async (username, password) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // Si c'est bon, on garde le bracelet dans la poche (LocalStorage)
            localStorage.setItem("access_token", data.access);
            localStorage.setItem("refresh_token", data.refresh);
            return { success: true };
        } else {
            return { success: false, error: "Nom d'utilisateur ou mot de passe incorrect" };
        }
    } catch {
        return { success: false, error: "Erreur de connexion au serveur" };
    }
};

// Pour se déconnecter, on jette juste le bracelet
export const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    // Rediriger vers la page login (on le fera dans le composant)
};

// Une petite fonction pour récupérer le bracelet quand on en a besoin
export const getToken = () => {
    return localStorage.getItem("access_token");
};

// Ajoutez cette fonction pour faciliter la récupération du refresh token
export const getRefreshToken = () => {
    return localStorage.getItem("refresh_token");
};