import { AnnexeRatio } from "@/types/adminDashboard";
import { FileDown } from "lucide-react";

export default function AnnexesTable({ data }: { data: AnnexeRatio[] }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs flex flex-col">
      <div className="mb-5">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Annexes les plus téléchargées
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">Top 10 des fichiers annexes les plus consultés par les soumissionnaires.</p>
      </div>

      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100">
              <th className="p-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Fichier Annexe</th>
              <th className="p-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Téléchargements</th>
              <th className="p-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Intérêt (Ratio)</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-sm">
            {data.slice(0, 10).map((item: AnnexeRatio) => (
              <tr key={item.annexe_name} className="hover:bg-slate-50/50 transition duration-150">
                <td className="p-3.5 font-medium text-slate-700 max-w-[200px] truncate">
                  <div className="flex items-center gap-2">
                    <FileDown size={14} className="text-slate-400 flex-shrink-0" />
                    <span className="truncate">{item.annexe_name.split("/").pop()}</span>
                  </div>
                </td>
                <td className="p-3.5 text-slate-600 font-semibold text-center">
                  {item.total_downloads}
                </td>
                <td className="p-3.5 text-right">
                  <span className="inline-flex items-center bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md text-xs border border-blue-100">
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