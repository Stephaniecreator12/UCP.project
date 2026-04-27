"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Activity } from "lucide-react";

import TopHeader from "@/app/components/TopHeader";
import { getToken } from "@/services/auth";
import { StatusStepper } from "./components/StatusStepper";
import { AccordionSection } from "./components/AccordionSection";
import { DashboardFilterBar } from "./components/DashboardFilterBar";
import { 
  useTdrStData, 
  type Statut, 
  type FundingSource, 
  type TdrStDocument, 
  type UserRole,
  STATUT_LABEL
} from "./hooks/useTdrStData";

const ROLE_LABEL: Record<UserRole, string> = {
  initiateur: "Initiateur (Cadre technique)",
  verificateur_technique: "Vérificateur technique (Chef de projet / Point focal)",
  approbateur_final: "Approbateur final (Coordonnateur UCP)",
  auditeur: "Auditeur (Consultation seule)",
};

export default function TdRStPage() {
  const router = useRouter();
  const {
    role,
    currentUsername,
    documents,
    setDocuments,
    loading,
    setLoading,
    error,
    success,
    setNotification,
    refreshDocs,
    loadUserAndDocs,
    fetchJson,
  } = useTdrStData();

  // UI state
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [fundingFilter, setFundingFilter] = useState<FundingSource | "TOUS">("TOUS");
  const [statusFilter, setStatusFilter] = useState<string>("TOUS");

  // Load user and documents on mount
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    loadUserAndDocs();
  }, [loadUserAndDocs, router]);

  // Get funding options for filter
  const fundingOptions = useMemo(() => {
    if (role !== "auditeur") return [];
    const set = new Set<FundingSource>();
    documents.forEach((doc) => {
      let sources: string[] = [];
      if (typeof doc.sources_financement === "string") {
        sources = [doc.sources_financement];
      } else if (Array.isArray(doc.sources_financement)) {
        sources = doc.sources_financement as string[];
      }
      sources.forEach((source) => {
        if (source === "Fonds mondial" || source === "Banque mondiale" || source === "Alliance GAVI") {
          set.add(source as FundingSource);
        }
      });
    });
    return Array.from(set);
  }, [documents, role]);

  // Get status options for filter
  const statusOptions = useMemo(() => {
    if (role !== "auditeur") return [];
    return ["VALIDE", "REJETE", "SUSPENDU"];
  }, [role]);

  // Filter documents for auditeur
  const filteredDocuments = useMemo(() => {
    if (role !== "auditeur") return documents;

    const normalize = (value: unknown) =>
      String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    const query = normalize(searchQuery).trim();

    return documents.filter((doc) => {
      if (fundingFilter !== "TOUS") {
        let sources: string[] = [];
        if (typeof doc.sources_financement === "string") {
          sources = [doc.sources_financement];
        } else if (Array.isArray(doc.sources_financement)) {
          sources = doc.sources_financement as string[];
        }
        if (!sources.includes(fundingFilter)) return false;
      }

      if (statusFilter !== "TOUS" && doc.statut !== statusFilter) return false;

      if (!query) return true;

      const haystack = normalize([
        doc.numero_document,
        doc.intitule,
        doc.type_document,
        doc.unite_technique,
        doc.reference_ptba,
      ].join(" "));

      return haystack.includes(query);
    });
  }, [documents, role, fundingFilter, statusFilter, searchQuery]);

  // Group documents by section
  const sections = useMemo(() => {
    const docs = role === "auditeur" ? filteredDocuments : documents;

    // Pour l'auditeur: tous les documents sont dans l'archive
    if (role === "auditeur") {
      return {
        archive: docs.filter((d) => ["VALIDE", "REJETE", "SUSPENDU"].includes(d.statut)),
        draft: [],
        pending: [],
        correction: [],
        validation: [],
        all: [],
      };
    }

    // Pour initiateur
    if (role === "initiateur") {
      return {
        draft: docs.filter((d) => d.statut === "BROUILLON"),
        pending: docs.filter((d) => d.statut === "SOUMIS"),
        correction: docs.filter((d) => d.statut === "A_REVOIR"),
        validation: docs.filter((d) => d.statut === "EN_VALIDATION"),
        all: docs.filter((d) => !["BROUILLON", "VALIDE", "REJETE", "SUSPENDU"].includes(d.statut)),
        archive: docs.filter((d) => ["VALIDE", "REJETE", "SUSPENDU"].includes(d.statut)),
      };
    }

    // Pour verificateur_technique - ils voient les documents SOUMIS et EN_VALIDATION
    if (role === "verificateur_technique") {
      return {
        draft: [],
        pending: docs.filter((d) => d.statut === "SOUMIS"),
        correction: docs.filter((d) => d.statut === "A_REVOIR"),
        validation: docs.filter((d) => d.statut === "EN_VALIDATION"),
        all: docs.filter((d) => !["VALIDE", "REJETE", "SUSPENDU"].includes(d.statut)),
        archive: docs.filter((d) => ["VALIDE", "REJETE", "SUSPENDU"].includes(d.statut)),
      };
    }

    // Pour approbateur_final - ils voient les documents EN_VALIDATION
    if (role === "approbateur_final") {
      return {
        draft: [],
        pending: [],
        correction: docs.filter((d) => d.statut === "A_REVOIR"),
        validation: docs.filter((d) => d.statut === "EN_VALIDATION"),
        all: docs.filter((d) => !["VALIDE", "REJETE", "SUSPENDU"].includes(d.statut)),
        archive: docs.filter((d) => ["VALIDE", "REJETE", "SUSPENDU"].includes(d.statut)),
      };
    }

    return {
      draft: [],
      pending: [],
      correction: [],
      validation: [],
      all: [],
      archive: [],
    };
  }, [documents, filteredDocuments, role]);

  const selectedDocument = useMemo(
    () => documents.find((d) => d.id === selectedId) || null,
    [documents, selectedId]
  );

  const resetFilters = () => {
    setSearchQuery("");
    setFundingFilter("TOUS");
    setStatusFilter("TOUS");
  };

  const hasActiveFilters = searchQuery || fundingFilter !== "TOUS" || statusFilter !== "TOUS";
  const totalDocuments = role === "auditeur" ? filteredDocuments.length : documents.length;

  return (
    <div className="min-h-screen bg-slate-50">
      <TopHeader />
      <main className="mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-[2rem] font-bold tracking-tight text-slate-900">
                  Tableau de bord
                </h1>
                <p className="text-sm text-slate-500">
                  Gérez et suivez vos demandes d&apos;achat en temps réel
                </p>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[430px] lg:items-end">
            <div className="flex w-full items-center gap-3">
              <div className="relative flex-1">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un numéro, un objet..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-[13px] font-medium outline-none shadow-sm focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>
              {role === "initiateur" && (
                <button
                  onClick={() => router.push("/TdrSt/new")}
                  className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-slate-900 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4" /> Nouvel état
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter bar for auditeur */}
        <DashboardFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          fundingFilter={fundingFilter}
          setFundingFilter={setFundingFilter}
          fundingOptions={fundingOptions}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          statusOptions={statusOptions}
          onReset={resetFilters}
          isAuditeur={role === "auditeur"}
        />

        {/* Active filters indicator */}
        {hasActiveFilters && role === "auditeur" && (
          <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
            <span>Filtres actifs:</span>
            <button
              onClick={resetFilters}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              Réinitialiser
            </button>
          </div>
        )}

        {/* Status indicator for selected document */}
        {selectedDocument && (
          <div className="mb-6">
            <StatusStepper statut={selectedDocument.statut} />
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></div>
          </div>
        )}

        {/* Sections */}
        {!loading && (
          <div className="space-y-4">
            {/* INITIE - Brouillons (visible seulement pour initiateur) */}
            {role === "initiateur" && sections.draft.length > 0 && (
              <AccordionSection
                sectionKey="draft"
                title="Initie"
                documents={sections.draft}
                selectedId={selectedId}
                onSelectDocument={(id) => setSelectedId(id)}
                role={role ?? undefined}
              />
            )}

            {/* EN ATTENTE DE DECISION - Pour verificateur technique */}
            {(role === "verificateur_technique" || role === "initiateur") && sections.pending.length > 0 && (
              <AccordionSection
                sectionKey="pending"
                title="En attente de décision"
                documents={sections.pending}
                selectedId={selectedId}
                onSelectDocument={(id) => setSelectedId(id)}
                role={role}
              />
            )}

            {/* A REVOIR */}
            {sections.correction.length > 0 && (
              <AccordionSection
                sectionKey="correction"
                title="À revoir"
                documents={sections.correction}
                selectedId={selectedId}
                onSelectDocument={(id) => setSelectedId(id)}
                role={role ?? undefined}
              />
            )}

            {/* A VALIDER - Pour approbateur final */}
            {(role === "approbateur_final" || role === "initiateur" || role === "verificateur_technique") && sections.validation.length > 0 && (
              <AccordionSection
                sectionKey="validation"
                title="À valider"
                documents={sections.validation}
                selectedId={selectedId}
                onSelectDocument={(id) => setSelectedId(id)}
                role={role}
              />
            )}

            {/* TOUS LES ETATS ACTIFS */}
            {sections.all.length > 0 && (
              <AccordionSection
                sectionKey="all"
                title="Tous les états actifs"
                documents={sections.all}
                selectedId={selectedId}
                onSelectDocument={(id) => setSelectedId(id)}
                role={role ?? undefined}
              />
            )}

            {/* ARCHIVE */}
            {sections.archive.length > 0 && (
              <AccordionSection
                sectionKey="archive"
                title="Archive"
                documents={sections.archive}
                selectedId={selectedId}
                onSelectDocument={(id) => setSelectedId(id)}
                role={role ?? undefined}
              />
            )}

            {/* Empty state */}
            {totalDocuments === 0 && !loading && (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <Activity className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                <h2 className="mb-2 text-lg font-bold text-slate-900">
                  {role === "auditeur" ? "Aucun document archivé" : "Aucun document"}
                </h2>
                <p className="text-sm text-slate-500">
                  {role === "initiateur"
                    ? "Commencez par créer votre premier document."
                    : "Aucun document n'est encore disponible."}
                </p>
              </div>
            )}

            {/* Role indicator */}
            {role && totalDocuments > 0 && (
              <div className="mt-6 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {ROLE_LABEL[role]}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Toast notifications */}
      {(error || success) && (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className={`rounded-xl border px-4 py-3 shadow-lg ${
              error
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {error || success}
          </div>
        </div>
      )}
    </div>
  );
}
