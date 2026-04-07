"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

import { DemandeAchat } from "@/services/achats";
import DemandeDetailPanel from "./DemandeDetailPanel";

type DemandeDetailModalProps = {
  demande: DemandeAchat | null;
  open: boolean;
  onClose: () => void;
  actionSlot?: ReactNode;
  footerSlot?: ReactNode;
  defaultShowTimeline?: boolean;
};

export default function DemandeDetailModal({
  demande,
  open,
  onClose,
  actionSlot,
  footerSlot,
  defaultShowTimeline = false,
}: DemandeDetailModalProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open || !demande) return null;

  return (
    <div
      className="fixed inset-0 z-[120] bg-slate-900/40 p-4 flex items-center justify-center animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demande-detail-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded border border-slate-200 bg-white shadow-xl animate-in zoom-in-95 duration-200">
        
        {/* Header - Professional compact style */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-3">
            <h2 id="demande-detail-modal-title" className="text-lg font-bold text-slate-900 font-mono tracking-tight">
              {demande.numero_demande}
            </h2>
            <div className="h-4 w-px bg-slate-300"></div>
            <p className="text-sm font-medium text-slate-600 truncate max-w-md" title={demande.objet}>
              {demande.objet}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded bg-slate-200/50 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-white p-5">
          <DemandeDetailPanel
            demande={demande}
            actionSlot={actionSlot}
            defaultShowTimeline={defaultShowTimeline}
          />
        </div>

        {/* Footer Area */}
        {footerSlot ? (
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
            {footerSlot}
          </div>
        ) : null}
      </div>
    </div>
  );
}
