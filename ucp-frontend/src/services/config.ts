import axios from "axios";
import Cookies from 'js-cookie';
import { AxiosError } from "axios";
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});
api.interceptors.request.use(async (config) => {
  let token: string | undefined = undefined;

  if (typeof window !== "undefined") {
    token = Cookies.get("access_token");
  } else {
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      token = cookieStore.get("access_token")?.value;
    } catch (e) {
      console.error("Impossible de lire les cookies sur le serveur", e);
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

type ApiErrorData =
  | string
  | {
      detail?: string;
      message?: string;
      [key: string]: unknown;
    };
type ValidationError = Record<string, unknown>;
export const parseApiError = (error: unknown): string | ValidationError => {
  const err = error as AxiosError<ApiErrorData>;
  const data = err.response?.data;

  if (!data) return "Erreur réseau ou serveur injoignable";

  if (err.response?.status === 400 && typeof data === "object") {
    return data as ValidationError;
  }

  if (typeof data === "string") return data;
  
  if (data && typeof data === "object") {
    if ("detail" in data && data.detail) return String(data.detail);
    if ("message" in data && data.message) return String(data.message);
    
    const firstKey = Object.keys(data)[0];
    const firstError = (data as Record<string, unknown>)[firstKey];
    
    if (Array.isArray(firstError)) return String(firstError[0]);
    return String(firstError);
  }

  return "Une erreur inconnue est survenue";
};