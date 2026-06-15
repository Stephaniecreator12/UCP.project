import { UserTraceability } from "@/types/adminDashboard";
import { Building2, Eye, Download } from "lucide-react";

export default function UsersTraceability({ users }: { users: UserTraceability[] }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs flex flex-col">
      <div className="mb-5">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Traçabilité des entreprises soumissionnaires
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">Historique des interactions et niveau d engagement de chaque entité enregistrée.</p>
      </div>

      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100">
              <th className="p-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Raison Sociale / Entreprise</th>
              <th className="p-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Création Compte</th>
              <th className="p-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Dernière Activité</th>
              <th className="p-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">DAO consultés</th>
              <th className="p-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">DAO téléchargés</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-slate-700">
            {users.map((user: UserTraceability) => (
              <tr key={user.user} className="hover:bg-slate-50/50 transition duration-150">
                <td className="p-3.5 font-bold text-slate-900">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-slate-100 text-slate-500 rounded-md">
                      <Building2 size={14} />
                    </div>
                    <span>{user.user}</span>
                  </div>
                </td>

                <td className="p-3.5 text-slate-500 font-medium">
                  {new Date(user.creation_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                </td>

                <td className="p-3.5 font-medium">
                  {user.lastLogin ? (
                    <span className="text-slate-700">
                      {new Date(user.lastLogin).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
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
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${
                    user.download.length > 0 ? "bg-green-50 text-green-700 border border-green-100" : "bg-slate-50 text-slate-400"
                  }`}>
                    <Download size={12} className={user.download.length > 0 ? "text-green-500" : "text-slate-300"} />
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