"use client";

import { useState } from "react";
import { TdrStDocument } from "../hooks/useTdrStData";
import { CompactDocumentRow } from "./CompactDocumentRow";
import { PaginationControls } from "./PaginationControls";

const PAGE_SIZE = 5;

type SectionDocumentsListProps = {
  documents: TdrStDocument[];
  selectedId: number | null;
  onSelectDocument: (id: number, version?: number) => void;
  role?: string | null;
  title?: string;
  emptyMessage?: string;
};

export function SectionDocumentsList({
  documents,
  selectedId,
  onSelectDocument,
  role,
  title,
  emptyMessage = "Aucun document",
}: SectionDocumentsListProps) {
  const [page, setPage] = useState(1);

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
      
      <div className="space-y-2">
        {paginatedDocs.map((doc) => (
          <CompactDocumentRow
            key={doc.id}
            document={doc}
            versionNumber={doc.version || 1}
            onClick={() => onSelectDocument(doc.id)}
            isSelected={selectedId === doc.id}
            role={role}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <PaginationControls page={safePage} totalPages={totalPages} setPage={setPage} />
      )}
    </div>
  );
}
