"use client";

import React, { useEffect, useMemo, useState, type ElementType } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  ClipboardList,
  FileText,
  Hourglass,
  Layers,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { listContrats } from "@/services/contractualisation";
import { Contrat } from "@/types/contractualisation";
import TopHeader from "@/app/components/TopHeader";
import { fetchCurrentUser, getToken } from "@/services/auth";
import { UserProfile } from "@/types/profile";

type ScreenState = "loading" | "ready" | "error";

type ContratSection = {
  key: string;
  title: string;
  subtitle: string;
  icon: ElementType;
  iconClass: string;
  badgeClass: string;
  emptyText: string;
  rows: Contrat[];
};

const stateLabels: Record<string, string> = {
  BROUILLON: "Brouillon",
  ATTENTE_SIGNATURE: "Attente signature",
  EXECUTION: "En exécution",
  TERMINE: "Terminé",
  SUSPENDU: "Suspendu",
  ANNULE: "Annulé",
};

const stateClasses: Record<string, string> = {
  BROUILLON: "border-slate-200 bg-slate-50 text-slate-700",
  ATTENTE_SIGNATURE: "border-amber-200 bg-amber-50 text-amber-700",
  EXECUTION: "border-emerald-200 bg-emerald-50 text-emerald-700",
  TERMINE: "border-emerald-200 bg-emerald-100 text-emerald-800",
  SUSPENDU: "border-rose-200 bg-rose-50 text-rose-700",
  ANNULE: "border-rose-300 bg-rose-100 text-rose-800",
};

const sectionConfigs: Record<string, Omit<ContratSection, "key" | "rows">> = {
  BROUILLON: {
    title: "À contractualiser (Brouillons)",
    subtitle:
      "Contrats en cours de préparation ou à compléter avant envoi au prestataire.",
    icon: ClipboardList,
    iconClass: "border-amber-200 bg-amber-100 text-amber-800",
    badgeClass: "border-amber-200 bg-amber-500 text-white",
    emptyText: "Aucun contrat en brouillon.",
  },
  ATTENTE_SIGNATURE: {
    title: "En attente signature",
    subtitle: "Contrats envoyés au prestataire pour signature et retour.",
    icon: Hourglass,
    iconClass: "border-blue-200 bg-blue-100 text-blue-800",
    badgeClass: "border-blue-200 bg-blue-500 text-white",
    emptyText: "Aucun contrat en attente de signature.",
  },
  SIGNE: {
    title: "Contrats signés / En exécution",
    subtitle: "Contrats finalisés, signés et en cours d'exécution ou clôturés.",
    icon: CheckCircle2,
    iconClass: "border-emerald-200 bg-emerald-100 text-emerald-800",
    badgeClass: "border-emerald-200 bg-emerald-500 text-white",
    emptyText: "Aucun contrat signé.",
  },
  AUTRES: {
    title: "Suspendus ou Annulés",
    subtitle:
      "Contrats suspendus ou annulés suite à des décisions administratives.",
    icon: AlertCircle,
    iconClass: "border-rose-200 bg-rose-100 text-rose-800",
    badgeClass: "border-rose-200 bg-rose-500 text-white",
    emptyText: "Aucun contrat suspendu ou annulé.",
  },
};

const sectionOrder = ["BROUILLON", "ATTENTE_SIGNATURE", "SIGNE", "AUTRES"];

const getContratStateKey = (statut: string): string => {
  if (statut === "EXECUTION" || statut === "TERMINE") return "SIGNE";
  if (statut === "SUSPENDU" || statut === "ANNULE") return "AUTRES";
  return statut; // BROUILLON, ATTENTE_SIGNATURE
};

export default function ContractualisationListPage() {
  const router = useRouter();
  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      if (!getToken()) {
        router.replace("/auth/login");
        return;
      }

      try {
        setScreenState("loading");
        const [user, data] = await Promise.all([
          fetchCurrentUser(),
          listContrats(),
        ]);
        setCurrentUser(user);
        setContrats(data);
        setScreenState("ready");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger le module contractualisation.",
        );
        setScreenState("error");
      }
    };

    void bootstrap();
  }, [router]);

  const countStatut = (statut: string) =>
    contrats.filter((c) => c.statut === statut).length;

  const countExExecutionOrTermine = () =>
    contrats.filter((c) => c.statut === "EXECUTION" || c.statut === "TERMINE")
      .length;

  const filteredContrats = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return contrats.filter((c) => {
      if (!normalizedQuery) return true;
      const searchable = [
        c.numero_marche,
        c.offre_soumissionnaire,
        c.nom_prestataire,
        c.seance_reference,
        c.seance_objet,
        stateLabels[c.statut],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [query, contrats]);

  const sections = useMemo<ContratSection[]>(() => {
    return sectionOrder.map((key) => ({
      key,
      ...sectionConfigs[key],
      rows: filteredContrats.filter(
        (c) => getContratStateKey(c.statut) === key,
      ),
    }));
  }, [filteredContrats]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#f6faf8_0%,transparent_25%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] pb-24 text-slate-800 antialiased selection:bg-emerald-200">
      <TopHeader />

      <div className="zoom-content">
        <div className="mx-auto flex max-w-[1680px] flex-col gap-5 px-4 pb-12 pt-6 md:px-6 lg:pt-8">
          {/* Header Card */}
          {screenState === "ready" && (
            <div className="relative flex w-full flex-col justify-between gap-4 overflow-hidden rounded-3xl border border-slate-100 bg-white px-5 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] md:flex-row md:items-center">
              <div className="pointer-events-none absolute right-0 top-0 h-32 w-56 rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 opacity-45 blur-3xl" />

              <div className="relative z-10 flex min-w-0 items-center gap-4">
                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <Sparkles className="absolute -right-1.5 -top-1.5 h-3.5 w-3.5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-black tracking-tight text-slate-800 sm:text-xl">
                    CONTRACTUALISATION DES MARCHÉS
                  </h1>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="truncate text-[10px] font-black uppercase tracking-widest text-slate-500 sm:text-[11px]">
                      Module NOTI5 — Suivi des signatures et validation des
                      contrats
                    </p>
                  </div>
                </div>
              </div>

              {currentUser && (
                <div className="relative z-10 flex items-center gap-3">
                  <div className="hidden sm:block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600">
                    Secrétaire :{" "}
                    <span className="text-slate-900">
                      {`${currentUser.first_name} ${currentUser.last_name}`.trim() ||
                        currentUser.username}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {screenState === "loading" && (
            <div className="space-y-4 animate-pulse">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="h-28 rounded-3xl border border-white/40 bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.05)]"
                />
              ))}
            </div>
          )}

          {/* Error State */}
          {screenState === "error" && (
            <section className="rounded-3xl border border-rose-200 bg-white p-8 shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
              <h2 className="text-lg font-black text-slate-900">
                Erreur de chargement
              </h2>
              <p className="mt-2 text-sm text-rose-700">{error}</p>
            </section>
          )}

          {/* Main Dashboard Section */}
          {screenState === "ready" && (
            <>
              {/* Statistics Panel */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
                  <div className="text-xs uppercase tracking-[0.24em] font-bold text-slate-500">
                    À contractualiser
                  </div>
                  <div className="mt-4 text-4xl font-black text-amber-600">
                    {countStatut("BROUILLON")}
                  </div>
                  <div className="mt-2 text-xs font-medium text-slate-500">
                    Contrats en brouillon ou à compléter
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
                  <div className="text-xs uppercase tracking-[0.24em] font-bold text-slate-500">
                    En attente signature
                  </div>
                  <div className="mt-4 text-4xl font-black text-sky-600">
                    {countStatut("ATTENTE_SIGNATURE")}
                  </div>
                  <div className="mt-2 text-xs font-medium text-slate-500">
                    Contrats envoyés au prestataire
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
                  <div className="text-xs uppercase tracking-[0.24em] font-bold text-slate-500">
                    Contrats signés
                  </div>
                  <div className="mt-4 text-4xl font-black text-emerald-600">
                    {countExExecutionOrTermine()}
                  </div>
                  <div className="mt-2 text-xs font-medium text-slate-500">
                    Contrats finalisés et signés
                  </div>
                </div>
              </div>

              {/* Collapsible Accordions Card */}
              <section className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.05)] backdrop-blur-md transition-all duration-500 hover:shadow-[0_12px_48px_rgba(0,0,0,0.08)]">
                <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 bg-[length:200%_100%] animate-gradient" />
                <div className="p-6">
                  {/* Search Bar */}
                  <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <h2 className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-800">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-600 shadow-sm backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                        <Layers className="h-5 w-5" />
                      </div>
                      Suivi des contrats de marché
                    </h2>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="relative min-w-[280px]">
                        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Rechercher un contrat, marché, prestataire..."
                          className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 pl-10 pr-10 text-[13px] font-semibold text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                        />
                        {query && (
                          <button
                            type="button"
                            onClick={() => setQuery("")}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Accordion Lists */}
                  {filteredContrats.length === 0 && Boolean(query.trim()) ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-8 text-center">
                      <p className="text-[13px] font-semibold text-slate-500">
                        Aucun contrat ne correspond à cette recherche.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sections.map((section) => (
                        <ContratStatusSection
                          key={section.key}
                          section={section}
                          isActive={activeSection === section.key}
                          onToggle={() =>
                            setActiveSection(
                              activeSection === section.key
                                ? null
                                : section.key,
                            )
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function ContratStatusSection({
  section,
  isActive,
  onToggle,
}: {
  section: ContratSection;
  isActive: boolean;
  onToggle: () => void;
}) {
  const Icon = section.icon;
  const hasRows = section.rows.length > 0;

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-colors ${
        isActive
          ? "border-slate-300"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between px-5 py-4 text-left transition-colors ${
          isActive
            ? "border-b border-slate-200 bg-slate-50"
            : "bg-white hover:bg-slate-50"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl border ${section.iconClass}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {section.title}
            </h3>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              {section.subtitle}
            </p>
          </div>
          <span
            className={`ml-1 rounded-full border px-3 py-1 text-xs font-semibold ${
              hasRows
                ? section.badgeClass
                : "border-slate-200 bg-slate-100 text-slate-400"
            }`}
          >
            {section.rows.length}
          </span>
        </div>

        <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          <span className={isActive ? "text-slate-700" : ""}>
            {isActive ? "Masquer" : "Afficher"}
          </span>
          <div
            className={`rounded-lg bg-slate-100 p-1 text-slate-400 transition-transform ${isActive ? "rotate-180" : ""}`}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </div>
        </div>
      </button>

      {isActive && (
        <div className="space-y-3 bg-slate-50 px-4 py-4">
          {hasRows ? (
            section.rows.map((contrat, index) => (
              <ContratDashboardRow
                key={contrat.id}
                contrat={contrat}
                index={index}
              />
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white/80 px-4 py-5 text-sm font-semibold text-slate-500">
              {section.emptyText}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ContratDashboardRow({
  contrat,
  index,
}: {
  contrat: Contrat;
  index: number;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-emerald-300 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-600">
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              {contrat.numero_marche}
            </span>
            <span
              className={`rounded border px-2 py-0.5 text-[10px] font-bold ${stateClasses[contrat.statut] || "border-slate-200 bg-slate-50 text-slate-700"}`}
            >
              {contrat.statut_label}
            </span>
            {contrat.seance_reference && (
              <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                Séance : {contrat.seance_reference}
              </span>
            )}
          </div>

          <p className="text-[14px] font-black leading-tight text-slate-800">
            {contrat.seance_objet || "Objet du contrat non spécifié"}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-600">
              Prestataire :{" "}
              {contrat.nom_prestataire || contrat.offre_soumissionnaire}
            </span>
            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
              Montant :{" "}
              {parseFloat(contrat.montant_ttc).toLocaleString("fr-FR", {
                style: "currency",
                currency: "XOF",
              })}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-500">
              Créé le :{" "}
              {new Date(contrat.created_at).toLocaleDateString("fr-FR")}
            </span>
          </div>
        </div>
      </div>

      <div className="flex w-full shrink-0 gap-2 border-t border-slate-100 pt-3 sm:w-auto sm:border-t-0 sm:pt-0">
        <Link
          href={`/personnel/contractualisation/${contrat.id}`}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800 sm:flex-none"
        >
          Voir le contrat
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
