"use client";

export type FinanceFamily = "FM" | "GAVI" | "BM";

export type FinanceCatalogEntry = {
  optionKey: string;
  value: string;
  family: FinanceFamily;
  familyLabel: string;
  sourceLabel: string;
  budgetLabel: string;
  subvention: string;
};
export const FINANCE_CATALOG: readonly FinanceCatalogEntry[] = [
  {
    optionKey: "SRPS_CS7_FM",
    value: "SRPS_CS7_FM",
    family: "FM",
    familyLabel: "Fonds mondial",
    sourceLabel: "Fonds mondial",
    budgetLabel: "SRPS / CS7",
    subvention: "MDG-S MOH 4041",
  },
  {
    optionKey: "RSS3_GAVI",
    value: "RSS3_GAVI",
    family: "GAVI",
    familyLabel: "Alliance GAVI",
    sourceLabel: "Alliance GAVI",
    budgetLabel: "RSS3",
    subvention: "MDG-HSS-3",
  },
  {
    optionKey: "FAE_GAVI",
    value: "FAE_GAVI",
    family: "GAVI",
    familyLabel: "Alliance GAVI",
    sourceLabel: "Alliance GAVI",
    budgetLabel: "FAE",
    subvention: "MDG-FAE",
  },
  {
    optionKey: "CDS_GAVI",
    value: "CDS_GAVI",
    family: "GAVI",
    familyLabel: "Alliance GAVI",
    sourceLabel: "Alliance GAVI",
    budgetLabel: "CDS",
    subvention: "MDG-COVID19-CDS",
  },
  {
    optionKey: "VAR_GAVI",
    value: "VAR_GAVI",
    family: "GAVI",
    familyLabel: "Alliance GAVI",
    sourceLabel: "Alliance GAVI",
    budgetLabel: "VAR",
    subvention: "MDG-VAR Camp",
  },
  {
    optionKey: "PARN2_BM_P175110",
    value: "PARN2_BM",
    family: "BM",
    familyLabel: "Banque mondiale",
    sourceLabel: "Banque mondiale",
    budgetLabel: "PARN2",
    subvention: "P175110",
  },
  {
    optionKey: "PARN2_BM_PAD4924",
    value: "PARN2_BM",
    family: "BM",
    familyLabel: "Banque mondiale",
    sourceLabel: "Banque mondiale",
    budgetLabel: "PARN2",
    subvention: "PAD4924",
  },
  {
    optionKey: "PPSB_BM_P174903",
    value: "PPSB_BM",
    family: "BM",
    familyLabel: "Banque mondiale",
    sourceLabel: "Banque mondiale",
    budgetLabel: "PPSB",
    subvention: "P174903",
  },
] as const;

const normalizeFinanceToken = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");

export const getFinanceCatalogByValue = (
  value?: string | null,
  subvention?: string | null,
  budgetLabel?: string | null,
) =>
  FINANCE_CATALOG.find(
    (item) =>
      item.value === (value || "").trim() &&
      (!subvention || item.subvention === subvention.trim()) &&
      (!budgetLabel || item.budgetLabel === budgetLabel.trim()),
  ) ??
  FINANCE_CATALOG.find((item) => item.value === (value || "").trim()) ??
  null;

export const getFinanceCatalogByFamily = (family?: string | null) =>
  FINANCE_CATALOG.filter((item) => item.family === (family || "").trim());

export const getFinanceCatalogByOptionKey = (optionKey?: string | null) =>
  FINANCE_CATALOG.find((item) => item.optionKey === (optionKey || "").trim()) ?? null;

export const findFinanceCatalogEntry = (
  value?: string | null,
  subvention?: string | null,
  budgetLabel?: string | null,
) => {
  const directMatch = getFinanceCatalogByValue(value, subvention, budgetLabel);
  if (directMatch) {
    return directMatch;
  }

  const normalized = normalizeFinanceToken((value || "").trim());
  if (!normalized && !subvention && !budgetLabel) {
    return null;
  }

  return (
    FINANCE_CATALOG.find((entry) => {
      const aliases = [
        entry.value,
        entry.family,
        entry.familyLabel,
        entry.sourceLabel,
        entry.budgetLabel,
        entry.subvention,
        entry.optionKey,
      ].map(normalizeFinanceToken);
      const subventionMatches = !subvention || entry.subvention === subvention.trim();
      const lineMatches = !budgetLabel || entry.budgetLabel === budgetLabel.trim();
      return aliases.includes(normalized) && subventionMatches && lineMatches;
    }) ?? null
  );
};
