import Cookies from "js-cookie";
import CryptoJS from "crypto-js";

import { USER_STORAGE_KEY } from "./constants";
import type { AccessType, LegacyUserInfo, UserProfile } from "./types";

interface PersistAuthSessionOptions {
  accessToken: string;
  refreshToken?: string | null;
  accessType: AccessType;
  user?: UserProfile | null;
  legacyUserInfo?: LegacyUserInfo | null;
  setAccess: (access: string) => void;
}

const getCookieOptions = () => ({
  expires: 1,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
});

const getCookieSecret = () =>
  process.env.NEXT_PUBLIC_COOKIE_SECRET || "default_secret_key";

const toLegacyUserInfo = (user: UserProfile): LegacyUserInfo => ({
  id: user.id,
  email: user.email,
  nom: user.last_name,
  prenom: user.first_name,
});

const encryptUserInfo = (userInfo: LegacyUserInfo) =>
  CryptoJS.AES.encrypt(JSON.stringify(userInfo), getCookieSecret()).toString();

const setLocalStorageItem = (key: string, value: string) => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage may be unavailable in private browsing or restricted contexts.
  }
};

export const clearStoredUser = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_STORAGE_KEY);
};

export const getCurrentUser = (): UserProfile | null => {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    clearStoredUser();
    return null;
  }
};

export const storeCurrentUser = (user: UserProfile) => {
  setLocalStorageItem(USER_STORAGE_KEY, JSON.stringify(user));
};

export const persistAuthSession = ({
  accessToken,
  refreshToken,
  accessType,
  user,
  legacyUserInfo,
  setAccess,
}: PersistAuthSessionOptions) => {
  Cookies.set("access_token", accessToken, getCookieOptions());

  if (refreshToken) {
    Cookies.set("refresh_token", refreshToken, getCookieOptions());
  }

  const userInfo = legacyUserInfo ?? (user ? toLegacyUserInfo(user) : null);
  if (userInfo) {
    Cookies.set("user_info", encryptUserInfo(userInfo), getCookieOptions());
  }

  setAccess(accessType);
  setLocalStorageItem("access_token", accessToken);

  if (refreshToken) {
    setLocalStorageItem("refresh_token", refreshToken);
  }

  if (user) {
    storeCurrentUser(user);
  }
};

export const logout = () => {
  if (typeof window === "undefined") return;

  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
  Cookies.remove("access_type");
  Cookies.remove("user_info");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  clearStoredUser();
};

export const getToken = () => {
  if (typeof window === "undefined") return null;

  const cookieToken = Cookies.get("access_token");
  if (cookieToken) return cookieToken;

  return localStorage.getItem("access_token");
};
