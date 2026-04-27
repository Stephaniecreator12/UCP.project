"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Activity, Clock, CheckCircle2, Trash2, Archive, FileText } from "lucide-react";
import { TdrStDocument } from "../hooks/useTdrStData";
import { SectionDocumentsList } from "./SectionDocumentsList";

type SectionConfig = {
  key: string;
  title: string;
  icon: React.ElementType;
  iconClass: string;
  badgeClass: string;
  emptyText: string;
};

type AccordionSectionProps = {
  sectionKey: string;
  title: string;
  icon?: React.ElementType;
  documents: TdrStDocument[];
  selectedId: number | null;
  onSelectDocument: (id: number, version?: number) => void;
  role?: string;
  defaultOpen?: boolean;
};

const defaultIconMap: Record<string, React.ElementType> = {
  draft: FileText,
  pending: Clock,
  correction: Activity,
  validation: Clock,
  all: Activity,
  archive: Archive,
};

const iconClassMap: Record<string, string> = {
  draft: "border-slate-200 bg-slate-50 text-slate-600",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  correction: "border-rose-200 bg-rose-50 text-rose-700",
  validation: "border-emerald-200 bg-emerald-50 text-emerald-700",
  all: "border-teal-200 bg-teal-50 text-teal-700",
  archive: "border-slate-200 bg-slate-50 text-slate-600",
};

export function AccordionSection({
  sectionKey,
  title,
  icon: customIcon,
  documents,
  selectedId,
  onSelectDocument,
  role,
  defaultOpen = false,
}: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const sectionRef = useRef<HTMLDivElement>(null);
  const Icon = customIcon || defaultIconMap[sectionKey] || FileText;
  const iconClass = iconClassMap[sectionKey] || "border-slate-200 bg-slate-50 text-slate-600";
  const hasItems = documents.length > 0;

  useEffect(() => {
    if (isOpen && sectionRef.current && hasItems) {
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
  }, [isOpen, hasItems]);

  return (
    <div
      ref={sectionRef}
      className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-colors ${
        isOpen ? "border-slate-300" : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <button
        onClick={() => hasItems && setIsOpen(!isOpen)}
        disabled={!hasItems}
        className={`flex w-full items-center justify-between px-5 py-4 text-left transition-colors ${
          !hasItems
            ? "cursor-not-allowed bg-slate-50 opacity-60"
            : isOpen
              ? "border-b border-slate-200 bg-slate-50"
              : "bg-white hover:bg-slate-50"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${iconClass}`}>
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
          <span className="text-base font-semibold text-slate-900">{title}</span>
          <span
            className={`ml-1 rounded-full border px-3 py-1 text-xs font-semibold ${
              hasItems ? "border-slate-200 bg-white text-slate-700" : "border-slate-200 bg-slate-100 text-slate-400"
            }`}
          >
            {documents.length}
          </span>
        </div>

        {hasItems && (
          <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            <span className={isOpen ? "text-slate-700" : ""}>
              {isOpen ? "Masquer" : "Afficher"}
            </span>
            <div className={`rounded-lg bg-slate-100 p-1 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}>
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
          </div>
        )}
      </button>

      {isOpen && hasItems && (
        <div className="bg-slate-50 px-4 py-4">
          <SectionDocumentsList
            documents={documents}
            selectedId={selectedId}
            onSelectDocument={(id) => onSelectDocument(id)}
            role={role}
          />
        </div>
      )}
    </div>
  );
}