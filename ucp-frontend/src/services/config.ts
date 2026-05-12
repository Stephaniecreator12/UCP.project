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

export const parseApiError = (error: unknown): string => {
  const err = error as AxiosError<ApiErrorData>;
  const data = err.response?.data;

  if (!data) return "Erreur réseau";

  if (typeof data === "string") return data;
  if ("detail" in data && data.detail) return String(data.detail);
  if ("message" in data && data.message) return String(data.message);

  if (typeof data === "object" && data !== null) {
    const firstKey = Object.keys(data)[0];
    const firstError = (data as Record<string, unknown>)[firstKey];

    if (Array.isArray(firstError)) return String(firstError[0]);
    return String(firstError);
  }

  return "Erreur inconnue";
};