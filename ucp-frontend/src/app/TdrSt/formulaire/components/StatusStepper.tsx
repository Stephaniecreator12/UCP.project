"use client";

import { Statut, STATUT_LABEL } from "../hooks/useTdrStData";

const getProgress = (statut?: Statut): { pct: number; tone: "slate" | "amber" | "emerald" | "rose" | "orange" } => {
  if (!statut || statut === "BROUILLON") return { pct: 18, tone: "slate" };
  if (statut === "A_REVOIR") return { pct: 22, tone: "orange" };
  if (statut === "SOUMIS") return { pct: 45, tone: "amber" };
  if (statut === "EN_VALIDATION") return { pct: 72, tone: "amber" };
  if (statut === "VALIDE") return { pct: 100, tone: "emerald" };
  if (statut === "REJETE") return { pct: 100, tone: "rose" };
  if (statut === "SUSPENDU") return { pct: 100, tone: "slate" };
  return { pct: 100, tone: "orange" };
};

const getStepIndex = (statut?: Statut): number => {
  if (!statut) return 0;
  if (statut === "BROUILLON" || statut === "A_REVOIR") return 0;
  if (statut === "SOUMIS") return 1;
  if (statut === "EN_VALIDATION") return 2;
  return 3;
};

export function StatusStepper({ statut }: { statut?: Statut }) {
  const { pct, tone } = getProgress(statut);
  const idx = getStepIndex(statut);
  const steps = ["Initié", "Soumis", "En validation", "Décision finale"];

  const toneClasses: Record<typeof tone, { bar: string; badge: string; dot: string }> = {
    slate: { bar: "bg-slate-500", badge: "border-slate-200 bg-slate-50 text-slate-700", dot: "bg-slate-600" },
    amber: { bar: "bg-amber-500", badge: "border-amber-200 bg-amber-50 text-amber-800", dot: "bg-amber-600" },
    emerald: { bar: "bg-emerald-600", badge: "border-emerald-200 bg-emerald-50 text-emerald-800", dot: "bg-emerald-600" },
    rose: { bar: "bg-rose-600", badge: "border-rose-200 bg-rose-50 text-rose-800", dot: "bg-rose-600" },
    orange: { bar: "bg-orange-500", badge: "border-orange-200 bg-orange-50 text-orange-800", dot: "bg-orange-600" },
  };

  const badgeText = statut ? STATUT_LABEL[statut] : "—";
  const c = toneClasses[tone];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="rounded-2xl border-t-4 border-t-emerald-600 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Statut du document
            </p>
            <p className="text-sm text-slate-700">
              {statut
                ? "Progression basée sur l'état actuel."
                : "Sélectionne un document pour voir sa progression."}
            </p>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${c.badge}`}>
            <span className={`h-2 w-2 rounded-full ${c.dot}`} aria-hidden="true" />
            {badgeText}
          </span>
        </div>

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full" style={{ width: `${pct}%` }}>
            <div key={`${statut ?? "none"}:${pct}`} className={`h-full ${c.bar} progress-grow`} />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2 text-[11px] font-semibold text-slate-500">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${i <= idx ? c.dot : "bg-slate-200"}`} aria-hidden="true" />
              <span className={i === idx ? "text-slate-900" : ""}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}