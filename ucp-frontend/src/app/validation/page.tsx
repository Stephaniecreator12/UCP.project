"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, ChevronDown, Activity, Clock, FileCheck, ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react";

import TopHeader from "@/app/components/TopHeader";
import DemandeDetailModal from "@/app/demande-achat/components/DemandeDetailModal";
import ValidationModal from "@/app/demande-achat/components/ValidationModal";
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
  getValidatorRoleLabel,
  isValidatorUser,
  isAgentAchatUser,
} from "@/services/auth";
import { DemandeAchat, listDemandesEnAttenteValidation } from "@/services/achats";

type SectionKey = "pending";
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

export default function ValidationDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser] = useState(() => getCurrentUser());
  const validatorRoleLabel = getValidatorRoleLabel(currentUser);
  const [demandes, setDemandes] = useState<DemandeAchat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState<SectionKey | null>("pending");
  const [selectedDemandeId, setSelectedDemandeId] = useState<number | null>(null);
  const [detailViewMode, setDetailViewMode] = useState<DetailViewMode>("detail");
  const [selectedValidationId, setSelectedValidationId] = useState<number | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    if (!isValidatorUser(currentUser)) {
      router.replace(
        isAgentAchatUser(currentUser)
          ? getLandingRouteForUser(currentUser)
          : "/dashboard",
      );
      return;
    }

    const load = async () => {
      try {
        const data = await listDemandesEnAttenteValidation();
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

  const sections = useMemo<Record<SectionKey, SectionData>>(() => ({
    pending: {
      key: "pending",
      title: "Dossiers à valider",
      icon: FileCheck,
      gradientFrom: "from-emerald-500",
      gradientTo: "to-teal-500",
      textColor: "text-emerald-700",
      bgLight: "bg-emerald-50 text-emerald-700",
      borderClass: "border-emerald-200",
      items: orderedDemandes,
      total: orderedDemandes.length,
      emptyText: "Aucune demande en attente de validation. Belle journée !",
    },
  }), [orderedDemandes]);

  const isSearching = query.trim().length > 0;
  const searchResults = useMemo(() => isSearching ? filterDemandesByQuery(orderedDemandes, query) : [], [isSearching, orderedDemandes, query]);

  const selectedDemande = useMemo(() => demandes.find((item) => item.id === selectedDemandeId) ?? null, [demandes, selectedDemandeId]);
  const validationDemande = useMemo(() => demandes.find((item) => item.id === selectedValidationId) ?? null, [demandes, selectedValidationId]);

  const handleValidationSuccess = async () => {
    setSelectedValidationId(null);
    try {
      const data = await listDemandesEnAttenteValidation();
      setDemandes(data);
    } catch (err) {
      // Ignored
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900 pb-12">
      <TopHeader />

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Espace Validateur</h1>
            <div className="hidden h-6 w-[1px] bg-slate-300 md:block"></div>
            <p className="text-sm font-medium text-slate-500 hidden sm:block">{validatorRoleLabel || "Comité d'approbation"}</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un dossier..."
                className="w-full bg-white border border-slate-300/80 rounded-xl py-2 pl-9 pr-8 text-sm outline-none shadow-sm transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
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
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
          </div>
        ) : error ? (
          <div className="rounded-xl border-l-4 border-rose-500 bg-white p-5 text-sm font-medium text-rose-800 shadow-sm">
            {error}
          </div>
        ) : orderedDemandes.length === 0 && !isSearching ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 mb-4">
              <FileCheck className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Aucun dossier en attente</h2>
            <p className="text-sm text-slate-500">
              Votre file de traitement est vide. Vous recevrez une notification lorsqu'une nouvelle demande nécessitera votre attention.
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
              onActionClick={(demande: DemandeAchat) => setSelectedValidationId(demande.id)}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <AccordionSection 
              section={sections.pending} 
              isActive={activeSection === "pending"} 
              onToggle={() => setActiveSection(activeSection === "pending" ? null : "pending")} 
              currentUser={currentUser} 
              router={router} 
              onOpenDetail={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("detail"); }} 
              onOpenTimeline={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("timeline"); }} 
              onActionClick={(demande: DemandeAchat) => setSelectedValidationId(demande.id)}
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

      <ValidationModal
        demande={validationDemande}
        open={!!validationDemande}
        onClose={() => setSelectedValidationId(null)}
        onOpenDetail={() => {
          setSelectedDemandeId(validationDemande?.id ?? null);
        }}
        onValidationSuccess={handleValidationSuccess}
      />
    </main>
  );
}

function SearchResultsList({ items, query, currentUser, router, onOpenDetail, onOpenTimeline, onActionClick }: any) {
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
              action={getDemandePrimaryAction(demande, currentUser)}
              onActionClick={onActionClick}
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

function AccordionSection({ section, isActive, onToggle, currentUser, router, onOpenDetail, onOpenTimeline, onActionClick }: any) {
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
    <div ref={sectionRef} className={`overflow-hidden rounded-2xl border transition-all ${isActive ? 'border-emerald-300 shadow-md ring-4 ring-emerald-50' : 'border-slate-200 bg-white shadow-sm hover:border-emerald-200'}`}>
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
          
          <span className={`ml-2 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${hasItems ? `bg-emerald-100 text-emerald-800 border border-emerald-200` : 'bg-slate-100 text-slate-400'}`}>
            {section.total}
          </span>
        </div>
        
        {hasItems && (
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <span className={isActive ? 'text-emerald-600' : 'text-slate-400'}>
              {isActive ? 'Fermer' : 'Traiter'}
            </span>
            <div className={`p-1 rounded-full transition-colors ${isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
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
              action={getDemandePrimaryAction(demande, currentUser)}
              onActionClick={onActionClick}
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

function CompactDemandeRow({ demande, sectionKey, onOpenDetail, onOpenTimeline, action, onActionClick }: any) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all">
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
          <span className="text-emerald-700 border-l border-slate-200 pl-3 hidden sm:block truncate max-w-[220px]">
            Traitement attendu {getElapsedLabel(demande.updated_at ?? demande.submitted_at)}
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
            onClick={() => onActionClick ? onActionClick(demande) : {}} 
            className="col-span-2 sm:col-span-1 mt-2 sm:mt-0 rounded-lg px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-md transition-all text-center"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
