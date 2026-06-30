"use client";

const OPENING_FLASH_KEY = "ucp_ouverture_flash_message";
const FLASH_TTL_MS = 30_000;

type OpeningFlashPayload = {
  message: string;
  targetPath: string;
  createdAt: number;
};

const normalizePath = (path: string) => path.replace(/\/+$/, "") || "/";

export const setOpeningFlashMessage = (
  message: string,
  targetPath = "/ouverture_offre",
) => {
  if (typeof window === "undefined") return;

  const payload: OpeningFlashPayload = {
    message,
    targetPath: normalizePath(targetPath),
    createdAt: Date.now(),
  };

  window.sessionStorage.setItem(OPENING_FLASH_KEY, JSON.stringify(payload));
};

export const consumeOpeningFlashMessage = (currentPath: string) => {
  if (typeof window === "undefined") return "";

  const raw = window.sessionStorage.getItem(OPENING_FLASH_KEY);
  if (!raw) return "";

  window.sessionStorage.removeItem(OPENING_FLASH_KEY);

  try {
    const payload = JSON.parse(raw) as Partial<OpeningFlashPayload>;

    if (
      typeof payload.message !== "string" ||
      typeof payload.targetPath !== "string" ||
      typeof payload.createdAt !== "number"
    ) {
      return "";
    }

    if (Date.now() - payload.createdAt > FLASH_TTL_MS) {
      return "";
    }

    if (normalizePath(payload.targetPath) !== normalizePath(currentPath)) {
      return "";
    }

    return payload.message;
  } catch {
    return "";
  }
};
