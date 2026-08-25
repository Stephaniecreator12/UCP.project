"use client";

import { Search, X } from "lucide-react";
import { useReferenceChoices } from "@/hooks/useReferenceChoices";
import { getChoiceLabel } from "@/services/choices";

type FundingSource = "Fonds mondial" | "Banque mondiale" | "Alliance GAVI";

const STATUT_TDR_ST_FALLBACK = [
  { code: "VALIDE", label: "Validé" },
  { code: "REJETE", label: "Rejeté" },
  { code: "SUSPENDU", label: "Suspendu" },
];

type DashboardFilterBarProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  fundingFilter: FundingSource | "TOUS";
  setFundingFilter: (filter: FundingSource | "TOUS") => void;
  fundingOptions: FundingSource[];
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  statusOptions: string[];
  onReset: () => void;
  isAuditeur: boolean;
};

export function DashboardFilterBar({
  searchQuery,
  setSearchQuery,
  fundingFilter,
  setFundingFilter,
  fundingOptions,
  statusFilter,
  setStatusFilter,
  statusOptions,
  onReset,
  isAuditeur,
}: DashboardFilterBarProps) {
  const statutChoices = useReferenceChoices("STATUT_TDR_ST", STATUT_TDR_ST_FALLBACK);

  if (!isAuditeur) return null;

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="space-y-4">
        {/* Search */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Recherche
          </label>
          <div className="relative mt-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Numéro, intitulé, PTBA, unité..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-800 shadow-sm focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters row */}
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Financement
            </label>
            <select
              value={fundingFilter}
              onChange={(e) => setFundingFilter(e.target.value as FundingSource | "TOUS")}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
            >
              <option value="TOUS">Tous</option>
              {fundingOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Statut
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
            >
              <option value="TOUS">Tous</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {getChoiceLabel(statutChoices, s)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={onReset}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}