import { FinancingSource } from "@/types/procurement";
export type FinanceCatalogEntry = {
  optionKey: string;
  value: string;
  family: FinancingSource;
  familyLabel: string;
  sourceLabel: string;
  budgetLabel: string;
  subvention: string;
};
export const FINANCE_CATALOG: readonly FinanceCatalogEntry[] = [
  {
    optionKey: "SRPS_CS7_FM",
    value: "SRPS_CS7_FM",
    family: "GLOBAL_FUND",
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
    family: "WORLD_BANK",
    familyLabel: "Banque mondiale",
    sourceLabel: "Banque mondiale",
    budgetLabel: "PARN2",
    subvention: "P175110",
  },
  {
    optionKey: "PARN2_BM_PAD4924",
    value: "PARN2_BM",
    family: "WORLD_BANK",
    familyLabel: "Banque mondiale",
    sourceLabel: "Banque mondiale",
    budgetLabel: "PARN2",
    subvention: "PAD4924",
  },
  {
    optionKey: "PPSB_BM_P174903",
    value: "PPSB_BM",
    family: "WORLD_BANK",
    familyLabel: "Banque mondiale",
    sourceLabel: "Banque mondiale",
    budgetLabel: "PPSB",
    subvention: "P174903",
  },
] as const;