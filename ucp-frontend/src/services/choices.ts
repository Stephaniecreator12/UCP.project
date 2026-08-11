import { API_BASE_URL } from "./api";

export interface ReferenceChoiceOption {
  code: string;
  label: string;
}

export type ReferenceChoices = Record<string, ReferenceChoiceOption[]>;

const TTL_MS = 5 * 60 * 1000;

let cached: { data: ReferenceChoices | null; at: number } = { data: null, at: 0 };

export async function fetchReferenceChoices(group?: string): Promise<ReferenceChoices> {
  const now = Date.now();
  if (!group && cached.data && now - cached.at < TTL_MS) {
    return cached.data;
  }

  const url = `${API_BASE_URL}/api/common/choices/${group ? `?group=${encodeURIComponent(group)}` : ""}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    console.error(
      `[reference-choices] GET ${url} → HTTP ${response.status}. Les options statiques de secours sont utilisées.`,
    );
    throw new Error(`Impossible de charger les choix de référence (HTTP ${response.status})`);
  }
  const data = (await response.json()) as ReferenceChoices;
  if (!group && (!data || typeof data !== "object")) {
    console.error("[reference-choices] Réponse inattendue, options statiques utilisées.");
    throw new Error("Réponse inattendue de l'API des choix de référence");
  }

  if (!group) {
    cached = { data, at: now };
  }
  return data;
}

export function getChoiceLabel(
  choices: ReferenceChoiceOption[],
  code?: string | null,
): string {
  if (!code) return "";
  return choices.find((choice) => choice.code === code)?.label ?? code;
}
