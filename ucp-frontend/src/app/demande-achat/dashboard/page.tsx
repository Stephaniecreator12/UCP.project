"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, ChevronDown, Activity, Clock, Truck, PackageCheck, CheckCircle2, ChevronLeft, ChevronRight as ChevronRightIcon, Filter, Plus } from "lucide-react";

import TopHeader from "@/app/components/TopHeader";
import DemandeDetailModal from "@/app/demande-achat/components/DemandeDetailModal";
import ResolveIssueModal from "@/app/demande-achat/components/ResolveIssueModal";
import ClotureModal from "@/app/demande-achat/components/ClotureModal";
import ReceptionModal from "@/app/demande-achat/components/ReceptionModal";
import { DashboardFilterBar, useDashboardFilters } from "@/app/demande-achat/components/DashboardFilterBar";
import {
  type DemandePrimaryAction,
  formatDate,
  formatMoney,
  getCompactNeedLabel,
  getCurrentValidationLabel,
  getDemandePrimaryAction,
  needsClosureAction,
  needsReceptionAction,
  sortDemandesByRecent,
  getValidationDeadlineState,
  statusClasses,
  statusLabels,
  stepLabels,
  toDisplayLabel,
  typeLabels,
  financementLabels,
} from "@/app/demande-achat/components/demandeAchatShared";
import {
  getCurrentUser,
  getLandingRouteForUser,
  getToken,
  isAgentAchatUser,
  isValidatorUser,
  type UserProfile,
} from "@/services/auth";
import { DemandeAchat, listMesDemandesAchat } from "@/services/achats";

type SectionKey = "all" | "pending" | "correction" | "delivery" | "reception" | "closure" | "archive";

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
  onOpenReception: (id: number) => void;
  onOpenResolveIssue: (id: number) => void;
  onOpenCloture: (id: number) => void;
};

type AccordionSectionProps = {
  section: SectionData;
  isActive: boolean;
  onToggle: () => void;
  currentUser: UserProfile | null;
  router: RouterLike;
  onOpenDetail: (id: number) => void;
  onOpenReception: (id: number) => void;
  onOpenResolveIssue: (id: number) => void;
  onOpenCloture: (id: number) => void;
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
  onOpenReception: () => void;
  onOpenResolveIssue: () => void;
  onOpenCloture: () => void;
  action: DemandePrimaryAction | null;
  router: RouterLike;
};

type DetailViewMode = "detail" | "timeline";

const PAGE_SIZE = 5;


const sectionShortcutLabels: Record<SectionKey, string> = {
  all: "Tous",
  pending: "Validation",
  correction: "À corriger",
  delivery: "Livraison",
  reception: "Réception",
  closure: "Clôture",
  archive: "Archives",
};

const actionToneClasses: Record<DemandePrimaryAction["tone"], string> = {
  emerald: "from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600",
  sky: "from-sky-600 to-cyan-500 hover:from-sky-700 hover:to-cyan-600",
  slate: "from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black",
  amber: "from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
};

const getElapsedLabel = (value: string | null | undefined) => {
  if (!value) return "";
  const diffMs = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diffMs) || diffMs <= 0) return "";
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) return `depuis ${Math.max(diffHours, 1)}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `depuis ${diffDays}j`;
};

const toSentenceCaseLabel = (value: string) => {
  const label = toDisplayLabel(value).toLowerCase();
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const getFinancementLabel = (value: string | null | undefined) =>
  financementLabels[value || "NON_DEFINI"] ?? toSentenceCaseLabel(value || "NON_DEFINI");

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
  if (demande.statut === "CLOTUREE") {
    return `Clôturée le ${formatDate(demande.date_cloture || demande.updated_at)}`;
  }
  if (demande.statut === "REJETEE") {
    return "État rejeté";
  }
  if (sectionKey === "correction" || demande.statut === "A_COMPLETER") {
    return `Retour pour corrections ${getElapsedLabel(demande.updated_at ?? demande.submitted_at)}`;
  }
  if (sectionKey === "pending") {
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
  const filterParam = searchParams.get("filter") ?? searchParams.get("filtre");
  const [currentUser] = useState(() => getCurrentUser());
  const [demandes, setDemandes] = useState<DemandeAchat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null);
  const [selectedDemandeId, setSelectedDemandeId] = useState<number | null>(null);
  const [detailViewMode, setDetailViewMode] = useState<DetailViewMode>("detail");
  const [receptionModalDemandeId, setReceptionModalDemandeId] = useState<number | null>(null);
  const [resolveIssueModalDemandeId, setResolveIssueModalDemandeId] = useState<number | null>(null);
  const [clotureModalDemandeId, setClotureModalDemandeId] = useState<number | null>(null);
  const [corrigerModalDemandeId, setCorrigerModalDemandeId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const { filteredDemandes, filterProps } = useDashboardFilters(demandes);
  const { selectedFinancements, setSelectedFinancements, selectedTypes, setSelectedTypes } = filterProps;

  const reloadDemandes = async () => {
    try {
      const data = await listMesDemandesAchat();
      setDemandes(data);
    } catch {}
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
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

  const archiveDemandes = useMemo(() => filteredDemandes.filter((d) => ["CLOTUREE", "REJETEE"].includes(d.statut)), [filteredDemandes]);
  const activeDemandes = useMemo(() => filteredDemandes.filter((d) => !["CLOTUREE", "REJETEE"].includes(d.statut)), [filteredDemandes]);
  
  const correctionDemandes = useMemo(() => filteredDemandes.filter((d) => d.statut === "A_COMPLETER"), [filteredDemandes]);
  const pendingDemandes = useMemo(() => filteredDemandes.filter((d) => d.statut === "SOUMISE"), [filteredDemandes]);
  const deliveryDemandes = useMemo(() => filteredDemandes.filter((d) => ["EN_COMMANDE", "EN_LIVRAISON"].includes(d.statut)), [filteredDemandes]);
  const receptionDemandes = useMemo(() => filteredDemandes.filter(needsReceptionAction), [filteredDemandes]);
  const closureDemandes = useMemo(() => filteredDemandes.filter(needsClosureAction), [filteredDemandes]);

  const sections = useMemo<Record<SectionKey, SectionData>>(() => ({
    all: {
      key: "all",
      title: "Tous les états actifs",
      icon: Activity,
      gradientFrom: "from-teal-600",
      gradientTo: "to-emerald-600",
      textColor: "text-teal-700",
      bgLight: "bg-teal-50 text-teal-700",
      borderClass: "border-teal-200",
      items: activeDemandes,
      total: activeDemandes.length,
      emptyText: "Aucun état de besoins actif.",
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
      emptyText: "Aucun état de besoins en attente de validation.",
    },
    correction: {
      key: "correction",
      title: "À corriger",
      icon: Activity,
      gradientFrom: "from-orange-500",
      gradientTo: "to-red-500",
      textColor: "text-orange-700",
      bgLight: "bg-orange-50 text-orange-700",
      borderClass: "border-orange-200",
      items: correctionDemandes,
      total: correctionDemandes.length,
      emptyText: "Aucun état de besoins à corriger.",
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
      emptyText: "Aucun état de besoins en cours de livraison.",
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
      emptyText: "Aucun dossier à réceptionner.",
    },
    closure: {
      key: "closure",
      title: "À clôturer",
      icon: CheckCircle2,
      gradientFrom: "from-emerald-500",
      gradientTo: "to-emerald-600",
      textColor: "text-emerald-700",
      bgLight: "bg-emerald-50 text-emerald-700",
      borderClass: "border-emerald-200",
      items: closureDemandes,
      total: closureDemandes.length,
      emptyText: "Aucun état de besoins à clôturer.",
    },
    archive: {
      key: "archive",
      title: "Archives",
      icon: CheckCircle2,
      gradientFrom: "from-slate-500",
      gradientTo: "to-slate-600",
      textColor: "text-slate-700",
      bgLight: "bg-slate-100 text-slate-700",
      borderClass: "border-slate-300",
      items: archiveDemandes,
      total: archiveDemandes.length,
      emptyText: "Aucun état de besoins archivé.",
    },
  }), [activeDemandes, pendingDemandes, correctionDemandes, deliveryDemandes, receptionDemandes, closureDemandes, archiveDemandes]);

  // Si on est en train de chercher, on filtre tout et on affiche la vue recherche
  const isSearching = query.trim().length > 0;
  const searchResults = useMemo(() => isSearching ? filterDemandesByQuery(filteredDemandes, query) : [], [isSearching, filteredDemandes, query]);

  const selectedDemande = useMemo(() => demandes.find((item) => item.id === selectedDemandeId) ?? null, [demandes, selectedDemandeId]);
  const hasActiveFilters = selectedFinancements.length > 0 || selectedTypes.length > 0;
  const executionCount = deliveryDemandes.length + receptionDemandes.length + closureDemandes.length;
  const attentionCount = correctionDemandes.length + receptionDemandes.length + closureDemandes.length;
  const statusShortcutOrder: SectionKey[] = ["pending", "delivery", "correction", "reception", "closure", "all", "archive"];
  const resetFilters = () => {
    setSelectedFinancements([]);
    setSelectedTypes([]);
  };
  const openDetail = (id: number) => {
    setSelectedDemandeId(id);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-12">
      <TopHeader />

      <div className="zoom-content">
        <div className="max-w-[1400px] mx-auto px-4 py-6">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200">
                  <Activity className="h-5 w-5" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">Tableau de bord</h1>
              </div>
              <p className="text-[13px] font-semibold text-slate-500">Gérez et suivez vos demandes d'achat en temps réel</p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un numéro, un objet..."
                  className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 pl-10 pr-10 text-[13px] font-medium outline-none shadow-sm transition-all focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
                {query && (
                  <button onClick={() => setQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Link
                href="/demande-achat/new"
                className="shrink-0 flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-2.5 text-[13px] font-bold text-white shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 whitespace-nowrap"
              >
                <Plus className="h-4 w-4" /> Nouvel état
              </Link>
            </div>
          </div>

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
        ) : (
          <>
            <div className="mb-8 space-y-6">
              <DashboardFilterBar filterProps={filterProps} />

              {demandes.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                  <Activity className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                  <h2 className="text-lg font-bold text-slate-900 mb-2">Aucun état de besoins</h2>
                  <p className="text-sm text-slate-500 mb-6">Commencez par créer votre premier état de besoins.</p>
                  <Link href="/demande-achat/new" className="text-sm font-semibold text-indigo-600 hover:underline">
                    Créer un état de besoins &rarr;
                  </Link>
                </div>
              ) : filteredDemandes.length === 0 && !isSearching ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                  <Activity className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                  <h2 className="text-lg font-bold text-slate-900 mb-2">Aucun état trouvé</h2>
                  <p className="text-sm text-slate-500 mb-6">Aucun état de besoins ne correspond à vos filtres actuels.</p>
                  <button 
                    onClick={() => { setSelectedFinancements([]); setSelectedTypes([]); }}
                    className="text-sm font-bold text-indigo-600 hover:underline"
                  >
                    Effacer les filtres
                  </button>
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
                    onOpenResolveIssue={(id: number) => setResolveIssueModalDemandeId(id)}
                    onOpenCloture={(id: number) => setClotureModalDemandeId(id)}
                    onOpenCorriger={(id: number) => setCorrigerModalDemandeId(id)}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <AccordionSection section={sections.pending} isActive={activeSection === "pending"} onToggle={() => setActiveSection(activeSection === "pending" ? null : "pending")} currentUser={currentUser} router={router} onOpenDetail={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("detail"); }} onOpenTimeline={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("timeline"); }} onOpenReception={(id: number) => setReceptionModalDemandeId(id)} onOpenResolveIssue={(id: number) => setResolveIssueModalDemandeId(id)} onOpenCloture={(id: number) => setClotureModalDemandeId(id)} onOpenCorriger={(id: number) => setCorrigerModalDemandeId(id)} />
                  <AccordionSection section={sections.delivery} isActive={activeSection === "delivery"} onToggle={() => setActiveSection(activeSection === "delivery" ? null : "delivery")} currentUser={currentUser} router={router} onOpenDetail={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("detail"); }} onOpenTimeline={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("timeline"); }} onOpenReception={(id: number) => setReceptionModalDemandeId(id)} onOpenResolveIssue={(id: number) => setResolveIssueModalDemandeId(id)} onOpenCloture={(id: number) => setClotureModalDemandeId(id)} onOpenCorriger={(id: number) => setCorrigerModalDemandeId(id)} />
                  {sections.correction.total > 0 && <AccordionSection section={sections.correction} isActive={activeSection === "correction"} onToggle={() => setActiveSection(activeSection === "correction" ? null : "correction")} currentUser={currentUser} router={router} onOpenDetail={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("detail"); }} onOpenTimeline={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("timeline"); }} onOpenReception={(id: number) => setReceptionModalDemandeId(id)} onOpenResolveIssue={(id: number) => setResolveIssueModalDemandeId(id)} onOpenCloture={(id: number) => setClotureModalDemandeId(id)} onOpenCorriger={(id: number) => setCorrigerModalDemandeId(id)} /> }
                  {sections.reception.total > 0 && <AccordionSection section={sections.reception} isActive={activeSection === "reception"} onToggle={() => setActiveSection(activeSection === "reception" ? null : "reception")} currentUser={currentUser} router={router} onOpenDetail={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("detail"); }} onOpenTimeline={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("timeline"); }} onOpenReception={(id: number) => setReceptionModalDemandeId(id)} onOpenResolveIssue={(id: number) => setResolveIssueModalDemandeId(id)} onOpenCloture={(id: number) => setClotureModalDemandeId(id)} onOpenCorriger={(id: number) => setCorrigerModalDemandeId(id)} isAlert />}
                  {sections.closure.total > 0 && <AccordionSection section={sections.closure} isActive={activeSection === "closure"} onToggle={() => setActiveSection(activeSection === "closure" ? null : "closure")} currentUser={currentUser} router={router} onOpenDetail={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("detail"); }} onOpenTimeline={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("timeline"); }} onOpenReception={(id: number) => setReceptionModalDemandeId(id)} onOpenResolveIssue={(id: number) => setResolveIssueModalDemandeId(id)} onOpenCloture={(id: number) => setClotureModalDemandeId(id)} onOpenCorriger={(id: number) => setCorrigerModalDemandeId(id)} isAlert />}
                  <AccordionSection section={sections.all} isActive={activeSection === "all"} onToggle={() => setActiveSection(activeSection === "all" ? null : "all")} currentUser={currentUser} router={router} onOpenDetail={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("detail"); }} onOpenTimeline={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("timeline"); }} onOpenReception={(id: number) => setReceptionModalDemandeId(id)} onOpenResolveIssue={(id: number) => setResolveIssueModalDemandeId(id)} onOpenCloture={(id: number) => setClotureModalDemandeId(id)} onOpenCorriger={(id: number) => setCorrigerModalDemandeId(id)} />
                  <AccordionSection section={sections.archive} isActive={activeSection === "archive"} onToggle={() => setActiveSection(activeSection === "archive" ? null : "archive")} currentUser={currentUser} router={router} onOpenDetail={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("detail"); }} onOpenTimeline={(id: number) => { setSelectedDemandeId(id); setDetailViewMode("timeline"); }} onOpenReception={(id: number) => setReceptionModalDemandeId(id)} onOpenResolveIssue={(id: number) => setResolveIssueModalDemandeId(id)} onOpenCloture={(id: number) => setClotureModalDemandeId(id)} onOpenCorriger={(id: number) => setCorrigerModalDemandeId(id)} />
                </div>
              )}
            </div>
          </>
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
          showToast("Dossier clôturé avec succès !");
        }}
      />

      {toastMessage && (
        <div className="ucp-toast ucp-toast--success animate-in slide-in-from-bottom-8 fade-in duration-300">
          <CheckCircle2 className="h-6 w-6 shrink-0" />
          <span className="ucp-toast__message">{toastMessage}</span>
        </div>
      )}
    </main>
  );
}


function SearchResultsList({ items, query, currentUser, router, onOpenDetail, onOpenTimeline, onOpenReception, onOpenResolveIssue, onOpenCloture, onOpenCorriger }: any) {
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
              onOpenResolveIssue={() => onOpenResolveIssue(demande.id)}
              onOpenCloture={() => onOpenCloture(demande.id)}
              onOpenCorriger={() => onOpenCorriger(demande.id)}
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

function AccordionSection({ section, isActive, onToggle, currentUser, router, onOpenDetail, onOpenTimeline, onOpenReception, onOpenResolveIssue, onOpenCloture, onOpenCorriger, isAlert = false }: any) {
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
          <span className="text-base font-bold text-slate-900">{section.title}</span>
          
          <span className={`ml-2 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${hasItems ? (isAlert ? `bg-gradient-to-r ${section.gradientFrom} ${section.gradientTo} text-white` : 'bg-white border border-slate-200 text-slate-800') : 'bg-slate-100 text-slate-400'}`}>
            {section.total}
          </span>
        </div>
        
        {hasItems && (
          <div className="flex items-center gap-2.5 text-[11px] font-black uppercase tracking-widest text-slate-400">
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
          {paginatedItems.map((demande: any) => (
            <CompactDemandeRow
              key={demande.id}
              demande={demande}
              sectionKey={section.key}
              onOpenDetail={() => onOpenDetail(demande.id)}
              onOpenTimeline={() => onOpenTimeline(demande.id)}
              onOpenReception={() => onOpenReception(demande.id)}
              onOpenResolveIssue={() => onOpenResolveIssue(demande.id)}
              onOpenCloture={() => onOpenCloture(demande.id)}
              onOpenCorriger={() => onOpenCorriger(demande.id)}
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

function CompactDemandeRow({ demande, sectionKey, onOpenDetail, onOpenTimeline, onOpenReception, onOpenResolveIssue, onOpenCloture, onOpenCorriger, action, router }: any) {
  const deadlineState = getValidationDeadlineState(demande);
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm hover:border-slate-400 hover:shadow-md transition-all duration-300 group/row">
      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-2 mb-2">
          <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded tracking-widest uppercase">{demande.numero_demande}</span>
          <span className={`px-2 py-0.5 text-[9px] uppercase font-black rounded tracking-widest shadow-sm ${statusClasses[demande.statut] ?? "bg-slate-200 text-slate-700"}`}>
            {statusLabels[demande.statut] ?? demande.statut}
          </span>
          {deadlineState && deadlineState.status === "RETARD" && (
            <span className="flex items-center gap-1 bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest animate-pulse">
               <div className="w-1 h-1 bg-red-600 rounded-full"></div>
               Retard {deadlineState.hours ? `${deadlineState.hours}h` : ''}
            </span>
          )}
          {deadlineState && (deadlineState.status === "ATTENTE_CRITIQUE" || deadlineState.status === "ATTENTE") && (
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${deadlineState.status === "ATTENTE_CRITIQUE" ? 'bg-orange-50 text-orange-600 border-orange-100 animate-pulse' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
               <Clock className="w-3 h-3" />
               {deadlineState.status === "ATTENTE_CRITIQUE" ? 'Critique' : 'Délai'}: {deadlineState.hours}h
            </span>
          )}
        </div>
        
        <p className="text-[14px] font-bold text-slate-900 truncate mb-1.5 leading-tight group-hover/row:text-slate-700 transition-colors" title={demande.objet}>
          {demande.objet}
        </p>
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-bold text-slate-400">
          <span className="text-slate-600 flex items-center gap-1.5">
            <PackageCheck className="w-3.5 h-3.5 text-slate-400" />
            {getCompactNeedLabel(demande)}
          </span>
          <span className="text-slate-900 bg-slate-50 px-1.5 py-0.5 rounded">{formatMoney(demande.montant_commande ?? demande.cout_total_estime)}</span>
          <span className="text-slate-400 font-medium italic hidden sm:block truncate max-w-[300px]">
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
              if (action.label.toLowerCase().includes("réception")) {
                onOpenReception();
              } else if (action.label.toLowerCase().includes("clôture")) {
                onOpenCloture();
              } else if (action.label.toLowerCase().includes("corriger")) {
                router.push(action.href);
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
