"use client";

export type AuditeurOverview = {
  total: number;
  rejected: number;
  rejectedRate: number;
  requiresAno: number;
  withAnoAction: number;
  avgDelayDays: number | null;
  monthly: { label: string; count: number }[];
  topUnits: { unite: string; total: number; rejected: number; rate: number }[];
};

export default function DashboardIndividual({ overview }: { overview: AuditeurOverview }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">Vue d&apos;ensemble</p>
          <h3 className="text-lg font-semibold text-slate-900">Tableau de bord audit</h3>
        </div>
        <p className="text-xs font-semibold text-slate-600">
          Période: 6 derniers mois • {overview.total} dossier{overview.total > 1 ? "s" : ""}
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Volume</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{overview.total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Délai moyen</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {overview.avgDelayDays == null ? "—" : `${overview.avgDelayDays.toFixed(1)}j`}
          </p>
          <p className="mt-1 text-xs text-slate-500">Dépôt → Approbation finale</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Taux de rejet</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{Math.round(overview.rejectedRate * 100)}%</p>
          <p className="mt-1 text-xs text-slate-500">{overview.rejected} rejeté(s)</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Seuil / ANO</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{overview.requiresAno}</p>
          <p className="mt-1 text-xs text-slate-500">{overview.withAnoAction} avec action ANO</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">Volume traité par mois</p>
          <div className="mt-3 space-y-2">
            {overview.monthly.map((m) => (
              <div key={m.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-600">{m.label}</span>
                <span className="font-semibold text-slate-900">{m.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">Unités techniques (taux de rejet)</p>
          <div className="mt-3 space-y-2">
            {overview.topUnits.length ? (
              overview.topUnits.map((u) => (
                <div key={u.unite} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-slate-600" title={u.unite}>
                    {u.unite}
                  </span>
                  <span className="shrink-0 font-semibold text-slate-900">{Math.round(u.rate * 100)}%</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">—</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
