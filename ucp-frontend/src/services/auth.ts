import { API_BASE_URL } from "./api";

interface LoginResult {
  success: boolean;
  error?: string;
}

export const login = async (
  username: string,
  password: string,
): Promise<LoginResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      return { success: true };
    }

    return {
      success: false,
      error: "Nom d'utilisateur ou mot de passe incorrect",
    };
  } catch {
    return { success: false, error: "Erreur de connexion au serveur" };
  }
};

export const logout = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
};

export const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
};
