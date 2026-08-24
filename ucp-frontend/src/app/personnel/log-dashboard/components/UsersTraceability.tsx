import { UserTraceability } from "@/types/adminDashboard";
import { Building2, Eye, Download, Layers } from "lucide-react";

export default function UsersTraceability({ users }: { users: UserTraceability[] }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md flex flex-col">
      <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />

      <div className="mb-5 pt-1">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white">
            1
          </div>
          Traçabilité des entreprises soumissionnaires
        </h3>
        <p className="text-xs text-slate-500 mt-1 ml-7">Historique des interactions et niveau d&apos;engagement de chaque entité enregistrée.</p>
      </div>

      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100">
              <th className="p-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Raison Sociale / Entreprise</th>
              <th className="p-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Création Compte</th>
              <th className="p-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Dernière Activité</th>
              <th className="p-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 text-center">DAO consultés</th>
              <th className="p-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 text-center">DAO téléchargés</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-slate-700">
            {users.map((user: UserTraceability,index) => (
              <tr key={`${user.user ?? "unknown"}-${index}`} className="hover:bg-slate-50/50 transition duration-150">
                <td className="p-3.5 font-bold text-slate-900">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-slate-100 text-slate-500 rounded-lg">
                      <Building2 size={14} />
                    </div>
                    <span>{user.user}</span>
                  </div>
                </td>

                <td className="p-3.5 text-slate-500 font-semibold">
                  {new Date(user.creation_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                </td>

                <td className="p-3.5 font-semibold">
                  {user.lastLogin ? (
                    <span className="text-slate-700">
                      {new Date(user.lastLogin).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        timeZone: "UTC",
                      })}
                      <span className="text-[10px] font-bold text-slate-400 ml-1">UTC</span>
                    </span>
                  ) : (
                    <span className="text-slate-300 italic text-xs">Jamais connecté</span>
                  )}
                </td>

                <td className="p-3.5 text-center">
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-slate-100 px-2 py-1 rounded-md text-slate-700">
                    <Eye size={12} className="text-slate-400" />
                    {user.consultations.length}
                  </span>
                </td>

                <td className="p-3.5 text-center">
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${user.download.length > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-50 text-slate-400"
                    }`}>
                    <Download size={12} className={user.download.length > 0 ? "text-emerald-500" : "text-slate-300"} />
                    {user.download.length}
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