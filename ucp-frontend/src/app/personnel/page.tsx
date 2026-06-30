import Link from "next/link";
import TopHeader from "../components/TopHeader";
export default function PersonnelDashboardPage() {
  const adminModules = [
    {
      id: "dashboard",
      title: "Tableau de Bord de suivi",
      description: "Vue d'ensemble des statistiques, indicateurs clés et activités récentes de l'UCP.",
      href: "/personnel/log-dashboard",
      icon: "📊",
      isActive: true,
    },
    {
      id: "procurement",
      title: "Gestion des Marchés",
      description: "Création, gestion et suivi des dossiers d'appel d'offres (DAO) et des contrats.",
      href: "/procurement",
      icon: "📁",
      isActive: true,
    },
    {
      id: "evaluations",
      title: "Évaluations",
      description: "Suivi des évaluations des offres, notations et commissions d'attribution.",
      href: "/personnel/evaluation",
      icon: "📋",
      isActive: true,
    },
    {
      id: "demande-achat",
      title: "Demandes d'Achat",
      description: "Suivi, validation et traitement des expressions de besoins et demandes d'achats.",
      href: "/personnel/demande-achat",
      icon: "🛒",
      isActive: true,
    },
    {
      id: "evaluation_offre",
      title: "Évaluation des Offres",
      description: "Analyse approfondie, comparaison technique et financière des offres soumises.",
      href: "/personnel/evaluation_offre",
      icon: "⚖️",
      isActive: true,
    },
    {
      id: "log-dashboard",
      title: "Logs & Historique",
      description: "Suivi des connexions, des modifications du système et de l'historique des actions.",
      href: "/personnel/log-dashboard",
      icon: "📜",
      isActive: true,
    },
    {
      id: "logistique",
      title: "Logistique",
      description: "Gestion de la chaîne logistique, du matériel, du stockage et des livraisons.",
      href: "/personnel/logistique",
      icon: "🚚",
      isActive: true,
    },
    {
      id: "marche",
      title: "Suivi des Marchés",
      description: "Registre officiel, exécution des contrats et cycle de vie des marchés publics.",
      href: "/personnel/marche",
      icon: "💼",
      isActive: true,
    },
    {
      id: "ouverture_offre",
      title: "Ouverture des Offres",
      description: "Gestion des séances d'ouverture des plis et enregistrement des candidatures.",
      href: "/personnel/ouverture_offre",
      icon: "🔓",
      isActive: true,
    },
    {
      id: "passation",
      title: "Passation des Marchés",
      description: "Planification, procédures de passation et conformité réglementaire.",
      href: "/personnel/passation",
      icon: "🤝",
      isActive: true,
    },
    {
      id: "tdrst",
      title: "TDR & Spécifications",
      description: "Gestion des Termes de Référence (TDR) et des Spécifications Techniques.",
      href: "/personnel/TdrSt",
      icon: "📝",
      isActive: true,
    },
    {
      id: "validation",
      title: "Validation & Approbation",
      description: "Circuit de signature, visas réglementaires et validations des étapes.",
      href: "/personnel/validation",
      icon: "✅",
      isActive: true,
    },
  ];

  return (
    <div className="w-full min-h-screen bg-gray-50/60 pb-16 font-sans p-2.5">
      <TopHeader></TopHeader>

      <div className="max-w-[1800px] mx-auto px-8 mt-10">
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10">
          {adminModules.map((module) => (
            <Link
              key={module.id}
              href={module.isActive ? module.href : "#"}
              className={`block border border-gray-200 border-t-4 ${
                module.isActive 
                  ? "border-t-green-600 bg-white hover:border-green-600/40 hover:shadow-xl hover:-translate-y-1 cursor-pointer" 
                  : "border-t-gray-300 bg-gray-50 opacity-75 cursor-not-allowed"
              } p-8 rounded-2xl min-h-[320px] flex flex-col justify-between shadow-md transition-all duration-300 ease-in-out relative overflow-hidden group`}
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