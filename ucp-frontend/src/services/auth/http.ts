export const asRecord = (data: unknown): Record<string, unknown> | null =>
  data && typeof data === "object" ? (data as Record<string, unknown>) : null;

export const getStringField = (
  data: Record<string, unknown> | null,
  key: string,
): string | null => {
  const value = data?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

export const extractAuthErrorMessage = (data: unknown): string | null => {
  if (!data) return null;

  if (typeof data === "string") {
    const trimmed = data.trim();
    return trimmed || null;
  }

  const record = asRecord(data);
  if (!record) return null;

  const directMessage =
    getStringField(record, "message") ||
    getStringField(record, "detail") ||
    getStringField(record, "error");
  if (directMessage) return directMessage;

  for (const value of Object.values(record)) {
    if (Array.isArray(value) && typeof value[0] === "string") {
      return value[0];
    }
  }

  return null;
};

export const readApiResponse = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }

  const text = await response.text().catch(() => "");
  return text || null;
};

export const getLoginErrorMessage = (status: number, data: unknown) => {
  if (status === 401) {
    return "Nom d'utilisateur ou mot de passe incorrect";
  }

  if (status === 404) {
    return "Endpoint de connexion introuvable. Verifie l'URL du backend et le proxy /api/login.";
  }

  if (status >= 500) {
    return "Le serveur d'authentification est indisponible pour le moment.";
  }

  return (
    extractAuthErrorMessage(data) ?? "Connexion impossible pour le moment."
  );
};
