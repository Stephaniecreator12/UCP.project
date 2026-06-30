"use client";

import { useEffect, useState, use } from "react";
import { getMarkets } from "@/services/procurement";
import Link from "next/link";
import { getToken } from "@/services/auth";
import TopHeader from "@/app/components/TopHeader";
import { ProcurementMarket } from "@/types/procurement";
import { getCountdown } from "./components/countdown";
import { useRouter } from 'next/navigation';
import { trackUserAction } from "@/services/trackAction";
import { getme } from "@/services/profile";
import { UserProfileValue } from "@/types/profile";
import Cookies from "js-cookie";
import { useAccess } from "@/context/accessContext";
interface MarketData {
  count: number;
  previous: string | null;
  next: string | null;
  results: ProcurementMarket[];
}
const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  return dateStr.replace("T", " ").replace("Z", "").substring(0, 16);
};

export default function ProcurementPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string,
    publish_after?: string;
    publish_before?: string;
    deadline_after?: string;
    deadline_before?: string;
  }>;
}) {
  const { accessType, userInfo } = useAccess();
  const resolvedParams = use(searchParams);
  const currentPage = resolvedParams.page || "1";
  const currentSearch = resolvedParams.search || "";
  const currentFilters = {
    publishAfter: resolvedParams.publish_after || "",
    publishBefore: resolvedParams.publish_before || "",
    deadlineAfter: resolvedParams.deadline_after || "",
    deadlineBefore: resolvedParams.deadline_before || "",
  };

  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfileValue | null>(null);
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [dateFilters, setDateFilters] = useState(currentFilters);
  const router = useRouter();
  const formKey = `${currentSearch}-${resolvedParams.publish_after}-${resolvedParams.publish_before}-${resolvedParams.deadline_after}-${resolvedParams.deadline_before}`;
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const query: Record<string, string> = {
      page: "1",
      search: searchInput,
    };

    if (dateFilters.publishAfter) query.publish_after = dateFilters.publishAfter;
    if (dateFilters.publishBefore) query.publish_before = dateFilters.publishBefore;
    if (dateFilters.deadlineAfter) query.deadline_after = dateFilters.deadlineAfter;
    if (dateFilters.deadlineBefore) query.deadline_before = dateFilters.deadlineBefore;

    const params = new URLSearchParams(query);
    router.push(`/procurement?${params.toString()}`);
  };
  const handleViewTrack = async (dossierId: string) => {
    try {
      const token = getToken();
      if (user && token) {
        await trackUserAction({
          dossierId: dossierId,
          userId: user.id.toString(),
          actionType: 'VIEW',
        }, token);
      }
    } catch (e) {
      console.error(e)
    }

  }
  useEffect(() => {
    let isMounted = true;
    const handleGetProfile = async () => {
      if (accessType === "private") {
        try {
          if (userInfo) {
            if (isMounted) {
              setUser({
                id: String(userInfo.personnel_id),
                email: userInfo.email,
                role: userInfo.role
              } as UserProfileValue);
            }
          }
        } catch (err) {
          console.error("Erreur lors du décodage du token externe :", err);
        }
      }
      else if (accessType == "public") {
        try {
          const result = await getme();
          if (isMounted && !result.error) {
            setUser(result.data);
          }
        } catch (err) {
          console.error("Erreur crash profil local :", err);
        }
      }
    };
    handleGetProfile();

    return () => {
      isMounted = false;
    };
  }, []);
  useEffect(() => {
    let isMounted = true;

    const filtersForApi = {
      publishAfter: resolvedParams.publish_after || "",
      publishBefore: resolvedParams.publish_before || "",
      deadlineAfter: resolvedParams.deadline_after || "",
      deadlineBefore: resolvedParams.deadline_before || "",
    };

    getMarkets(currentPage, currentSearch, filtersForApi)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Erreur récupération marchés :", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    currentPage,
    currentSearch,
    resolvedParams.publish_after,
    resolvedParams.publish_before,
    resolvedParams.deadline_after,
    resolvedParams.deadline_before
  ]);

  const handleDownloadDAO = (id: string) => {
    if (!getToken()) {
      alert("Veuillez vous connecter pour télécharger le DAO.");
      return;
    }

    if (!id) {
      alert("Erreur : Ce marché ne possède pas de numéro de référence.");
      return;
    }

    window.open(`/api/procurement/markets/${id}`, "_blank");
  };
  const handleToDetailRedirection = (id: string) => {
    if (id) {
      handleViewTrack(id);
      router.push(`procurement/${id}`)
    }
  }
  const handlePageChange = () => {
    setLoading(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-green-700 text-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700 mb-4"></div>
        <span className="font-medium">Chargement des marchés de l UCP...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center max-w-md mx-auto mt-10 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium shadow-sm">
        ⚠️ Une erreur est survenue lors de la récupération des données.
      </div>
    );
  }

  const totalPages = data.count > 0 ? Math.ceil(data.count / 10) : 1;

  const handleTrackDownload = async (
    dossierId: string, userId: string, actionType: string, annexeName: string) => {
    const data = {
      dossierId,
      userId,
      actionType,
      annexeName
    }
    try {
      const token = getToken()
      if (token) {
        await trackUserAction(data, token)
      }

    } catch (e) {
      console.error(e);
    }
  }
  const getPaginationUrl = (pageNumber: number) => {
    const params = new URLSearchParams({
      page: pageNumber.toString(),
      search: currentSearch,
      ...(currentFilters.publishAfter && { publishAfter: currentFilters.publishAfter }),
      ...(currentFilters.publishBefore && { publishBefore: currentFilters.publishBefore }),
      ...(currentFilters.deadlineAfter && { deadlineAfter: currentFilters.deadlineAfter }),
      ...(currentFilters.deadlineBefore && { deadlineBefore: currentFilters.deadlineBefore }),
    });
    return `/procurement?${params.toString()}`;
  };
  const handleCreateProcurementRedirection = () => {
    router.replace(`/personnel/procurement/create`)
  }



  return (
    <div className="w-full min-h-screen bg-gray-50/60 pb-16 font-sans p-2.5">
      <TopHeader />

      <div className=" mx-auto px-4 mt-8">
        <div className="flex flex-col sm:flex-row w-full justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Marchés de l UCP
            </h1>
            <p className="text-sm text-gray-500 mt-1">Gestion et suivi des dossiers d appel d offres (DAO)</p>
          </div>
          {
            accessType == 'private' && (
              <button
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white font-medium text-sm rounded-lg shadow-sm hover:shadow transition-all duration-200"
                onClick={handleCreateProcurementRedirection}
              >
                <span>➕</span> Ajouter un DAO
              </button>
            )
          }

        </div>

        <form
          key={formKey}
          onSubmit={handleFilterSubmit}
          className="w-full bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-8 space-y-5"
        >
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                🔍
              </span>
              <input
                type="text"
                placeholder="Rechercher par titre, référence, code..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 text-gray-800 transition"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-medium rounded-lg transition-colors duration-200 whitespace-nowrap shadow-sm"
            >
              Filtrer les résultats
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600 pt-1 border-t border-gray-100">
            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">Publié après le :</label>
              <input
                type="date"
                value={dateFilters.publishAfter}
                onChange={(e) => setDateFilters({ ...dateFilters, publishAfter: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md text-gray-800 focus:ring-1 focus:ring-green-600 focus:border-green-600 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">Publié avant le :</label>
              <input
                type="date"
                value={dateFilters.publishBefore}
                onChange={(e) => setDateFilters({ ...dateFilters, publishBefore: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md text-gray-800 focus:ring-1 focus:ring-green-600 focus:border-green-600 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">Limite après le :</label>
              <input
                type="date"
                value={dateFilters.deadlineAfter}
                onChange={(e) => setDateFilters({ ...dateFilters, deadlineAfter: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md text-gray-800 focus:ring-1 focus:ring-green-600 focus:border-green-600 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">Limite avant le :</label>
              <input
                type="date"
                value={dateFilters.deadlineBefore}
                onChange={(e) => setDateFilters({ ...dateFilters, deadlineBefore: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md text-gray-800 focus:ring-1 focus:ring-green-600 focus:border-green-600 outline-none"
              />
            </div>
          </div>
        </form>

        {/* Liste des marchés */}
        <div className="space-y-6 mb-8">
          {(data.results ?? []).length === 0 ? (
            <div className="text-gray-500 bg-white p-12 rounded-xl border border-gray-200 text-center shadow-sm">
              <span className="text-3xl block mb-2">📁</span>
              <p className="font-medium">Aucun marché trouvé.</p>
            </div>
          ) : (
            data.results.map((market) => (
              <div
                key={market.id}
                className="border border-gray-200 border-l-4 border-l-green-600 p-6 rounded-xl shadow-md bg-white hover:border-green-600/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-in-out"
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4 border-b border-gray-100 pb-4">
                  <div className="space-y-2 flex-1">
                    <span
                      onClick={() => handleToDetailRedirection((market.id).toString())}
                      className="inline-block text-xs font-mono bg-green-50 text-green-800 px-2.5 py-1 rounded-md font-semibold border border-green-100 hover:bg-green-100 transition cursor-pointer"
                    >
                      Réf: {market.reference_number}
                    </span>

                    <h2 className="text-xl font-bold text-gray-900 leading-tight">
                      {market.title}
                    </h2>

                    {market.procedure_type === "DC" && (
                      <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 rounded-full font-semibold">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
                        ⚡ DC – Réponse sous 5 jours
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-600 bg-slate-50 border border-gray-200 rounded-xl p-3 space-y-1.5 w-full md:w-auto min-w-[220px] shadow-2xs">
                    <div>
                      <span className="text-gray-400 font-medium">En ligne le :</span> <span className="font-semibold text-gray-800">{formatDate(market.publication_date)}</span>
                    </div>
                    <div className="pt-1 border-t border-gray-200">
                      <span className="text-red-600 font-semibold">Date limite :</span> <span className="font-bold text-gray-900">{getCountdown(market.deadline)}</span>
                    </div>

                    {market.category === "SERVICES" && (
                      <div className="mt-2 pt-2 border-t border-dashed border-gray-200 text-[11px]">
                        <span className="font-semibold text-green-800 block mb-1">Dates prévisionnelles de l’atelier :</span>
                        {market.dates_atelier_details && market.dates_atelier_details.length > 0 ? (
                          <div className="space-y-0.5 max-h-16 overflow-y-auto">
                            {market.dates_atelier_details.map((item, index) => (
                              <div key={item.id || index} className="text-gray-600 flex items-center gap-1">
                                <span className="text-green-600">•</span> <span>{formatDate(item.dates_atelier)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Aucune date renseignée</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-5">
                  <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 shadow-2xs">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2.5">Financement & Origine</span>
                    <div className="space-y-2">
                      <div className="flex items-start gap-1.5 flex-wrap">
                        <span className="text-gray-500 font-medium text-xs mt-0.5">Bailleurs :</span>
                        {market.financing_sources && market.financing_sources.length > 0 ? (
                          market.financing_sources.map((source, idx) => (
                            <span key={`${source}-${idx}`} className="bg-white border border-gray-200 px-2 py-0.5 rounded text-xs font-medium text-gray-700 shadow-2xs">
                              {source}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 italic text-xs">Non spécifié</span>
                        )}
                      </div>
                      {market.reference_bailleur && (
                        <p className="text-gray-700 text-xs pt-1 border-t border-dashed border-gray-200">
                          <span className="font-medium text-gray-500">Réf. Bailleur :</span> <span className="font-mono font-medium">{market.reference_bailleur}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-between shadow-2xs">
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2.5">Annexes</span>
                      {user && market.annexes && market.annexes.length > 0 ? (
                        <div className="flex flex-col gap-2 max-h-24 overflow-y-auto">
                          {market.annexes.map((annexe) => (
                            <a
                              key={annexe.id}
                              href={annexe.file}
                              onClick={() => handleTrackDownload(market.id.toString(), user.id.toString(), "DOWNLOAD_ANNEXE", annexe.file.toString())}
                              download
                              className="text-green-700 hover:text-green-900 font-medium text-xs inline-flex items-center gap-1.5 transition"
                            >
                              <span className="text-base">📎</span>
                              <span className="truncate max-w-[280px] underline decoration-green-600/40 hover:decoration-green-900">
                                {annexe.file.split("/").pop() || "Fichier annexe"}
                              </span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic block mt-1">Aucune annexe disponible</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleDownloadDAO(market.id.toString())}
                    className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold rounded-lg transition-all duration-150 flex items-center gap-2 shadow-sm hover:shadow-md"
                  >
                    📥 Télécharger le DAO complet
                  </button>
                </div>

              </div>
            ))
          )}
        </div>

        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <Link
            href={getPaginationUrl(Number(currentPage) - 1)}
            onClick={handlePageChange}
            className={`px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition shadow-2xs ${!data.previous ? 'pointer-events-none opacity-40' : ''}`}
          >
            ← Précédent
          </Link>

          <span className="text-sm text-gray-600 font-semibold bg-gray-50 px-3 py-1.5 rounded-md border border-gray-100">
            Page {currentPage} sur {totalPages}
          </span>

          <Link
            href={getPaginationUrl(Number(currentPage) + 1)}
            onClick={handlePageChange}
            className={`px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition shadow-2xs ${!data.next ? 'pointer-events-none opacity-40' : ''}`}
          >
            Suivant →
          </Link>
        </div>
      </div>
    </div>
  );
}