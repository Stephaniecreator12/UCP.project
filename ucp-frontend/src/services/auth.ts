import { API_BASE_URL, API_RH_URL } from "./api";
interface LoginResult {
  status: number;
  success?: boolean;
  message?: string;  
}
interface RegisterResult {
  status: number;
  success: boolean;
  message: string;
}
export const rhLogin = async (
  email: string,
  password: string,
): Promise<LoginResult> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 3000);
  try {
    const response = await fetch(`${API_RH_URL}/api/logins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    clearTimeout(timeout);
    const data = await response.json();
    const accessType = "private"
    if (response.ok) {
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("accessType", accessType);
      document.cookie = `access_type=${accessType}; path=/`;
      document.cookie = `access_token=${data.access}; path=/`;
      return {status:200, success: true};
    }
    if(response.status == 400){
      return{
      status: response.status,
      success: false,
      message: data.message || "l'adresse e-mail ou mot de passe incorrect",
    }
    }return{
      status: 404,
      success: false,
      message: data.message || "Identifiants introuvable",
    }
  } catch {
    clearTimeout(timeout);
    return { status: 500,success: false, message: "serveur RH inaccessible" };
  }
};
export const publicLogin = async (
  email: string,
  password: string,
): Promise<LoginResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/public/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    const accessType = "public"
    if (response.ok) {
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("access_type", accessType);
      document.cookie = `access_type=${accessType}; path=/`;
      document.cookie = `access_token=${data.access}; path=/`;
      return {status:200, success: true};
    }
    if(response.status == 404){
      return{
        message:"identifiants publique introuvable",
        success: false,
        status:404
    }
    }return{
      status: response.status,
      success: false,
      message: data.message || "l'adresse e-mail publique ou mot de passe incorrect",
    }
  } catch {
    return { status: 500,success: false, message: "serveur RH inaccessible" };
  }
};
export const login = async (
  email: string,
  password: string,
): Promise<LoginResult> => {
  try {
    const rhResponse = await rhLogin(email, password);
    if(rhResponse.status == 404 || rhResponse.status == 500) {
        return await publicLogin(email, password);
    }
    return rhResponse;
  } catch {
    return {
      status: 500,
      success: false,
      message: "Erreur de connexion au serveur",
    };
  }
};

export const logout = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("access_type");

  document.cookie =
    "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  document.cookie =
    "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  document.cookie =
    "access_type=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
};

export const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
};


export const publicRegister = async (
  full_name: string,
  email: string,
  phone: string,
  type_entite: string,
  nif: string,
  password: string,

): Promise<RegisterResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/create/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        { full_name,
          email,
          phone,
          type_entite,
          nif,
         password }
        ),
    });
    const result = await response.json();
    if (response.ok) {
      return {status:201, success: true , message: "Profil enregistré"};
    }
    let errorMessage = '';

if (result.message) {
  errorMessage = result.message;
} 
else if (result.non_field_errors) {
  const err = result.non_field_errors[0];

  if (typeof err === "string") {
    errorMessage = err;
  } else if (err.message) {
    errorMessage = err.message;
  }
} 
else if (result.email) {
  errorMessage = result.email[0];
}
else if (result.password) {
  errorMessage = result.password[0];
}
else if (result.phone) {
  errorMessage = result.phone[0];
}
else if (result.full_name) {
  errorMessage = result.full_name[0];
}
else if (result.type_entite) {
  errorMessage = result.type_entite[0];
}
    else{
      return {
      status:400,
      success: false,
      message: "Une erreur est survenue",
    };
    }
    return {
      status:response.status,
      success: false,
      message: errorMessage,
    };
  } catch {
    return {status:500, success: false, message: "Erreur de connexion au serveur" };
  }
};
export const isUCPDomain = (email: string): boolean => {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1].toLowerCase();

  return domain === "ucp.mg";
};