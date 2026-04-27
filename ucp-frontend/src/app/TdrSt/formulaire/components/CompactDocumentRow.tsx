"use client";

import { TdrStDocument, STATUT_LABEL, STATUS_BADGE_CLASSES, formatDateForRow, formatAmountForRow } from "../hooks/useTdrStData";

type CompactDocumentRowProps = {
  document: TdrStDocument;
  versionNumber: number;
  isHistorical?: boolean;
  onClick: () => void;
  isSelected: boolean;
  role?: string | null;
};

export function CompactDocumentRow({
  document,
  versionNumber,
  isHistorical,
  onClick,
  isSelected,
  role,
}: CompactDocumentRowProps) {
  const formattedDate = formatDateForRow(document.created_at);
  const montant = formatAmountForRow(document.montant_estime_usd);
  const statusLabel = STATUT_LABEL[document.statut] ?? document.statut;
  const statusClass = STATUS_BADGE_CLASSES[document.statut] ?? "bg-slate-50 text-slate-700 border border-slate-200";

  return (
    <div
      className={`group cursor-pointer rounded-xl border p-4 transition-all hover:shadow-md ${
        isSelected
          ? "border-emerald-300 bg-emerald-50/30 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left side - Document info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
              {document.numero_document || `#${document.id}`}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusClass}`}>
              {statusLabel}
            </span>
            {isHistorical && (
              <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                Version {versionNumber}
              </span>
            )}
            {role === "initiateur" && !isHistorical && document.version > 1 && (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                v{document.version}
              </span>
            )}
          </div>

          <p className="text-[15px] font-semibold leading-tight text-slate-900 line-clamp-1" title={document.intitule}>
            {document.intitule || "—"}
          </p>

          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="font-medium text-slate-600">Unité:</span> {document.unite_technique || "—"}
            </span>
            <span className="flex items-center gap-1">
              <span className="font-medium text-slate-600">Type:</span> {document.type_document}
            </span>
            <span className="flex items-center gap-1">
              <span className="font-medium text-slate-600">PTBA:</span> {document.reference_ptba || "—"}
            </span>
            <span className="flex items-center gap-1">
              <span className="font-medium text-slate-600">Montant:</span> {montant} USD
            </span>
          </div>
        </div>

        {/* Right side - Date and expand indicator */}
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span>{formattedDate}</span>
          <svg
            className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 ${isSelected ? "translate-x-0.5 text-emerald-600" : "text-slate-400"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}