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
    const token = getToken();
    const accessType = Cookies.get("access_type")
    const handleGetProfile = async () => {
      if (accessType === "private" && token) {
      try {
        const savedUserInfo = Cookies.get("user_info");
        if (savedUserInfo) {
          const parsedUser = JSON.parse(savedUserInfo);
          
          if (isMounted) {
            setUser({
              id: parsedUser.personnel_id,
              email: parsedUser.email,
              role: parsedUser.role
            } as UserProfileValue);
          }
        }
      } catch (err) {
        console.error("Erreur lors du décodage du token externe :", err);
      }
    } 
    else if (token) {
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
    return <div className="p-12 text-gray-500 text-center animate-pulse">Chargement des marchés...</div>;
  }

  if (!data) {
    return <div className="p-12 text-red-500 text-center font-medium">Une erreur est survenue lors de la récupération des données.</div>;
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

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <TopHeader />

      <div className="max-w-6xl mx-auto px-4 mt-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Marchés de l UCP</h1>
        <form
          key={formKey}
          onSubmit={handleFilterSubmit}
          className="w-full bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6 space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Rechercher par titre, réf, code..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 text-gray-800"
            />
            <button type="submit" className="px-6 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-md transition whitespace-nowrap">
              🔍 Filtrer
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
            <div>
              <label className="block font-medium mb-1">Publié après le :</label>
              <input
                type="date"
                value={dateFilters.publishAfter}
                onChange={(e) => setDateFilters({ ...dateFilters, publishAfter: e.target.value })}
                className="w-full p-2 border rounded-md text-gray-800"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Publié avant le :</label>
              <input
                type="date"
                value={dateFilters.publishBefore}
                onChange={(e) => setDateFilters({ ...dateFilters, publishBefore: e.target.value })}
                className="w-full p-2 border rounded-md text-gray-800"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Limite après le :</label>
              <input
                type="date"
                value={dateFilters.deadlineAfter}
                onChange={(e) => setDateFilters({ ...dateFilters, deadlineAfter: e.target.value })}
                className="w-full p-2 border rounded-md text-gray-800"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Limite avant le :</label>
              <input
                type="date"
                value={dateFilters.deadlineBefore}
                onChange={(e) => setDateFilters({ ...dateFilters, deadlineBefore: e.target.value })}
                className="w-full p-2 border rounded-md text-gray-800"
              />
            </div>
          </div>
        </form>

        <div className="space-y-4 mb-8">
          {(data.results ?? []).length === 0 ? (
            <p className="text-gray-500 bg-white p-6 rounded-lg border text-center">Aucun marché trouvé.</p>
          ) : (
            data.results.map((market) => (
              <div key={market.id} className="border border-gray-200 p-6 rounded-lg shadow-sm bg-white hover:shadow-md transition">

                <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-4 border-b border-gray-100 pb-3">
                  <div>
                    <span
                      onClick={() => handleToDetailRedirection((market.id).toString())}
                      className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600 font-semibold hover:cursor-pointer">
                      Ref: {market.reference_number}
                    </span>
                    <h2 className="text-xl font-semibold text-gray-800 mt-2">{market.title}</h2>
                    {market.procedure_type == "DC" && (
                      <span className="text-xs bg-amber-100 border border-amber-200 text-amber-800 px-2.5 py-0.5 rounded-full font-bold animate-pulse flex items-center gap-1">
                        ⚡ DC – réponse sous 5 jours
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded px-3 py-1.5 whitespace-nowrap">
                    <span className="font-medium">En ligne :</span> {formatDate(market.publication_date)} <br />
                    <span className="font-medium text-red-600">Limite :</span> {getCountdown(market.deadline)}
                    {market.category === "SERVICES" && (
                      <div>
                        <h2>Dates prévisionnelles de l’atelier</h2>
                        {market.dates_atelier_details && market.dates_atelier_details.length > 0 ? (
                          market.dates_atelier_details.map((item, index) => (
                            <div key={item.id || index} className="text-gray-600">
                              <span>• {formatDate(item.dates_atelier)}</span>
                            </div>
                          ))
                        ) : (
                          <span>aucun</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mb-4">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Financement & Origine</span>
                    <div className="space-y-1">
                      <div className="flex gap-1.5 flex-wrap">
                        <span className="text-gray-600 font-medium">Bailleurs :</span>
                        {market.financing_sources && market.financing_sources.length > 0 ? (
                          market.financing_sources.map((source, idx) => (
                            <span key={`${source}-${idx}`} className="bg-white border px-2 py-0.5 rounded text-xs text-gray-700">
                              {source}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 italic">Non spécifié</span>
                        )}
                      </div>
                      {market.reference_bailleur && (
                        <p className="text-gray-600 mt-1">
                          <span className="font-medium">Réf. Bailleur :</span> {market.reference_bailleur}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Annexes</span>
                      {user && market.annexes && market.annexes.length > 0 ? (
                        <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                          {market.annexes.map((annexe) => (
                            <a
                              key={annexe.id}
                              href={annexe.file}
                              onClick={() => handleTrackDownload(market.id.toString(), user.id.toString(), "DOWNLOAD_ANNEXE", annexe.file.toString())}
                              download
                              className="text-blue-600 hover:underline text-xs inline-flex items-center gap-1"
                            >
                              📎 {annexe.file.split("/").pop() || "Fichier annexe"}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Aucune annexe disponible</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleDownloadDAO(market.id.toString())}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition flex items-center gap-2 shadow-sm"
                  >
                    📥 Télécharger le DAO complet
                  </button>
                </div>

              </div>
            ))
          )}
        </div>

        <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <Link
            href={getPaginationUrl(Number(currentPage) - 1)} onClick={handlePageChange}
            className={`px-4 py-2 text-sm font-medium border rounded-md text-gray-700 bg-white hover:bg-gray-50 transition ${!data.previous ? 'pointer-events-none opacity-40' : ''}`}
          >
            ← Précédent
          </Link>

          <span className="text-sm text-gray-600 font-medium">Page {currentPage} sur {totalPages}</span>

          <Link
            href={getPaginationUrl(Number(currentPage) + 1)} onClick={handlePageChange}
            className={`px-4 py-2 text-sm font-medium border rounded-md text-gray-700 bg-white hover:bg-gray-50 transition ${!data.next ? 'pointer-events-none opacity-40' : ''}`}
          >
            Suivant →
          </Link>
        </div>
      </div>
    </div>
  );
}