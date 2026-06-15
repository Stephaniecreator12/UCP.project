import Cookies from 'js-cookie';
import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.NEXT_PUBLIC_COOKIE_SECRET || "default_secret_key";

export const decryptAccess = (encryptedValue?: string): string | null => {
  let valueToDecrypt = encryptedValue;
  if (!valueToDecrypt) {
    if (typeof window !== "undefined") {
      valueToDecrypt = Cookies.get('access_type');
    }
  }
  if (!valueToDecrypt) {
    return null;
  }

  try {
    const bytes = CryptoJS.AES.decrypt(valueToDecrypt, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || null;
  } catch (e) {
    console.error("Erreur lors du déchiffrement de l'access_type :", e);
    return null;
  }
};