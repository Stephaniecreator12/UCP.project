import Cookies from "js-cookie";
import CryptoJS from "crypto-js";

const SECRET_KEY =
  process.env.NEXT_PUBLIC_COOKIE_SECRET || "default_secret_key";

interface UserInfo {
  personnel_id: number;
  email: string;
  role: string;
}

export const decryptUserInfo = (encryptedValue?: string): UserInfo | null => {
  let valueToDecrypt = encryptedValue;

  if (!valueToDecrypt && typeof window !== "undefined") {
    valueToDecrypt = Cookies.get("user_info");
  }

  if (!valueToDecrypt) return null;

  try {
    const bytes = CryptoJS.AES.decrypt(valueToDecrypt, SECRET_KEY);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);

    if (!decryptedText) return null;

    return JSON.parse(decryptedText) as UserInfo;
  } catch (e) {
    console.error("Erreur lors du déchiffrement de user_info :", e);
    return null;
  }
};
