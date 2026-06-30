"use client";

import { useState } from "react";

import {
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";

import {
  type DemandePrimaryAction,
  formatDate,
  formatMoney,
  getCompactNeedLabel,
  getDemandePrimaryAction,
  getDemandeTrackingStageLabel,
  typeLabels,
} from "@/app/personnel/demande-achat/components/demandeAchatShared";
import { type UserProfile } from "@/services/auth";
import { type DemandeAchat } from "@/services/achats";

type DashboardTableViewProps = {
  title: string;
  items: DemandeAchat[];
  query: string;
  currentUser: UserProfile | null;
  emptyText?: string;
  onOpenDetail: (id: number) => void;
  onRunAction: (demande: DemandeAchat, action: DemandePrimaryAction) => void;
};

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
};

const PAGE_SIZE = 5;

export default function DashboardTableView({
  title,
  items,
  query,
  currentUser,
  emptyText = "Aucun dossier visible dans cette vue.",
  onOpenDetail,
  onRunAction,
}: DashboardTableViewProps) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(items.length / PAGE_SIZE) || 1;
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = items.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
            Radar des dossiers
          </p>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        </div>
        <p className="text-sm text-slate-500">
          {items.length} dossier(s){query.trim() ? ` pour "${query}"` : ""}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="p-10 text-center text-sm text-slate-500">
          {emptyText}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-[1080px] w-full text-left">
              <thead className="bg-white">
                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  <th className="px-4 py-3">Numéro</th>
                  <th className="px-4 py-3">Intitulé</th>
                  <th className="px-4 py-3">Demandeur</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3">PTBA</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">Position actuelle</th>
                  <th className="px-4 py-3">Créé le</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((demande) => {
                  const action = getDemandePrimaryAction(demande, currentUser);
                  const trackingLabel = getDemandeTrackingStageLabel(demande);

                  return (
                    <tr
                      key={demande.id}
                      className="border-b border-slate-100 align-top text-sm text-slate-700 last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => onOpenDetail(demande.id)}
                          className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 transition-colors hover:bg-slate-200"
                        >
                          {demande.numero_demande}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[220px]">
                          <p className="font-semibold text-slate-900">{demande.objet}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {getCompactNeedLabel(demande)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {demande.demandeur_nom || "Non renseigné"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {typeLabels[demande.type_demande] ?? demande.type_demande}
                      </td>
                      <td className="px-4 py-3 text-slate-600">v{demande.version}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex max-w-[140px] truncate rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600"
                          title={demande.lien_ptba}
                        >
                          {demande.lien_ptba || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {formatMoney(demande.montant_commande ?? demande.cout_total_estime)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                          {trackingLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(demande.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenDetail(demande.id)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 transition-colors hover:bg-slate-50"
                          >
                            Détail
                          </button>
                          {action ? (
                            <button
                              type="button"
                              onClick={() => onRunAction(demande, action)}
                              className="rounded-lg bg-slate-900 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-slate-800"
                            >
                              {action.label}
                            </button>
                          ) : (
                            <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                              Consultation
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="border-t border-slate-200 px-4 py-3">
              <PaginationControls
                page={currentPage}
                totalPages={totalPages}
                setPage={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PaginationControls({
  page,
  totalPages,
  setPage,
}: PaginationControlsProps) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs font-medium text-slate-500">
        Page {page} sur {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
          disabled={page === 1}
          className="rounded-md border border-slate-200 bg-white p-1 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() =>
            setPage((currentPage) => Math.min(totalPages, currentPage + 1))
          }
          disabled={page === totalPages}
          className="rounded-md border border-slate-200 bg-white p-1 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
