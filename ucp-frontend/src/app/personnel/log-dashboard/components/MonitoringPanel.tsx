import {
  MonitoringData,
  AlertItem,
  InvisibleFolder,
} from "@/types/adminDashboard";
import { AlertTriangle, Clock, ShieldAlert, Activity } from "lucide-react";

export default function MonitoringPanel({
  data,
}: {
  data: MonitoringData | null;
}) {
  if (!data) return null;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
      {/* Top accent line */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-orange-400 to-rose-400" />

      <div className="p-6">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Alertes de supervision
              </h3>
              <p className="text-xs text-slate-400">
                Points de contrôle UCP
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Alerts Section */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-50">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
              </div>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Date limite imminente
              </h4>
              {data.alerts.length > 0 && (
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-100 px-1.5 text-[10px] font-extrabold text-rose-600">
                  {data.alerts.length}
                </span>
              )}
            </div>

            <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
              {data.alerts.length === 0 ? (
                <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-4 text-center">
                  <Activity className="mx-auto h-4 w-4 text-slate-300" />
                  <p className="text-xs font-medium text-slate-400">
                    Aucune urgence critique
                  </p>
                </div>
              ) : (
                data.alerts.map((item: AlertItem) => (
                  <div
                    key={item.id}
                    className="group/alert relative overflow-hidden rounded-xl border border-rose-100 bg-gradient-to-r from-rose-50 to-rose-50/50 p-3 transition-colors hover:from-rose-50 hover:to-rose-100/50"
                  >
                    <div className="absolute left-0 top-0 h-full w-0.5 bg-rose-400" />
                    <div className="flex items-start justify-between gap-2 pl-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-rose-900">
                          {item.title}
                        </p>
                        {item.deadline && (
                          <p className="mt-0.5 text-[10px] font-semibold text-rose-400">
                            Échéance : {item.deadline}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-1 rounded-md bg-rose-100 px-1.5 py-0.5">
                        <Clock className="h-3 w-3 text-rose-500" />
                        <span className="text-[10px] font-extrabold text-rose-600">
                          URGENT
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-300">
              Inactivité
            </span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          {/* Inactive Folders Section */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-50">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Dossiers inactifs (&gt; 7 jours)
              </h4>
              {data.invisible_folders.length > 0 && (
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-100 px-1.5 text-[10px] font-extrabold text-amber-600">
                  {data.invisible_folders.length}
                </span>
              )}
            </div>

            <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
              {data.invisible_folders.length === 0 ? (
                <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-4 text-center">
                  <Activity className="mx-auto h-4 w-4 text-slate-300" />
                  <p className="text-xs font-medium text-slate-400">
                    Tous les dossiers sont actifs
                  </p>
                </div>
              ) : (
                data.invisible_folders.map((item: InvisibleFolder) => (
                  <div
                    key={item.id}
                    className="group/inact relative overflow-hidden rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50 to-amber-50/50 p-3 transition-colors hover:from-amber-50 hover:to-amber-100/50"
                  >
                    <div className="absolute left-0 top-0 h-full w-0.5 bg-amber-400" />
                    <div className="flex items-center justify-between gap-2 pl-2">
                      <p className="min-w-0 truncate text-xs font-bold text-amber-900">
                        {item.title}
                      </p>
                      <span className="flex flex-shrink-0 items-center gap-1 text-[10px] font-bold text-amber-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                        Dormant
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Closure rate footer */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Taux de clôture global
                </p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-800">
                  {data.closure_rate}%
                </p>
              </div>
              <div className="relative h-16 w-16">
                <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="5"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke={data.closure_rate >= 70 ? "#10b981" : data.closure_rate >= 40 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${(data.closure_rate / 100) * 175.9} 175.9`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-extrabold text-slate-700">
                    {data.closure_rate}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
