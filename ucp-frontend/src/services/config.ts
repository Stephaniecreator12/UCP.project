import axios from "axios";
import { AxiosError } from "axios";
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

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