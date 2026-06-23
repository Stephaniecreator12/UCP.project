import Cookies from 'js-cookie';
import { API_BASE_URL, API_RH_URL } from "./api";
import CryptoJS from 'crypto-js';
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
  setAccess: (access: string) => void
): Promise<LoginResult> => {
  try {
    const response = await fetch(`${API_RH_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    const accessType = "private"
    if (response.ok) {
      Cookies.set("access_token", data.token, { expires: 1, secure: process.env.NODE_ENV === 'production' });
      const stringUser = JSON.stringify(data.user); 
      const encryptedUser = CryptoJS.AES.encrypt(stringUser, process.env.NEXT_PUBLIC_COOKIE_SECRET || 'default_secret_key').toString();
      Cookies.set("user_info", encryptedUser, { expires: 1, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
      setAccess(accessType);
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
    return { status: 500,success: false, message: "serveur RH inaccessible" };
  }
};
export const publicLogin = async (
  email: string,
  password: string,
  setAccess: (access: string) => void
): Promise<LoginResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/public/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    const accessType = "public"
    if (response.ok) {
      Cookies.set("access_token", data.access, { expires: 1, secure: process.env.NODE_ENV === 'production' });
      Cookies.set("refresh_token", data.refresh, { expires: 1, secure: process.env.NODE_ENV === 'production' });
      setAccess(accessType);
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
    return { status: 500,success: false, message: "serveur publique inaccessible" };
  }
};
export const login = async (
  email: string,
  password: string,
  setAccess: (access: string) => void
): Promise<LoginResult> => {
  try {
    
    //if(isUCPDomain(email)) {
        return await rhLogin(email, password, setAccess);
    //}
    /*
    else{
      return await publicLogin(email, password, setAccess);
    }*/
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
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
  Cookies.remove("access_type");
  Cookies.remove("user_info");
};

export const getToken = () => {
  if (typeof window === "undefined") return null;
  return Cookies.get("access_token");
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
    const response = await fetch(`${API_BASE_URL}/users/create/`, {
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