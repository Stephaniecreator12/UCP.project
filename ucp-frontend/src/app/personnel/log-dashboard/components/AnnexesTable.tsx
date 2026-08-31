import { AnnexeRatio } from "@/types/adminDashboard";
import { FileDown, Trophy, Medal, Award } from "lucide-react";

const RANK_STYLES = [
  {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <Trophy className="h-3.5 w-3.5 text-amber-500" />,
  },
  {
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    icon: <Medal className="h-3.5 w-3.5 text-slate-400" />,
  },
  {
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    icon: <Award className="h-3.5 w-3.5 text-orange-400" />,
  },
];

function getBarWidth(rate: number, maxRate: number): string {
  if (maxRate === 0) return "0%";
  return `${(rate / maxRate) * 100}%`;
}

export default function AnnexesTable({ data }: { data: AnnexeRatio[] }) {
  const sliced = data.slice(0, 10);
  const maxRate = Math.max(...sliced.map((d) => d.download_rate_percentage), 1);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
      {/* Top accent line */}
      <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-purple-400 to-fuchsia-400" />

      <div className="p-6">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <FileDown className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Annexes les plus téléchargées
              </h3>
              <p className="text-xs text-slate-400">
                Top 10 des fichiers par taux d&apos;intérêt
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {sliced.length} fichiers
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-100">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  #
                </th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Fichier
                </th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 text-center">
                  Téléchargements
                </th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Taux d&apos;intérêt
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sliced.map((item: AnnexeRatio, idx: number) => {
                const rankStyle = RANK_STYLES[idx] || null;
                return (
                  <tr
                    key={item.annexe_name}
                    className="group/row transition-colors hover:bg-slate-50/40"
                  >
                    {/* Rank */}
                    <td className="px-4 py-3">
                      {rankStyle ? (
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-md border text-[10px] font-extrabold ${rankStyle.badge}`}
                        >
                          {idx + 1}
                        </span>
                      ) : (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-slate-50 text-[10px] font-bold text-slate-400">
                          {idx + 1}
                        </span>
                      )}
                    </td>

                    {/* File name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {rankStyle && (
                          <span className="flex-shrink-0">{rankStyle.icon}</span>
                        )}
                        <span className="min-w-0 max-w-[200px] truncate text-sm font-semibold text-slate-700">
                          {item.annexe_name.split("/").pop()}
                        </span>
                      </div>
                    </td>

                    {/* Downloads */}
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-700">
                        {item.total_downloads}
                      </span>
                    </td>

                    {/* Rate bar */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-500"
                            style={{
                              width: getBarWidth(
                                item.download_rate_percentage,
                                maxRate
                              ),
                            }}
                          />
                        </div>
                        <span className="w-10 text-right text-[11px] font-bold tabular-nums text-slate-600">
                          {item.download_rate_percentage}%
                        </span>
                      </div>
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
