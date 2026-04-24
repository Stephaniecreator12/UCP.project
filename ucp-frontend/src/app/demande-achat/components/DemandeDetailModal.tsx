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
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/65 p-1 backdrop-blur-sm sm:p-2 lg:p-3 xl:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demande-detail-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="flex min-h-[97vh] w-full max-w-[114rem] max-h-[calc(100vh-0.25rem)] flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5 animate-in zoom-in-95 duration-200 lg:min-h-[98vh] xl:max-w-[118rem]"
        style={{ zoom: 0.94 }}
      >
        
        {/* Header - Professional compact style */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 lg:px-7">
          <div className="flex items-center gap-3">
            <h2 id="demande-detail-modal-title" className="text-xl font-bold text-slate-900 font-mono tracking-tight">
              {demande.numero_demande}
            </h2>
            <div className="h-4 w-px bg-slate-300"></div>
            <p className="max-w-xl truncate text-sm font-medium text-slate-600 xl:max-w-3xl" title={demande.objet}>
              {demande.objet}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200/60 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-white px-5 py-4 lg:px-7 lg:py-5">
          <DemandeDetailPanel
            demande={demande}
            actionSlot={actionSlot}
            defaultShowTimeline={defaultShowTimeline}
          />
        </div>

        {/* Footer Area */}
        {footerSlot ? (
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 lg:px-7">
            {footerSlot}
          </div>
        ) : null}
      </div>
    </div>
  );
}
