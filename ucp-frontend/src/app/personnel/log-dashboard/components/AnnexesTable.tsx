import { AnnexeRatio } from "@/types/adminDashboard";
import { FileDown } from "lucide-react";

export default function AnnexesTable({ data }: { data: AnnexeRatio[] }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md flex flex-col">
      <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />

      <div className="mb-5 pt-1">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white">
            1
          </div>
          Annexes les plus téléchargées
        </h3>
        <p className="text-xs text-slate-500 mt-1 ml-7">Top 10 des fichiers annexes les plus consultés par les soumissionnaires.</p>
      </div>

      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100">
              <th className="p-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Fichier Annexe</th>
              <th className="p-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 text-center">Téléchargements</th>
              <th className="p-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 text-right">Intérêt (Ratio)</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-sm">
            {data.slice(0, 10).map((item: AnnexeRatio) => (
              <tr key={item.annexe_name} className="hover:bg-slate-50/50 transition duration-150">
                <td className="p-3.5 font-semibold text-slate-700 max-w-[200px] truncate">
                  <div className="flex items-center gap-2">
                    <FileDown size={14} className="text-slate-400 flex-shrink-0" />
                    <span className="truncate">{item.annexe_name.split("/").pop()}</span>
                  </div>
                </td>
                <td className="p-3.5 text-slate-600 font-semibold text-center">
                  {item.total_downloads}
                </td>
                <td className="p-3.5 text-right">
                  <span className="inline-flex items-center bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md text-xs border border-emerald-100">
                    {item.download_rate_percentage}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}