"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, ChevronDown, Activity, Clock, Truck, PackageCheck, CheckCircle2, ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react";

import TopHeader from "@/app/components/TopHeader";
import DemandeDetailModal from "@/app/demande-achat/components/DemandeDetailModal";
import ReceptionModal from "@/app/demande-achat/components/ReceptionModal";
import ClotureModal from "@/app/demande-achat/components/ClotureModal";
import {
  formatDate,
  formatMoney,
  getCompactNeedLabel,
  getCurrentValidationLabel,
  getDemandePrimaryAction,
  needsClosureAction,
  needsReceptionAction,
  sortDemandesByRecent,
  statusClasses,
  statusLabels,
  stepLabels,
} from "@/app/demande-achat/components/demandeAchatShared";
import {
  getCurrentUser,
  getLandingRouteForUser,
  getToken,
  isAgentAchatUser,
  isValidatorUser,
} from "@/services/auth";
import { DemandeAchat, listMesDemandesAchat } from "@/services/achats";

type SectionKey = "all" | "pending" | "delivery" | "reception" | "closure";
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

const getElapsedLabel = (value: string | null | undefined) => {
  if (!value) return "";
  const diffMs = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diffMs) || diffMs <= 0) return "";
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) return `depuis ${Math.max(diffHours, 1)}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `depuis ${diffDays}j`;
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

const getSectionContextLine = (demande: DemandeAchat, sectionKey?: SectionKey | null) => {
  if (sectionKey === "pending") {
    if (demande.statut === "A_COMPLETER") {
      return `Retour pour compléments ${getElapsedLabel(demande.updated_at ?? demande.submitted_at)}`;
    }
    return `En attente ${getCurrentValidationLabel(demande)} ${getElapsedLabel(demande.updated_at ?? demande.submitted_at)}`;
  }
  if (sectionKey === "delivery" || ["EN_COMMANDE", "EN_LIVRAISON"].includes(demande.statut)) {
    return `Livraison prévue: ${formatDate(demande.date_arrivee_prevue ?? demande.date_livraison_prevue)}`;
  }
  if (sectionKey === "reception" || needsReceptionAction(demande)) {
    return "Livraison arrivée. Réception provisoire attendue.";
  }
  if (sectionKey === "closure" || needsClosureAction(demande)) {
    return "Réception enregistrée. Validation finale attendue.";
  }
  if (["SOUMISE", "A_COMPLETER"].includes(demande.statut)) {
    return `En attente ${getCurrentValidationLabel(demande)}`;
  }
  return `Créée le ${formatDate(demande.created_at)}`;
};

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filtre");
  const [currentUser] = useState(() => getCurrentUser());
  const [demandes, setDemandes] = useState<DemandeAchat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState<SectionKey | null>("all");
  const [selectedDemandeId, setSelectedDemandeId] = useState<number | null>(null);
  const [detailViewMode, setDetailViewMode] = useState<DetailViewMode>("detail");
  const [receptionModalDemandeId, setReceptionModalDemandeId] = useState<number | null>(null);
  const [clotureModalDemandeId, setClotureModalDemandeId] = useState<number | null>(null);

  const reloadDemandes = async () => {
    try {
      const data = await listMesDemandesAchat();
      setDemandes(data);
    } catch (err) {}
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    if (isValidatorUser(currentUser) || isAgentAchatUser(currentUser)) {
      router.replace(getLandingRouteForUser(currentUser));
      return;
    }

    const load = async () => {
      try {
        const data = await listMesDemandesAchat();
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
    if (filterParam === "attente") setActiveSection("pending");
    else if (filterParam === "encours") setActiveSection("delivery");
    else if (filterParam === "reception") setActiveSection("reception");
    else if (filterParam === "cloture") setActiveSection("closure");
    else if (filterParam === "toutes") setActiveSection("all");
  }, [filterParam]);

  const orderedDemandes = useMemo(() => sortDemandesByRecent(demandes), [demandes]);
  const pendingDemandes = useMemo(() => orderedDemandes.filter((d) => ["SOUMISE", "A_COMPLETER"].includes(d.statut)), [orderedDemandes]);
  const deliveryDemandes = useMemo(() => orderedDemandes.filter((d) => ["EN_COMMANDE", "EN_LIVRAISON"].includes(d.statut)), [orderedDemandes]);
  const receptionDemandes = useMemo(() => orderedDemandes.filter(needsReceptionAction), [orderedDemandes]);
  const closureDemandes = useMemo(() => orderedDemandes.filter(needsClosureAction), [orderedDemandes]);

  const sections = useMemo<Record<SectionKey, SectionData>>(() => ({
    all: {
      key: "all",
      title: "Toutes mes demandes",
      icon: Activity,
      gradientFrom: "from-blue-600",
      gradientTo: "to-blue-700",
      textColor: "text-blue-700",
      bgLight: "bg-blue-50 text-blue-700",
      borderClass: "border-blue-200",
      items: orderedDemandes,
      total: orderedDemandes.length,
      emptyText: "Aucune demande pour l'instant.",
    },
    pending: {
      key: "pending",
      title: "En attente de validation",
      icon: Clock,
      gradientFrom: "from-amber-500",
      gradientTo: "to-orange-500",
      textColor: "text-amber-700",
      bgLight: "bg-amber-50 text-amber-700",
      borderClass: "border-amber-200",
      items: pendingDemandes,
      total: pendingDemandes.length,
      emptyText: "Aucune demande en attente de validation.",
    },
    delivery: {
      key: "delivery",
      title: "En cours de livraison",
      icon: Truck,
      gradientFrom: "from-cyan-500",
      gradientTo: "to-cyan-600",
      textColor: "text-cyan-700",
      bgLight: "bg-cyan-50 text-cyan-700",
      borderClass: "border-cyan-200",
      items: deliveryDemandes,
      total: deliveryDemandes.length,
      emptyText: "Aucune demande en cours de livraison.",
    },
    reception: {
      key: "reception",
      title: "À réceptionner",
      icon: PackageCheck,
      gradientFrom: "from-rose-500",
      gradientTo: "to-rose-600",
      textColor: "text-rose-700",
      bgLight: "bg-rose-50 text-rose-700",
      borderClass: "border-rose-200",
      items: receptionDemandes,
      total: receptionDemandes.length,
      emptyText: "Aucune livraison à réceptionner.",
    },
    closure: {
      key: "closure",
      title: "À valider (Clôture)",
      icon: CheckCircle2,
      gradientFrom: "from-emerald-500",
      gradientTo: "to-emerald-600",
      textColor: "text-emerald-700",
      bgLight: "bg-emerald-50 text-emerald-700",
      borderClass: "border-emerald-200",
      items: closureDemandes,
      total: closureDemandes.length,
      emptyText: "Aucune demande à clôturer.",
    },
  }), [orderedDemandes, pendingDemandes, deliveryDemandes, receptionDemandes, closureDemandes]);

  // Si on est en train de chercher, on filtre tout et on affiche la vue recherche
  const isSearching = query.trim().length > 0;
  const searchResults = useMemo(() => isSearching ? filterDemandesByQuery(orderedDemandes, query) : [], [isSearching, orderedDemandes, query]);

  const selectedDemande = useMemo(() => demandes.find((item) => item.id === selectedDemandeId) ?? null, [demandes, selectedDemandeId]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-12">
      <TopHeader />

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Espace Achats</h1>
            <div className="hidden h-6 w-[1px] bg-slate-300 md:block"></div>
            <p className="text-sm font-medium text-slate-500 hidden sm:block">Tableau de bord de suivi</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher (N°, objet, etc.)..."
                className="w-full bg-white border border-slate-300/80 rounded-xl py-2 pl-9 pr-8 text-sm outline-none shadow-sm transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Link
              href="/demande-achat/new"
              className="shrink-0 flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 active:scale-95"
            >
              + Nouvelle demande
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />
          </div>
        ) : error ? (
          <div className="rounded-xl border-l-4 border-rose-500 bg-white p-5 text-sm font-medium text-rose-800 shadow-sm">
            {error}
          </div>
        ) : orderedDemandes.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <Activity className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h2 className="text-lg font-bold text-slate-900 mb-2">Aucune demande</h2>
            <p className="text-sm text-slate-500 mb-6">Commencez par créer votre première demande d'achat.</p>
            <Link href="/demande-achat/new" className="text-sm font-semibold text-indigo-600 hover:underline">
              Créer une demande &rarr;
            </Link>
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
              onOpenReception={(id: number) => setReceptionModalDemandeId(id)}
              onOpenCloture={(id: number) => setClotureModalDemandeId(id)}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {sections.reception.total > 0 && <AccordionSection section={sections.reception} isActive={activeSection === "reception"} onToggle={() => setActiveSection(activeSection === "reception" ? null : "reception")} currentUser={currentUser} router={router} onOpenDetail={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("detail"); }} onOpenTimeline={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("timeline"); }} onOpenReception={(id: number) => setReceptionModalDemandeId(id)} onOpenCloture={(id: number) => setClotureModalDemandeId(id)} isAlert />}
            {sections.closure.total > 0 && <AccordionSection section={sections.closure} isActive={activeSection === "closure"} onToggle={() => setActiveSection(activeSection === "closure" ? null : "closure")} currentUser={currentUser} router={router} onOpenDetail={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("detail"); }} onOpenTimeline={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("timeline"); }} onOpenReception={(id: number) => setReceptionModalDemandeId(id)} onOpenCloture={(id: number) => setClotureModalDemandeId(id)} isAlert />}
            
            <AccordionSection section={sections.pending} isActive={activeSection === "pending"} onToggle={() => setActiveSection(activeSection === "pending" ? null : "pending")} currentUser={currentUser} router={router} onOpenDetail={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("detail"); }} onOpenTimeline={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("timeline"); }} onOpenReception={(id: number) => setReceptionModalDemandeId(id)} onOpenCloture={(id: number) => setClotureModalDemandeId(id)} />
            <AccordionSection section={sections.delivery} isActive={activeSection === "delivery"} onToggle={() => setActiveSection(activeSection === "delivery" ? null : "delivery")} currentUser={currentUser} router={router} onOpenDetail={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("detail"); }} onOpenTimeline={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("timeline"); }} onOpenReception={(id: number) => setReceptionModalDemandeId(id)} onOpenCloture={(id: number) => setClotureModalDemandeId(id)} />
            <AccordionSection section={sections.all} isActive={activeSection === "all"} onToggle={() => setActiveSection(activeSection === "all" ? null : "all")} currentUser={currentUser} router={router} onOpenDetail={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("detail"); }} onOpenTimeline={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("timeline"); }} onOpenReception={(id: number) => setReceptionModalDemandeId(id)} onOpenCloture={(id: number) => setClotureModalDemandeId(id)} />
          </div>
        )}
      </div>

      <DemandeDetailModal
        demande={selectedDemande}
        open={!!selectedDemande}
        onClose={() => setSelectedDemandeId(null)}
        defaultShowTimeline={detailViewMode === "timeline"}
      />

      <ReceptionModal
        demande={demandes.find((item) => item.id === receptionModalDemandeId) ?? null}
        open={!!receptionModalDemandeId}
        onClose={() => setReceptionModalDemandeId(null)}
        onOpenDetail={() => {
          setSelectedDemandeId(receptionModalDemandeId);
          setDetailViewMode("detail");
        }}
        onSuccess={() => {
          setReceptionModalDemandeId(null);
          reloadDemandes();
        }}
      />

      <ClotureModal
        demande={demandes.find((item) => item.id === clotureModalDemandeId) ?? null}
        open={!!clotureModalDemandeId}
        onClose={() => setClotureModalDemandeId(null)}
        onOpenDetail={() => {
          setSelectedDemandeId(clotureModalDemandeId);
          setDetailViewMode("detail");
        }}
        onSuccess={() => {
          setClotureModalDemandeId(null);
          reloadDemandes();
        }}
      />
    </main>
  );
}

function SearchResultsList({ items, query, currentUser, router, onOpenDetail, onOpenTimeline, onOpenReception, onOpenCloture }: any) {
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
              onOpenReception={() => onOpenReception(demande.id)}
              onOpenCloture={() => onOpenCloture(demande.id)}
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

function AccordionSection({ section, isActive, onToggle, currentUser, router, onOpenDetail, onOpenTimeline, onOpenReception, onOpenCloture, isAlert = false }: any) {
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
    <div ref={sectionRef} className={`overflow-hidden rounded-2xl border transition-all ${isActive ? 'border-slate-300 shadow-md ring-4 ring-slate-100' : 'border-slate-200 bg-white shadow-sm hover:border-slate-300'}`}>
      <button
        onClick={onToggle}
        disabled={!hasItems}
        className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${!hasItems ? 'bg-slate-50/50 cursor-not-allowed opacity-60' : isActive ? 'bg-slate-50 border-b border-slate-200' : 'bg-white hover:bg-slate-50'}`}
      >
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-xl shadow-inner ${isAlert ? `bg-gradient-to-br ${section.gradientFrom} ${section.gradientTo} text-white` : section.bgLight}`}>
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
          <span className="text-[1.05rem] font-bold text-slate-900">{section.title}</span>
          
          <span className={`ml-2 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${hasItems ? (isAlert ? `bg-gradient-to-r ${section.gradientFrom} ${section.gradientTo} text-white` : 'bg-white border border-slate-200 text-slate-800') : 'bg-slate-100 text-slate-400'}`}>
            {section.total}
          </span>
        </div>
        
        {hasItems && (
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>
              {isActive ? 'Fermer' : 'Voir'}
            </span>
            <div className={`p-1 rounded-full transition-colors ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
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
              onOpenReception={() => onOpenReception(demande.id)}
              onOpenCloture={() => onOpenCloture(demande.id)}
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

function CompactDemandeRow({ demande, sectionKey, onOpenDetail, onOpenTimeline, onOpenReception, onOpenCloture, action, router }: any) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all">
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
          <span className="text-indigo-600 border-l border-slate-200 pl-3 hidden sm:block truncate max-w-[220px]">
            {getSectionContextLine(demande, sectionKey)}
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
              if (action.href.endsWith("/reception")) {
                onOpenReception();
              } else if (action.href.endsWith("/cloture")) {
                onOpenCloture();
              } else {
                router.push(action.href);
              }
            }}
            className="col-span-2 sm:col-span-1 mt-2 sm:mt-0 rounded-lg px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black shadow-md transition-all text-center"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
