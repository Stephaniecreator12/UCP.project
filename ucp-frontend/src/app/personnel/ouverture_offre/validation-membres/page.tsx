"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  FileText,
  Filter,
  Globe,
  Hourglass,
  Layers,
  Loader2,
  Mail,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  ThumbsDown,
  ThumbsUp,
  User,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import TopHeader from "@/app/components/TopHeader";
import {
  fetchCurrentUser,
  getCompositionValidatorRoleLabel,
  getCurrentUser,
  getLandingRouteForUser,
  getToken,
  isCompositionValidatorUser,
  type UserProfile,
} from "@/services/auth";
import {
  fetchCompositionDetail,
  fetchCompositionPending,
  rejectComposition,
  validateComposition,
  type CompositionDetail,
  type CompositionPendingItem,
  type CompositionDashboardStatut,
} from "@/services/ouvertureOffre";
import { getMarkets } from "@/services/procurement";
import type { ProcurementMarket } from "@/types/procurement";

type StatusGroupKey = "A_VALIDER" | "VALIDE_ARCHIVE";

interface StatusSectionConfig {
  key: StatusGroupKey;
  title: string;
  subtitle: string;
  icon: typeof Clock;
  iconClass: string;
  badgeClass: string;
  emptyText: string;
}

const SECTION_CONFIGS: Record<StatusGroupKey, StatusSectionConfig> = {
  A_VALIDER: {
    key: "A_VALIDER",
    title: "Compositions à valider",
    subtitle: "En attente de votre examen",
    icon: Hourglass,
    iconClass: "border-amber-200 bg-amber-50 text-amber-700",
    badgeClass: "border-amber-200 bg-amber-500 text-white",
    emptyText: "Aucun dossier à valider.",
  },
  VALIDE_ARCHIVE: {
    key: "VALIDE_ARCHIVE",
    title: "Déjà validés / Archivés",
    subtitle: "Compositions déjà traitées",
    icon: CheckCircle2,
    iconClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    badgeClass: "border-emerald-200 bg-emerald-500 text-white",
    emptyText: "Aucun dossier archivé.",
  },
};

const SECTION_ORDER: StatusGroupKey[] = ["A_VALIDER", "VALIDE_ARCHIVE"];

const DECISION_META: Record<
  "EN_ATTENTE" | "VALIDEE" | "REJETEE",
  { label: string; className: string; icon: typeof Clock }
> = {
  EN_ATTENTE: {
    label: "En attente",
    className: "border-slate-200 bg-slate-50 text-slate-600",
    icon: Clock,
  },
  VALIDEE: {
    label: "Validée",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: CheckCircle2,
  },
  REJETEE: {
    label: "À modifier",
    className: "border-rose-200 bg-rose-50 text-rose-800",
    icon: AlertTriangle,
  },
};

const ROLE_FULL_NAMES: Record<string, string> = {
  RPM: "Responsable Passation de Marché (RPM)",
  GP: "Gestionnaire de Programme (GP)",
  CN: "Coordonnateur National (CN)",
};

const procedureLabels: Record<string, string> = {
  AOI: "AOI (Appel d'Offres International)",
  AON: "AON (Appel d'Offres National)",
  DC: "DC (Demande de Cotation)",
  GRE_A_GRE: "Gré à Gré",
};

const categoryLabels: Record<string, string> = {
  BIENS: "Biens & Fournitures",
  SERVICES: "Services & Prestations",
  INFRA: "Travaux & Infrastructures",
};

const financingLabels: Record<string, string> = {
  GLOBAL_FUND: "Fonds Mondial (Global Fund)",
  GAVI: "GAVI (Alliance du Vaccin)",
  WORLD_BANK: "Banque Mondiale (World Bank)",
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatDateOnly = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
  }).format(date);
};

const getInitials = (name: string) => {
  if (!name) return "M";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export default function ValidationMembresPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<CompositionPendingItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<CompositionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [linkedMarket, setLinkedMarket] = useState<ProcurementMarket | null>(null);
  const [search, setSearch] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTION_REQUIRED" | "URGENT" | "ARCHIVED">("ALL");

  // Track expanded accordion sections
  const [openSections, setOpenSections] = useState<Record<StatusGroupKey, boolean>>({
    A_VALIDER: true,
    VALIDE_ARCHIVE: false,
  });

  useEffect(() => {
    const init = async () => {
      if (!getToken()) {
        router.replace("/auth/login");
        return;
      }

      try {
        const user = getCurrentUser() ?? (await fetchCurrentUser());
        setCurrentUser(user);
        if (!isCompositionValidatorUser(user)) {
          router.replace(getLandingRouteForUser(user));
          return;
        }

        setLoading(true);
        const items = await fetchCompositionPending();
        setPending(items);
        const targetSeance = Number(searchParams.get("seance"));
        setSelectedId((prev) => {
          if (prev && items.some((item) => item.seance_id === prev)) {
            return prev;
          }
          if (
            !Number.isNaN(targetSeance) &&
            targetSeance > 0 &&
            items.some((item) => item.seance_id === targetSeance)
          ) {
            return targetSeance;
          }
          return items[0]?.seance_id ?? null;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, [router, searchParams]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setLinkedMarket(null);
      return;
    }

    let active = true;
    const load = async () => {
      try {
        setDetailLoading(true);
        setError("");
        const data = await fetchCompositionDetail(selectedId);
        if (!active) return;
        setDetail(data);
        setCommentaire("");

        // Fetch corresponding DAO Market details
        if (data.reference_dossier) {
          try {
            const marketRes = await getMarkets("1", data.reference_dossier);
            if (active) {
              const matched = marketRes.results.find(
                (m) => m.reference_number === data.reference_dossier,
              ) ?? marketRes.results[0] ?? null;
              setLinkedMarket(matched);
            }
          } catch {
            if (active) setLinkedMarket(null);
          }
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        if (active) setDetailLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [selectedId]);

  const isArchived = (item: CompositionPendingItem) =>
    item.ma_decision !== "EN_ATTENTE" ||
    item.statut_dashboard === "VALIDEE" ||
    item.statut_dashboard === "REJETEE";

  const filteredPending = useMemo(() => {
    const query = search.trim().toLowerCase();
    return pending.filter((item) => {
      if (activeFilter === "ACTION_REQUIRED" && item.ma_decision !== "EN_ATTENTE") {
        return false;
      }
      if (activeFilter === "URGENT" && !item.est_urgent) {
        return false;
      }
      if (activeFilter === "ARCHIVED" && !isArchived(item)) {
        return false;
      }

      if (!query) return true;
      return [item.reference_dossier, item.objet_dossier, item.statut_dashboard]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [pending, search, activeFilter]);

  const groupedSections = useMemo(() => {
    return SECTION_ORDER.map((key) => {
      const config = SECTION_CONFIGS[key];
      const rows = filteredPending.filter((item) => {
        if (key === "A_VALIDER") {
          return item.ma_decision === "EN_ATTENTE";
        }
        return isArchived(item);
      });
      return {
        ...config,
        rows,
      };
    });
  }, [filteredPending]);

  const stats = useMemo(
    () => ({
      total: pending.length,
      actionRequired: pending.filter((item) => item.ma_decision === "EN_ATTENTE").length,
      urgent: pending.filter((item) => item.est_urgent).length,
      archived: pending.filter(isArchived).length,
    }),
    [pending],
  );

  const toggleSection = (key: StatusGroupKey) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleDecision = async (decision: "VALIDEE" | "REJETEE") => {
    if (!detail || !selectedId) return;
    if (detail.ma_decision !== "EN_ATTENTE") return;
    if (decision === "REJETEE" && commentaire.trim().length < 5) {
      setError("Ajoutez un commentaire explicatif pour la demande de modification.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setFeedback("");
      const payload = { commentaire: commentaire.trim() };
      if (decision === "VALIDEE") {
        await validateComposition(selectedId, payload);
        setFeedback("Composition validée avec succès.");
      } else {
        await rejectComposition(selectedId, payload);
        setFeedback("Demande de modification transmise avec succès.");
      }

      const [items, nextDetail] = await Promise.all([
        fetchCompositionPending(),
        fetchCompositionDetail(selectedId),
      ]);
      setPending(items);
      setDetail(nextDetail);
      setSelectedId((prev) => {
        if (prev && items.some((item) => item.seance_id === prev)) {
          return prev;
        }
        return items[0]?.seance_id ?? prev;
      });
      setCommentaire("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible");
    } finally {
      setSubmitting(false);
    }
  };

  const roleLabel = getCompositionValidatorRoleLabel(currentUser);

  return (
    <main className="h-screen flex flex-col overflow-hidden bg-slate-100 text-slate-800 antialiased selection:bg-emerald-200">
      <TopHeader />

      {/* Main App Workspace Container - Rigid height, no overall window scrolling */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-4 py-3 gap-3">
        {/* Compact Header & Stat Ribbon (Reduced height to maximize detail view) */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-base font-black text-slate-900">
                  VALIDATION DE LA COMPOSITION DES MEMBRES
                </h1>
                <span className="hidden sm:inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="truncate text-[11px] font-bold text-slate-500">
                {roleLabel ? `Rôle : ${roleLabel}` : "Espace de validation"} · Contrôle RPM / GP / CN
              </p>
            </div>
          </div>

          {/* Compact Metric Chips Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveFilter("ALL")}
              className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                activeFilter === "ALL"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Tous ({stats.total})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("ACTION_REQUIRED")}
              className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                activeFilter === "ACTION_REQUIRED"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>À valider ({stats.actionRequired})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("URGENT")}
              className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                activeFilter === "URGENT"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Urgents ({stats.urgent})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("ARCHIVED")}
              className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                activeFilter === "ARCHIVED"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Archivés ({stats.archived})</span>
            </button>
          </div>
        </div>

        {/* Alerts section */}
        {(error || feedback) && (
          <div className="shrink-0 space-y-2">
            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-800 shadow-sm">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError("")}
                  className="ml-auto text-rose-500 hover:text-rose-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            {feedback && (
              <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 shadow-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{feedback}</span>
                <button
                  type="button"
                  onClick={() => setFeedback("")}
                  className="ml-auto text-emerald-500 hover:text-emerald-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Split Workspace View: Left (Narrow sidebar list) & Right (Expanded Detail Panel with internal scroll) */}
        <div className="flex-1 min-h-0 flex gap-4 overflow-hidden">
          {/* Left Panel: Narrow Dossier List (340px fixed width, independent internal scroll) */}
          <div className="w-[340px] shrink-0 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Search Input Box */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Recherche DAO..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs font-semibold text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Left Accordion List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center p-12 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                </div>
              ) : filteredPending.length === 0 ? (
                <div className="p-8 text-center text-xs font-semibold text-slate-400">
                  Aucun dossier trouvé.
                </div>
              ) : (
                groupedSections.map((section) => {
                  const Icon = section.icon;
                  const hasRows = section.rows.length > 0;
                  const isOpen = openSections[section.key];

                  return (
                    <div
                      key={section.key}
                      className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSection(section.key)}
                        className="flex w-full items-center justify-between px-3 py-2.5 text-left bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className="h-4 w-4 shrink-0 text-slate-600" />
                          <span className="text-xs font-black text-slate-800 truncate">
                            {section.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            {section.rows.length}
                          </span>
                          <ChevronDown
                            className={`h-3.5 w-3.5 text-slate-500 transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </button>

                      {isOpen && (
                        <div className="divide-y divide-slate-100">
                          {hasRows ? (
                            section.rows.map((item) => {
                              const active = item.seance_id === selectedId;
                              const isActionRequired = item.ma_decision === "EN_ATTENTE";

                              return (
                                <button
                                  key={item.seance_id}
                                  type="button"
                                  onClick={() => setSelectedId(item.seance_id)}
                                  className={`w-full p-3 text-left transition-all block ${
                                    active
                                      ? "bg-emerald-50/90 border-l-4 border-emerald-600 pl-2.5 shadow-sm"
                                      : "bg-white hover:bg-slate-50"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                                      {item.reference_dossier}
                                    </span>
                                    {isActionRequired && (
                                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-800">
                                        À voter
                                      </span>
                                    )}
                                  </div>

                                  <h4 className="mt-1.5 text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                                    {item.objet_dossier}
                                  </h4>

                                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                                    <span>{item.membres_count} membres</span>
                                    {item.est_urgent && (
                                      <span className="font-bold text-amber-700">Urgent</span>
                                    )}
                                  </div>
                                </button>
                              );
                            })
                          ) : (
                            <div className="p-4 text-center text-[11px] text-slate-400">
                              {section.emptyText}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Expanded Detail Section (Flexible width, independent internal scrollable content) */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {detailLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <p className="mt-3 text-xs font-bold text-slate-600">
                  Chargement des détails complets du DAO et de la commission...
                </p>
              </div>
            ) : detail ? (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Fixed Top Header of Detail Panel */}
                <div className="shrink-0 px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-black uppercase text-white font-mono">
                        {detail.reference_dossier}
                      </span>
                      {detail.est_urgent && (
                        <span className="rounded-md border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          Urgent
                        </span>
                      )}
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold ${
                          DECISION_META[detail.ma_decision].className
                        }`}
                      >
                        {DECISION_META[detail.ma_decision].label}
                      </span>
                    </div>
                    <h2 className="mt-1.5 text-base font-black text-slate-900 line-clamp-1">
                      {detail.objet_dossier}
                    </h2>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Avancement Workflow
                    </span>
                    <span className="text-xs font-extrabold text-emerald-700 uppercase bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-block mt-0.5">
                      {detail.statut_dashboard.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                {/* Scrollable Body: Complete DAO Details + Members + Timeline */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Section 1: Detailed DAO & Procurement Form Information */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3 text-xs font-black uppercase tracking-wider text-slate-700">
                      <FileText className="h-4 w-4 text-emerald-600" />
                      Détails complets du Formulaire DAO & Marché
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {/* Intitulé */}
                      <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Tag className="h-3 w-3 text-emerald-600" /> Intitulé complet du marché / DAO
                        </span>
                        <p className="mt-1 text-xs font-extrabold text-slate-900 leading-relaxed">
                          {linkedMarket?.title || detail.objet_dossier}
                        </p>
                      </div>

                      {/* Financement / Source */}
                      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Globe className="h-3 w-3 text-emerald-600" /> Financement / Bailleur
                        </span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {linkedMarket?.financing_sources && linkedMarket.financing_sources.length > 0 ? (
                            linkedMarket.financing_sources.map((src) => (
                              <span
                                key={src}
                                className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-800"
                              >
                                {financingLabels[src] || src}
                              </span>
                            ))
                          ) : linkedMarket?.reference_bailleur ? (
                            <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                              {financingLabels[linkedMarket.reference_bailleur] || linkedMarket.reference_bailleur}
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-600">
                              Fonds Propres / UCP
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Deadline / Limite de dépôt */}
                      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-emerald-600" /> Date & Heure limite de dépôt (Deadline)
                        </span>
                        <p className="mt-1 text-xs font-extrabold text-slate-900">
                          {linkedMarket?.deadline
                            ? formatDateTime(linkedMarket.deadline)
                            : "Non spécifiée"}
                        </p>
                      </div>

                      {/* Code Projet */}
                      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Building2 className="h-3 w-3 text-emerald-600" /> Code Projet UCP
                        </span>
                        <p className="mt-1 text-xs font-extrabold text-slate-900">
                          {linkedMarket?.project_code || "Projet UCP Santé"}
                        </p>
                      </div>

                      {/* Procédure */}
                      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Briefcase className="h-3 w-3 text-emerald-600" /> Type de Procédure
                        </span>
                        <p className="mt-1 text-xs font-extrabold text-slate-900">
                          {linkedMarket?.procedure_type
                            ? procedureLabels[linkedMarket.procedure_type] || linkedMarket.procedure_type
                            : "Procédure standard"}
                        </p>
                      </div>

                      {/* Catégorie */}
                      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Layers className="h-3 w-3 text-emerald-600" /> Catégorie du marché
                        </span>
                        <p className="mt-1 text-xs font-extrabold text-slate-900">
                          {linkedMarket?.category
                            ? categoryLabels[linkedMarket.category] || linkedMarket.category
                            : "Marché public"}
                        </p>
                      </div>

                      {/* Date de publication */}
                      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-emerald-600" /> Date de Publication
                        </span>
                        <p className="mt-1 text-xs font-extrabold text-slate-900">
                          {linkedMarket?.publication_date
                            ? formatDateOnly(linkedMarket.publication_date)
                            : "Déjà publié"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Validation Workflow Timeline (RPM -> GP -> CN) */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" /> Suivi du circuit de validation (RPM → GP → CN)
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {(["RPM", "GP", "CN"] as const).map((roleKey) => {
                        const val = detail.validations.find((v) => v.role === roleKey);
                        const decision = val?.decision ?? "EN_ATTENTE";
                        const isCurrentActive =
                          detail.statut_dashboard === `EN_ATTENTE_${roleKey}`;

                        return (
                          <div
                            key={roleKey}
                            className={`rounded-xl border p-3 transition-all ${
                              isCurrentActive
                                ? "border-emerald-400 bg-emerald-50/70 ring-2 ring-emerald-100"
                                : decision === "VALIDEE"
                                ? "border-emerald-200 bg-emerald-50/30"
                                : decision === "REJETEE"
                                ? "border-rose-200 bg-rose-50/40"
                                : "border-slate-200 bg-slate-50/50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-slate-500 uppercase">
                                {ROLE_FULL_NAMES[roleKey] || roleKey}
                              </span>
                              <span
                                className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold ${
                                  DECISION_META[decision].className
                                }`}
                              >
                                {DECISION_META[decision].label}
                              </span>
                            </div>

                            <p className="mt-2 text-xs font-extrabold text-slate-900">
                              {roleKey === "RPM"
                                ? "Responsable Passation de Marché"
                                : roleKey === "GP"
                                ? "Gestionnaire de Programme"
                                : "Coordonnateur National"}
                            </p>

                            {val?.date_validation ? (
                              <p className="mt-1 text-[10px] font-semibold text-slate-500">
                                Traité le {formatDateTime(val.date_validation)}
                              </p>
                            ) : isCurrentActive ? (
                              <p className="mt-1 text-[10px] font-extrabold text-emerald-700 animate-pulse">
                                ● Action requise en ce moment
                              </p>
                            ) : (
                              <p className="mt-1 text-[10px] text-slate-400">En attente du tour</p>
                            )}

                            {val?.commentaire && (
                              <p className="mt-2 rounded bg-white p-2 text-[11px] text-slate-700 border border-slate-200 italic">
                                &quot;{val.commentaire}&quot;
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 3: Membres de la Commission Saisis */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                        <Users className="h-4 w-4 text-emerald-600" /> Membres de la Commission Désignés ({detail.membres.length})
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {detail.membres.map((membre, idx) => (
                        <div
                          key={`${detail.seance_id}-${membre.numero_carte}-${idx}`}
                          className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 hover:border-emerald-300 hover:bg-white transition-all shadow-2xs flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start gap-2.5">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white font-black text-xs shadow-sm">
                                {getInitials(membre.nom_prenom)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-extrabold text-slate-900 truncate">
                                  {membre.nom_prenom}
                                </h4>
                                <p className="text-[11px] font-bold text-emerald-700 truncate mt-0.5">
                                  {membre.poste}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 space-y-1.5 border-t border-slate-200/60 pt-2 text-[11px]">
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <Building2 className="h-3 w-3 shrink-0 text-slate-400" />
                                <span className="font-semibold truncate">{membre.entite || "Non renseignée"}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <CreditCard className="h-3 w-3 shrink-0 text-slate-400" />
                                <span className="font-mono font-bold text-slate-800">CIN: {membre.numero_carte || "Inconnu"}</span>
                              </div>
                              {membre.email && (
                                <div className="flex items-center gap-1.5 text-slate-600">
                                  <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                                  <span className="truncate text-slate-500 font-medium">{membre.email}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Fixed Bottom Action Panel (Stays pinned at bottom of detail box) */}
                <div className="shrink-0 p-4 border-t border-slate-200 bg-slate-50">
                  {detail.ma_decision === "EN_ATTENTE" ? (
                    <div className="space-y-3 max-w-4xl mx-auto">
                      <div>
                        <label className="block text-xs font-extrabold text-slate-700 mb-1 flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                          Commentaire / Observation de validation
                        </label>
                        <textarea
                          value={commentaire}
                          onChange={(e) => setCommentaire(e.target.value)}
                          placeholder="Saisissez vos remarques ou motifs de demande de modification..."
                          rows={2}
                          className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-800 outline-none shadow-sm transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-400"
                          disabled={submitting}
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <button
                          type="button"
                          onClick={() => void handleDecision("VALIDEE")}
                          disabled={submitting}
                          className="flex-1 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60"
                        >
                          {submitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ThumbsUp className="h-4 w-4" />
                          )}
                          Valider la composition
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDecision("REJETEE")}
                          disabled={submitting}
                          className="flex-1 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-5 py-2.5 text-xs font-black text-rose-800 shadow-sm transition-all hover:bg-rose-100 active:scale-[0.99] disabled:opacity-60"
                        >
                          {submitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ThumbsDown className="h-4 w-4" />
                          )}
                          Demander modification
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 shadow-sm max-w-4xl mx-auto">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                      <div>
                        <p className="font-extrabold text-slate-900">
                          Décision enregistrée ({DECISION_META[detail.ma_decision].label})
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Votre vote pour cette commission de membres a bien été consigné dans le système.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
                <FileText className="h-12 w-12 text-slate-300" />
                <h3 className="mt-3 text-sm font-extrabold text-slate-700">
                  Aucun dossier sélectionné
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-xs">
                  Sélectionnez un dossier DAO dans la liste de gauche pour afficher l&apos;ensemble de ses détails et valider sa commission.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
