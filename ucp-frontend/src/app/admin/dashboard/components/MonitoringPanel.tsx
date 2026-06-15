import { MonitoringData, AlertItem, InvisibleFolder } from "@/types/adminDashboard";
import { AlertTriangle, Clock } from "lucide-react";

export default function MonitoringPanel({ data }: { data: MonitoringData | null}) {
  if (!data) return null;

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs flex flex-col">
      <div className="mb-5">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Alertes de supervision UCP
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">Points de contrôle nécessitant une attention ou une relance immédiate.</p>
      </div>

      <div className="space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle size={16} />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Date limite imminente (&lt; 48h)
            </h4>
          </div>

          <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
            {data.alerts.length === 0 ? (
              <p className="text-xs text-slate-400 italic pl-6">Aucun dossier en urgence critique.</p>
            ) : (
              data.alerts.map((item: AlertItem) => (
                <div key={item.id} className="text-xs font-semibold text-red-900 bg-red-50 border border-red-100/70 p-2.5 rounded-lg truncate">
                  🎯 {item.title}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section Warning */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-amber-600">
            <Clock size={16} />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Dossiers inactifs (Aucun accès depuis 7 jours)
            </h4>
          </div>

          <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
            {data.invisible_folders.length === 0 ? (
              <p className="text-xs text-slate-400 italic pl-6">Tous les dossiers reçoivent de l activité.</p>
            ) : (
              data.invisible_folders.map((item: InvisibleFolder) => (
                <div key={item.id} className="text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-100/70 p-2.5 rounded-lg truncate">
                  📁 {item.title}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}