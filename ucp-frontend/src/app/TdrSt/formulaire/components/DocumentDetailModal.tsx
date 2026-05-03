"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import {
  X,
  FileText,
  History,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  Euro,
  Tag,
  Building2,
  FileCheck,
  ThumbsUp,
  ThumbsDown,
  Minus,
} from "lucide-react";

import {
  TdrStDocument,
  STATUT_LABEL,
  STATUS_BADGE_CLASSES,
  formatDateForRow,
  formatAmountForRow,
} from "../hooks/useTdrStData";

type DocumentDetailModalProps = {
  document: TdrStDocument | null;
  open: boolean;
  onClose: () => void;
  actionSlot?: ReactNode;
  footerSlot?: ReactNode;
  onViewVersion?: (version: number, docId: number) => void;
  onValidate?: (etape: string, decision: string) => void;
};

const formatDisplayValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ") || "-";
  }
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return String(value);
};

// Fonction utilitaire pour normaliser les sources de financement
const normalizeFinancementSources = (sources: unknown): string[] => {
  if (!sources) return [];
  if (Array.isArray(sources)) return sources;
  if (typeof sources === "string") {
    try {
      const parsed = JSON.parse(sources);
      return Array.isArray(parsed) ? parsed : [sources];
    } catch {
      return [sources];
    }
  }
  if (typeof sources === "object") {
    return Object.values(sources).flatMap((v) =>
      typeof v === "string" ? v : String(v)
    );
  }
  return [String(sources)];
};

const getDecisionIcon = (decision: string) => {
  switch (decision) {
    case "FAVORABLE":
    case "APPROUVE":
      return <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" />;
    case "DEFAVORABLE":
    case "REJETE":
      return <ThumbsDown className="h-3.5 w-3.5 text-rose-600" />;
    case "A_REVOIR":
      return <AlertCircle className="h-3.5 w-3.5 text-amber-600" />;
    default:
      return <Minus className="h-3.5 w-3.5 text-slate-400" />;
  }
};

const getDecisionBadge = (decision: string) => {
  switch (decision) {
    case "FAVORABLE":
    case "APPROUVE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "DEFAVORABLE":
    case "REJETE":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "A_REVOIR":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const getDecisionLabel = (decision: string) => {
  switch (decision) {
    case "FAVORABLE":
      return "Favorable";
    case "DEFAVORABLE":
      return "Défavorable";
    case "APPROUVE":
      return "Approuvée";
    case "REJETE":
      return "Rejetée";
    case "A_REVOIR":
      return "À revoir";
    default:
      return "En attente";
  }
};

export default function DocumentDetailModal({
  document: activeDocument,
  open,
  onClose,
  actionSlot,
  footerSlot,
  onViewVersion,
}: DocumentDetailModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["validations"])
  );

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

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const statusLabel =
    STATUT_LABEL[activeDocument.statut] ?? activeDocument.statut;
  const statusClass =
    STATUS_BADGE_CLASSES[activeDocument.statut] ??
    "bg-slate-50 text-slate-700 border border-slate-200";
  const montant = formatAmountForRow(activeDocument.montant_estime_usd);
  const createdDate = formatDateForRow(activeDocument.created_at);

  // Données d'exemple pour les validations (à remplacer par les vraies données si disponibles)
  const validations = activeDocument.actions_validation?.map((action) => ({
    etape: action.etape,
    decision: action.decision,
    acteur: action.acteur_username,
    date: new Date(action.horodatage).toLocaleString(),
    observation: action.observations,
  })) || [];

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/65 p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-detail-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex h-[90vh] w-full max-w-8xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5 animate-in zoom-in-95 duration-200">
        {/* Header - fixed */}
        <div className="shrink-0 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-4 lg:px-7">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2
                  id="document-detail-modal-title"
                  className="text-xl font-bold text-slate-900 font-mono tracking-tight truncate"
                >
                  {activeDocument.numero_document ||
                    `Document #${activeDocument.id}`}
                </h2>
                <p
                  className="text-sm text-slate-500 truncate"
                  title={activeDocument.intitule}
                >
                  {activeDocument.intitule || "Sans intitulé"}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {actionSlot}
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
              >
                {statusLabel}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable content area */}
        <div
          ref={contentRef}
          className="min-h-0 flex-1 overflow-y-auto bg-slate-50/30"
        >
          <div className="p-5 lg:p-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              {/* Left column - 2/3 on large screens */}
              <div className="space-y-6 xl:col-span-2">
                {/* Section Validation & Décisions */}
                {validations.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <button
                      onClick={() => toggleSection("validations")}
                      className="flex w-full items-center justify-between bg-slate-50 px-5 py-3 transition-colors hover:bg-slate-100"
                    >
                      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-600">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        Validation & Décisions
                      </h3>
                      {expandedSections.has("validations") ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </button>

                    {expandedSections.has("validations") && (
                      <div className="divide-y divide-slate-100">
                        <div className="hidden grid-cols-12 gap-3 bg-slate-50/80 px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 lg:grid">
                          <div className="col-span-4">Étape</div>
                          <div className="col-span-3">Décision</div>
                          <div className="col-span-3">Acteur</div>
                          <div className="col-span-2">Date</div>
                        </div>

                        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                          {validations.map((validation, idx) => (
                            <div
                              key={idx}
                              className="grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-slate-50/50 lg:grid-cols-12"
                            >
                              <div className="lg:col-span-4">
                                <span className="text-xs font-semibold text-slate-700 lg:hidden">
                                  Étape :{" "}
                                </span>
                                <span className="text-sm text-slate-800">
                                  {validation.etape}
                                </span>
                              </div>
                              <div className="lg:col-span-3">
                                <span className="text-xs font-semibold text-slate-700 lg:hidden">
                                  Décision :{" "}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${getDecisionBadge(
                                    validation.decision
                                  )}`}
                                >
                                  {getDecisionIcon(validation.decision)}
                                  {getDecisionLabel(validation.decision)}
                                </span>
                              </div>
                              <div className="lg:col-span-3">
                                <span className="text-xs font-semibold text-slate-700 lg:hidden">
                                  Acteur :{" "}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <User className="h-3 w-3 text-slate-400" />
                                  <span className="text-sm text-slate-700">
                                    {validation.acteur}
                                  </span>
                                </div>
                              </div>
                              <div className="lg:col-span-2">
                                <span className="text-xs font-semibold text-slate-700 lg:hidden">
                                  Date :{" "}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-3 w-3 text-slate-400" />
                                  <span className="text-xs text-slate-500">
                                    {validation.date}
                                  </span>
                                </div>
                              </div>
                              {validation.observation && (
                                <div className="lg:col-span-12">
                                  <div className="mt-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
                                    {validation.observation}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Informations générales */}
                <Section title="Informations générales">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <DataPair
                      label="Unité technique"
                      value={activeDocument.unite_technique}
                    />
                    <DataPair
                      label="Type de document"
                      value={activeDocument.type_document}
                    />
                    <DataPair
                      label="Catégorie d'activité"
                      value={activeDocument.categorie_activite}
                    />
                    <DataPair
                      label="Procédure envisagée"
                      value={activeDocument.procedure_envisagee}
                    />
                    <DataPair
                      label="Référence PTBA"
                      value={activeDocument.reference_ptba}
                    />
                    <DataPair
                      label="Ligne budgétaire"
                      value={activeDocument.ligne_budgetaire}
                    />
                    <DataPair
                      label="Montant estimé"
                      value={`${montant} USD`}
                      highlight
                    />
                    <DataPair label="Version" value={activeDocument.version} />
                    <DataPair
                      label="Date de création"
                      value={createdDate}
                    />
                    <DataPair
                      label="Dernière modification"
                      value={formatDateForRow(activeDocument.updated_at)}
                    />
                  </div>
                </Section>

                <Section title="Intitulé / Description">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                    <p className="whitespace-pre-wrap text-sm text-slate-700 max-h-32 overflow-y-auto">
                      {activeDocument.intitule || "Non renseigné"}
                    </p>
                  </div>
                </Section>

                {/* Les sections Période et durée & Financement ont été supprimées d'ici et déplacées dans la colonne de droite */}
              </div>

              {/* Right column - 1/3 */}
              <div className="space-y-5">
                <Section title="Document PDF" icon={FileText}>
                  {activeDocument.fichier_courant?.fichier_pdf ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-center">
                      <FileText className="mx-auto h-8 w-8 text-emerald-600" />
                      <p className="mt-2 text-sm font-medium text-slate-700">
                        Version {activeDocument.version}
                      </p>
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
                      <p className="mt-2 text-sm text-slate-500">
                        Aucun PDF disponible
                      </p>
                    </div>
                  )}
                </Section>
              
              {activeDocument.versions_fichier &&
                  activeDocument.versions_fichier.length > 0 && (
                    <Section title="Versions antérieures" icon={History}>
                      <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                        {[...activeDocument.versions_fichier]
                          .sort((a, b) => (b.version ?? 0) - (a.version ?? 0))
                          .filter(
                            (version) => version.version !== activeDocument.version
                          )
                          .map((version) => (
                            <div
                              key={version.id}
                              className="rounded-xl border border-slate-200 bg-white p-3"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-slate-700">
                                  Version {version.version}
                                </span>
                                {onViewVersion && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onViewVersion(
                                        version.version,
                                        activeDocument.id
                                      )
                                    }
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
                                {version.uploaded_at &&
                                  formatDateForRow(version.uploaded_at)}
                              </p>
                            </div>
                          ))}
                      </div>
                    </Section>
                  )}

                {/* Période et durée - DÉPLACÉ ICI */}
              <div  className="mt-7">
                <Section title="Période et durée">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-xs text-slate-500">Période début</span>
                      <span className="text-sm font-medium text-slate-800">
                        {formatDateForRow(activeDocument.periode_debut)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-xs text-slate-500">Période fin</span>
                      <span className="text-sm font-medium text-slate-800">
                        {formatDateForRow(activeDocument.periode_fin)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Durée estimée</span>
                      <span className="text-sm font-medium text-slate-800">
                        {activeDocument.duree_estimee_valeur}{" "}
                        {activeDocument.duree_estimee_unite === "JOURS"
                          ? "jours"
                          : "mois"}
                      </span>
                    </div>
                  </div>
                </Section>
              </div>

                {/* Financement - DÉPLACÉ ICI */}
                <Section title="Financement">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-xs text-slate-500">Source de financement</span>
                      <span className="text-sm font-medium text-slate-800 text-right max-w-[60%]">
                        {formatDisplayValue(activeDocument.sources_financement)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Numéro de subvention</span>
                      <span className="text-sm font-medium text-slate-800">
                        {activeDocument.numero_subvention || "Non renseigné"}
                      </span>
                    </div>
                  </div>
                </Section>
                
                {activeDocument.requires_ano && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-800">
                      ⚠️ Seuil bailleur dépassé
                    </p>
                    <p className="mt-1 text-xs text-amber-700">
                      Ce document nécessite une validation additionnelle du
                      bailleur.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer - fixed */}
        {footerSlot && (
          <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-6 py-4 lg:px-7">
            {footerSlot}
          </div>
        )}
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
      <p className="mb-0.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p
        className={`text-[13px] font-medium truncate ${
          highlight ? "font-bold text-amber-700" : "text-slate-900"
        }`}
      >
        {displayValue}
      </p>
    </div>
  );
}