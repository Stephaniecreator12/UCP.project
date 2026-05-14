"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { FINANCE_CATALOG, findFinanceCatalogEntry } from "@/lib/financeCatalog";

type FinancementTone = "UNKNOWN" | "FM" | "GAVI" | "BM" | "INTERNE" | "AUTRE";

type SerializedFinancementFilter = {
  source: string;
  sourceLabel: string;
  line: string;
  code: string;
  tone: FinancementTone;
  colorKey: string;
};

const genericFinancementLabels: Record<string, string> = {
  BM: "Banque Mondiale",
  BANQUE_MONDIALE: "Banque Mondiale",
  FM: "Fonds Mondial",
  FONDS_MONDIAL: "Fonds Mondial",
  GAVI: "Alliance GAVI",
  FONDS_PROPRES: "Budget interne",
  AUTRES: "Autres partenaires",
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
      typeof parsed.tone === "string"
    ) {
      const validTones: FinancementTone[] = ["UNKNOWN", "FM", "GAVI", "BM", "INTERNE", "AUTRE"];
      const tone = parsed.tone as FinancementTone;
      if (validTones.includes(tone)) {
        return {
          source: parsed.source,
          sourceLabel: parsed.sourceLabel,
          line: parsed.line,
          code: parsed.code,
          tone: tone,
          colorKey: parsed.colorKey || "NON_DEFINI",
        };
      }
    }
  } catch {}
  return null;
};

const getFallbackFinancementLabel = (value: string) => {
  return genericFinancementLabels[value] ?? value;
};

const buildFinancementLabel = (details: SerializedFinancementFilter) =>
  `${details.sourceLabel} - ${details.line} - ${details.code}`;

export const getFinancementLabel = (value: string) => {
  const parsed = parseSerializedFinancement(value);
  return parsed ? buildFinancementLabel(parsed) : getFallbackFinancementLabel(value);
};

const getFinancementToneFromValue = (value: string): FinancementTone => {
  const normalized = normalizeFinancementToken(value);

  if (!normalized || normalized === "NONDEFINI") return "UNKNOWN";
  if (normalized === "FM" || normalized.includes("FONDSMONDIAL")) return "FM";
  if (normalized === "GAVI" || normalized.includes("RSS3")) return "GAVI";
  if (normalized === "BM" || normalized.includes("BANQUEMONDIALE")) return "BM";
  if (normalized.includes("FONDSPROPRES")) return "INTERNE";
  return "AUTRE";
};

export const financementColors: Record<string, string> = {
  SRPS_CS7_FM: "bg-amber-400",
  RSS3_GAVI: "bg-emerald-400",
  FAE_GAVI: "bg-emerald-400",
  CDS_GAVI: "bg-emerald-400",
  VAR_GAVI: "bg-emerald-400",
  PARN2_BM: "bg-blue-400",
  PPSB_BM: "bg-blue-400",
  FONDS_PROPRES: "bg-purple-400",
  NON_DEFINI: "bg-slate-400",
  AUTRES: "bg-slate-400",
};

const buildFinancementFilterValue = (
  source: unknown,
  ligneBudgetaire: unknown,
  numeroSubvention: unknown
) => {
  // Safe trim function that handles non-string values
  const safeTrim = (value: unknown): string => {
    if (Array.isArray(value)) {
      const first = value.find((item) => typeof item === "string" && item.trim());
      return typeof first === "string" ? first.trim() : "";
    }
    if (typeof value === "string") return value.trim();
    return "";
  };

  const rawSource = safeTrim(source);
  const rawLine = safeTrim(ligneBudgetaire);
  const rawCode = safeTrim(numeroSubvention);

  if (!rawSource && !rawLine && !rawCode) {
    return "NON_DEFINI";
  }

  const normalizedSource = normalizeFinancementToken(rawSource);
  const catalogEntry =
    findFinanceCatalogEntry(rawSource) ||
    FINANCE_CATALOG.find((entry) => normalizeFinancementToken(entry.family) === normalizedSource) ||
    null;

  const tone: FinancementTone =
    catalogEntry?.family ?? getFinancementToneFromValue(rawSource || rawLine || rawCode);
  
  const details: SerializedFinancementFilter = {
    source: catalogEntry?.value ?? (rawSource || "SOURCE_INCONNUE"),
    sourceLabel: catalogEntry?.sourceLabel ?? (rawSource || "Source non précisée"),
    line: rawLine || catalogEntry?.budgetLabel || "Non précisée",
    code: rawCode || catalogEntry?.subvention || "Non précisé",
    tone: tone,
    colorKey:
      catalogEntry?.value ??
      (tone === "INTERNE"
        ? "FONDS_PROPRES"
        : tone === "UNKNOWN"
        ? "NON_DEFINI"
        : rawSource || "AUTRES"),
  };

  return JSON.stringify(details);
};

type FilterDropdownProps = {
  title: string;
  options: string[];
  selected: string[];
  onChange: (value: string[]) => void;
  getLabel: (value: string) => string;
  dotColorClass: string;
  compact?: boolean;
};

function FilterDropdown({
  title,
  options,
  selected,
  onChange,
  getLabel,
  dotColorClass,
  compact = false,
}: FilterDropdownProps) {
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
        className={`w-full flex items-center justify-between border text-left transition-colors ${
          compact ? "h-9 px-2.5 rounded-lg" : "h-10 px-3 rounded-xl"
        } ${
          isOpen
            ? "border-slate-300 bg-white"
            : "border-slate-200 bg-white hover:border-slate-300"
        }`}
      >
        <div className={`flex items-center min-w-0 ${compact ? "gap-1.5" : "gap-2"}`}>
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColorClass}`}></div>
          <span
            className={`${
              compact ? "text-[11px]" : "text-[12px]"
            } font-semibold text-slate-600 truncate`}
          >
            {title}
          </span>
          {selected.length > 0 && (
            <span
              className={`ml-1.5 rounded-full border border-slate-200 bg-slate-50 font-semibold text-slate-600 ${
                compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"
              }`}
            >
              {selected.length}
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute top-[calc(100%+4px)] left-0 z-50 max-h-[280px] w-full min-w-[200px] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg ${
            compact ? "p-0.5" : "p-1"
          }`}
        >
          <div className="flex flex-col gap-0.5">
            {options.length === 0 && (
              <div className="p-4 text-[11px] text-slate-400 text-center italic">
                Aucune donnée
              </div>
            )}
            {options.map((opt: string) => {
              const isChecked = selected.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => {
                    if (isChecked) onChange(selected.filter((s) => s !== opt));
                    else onChange([...selected, opt]);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-lg border text-left transition-colors ${
                    compact ? "p-1.5" : "p-2"
                  } ${
                    isChecked
                      ? "border-slate-200 bg-slate-50 text-slate-900"
                      : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
                      isChecked
                        ? "border-slate-700 bg-slate-700"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isChecked && (
                      <svg
                        className="h-2.5 w-2.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`${
                      compact ? "text-[11px] leading-4" : "text-[12px] leading-5"
                    } font-medium whitespace-normal break-words ${
                      isChecked ? "font-bold" : ""
                    }`}
                  >
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

type UseTdrStFiltersProps<TDocument> = {
  documents: TDocument[];
  getSourceFinancement: (doc: TDocument) => unknown;
  getLigneBudgetaire: (doc: TDocument) => unknown;
  getNumeroSubvention: (doc: TDocument) => unknown;
  getDocumentType: (doc: TDocument) => unknown;
  getFilterDate: (doc: TDocument) => unknown;
};

const toInputDateValue = (value: unknown): string | null => {
  if (!value) return null;
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return null;
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function useTdrStFilters<TDocument extends { statut?: string }>({
  documents,
  getSourceFinancement,
  getLigneBudgetaire,
  getNumeroSubvention,
  getDocumentType,
  getFilterDate,
}: UseTdrStFiltersProps<TDocument>) {
  const [selectedFinancements, setSelectedFinancements] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedDocumentTypes, setSelectedDocumentTypes] = useState<string[]>([]);

  const allFinancements = useMemo(() => {
    const processed = documents.map((doc) =>
      buildFinancementFilterValue(
        getSourceFinancement(doc),
        getLigneBudgetaire(doc),
        getNumeroSubvention(doc)
      )
    );
    return Array.from(new Set(processed)).sort((a, b) => {
      if (a === "NON_DEFINI") return -1;
      if (b === "NON_DEFINI") return 1;
      return getFinancementLabel(a).localeCompare(getFinancementLabel(b), "fr");
    });
  }, [documents, getSourceFinancement, getLigneBudgetaire, getNumeroSubvention]);

  const statusOptions = useMemo(() => {
    return ["VALIDE", "REJETE", "SUSPENDU"];
  }, []);

  const documentTypeOptions = useMemo(() => {
    const processed = documents
      .map((doc) => String(getDocumentType(doc) ?? "").trim())
      .filter(Boolean);
    const unique = Array.from(new Set(processed));
    return unique.sort((a, b) => {
      if (a === "TDR") return -1;
      if (b === "TDR") return 1;
      return a.localeCompare(b, "fr");
    });
  }, [documents, getDocumentType]);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      VALIDE: "Validé",
      REJETE: "Rejeté",
      SUSPENDU: "Suspendu",
    };
    return labels[status] ?? status;
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      TDR: "TDR",
      ST: "ST",
    };
    return labels[type] ?? type;
  };

  const filteredDocuments = useMemo(() => {
    let result = [...documents];

    if (selectedFinancements.length > 0) {
      result = result.filter((doc) => {
        const val = buildFinancementFilterValue(
          getSourceFinancement(doc),
          getLigneBudgetaire(doc),
          getNumeroSubvention(doc)
        );
        return selectedFinancements.includes(val);
      });
    }

    if (selectedStatuses.length > 0) {
      result = result.filter((doc) => selectedStatuses.includes(doc.statut ?? ""));
    }

    if (selectedDate) {
      result = result.filter((doc) => toInputDateValue(getFilterDate(doc)) === selectedDate);
    }

    if (selectedDocumentTypes.length > 0) {
      result = result.filter((doc) =>
        selectedDocumentTypes.includes(String(getDocumentType(doc) ?? "").trim()),
      );
    }

    return result;
  }, [
    documents,
    selectedFinancements,
    selectedStatuses,
    selectedDate,
    selectedDocumentTypes,
    getSourceFinancement,
    getLigneBudgetaire,
    getNumeroSubvention,
    getDocumentType,
    getFilterDate,
  ]);

  return {
    filteredDocuments,
    filterProps: {
      allFinancements,
      statusOptions,
      documentTypeOptions,
      selectedFinancements,
      setSelectedFinancements,
      selectedStatuses,
      setSelectedStatuses,
      selectedDate,
      setSelectedDate,
      selectedDocumentTypes,
      setSelectedDocumentTypes,
      getStatusLabel,
      getDocumentTypeLabel,
    },
  };
}

export function TdrStFilterBar({
  filterProps,
  compact = false,
}: {
  filterProps: {
    allFinancements: string[];
    statusOptions: string[];
    documentTypeOptions: string[];
    selectedFinancements: string[];
    setSelectedFinancements: (value: string[]) => void;
    selectedStatuses: string[];
    setSelectedStatuses: (value: string[]) => void;
    selectedDate: string;
    setSelectedDate: (value: string) => void;
    selectedDocumentTypes: string[];
    setSelectedDocumentTypes: (value: string[]) => void;
    getStatusLabel: (status: string) => string;
    getDocumentTypeLabel: (type: string) => string;
  };
  compact?: boolean;
}) {
  const {
    allFinancements,
    statusOptions,
    documentTypeOptions,
    selectedFinancements,
    setSelectedFinancements,
    selectedStatuses,
    setSelectedStatuses,
    selectedDate,
    setSelectedDate,
    selectedDocumentTypes,
    setSelectedDocumentTypes,
    getStatusLabel,
    getDocumentTypeLabel,
  } = filterProps;

  const activeFiltersCount =
    selectedFinancements.length + selectedStatuses.length + selectedDocumentTypes.length + (selectedDate ? 1 : 0);

  const getFinancementDotColor = () => {
    if (selectedFinancements.length === 1) {
      try {
        const parsed = JSON.parse(selectedFinancements[0]);
        return financementColors[parsed.colorKey] ?? "bg-amber-400";
      } catch {
        return "bg-amber-400";
      }
    }
    return "bg-amber-400";
  };

  return (
    <div className={`flex flex-col ${compact ? "gap-3 mb-6" : "gap-4 mb-8"}`}>
      <div
        className={`relative z-20 overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm ${
          compact ? "p-1.5 sm:p-2" : "p-2 sm:p-2.5"
        }`}
      >
        <div
          className={`relative flex flex-col md:flex-row md:items-center ${
            compact ? "gap-1.5" : "gap-2"
          }`}
        >
          <div
            className={`flex items-center md:border-r md:border-slate-100 ${
              compact
                ? "gap-2 px-2.5 py-1 md:pr-3 md:mr-0.5"
                : "gap-2.5 px-3 py-1.5 md:pr-4 md:mr-1"
            }`}
          >
            <div
              className={`flex shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 ${
                compact ? "h-7 w-7" : "h-8 w-8"
              }`}
            >
              <svg
                className={compact ? "h-3.5 w-3.5" : "h-4 w-4"}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <span
                className={`block font-bold uppercase tracking-wider text-slate-400 ${
                  compact ? "text-[9px]" : "text-[10px]"
                }`}
              >
                Filtres
              </span>
              <p
                className={`font-bold text-slate-700 whitespace-nowrap ${
                  compact ? "text-[11px]" : "text-[12px]"
                }`}
              >
                Affiner la liste
              </p>
            </div>
          </div>

          <div
            className={`flex flex-1 flex-col sm:flex-row sm:items-center ${
              compact ? "gap-1.5" : "gap-2"
            }`}
          >
            <div className="relative z-20 flex-1">
              <FilterDropdown
                title="Source / ligne / subvention"
                options={allFinancements}
                selected={selectedFinancements}
                onChange={setSelectedFinancements}
                getLabel={getFinancementLabel}
                dotColorClass={getFinancementDotColor()}
                compact={compact}
              />
            </div>
            <div className="relative z-10 flex-1">
              <FilterDropdown
                title="Statut"
                options={statusOptions}
                selected={selectedStatuses}
                onChange={setSelectedStatuses}
                getLabel={getStatusLabel}
                dotColorClass="bg-sky-400"
                compact={compact}
              />
            </div>
            <div className="relative z-[5] flex-1">
              <div
                className={`flex h-10 items-center rounded-xl border border-slate-200 bg-white transition-colors hover:border-slate-300 ${
                  compact ? "px-2.5" : "px-3"
                }`}
              >
                <div className={`mr-2 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0`}></div>
                <label className="flex min-w-0 flex-1 items-center gap-2">
                  <span className={`${compact ? "text-[11px]" : "text-[12px]"} font-semibold text-slate-600 whitespace-nowrap`}>
                    Date
                  </span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className={`w-full min-w-0 bg-transparent text-slate-700 outline-none ${
                      compact ? "text-[11px]" : "text-[12px]"
                    }`}
                  />
                </label>
              </div>
            </div>
            <div className="relative z-[4] flex-1">
              <FilterDropdown
                title="Type de document"
                options={documentTypeOptions}
                selected={selectedDocumentTypes}
                onChange={setSelectedDocumentTypes}
                getLabel={getDocumentTypeLabel}
                dotColorClass="bg-violet-400"
                compact={compact}
              />
            </div>
          </div>

          <div className={`flex items-center gap-2 ${compact ? "pl-1" : "pl-2"}`}>
            {activeFiltersCount > 0 ? (
              <button
                onClick={() => {
                  setSelectedFinancements([]);
                  setSelectedStatuses([]);
                  setSelectedDate("");
                  setSelectedDocumentTypes([]);
                }}
                className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 ${
                  compact ? "px-2.5 py-1.5 text-[11px]" : "px-3 py-2 text-[12px]"
                }`}
                title="Effacer tous les filtres"
              >
                <svg
                  className={compact ? "h-3 w-3" : "h-3.5 w-3.5"}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span>Tout effacer ({activeFiltersCount})</span>
              </button>
            ) : (
              <div className={`hidden xl:block ${compact ? "px-2" : "px-3"}`}>
                <span
                  className={`font-medium text-slate-400 italic ${
                    compact ? "text-[10px]" : "text-[11px]"
                  }`}
                >
                  Aucun filtre appliqué
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
