"use client";

import { Suspense, useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, ChevronDown, Activity, PackageCheck, ChevronLeft, ChevronRight as ChevronRightIcon, CheckCircle } from "lucide-react";

import TopHeader from "@/app/components/TopHeader";
import DemandeDetailModal from "@/app/demande-achat/components/DemandeDetailModal";
import ReceptionModal from "@/app/demande-achat/components/ReceptionModal";
import ResolveIssueModal from "@/app/demande-achat/components/ResolveIssueModal";
import DashboardTableView from "@/app/demande-achat/components/DashboardTableView";
import { DashboardFilterBar, useDashboardFilters } from "@/app/demande-achat/components/DashboardFilterBar";
import {
  type DemandePrimaryAction,
  formatDate,
  formatMoney,
  getCompactNeedLabel,
  getDemandePrimaryAction,
  needsReceptionAction,
  needsIssueResolutionAction,
  statusClasses,
  statusLabels,
  stepLabels,
} from "@/app/demande-achat/components/demandeAchatShared";
import {
  getCurrentUser,
  getLandingRouteForUser,
  getMarketRoleLabel,
  getToken,
  isLogistiqueUser,
  type UserProfile,
} from "@/services/auth";
import {
  DemandeAchat,
  listDemandesAchat,
} from "@/services/achats";

type SectionKey = "all" | "action";
type DetailViewMode = "detail" | "timeline";
type DisplayMode = "status" | "table";

type SectionData = {
  key: SectionKey;
  title: string;
  icon: React.ElementType;
  gradientFrom: string;
  gradientTo: string;
  textColor: string;
  bgLight: string;
  borderClass: string;
  items: DemandeAchat[];
  total: number;
  emptyText: string;
};

type RouterLike = {
  push: (href: string) => void;
};

type SearchResultsListProps = {
  items: DemandeAchat[];
  query: string;
  currentUser: UserProfile | null;
  router: RouterLike;
  onOpenDetail: (id: number) => void;
  onOpenTimeline: (id: number) => void;
  onOpenReception: (id: number) => void;
  onOpenResolveIssue: (id: number) => void;
};

type AccordionSectionProps = {
  section: SectionData;
  isActive: boolean;
  onToggle: () => void;
  currentUser: UserProfile | null;
  router: RouterLike;
  onOpenDetail: (id: number) => void;
  onOpenTimeline: (id: number) => void;
  onOpenReception: (id: number) => void;
  onOpenResolveIssue: (id: number) => void;
  isAlert?: boolean;
};

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
};

type CompactDemandeRowProps = {
  demande: DemandeAchat;
  sectionKey?: SectionKey;
  onOpenDetail: () => void;
  onOpenTimeline: () => void;
  onOpenReception: () => void;
  onOpenResolveIssue: () => void;
  action: DemandePrimaryAction | null;
  router: RouterLike;
};

const PAGE_SIZE = 5;

const filterDemandesByQuery = (items: DemandeAchat[], query: string) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return items;

  return items.filter((demande) => {
    const searchableText = [
      demande.numero_demande,
      demande.objet,
      getCompactNeedLabel(demande),
      demande.unite_technique,
      demande.service_beneficiaire,
      statusLabels[demande.statut] ?? demande.statut,
      stepLabels[demande.etape_validation_actuelle] ?? demande.etape_validation_actuelle,
    ].join(" ").toLowerCase();

    return searchableText.includes(normalizedQuery);
  });
};

const getSectionContextLine = (demande: DemandeAchat, sectionKey?: SectionKey | null) => {
  if (sectionKey === "action" || needsReceptionAction(demande) || needsIssueResolutionAction(demande)) {
    if (needsIssueResolutionAction(demande)) {
      return "Écart détecté - Résolution en attente.";
    }
    return demande.type_ecart
      ? "Réception à consolider avec écart signalé."
      : "Réception et contrôle de conformité attendus.";
  }
  return demande.date_bon_commande
    ? `Commandée le ${formatDate(demande.date_bon_commande)}`
    : `Créée le ${formatDate(demande.created_at)}`;
};

function MarcheDashboardPageFallback() {
  return (
    <main className="min-h-screen bg-slate-50 pb-12 text-slate-800">
      <TopHeader />
      <div className="mx-auto max-w-[1400px] px-4 py-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-16 rounded-2xl bg-white shadow-sm" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl border border-slate-200 bg-white shadow-sm" />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function MarcheDashboardPage() {
  return (
    <Suspense fallback={<MarcheDashboardPageFallback />}>
      <MarcheDashboardPageContent />
    </Suspense>
  );
}

function MarcheDashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filtre");
  const [currentUser] = useState(() => getCurrentUser());
  const marketRoleLabel = getMarketRoleLabel(currentUser);
  const [demandes, setDemandes] = useState<DemandeAchat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("status");
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null);
  const [selectedDemandeId, setSelectedDemandeId] = useState<number | null>(null);
  const [detailViewMode, setDetailViewMode] = useState<DetailViewMode>("detail");
  const [receptionModalDemandeId, setReceptionModalDemandeId] = useState<number | null>(null);
  const [resolveIssueModalDemandeId, setResolveIssueModalDemandeId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const searchParamsString = searchParams.toString();

  const mineScopeHref = useMemo(() => {
    const params = new URLSearchParams(searchParamsString);
    params.delete("scope");
    const queryString = params.toString();
    return queryString ? `/logistique?${queryString}` : "/logistique";
  }, [searchParamsString]);

  const allScopeHref = useMemo(() => {
    return "/demande-achat?scope=all";
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const reloadDemandes = async () => {
    try {
      const data = await listDemandesAchat("all");
      setDemandes(data);
    } catch {}
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    if (!isLogistiqueUser(currentUser)) {
      router.replace(getLandingRouteForUser(currentUser));
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const data = await listDemandesAchat("all");
        setDemandes(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [currentUser, router]);

  useEffect(() => {
    if (filterParam === "toutes") setActiveSection("all");
    else if (filterParam === "action") setActiveSection("action");
    else setActiveSection(null);
  }, [filterParam]);

  const marketBaseDemandes = useMemo(
    () =>
      demandes.filter((demande) =>
        ["EN_COMMANDE", "EN_LIVRAISON", "LIVREE", "CLOTUREE"].includes(demande.statut),
      ),
    [demandes],
  );
  const { filteredDemandes, filterProps } = useDashboardFilters(marketBaseDemandes);

  const marketDemandes = useMemo(
    () => filteredDemandes,
    [filteredDemandes],
  );
  const actionDemandes = useMemo(
    () => marketDemandes.filter((d) => needsReceptionAction(d) || needsIssueResolutionAction(d)),
    [marketDemandes],
  );

  const sections = useMemo<Record<SectionKey, SectionData>>(() => ({
    all: {
      key: "all",
      title: "Tous les dossiers Marché",
      icon: Activity,
      gradientFrom: "from-slate-700",
      gradientTo: "to-slate-900",
      textColor: "text-slate-700",
      bgLight: "bg-slate-100 text-slate-700",
      borderClass: "border-slate-200",
      items: marketDemandes,
      total: marketDemandes.length,
      emptyText: "Aucun dossier Marché pour l'instant.",
    },
    action: {
      key: "action",
      title: "Dossiers à Traiter (Réception & Écarts)",
      icon: PackageCheck,
      gradientFrom: "from-rose-500",
      gradientTo: "to-rose-600",
      textColor: "text-rose-700",
      bgLight: "bg-rose-50 text-rose-700",
      borderClass: "border-rose-200",
      items: actionDemandes,
      total: actionDemandes.length,
      emptyText: "Aucun dossier en attente de réception ou de résolution.",
    },
  }), [actionDemandes, marketDemandes]);

  // Si on est en train de chercher, on filtre tout et on affiche la vue recherche
  const isSearching = query.trim().length > 0;
  const searchResults = useMemo(() => isSearching ? filterDemandesByQuery(marketDemandes, query) : [], [isSearching, marketDemandes, query]);
  const radarDemandes = useMemo(
    () => (isSearching ? searchResults : marketDemandes),
    [isSearching, marketDemandes, searchResults],
  );

  const selectedDemande = useMemo(() => demandes.find((item) => item.id === selectedDemandeId) ?? null, [demandes, selectedDemandeId]);

  const handleRunTableAction = (
    demande: DemandeAchat,
    action: DemandePrimaryAction,
  ) => {
    if (action.href.endsWith("/reception")) {
      setReceptionModalDemandeId(demande.id);
      return;
    }

    if (action.href.endsWith("/resolve-issue")) {
      setResolveIssueModalDemandeId(demande.id);
      return;
    }

    router.push(action.href);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-12">
      <TopHeader />

      <div className="zoom-content h-full">
        <div className="mx-auto max-w-[1400px] px-4 py-8 animate-in slide-in-from-bottom-8 duration-700">
          <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200">
                <PackageCheck className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Espace Marché</h1>
                <p className="mt-0.5 text-[10px] font-black uppercase tracking-widest text-slate-400">{marketRoleLabel || "Agent marché"}</p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 md:w-auto md:min-w-[420px] md:items-end">
              <div className="flex w-full flex-wrap items-center gap-2 self-start md:w-auto md:justify-end md:self-auto">
                <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => router.replace(mineScopeHref)}
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors"
                  >
                    Mes dossiers
                  </button>
                  <button
                    type="button"
                    onClick={() => router.replace(allScopeHref)}
                    className="rounded-md px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    Tous les dossiers
                  </button>
                </div>

                <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setDisplayMode("status")}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                      displayMode === "status"
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    Vue par statut
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayMode("table")}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                      displayMode === "table"
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    Vue tableau
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-rose-500 transition-colors" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher un dossier..."
                    className="w-full bg-white border border-slate-300/80 rounded-xl py-2 pl-9 pr-8 text-sm outline-none shadow-sm transition-all focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                  />
                  {query && (
                    <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        <DashboardFilterBar filterProps={filterProps} />

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between p-4 gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex gap-2">
                    <div className="h-4 w-20 bg-slate-200 rounded"></div>
                    <div className="h-4 w-16 bg-slate-100 rounded"></div>
                  </div>
                  <div className="h-5 w-3/4 bg-slate-200 rounded"></div>
                </div>
                <div className="flex justify-end gap-2">
                  <div className="h-8 w-20 bg-slate-100 rounded-lg"></div>
                  <div className="h-8 w-32 bg-slate-200 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border-l-4 border-rose-500 bg-white p-5 text-sm font-medium text-rose-800 shadow-sm">
            {error}
          </div>
        ) : marketDemandes.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <Activity className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h2 className="text-lg font-bold text-slate-900 mb-2">Aucun dossier Marché</h2>
            <p className="text-sm text-slate-500 mb-6">
              Aucune expédition ou réception à traiter.
            </p>
          </div>
        ) : displayMode === "table" ? (
          <DashboardTableView
            title="Radar des dossiers marché"
            items={radarDemandes}
            query={query}
            currentUser={currentUser}
            emptyText="Aucun dossier visible dans cette vue."
            onOpenDetail={(id) => {
              setSelectedDemandeId(id);
              setDetailViewMode("detail");
            }}
            onRunAction={handleRunTableAction}
          />
        ) : isSearching ? (
          <div className="animate-in slide-in-from-top-2 fade-in duration-300">
            <SearchResultsList 
              items={searchResults} 
              query={query}
              currentUser={currentUser}
              router={router}
              onOpenDetail={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("detail"); }}
              onOpenTimeline={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("timeline"); }}
              onOpenReception={(id: number) => setReceptionModalDemandeId(id)}
              onOpenResolveIssue={(id: number) => setResolveIssueModalDemandeId(id)}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {sections.action.total > 0 && <AccordionSection section={sections.action} isActive={activeSection === "action"} onToggle={() => setActiveSection(activeSection === "action" ? null : "action")} currentUser={currentUser} router={router} onOpenDetail={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("detail"); }} onOpenTimeline={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("timeline"); }} onOpenReception={(id: number) => setReceptionModalDemandeId(id)} onOpenResolveIssue={(id: number) => setResolveIssueModalDemandeId(id)} isAlert />}
            <AccordionSection section={sections.all} isActive={activeSection === "all"} onToggle={() => setActiveSection(activeSection === "all" ? null : "all")} currentUser={currentUser} router={router} onOpenDetail={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("detail"); }} onOpenTimeline={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("timeline"); }} onOpenReception={(id: number) => setReceptionModalDemandeId(id)} onOpenResolveIssue={(id: number) => setResolveIssueModalDemandeId(id)} />
          </div>
        )}
      </div>
    </div>

      <DemandeDetailModal
        demande={selectedDemande}
        open={!!selectedDemande}
        onClose={() => setSelectedDemandeId(null)}
        defaultShowTimeline={detailViewMode === "timeline"}
      />

      <ReceptionModal
        key={receptionModalDemandeId ? `reception-${receptionModalDemandeId}` : "reception-closed"}
        demande={demandes.find((item) => item.id === receptionModalDemandeId) ?? null}
        open={!!receptionModalDemandeId}
        onClose={() => setReceptionModalDemandeId(null)}
        onSuccess={() => {
          setReceptionModalDemandeId(null);
          reloadDemandes();
          showToast("Réception enregistrée avec succès !");
        }}
      />
      <ResolveIssueModal
        demande={demandes.find((item) => item.id === resolveIssueModalDemandeId) ?? null}
        open={!!resolveIssueModalDemandeId}
        onClose={() => setResolveIssueModalDemandeId(null)}
        onSuccess={() => {
          setResolveIssueModalDemandeId(null);
          reloadDemandes();
          showToast("Écart résolu avec succès !");
        }}
      />

      {toastMessage && (
        <div className="ucp-toast ucp-toast--success animate-in slide-in-from-bottom-8 fade-in duration-300">
          <CheckCircle className="h-6 w-6 shrink-0" />
          <span className="ucp-toast__message">{toastMessage}</span>
        </div>
      )}
    </main>
  );
}

function SearchResultsList({ items, query, currentUser, router, onOpenDetail, onOpenTimeline, onOpenReception, onOpenResolveIssue }: SearchResultsListProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(items.length / PAGE_SIZE) || 1;
  const paginatedItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
        <h2 className="text-[12px] font-black uppercase tracking-widest text-slate-900">Résultats de recherche</h2>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
          {items.length} correspondant à « {query} »
        </p>
      </div>
      
      {items.length === 0 ? (
        <div className="p-8 text-center text-slate-500">Aucun résultat trouvé pour cette recherche.</div>
      ) : (
        <div className="p-4 space-y-3">
          {paginatedItems.map((demande: DemandeAchat) => (
            <CompactDemandeRow
              key={demande.id}
              demande={demande}
              onOpenDetail={() => onOpenDetail(demande.id)}
              onOpenTimeline={() => onOpenTimeline(demande.id)}
              onOpenReception={() => onOpenReception(demande.id)}
              onOpenResolveIssue={() => onOpenResolveIssue(demande.id)}
              action={getDemandePrimaryAction(demande, currentUser)}
              router={router}
            />
          ))}
          
          {totalPages > 1 && (
            <PaginationControls page={page} totalPages={totalPages} setPage={setPage} />
          )}
        </div>
      )}
    </div>
  );
}

function AccordionSection({ section, isActive, onToggle, currentUser, router, onOpenDetail, onOpenTimeline, onOpenReception, onOpenResolveIssue, isAlert = false }: AccordionSectionProps) {
  const Icon = section.icon;
  const hasItems = section.total > 0;
  const sectionRef = useRef<HTMLDivElement>(null);
  void isAlert;
  
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(section.items.length / PAGE_SIZE) || 1;
  const paginatedItems = section.items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (isActive && sectionRef.current) {
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [isActive]);

  return (
    <div ref={sectionRef} className={`overflow-hidden rounded-2xl border transition-all duration-300 ${isActive ? 'border-slate-300 bg-white shadow-md ring-4 ring-slate-100' : 'border-slate-200 bg-white shadow-sm hover:border-slate-300'}`}>
      <button
        onClick={onToggle}
        disabled={!hasItems}
        className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${!hasItems ? 'bg-slate-50/50 cursor-not-allowed opacity-60' : isActive ? 'bg-slate-50 border-b border-slate-200' : 'bg-white hover:bg-slate-50'}`}
      >
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-xl shadow-inner bg-gradient-to-br ${section.gradientFrom} ${section.gradientTo} text-white`}>
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
          <span className="text-[14px] font-black uppercase tracking-widest text-slate-900">{section.title}</span>
          
          <span className={`ml-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${hasItems ? `bg-white text-slate-800 border border-slate-200` : 'bg-slate-100 text-slate-400'}`}>
            {section.total}
          </span>
        </div>
        
        {isActive && hasItems && (
          <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span className={isActive ? 'text-slate-900' : ''}>
              {isActive ? 'Masquer' : 'Afficher'}
            </span>
            <div className={`p-1 rounded-lg transition-all ${isActive ? 'bg-slate-900 text-white rotate-180' : 'bg-slate-100 text-slate-400'}`}>
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
          </div>
        )}
      </button>

      {isActive && hasItems && (
        <div className="bg-slate-50/50 p-4 space-y-3">
          {paginatedItems.map((demande) => (
            <CompactDemandeRow
              key={demande.id}
              demande={demande}
              sectionKey={section.key}
              onOpenDetail={() => onOpenDetail(demande.id)}
              onOpenTimeline={() => onOpenTimeline(demande.id)}
              onOpenReception={() => onOpenReception(demande.id)}
              onOpenResolveIssue={() => onOpenResolveIssue(demande.id)}
              action={getDemandePrimaryAction(demande, currentUser)}
              router={router}
            />
          ))}
          
          {totalPages > 1 && (
            <PaginationControls page={page} totalPages={totalPages} setPage={setPage} />
          )}
        </div>
      )}
    </div>
  );
}

function PaginationControls({ page, totalPages, setPage }: PaginationControlsProps) {
  return (
    <div className="flex items-center justify-between pt-2 px-2">
      <p className="text-xs font-medium text-slate-500">
        Page {page} sur {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="p-1 rounded-md border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="p-1 rounded-md border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function CompactDemandeRow({ demande, sectionKey, onOpenDetail, onOpenTimeline, onOpenReception, onOpenResolveIssue, action, router }: CompactDemandeRowProps) {
  void onOpenTimeline;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm hover:border-slate-400 hover:shadow-md transition-all duration-300 group/row">
      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-2 mb-2">
          <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded tracking-widest uppercase">{demande.numero_demande}</span>
          <span className={`px-2 py-0.5 text-[9px] uppercase font-black rounded tracking-widest shadow-sm ${statusClasses[demande.statut] ?? "bg-slate-200 text-slate-700"}`}>
            {statusLabels[demande.statut] ?? demande.statut}
          </span>
        </div>
        
        <p className="text-[14px] font-bold text-slate-900 truncate mb-1.5 leading-tight group-hover/row:text-slate-700 transition-colors" title={demande.objet}>
          {demande.objet}
        </p>
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-bold text-slate-400">
          <span className="text-slate-600 flex items-center gap-1.5">
            {getCompactNeedLabel(demande)}
          </span>
          <span className="text-slate-900 bg-slate-50 px-1.5 py-0.5 rounded">{formatMoney(demande.montant_commande ?? demande.cout_total_estime)}</span>
          <span className="text-indigo-600 font-medium italic hidden sm:block truncate max-w-[300px]">
            {getSectionContextLine(demande, sectionKey)}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 w-full sm:w-auto items-center gap-2 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-50">
        <button
          onClick={onOpenDetail}
          className="flex-1 sm:flex-none rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-600 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all text-center"
        >
          Détail
        </button>

        {action && (
          <button
            onClick={() => {
              if (action.href.endsWith("/reception")) {
                onOpenReception();
              } else if (action.href.endsWith("/resolve-issue")) {
                onOpenResolveIssue();
              } else {
                router.push(action.href);
              }
            }}
            className="flex-1 sm:flex-none rounded-xl px-5 py-2 text-[11px] font-black uppercase tracking-widest text-white bg-slate-900 shadow-lg shadow-slate-100 hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 transition-all text-center"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
