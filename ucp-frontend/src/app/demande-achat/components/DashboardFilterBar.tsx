"use client";

import { useState, useMemo, useRef, useEffect, type Dispatch, type SetStateAction } from "react";
import { ChevronDown, Filter, X } from "lucide-react";
import { type DemandeAchat } from "@/services/achats";
import { typeLabels, toDisplayLabel, sortDemandesByRecent, financementLabels, financementColors } from "./demandeAchatShared";

type FinancementTone = "UNKNOWN" | "FM" | "GAVI" | "BM" | "INTERNE" | "AUTRE";

type SerializedFinancementFilter = {
  source: string;
  sourceLabel: string;
  line: string;
  code: string;
  tone: FinancementTone;
  colorKey: string;
};

const financementCatalog = [
  {
    value: "SRPS_CS7_FM",
    family: "FM",
    sourceLabel: "SRPS / CS7 / Fonds Mondial",
    budgetLabel: "SRPS",
    subvention: "MDG-S-MOH-4041",
  },
  {
    value: "RSS3_GAVI",
    family: "GAVI",
    sourceLabel: "RSS3 / Alliance GAVI",
    budgetLabel: "RSS3",
    subvention: "MDG-HSS-3",
  },
  {
    value: "FAE_GAVI",
    family: "GAVI",
    sourceLabel: "FAE / Alliance GAVI",
    budgetLabel: "FAE",
    subvention: "MDG-FAE",
  },
  {
    value: "CDS_GAVI",
    family: "GAVI",
    sourceLabel: "CDS / Alliance GAVI",
    budgetLabel: "CDS",
    subvention: "MDG-COVID19-CDS",
  },
  {
    value: "VAR_GAVI",
    family: "GAVI",
    sourceLabel: "VAR / Alliance GAVI",
    budgetLabel: "VAR",
    subvention: "MDG-VAR Camp",
  },
  {
    value: "PARN2_BM",
    family: "BM",
    sourceLabel: "PARN2 / Banque Mondiale",
    budgetLabel: "PARN2",
    subvention: "P175110",
  },
  {
    value: "PPSB_BM",
    family: "BM",
    sourceLabel: "PPSB / Banque Mondiale",
    budgetLabel: "PPSB",
    subvention: "P174903",
  },
] as const;

const genericFinancementLabels: Record<string, string> = {
  BM: "Banque Mondiale",
  BANQUE_MONDIALE: "Banque Mondiale",
  FM: "Fonds Mondial",
  FONDS_MONDIAL: "Fonds Mondial",
  GAVI: "Alliance GAVI",
  FONDS_PROPRES: "Budget interne",
  AUTRES: "Autres partenaires",
};

const toSentenceCaseLabel = (value: string) => {
  const label = toDisplayLabel(value).toLowerCase();
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const normalizeFinancementToken = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");

const parseSerializedFinancement = (value: string): SerializedFinancementFilter | null => {
  try {
    const parsed = JSON.parse(value) as Partial<SerializedFinancementFilter>;
    if (
      typeof parsed.source === "string" &&
      typeof parsed.sourceLabel === "string" &&
      typeof parsed.line === "string" &&
      typeof parsed.code === "string" &&
      typeof parsed.tone === "string" &&
      typeof parsed.colorKey === "string"
    ) {
      return parsed as SerializedFinancementFilter;
    }
  } catch {}

  return null;
};

const getFallbackFinancementLabel = (value: string) =>
  genericFinancementLabels[value] ?? financementLabels[value] ?? toSentenceCaseLabel(value);

const buildFinancementLabel = (details: SerializedFinancementFilter) =>
  `${details.sourceLabel} - Ligne budgétaire: ${details.line} - Code: ${details.code}`;

export const getFinancementLabel = (value: string) => {
  const parsed = parseSerializedFinancement(value);
  return parsed ? buildFinancementLabel(parsed) : getFallbackFinancementLabel(value);
};

const getFinancementToneFromValue = (value: string): FinancementTone => {
  const normalized = normalizeFinancementToken(value);

  if (!normalized || normalized === "NONDEFINI") return "UNKNOWN";
  if (
    normalized === "FM" ||
    normalized.includes("FONDSMONDIAL") ||
    normalized.includes("SRPS") ||
    normalized.includes("CS7")
  ) {
    return "FM";
  }
  if (
    normalized === "GAVI" ||
    normalized.includes("RSS3") ||
    normalized.includes("FAE") ||
    normalized.includes("CDS") ||
    normalized.includes("VAR")
  ) {
    return "GAVI";
  }
  if (
    normalized === "BM" ||
    normalized.includes("BANQUEMONDIALE") ||
    normalized.includes("PARN2") ||
    normalized.includes("PPSB") ||
    normalized.includes("P175110") ||
    normalized.includes("P174903")
  ) {
    return "BM";
  }
  if (normalized.includes("FONDSPROPRES") || normalized.includes("BUDGETINTERNE")) {
    return "INTERNE";
  }
  if (normalized.includes("AUTRES")) {
    return "AUTRE";
  }

  return "AUTRE";
};

const getFinancementColorKey = (value: string) => {
  const parsed = parseSerializedFinancement(value);
  if (parsed) return parsed.colorKey;

  const tone = getFinancementToneFromValue(value);
  if (tone === "FM") return "SRPS_CS7_FM";
  if (tone === "GAVI") return "RSS3_GAVI";
  if (tone === "BM") return "PARN2_BM";
  if (tone === "INTERNE") return "FONDS_PROPRES";
  if (tone === "UNKNOWN") return "NON_DEFINI";
  return "AUTRES";
};

const getFinancementTone = (value: string): FinancementTone => {
  const parsed = parseSerializedFinancement(value);
  return parsed?.tone ?? getFinancementToneFromValue(value);
};

const getFinancementChipClasses = (value: string) => {
  const tone = getFinancementTone(value);

  if (tone === "UNKNOWN") {
    return "border-amber-200 bg-amber-50/50 text-amber-700 hover:bg-amber-100/80 hover:border-amber-300";
  }
  if (tone === "BM") {
    return "border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100/80 hover:border-blue-300";
  }
  if (tone === "FM") {
    return "border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100/80 hover:border-emerald-300";
  }
  if (tone === "GAVI") {
    return "border-sky-200 bg-sky-50/50 text-sky-700 hover:bg-sky-100/80 hover:border-sky-300";
  }
  if (tone === "INTERNE") {
    return "border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100/80 hover:border-indigo-300";
  }

  return "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100/80 hover:border-slate-300";
};

const findFinancementCatalogEntry = (
  source: string,
  line: string,
  code: string,
) => {
  const candidates = [source, line, code]
    .map((item) => item.trim())
    .filter(Boolean)
    .map(normalizeFinancementToken);

  if (candidates.length === 0) return null;

  return (
    financementCatalog.find((entry) => {
      const aliases = [
        entry.value,
        entry.family,
        entry.sourceLabel,
        entry.budgetLabel,
        entry.subvention,
      ].map(normalizeFinancementToken);

      return aliases.some((alias) => candidates.includes(alias));
    }) ?? null
  );
};

const getLineBudgetLabel = (
  rawLine: string,
  catalogEntry: (typeof financementCatalog)[number] | null,
) => {
  if (catalogEntry) return catalogEntry.budgetLabel;

  const trimmed = rawLine.trim();
  if (!trimmed) return "Non précisée";

  return toDisplayLabel(trimmed);
};

const getSourceDisplayLabel = (
  rawSource: string,
  catalogEntry: (typeof financementCatalog)[number] | null,
) => {
  if (catalogEntry) return catalogEntry.sourceLabel;

  const trimmed = rawSource.trim();
  if (!trimmed) return "Source non précisée";

  return getFallbackFinancementLabel(trimmed);
};

const buildFinancementFilterValue = (demande: DemandeAchat) => {
  const rawSource = demande.source_financement?.trim() ?? "";
  const rawLine = demande.ligne_budgetaire?.trim() ?? "";
  const rawCode = demande.numero_subvention?.trim() ?? "";

  if (!rawSource && !rawLine && !rawCode) {
    return "NON_DEFINI";
  }

  const catalogEntry = findFinancementCatalogEntry(rawSource, rawLine, rawCode);
  const tone = catalogEntry?.family ?? getFinancementToneFromValue(rawSource || rawLine || rawCode);
  const details: SerializedFinancementFilter = {
    source: catalogEntry?.value ?? (rawSource || "SOURCE_INCONNUE"),
    sourceLabel: getSourceDisplayLabel(rawSource, catalogEntry),
    line: getLineBudgetLabel(rawLine, catalogEntry),
    code: catalogEntry?.subvention ?? (rawCode || "Non précisé"),
    tone,
    colorKey:
      catalogEntry?.value ??
      (tone === "INTERNE"
        ? "FONDS_PROPRES"
        : tone === "UNKNOWN"
          ? "NON_DEFINI"
          : tone === "AUTRE"
            ? "AUTRES"
            : rawSource || "AUTRES"),
  };

  return JSON.stringify(details);
};

type DashboardFilterState = {
  allFinancements: string[];
  allTypes: string[];
  selectedFinancements: string[];
  setSelectedFinancements: Dispatch<SetStateAction<string[]>>;
  selectedTypes: string[];
  setSelectedTypes: Dispatch<SetStateAction<string[]>>;
};

type FilterDropdownProps = {
  title: string;
  options: string[];
  selected: string[];
  onChange: Dispatch<SetStateAction<string[]>>;
  getLabel: (value: string) => string;
  dotColorClass: string;
  compact?: boolean;
};

function FilterDropdown({ title, options, selected, onChange, getLabel, dotColorClass, compact = false }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between border transition-all font-sans text-left ${compact ? "h-9 px-2.5 rounded-xl" : "h-10 px-3 rounded-lg"} ${isOpen ? 'border-indigo-400 ring-2 ring-indigo-50 bg-white' : 'border-slate-200 bg-white hover:border-slate-300'}`}
      >
        <div className={`flex items-center min-w-0 ${compact ? "gap-1.5" : "gap-2"}`}>
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColorClass}`}></div>
          <span className={`${compact ? "text-[11px]" : "text-[12px]"} font-semibold text-slate-600 truncate`}>{title}</span>
          {selected.length > 0 && (
            <span className={`ml-1.5 rounded-md bg-indigo-50 text-indigo-700 font-black border border-indigo-100 ${compact ? "px-1.5 py-0.5 text-[9px]" : "px-1.5 py-0.5 text-[10px]"}`}>
              {selected.length}
            </span>
          )}
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute top-[calc(100%+4px)] left-0 w-full min-w-[200px] max-h-[280px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 ${compact ? "p-0.5" : "p-1"}`}>
          <div className="flex flex-col gap-0.5">
            {options.length === 0 && <div className="p-4 text-[11px] text-slate-400 text-center italic">Aucune donnée</div>}
            {options.map((opt: string) => {
              const isChecked = selected.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => {
                    if (isChecked) onChange(selected.filter((s) => s !== opt));
                    else onChange([...selected, opt]);
                  }}
                  className={`flex items-center gap-2.5 w-full rounded-lg text-left transition-colors ${compact ? "p-1.5" : "p-2"} ${isChecked ? 'bg-indigo-50 text-indigo-900 border border-indigo-100' : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-transparent'}`}
                >
                  <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${isChecked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                    {isChecked && (
                      <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`${compact ? "text-[11px] leading-4" : "text-[12px] leading-5"} font-medium whitespace-normal break-words ${isChecked ? 'font-bold' : ''}`}>
                    {getLabel(opt)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


export function useDashboardFilters(demandes: DemandeAchat[], options: { sortRecent?: boolean; typeField?: "type_demande" | "categorie_besoin" } = {}) {
  const { sortRecent = true, typeField = "type_demande" } = options;
  const [selectedFinancements, setSelectedFinancements] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const allFinancements = useMemo(() => {
    const processed = demandes.map(buildFinancementFilterValue);
    return Array.from(new Set(processed)).sort((a, b) => {
      if (a === "NON_DEFINI") return -1;
      if (b === "NON_DEFINI") return 1;
      return getFinancementLabel(a).localeCompare(getFinancementLabel(b), "fr");
    });
  }, [demandes]);

  const allTypes = useMemo(() => Array.from(new Set(demandes.map((d) => d[typeField]).filter((val): val is string => Boolean(val)))).sort(), [demandes, typeField]);

  const filteredDemandes = useMemo(() => {
    let result = [...demandes];
    if (selectedFinancements.length > 0) {
      result = result.filter((d) => {
        const val = buildFinancementFilterValue(d);
        return selectedFinancements.includes(val);
      });
    }
    if (selectedTypes.length > 0) result = result.filter((d) => selectedTypes.includes(d[typeField]!));
    return sortRecent ? sortDemandesByRecent(result) : result;
  }, [demandes, selectedFinancements, selectedTypes, sortRecent, typeField]);

  return { filteredDemandes, filterProps: { allFinancements, allTypes, selectedFinancements, setSelectedFinancements, selectedTypes, setSelectedTypes } };
}

export function DashboardFilterBar({ filterProps, compact = false }: { filterProps: DashboardFilterState; compact?: boolean }) {
  const { allFinancements, allTypes, selectedFinancements, setSelectedFinancements, selectedTypes, setSelectedTypes } = filterProps;
  const activeFiltersCount = selectedFinancements.length + selectedTypes.length;
  
  // We show filters even if empty to avoid layout shift, unless we want a specific loading state

  return (
    <div className={`flex flex-col ${compact ? "gap-3 mb-6" : "gap-4 mb-8"}`}>
      <div className={`relative z-20 overflow-visible rounded-xl border border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-slate-50 shadow-sm backdrop-blur-sm border-t-indigo-500/20 ${compact ? "p-1.5 sm:p-2" : "p-2 sm:p-2.5"}`}>
        <div className={`relative flex flex-col md:flex-row md:items-center ${compact ? "gap-1.5" : "gap-2"}`}>
          {/* Compact Label */}
          <div className={`flex items-center md:border-r md:border-slate-100 ${compact ? "gap-2 px-2.5 py-1 md:pr-3 md:mr-0.5" : "gap-2.5 px-3 py-1.5 md:pr-4 md:mr-1"}`}>
            <div className={`flex shrink-0 items-center justify-center rounded-lg bg-indigo-100/50 text-indigo-600 ${compact ? "h-7 w-7" : "h-8 w-8"}`}>
              <Filter className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
            </div>
            <div className="min-w-0">
              <span className={`block font-bold uppercase tracking-wider text-slate-400 ${compact ? "text-[9px]" : "text-[10px]"}`}>
                Filtres
              </span>
              <p className={`font-bold text-slate-700 whitespace-nowrap ${compact ? "text-[11px]" : "text-[12px]"}`}>
                Affiner la liste
              </p>
            </div>
          </div>

          {/* Filter Dropdowns Area */}
          <div className={`flex flex-1 flex-col sm:flex-row sm:items-center ${compact ? "gap-1.5" : "gap-2"}`}>
            <div className="relative z-20 flex-1">
              <FilterDropdown 
                title="Financement"
                options={allFinancements}
                selected={selectedFinancements}
                onChange={setSelectedFinancements}
                getLabel={getFinancementLabel}
                dotColorClass={selectedFinancements.length === 1 ? financementColors[getFinancementColorKey(selectedFinancements[0])] ?? "bg-amber-400" : "bg-amber-400"}
                compact={compact}
              />
            </div>
            <div className="relative z-10 flex-1">
              <FilterDropdown 
                title="Type de besoin"
                options={allTypes}
                selected={selectedTypes}
                onChange={setSelectedTypes}
                getLabel={(t: string) => typeLabels[t] ?? toDisplayLabel(t)}
                dotColorClass="bg-sky-400"
                compact={compact}
              />
            </div>
          </div>

          {/* Active Filters Summary & Reset */}
          <div className={`flex items-center gap-2 ${compact ? "pl-1" : "pl-2"}`}>
            {activeFiltersCount > 0 ? (
              <button 
                onClick={() => { setSelectedFinancements([]); setSelectedTypes([]); }}
                className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-white font-bold text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 ${compact ? "px-2.5 py-1.5 text-[11px]" : "px-3 py-2 text-[12px]"}`}
                title="Effacer tous les filtres"
              >
                <X className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
                <span>Tout effacer ({activeFiltersCount})</span>
              </button>
            ) : (
              <div className={`hidden xl:block ${compact ? "px-2" : "px-3"}`}>
                <span className={`font-medium text-slate-400 italic ${compact ? "text-[10px]" : "text-[11px]"}`}>Aucun filtre appliqué</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Chips Display */}
      {activeFiltersCount > 0 && (
        <div className={`flex flex-wrap items-center px-1 animate-in slide-in-from-top-1 duration-200 ${compact ? "gap-1.5" : "gap-2"}`}>
          {selectedFinancements.map((val) => (
            <button
              key={`fin-${val}`}
              onClick={() => setSelectedFinancements(prev => prev.filter(p => p !== val))}
              className={`group flex items-center gap-1.5 rounded-full border font-bold text-left transition-all ${compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"} ${getFinancementChipClasses(val)}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${financementColors[getFinancementColorKey(val)] ?? 'bg-slate-400'}`}></div>
              <span className="opacity-60 font-medium">Source:</span>
              <span className="whitespace-normal break-words">{getFinancementLabel(val)}</span>
              <X className="h-2.5 w-2.5 opacity-40 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
          {selectedTypes.map(val => (
            <button
              key={`type-${val}`}
              onClick={() => setSelectedTypes(prev => prev.filter(p => p !== val))}
              className={`group flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50/50 font-bold text-sky-700 transition-all hover:bg-sky-100/80 hover:border-sky-300 ${compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"}`}
            >
              <span className="opacity-60 font-medium">Type:</span>
              <span>{typeLabels[val] ?? toDisplayLabel(val)}</span>
              <X className="h-2.5 w-2.5 text-sky-400 group-hover:text-sky-600" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
