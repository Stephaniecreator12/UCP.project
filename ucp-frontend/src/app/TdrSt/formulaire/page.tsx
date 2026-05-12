"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity, ChevronDown, Clock3, FilePlus2, Loader2, Search, Upload, X } from "lucide-react";
import { TdrStFilterBar, useTdrStFilters } from "./components/FinancementFilter";
import TopHeader from "@/app/components/TopHeader";
import { getToken } from "@/services/auth";
import { StatusStepper } from "./components/StatusStepper";
import { AccordionSection } from "./components/AccordionSection";
import DocumentDetailModal from "./components/DocumentDetailModal";
import { SectionDocumentsList } from "./components/SectionDocumentsList";
import DemandeDetailModal from "@/app/demande-achat/components/DemandeDetailModal";
import { formatMoney, typeLabels } from "@/app/demande-achat/components/demandeAchatShared";
import { listDemandesAchat, type DemandeAchat } from "@/services/achats";
import { 
  useTdrStData, 
  type TdrDashboardScope,
  type TdrStDocument, 
  type UserRole
} from "./hooks/useTdrStData";

const ROLE_LABEL: Record<UserRole, string> = {
  demandeur: "Demandeur",
  initiateur: "Initiateur",
  verificateur_technique: "Vérificateur technique (Chargé de programme)",
  approbateur_final: "Approbateur final (Point focal)",
  auditeur: "Auditeur (Consultation seule)",
};

const formatPendingDate = (value?: string | null) => {
  if (!value) return "Date indisponible";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Date indisponible";
  return parsed.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const isRequesterRole = (role: UserRole | null) => role === "demandeur" || role === "initiateur";

const normalizeSearchValue = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export default function TdRStPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [uploadingPdfDocId, setUploadingPdfDocId] = useState<number | null>(null);
  const [pendingTdrDemandes, setPendingTdrDemandes] = useState<DemandeAchat[]>([]);
  const [pendingTdrLoading, setPendingTdrLoading] = useState(false);
  const [pendingDemandesOpen, setPendingDemandesOpen] = useState(false);
  const [selectedPendingDemande, setSelectedPendingDemande] = useState<DemandeAchat | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const canAccessGlobalDashboard = true;
  const rawScope = (searchParams.get("scope") ?? "").trim().toLowerCase();
  const dashboardScope: TdrDashboardScope = rawScope === "all" ? "all" : "mine";
  const searchParamsString = searchParams.toString();
  const mineScopeHref = useMemo(() => {
    const params = new URLSearchParams(searchParamsString);
    params.delete("scope");
    const queryString = params.toString();
    return queryString ? `/TdrSt/formulaire?${queryString}` : "/TdrSt/formulaire";
  }, [searchParamsString]);
  const allScopeHref = useMemo(() => {
    const params = new URLSearchParams(searchParamsString);
    params.set("scope", "all");
    const queryString = params.toString();
    return `/TdrSt/formulaire?${queryString}`;
  }, [searchParamsString]);
  const focusDocumentId = useMemo(() => {
    const raw = searchParams.get("focus");
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, [searchParams]);

  // Nouveaux filtres pour auditeur
  const { filteredDocuments: financeFilteredDocs, filterProps: tdrFilterProps } = useTdrStFilters({
    documents,
    getSourceFinancement: (doc) => doc.sources_financement,
    getLigneBudgetaire: (doc) => doc.ligne_budgetaire,
    getNumeroSubvention: (doc) => doc.numero_subvention,
    getDocumentType: (doc) => doc.type_document,
  });

  const loadPendingTdrDemandes = useCallback(
    async (currentRole: UserRole | null) => {
      if (!isRequesterRole(currentRole)) {
        setPendingTdrDemandes([]);
        return [];
      }

      setPendingTdrLoading(true);
      try {
        const demandes = await listDemandesAchat(dashboardScope);
        const pending = demandes.filter(
          (demande) =>
            Boolean(demande.requires_tdr) &&
            !demande.tdr_document_id &&
            ["BROUILLON", "A_COMPLETER"].includes(demande.statut),
        );
        setPendingTdrDemandes(pending);
        return pending;
      } catch (e: unknown) {
        setNotification(
          "error",
          e instanceof Error
            ? e.message
            : "Impossible de charger les états de besoins en attente de TDR/ST.",
        );
        return [];
      } finally {
        setPendingTdrLoading(false);
      }
    },
    [dashboardScope, setNotification],
  );

  // Load user and documents on mount
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    const initializePage = async () => {
      const loaded = await loadUserAndDocs(dashboardScope);
      await loadPendingTdrDemandes(loaded?.role ?? null);
    };

    void initializePage();
  }, [dashboardScope, loadPendingTdrDemandes, loadUserAndDocs, router]);

  const baseDocuments = role === "auditeur" ? financeFilteredDocs : documents;
  const finalDocuments = useMemo(() => {
    const query = normalizeSearchValue(searchQuery).trim();
    if (!query) return baseDocuments;

    return baseDocuments.filter((doc) => {
      const haystack = normalizeSearchValue([
        doc.numero_document,
        doc.intitule,
        doc.type_document,
        doc.unite_technique,
        doc.reference_ptba,
        doc.demande_achat_numero,
      ].join(" "));
      return haystack.includes(query);
    });
  }, [baseDocuments, searchQuery]);

  const filteredPendingDemandes = useMemo(() => {
    const query = normalizeSearchValue(searchQuery).trim();
    if (!query) return pendingTdrDemandes;

    return pendingTdrDemandes.filter((demande) =>
      normalizeSearchValue([
        demande.numero_demande,
        demande.objet,
        demande.type_demande,
        demande.unite_technique,
      ].join(" ")).includes(query),
    );
  }, [pendingTdrDemandes, searchQuery]);

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
    if (isRequesterRole(role)) {
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
    tdrFilterProps.selectedFinancements.length > 0 ||
    tdrFilterProps.selectedStatuses.length > 0 ||
    tdrFilterProps.selectedDocumentTypes.length > 0;

  const totalDocuments =
    finalDocuments.length + (isRequesterRole(role) ? filteredPendingDemandes.length : 0);

  const [selectedDetailDoc, setSelectedDetailDoc] = useState<TdrStDocument | null>(null);

  useEffect(() => {
    if (!focusDocumentId || documents.length === 0) return;

    const focusedDoc = documents.find((doc) => doc.id === focusDocumentId);
    if (!focusedDoc) return;

    setSelectedId(focusedDoc.id);
    setSelectedDetailDoc(focusedDoc);
    router.replace("/TdrSt/formulaire");
  }, [documents, focusDocumentId, router]);

  const getActionButtonLabel = (doc: TdrStDocument): string | null => {
    if (isRequesterRole(role) && doc.statut === "BROUILLON") {
      return "Continuer";
    }
    if (isRequesterRole(role) && doc.statut === "A_REVOIR") {
      return "Corriger";
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
    setDeleteConfirmOpen(false);
  };

  const refreshAndKeepSelection = async (documentId: number) => {
    if (!role) return;
    const refreshedDocs = await refreshDocs(role, dashboardScope);
    const nextDoc = refreshedDocs.find((doc) => doc.id === documentId) || null;
    setSelectedDetailDoc(nextDoc);
    setSelectedId(documentId);
    if (isRequesterRole(role)) {
      await loadPendingTdrDemandes(role);
    }
  };

  const handleCreatePendingTdr = (demande: DemandeAchat) => {
    router.push(`/TdrSt/new?demandeId=${demande.id}&source=demande-achat`);
  };

  const uploadPdfForDocument = async (documentId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetchJson<{ document: TdrStDocument }>(`/api/TdrSt/documents/${documentId}/upload/`, {
      method: "POST",
      body: formData,
    });

    return response.document;
  };

  const handleUploadPdf = async (doc: TdrStDocument, file: File) => {
    if (!isRequesterRole(role)) return;

    setUploadingPdfDocId(doc.id);
    try {
      const updatedDoc = await uploadPdfForDocument(doc.id, file);
      await refreshAndKeepSelection(updatedDoc.id);
      setNotification("success", "Le PDF a ete televerse avec succes.");
    } catch (e: unknown) {
      setNotification("error", e instanceof Error ? e.message : String(e));
    } finally {
      setUploadingPdfDocId(null);
    }
  };

  const handleSubmitDocument = async () => {
    if (!selectedDetailDoc || !isRequesterRole(role)) return;
    if (!selectedDetailDoc.fichier_courant?.fichier_pdf) {
      setNotification("error", "Televerse un PDF avant d'envoyer le document en validation.");
      return;
    }
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

  const handleRequestDeleteDocument = () => {
    if (!selectedDetailDoc || !isRequesterRole(role)) return;
    if (selectedDetailDoc.statut !== "BROUILLON") {
      setNotification("error", "Seuls les brouillons peuvent être supprimés.");
      return;
    }
    setDeleteConfirmOpen(true);
  };

  const handleDeleteDocument = async () => {
    if (!selectedDetailDoc || !isRequesterRole(role)) return;
    if (selectedDetailDoc.statut !== "BROUILLON") {
      setNotification("error", "Seuls les brouillons peuvent être supprimés.");
      return;
    }

    setActionLoading(true);
    try {
      await fetchJson(`/api/TdrSt/documents/${selectedDetailDoc.id}/delete/`, {
        method: "DELETE",
      });
      setDeleteConfirmOpen(false);
      setNotification("success", "Brouillon supprimé.");
      handleCloseDetailModal();
      // Rafraîchir la liste des documents
      if (role) {
        await refreshDocs(role, dashboardScope);
        if (isRequesterRole(role)) {
          await loadPendingTdrDemandes(role);
        }
      }
    } catch (e: unknown) {
      setNotification("error", e instanceof Error ? e.message : "Erreur lors de la suppression.");
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
    isRequesterRole(role) &&
    selectedDetailDoc &&
    (selectedDetailDoc.statut === "BROUILLON" || selectedDetailDoc.statut === "A_REVOIR") ? (
      <button
        type="button"
        onClick={() => router.push(`/TdrSt/new?id=${selectedDetailDoc.id}`)}
        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
      >
        {selectedDetailDoc.statut === "A_REVOIR" ? "Corriger" : "Continuer"}
      </button>
    ) : null;
  const isDecisionCommentEmpty = decisionObs.trim().length === 0;

  const detailFooterSlot =
    selectedDetailDoc && isRequesterRole(role) && (selectedDetailDoc.statut === "BROUILLON" || selectedDetailDoc.statut === "A_REVOIR") ? (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">Le document sera transmis au circuit de validation TDR/ST.</p>
          {selectedDetailDoc.statut === "BROUILLON" ? (
            <button
              type="button"
              onClick={handleRequestDeleteDocument}
              disabled={actionLoading}
              className="rounded-full border border-rose-200 bg-rose-50 px-5 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
            >
              Supprimer
            </button>
          ) : null}
        </div>
      </div>
    ) : selectedDetailDoc && role === "verificateur_technique" && selectedDetailDoc.statut === "SOUMIS" ? (
      <div className="space-y-3">
        <textarea
          value={decisionObs}
          onChange={(e) => setDecisionObs(e.target.value)}
          rows={3}
          placeholder="Commentaire technique obligatoire..."
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
        />
        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => void handleDecision("A_REVOIR")}
            disabled={actionLoading || isDecisionCommentEmpty}
            className="rounded-full border border-amber-200 bg-amber-50 px-5 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60"
          >
            À revoir
          </button>
          <button
            type="button"
            onClick={() => void handleDecision("FAVORABLE")}
            disabled={actionLoading || isDecisionCommentEmpty}
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
          placeholder="Commentaire final obligatoire..."
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
        />
        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => void handleDecision("REJETE")}
            disabled={actionLoading || isDecisionCommentEmpty}
            className="rounded-full border border-rose-200 bg-rose-50 px-5 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
          >
            Rejeter
          </button>
          <button
            type="button"
            onClick={() => void handleDecision("APPROUVE")}
            disabled={actionLoading || isDecisionCommentEmpty}
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
      <main className="mx-auto max-w-[1560px] px-4 py-6 sm:px-6 lg:px-10">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-[2rem] font-bold tracking-tight text-slate-900">
                  Suivi TDR/ST
                </h1>
                <p className="text-sm text-slate-500">
                  Brouillons, validations et archives des documents liés aux états de besoins.
                </p>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[430px] lg:items-end">
            <div className="flex w-full items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            {canAccessGlobalDashboard && role !== "auditeur" && (
              <div className="flex w-full flex-wrap justify-end gap-2">
                <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => router.replace(mineScopeHref)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                      dashboardScope === "mine"
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    Mes dossiers
                  </button>
                  <button
                    type="button"
                    onClick={() => router.replace(allScopeHref)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                      dashboardScope === "all"
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    Tous les dossiers
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/TdrSt/dashboard")}
                  className="inline-flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                >
                  Voir dashboard
                </button>
              </div>
            )}
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
                tdrFilterProps.setSelectedDocumentTypes([]);
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
            {role === "auditeur" && (
              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">Tous les dossiers</h2>
                      <p className="text-sm text-slate-500">Vue globale des documents TDR/ST sous forme de tableau.</p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      {finalDocuments.length}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50 px-4 py-4">
                  <SectionDocumentsList
                    documents={finalDocuments}
                    selectedId={selectedId}
                    onSelectDocument={(id) => setSelectedId(id)}
                    onDetailClick={handleDetailClick}
                    role={role ?? undefined}
                  />
                </div>
              </section>
            )}

            {isRequesterRole(role) && (
              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => {
                    if (!pendingTdrLoading && filteredPendingDemandes.length > 0) {
                      setPendingDemandesOpen((prev) => !prev);
                    }
                  }}
                  disabled={pendingTdrLoading || filteredPendingDemandes.length === 0}
                  className={`flex w-full items-center justify-between px-5 py-4 text-left transition-colors ${
                    pendingTdrLoading || filteredPendingDemandes.length === 0
                      ? "cursor-not-allowed bg-slate-50 opacity-70"
                      : pendingDemandesOpen
                        ? "border-b border-slate-200 bg-slate-50"
                        : "bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 text-violet-700">
                      <Clock3 className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">
                        États de besoins à documenter
                      </h2>
                      <p className="text-sm text-slate-500">Dossiers en attente de document TDR/ST.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-full border border-violet-200 bg-violet-500 px-3 py-1 text-xs font-semibold text-white">
                      {filteredPendingDemandes.length}
                    </span>
                    {!pendingTdrLoading && filteredPendingDemandes.length > 0 && (
                      <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        <span className={pendingDemandesOpen ? "text-slate-700" : ""}>
                          {pendingDemandesOpen ? "Masquer" : "Afficher"}
                        </span>
                        <div
                          className={`rounded-lg bg-slate-100 p-1 text-slate-400 transition-transform ${
                            pendingDemandesOpen ? "rotate-180" : ""
                          }`}
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    )}
                  </div>
                </button>

                {(pendingTdrLoading || pendingDemandesOpen || filteredPendingDemandes.length === 0) && (
                  <div className="bg-slate-50 px-4 py-4">
                    {pendingTdrLoading ? (
                      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">
                        Chargement des dossiers à documenter...
                      </div>
                    ) : filteredPendingDemandes.length > 0 ? (
                      <div className="space-y-3">
                        {filteredPendingDemandes.map((demande) => (
                          <div
                            key={demande.id}
                            className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between"
                          >
                            <div className="min-w-0 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                                  {demande.numero_demande}
                                </span>
                                <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                                  Document à préparer
                                </span>
                              </div>
                              <h3 className="text-sm font-semibold text-slate-900">
                                {demande.objet}
                              </h3>
                              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                                  {typeLabels[demande.type_demande] ?? demande.type_demande}
                                </span>
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                                  {formatMoney(demande.cout_total_estime)}
                                </span>
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                                  Mis à jour le {formatPendingDate(demande.updated_at ?? demande.created_at)}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 md:justify-end">
                              <button
                                type="button"
                                onClick={() => setSelectedPendingDemande(demande)}
                                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                              >
                                Détail dossier
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCreatePendingTdr(demande)}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
                              >
                                <FilePlus2 className="h-4 w-4" />
                                Créer le document
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">
                        Aucun dossier en attente de document TDR/ST.
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* BROUILLONS - visible seulement pour demandeur */}
            {isRequesterRole(role) && sections.draft.length > 0 && (
              <AccordionSection
                sectionKey="draft"
                title="Brouillons TDR/ST"
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
            {(role === "verificateur_technique" || isRequesterRole(role)) && sections.pending.length > 0 && (
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
            {(role === "approbateur_final" || isRequesterRole(role) || role === "verificateur_technique") && sections.validation.length > 0 && (
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
            {role !== "auditeur" && sections.archive.length > 0 && (
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
                  {isRequesterRole(role)
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
          <div className="fixed bottom-[20px] right-6 z-[100] min-w-[220px] max-w-[340px] rounded-[10px] border px-[0.8rem] py-[0.65rem] font-semibold shadow-lg transition-opacity duration-200 animate-saveMessageSlide">
            <div
              className={`${
                error
                  ? "bg-[#fde9e9] border-[#f6c8c8] text-[#8d2525]"
                  : "bg-[#e6f8ef] border-[#bce9cd] text-[#0c6f3d]"
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
      <DemandeDetailModal
        demande={selectedPendingDemande}
        open={!!selectedPendingDemande}
        onClose={() => setSelectedPendingDemande(null)}
      />
      {deleteConfirmOpen && selectedDetailDoc?.statut === "BROUILLON" ? (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-draft-modal-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !actionLoading) {
              setDeleteConfirmOpen(false);
            }
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
              <h2 id="delete-draft-modal-title" className="text-lg font-bold text-slate-900">
                Supprimer ce brouillon ?
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Le document <span className="font-semibold text-slate-700">{selectedDetailDoc.numero_document || `#${selectedDetailDoc.id}`}</span> sera supprimé définitivement.
              </p>
            </div>
            <div className="px-6 py-5">
              <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Cette action est irreversible et retire le brouillon de la liste.
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={actionLoading}
                className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteDocument()}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
