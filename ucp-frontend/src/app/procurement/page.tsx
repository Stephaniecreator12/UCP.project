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
import { UserProfile } from "@/types/profile";
import { Search, X, Plus, Download, ChevronDown, Filter, ClipboardList, Layers } from "lucide-react";
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
  const [group, setGroup] = useState(() => {
    const savedGroup = Cookies.get("groups");
    if (savedGroup) {
      try {
        return JSON.parse(savedGroup);
      } catch (e) {
        console.error("Erreur de parsing du cookie group", e);
      }
    }
    return [];
  });

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [dateFilters, setDateFilters] = useState(currentFilters);
  const router = useRouter();
  const hasActiveDateFilters = !!(dateFilters.publishAfter || dateFilters.publishBefore || dateFilters.deadlineAfter || dateFilters.deadlineBefore);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(hasActiveDateFilters);
  const formKey = `${currentSearch}-${resolvedParams.publish_after}-${resolvedParams.publish_before}-${resolvedParams.deadline_after}-${resolvedParams.deadline_before}`;
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const query: Record<string, string> = { page: "1" };
    if (searchInput.trim()) query.search = searchInput;

    if (dateFilters.publishAfter) query.publish_after = dateFilters.publishAfter;
    if (dateFilters.publishBefore) query.publish_before = dateFilters.publishBefore;
    if (dateFilters.deadlineAfter) query.deadline_after = dateFilters.deadlineAfter;
    if (dateFilters.deadlineBefore) query.deadline_before = dateFilters.deadlineBefore;

    const params = new URLSearchParams(query);
    const newRelativePathOrUrl = `/procurement?${params.toString()}`;

    const currentUrl = window.location.pathname + window.location.search;
    if (currentUrl === newRelativePathOrUrl) {
      setLoading(false);
      return;
    }
    setLoading(true);
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
      try {
        const result = await getme();
        if (isMounted && !result.error) {
          setUser(result.data);
        }
      } catch (err) {
        console.error("Erreur crash profil local :", err);
      }
    };
    handleGetProfile();

    return () => {
      isMounted = false;
    };
  }, [group]);
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
    resolvedParams.deadline_before,
    group
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
      <div className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#f6faf8_0%,transparent_25%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] text-slate-800 antialiased selection:bg-emerald-200">
        <TopHeader />
        <div className="flex h-[60vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#f6faf8_0%,transparent_25%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] text-slate-800 antialiased selection:bg-emerald-200">
        <TopHeader />
        <div className="mx-auto max-w-md px-4 py-12">
          <div className="rounded-2xl border border-rose-200 bg-white p-8 shadow-sm text-center">
            <p className="text-sm font-semibold text-rose-700">Une erreur est survenue lors de la récupération des données.</p>
          </div>
        </div>
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#f6faf8_0%,transparent_25%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] pb-24 text-slate-800 antialiased selection:bg-emerald-200">
      <TopHeader />

      <div className="mx-auto flex max-w-[1680px] flex-col gap-5 px-4 pb-12 pt-6 md:px-6 lg:pt-8">
        {/* Header Block */}
        <div className="group relative flex w-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_8px_24px_rgb(0,0,0,0.035)] md:flex-row md:items-center">
          <div className="absolute right-0 top-0 -z-10 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 opacity-50 blur-3xl transition-transform duration-700 group-hover:scale-110" />

          <div className="relative z-10 flex min-w-0 items-center gap-3">
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <div>
              <h1 className="truncate text-lg font-black tracking-tight text-slate-800">
                Marchés de l&apos;UCP
              </h1>
              <p className="text-[12px] font-semibold text-slate-500">
                Gestion et suivi des dossiers d&apos;appel d&apos;offres (DAO)
              </p>
            </div>
          </div>

          {
            group.length > 0 && !group.includes("PUBLIC") && (
              <button
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-700"
                onClick={handleCreateProcurementRedirection}
              >
                <Plus className="h-4 w-4" />
                Ajouter un DAO
              </button>
            )
          }
        </div>

        {/* Search & Filters Card */}
        <form
          key={formKey}
          onSubmit={handleFilterSubmit}
          className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md space-y-4"
        >
          <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 bg-[length:200%_100%] animate-gradient" />

          {/* Ligne principale : Recherche + Boutons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par titre, référence, code..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 pl-10 pr-10 text-[13px] font-semibold text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all duration-200 flex-1 sm:flex-initial ${
                  showAdvancedFilters
                    ? "border-slate-300 bg-slate-100 text-slate-700"
                    : "border-slate-200 bg-white/70 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                {showAdvancedFilters ? "Masquer les filtres" : "Filtres avancés"}
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 whitespace-nowrap flex-1 sm:flex-initial text-center justify-center"
              >
                Rechercher
              </button>
            </div>
          </div>

          {/* Panneau des filtres avancés */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-600 pt-3 border-t border-slate-100 transition-all duration-300 origin-top ${
              showAdvancedFilters
                ? "opacity-100 max-h-[500px] visible"
                : "opacity-0 max-h-0 invisible overflow-hidden !pt-0 !border-t-0"
            }`}
          >
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block mb-1.5">Publié après le :</label>
              <input
                type="date"
                value={dateFilters.publishAfter}
                onChange={(e) => setDateFilters({ ...dateFilters, publishAfter: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block mb-1.5">Publié avant le :</label>
              <input
                type="date"
                value={dateFilters.publishBefore}
                onChange={(e) => setDateFilters({ ...dateFilters, publishBefore: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block mb-1.5">Limite après le :</label>
              <input
                type="date"
                value={dateFilters.deadlineAfter}
                onChange={(e) => setDateFilters({ ...dateFilters, deadlineAfter: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block mb-1.5">Limite avant le :</label>
              <input
                type="date"
                value={dateFilters.deadlineBefore}
                onChange={(e) => setDateFilters({ ...dateFilters, deadlineBefore: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              />
            </div>

            {(dateFilters.publishAfter || dateFilters.publishBefore || dateFilters.deadlineAfter || dateFilters.deadlineBefore) && (
              <div className="sm:col-span-2 md:col-span-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setDateFilters({ publishAfter: "", publishBefore: "", deadlineAfter: "", deadlineBefore: "" });
                    setSearchInput("");

                    const currentUrl = window.location.pathname + window.location.search;
                    if (currentUrl === '/procurement') {
                      return;
                    }
                    setLoading(true);
                    router.push('/procurement');
                  }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
                >
                  Effacer tous les filtres
                </button>
              </div>
            )}
          </div>
        </form>

        {/* Liste des marchés */}
        <div className="space-y-4">
          {(data.results ?? []).length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center backdrop-blur-md">
              <ClipboardList className="mx-auto h-8 w-8 text-slate-300 mb-3" />
              <p className="text-[13px] font-semibold text-slate-500">Aucun marché trouvé.</p>
            </div>
          ) : (
            data.results.map((market) => (
              <div
                key={market.id}
                className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]"
              >
                <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />

                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4 pt-1">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        onClick={() => handleToDetailRedirection((market.id).toString())}
                        className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-200 transition cursor-pointer"
                      >
                        Réf: {market.reference_number}
                      </span>

                      {market.procedure_type === "DC" && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                          DC – Réponse sous 5 jours
                        </span>
                      )}
                    </div>

                    <h2 className="text-[14px] font-black leading-tight text-slate-800">
                      {market.title}
                    </h2>
                  </div>

                  <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 w-full md:w-auto min-w-[220px]">
                    <div>
                      <span className="text-slate-400 font-semibold">En ligne le :</span>{" "}
                      <span className="font-bold text-slate-700">{formatDate(market.publication_date)}</span>
                    </div>
                    <div className="pt-1 border-t border-slate-200">
                      <span className="text-rose-600 font-bold">Date limite :</span>{" "}
                      <span className="font-black text-slate-800">{getCountdown(market.deadline)}</span>
                    </div>

                    {market.category === "SERVICES" && (
                      <div className="mt-2 pt-2 border-t border-dashed border-slate-200">
                        <span className="font-semibold text-emerald-700 block mb-1">Dates prévisionnelles de l&apos;atelier :</span>
                        {market.dates_atelier_details && market.dates_atelier_details.length > 0 ? (
                          <div className="space-y-0.5 max-h-16 overflow-y-auto">
                            {market.dates_atelier_details.map((item, index) => (
                              <div key={item.id || index} className="text-slate-600 flex items-center gap-1">
                                <span className="text-emerald-500">•</span> <span>{formatDate(item.dates_atelier)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Aucune date renseignée</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-5">
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block mb-2.5">Financement & Origine</span>
                    <div className="space-y-2">
                      <div className="flex items-start gap-1.5 flex-wrap">
                        <span className="text-slate-500 font-semibold text-xs mt-0.5">Bailleurs :</span>
                        {market.financing_sources && market.financing_sources.length > 0 ? (
                          market.financing_sources.map((source, idx) => (
                            <span key={`${source}-${idx}`} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-xs font-semibold text-slate-700">
                              {source}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic text-xs">Non spécifié</span>
                        )}
                      </div>
                      {market.reference_bailleur && (
                        <p className="text-slate-700 text-xs pt-1 border-t border-dashed border-slate-200">
                          <span className="font-semibold text-slate-500">Réf. Bailleur :</span>{" "}
                          <span className="font-mono font-semibold">{market.reference_bailleur}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block mb-2.5">Annexes</span>
                      {user && market.annexes && market.annexes.length > 0 ? (
                        <div className="flex flex-col gap-2 max-h-24 overflow-y-auto">
                          {market.annexes.map((annexe) => (
                            <a
                              key={annexe.id}
                              href={annexe.file}
                              onClick={() => handleTrackDownload(market.id.toString(), user.id.toString(), "DOWNLOAD_ANNEXE", annexe.file.toString())}
                              download
                              className="text-emerald-700 hover:text-emerald-900 font-semibold text-xs inline-flex items-center gap-1.5 transition"
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span className="truncate max-w-[280px]">
                                {annexe.file.split("/").pop() || "Fichier annexe"}
                              </span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic block mt-1">Aucune annexe disponible</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleDownloadDAO(market.id.toString())}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-700 transition-all hover:-translate-y-0.5 hover:bg-emerald-100"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger le DAO complet
                  </button>
                </div>

              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center rounded-3xl border border-white/40 bg-white/70 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md">
          <Link
            href={getPaginationUrl(Number(currentPage) - 1)}
            onClick={handlePageChange}
            className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 ${!data.previous ? 'pointer-events-none opacity-40' : ''}`}
          >
            ← Précédent
          </Link>

          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
            Page {currentPage} sur {totalPages}
          </span>

          <Link
            href={getPaginationUrl(Number(currentPage) + 1)}
            onClick={handlePageChange}
            className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 ${!data.next ? 'pointer-events-none opacity-40' : ''}`}
          >
            Suivant →
          </Link>
        </div>
      </div>
    </main>
  );
}