"use client";

import { TdrStDocument, STATUT_LABEL, STATUS_BADGE_CLASSES, formatDateForRow, formatAmountForRow } from "../hooks/useTdrStData";

type CompactDocumentRowProps = {
  document: TdrStDocument;
  versionNumber: number;
  isHistorical?: boolean;
  onClick: () => void;
  onDetailClick: () => void;
  onActionClick?: () => void;
  actionButtonLabel?: string;
  isSelected: boolean;
  role?: string | null;
};

export function CompactDocumentRow({
  document,
  versionNumber,
  isHistorical,
  onClick,
  onDetailClick,
  onActionClick,
  actionButtonLabel,
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
            {role === "demandeur" && !isHistorical && document.version > 1 && (
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

        {/* Right side - Buttons and date */}
        <div className="flex items-center gap-3">
          <div className="text-right text-xs text-slate-400 hidden sm:block">
            {formattedDate}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDetailClick();
              }}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 transition-colors hover:bg-slate-50"
            >
              Détail
            </button>
            
            {actionButtonLabel && onActionClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onActionClick();
                }}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-emerald-700"
              >
                {actionButtonLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
