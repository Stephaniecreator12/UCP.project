import Cookies from "js-cookie";
import CryptoJS from "crypto-js";

const SECRET_KEY =
  process.env.NEXT_PUBLIC_COOKIE_SECRET || "default_secret_key";

export const decryptAccess = (encryptedValue?: string): string | null => {
  let valueToDecrypt = encryptedValue;
  if (!valueToDecrypt) {
    if (typeof window !== "undefined") {
      valueToDecrypt = Cookies.get("access_type");
    }
  }
  if (!valueToDecrypt) {
    return null;
  }

  // Try to decrypt first
  try {
    const bytes = CryptoJS.AES.decrypt(valueToDecrypt, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (decrypted && decrypted.trim()) {
      return decrypted;
    }
  } catch (e) {
    // Decryption failed, try to use as plaintext
  }

  // Fallback: check if it's already plaintext (from old sessions)
  if (valueToDecrypt === "private" || valueToDecrypt === "public") {
    return valueToDecrypt;
  }

  return null;
};
