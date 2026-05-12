"use client";

import { useState } from "react";
import {
  TdrStDocument,
  STATUT_LABEL,
  STATUS_BADGE_CLASSES,
  formatDateForRow,
  formatAmountForRow,
} from "../hooks/useTdrStData";
import { CompactDocumentRow } from "./CompactDocumentRow";
import { PaginationControls } from "./PaginationControls";

const PAGE_SIZE = 5;

type SectionDocumentsListProps = {
  documents: TdrStDocument[];
  selectedId: number | null;
  onSelectDocument: (id: number, version?: number) => void;
  onDetailClick: (doc: TdrStDocument) => void;
  onActionClick?: (doc: TdrStDocument) => void;
  getActionButtonLabel?: (doc: TdrStDocument) => string | null;
  role?: string | null;
  title?: string;
  emptyMessage?: string;
};

export function SectionDocumentsList({
  documents,
  selectedId,
  onSelectDocument,
  onDetailClick,
  onActionClick,
  getActionButtonLabel,
  role,
  title,
  emptyMessage = "Aucun document",
}: SectionDocumentsListProps) {
  const [page, setPage] = useState(1);
  const isAuditeur = role === "auditeur";

  const totalPages = Math.ceil(documents.length / PAGE_SIZE) || 1;
  const safePage = Math.min(page, totalPages);
  const paginatedDocs = documents.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            {documents.length}
          </span>
        </div>
      )}

      {isAuditeur ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                  <th className="px-4 py-3">Numero</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Intitule</th>
                  <th className="px-4 py-3">Unite</th>
                  <th className="px-4 py-3">PTBA</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Maj</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedDocs.map((doc) => {
                  const statusLabel = STATUT_LABEL[doc.statut] ?? doc.statut;
                  const statusClass =
                    STATUS_BADGE_CLASSES[doc.statut] ?? "bg-slate-50 text-slate-700 border border-slate-200";

                  return (
                    <tr
                      key={doc.id}
                      onClick={() => onSelectDocument(doc.id)}
                      className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                        selectedId === doc.id ? "bg-emerald-50/40" : "bg-white"
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                        {doc.numero_document || `#${doc.id}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{doc.type_document}</td>
                      <td className="max-w-[320px] px-4 py-3 text-sm font-medium text-slate-800">
                        <span className="block truncate" title={doc.intitule}>
                          {doc.intitule || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{doc.unite_technique || "-"}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{doc.reference_ptba || "-"}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatAmountForRow(doc.montant_estime_usd)} USD</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{formatDateForRow(doc.updated_at || doc.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDetailClick(doc);
                          }}
                          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {paginatedDocs.map((doc) => (
            <CompactDocumentRow
              key={doc.id}
              document={doc}
              versionNumber={doc.version || 1}
              onClick={() => onSelectDocument(doc.id)}
              onDetailClick={() => onDetailClick(doc)}
              onActionClick={onActionClick ? () => onActionClick(doc) : undefined}
              actionButtonLabel={getActionButtonLabel ? getActionButtonLabel(doc) ?? undefined : undefined}
              isSelected={selectedId === doc.id}
              role={role}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <PaginationControls page={safePage} totalPages={totalPages} setPage={setPage} />
      )}
    </div>
  );
}
