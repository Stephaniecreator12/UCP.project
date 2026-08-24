import { MonitoringData, AlertItem, InvisibleFolder } from "@/types/adminDashboard";
import { AlertTriangle, Clock } from "lucide-react";

export default function MonitoringPanel({ data }: { data: MonitoringData | null}) {
  if (!data) return null;

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md flex flex-col">
      <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />

      <div className="mb-5 pt-1">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white">
            1
          </div>
          Alertes de supervision UCP
        </h3>
        <p className="text-xs text-slate-500 mt-1 ml-7">Points de contrôle nécessitant une attention ou une relance immédiate.</p>
      </div>

      <div className="space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle size={16} />
            <h4 className="text-[10px] font-black uppercase tracking-[0.16em]">
              Date limite imminente (&lt; 48h)
            </h4>
          </div>

          <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
            {data.alerts.length === 0 ? (
              <p className="text-xs text-slate-400 italic pl-6">Aucun dossier en urgence critique.</p>
            ) : (
              data.alerts.map((item: AlertItem) => (
                <div key={item.id} className="text-xs font-semibold text-rose-900 bg-rose-50 border border-rose-100/70 p-2.5 rounded-xl truncate">
                  {item.title}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-amber-600">
            <Clock size={16} />
            <h4 className="text-[10px] font-black uppercase tracking-[0.16em]">
              Dossiers inactifs (Aucun accès depuis 7 jours)
            </h4>
          </div>

          <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
            {data.invisible_folders.length === 0 ? (
              <p className="text-xs text-slate-400 italic pl-6">Tous les dossiers reçoivent de l&apos;activité.</p>
            ) : (
              data.invisible_folders.map((item: InvisibleFolder) => (
                <div key={item.id} className="text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-100/70 p-2.5 rounded-xl truncate">
                  {item.title}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}