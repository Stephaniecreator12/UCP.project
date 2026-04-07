"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, ChevronDown, Package, Truck, ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react";

import TopHeader from "@/app/components/TopHeader";
import DemandeDetailModal from "@/app/demande-achat/components/DemandeDetailModal";
import PassationModal from "@/app/demande-achat/components/PassationModal";
import LivraisonModal from "@/app/demande-achat/components/LivraisonModal";
import {
  formatDate,
  formatMoney,
  getCompactNeedLabel,
  getDemandePrimaryAction,
  sortDemandesByRecent,
  statusClasses,
  statusLabels,
  stepLabels,
} from "@/app/demande-achat/components/demandeAchatShared";
import {
  getCurrentUser,
  getLandingRouteForUser,
  getToken,
  getAgentAchatRoleLabel,
  isAgentAchatUser,
} from "@/services/auth";
import { DemandeAchat, listDemandesPassation } from "@/services/achats";

type SectionKey = "passation" | "livraison";
type DetailViewMode = "detail" | "timeline";

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

const PAGE_SIZE = 5;

const isPassationCandidate = (demande: DemandeAchat) => demande.statut === "VALIDEE";

const isDeliveryCandidate = (demande: DemandeAchat) =>
  demande.statut === "EN_COMMANDE" || demande.statut === "EN_LIVRAISON";

const getAgentSectionNote = (demande: DemandeAchat) => {
  if (demande.statut === "VALIDEE") {
    return "Validation terminée, commande à créer";
  }

  if (demande.date_arrivee_prevue) {
    return `Arrivée prévue le ${formatDate(demande.date_arrivee_prevue)}`;
  }

  if (demande.date_livraison_prevue) {
    return `Livraison prévue le ${formatDate(demande.date_livraison_prevue)}`;
  }

  return "Suivi expédition en cours";
};

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

export default function PassationDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser] = useState(() => getCurrentUser());
  const agentRoleLabel = getAgentAchatRoleLabel(currentUser);
  const [demandes, setDemandes] = useState<DemandeAchat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState<SectionKey | null>("passation");
  const [selectedDemandeId, setSelectedDemandeId] = useState<number | null>(null);
  const [detailViewMode, setDetailViewMode] = useState<DetailViewMode>("detail");
  const [passationModalDemandeId, setPassationModalDemandeId] = useState<number | null>(null);
  const [livraisonModalDemandeId, setLivraisonModalDemandeId] = useState<number | null>(null);

  const reloadDemandes = async () => {
    try {
      const data = await listDemandesPassation();
      setDemandes(data);
    } catch (err) {}
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    if (!isAgentAchatUser(currentUser)) {
      router.replace(getLandingRouteForUser(currentUser));
      return;
    }

    const load = async () => {
      try {
        const data = await listDemandesPassation();
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

  const orderedDemandes = useMemo(() => sortDemandesByRecent(demandes), [demandes]);
  const passationDemandes = useMemo(() => orderedDemandes.filter(isPassationCandidate), [orderedDemandes]);
  const livraisonDemandes = useMemo(() => orderedDemandes.filter(isDeliveryCandidate), [orderedDemandes]);

  const sections = useMemo<Record<SectionKey, SectionData>>(() => ({
    passation: {
      key: "passation",
      title: "File Passation",
      icon: Package,
      gradientFrom: "from-sky-500",
      gradientTo: "to-blue-600",
      textColor: "text-sky-700",
      bgLight: "bg-sky-50 text-sky-700",
      borderClass: "border-sky-200",
      items: passationDemandes,
      total: passationDemandes.length,
      emptyText: "Aucune demande validée à transformer en commande.",
    },
    livraison: {
      key: "livraison",
      title: "Suivi Livraison",
      icon: Truck,
      gradientFrom: "from-indigo-500",
      gradientTo: "to-violet-600",
      textColor: "text-indigo-700",
      bgLight: "bg-indigo-50 text-indigo-700",
      borderClass: "border-indigo-200",
      items: livraisonDemandes,
      total: livraisonDemandes.length,
      emptyText: "Aucune commande en cours de livraison.",
    },
  }), [passationDemandes, livraisonDemandes]);

  const isSearching = query.trim().length > 0;
  const searchResults = useMemo(() => isSearching ? filterDemandesByQuery(orderedDemandes, query) : [], [isSearching, orderedDemandes, query]);

  const selectedDemande = useMemo(() => demandes.find((item) => item.id === selectedDemandeId) ?? null, [demandes, selectedDemandeId]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-sky-100 selection:text-sky-900 pb-12">
      <TopHeader />

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Espace Agent Achat</h1>
            <div className="hidden h-6 w-[1px] bg-slate-300 md:block"></div>
            <p className="text-sm font-medium text-slate-500 hidden sm:block">{agentRoleLabel || "Agent achat"}</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un dossier..."
                className="w-full bg-white border border-slate-300/80 rounded-xl py-2 pl-9 pr-8 text-sm outline-none shadow-sm transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600" />
          </div>
        ) : error ? (
          <div className="rounded-xl border-l-4 border-rose-500 bg-white p-5 text-sm font-medium text-rose-800 shadow-sm">
            {error}
          </div>
        ) : orderedDemandes.length === 0 && !isSearching ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-50 mb-4">
              <Package className="h-8 w-8 text-sky-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Aucun dossier</h2>
            <p className="text-sm text-slate-500">
              Votre file de traitement est actuellement vide.
            </p>
          </div>
        ) : isSearching ? (
          <div className="animate-in slide-in-from-top-2 fade-in duration-300">
            <SearchResultsList 
              items={searchResults} 
              query={query}
              currentUser={currentUser}
              router={router}
              onOpenDetail={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("detail"); }}
              onOpenTimeline={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("timeline"); }}
              onOpenPassation={(id: number) => setPassationModalDemandeId(id)}
              onOpenLivraison={(id: number) => setLivraisonModalDemandeId(id)}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <AccordionSection 
              section={sections.passation} 
              isActive={activeSection === "passation"} 
              onToggle={() => setActiveSection(activeSection === "passation" ? null : "passation")} 
              currentUser={currentUser} 
              router={router} 
              onOpenDetail={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("detail"); }} 
              onOpenTimeline={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("timeline"); }} 
              onOpenPassation={(id: number) => setPassationModalDemandeId(id)}
              onOpenLivraison={(id: number) => setLivraisonModalDemandeId(id)}
              activeRingClass="ring-sky-50 border-sky-300"
              hoverBorderClass="hover:border-sky-200"
            />
            <AccordionSection 
              section={sections.livraison} 
              isActive={activeSection === "livraison"} 
              onToggle={() => setActiveSection(activeSection === "livraison" ? null : "livraison")} 
              currentUser={currentUser} 
              router={router} 
              onOpenDetail={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("detail"); }} 
              onOpenTimeline={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("timeline"); }} 
              onOpenPassation={(id: number) => setPassationModalDemandeId(id)}
              onOpenLivraison={(id: number) => setLivraisonModalDemandeId(id)}
              activeRingClass="ring-indigo-50 border-indigo-300"
              hoverBorderClass="hover:border-indigo-200"
            />
          </div>
        )}
      </div>

      <DemandeDetailModal
        demande={selectedDemande}
        open={!!selectedDemande}
        onClose={() => setSelectedDemandeId(null)}
        defaultShowTimeline={detailViewMode === "timeline"}
      />

      <PassationModal
        demande={demandes.find((item) => item.id === passationModalDemandeId) ?? null}
        open={!!passationModalDemandeId}
        onClose={() => setPassationModalDemandeId(null)}
        onOpenDetail={() => {
          setSelectedDemandeId(passationModalDemandeId);
          setDetailViewMode("detail");
        }}
        onSuccess={() => {
          setPassationModalDemandeId(null);
          reloadDemandes();
        }}
      />

      <LivraisonModal
        demande={demandes.find((item) => item.id === livraisonModalDemandeId) ?? null}
        open={!!livraisonModalDemandeId}
        onClose={() => setLivraisonModalDemandeId(null)}
        onOpenDetail={() => {
          setSelectedDemandeId(livraisonModalDemandeId);
          setDetailViewMode("detail");
        }}
        onSuccess={() => {
          setLivraisonModalDemandeId(null);
          reloadDemandes();
        }}
      />
    </main>
  );
}

function SearchResultsList({ items, query, currentUser, router, onOpenDetail, onOpenTimeline, onOpenPassation, onOpenLivraison }: any) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(items.length / PAGE_SIZE) || 1;
  const paginatedItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-bold text-slate-800">Résultats de recherche</h2>
        <p className="text-sm text-slate-500">
          {items.length} correspondant à "{query}"
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
              onOpenPassation={() => onOpenPassation(demande.id)}
              onOpenLivraison={() => onOpenLivraison(demande.id)}
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

function AccordionSection({ section, isActive, onToggle, currentUser, router, onOpenDetail, onOpenTimeline, onOpenPassation, onOpenLivraison, activeRingClass, hoverBorderClass }: any) {
  const Icon = section.icon;
  const hasItems = section.total > 0;
  const sectionRef = useRef<HTMLDivElement>(null);
  
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
    <div ref={sectionRef} className={`overflow-hidden rounded-2xl border transition-all ${isActive ? `${activeRingClass} shadow-md ring-4` : `border-slate-200 bg-white shadow-sm ${hoverBorderClass}`}`}>
      <button
        onClick={onToggle}
        disabled={!hasItems}
        className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${!hasItems ? 'bg-slate-50/50 cursor-not-allowed opacity-60' : isActive ? 'bg-slate-50 border-b border-slate-200' : 'bg-white hover:bg-slate-50'}`}
      >
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-xl shadow-inner bg-gradient-to-br ${section.gradientFrom} ${section.gradientTo} text-white`}>
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
          <span className="text-[1.05rem] font-bold text-slate-900">{section.title}</span>
          
          <span className={`ml-2 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${hasItems ? `bg-white text-slate-800 border border-slate-200` : 'bg-slate-100 text-slate-400'}`}>
            {section.total}
          </span>
        </div>
        
        {hasItems && (
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <span className={isActive ? 'text-slate-700' : 'text-slate-400'}>
              {isActive ? 'Fermer' : 'Traiter'}
            </span>
            <div className={`p-1 rounded-full transition-colors ${isActive ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-400'}`}>
              <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isActive ? 'rotate-180' : ''}`} />
            </div>
          </div>
        )}
      </button>

      {isActive && hasItems && (
        <div className="bg-slate-50/50 p-4 space-y-3">
          {paginatedItems.map((demande: any) => (
            <CompactDemandeRow
              key={demande.id}
              demande={demande}
              sectionKey={section.key}
              onOpenDetail={() => onOpenDetail(demande.id)}
              onOpenTimeline={() => onOpenTimeline(demande.id)}
              onOpenPassation={() => onOpenPassation(demande.id)}
              onOpenLivraison={() => onOpenLivraison(demande.id)}
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

function PaginationControls({ page, totalPages, setPage }: any) {
  return (
    <div className="flex items-center justify-between pt-2 px-2">
      <p className="text-xs font-medium text-slate-500">
        Page {page} sur {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPage((p: number) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="p-1 rounded-md border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="p-1 rounded-md border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function CompactDemandeRow({ demande, sectionKey, onOpenDetail, onOpenTimeline, onOpenPassation, onOpenLivraison, action, router }: any) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm hover:border-sky-300 hover:shadow-md transition-all">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-tight">{demande.numero_demande}</span>
          <span className={`px-2 py-0.5 text-[0.65rem] uppercase font-bold rounded-md whitespace-nowrap shadow-sm ${statusClasses[demande.statut] ?? "bg-slate-200 text-slate-700"}`}>
            {statusLabels[demande.statut] ?? demande.statut}
          </span>
        </div>
        
        <p className="text-[0.95rem] font-bold text-slate-800 truncate mb-1.5" title={demande.objet}>
          {demande.objet}
        </p>
        
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
          <span className="truncate max-w-[140px] text-slate-700">{getCompactNeedLabel(demande)}</span>
          <span className="text-slate-900 border-l border-slate-200 pl-3">{formatMoney(demande.montant_commande ?? demande.cout_total_estime)}</span>
          <span className="text-sky-700 border-l border-slate-200 pl-3 hidden sm:block truncate max-w-[220px]">
            {getAgentSectionNote(demande)}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 w-full sm:w-auto grid grid-cols-2 sm:flex sm:flex-row items-center gap-2">
        <button
          onClick={onOpenDetail}
          className="col-span-1 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 shadow-sm hover:bg-slate-100 hover:border-slate-300 transition-colors text-center"
        >
          Détail
        </button>

        {action && (
          <button
            onClick={() => {
              if (action.href.endsWith("/passation")) {
                onOpenPassation();
              } else if (action.href.endsWith("/livraison")) {
                onOpenLivraison();
              } else {
                router.push(action.href);
              }
            }}
            className={`col-span-2 sm:col-span-1 mt-2 sm:mt-0 rounded-lg px-4 py-2 text-xs font-bold text-white shadow-md transition-all text-center ${action.tone === 'emerald' ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800' : 'bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800'}`}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
