import { UserTraceability } from "@/types/adminDashboard";
import {
  Building2,
  Eye,
  Download,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

function getMaxConsultations(users: UserTraceability[]): number {
  return Math.max(...users.map((u) => u.consultations.length), 1);
}

function getMaxDownloads(users: UserTraceability[]): number {
  return Math.max(...users.map((u) => u.download.length), 1);
}

function getEngagementLevel(
  consultations: number,
  downloads: number,
  maxC: number,
  maxD: number
): { label: string; color: string; bg: string; border: string } {
  const score =
    maxC > 0 && maxD > 0
      ? (consultations / maxC) * 50 + (downloads / maxD) * 50
      : 0;

  if (score >= 70)
    return {
      label: "Élevé",
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    };
  if (score >= 30)
    return {
      label: "Moyen",
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
    };
  return {
    label: "Faible",
    color: "text-slate-500",
    bg: "bg-slate-50",
    border: "border-slate-200",
  };
}

export default function UsersTraceability({
  users,
}: {
  users: UserTraceability[];
}) {
  const maxC = getMaxConsultations(users);
  const maxD = getMaxDownloads(users);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
      {/* Top accent line */}
      <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-400" />

      <div className="p-6">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Traçabilité des entreprises
              </h3>
              <p className="text-xs text-slate-400">
                Engagement de chaque soumissionnaire
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {users.length} entreprises
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-100">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Entreprise
                </th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Inscrit le
                </th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Dernière activité
                </th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 text-center">
                  Consultations
                </th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 text-center">
                  Téléchargements
                </th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 text-center">
                  Engagement
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((user: UserTraceability, index) => {
                const engagement = getEngagementLevel(
                  user.consultations.length,
                  user.download.length,
                  maxC,
                  maxD
                );
                const cBarWidth =
                  maxC > 0
                    ? (user.consultations.length / maxC) * 100
                    : 0;
                const dBarWidth =
                  maxD > 0
                    ? (user.download.length / maxD) * 100
                    : 0;

                return (
                  <tr
                    key={`${user.user ?? "unknown"}-${index}`}
                    className="group/row transition-colors hover:bg-slate-50/40"
                  >
                    {/* Company */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 text-slate-500 ring-1 ring-slate-200/50">
                          <Building2 size={14} />
                        </div>
                        <span className="min-w-0 truncate text-sm font-bold text-slate-800">
                          {user.user}
                        </span>
                      </div>
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-semibold text-slate-500">
                        {new Date(user.creation_date).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </td>

                    {/* Last activity */}
                    <td className="px-4 py-3.5">
                      {user.lastLogin ? (
                        <div className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          <span className="text-xs font-semibold text-slate-700">
                            {new Date(
                              user.lastLogin
                            ).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          Jamais
                        </span>
                      )}
                    </td>

                    {/* Consultations */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <div className="relative h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full bg-blue-400 transition-all duration-500"
                            style={{ width: `${cBarWidth}%` }}
                          />
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-bold tabular-nums text-slate-700">
                          <Eye
                            size={12}
                            className="text-blue-400"
                          />
                          {user.consultations.length}
                        </span>
                      </div>
                    </td>

                    {/* Downloads */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <div className="relative h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full bg-emerald-400 transition-all duration-500"
                            style={{ width: `${dBarWidth}%` }}
                          />
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold tabular-nums ${
                            user.download.length > 0
                              ? "text-emerald-700"
                              : "text-slate-400"
                          }`}
                        >
                          <Download
                            size={12}
                            className={
                              user.download.length > 0
                                ? "text-emerald-500"
                                : "text-slate-300"
                            }
                          />
                          {user.download.length}
                        </span>
                      </div>
                    </td>

                    {/* Engagement badge */}
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${engagement.color} ${engagement.bg} ${engagement.border}`}
                      >
                        {user.download.length > 0 ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {engagement.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
