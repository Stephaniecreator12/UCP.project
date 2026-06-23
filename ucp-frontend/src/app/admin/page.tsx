import Link from "next/link";
import TopHeader from "../components/TopHeader";
export default function AdminDashboardPage() {
  const adminModules = [
    {
      id: "dashboard",
      title: "Tableau de Bord",
      description: "Vue d'ensemble des statistiques, indicateurs clés et activités récentes de l'UCP.",
      href: "/admin/dashboard",
      icon: "📊",
      isActive: true,
    },
    {
      id: "procurement",
      title: "Gestion des Marchés",
      description: "Création, gestion et suivi des dossiers d'appel d'offres (DAO) et des contrats.",
      href: "/procurement/",
      icon: "📁",
      isActive: true,
    },
    {
      id: "evaluations",
      title: "Évaluations",
      description: "Suivi des évaluations des offres, notations et commissions d'attribution.",
      href: "/admin/evaluations",
      icon: "📋",
      isActive: true,
    },
  ];

  return (
    <div className="w-full min-h-screen bg-gray-50/60 pb-16 font-sans p-2.5">
      <TopHeader></TopHeader>

      <div className="max-w-7xl mx-auto px-4 mt-8">
        {/* En-tête de la page */}
        <div className="flex flex-col sm:flex-row w-full justify-between items-start sm:items-center gap-4 mb-10 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Administration UCP Ambohimiandra
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Panneau central pour la gestion des modules et accès de l'application
            </p>
          </div>
          <div className="bg-green-50 border border-green-100 px-4 py-2 rounded-lg">
            <span className="text-sm font-semibold text-green-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Espace Administrateur
            </span>
          </div>
        </div>

        {/* Grille des modules (Routes) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminModules.map((module) => (
            <Link
              key={module.id}
              href={module.isActive ? module.href : "#"}
              className={`block border border-gray-200 border-t-4 ${
                module.isActive 
                  ? "border-t-green-600 bg-white hover:border-green-600/40 hover:shadow-xl hover:-translate-y-1 cursor-pointer" 
                  : "border-t-gray-300 bg-gray-50 opacity-75 cursor-not-allowed"
              } p-6 rounded-xl shadow-md transition-all duration-300 ease-in-out relative overflow-hidden group`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-lg ${module.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'} text-2xl shadow-2xs`}>
                  {module.icon}
                </div>
                <div className="flex-1">
                  <h2 className={`text-lg font-bold ${module.isActive ? 'text-gray-900' : 'text-gray-600'} leading-tight mt-1`}>
                    {module.title}
                  </h2>
                  {!module.isActive && (
                    <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Bientôt disponible
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 bg-slate-50 border border-gray-100 rounded-lg p-3 min-h-[80px]">
                {module.description}
              </p>

              {module.isActive && (
                <div className="mt-5 flex justify-end">
                  <span className="text-sm font-semibold text-green-700 group-hover:text-green-800 flex items-center gap-1 transition-colors">
                    Accéder au module <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}