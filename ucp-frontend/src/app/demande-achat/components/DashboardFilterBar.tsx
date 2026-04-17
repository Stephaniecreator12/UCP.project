"use client";

import { useState, useMemo, useRef, useEffect, type Dispatch, type SetStateAction } from "react";
import { ChevronDown, Filter, X } from "lucide-react";
import { type DemandeAchat } from "@/services/achats";
import { typeLabels, toDisplayLabel, sortDemandesByRecent, financementLabels, financementColors } from "./demandeAchatShared";

const toSentenceCaseLabel = (value: string) => {
  const label = toDisplayLabel(value).toLowerCase();
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export const getFinancementLabel = (value: string) =>
  financementLabels[value] ?? toSentenceCaseLabel(value);

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
};

function FilterDropdown({ title, options, selected, onChange, getLabel, dotColorClass }: FilterDropdownProps) {
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
        className={`w-full flex items-center justify-between h-10 px-3 rounded-lg border transition-all font-sans text-left ${isOpen ? 'border-indigo-400 ring-2 ring-indigo-50 bg-white' : 'border-slate-200 bg-white hover:border-slate-300'}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColorClass}`}></div>
          <span className="text-[12px] font-semibold text-slate-600 truncate">{title}</span>
          {selected.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black border border-indigo-100">
              {selected.length}
            </span>
          )}
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full min-w-[200px] max-h-[280px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 animate-in fade-in zoom-in-95 duration-100">
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
                  className={`flex items-center gap-2.5 w-full p-2 rounded-lg text-left transition-colors ${isChecked ? 'bg-indigo-50 text-indigo-900 border border-indigo-100' : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-transparent'}`}
                >
                  <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${isChecked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                    {isChecked && (
                      <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-[12px] font-medium truncate ${isChecked ? 'font-bold' : ''}`}>
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
    const raw = Array.from(new Set(demandes.map((d) => d.source_financement)));
    const processed = raw.map(val => val || "NON_DEFINI");
    return Array.from(new Set(processed)).sort((a, b) => {
      if (a === "NON_DEFINI") return -1;
      if (b === "NON_DEFINI") return 1;
      return a.localeCompare(b);
    });
  }, [demandes]);

  const allTypes = useMemo(() => Array.from(new Set(demandes.map((d) => d[typeField]).filter((val): val is string => Boolean(val)))).sort(), [demandes, typeField]);

  const filteredDemandes = useMemo(() => {
    let result = [...demandes];
    if (selectedFinancements.length > 0) {
      result = result.filter((d) => {
        const val = d.source_financement || "NON_DEFINI";
        return selectedFinancements.includes(val);
      });
    }
    if (selectedTypes.length > 0) result = result.filter((d) => selectedTypes.includes(d[typeField]!));
    return sortRecent ? sortDemandesByRecent(result) : result;
  }, [demandes, selectedFinancements, selectedTypes, sortRecent, typeField]);

  return { filteredDemandes, filterProps: { allFinancements, allTypes, selectedFinancements, setSelectedFinancements, selectedTypes, setSelectedTypes } };
}

export function DashboardFilterBar({ filterProps }: { filterProps: DashboardFilterState }) {
  const { allFinancements, allTypes, selectedFinancements, setSelectedFinancements, selectedTypes, setSelectedTypes } = filterProps;
  const activeFiltersCount = selectedFinancements.length + selectedTypes.length;
  
  // We show filters even if empty to avoid layout shift, unless we want a specific loading state

  return (
    <div className="flex flex-col gap-4 mb-8">
      <div className="relative z-20 overflow-visible rounded-xl border border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-slate-50 p-2 shadow-sm sm:p-2.5 backdrop-blur-sm border-t-indigo-500/20">
        <div className="relative flex flex-col gap-2 md:flex-row md:items-center">
          {/* Compact Label */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 md:border-r md:border-slate-100 md:pr-4 md:mr-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100/50 text-indigo-600">
              <Filter className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Filtres
              </span>
              <p className="text-[12px] font-bold text-slate-700 whitespace-nowrap">
                Affiner la liste
              </p>
            </div>
          </div>

          {/* Filter Dropdowns Area */}
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative z-20 flex-1">
              <FilterDropdown 
                title="Financement"
                options={allFinancements}
                selected={selectedFinancements}
                onChange={setSelectedFinancements}
                getLabel={getFinancementLabel}
                dotColorClass={selectedFinancements.length === 1 ? financementColors[selectedFinancements[0]] ?? "bg-amber-400" : "bg-amber-400"}
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
              />
            </div>
          </div>

          {/* Active Filters Summary & Reset */}
          <div className="flex items-center gap-2 pl-2">
            {activeFiltersCount > 0 ? (
              <button 
                onClick={() => { setSelectedFinancements([]); setSelectedTypes([]); }}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-bold text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"
                title="Effacer tous les filtres"
              >
                <X className="h-3.5 w-3.5" />
                <span>Tout effacer ({activeFiltersCount})</span>
              </button>
            ) : (
              <div className="hidden xl:block px-3">
                <span className="text-[11px] font-medium text-slate-400 italic">Aucun filtre appliqué</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Chips Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-1 animate-in slide-in-from-top-1 duration-200">
          {selectedFinancements.map((val) => (
            <button
              key={`fin-${val}`}
              onClick={() => setSelectedFinancements(prev => prev.filter(p => p !== val))}
              className={`group flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-all ${
                val === 'NON_DEFINI' 
                ? 'border-amber-200 bg-amber-50/50 text-amber-700 hover:bg-amber-100/80 hover:border-amber-300'
                : val === 'BANQUE_MONDIALE'
                ? 'border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100/80 hover:border-blue-300'
                : val === 'FONDS_MONDIAL'
                ? 'border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100/80 hover:border-emerald-300'
                : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100/80 hover:border-slate-300'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${financementColors[val] ?? 'bg-slate-400'}`}></div>
              <span className="opacity-60 font-medium">Source:</span>
              <span>{getFinancementLabel(val)}</span>
              <X className="h-2.5 w-2.5 opacity-40 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
          {selectedTypes.map(val => (
            <button
              key={`type-${val}`}
              onClick={() => setSelectedTypes(prev => prev.filter(p => p !== val))}
              className="group flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50/50 px-2.5 py-1 text-[11px] font-bold text-sky-700 transition-all hover:bg-sky-100/80 hover:border-sky-300"
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
