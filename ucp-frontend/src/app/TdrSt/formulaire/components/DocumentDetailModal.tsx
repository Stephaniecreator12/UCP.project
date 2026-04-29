"use client";

import { ReactNode, useEffect } from "react";
import { X, FileText, History, CheckCircle, Clock } from "lucide-react";

import {
  TdrStDocument,
  STATUT_LABEL,
  STATUS_BADGE_CLASSES,
  formatDateForRow,
  formatAmountForRow,
} from "../hooks/useTdrStData";
import { getFinancementLabel } from "./FinancementFilter";

type DocumentDetailModalProps = {
  document: TdrStDocument | null;
  open: boolean;
  onClose: () => void;
  actionSlot?: ReactNode;
  footerSlot?: ReactNode;
  onViewVersion?: (version: number, docId: number) => void;
};

const formatDisplayValue = (value: unknown): string => {
  if (Array.isArray(value) && value.length === 1 && typeof value[0] === "string") {
    return getFinancementLabel(value[0]);
  }
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ") || "-";
  }
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return String(value);
};

export default function DocumentDetailModal({
  document: activeDocument,
  open,
  onClose,
  actionSlot,
  footerSlot,
  onViewVersion,
}: DocumentDetailModalProps) {
  useEffect(() => {
    if (!open || typeof window === "undefined") return;

    const body = window.document.body;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open || !activeDocument) return null;

  const statusLabel = STATUT_LABEL[activeDocument.statut] ?? activeDocument.statut;
  const statusClass =
    STATUS_BADGE_CLASSES[activeDocument.statut] ?? "bg-slate-50 text-slate-700 border border-slate-200";
  const montant = formatAmountForRow(activeDocument.montant_estime_usd);
  const createdDate = formatDateForRow(activeDocument.created_at);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/65 p-1 backdrop-blur-sm sm:p-2 lg:p-3 xl:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-detail-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex min-h-[85vh] max-h-[calc(100vh-0.25rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 lg:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 id="document-detail-modal-title" className="text-lg font-bold text-slate-900">
                {activeDocument.numero_document || `Document #${activeDocument.id}`}
              </h2>
              <p className="max-w-md truncate text-xs text-slate-500" title={activeDocument.intitule}>
                {activeDocument.intitule || "Sans intitulé"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {actionSlot}
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
              {statusLabel}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200/60 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-white px-5 py-4 lg:px-7 lg:py-5">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <Section title="Informations générales">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DataPair label="Unité technique" value={activeDocument.unite_technique} />
                  <DataPair label="Type de document" value={activeDocument.type_document} />
                  <DataPair label="Catégorie d'activité" value={activeDocument.categorie_activite} />
                  <DataPair label="Procédure envisagée" value={activeDocument.procedure_envisagee} />
                  <DataPair label="Référence PTBA" value={activeDocument.reference_ptba} />
                  <DataPair label="Ligne budgétaire" value={activeDocument.ligne_budgetaire} />
                  <DataPair label="Montant estimé" value={`${montant} USD`} />
                  <DataPair label="Version" value={activeDocument.version} />
                  <DataPair label="Date de création" value={createdDate} />
                  <DataPair label="Dernière modification" value={formatDateForRow(activeDocument.updated_at)} />
                </div>
              </Section>

              <Section title="Intitulé / Description">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <p className="whitespace-pre-wrap text-sm text-slate-700">
                    {activeDocument.intitule || "Non renseigné"}
                  </p>
                </div>
              </Section>

              <Section title="Période et durée">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <DataPair label="Période début" value={formatDateForRow(activeDocument.periode_debut)} />
                  <DataPair label="Période fin" value={formatDateForRow(activeDocument.periode_fin)} />
                  <DataPair
                    label="Durée estimée"
                    value={`${activeDocument.duree_estimee_valeur} ${
                      activeDocument.duree_estimee_unite === "JOURS" ? "jours" : "mois"
                    }`}
                  />
                </div>
              </Section>

              <Section title="Financement">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DataPair label="Source de financement" value={formatDisplayValue(activeDocument.sources_financement)} />
                  <DataPair label="Numéro de subvention" value={activeDocument.numero_subvention || "Non renseigné"} />
                </div>
              </Section>

              {activeDocument.actions_validation && activeDocument.actions_validation.length > 0 && (
                <Section title="Historique des validations" icon={History}>
                  <div className="space-y-3">
                    {activeDocument.actions_validation.map((action) => (
                      <div key={action.id} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {action.decision === "FAVORABLE" || action.decision === "APPROUVE" ? (
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                            ) : action.decision === "A_REVOIR" || action.decision === "REJETE" ? (
                              <X className="h-4 w-4 text-rose-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-amber-600" />
                            )}
                            <span className="text-xs font-semibold uppercase text-slate-500">{action.etape}</span>
                          </div>
                          <span className="text-xs text-slate-400">{new Date(action.horodatage).toLocaleString()}</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-700">
                          <span className="font-semibold">{action.acteur_username}</span>
                          {action.decision && (
                            <span className="ml-2 text-xs font-medium text-slate-500">• {action.decision}</span>
                          )}
                        </p>
                        {action.observations && (
                          <p className="mt-1 text-xs italic text-slate-500">{action.observations}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>

            <div className="space-y-5">
              <Section title="Document PDF" icon={FileText}>
                {activeDocument.fichier_courant?.fichier_pdf ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-center">
                    <FileText className="mx-auto h-8 w-8 text-emerald-600" />
                    <p className="mt-2 text-sm font-medium text-slate-700">Version {activeDocument.version}</p>
                    <a
                      href={activeDocument.fichier_courant.fichier_pdf}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Visualiser le PDF
                    </a>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                    <FileText className="mx-auto h-8 w-8 text-slate-400" />
                    <p className="mt-2 text-sm text-slate-500">Aucun PDF disponible</p>
                  </div>
                )}
              </Section>

              {activeDocument.versions_fichier && activeDocument.versions_fichier.length > 0 && (
                <Section title="Versions antérieures" icon={History}>
                  <div className="space-y-2">
                    {[...activeDocument.versions_fichier]
                      .sort((a, b) => (b.version ?? 0) - (a.version ?? 0))
                      .filter((version) => version.version !== activeDocument.version)
                      .map((version) => (
                        <div key={version.id} className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-700">Version {version.version}</span>
                            {onViewVersion && (
                              <button
                                type="button"
                                onClick={() => onViewVersion(version.version, activeDocument.id)}
                                className="text-xs text-emerald-600 hover:underline"
                              >
                                Voir cette version
                              </button>
                            )}
                          </div>
                          {version.fichier_pdf && (
                            <a
                              href={version.fichier_pdf}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline"
                            >
                              Télécharger le PDF
                            </a>
                          )}
                          <p className="mt-1 text-xs text-slate-400">
                            {version.uploaded_at && formatDateForRow(version.uploaded_at)}
                          </p>
                        </div>
                      ))}
                  </div>
                </Section>
              )}

              {activeDocument.requires_ano && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-800">⚠️ Seuil bailleur dépassé</p>
                  <p className="mt-1 text-xs text-amber-700">
                    Ce document nécessite une validation additionnelle du bailleur.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {footerSlot ? (
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 lg:px-7">{footerSlot}</div>
        ) : null}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  icon: Icon,
}: {
  title: string;
  children: ReactNode;
  icon?: React.ElementType;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="flex items-center gap-2 border-b border-slate-100 pb-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {title}
      </h3>
      <div>{children}</div>
    </section>
  );
}

function DataPair({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value?: React.ReactNode;
  highlight?: boolean;
}) {
  const displayValue = value && value !== "" ? value : "-";

  return (
    <div>
      <p className="mb-0.5 text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`text-[13px] font-medium ${highlight ? "font-bold text-amber-700" : "text-slate-900"}`}>
        {displayValue}
      </p>
    </div>
  );
}
