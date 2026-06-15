'use client';

import React, { createContext, useContext, useState } from 'react';
import { decryptAccess } from '@/utils/access'; 
import Cookies from 'js-cookie';
import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.NEXT_PUBLIC_COOKIE_SECRET || 'ma_cle_front_back';

interface AccessContextType {
  accessType: string | null;
  setAccess: (newAccess: string) => void; 
  logout: () => void;          
}

const AccessContext = createContext<AccessContextType | undefined>(undefined);

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const [accessType, setAccessType] = useState<string | null>(() => decryptAccess());

  const setAccess = (newAccess: string) => {
    const encryptedAccess = CryptoJS.AES.encrypt(newAccess, SECRET_KEY).toString();
    
    Cookies.set('access_type', encryptedAccess, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: 1
    });

    setAccessType(newAccess);
  };

  const logout = () => {
    Cookies.remove('access_type');
    setAccessType(null);
  };

  return (
    <AccessContext.Provider value={{ accessType, setAccess, logout }}>
      {children}
    </AccessContext.Provider>
  );
}

export const useAccess = (): AccessContextType => {
  const context = useContext(AccessContext);
  if (!context) {
    throw new Error("useAccess doit être utilisé à l'intérieur d'un AccessProvider");
  }
  return context;
};