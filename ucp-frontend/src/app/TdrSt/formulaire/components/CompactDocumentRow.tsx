"use client";

import {
  TdrStDocument,
  STATUT_LABEL,
  STATUS_BADGE_CLASSES,
  formatDateForRow,
  formatAmountForRow,
} from "../hooks/useTdrStData";

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
  const formattedCreatedDate = formatDateForRow(document.created_at);
  const formattedUpdatedDate = formatDateForRow(document.updated_at || document.created_at);
  const montant = formatAmountForRow(document.montant_estime_usd);
  const statusLabel = STATUT_LABEL[document.statut] ?? document.statut;
  const statusClass =
    STATUS_BADGE_CLASSES[document.statut] ?? "bg-slate-50 text-slate-700 border border-slate-200";
  const documentTypeClass =
    document.type_document === "ST"
      ? "border-sky-200 bg-sky-50 text-sky-700"
      : "border-violet-200 bg-violet-50 text-violet-700";

  return (
    <div
      className={`group cursor-pointer rounded-2xl border p-4 shadow-sm transition-all ${
        isSelected
          ? "border-emerald-300 bg-emerald-50/40 shadow-md"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
              {document.numero_document || `#${document.id}`}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
              {statusLabel}
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${documentTypeClass}`}>
              {document.type_document}
            </span>
            {document.demande_achat_numero && (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                {document.demande_achat_numero}
              </span>
            )}
            {isHistorical && (
              <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                Version {versionNumber}
              </span>
            )}
            {role === "demandeur" && !isHistorical && document.version > 1 && (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                v{document.version}
              </span>
            )}
          </div>

          <h3 className="text-sm font-semibold text-slate-900" title={document.intitule}>
            {document.intitule || "—"}
          </h3>

          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              Unite: {document.unite_technique || "—"}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              PTBA: {document.reference_ptba || "—"}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              Montant: {montant} USD
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              Mis a jour le {formattedUpdatedDate}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <div className="hidden text-right text-xs text-slate-400 md:block">
            Cree le {formattedCreatedDate}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDetailClick();
            }}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Detail dossier
          </button>

          {actionButtonLabel && onActionClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onActionClick();
              }}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              {actionButtonLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
