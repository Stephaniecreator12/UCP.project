export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PersonnelOption = {
  id: string;
  label: string;
  subtitle?: string;
};

const COLLECTION_KEYS = [
  "results",
  "data",
  "items",
  "personnels",
  "personnel",
  "users",
  "agents",
  "employees",
  "rows",
];

const getExternalPersonnelUrl = (): string =>
  process.env.EXTERNAL_PERSONNEL_API_URL ||
  process.env.PERSONNEL_DIRECTORY_API_URL ||
  "";

const getExternalPersonnelToken = (): string =>
  process.env.EXTERNAL_PERSONNEL_API_TOKEN ||
  process.env.PERSONNEL_DIRECTORY_API_TOKEN ||
  "";

const readString = (record: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return "";
};

const pickCollection = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const record = payload as Record<string, unknown>;

  for (const key of COLLECTION_KEYS) {
    const value = record[key];
    if (Array.isArray(value)) return value;
  }

  for (const value of Object.values(record)) {
    if (Array.isArray(value)) return value;

    if (value && typeof value === "object") {
      for (const nestedValue of Object.values(value as Record<string, unknown>)) {
        if (Array.isArray(nestedValue)) return nestedValue;
      }
    }
  }

  return [];
};

const buildLabel = (record: Record<string, unknown>): string => {
  const directName = readString(record, [
    "full_name",
    "fullName",
    "display_name",
    "displayName",
    "nom_complet",
    "name",
  ]);

  if (directName) return directName;

  const nom = readString(record, ["nom", "last_name", "lastname", "surname"]);
  const prenom = readString(record, ["prenom", "first_name", "firstname", "given_name"]);
  const combined = [nom, prenom].filter(Boolean).join(" ").trim();

  if (combined) return combined;

  return readString(record, ["username", "login", "email", "matricule", "code"]);
};

const normalizePersonnelItem = (item: unknown): PersonnelOption | null => {
  if (!item || typeof item !== "object") return null;

  const record = item as Record<string, unknown>;
  const label = buildLabel(record);

  if (!label) return null;

  const id =
    readString(record, [
      "id",
      "user_id",
      "personnel_id",
      "employee_id",
      "agent_id",
      "matricule",
      "uuid",
      "code",
    ]) || label;

  const subtitle = readString(record, [
    "service",
    "service_name",
    "department",
    "department_name",
    "unite",
    "unit",
    "direction",
    "fonction",
    "job_title",
    "email",
  ]);

  return {
    id,
    label,
    subtitle: subtitle || undefined,
  };
};

const sortPersonnelOptions = (left: PersonnelOption, right: PersonnelOption) => {
  const labelCompare = left.label.localeCompare(right.label, "fr", {
    sensitivity: "base",
  });

  if (labelCompare !== 0) return labelCompare;

  return (left.subtitle || "").localeCompare(right.subtitle || "", "fr", {
    sensitivity: "base",
  });
};

export async function GET(): Promise<Response> {
  const upstreamUrl = getExternalPersonnelUrl();

  if (!upstreamUrl) {
    return Response.json(
      { error: "EXTERNAL_PERSONNEL_API_URL manquante." },
      { status: 503 },
    );
  }

  const headers = new Headers({
    Accept: "application/json",
  });

  const bearerToken = getExternalPersonnelToken();
  if (bearerToken) {
    headers.set("Authorization", `Bearer ${bearerToken}`);
  }

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return Response.json(
      { error: "Serveur personnel externe indisponible.", detail },
      { status: 502 },
    );
  }

  const rawBody = await upstream.text().catch(() => "");

  if (!upstream.ok) {
    return Response.json(
      {
        error: "La recuperation du personnel externe a echoue.",
        status: upstream.status,
        detail: rawBody.slice(0, 500),
      },
      { status: 502 },
    );
  }

  let payload: unknown = [];
  try {
    payload = rawBody ? JSON.parse(rawBody) : [];
  } catch {
    return Response.json(
      {
        error: "La reponse du serveur personnel n'est pas un JSON valide.",
        detail: rawBody.slice(0, 500),
      },
      { status: 502 },
    );
  }

  const personnel = pickCollection(payload)
    .map(normalizePersonnelItem)
    .filter((option): option is PersonnelOption => option !== null)
    .sort(sortPersonnelOptions);

  return Response.json(personnel);
}
