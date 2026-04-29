"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity } from "lucide-react";
import { TdrStFilterBar, useTdrStFilters } from "./components/FinancementFilter";
import TopHeader from "@/app/components/TopHeader";
import { getToken } from "@/services/auth";
import { StatusStepper } from "./components/StatusStepper";
import { AccordionSection } from "./components/AccordionSection";
import DocumentDetailModal from "./components/DocumentDetailModal";
import { 
  useTdrStData, 
  type TdrStDocument, 
  type UserRole
} from "./hooks/useTdrStData";

const ROLE_LABEL: Record<UserRole, string> = {
  demandeur: "Demandeur (Cadre technique)",
  verificateur_technique: "Vérificateur technique (Chef de projet / Point focal)",
  approbateur_final: "Approbateur final (Coordonnateur UCP)",
  auditeur: "Auditeur (Consultation seule)",
};

export default function TdRStPage() {
  const router = useRouter();
  const {
    role,
    documents,
    loading,
    error,
    success,
    setNotification,
    refreshDocs,
    fetchJson,
    loadUserAndDocs,
  } = useTdrStData();

  // UI state
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [decisionObs, setDecisionObs] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Nouveaux filtres pour auditeur
  const { filteredDocuments: financeFilteredDocs, filterProps: tdrFilterProps } = useTdrStFilters({
    documents,
    getSourceFinancement: (doc) => doc.sources_financement,
    getLigneBudgetaire: (doc) => doc.ligne_budgetaire,
    getNumeroSubvention: (doc) => doc.numero_subvention,
  });

  // Load user and documents on mount
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    loadUserAndDocs();
  }, [loadUserAndDocs, router]);

  // Filtre par recherche textuelle
  const filteredBySearch = useMemo(() => {
    if (role !== "auditeur") return documents;
    
    const normalize = (value: unknown) =>
      String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    const query = normalize(searchQuery).trim();
    if (!query) return financeFilteredDocs;

    return financeFilteredDocs.filter((doc) => {
      const haystack = normalize([
        doc.numero_document,
        doc.intitule,
        doc.type_document,
        doc.unite_technique,
        doc.reference_ptba,
      ].join(" "));
      return haystack.includes(query);
    });
  }, [documents, role, financeFilteredDocs, searchQuery]);

  const finalDocuments = role === "auditeur" ? filteredBySearch : documents;

  // Group documents by section
  const sections = useMemo(() => {
    const docs = finalDocuments;

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

    // Pour demandeur
    if (role === "demandeur") {
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
  }, [finalDocuments, role]);

  const selectedDocument = useMemo(
    () => documents.find((d) => d.id === selectedId) || null,
    [documents, selectedId]
  );

  const resetSearch = () => {
    setSearchQuery("");
  };

  const hasActiveFilters = searchQuery !== "" || 
    tdrFilterProps.selectedFinancements.length > 0 || tdrFilterProps.selectedStatuses.length > 0;

  const totalDocuments = finalDocuments.length;

  const [selectedDetailDoc, setSelectedDetailDoc] = useState<TdrStDocument | null>(null);

  const getActionButtonLabel = (doc: TdrStDocument): string | null => {
    if (role === "demandeur" && (doc.statut === "BROUILLON" || doc.statut === "A_REVOIR")) {
      return "Modifier";
    }
    return null;
  };

  const handleActionClick = (doc: TdrStDocument) => {
    router.push(`/TdrSt/new?id=${doc.id}`);
  };

  const handleDetailClick = (doc: TdrStDocument) => {
    setSelectedDetailDoc(doc);
    setSelectedId(doc.id);
  };

  const handleCloseDetailModal = () => {
    setSelectedDetailDoc(null);
    setDecisionObs("");
  }

  const refreshAndKeepSelection = async (documentId: number) => {
    if (!role) return;
    const refreshedDocs = await refreshDocs(role);
    const nextDoc = refreshedDocs.find((doc) => doc.id === documentId) || null;
    setSelectedDetailDoc(nextDoc);
    setSelectedId(documentId);
  };

  const handleSubmitDocument = async () => {
    if (!selectedDetailDoc || role !== "demandeur") return;
    setActionLoading(true);
    try {
      const updated = await fetchJson<TdrStDocument>(`/api/TdrSt/documents/${selectedDetailDoc.id}/submit/`, {
        method: "POST",
      });
      await refreshAndKeepSelection(updated.id);
      setNotification("success", "Le TDR/ST a été soumis dans son circuit de validation.");
    } catch (e: unknown) {
      setNotification("error", e instanceof Error ? e.message : String(e));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecision = async (decision: "FAVORABLE" | "A_REVOIR" | "APPROUVE" | "REJETE") => {
    if (!selectedDetailDoc || !role) return;
    const url =
      role === "verificateur_technique"
        ? `/api/TdrSt/validations/tech/${selectedDetailDoc.id}/decision/`
        : `/api/TdrSt/validations/final/${selectedDetailDoc.id}/decision/`;

    setActionLoading(true);
    try {
      const updated = await fetchJson<TdrStDocument>(url, {
        method: "POST",
        body: JSON.stringify({ decision, observations: decisionObs }),
      });
      await refreshAndKeepSelection(updated.id);
      setDecisionObs("");
      setNotification("success", "La décision TDR/ST a été enregistrée.");
    } catch (e: unknown) {
      setNotification("error", e instanceof Error ? e.message : String(e));
    } finally {
      setActionLoading(false);
    }
  };

  const detailActionSlot =
    role === "demandeur" &&
    selectedDetailDoc &&
    (selectedDetailDoc.statut === "BROUILLON" || selectedDetailDoc.statut === "A_REVOIR") ? (
      <button
        type="button"
        onClick={() => router.push(`/TdrSt/new?id=${selectedDetailDoc.id}`)}
        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
      >
        Modifier
      </button>
    ) : null;

  const detailFooterSlot =
    selectedDetailDoc && role === "demandeur" && (selectedDetailDoc.statut === "BROUILLON" || selectedDetailDoc.statut === "A_REVOIR") ? (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Une fois soumis, le dossier partira dans les validations TDR/ST puis reviendra dans le circuit hiérarchique si la validation finale est favorable.
        </p>
        <button
          type="button"
          onClick={() => void handleSubmitDocument()}
          disabled={actionLoading}
          className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          Soumettre le TDR/ST
        </button>
      </div>
    ) : selectedDetailDoc && role === "verificateur_technique" && selectedDetailDoc.statut === "SOUMIS" ? (
      <div className="space-y-3">
        <textarea
          value={decisionObs}
          onChange={(e) => setDecisionObs(e.target.value)}
          rows={3}
          placeholder="Observations techniques éventuelles..."
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
        />
        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => void handleDecision("A_REVOIR")}
            disabled={actionLoading}
            className="rounded-full border border-amber-200 bg-amber-50 px-5 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60"
          >
            À revoir
          </button>
          <button
            type="button"
            onClick={() => void handleDecision("FAVORABLE")}
            disabled={actionLoading}
            className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            Favorable
          </button>
        </div>
      </div>
    ) : selectedDetailDoc && role === "approbateur_final" && selectedDetailDoc.statut === "EN_VALIDATION" ? (
      <div className="space-y-3">
        <textarea
          value={decisionObs}
          onChange={(e) => setDecisionObs(e.target.value)}
          rows={3}
          placeholder="Observations finales éventuelles..."
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
        />
        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => void handleDecision("REJETE")}
            disabled={actionLoading}
            className="rounded-full border border-rose-200 bg-rose-50 px-5 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
          >
            Rejeter
          </button>
          <button
            type="button"
            onClick={() => void handleDecision("APPROUVE")}
            disabled={actionLoading}
            className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            Approuver
          </button>
        </div>
      </div>
    ) : null;

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
                {searchQuery && (
                  <button
                    onClick={resetSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <TdrStFilterBar filterProps={tdrFilterProps} compact={false} />
        

        {/* Active filters indicator */}
        {hasActiveFilters && role === "auditeur" && (
          <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
            <span>Filtres actifs:</span>
            <button
              onClick={() => {
                resetSearch();
                tdrFilterProps.setSelectedFinancements([]);
                tdrFilterProps.setSelectedStatuses([]);
              }}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              Tout réinitialiser
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
            {/* INITIE - Brouillons (visible seulement pour demandeur) */}
            {role === "demandeur" && sections.draft.length > 0 && (
              <AccordionSection
                sectionKey="draft"
                title="Initie"
                documents={sections.draft}
                selectedId={selectedId}
                onSelectDocument={(id) => setSelectedId(id)}
                onDetailClick={handleDetailClick}
                onActionClick={handleActionClick}
                getActionButtonLabel={getActionButtonLabel}
                role={role ?? undefined}
                defaultOpen={false}
              />
            )}

            {/* EN ATTENTE DE DECISION - Pour verificateur technique */}
            {(role === "verificateur_technique" || role === "demandeur") && sections.pending.length > 0 && (
              <AccordionSection
                sectionKey="pending"
                title="En attente de décision"
                documents={sections.pending}
                selectedId={selectedId}
                onSelectDocument={(id) => setSelectedId(id)}
                onDetailClick={handleDetailClick}
                onActionClick={handleActionClick}
                getActionButtonLabel={getActionButtonLabel}
                role={role ?? undefined}
                defaultOpen={false}
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
                onDetailClick={handleDetailClick}
                onActionClick={handleActionClick}
                getActionButtonLabel={getActionButtonLabel}
                role={role ?? undefined}
                defaultOpen={false}
              />
            )}

            {/* A VALIDER - Pour approbateur final */}
            {(role === "approbateur_final" || role === "demandeur" || role === "verificateur_technique") && sections.validation.length > 0 && (
              <AccordionSection
                sectionKey="validation"
                title="À valider"
                documents={sections.validation}
                selectedId={selectedId}
                onSelectDocument={(id) => setSelectedId(id)}
                onDetailClick={handleDetailClick}
                onActionClick={handleActionClick}
                getActionButtonLabel={getActionButtonLabel}
                role={role ?? undefined}
                defaultOpen={false}
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
                onDetailClick={handleDetailClick}
                onActionClick={handleActionClick}
                getActionButtonLabel={getActionButtonLabel}
                role={role ?? undefined}
                defaultOpen={false}
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
                onDetailClick={handleDetailClick}
                onActionClick={handleActionClick}
                getActionButtonLabel={getActionButtonLabel}
                role={role ?? undefined}
                defaultOpen={false}
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
                  {role === "demandeur"
                    ? "Les TDR/ST se créent désormais depuis un dossier état de besoin."
                    : role === "auditeur"
                    ? "Aucun document ne correspond aux filtres sélectionnés."
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
      {/* Modale de détail */}
      <DocumentDetailModal
        document={selectedDetailDoc}
        open={!!selectedDetailDoc}
        onClose={handleCloseDetailModal}
        actionSlot={detailActionSlot}
        footerSlot={detailFooterSlot}
      />
    </div>
  );
}
