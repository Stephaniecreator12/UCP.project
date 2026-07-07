"use client";

import React, { createContext, useContext, useState } from "react";
import { decryptAccess } from "@/app/utils/decrypt/access";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import { decryptUserInfo } from "@/app/utils/decrypt/userInfo";

const SECRET_KEY =
  process.env.NEXT_PUBLIC_COOKIE_SECRET || "default_secret_key";
interface UserInfo {
  personnel_id: number;
  email: string;
  role: string;
}
interface AccessContextType {
  accessType: string | null;
  userInfo: UserInfo | null;
  setAccess: (newAccess: string) => void;
  logout: () => void;
}

const AccessContext = createContext<AccessContextType | undefined>(undefined);

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const [accessType, setAccessType] = useState<string | null>(() =>
    decryptAccess(),
  );
  const [userInfo, setUserInfo] = useState<UserInfo | null>(() =>
    decryptUserInfo(),
  );

  const setAccess = (newAccess: string) => {
    const encryptedAccess = CryptoJS.AES.encrypt(
      newAccess,
      SECRET_KEY,
    ).toString();

    Cookies.set("access_type", encryptedAccess, {
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: 1,
    });

    setAccessType(newAccess);
    setUserInfo(decryptUserInfo());
  };

  const logout = () => {
    Cookies.remove("access_type");
    Cookies.remove("user_info");
    setAccessType(null);
    setUserInfo(null);
  };

  return (
    <AccessContext.Provider value={{ accessType, userInfo, setAccess, logout }}>
      {children}
    </AccessContext.Provider>
  );
}

export const useAccess = (): AccessContextType => {
  const context = useContext(AccessContext);
  if (!context) {
    throw new Error(
      "useAccess doit être utilisé à l'intérieur d'un AccessProvider",
    );
  }
  return context;
};
