export type PersonnelDirectoryOption = {
  id: string;
  label: string;
  subtitle?: string;
};

const readErrorMessage = async (response: Response): Promise<string> => {
  const payload = await response.json().catch(() => null);

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (typeof record.error === "string" && record.error.trim()) {
      return record.error.trim();
    }

    if (typeof record.detail === "string" && record.detail.trim()) {
      return record.detail.trim();
    }
  }

  return "Annuaire du personnel indisponible.";
};

export async function listExternalPersonnel(): Promise<
  PersonnelDirectoryOption[]
> {
  const response = await fetch("/api/users/external-personnel/", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload: unknown = await response.json().catch(() => []);

  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.filter((item): item is PersonnelDirectoryOption => {
    if (!item || typeof item !== "object") return false;
    const record = item as Record<string, unknown>;
    return typeof record.id === "string" && typeof record.label === "string";
  });
}
