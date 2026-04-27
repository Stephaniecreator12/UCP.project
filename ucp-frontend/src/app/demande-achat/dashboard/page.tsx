"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, ChevronDown, Activity, Clock, Truck, PackageCheck, CheckCircle2, ChevronLeft, ChevronRight as ChevronRightIcon, Plus } from "lucide-react";

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
  getDemandeCurrentOwnerLabel,
  getDemandeTrackingStageLabel,
  getCurrentValidationLabel,
  getDemandePrimaryAction,
  needsClosureAction,
  needsIssueResolutionAction,
  needsReceptionAction,
  getValidationDeadlineState,
  statusClasses,
  statusLabels,
  stepLabels,
} from "@/app/demande-achat/components/demandeAchatShared";
import {
  canUseGlobalDashboard,
  getCurrentUser,
  getToken,
  type UserProfile,
} from "@/services/auth";
import {
  type DashboardScope,
  DemandeAchat,
  listDemandesAchat,
} from "@/services/achats";

type SectionKey =
  | "draft"
  | "all"
  | "pending"
  | "correction"
  | "procurement"
  | "delivery"
  | "reception"
  | "closure"
  | "archive";

type ArchiveGroupKey = "closed" | "rejected";

type ArchiveGroupData = {
  key: ArchiveGroupKey;
  title: string;
  items: DemandeAchat[];
  total: number;
  emptyText: string;
};

type SectionData = {
  key: SectionKey;
  title: string;
  icon: React.ElementType;
  iconClass: string;
  badgeClass: string;
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
  onOpenCloture: (id: number) => void;
  archiveGroups?: ArchiveGroupData[];
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
  onOpenCloture: () => void;
  action: DemandePrimaryAction | null;
  router: RouterLike;
};

type SectionDemandesListProps = {
  items: DemandeAchat[];
  sectionKey?: SectionKey;
  currentUser: UserProfile | null;
  router: RouterLike;
  onOpenDetail: (id: number) => void;
  onOpenReception: (id: number) => void;
  onOpenCloture: (id: number) => void;
};

type ArchiveGroupBlockProps = SectionDemandesListProps & {
  group: ArchiveGroupData;
};

type DetailViewMode = "detail" | "timeline";

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
      demande.demandeur_nom,
      demande.demandeur_group,
      demande.unite_technique,
      demande.service_beneficiaire,
      getDemandeTrackingStageLabel(demande),
      getDemandeCurrentOwnerLabel(demande),
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
    return `Retour pour révision ${getElapsedLabel(demande.updated_at ?? demande.submitted_at)}`;
  }
  if (sectionKey === "pending") {
    return `En attente ${getCurrentValidationLabel(demande)} ${getElapsedLabel(demande.updated_at ?? demande.submitted_at)}`;
  }
  if (sectionKey === "procurement" || demande.statut === "VALIDEE_BUDGETAIRE") {
    return "Dossier validé. Passation attendue.";
  }
  if (sectionKey === "delivery" || ["EN_COMMANDE", "EN_LIVRAISON"].includes(demande.statut)) {
    return `Livraison prévue: ${formatDate(demande.date_arrivee_prevue ?? demande.date_livraison_prevue)}`;
  }
  if (sectionKey === "reception" && needsIssueResolutionAction(demande)) {
    return "Écart détecté. Résolution attendue.";
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const canAccessGlobalDashboard = canUseGlobalDashboard(currentUser);
  const rawScope = (searchParams.get("scope") ?? "").trim().toLowerCase();
  const dashboardScope: DashboardScope =
    rawScope === "all" && canAccessGlobalDashboard ? "all" : "mine";
  const searchParamsString = searchParams.toString();
  const mineScopeHref = useMemo(() => {
    const params = new URLSearchParams(searchParamsString);
    params.delete("scope");
    const queryString = params.toString();
    return queryString
      ? `/demande-achat/dashboard?${queryString}`
      : "/demande-achat/dashboard";
  }, [searchParamsString]);
  const allScopeHref = useMemo(() => {
    const params = new URLSearchParams(searchParamsString);
    params.set("scope", "all");
    const queryString = params.toString();
    return `/demande-achat/dashboard?${queryString}`;
  }, [searchParamsString]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const { filteredDemandes, filterProps } = useDashboardFilters(demandes);
  const { setSelectedFinancements, setSelectedTypes } = filterProps;

  const reloadDemandes = async () => {
    try {
      const data = await listDemandesAchat(dashboardScope);
      setDemandes(data);
    } catch {}
  };

  useEffect(() => {
    if (rawScope === "all" && !canAccessGlobalDashboard) {
      router.replace(mineScopeHref);
    }
  }, [rawScope, canAccessGlobalDashboard, mineScopeHref, router]);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    let isCancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const data = await listDemandesAchat(dashboardScope);
        if (!isCancelled) {
          setDemandes(data);
          setError(null);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : "Erreur de chargement");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      isCancelled = true;
    };
  }, [dashboardScope, router]);

  const archiveDemandes = useMemo(
    () => filteredDemandes.filter((d) => ["CLOTUREE", "REJETEE"].includes(d.statut)),
    [filteredDemandes],
  );
  const activeDemandes = useMemo(
    () => filteredDemandes.filter((d) => !["CLOTUREE", "REJETEE"].includes(d.statut)),
    [filteredDemandes],
  );
  const draftDemandes = useMemo(
    () => filteredDemandes.filter((d) => d.statut === "BROUILLON"),
    [filteredDemandes],
  );
  const correctionDemandes = useMemo(
    () => filteredDemandes.filter((d) => d.statut === "A_COMPLETER"),
    [filteredDemandes],
  );
  const pendingDemandes = useMemo(
    () => filteredDemandes.filter((d) => ["SOUMISE", "VALIDEE"].includes(d.statut)),
    [filteredDemandes],
  );
  const procurementDemandes = useMemo(
    () => filteredDemandes.filter((d) => d.statut === "VALIDEE_BUDGETAIRE"),
    [filteredDemandes],
  );
  const deliveryDemandes = useMemo(
    () => filteredDemandes.filter((d) => ["EN_COMMANDE", "EN_LIVRAISON"].includes(d.statut)),
    [filteredDemandes],
  );
  const receptionDemandes = useMemo(
    () =>
      filteredDemandes.filter(
        (d) =>
          (d.statut === "LIVREE" ||
            needsReceptionAction(d) ||
            needsIssueResolutionAction(d)) &&
          !needsClosureAction(d),
      ),
    [filteredDemandes],
  );
  const closureDemandes = useMemo(
    () => filteredDemandes.filter(needsClosureAction),
    [filteredDemandes],
  );
  const closedArchiveDemandes = useMemo(
    () => archiveDemandes.filter((d) => d.statut === "CLOTUREE"),
    [archiveDemandes],
  );
  const rejectedArchiveDemandes = useMemo(
    () => archiveDemandes.filter((d) => d.statut === "REJETEE"),
    [archiveDemandes],
  );

  const sections = useMemo<Record<SectionKey, SectionData>>(
    () => ({
      draft: {
        key: "draft",
        title: "Brouillons",
        icon: Activity,
        iconClass: "border-slate-200 bg-slate-50 text-slate-600",
        badgeClass: "border-slate-200 bg-white text-slate-700",
        items: draftDemandes,
        total: draftDemandes.length,
        emptyText: "Aucun brouillon.",
      },
      all: {
        key: "all",
        title: "Tous les états actifs",
        icon: Activity,
        iconClass: "border-teal-200 bg-teal-50 text-teal-700",
        badgeClass: "border-slate-200 bg-white text-slate-700",
        items: activeDemandes,
        total: activeDemandes.length,
        emptyText: "Aucun état de besoins actif.",
      },
      pending: {
        key: "pending",
        title: "En attente de validation",
        icon: Clock,
        iconClass: "border-amber-200 bg-amber-50 text-amber-700",
        badgeClass: "border-slate-200 bg-white text-slate-700",
        items: pendingDemandes,
        total: pendingDemandes.length,
        emptyText: "Aucun état de besoins en attente de validation.",
      },
      correction: {
        key: "correction",
        title: "À revoir",
        icon: Activity,
        iconClass: "border-orange-200 bg-orange-50 text-orange-700",
        badgeClass: "border-slate-200 bg-white text-slate-700",
        items: correctionDemandes,
        total: correctionDemandes.length,
        emptyText: "Aucun état de besoins à revoir.",
      },
      procurement: {
        key: "procurement",
        title: "En passation",
        icon: Activity,
        iconClass: "border-violet-200 bg-violet-50 text-violet-700",
        badgeClass: "border-slate-200 bg-white text-slate-700",
        items: procurementDemandes,
        total: procurementDemandes.length,
        emptyText: "Aucun dossier en passation.",
      },
      delivery: {
        key: "delivery",
        title: "En cours de livraison",
        icon: Truck,
        iconClass: "border-cyan-200 bg-cyan-50 text-cyan-700",
        badgeClass: "border-slate-200 bg-white text-slate-700",
        items: deliveryDemandes,
        total: deliveryDemandes.length,
        emptyText: "Aucun état de besoins en cours de livraison.",
      },
      reception: {
        key: "reception",
        title: "Réception",
        icon: PackageCheck,
        iconClass: "border-sky-200 bg-sky-50 text-sky-700",
        badgeClass: "border-slate-200 bg-white text-slate-700",
        items: receptionDemandes,
        total: receptionDemandes.length,
        emptyText: "Aucun dossier en réception.",
      },
      closure: {
        key: "closure",
        title: "À clôturer",
        icon: CheckCircle2,
        iconClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
        badgeClass: "border-emerald-200 bg-emerald-500 text-white",
        items: closureDemandes,
        total: closureDemandes.length,
        emptyText: "Aucun état de besoins à clôturer.",
      },
      archive: {
        key: "archive",
        title: "Archive",
        icon: CheckCircle2,
        iconClass: "border-slate-200 bg-slate-50 text-slate-600",
        badgeClass: "border-slate-200 bg-white text-slate-700",
        items: archiveDemandes,
        total: archiveDemandes.length,
        emptyText: "Aucun état de besoins archivé.",
      },
    }),
    [
      activeDemandes,
      archiveDemandes,
      closureDemandes,
      correctionDemandes,
      deliveryDemandes,
      draftDemandes,
      pendingDemandes,
      procurementDemandes,
      receptionDemandes,
    ],
  );

  const archiveGroups = useMemo<ArchiveGroupData[]>(
    () => [
      {
        key: "closed",
        title: "Clôturées",
        items: closedArchiveDemandes,
        total: closedArchiveDemandes.length,
        emptyText: "Aucun dossier clôturé.",
      },
      {
        key: "rejected",
        title: "Rejetées",
        items: rejectedArchiveDemandes,
        total: rejectedArchiveDemandes.length,
        emptyText: "Aucun dossier rejeté.",
      },
    ],
    [closedArchiveDemandes, rejectedArchiveDemandes],
  );

  const orderedSections = useMemo(
    () => [
      ...(sections.draft.total > 0 ? [sections.draft] : []),
      sections.correction,
      sections.closure,
      sections.pending,
      sections.procurement,
      sections.delivery,
      sections.reception,
      sections.all,
      sections.archive,
    ],
    [sections],
  );

  const isSearching = query.trim().length > 0;
  const searchResults = useMemo(
    () => (isSearching ? filterDemandesByQuery(filteredDemandes, query) : []),
    [isSearching, filteredDemandes, query],
  );

  const selectedDemande = useMemo(() => demandes.find((item) => item.id === selectedDemandeId) ?? null, [demandes, selectedDemandeId]);
  const emptyStateTitle =
    dashboardScope === "all"
      ? "Aucun dossier dans le circuit"
      : "Aucun état de besoins";
  const emptyStateText =
    dashboardScope === "all"
      ? "Aucun dossier global n'est encore disponible pour le suivi."
      : "Commencez par créer votre premier état de besoins.";

  return (
    <main className="min-h-screen bg-slate-50 pb-12 text-slate-800">
      <TopHeader />

      <div className="zoom-content">
        <div className="mx-auto max-w-[1120px] px-4 py-6">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-[2rem] font-bold tracking-tight text-slate-900">Tableau de bord</h1>
                  <p className="text-sm text-slate-500">
                    Gérez et suivez vos demandes d&apos;achat en temps réel
                  </p>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[430px] lg:items-end">
              {canAccessGlobalDashboard && (
                <div className="flex w-full justify-end">
                  <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                    <button
                      type="button"
                      onClick={() => router.replace(mineScopeHref)}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                        dashboardScope === "mine"
                          ? "bg-slate-900 text-white"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      Mes dossiers
                    </button>
                    <button
                      type="button"
                      onClick={() => router.replace(allScopeHref)}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                        dashboardScope === "all"
                          ? "bg-slate-900 text-white"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      All
                    </button>
                  </div>
                </div>
              )}

              <div className="flex w-full items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher un numéro, un objet..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-[13px] font-medium outline-none shadow-sm transition-colors focus:border-slate-300"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {dashboardScope === "mine" && (
                  <Link
                    href="/demande-achat/new"
                    className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-slate-900 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-slate-800"
                  >
                    <Plus className="h-4 w-4" /> Nouvel état
                  </Link>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex h-32 flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-2">
                      <div className="h-4 w-20 rounded bg-slate-200"></div>
                      <div className="h-4 w-16 rounded bg-slate-100"></div>
                    </div>
                    <div className="h-5 w-3/4 rounded bg-slate-200"></div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <div className="h-8 w-20 rounded-lg bg-slate-100"></div>
                    <div className="h-8 w-32 rounded-lg bg-slate-200"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border-l-4 border-rose-500 bg-white p-5 text-sm font-medium text-rose-800 shadow-sm">
              {error}
            </div>
          ) : (
            <div className="mb-8 space-y-6">
              <DashboardFilterBar filterProps={filterProps} />

              {demandes.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                  <Activity className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                  <h2 className="mb-2 text-lg font-bold text-slate-900">{emptyStateTitle}</h2>
                  <p className="mb-6 text-sm text-slate-500">{emptyStateText}</p>
                  {dashboardScope === "mine" && (
                    <Link href="/demande-achat/new" className="text-sm font-semibold text-indigo-600 hover:underline">
                      Créer un état de besoins &rarr;
                    </Link>
                  )}
                </div>
              ) : filteredDemandes.length === 0 && !isSearching ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                  <Activity className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                  <h2 className="mb-2 text-lg font-bold text-slate-900">Aucun état trouvé</h2>
                  <p className="mb-6 text-sm text-slate-500">
                    Aucun état de besoins ne correspond à vos filtres actuels.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedFinancements([]);
                      setSelectedTypes([]);
                    }}
                    className="text-sm font-bold text-indigo-600 hover:underline"
                  >
                    Effacer les filtres
                  </button>
                </div>
              ) : isSearching ? (
                <SearchResultsList
                  items={searchResults}
                  query={query}
                  currentUser={currentUser}
                  router={router}
                  onOpenDetail={(id: number) => {
                    setSelectedDemandeId(id);
                    setDetailViewMode("detail");
                  }}
                  onOpenReception={(id: number) => setReceptionModalDemandeId(id)}
                  onOpenCloture={(id: number) => setClotureModalDemandeId(id)}
                />
              ) : (
                <div className="space-y-4">
                  {orderedSections.map((section) => (
                    <AccordionSection
                      key={section.key}
                      section={section}
                      isActive={activeSection === section.key}
                      onToggle={() =>
                        setActiveSection(activeSection === section.key ? null : section.key)
                      }
                      currentUser={currentUser}
                      router={router}
                      onOpenDetail={(id: number) => {
                        setSelectedDemandeId(id);
                        setDetailViewMode("detail");
                      }}
                      onOpenReception={(id: number) => setReceptionModalDemandeId(id)}
                      onOpenCloture={(id: number) => setClotureModalDemandeId(id)}
                      archiveGroups={section.key === "archive" ? archiveGroups : undefined}
                    />
                  ))}
                </div>
              )}
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


function SearchResultsList({
  items,
  query,
  currentUser,
  router,
  onOpenDetail,
  onOpenReception,
  onOpenCloture,
}: SearchResultsListProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(items.length / PAGE_SIZE) || 1;
  const paginatedItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
        <h2 className="text-lg font-bold text-slate-800">Résultats de recherche</h2>
        <p className="text-sm text-slate-500">
          {items.length} résultat(s) pour {query}
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

function SectionDemandesList({
  items,
  sectionKey,
  currentUser,
  router,
  onOpenDetail,
  onOpenReception,
  onOpenCloture,
}: SectionDemandesListProps) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [items]);

  const totalPages = Math.ceil(items.length / PAGE_SIZE) || 1;
  const paginatedItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-3">
      {paginatedItems.map((demande) => (
        <CompactDemandeRow
          key={demande.id}
          demande={demande}
          sectionKey={sectionKey}
          onOpenDetail={() => onOpenDetail(demande.id)}
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
  );
}

function ArchiveGroupBlock({
  group,
  currentUser,
  router,
  onOpenDetail,
  onOpenReception,
  onOpenCloture,
}: ArchiveGroupBlockProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">{group.title}</h3>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
          {group.total}
        </span>
      </div>

      <div className="p-4">
        {group.total === 0 ? (
          <p className="text-sm text-slate-500">{group.emptyText}</p>
        ) : (
          <SectionDemandesList
            items={group.items}
            sectionKey="archive"
            currentUser={currentUser}
            router={router}
            onOpenDetail={onOpenDetail}
            onOpenReception={onOpenReception}
            onOpenCloture={onOpenCloture}
          />
        )}
      </div>
    </section>
  );
}

function AccordionSection({
  section,
  isActive,
  onToggle,
  currentUser,
  router,
  onOpenDetail,
  onOpenReception,
  onOpenCloture,
  archiveGroups = [],
}: AccordionSectionProps) {
  const Icon = section.icon;
  const hasItems = section.total > 0;
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && sectionRef.current) {
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
  }, [isActive]);

  return (
    <div
      ref={sectionRef}
      className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-colors ${
        isActive ? "border-slate-300" : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <button
        onClick={onToggle}
        disabled={!hasItems}
        className={`flex w-full items-center justify-between px-5 py-4 text-left transition-colors ${
          !hasItems
            ? "cursor-not-allowed bg-slate-50 opacity-60"
            : isActive
              ? "border-b border-slate-200 bg-slate-50"
              : "bg-white hover:bg-slate-50"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${section.iconClass}`}>
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
          <span className="text-base font-semibold text-slate-900">{section.title}</span>
          <span
            className={`ml-1 rounded-full border px-3 py-1 text-xs font-semibold ${
              hasItems ? section.badgeClass : "border-slate-200 bg-slate-100 text-slate-400"
            }`}
          >
            {section.total}
          </span>
        </div>

        {hasItems && (
          <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            <span className={isActive ? "text-slate-700" : ""}>
              {isActive ? "Masquer" : "Afficher"}
            </span>
            <div className={`rounded-lg bg-slate-100 p-1 text-slate-400 transition-transform ${isActive ? "rotate-180" : ""}`}>
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
          </div>
        )}
      </button>

      {isActive && hasItems && (
        <div className="bg-slate-50 px-4 py-4">
          {section.key === "archive" ? (
            <div className="space-y-4">
              {archiveGroups.map((group) => (
                <ArchiveGroupBlock
                  key={group.key}
                  group={group}
                  currentUser={currentUser}
                  router={router}
                  onOpenDetail={onOpenDetail}
                  onOpenReception={onOpenReception}
                  onOpenCloture={onOpenCloture}
                />
              ))}
            </div>
          ) : (
            <SectionDemandesList
              items={section.items}
              sectionKey={section.key}
              currentUser={currentUser}
              router={router}
              onOpenDetail={onOpenDetail}
              onOpenReception={onOpenReception}
              onOpenCloture={onOpenCloture}
            />
          )}
        </div>
      )}
    </div>
  );
}

function PaginationControls({ page, totalPages, setPage }: PaginationControlsProps) {
  return (
    <div className="flex items-center justify-between px-2 pt-2">
      <p className="text-xs font-medium text-slate-500">
        Page {page} sur {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPage((p: number) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="rounded-md border border-slate-200 bg-white p-1 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="rounded-md border border-slate-200 bg-white p-1 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function CompactDemandeRow({
  demande,
  sectionKey,
  onOpenDetail,
  onOpenReception,
  onOpenCloture,
  action,
  router,
}: CompactDemandeRowProps) {
  const deadlineState = getValidationDeadlineState(demande);
  const currentOwner = getDemandeCurrentOwnerLabel(demande);
  const demandeurLabel = demande.demandeur_nom || "Demandeur non renseigné";

  return (
    <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-2 mb-2">
          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            {demande.numero_demande}
          </span>
          <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${statusClasses[demande.statut] ?? "bg-slate-200 text-slate-700"}`}>
            {statusLabels[demande.statut] ?? demande.statut}
          </span>
          {deadlineState && deadlineState.status === "RETARD" && (
            <span className="flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
               <div className="h-1.5 w-1.5 rounded-full bg-red-600"></div>
               Retard {deadlineState.hours ? `${deadlineState.hours}h` : ""}
            </span>
          )}
          {deadlineState && (deadlineState.status === "ATTENTE_CRITIQUE" || deadlineState.status === "ATTENTE") && (
            <span className={`flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-semibold ${deadlineState.status === "ATTENTE_CRITIQUE" ? "border-orange-200 bg-orange-50 text-orange-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
               <Clock className="w-3 h-3" />
               {deadlineState.status === "ATTENTE_CRITIQUE" ? "Critique" : "Délai"}: {deadlineState.hours}h
            </span>
          )}
        </div>

        <p className="mb-2 text-[15px] font-semibold leading-tight text-slate-900" title={demande.objet}>
          {demande.objet}
        </p>

        <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600">
            Demandeur: {demandeurLabel}
          </span>
          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-indigo-700">
            Responsable: {currentOwner}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5 text-slate-600">
            <PackageCheck className="w-3.5 h-3.5 text-slate-400" />
            {getCompactNeedLabel(demande)}
          </span>
          <span className="rounded bg-slate-50 px-1.5 py-0.5 text-slate-900">
            {formatMoney(demande.montant_commande ?? demande.cout_total_estime)}
          </span>
          <span className="hidden max-w-[320px] truncate sm:block">
            {getSectionContextLine(demande, sectionKey)}
          </span>
        </div>
      </div>

      <div className="mt-2 flex w-full shrink-0 items-center gap-2 border-t border-slate-100 pt-3 sm:mt-0 sm:w-auto sm:border-t-0 sm:pt-0">
        <button
          onClick={onOpenDetail}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 transition-colors hover:bg-slate-50 sm:flex-none"
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
            className="flex-1 rounded-lg bg-slate-900 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-slate-800 sm:flex-none"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
