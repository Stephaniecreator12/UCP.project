"use client";

<<<<<<< HEAD
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TopHeader from "@/app/components/TopHeader";
import DashboardIndividual, { type AuditeurOverview } from "@/app/TdrSt/dashboard/components/dashboard-individual";

import { getToken } from "@/services/auth";

type DocumentType = "TDR" | "ST";
type Statut =
  | "BROUILLON"
  | "SOUMIS"
  | "EN_VALIDATION"
  | "A_REVOIR"
  | "EN_ATTENTE_ANO"
  | "VALIDE"
  | "REJETE"
  | "SUSPENDU";

type UserRole =
  | "initiateur"
  | "verificateur_technique"
  | "approbateur_final"
  | "bailleur"
  | "auditeur";

type Procedure = "DC" | "AOI" | "AON" | "GRE_A_GRE";
type DureeUnite = "JOURS" | "MOIS";

type CategorieActivite =
  | "FORMATION"
  | "ATELIER"
  | "REUNION"
  | "REVUE"
  | "SUPERVISION"
  | "ETUDE"
  | "CONSULTANT"
  | "CABINET"
  | "BUREAU_ETUDES"
  | "ENTREPRISE"
  | "BIENS"
  | "INFRASTRUCTURE";

type FundingSource = "Fonds mondial" | "Banque mondiale" | "Alliance GAVI";

type ValidationAction = {
  id: number;
  etape: string;
  decision: string;
  observations: string;
  acteur: number;
  acteur_username: string;
  horodatage: string;
  meta: Record<string, unknown>;
};

type DocumentVersion = {
  id: number;
  version: number;
  fichier_pdf: string;
  fichier_nom_original: string;
  fichier_taille_octets?: number;
  empreinte_sha256?: string;
  uploaded_by?: number;
  uploaded_at?: string;
  snapshot_data?: {
    unite_technique?: string;
    type_document?: DocumentType;
    categorie_activite?: CategorieActivite;
    intitule?: string;
    reference_ptba?: string;
    periode_debut?: string;
    periode_fin?: string;
    duree_estimee_valeur?: number;
    duree_estimee_unite?: DureeUnite;
    sources_financement?: string;
    numero_subvention?: string;
    ligne_budgetaire?: string;
    montant_estime_usd?: string;
    procedure_envisagee?: Procedure;
    statut?: Statut;
  };
};

type TdrStDocument = {
  id: number;
  numero_document: string;
  version: number;
  created_at: string;
  updated_at: string;
  unite_technique: string;
  statut: Statut;
  type_document: DocumentType;
  categorie_activite: CategorieActivite;
  intitule: string;
  reference_ptba: string;
  periode_debut: string;
  periode_fin: string;
  duree_estimee_valeur: number;
  duree_estimee_unite: DureeUnite;
  sources_financement: string;
  numero_subvention: string;
  ligne_budgetaire: string;
  montant_estime_usd: string;
  procedure_envisagee: Procedure;
  requires_ano?: boolean;
  actions_validation?: ValidationAction[];
  fichier_courant?: {
    fichier_pdf?: string;
    empreinte_sha256?: string;
    uploaded_by?: number;
  };
  versions_fichier?: DocumentVersion[];
};

type DocumentRow = {
  doc: TdrStDocument;
  versionNumber: number;
  uploadedAt?: string;
  snapshot?: DocumentVersion["snapshot_data"] | null;
};

type TdrStFormState = {
  unite_technique: string;
  type_document: DocumentType;
  categorie_activite: CategorieActivite;
  intitule: string;
  reference_ptba: string;
  periode_debut: string;
  periode_fin: string;
  duree_estimee_valeur: number;
  duree_estimee_unite: DureeUnite;
  sources_financement: string;
  numero_subvention: string;
  ligne_budgetaire: string;
  montant_estime_usd: string;
  procedure_envisagee: Procedure;
};

const API_PREFIX = "/api/TdrSt";
const BACKEND_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

const NOTIFICATION_AUTOHIDE_MS = 3000;

const ROLE_LABEL: Record<UserRole, string> = {
  initiateur: "Initiateur (Cadre technique)",
  verificateur_technique: "Vérificateur technique (Chef de projet / Point focal)",
  approbateur_final: "Approbateur final (Coordonnateur UCP)",
  bailleur: "Bailleur (ANO)",
  auditeur: "Auditeur (Consultation seule)",
};

const toErrorMessage = async (res: Response): Promise<string> => {
  const text = await res.text().catch(() => "");
  if (!text.trim()) return `Erreur API (HTTP ${res.status})`;
  try {
    const data = JSON.parse(text) as unknown;
    if (data && typeof data === "object") {
      const maybe = (data as { detail?: unknown; error?: unknown }).detail ?? (data as { error?: unknown }).error;
      if (typeof maybe === "string" && maybe.trim()) return maybe;
    }
  } catch {
    // ignore
  }
  return text.slice(0, 300);
};

const resolveBackendUrl = (raw?: string): string | null => {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/")) return `${BACKEND_BASE}${trimmed}`;
  return `${BACKEND_BASE}/${trimmed}`;
};

async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(path, { ...init, headers });
  if (!res.ok) throw new Error(await toErrorMessage(res));
  return (await res.json()) as T;
}

const STATUT_LABEL: Record<Statut, string> = {
  BROUILLON: "Brouillon",
  SOUMIS: "Soumis",
  EN_VALIDATION: "En validation",
  A_REVOIR: "À revoir",
  EN_ATTENTE_ANO: "En attente ANO",
  VALIDE: "Validé",
  REJETE: "Rejeté",
  SUSPENDU: "Suspendu",
};

const getStepIndex = (statut?: Statut): number => {
  if (!statut) return 0;
  if (statut === "BROUILLON") return 0;
  if (statut === "A_REVOIR") return 0;
  if (statut === "SOUMIS") return 1;
  if (statut === "EN_VALIDATION") return 2;
  if (statut === "EN_ATTENTE_ANO") return 3;
  return 3;
};

const makeEmptyForm = (): TdrStFormState => ({
  unite_technique: "",
  type_document: "TDR",
  categorie_activite: "FORMATION",
  intitule: "",
  reference_ptba: "",
  periode_debut: "",
  periode_fin: "",
  duree_estimee_valeur: 1,
  duree_estimee_unite: "MOIS",
  sources_financement: "",
  numero_subvention: "",
  ligne_budgetaire: "",
  montant_estime_usd: "",
  procedure_envisagee: "DC",
});

const getProgress = (
  statut?: Statut,
): { pct: number; tone: "slate" | "amber" | "emerald" | "rose" | "orange" } => {
  if (!statut || statut === "BROUILLON") return { pct: 18, tone: "slate" };
  if (statut === "A_REVOIR") return { pct: 22, tone: "orange" };
  if (statut === "SOUMIS") return { pct: 45, tone: "amber" };
  if (statut === "EN_VALIDATION") return { pct: 72, tone: "amber" };
  if (statut === "EN_ATTENTE_ANO") return { pct: 88, tone: "amber" };
  if (statut === "VALIDE") return { pct: 100, tone: "emerald" };
  if (statut === "REJETE") return { pct: 100, tone: "rose" };
  if (statut === "SUSPENDU") return { pct: 100, tone: "slate" };
  return { pct: 100, tone: "orange" };
};

const STATUS_BADGE_CLASSES: Record<Statut, string> = {
  BROUILLON: "bg-slate-50 text-slate-700 border border-slate-200",
  SOUMIS: "bg-amber-50 text-amber-700 border border-amber-200",
  EN_VALIDATION: "bg-amber-50 text-amber-700 border border-amber-200",
  A_REVOIR: "bg-rose-50 text-rose-700 border border-rose-200",
  EN_ATTENTE_ANO: "bg-amber-50 text-amber-700 border border-amber-200",
  VALIDE: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  REJETE: "bg-rose-50 text-rose-700 border border-rose-200",
  SUSPENDU: "bg-slate-50 text-slate-700 border border-slate-200",
};

const formatDateForRow = (value?: string): string => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatAmountForRow = (value?: string): string => {
  if (!value) return "—";
  const normalized = String(value).replace(",", ".").replace(/[^0-9.-]/g, "");
  const num = Number(normalized);
  if (!Number.isFinite(num)) return value;
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

function StatusStepper({ statut }: { statut?: Statut }) {
  const { pct, tone } = getProgress(statut);
  const idx = getStepIndex(statut);
  const steps = ["Brouillon", "Soumis", "En validation", "Décision finale"];

  const toneClasses: Record<typeof tone, { bar: string; badge: string; dot: string }> = {
    slate: {
      bar: "bg-slate-500",
      badge: "border-slate-200 bg-slate-50 text-slate-700",
      dot: "bg-slate-600",
    },
    amber: {
      bar: "bg-amber-500",
      badge: "border-amber-200 bg-amber-50 text-amber-800",
      dot: "bg-amber-600",
    },
    emerald: {
      bar: "bg-emerald-600",
      badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
      dot: "bg-emerald-600",
    },
    rose: {
      bar: "bg-rose-600",
      badge: "border-rose-200 bg-rose-50 text-rose-800",
      dot: "bg-rose-600",
    },
    orange: {
      bar: "bg-orange-500",
      badge: "border-orange-200 bg-orange-50 text-orange-800",
      dot: "bg-orange-600",
    },
  };

  const badgeText = statut ? STATUT_LABEL[statut] : "—";
  const c = toneClasses[tone];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="rounded-2xl border-t-4 border-t-emerald-600 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Statut du document
            </p>
            <p className="text-sm text-slate-700">
              {statut
                ? "Progression basée sur l'état actuel."
                : "Sélectionne un document pour voir sa progression."}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${c.badge}`}
          >
            <span className={`h-2 w-2 rounded-full ${c.dot}`} aria-hidden="true" />
            {badgeText}
          </span>
        </div>

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full" style={{ width: `${pct}%` }}>
            <div key={`${statut ?? "none"}:${pct}`} className={`h-full ${c.bar} progress-grow`} />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2 text-[11px] font-semibold text-slate-500">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${i <= idx ? c.dot : "bg-slate-200"}`}
                aria-hidden="true"
              />
              <span className={i === idx ? "text-slate-900" : ""}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
=======
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity, ChevronDown, Clock3, FilePlus2 } from "lucide-react";
import { TdrStFilterBar, useTdrStFilters } from "./components/FinancementFilter";
import TopHeader from "@/app/components/TopHeader";
import { getToken } from "@/services/auth";
import { StatusStepper } from "./components/StatusStepper";
import { AccordionSection } from "./components/AccordionSection";
import DocumentDetailModal from "./components/DocumentDetailModal";
import DemandeDetailModal from "@/app/demande-achat/components/DemandeDetailModal";
import { formatMoney, typeLabels } from "@/app/demande-achat/components/demandeAchatShared";
import { listDemandesAchat, type DemandeAchat } from "@/services/achats";
import { 
  useTdrStData, 
  type TdrStDocument, 
  type UserRole
} from "./hooks/useTdrStData";

const ROLE_LABEL: Record<UserRole, string> = {
  demandeur: "Initiateur",
  verificateur_technique: "Point focal / Chargé de programme",
  approbateur_final: "Gestionnaire / Point focal",
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

function TdRStPageFallback() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <TopHeader />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-16 rounded-2xl bg-white shadow-sm" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl border border-slate-200 bg-white shadow-sm" />
          ))}
        </div>
      </div>
    </main>
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
  );
}

export default function TdRStPage() {
<<<<<<< HEAD
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>("");
  const router = useRouter();

  const [documents, setDocuments] = useState<TdrStDocument[]>([]);
  const [auditeurStatutFilter, setAuditeurStatutFilter] = useState<Statut | "TOUS">("TOUS");
  const [auditeurFundingFilter, setAuditeurFundingFilter] = useState<FundingSource | "TOUS">("TOUS");
  const [auditeurActorFilter, setAuditeurActorFilter] = useState<string>("TOUS");
  const [auditeurSearch, setAuditeurSearch] = useState<string>("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [focusedDoc, setFocusedDoc] = useState<TdrStDocument | null>(null);
  const [decisionObs, setDecisionObs] = useState("");
  const [hasTakenDecision, setHasTakenDecision] = useState(false);
  const [displayedVersion, setDisplayedVersion] = useState<number | null>(null);
  const [historicalSnapshot, setHistoricalSnapshot] = useState<any>(null);

  const selected = useMemo(
    () => (selectedId ? documents.find((d) => d.id === selectedId) || null : null),
    [documents, selectedId],
  );
  const activeDoc = useMemo(() => focusedDoc ?? selected, [focusedDoc, selected]);
  const isClosedDoc =
    !!activeDoc && (activeDoc.statut === "VALIDE" || activeDoc.statut === "REJETE" || activeDoc.statut === "SUSPENDU");

  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const latestPdfVersionNumber = activeDoc
    ? Math.max(
        activeDoc.version || 1,
        ...(activeDoc.versions_fichier ?? []).map((v) => v.version ?? 1),
      )
    : 1;

  const formatPdfVersionLabel = (version: number | null | undefined) => {
    const safeVersion = version ?? 1;
    if (safeVersion >= latestPdfVersionNumber) return "Version finale";
    return `Version ${latestPdfVersionNumber - safeVersion}`;
  };

  // Vérifie si un PDF est présent pour l'initiateur
  const hasPdfFile = useMemo(() => {
    if (role !== "initiateur") return true;
    if (!activeDoc) return false;
    if (activeDoc.statut === "A_REVOIR") {
    // Un nouveau PDF doit être sélectionné
    return !!pdfFile;
  }
    return !!(pdfFile || activeDoc.fichier_courant?.fichier_pdf);
  }, [role, activeDoc, pdfFile]);

  // Réinitialise hasTakenDecision quand le document change
  useEffect(() => {
    if (activeDoc && role !== "initiateur" && role !== "auditeur") {
      const userHasDecision = activeDoc.actions_validation?.some(action => 
        action.acteur_username === currentUsername &&
        (action.decision === "FAVORABLE" || action.decision === "A_REVOIR" ||
         action.decision === "APPROUVE" || action.decision === "REJETE" ||
         action.decision === "ANO_ACCORDE" || action.decision === "ANO_REFUSE")
      );
      setHasTakenDecision(!!userHasDecision);
    } else {
      setHasTakenDecision(false);
    }
  }, [activeDoc, role, currentUsername]);

  const auditeurActorOptions = useMemo(() => {
    if (role !== "auditeur") return [];
    const set = new Set<string>();
    documents.forEach((doc) => {
      doc.actions_validation?.forEach((a) => {
        if (a.acteur_username) set.add(a.acteur_username);
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [documents, role]);

  const auditeurFundingOptions = useMemo(() => {
    if (role !== "auditeur") return [];
    const set = new Set<FundingSource>();
    documents.forEach((doc) => {
      // sources_financement peut être une string ou un tableau
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
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [documents, role]);

  const docsForAuditeur = useMemo(() => {
    if (role !== "auditeur") return documents;

    const normalizeSearchValue = (value: unknown) =>
      String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    const query = normalizeSearchValue(auditeurSearch).trim();
    const hasQuery = query.length > 0;

    return documents.filter((doc) => {
      if (auditeurStatutFilter !== "TOUS" && doc.statut !== auditeurStatutFilter) return false;
      if (auditeurFundingFilter !== "TOUS") {
        let sources: string[] = [];
        if (typeof doc.sources_financement === "string") {
          sources = [doc.sources_financement];
        } else if (Array.isArray(doc.sources_financement)) {
          sources = doc.sources_financement as string[];
        }
        if (!sources.includes(auditeurFundingFilter)) return false;
      }
      if (
        auditeurActorFilter !== "TOUS" &&
        !(doc.actions_validation ?? []).some((a) => a.acteur_username === auditeurActorFilter)
      ) {
        return false;
      }

      if (!hasQuery) return true;

      const acteurUsernames = (doc.actions_validation ?? [])
        .map((a) => a.acteur_username)
        .filter(Boolean)
        .join(" ");

      const haystack = normalizeSearchValue(
        [
          doc.numero_document,
          doc.intitule,
          doc.type_document,
          doc.statut,
          doc.unite_technique,
          doc.reference_ptba,
          doc.numero_subvention,
          doc.ligne_budgetaire,
          acteurUsernames,
        ].join(" "),
      );

      return haystack.includes(query);
    });
  }, [auditeurActorFilter, auditeurFundingFilter, auditeurSearch, auditeurStatutFilter, documents, role]);

  useEffect(() => {
    if (role !== "auditeur") return;
    if (!selectedId) {
      setSelectedId(docsForAuditeur[0]?.id ?? null);
      return;
    }
    if (!docsForAuditeur.some((d) => d.id === selectedId)) {
      setSelectedId(docsForAuditeur[0]?.id ?? null);
    }
  }, [docsForAuditeur, role, selectedId]);

const documentRows = useMemo<DocumentRow[]>(() => {
  const allRows: DocumentRow[] = [];
  
  // Pour tous les rôles, on veut afficher toutes les versions
  // mais avec un comportement différent selon le rôle
  const docsToProcess = role === "auditeur" ? docsForAuditeur : documents;
  
  docsToProcess.forEach((doc) => {
    // Ajouter la version courante
    allRows.push({
      doc,
      versionNumber: doc.version ?? 1,
      uploadedAt: doc.updated_at ?? doc.created_at,
      snapshot: undefined,
    });
    
    // Pour initiateur et auditeur, ajouter toutes les versions historiques
    if ((role === "initiateur" || role === "auditeur") && doc.versions_fichier && doc.versions_fichier.length > 0) {
      doc.versions_fichier.forEach((version) => {
        // Éviter la duplication si la version courante est déjà dans la liste
        if (version.version !== doc.version) {
          allRows.push({
            doc,
            versionNumber: version.version,
            uploadedAt: version.uploaded_at,
            snapshot: version.snapshot_data,
          });
        }
      });
    }
  });
  
  // Trier par date de création (plus récent d'abord)
  return allRows.sort((a, b) => {
    const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
    const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
    return dateB - dateA;
  });
}, [documents, docsForAuditeur, role]);

  const auditeurOverview = useMemo<AuditeurOverview | null>(() => {
    if (role !== "auditeur") return null;

    const total = documents.length;
    const rejected = documents.filter((d) => d.statut === "REJETE").length;
    const rejectedRate = total > 0 ? rejected / total : 0;
    const requiresAno = documents.filter((d) => !!d.requires_ano).length;
    const withAnoAction = documents.filter((d) => (d.actions_validation ?? []).some((a) => a.etape === "ANO")).length;

    const delaysDays: number[] = [];
    documents.forEach((doc) => {
      const actions = doc.actions_validation ?? [];
      const depotTimes = actions
        .filter((a) => a.etape === "DEPOT")
        .map((a) => Date.parse(a.horodatage))
        .filter((t) => Number.isFinite(t));
      const approvalTimes = actions
        .filter((a) => a.etape === "APPROBATION_FINALE")
        .map((a) => Date.parse(a.horodatage))
        .filter((t) => Number.isFinite(t));
      if (!depotTimes.length || !approvalTimes.length) return;
      const depot = Math.min(...depotTimes);
      const approval = Math.max(...approvalTimes);
      const days = (approval - depot) / (1000 * 60 * 60 * 24);
      if (Number.isFinite(days) && days >= 0) delaysDays.push(days);
    });
    const avgDelayDays = delaysDays.length
      ? delaysDays.reduce((sum, v) => sum + v, 0) / delaysDays.length
      : null;

    const unitStats = new Map<string, { total: number; rejected: number }>();
    documents.forEach((doc) => {
      const unit = String(doc.unite_technique ?? "").trim();
      if (!unit) return;
      const entry = unitStats.get(unit) ?? { total: 0, rejected: 0 };
      entry.total += 1;
      if (doc.statut === "REJETE") entry.rejected += 1;
      unitStats.set(unit, entry);
    });
    const topUnits = Array.from(unitStats.entries())
      .map(([unite, v]) => ({ unite, total: v.total, rejected: v.rejected, rate: v.total ? v.rejected / v.total : 0 }))
      .sort((a, b) => b.rate - a.rate || b.rejected - a.rejected || b.total - a.total)
      .slice(0, 5);

    const now = new Date();
    const formatter = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "numeric" });
    const monthly = Array.from({ length: 6 }, (_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const count = documents.filter((doc) => {
        const base = doc.updated_at ?? doc.created_at;
        const t = Date.parse(base);
        if (!Number.isFinite(t)) return false;
        const dt = new Date(t);
        const k = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
        return k === key;
      }).length;
      return { label: formatter.format(d), count };
    });

    return {
      total,
      rejected,
      rejectedRate,
      requiresAno,
      withAnoAction,
      avgDelayDays,
      monthly,
      topUnits,
    };
  }, [documents, role]);

  const isReadOnly = useMemo(() => {
    if (role !== "initiateur") return true;
    if (!activeDoc) return false;
    return !(activeDoc.statut === "BROUILLON" || activeDoc.statut === "A_REVOIR");
  }, [role, activeDoc]);

  const canSuspendSelectedDoc = useMemo(() => {
    if (role !== "initiateur") return false;
    if (!selected) return false;
    const blockedStates: Statut[] = ["BROUILLON", "A_REVOIR", "SUSPENDU"];
    return !blockedStates.includes(selected.statut);
  }, [role, selected]);

  const [form, setForm] = useState<TdrStFormState>(() => makeEmptyForm());
  const [isModalVisible, setIsModalVisible] = useState(false);
  const notificationTimeoutRef = useRef<number | null>(null);

  // Utiliser le snapshot pour les versions historiques
  const displayForm = useMemo(() => {
    if (historicalSnapshot && displayedVersion !== activeDoc?.version) {
      return {
        unite_technique: historicalSnapshot.unite_technique || "",
        type_document: historicalSnapshot.type_document || "TDR",
        categorie_activite: historicalSnapshot.categorie_activite || "FORMATION",
        intitule: historicalSnapshot.intitule || "",
        reference_ptba: historicalSnapshot.reference_ptba || "",
        periode_debut: historicalSnapshot.periode_debut || "",
        periode_fin: historicalSnapshot.periode_fin || "",
        duree_estimee_valeur: historicalSnapshot.duree_estimee_valeur || 1,
        duree_estimee_unite: historicalSnapshot.duree_estimee_unite || "MOIS",
        sources_financement: historicalSnapshot.sources_financement || "",
        numero_subvention: historicalSnapshot.numero_subvention || "",
        ligne_budgetaire: historicalSnapshot.ligne_budgetaire || "",
        montant_estime_usd: historicalSnapshot.montant_estime_usd || "",
        procedure_envisagee: historicalSnapshot.procedure_envisagee || "DC",
      };
    }
    return form;
  }, [historicalSnapshot, displayedVersion, activeDoc, form]);

  const startNewDraft = useCallback(() => {
    if (role !== "initiateur") return;
    setError(null);
    setSuccess(null);
    setDecisionObs("");
    setPdfFile(null);
    setFocusedDoc(null);
    setSelectedId(null);
    setForm(makeEmptyForm());
    setHistoricalSnapshot(null);
    setDisplayedVersion(null);
    setIsModalVisible(true);
  }, [role]);

  const refreshDocs = useCallback(
    async (r: UserRole, opts?: { keepSelectedId?: number | null }) => {
      const url =
        r === "initiateur"
          ? `${API_PREFIX}/documents/me/`
          : r === "verificateur_technique"
            ? `${API_PREFIX}/validations/tech/documents/`
            : r === "approbateur_final"
              ? `${API_PREFIX}/validations/final/documents/`
              : r === "auditeur"
                ? `${API_PREFIX}/auditeur/documents/`
                : `${API_PREFIX}/bailleur/documents/all/`;

      const data = await fetchJson<TdrStDocument[]>(url, { method: "GET", cache: "no-store" });
      setDocuments(data);
      setSelectedId((prev) => {
        const keep = opts?.keepSelectedId ?? null;
        if (keep) return keep;
        if (prev && data.some((d) => d.id === prev)) return prev;
        return data[0]?.id ?? null;
      });
      setDecisionObs("");
    },
    [],
  );

  useEffect(() => {
    // Réinitialiser l'état de décision quand le document sélectionné change
    setHasTakenDecision(false);
    setDecisionObs("");
  }, [selected?.id]);

  useEffect(() => {
    setError(null);
    setSuccess(null);

=======
  return (
    <Suspense fallback={<TdRStPageFallback />}>
      <TdRStPageContent />
    </Suspense>
  );
}

function TdRStPageContent() {
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
  const [pendingTdrDemandes, setPendingTdrDemandes] = useState<DemandeAchat[]>([]);
  const [pendingTdrLoading, setPendingTdrLoading] = useState(false);
  const [pendingDemandesOpen, setPendingDemandesOpen] = useState(false);
  const [selectedPendingDemande, setSelectedPendingDemande] = useState<DemandeAchat | null>(null);
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
      if (currentRole !== "demandeur") {
        setPendingTdrDemandes([]);
        return [];
      }

      setPendingTdrLoading(true);
      try {
        const demandes = await listDemandesAchat("mine");
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
    [setNotification],
  );

  // Load user and documents on mount
  useEffect(() => {
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

<<<<<<< HEAD
    void (async () => {
      const me = await fetchJson<{ role?: UserRole; username?: string }>(`/api/users/me/`, { method: "GET" });
      const r = me.role ?? null;
      if (!r) throw new Error("Rôle utilisateur introuvable.");
      setRole(r);
      setCurrentUsername(me.username || "");
      await refreshDocs(r);
    })().catch((e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    });
  }, [refreshDocs, router]);

  useEffect(() => {
    if (activeDoc && !historicalSnapshot) {
      setForm({
        unite_technique: activeDoc.unite_technique || "",
        type_document: activeDoc.type_document,
        categorie_activite: activeDoc.categorie_activite,
        intitule: activeDoc.intitule || "",
        reference_ptba: activeDoc.reference_ptba || "",
        periode_debut: activeDoc.periode_debut || "",
        periode_fin: activeDoc.periode_fin || "",
        duree_estimee_valeur: activeDoc.duree_estimee_valeur || 1,
        duree_estimee_unite: activeDoc.duree_estimee_unite || "JOURS",
        sources_financement: activeDoc.sources_financement || "",
        numero_subvention: activeDoc.numero_subvention || "",
        ligne_budgetaire: activeDoc.ligne_budgetaire || "",
        montant_estime_usd: activeDoc.montant_estime_usd?.toString() || "",
        procedure_envisagee: activeDoc.procedure_envisagee || "DC",
      });
    }
  }, [activeDoc, historicalSnapshot]);

  useEffect(() => {
    if (!error && !success) return;
    if (notificationTimeoutRef.current) {
      window.clearTimeout(notificationTimeoutRef.current);
    }
    notificationTimeoutRef.current = window.setTimeout(() => {
      setError(null);
      setSuccess(null);
      notificationTimeoutRef.current = null;
    }, NOTIFICATION_AUTOHIDE_MS);
    return () => {
      if (notificationTimeoutRef.current) {
        window.clearTimeout(notificationTimeoutRef.current);
        notificationTimeoutRef.current = null;
      }
    };
  }, [error, success]);

  const saveDraft = async (): Promise<boolean> => {
    if (role !== "initiateur") return false;
    if (isReadOnly) return false;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const url = selected ? `${API_PREFIX}/documents/${selected.id}/` : `${API_PREFIX}/documents/`;
      const method = selected ? "PATCH" : "POST";
      
      const res = await fetchJson<TdrStDocument>(url, {
        method,
        body: JSON.stringify(displayForm),
      });

      if (selected) {
        setDocuments((prev) => prev.map((d) => (d.id === res.id ? { ...d, ...res } : d)));
      } else {
        setDocuments((prev) => [res, ...prev]);
        setSelectedId(res.id);
      }
      setSuccess(selected ? "Brouillon mis à jour." : "Brouillon créé.");
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const submitSelected = async () => {
    if (role !== "initiateur") return;
    if (!selected) return;
    if (selected.statut !== "BROUILLON" && selected.statut !== "A_REVOIR") return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await fetchJson<TdrStDocument>(`${API_PREFIX}/documents/${selected.id}/submit/`, {
        method: "POST",
      });
      
      // Mettre à jour le document dans la liste
      setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      
      // IMPORTANT: Forcer le rafraîchissement complet de la liste
      // pour que les vérificateurs techniques voient le changement
      await refreshDocs(role, { keepSelectedId: updated.id });
      
      setFocusedDoc(updated);
      setSelectedId(updated.id);
      setSuccess("Document soumis avec succès. Les modifications sont maintenant verrouillées.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const suspendSelectedDocument = async () => {
    if (role !== "initiateur") return;
    if (!selected) return;
    if (!canSuspendSelectedDoc) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await fetchJson<TdrStDocument>(`${API_PREFIX}/documents/${selected.id}/suspend/`, {
        method: "POST",
      });
      setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setFocusedDoc(updated);
      setSelectedId(updated.id);
      setSuccess("Document suspendu : le workflow est arrêté.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const uploadPdf = async (): Promise<boolean> => {
    if (role !== "initiateur") return false;
    if (!selected) return false;
    if (!(selected.statut === "BROUILLON" || selected.statut === "A_REVOIR")) return false;
    if (!pdfFile) {
      setError("Sélectionne un fichier PDF.");
      return false;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = getToken();
      const headers = new Headers();
      if (token) headers.set("Authorization", `Bearer ${token}`);

      const fd = new FormData();
      fd.set("file", pdfFile);

      const res = await fetch(`${API_PREFIX}/documents/${selected.id}/upload/`, {
        method: "POST",
        headers,
        body: fd,
        cache: "no-store",
      });
      if (!res.ok) throw new Error(await toErrorMessage(res));

      const data = await res.json();
      const updatedDoc = data.document || (data.id ? data : null);

      if (updatedDoc) {
        setDocuments((prev) => 
          prev.map((d) => (d.id === updatedDoc.id ? { ...d, ...updatedDoc } : d))
        );
      } else {
        if (role) await refreshDocs(role, { keepSelectedId: selected?.id ?? null });
      }

      setSuccess("Fichier PDF téléversé avec succès.");
      setPdfFile(null);
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWithOptionalUpload = async () => {
    // Vérification spécifique pour le statut A_REVOIR
    if (activeDoc?.statut === "A_REVOIR") {
      // Pour une resoumission, un nouveau PDF est OBLIGATOIRE
      if (!pdfFile) {
        setError("Veuillez sélectionner un nouveau fichier PDF pour cette version corrigée.");
        return;
      }
    } else if (!hasPdfFile) {
      setError("Veuillez d'abord sélectionner un fichier PDF.");
      return;
    }
    
    const saved = await saveDraft();
    if (!saved) return;
    if (pdfFile) {
      const uploaded = await uploadPdf();
      if (!uploaded) return;
    }
    await submitSelected();
  };

  const refreshList = async () => {
    if (!role) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await refreshDocs(role, { keepSelectedId: focusedDoc?.id ?? selectedId });
      setSuccess("Liste rafraîchie.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (decision: string) => {
    if (!role || !selected) return;
    if (role === "initiateur" || role === "auditeur") return;
    if (isClosedDoc) return;
    if (hasTakenDecision) return;

    const url =
      role === "verificateur_technique"
        ? `${API_PREFIX}/validations/tech/${selected.id}/decision/`
        : role === "approbateur_final"
          ? `${API_PREFIX}/validations/final/${selected.id}/decision/`
          : `${API_PREFIX}/bailleur/${selected.id}/decision/`;

    setLoading(true);
    setError(null);
    setSuccess(null);
=======
    const initializePage = async () => {
      const loaded = await loadUserAndDocs();
      await loadPendingTdrDemandes(loaded?.role ?? null);
    };

    void initializePage();
  }, [loadPendingTdrDemandes, loadUserAndDocs, router]);

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
    tdrFilterProps.selectedFinancements.length > 0 ||
    tdrFilterProps.selectedStatuses.length > 0 ||
    tdrFilterProps.selectedDocumentTypes.length > 0;

  const totalDocuments =
    finalDocuments.length + (role === "demandeur" ? pendingTdrDemandes.length : 0);

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
    if (role === "demandeur" && doc.statut === "BROUILLON") {
      return "Continuer";
    }
    if (role === "demandeur" && doc.statut === "A_REVOIR") {
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
  };

  const refreshAndKeepSelection = async (documentId: number) => {
    if (!role) return;
    const refreshedDocs = await refreshDocs(role);
    const nextDoc = refreshedDocs.find((doc) => doc.id === documentId) || null;
    setSelectedDetailDoc(nextDoc);
    setSelectedId(documentId);
    if (role === "demandeur") {
      await loadPendingTdrDemandes(role);
    }
  };

  const handleCreatePendingTdr = (demande: DemandeAchat) => {
    router.push(`/TdrSt/new?demandeId=${demande.id}&source=demande-achat`);
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
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
    try {
      const updated = await fetchJson<TdrStDocument>(url, {
        method: "POST",
        body: JSON.stringify({ decision, observations: decisionObs }),
      });
<<<<<<< HEAD
      setDecisionObs("");
      setFocusedDoc(updated);
      setSelectedId(updated.id);
      setHasTakenDecision(true);
      setSuccess("Décision enregistrée.");
      await refreshDocs(role, { keepSelectedId: updated.id });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = (shouldSave = false) => {
    if (shouldSave) {
      void (async () => {
        const saved = await saveDraft();
        if (saved) setIsModalVisible(false);
      })();
      return;
    }
    setIsModalVisible(false);
  };

  const handleDocumentRowClick = (row: DocumentRow) => {
    setFocusedDoc(null);
    setSelectedId(row.doc.id);
    setDisplayedVersion(row.versionNumber);
    
    if (row.snapshot) {
      setHistoricalSnapshot(row.snapshot);
    } else {
      setHistoricalSnapshot(null);
    }

    if (role !== "auditeur") setIsModalVisible(true);
  };

  // Déterminer si le formulaire doit être en lecture seule pour la version historique
  const isHistoricalReadOnly = useMemo(() => {
    return historicalSnapshot !== null && displayedVersion !== activeDoc?.version;
  }, [historicalSnapshot, displayedVersion, activeDoc]);

  const finalIsReadOnly = isReadOnly || isHistoricalReadOnly;

  const formPanel = (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 ${finalIsReadOnly ? "opacity-75" : ""}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          {activeDoc ? "Détail du document" : "Nouveau brouillon"}
          {isHistoricalReadOnly && (
            <span className="ml-2 text-sm font-normal text-slate-500">
              (Version {displayedVersion} - historique)
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {finalIsReadOnly && (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
              Lecture seule
            </span>
          )}
          <button
            type="button"
            className="rounded-full bg-white/90 px-2.5 py-1 text-sm font-semibold text-slate-700 shadow transition hover:bg-white"
            onClick={() => handleModalClose(false)}
            aria-label="Fermer le formulaire"
          >
            ×
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-sm font-medium">Unité technique *</span>
          <input
            disabled={finalIsReadOnly}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
            value={displayForm.unite_technique}
            onChange={(e) => setForm((p) => ({ ...p, unite_technique: e.target.value }))}
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium">Type de document *</span>
          <select
            disabled={finalIsReadOnly}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
            value={displayForm.type_document}
            onChange={(e) => setForm((p) => ({ ...p, type_document: e.target.value as DocumentType }))}
          >
            <option value="TDR">TDR</option>
            <option value="ST">ST</option>
          </select>
        </label>

        <label className="block">
          <span className="block text-sm font-medium">Catégorie d&apos;activité *</span>
          <select
            disabled={finalIsReadOnly}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
            value={displayForm.categorie_activite}
            onChange={(e) => setForm((p) => ({ ...p, categorie_activite: e.target.value as CategorieActivite }))}
          >
            {[
              ["FORMATION", "Formation"],
              ["ATELIER", "Atelier"],
              ["REUNION", "Réunion"],
              ["REVUE", "Revue"],
              ["SUPERVISION", "Supervision"],
              ["ETUDE", "Étude"],
              ["CONSULTANT", "Consultant"],
              ["CABINET", "Cabinet"],
              ["BUREAU_ETUDES", "Bureau d'études"],
              ["ENTREPRISE", "Entreprise"],
              ["BIENS", "Biens"],
              ["INFRASTRUCTURE", "Infrastructure"],
            ].map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-sm font-medium">Procédure envisagée *</span>
          <select
            disabled={finalIsReadOnly}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
            value={displayForm.procedure_envisagee}
            onChange={(e) => setForm((p) => ({ ...p, procedure_envisagee: e.target.value as Procedure }))}
          >
            <option value="DC">DC</option>
            <option value="AOI">AOI</option>
            <option value="AON">AON</option>
            <option value="GRE_A_GRE">Gré à gré</option>
          </select>
        </label>
      </div>

      <label className="block">
        <span className="block text-sm font-medium">Intitulé *</span>
        <input
          disabled={finalIsReadOnly}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
          value={displayForm.intitule}
          onChange={(e) => setForm((p) => ({ ...p, intitule: e.target.value }))}
        />
      </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-sm font-medium">Référence PTBA *</span>
          <input
            disabled={finalIsReadOnly}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
            value={displayForm.reference_ptba}
            onChange={(e) => setForm((p) => ({ ...p, reference_ptba: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium">Ligne budgétaire *</span>
          <input
            disabled={finalIsReadOnly}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
            value={displayForm.ligne_budgetaire}
            onChange={(e) => setForm((p) => ({ ...p, ligne_budgetaire: e.target.value }))}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-sm font-medium">Période (début) *</span>
          <input
            type="date"
            disabled={finalIsReadOnly}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
            value={displayForm.periode_debut}
            onChange={(e) => setForm((p) => ({ ...p, periode_debut: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium">Période (fin) *</span>
          <input
            type="date"
            disabled={finalIsReadOnly}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
            value={displayForm.periode_fin}
            onChange={(e) => setForm((p) => ({ ...p, periode_fin: e.target.value }))}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-sm font-medium">Durée estimée *</span>
          <input
            type="number"
            min={1}
            disabled={finalIsReadOnly}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
            value={displayForm.duree_estimee_valeur}
            onChange={(e) => setForm((p) => ({ ...p, duree_estimee_valeur: Number(e.target.value) }))}
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium">Unité *</span>
          <select
            disabled={finalIsReadOnly}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
            value={displayForm.duree_estimee_unite}
            onChange={(e) => setForm((p) => ({ ...p, duree_estimee_unite: e.target.value as DureeUnite }))}
          >
            <option value="JOURS">Jours</option>
            <option value="MOIS">Mois</option>
          </select>
        </label>
      </div>

      <label className="block">
        <span className="block text-sm font-medium">Montant estimé (USD) *</span>
        <input
          type="number"
          min={0}
          step="0.01"
          disabled={finalIsReadOnly}
          className={`mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 ${Number(displayForm.montant_estime_usd) > 50000 ? "border-orange-400 ring-4 ring-orange-100/60 focus:border-orange-300 focus:ring-orange-200/60" : ""}`}
          value={displayForm.montant_estime_usd}
          onChange={(e) => setForm((p) => ({ ...p, montant_estime_usd: e.target.value }))}
        />
        {Number(displayForm.montant_estime_usd) > 50000 && (
          <p className="mt-1 text-xs font-bold text-orange-600 italic">
            ⚠️ Seuil critique : Validation du bailleur requise ( {'>'} 50k USD)
          </p>
        )}
      </label>

      <div className="space-y-2">
        <div className="text-sm font-medium">Sources de financement *</div>
        <div className="flex flex-wrap gap-4">
          {(["Fonds mondial", "Banque mondiale", "Alliance GAVI"] as const).map((s) => (
            <label
              key={s}
              className={`inline-flex items-center gap-2 text-sm ${finalIsReadOnly ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
            >
              <input
                type="radio"
                name="sources_financement"
                disabled={finalIsReadOnly}
                className="h-4 w-4 accent-emerald-600"
                checked={displayForm.sources_financement.includes(s)}
                onChange={() => setForm((p) => ({ ...p, sources_financement: s }))}
              />
              {s}
            </label>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="block text-sm font-medium">Numéro de subvention (si bailleur)</span>
        <input
          disabled={finalIsReadOnly}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
          value={displayForm.numero_subvention}
          onChange={(e) => setForm((p) => ({ ...p, numero_subvention: e.target.value }))}
        />
      </label>

      {role !== "auditeur" && !isHistoricalReadOnly && (
        <div className="flex justify-end pt-4">
          <button
            type="button"
            className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 disabled:opacity-50"
            onClick={() => handleModalClose(true)}
            disabled={loading || finalIsReadOnly}
          >
            OK
          </button>
        </div>
      )}
    </div>
  );

  const documentTable = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">
            Documents
          </p>
          <h3 className="text-lg font-semibold text-slate-900">
            {role === "auditeur" ? "Documents clôturés" : "Toutes les demandes"}
          </h3>
        </div>
        <p className="text-sm font-semibold text-slate-600">
          {role === "auditeur"
            ? `${docsForAuditeur.length} / ${documents.length}`
            : `${documentRows.length}`}{" "}
          document{(role === "auditeur" ? docsForAuditeur.length : documentRows.length) > 1 ? "s" : ""}
        </p>
      </div>

      {role === "auditeur" ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="block">
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Recherche</span>
            <div className="mt-1 flex flex-col gap-2 md:flex-row md:items-center">
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                value={auditeurSearch}
                onChange={(e) => setAuditeurSearch(e.target.value)}
                placeholder="Numéro, intitulé, PTBA, unité, acteur…"
              />
              {auditeurSearch.trim() ? (
                <button
                  type="button"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 md:w-auto"
                  onClick={() => setAuditeurSearch("")}
                >
                  Effacer
                </button>
              ) : null}
            </div>
          </label>
        </div>
      ) : null}

      {role === "auditeur" ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <label className="block">
              <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Statut</span>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                value={auditeurStatutFilter}
                onChange={(e) => setAuditeurStatutFilter(e.target.value as Statut | "TOUS")}
              >
                <option value="TOUS">Tous</option>
                <option value="VALIDE">Validé</option>
                <option value="REJETE">Rejeté</option>
                <option value="SUSPENDU">Suspendu</option>
              </select>
            </label>

            <label className="block">
              <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Financement</span>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                value={auditeurFundingFilter}
                onChange={(e) => setAuditeurFundingFilter(e.target.value as FundingSource | "TOUS")}
              >
                <option value="TOUS">Tous</option>
                {auditeurFundingOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Acteur</span>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                value={auditeurActorFilter}
                onChange={(e) => setAuditeurActorFilter(e.target.value)}
              >
                <option value="TOUS">Tous</option>
                {auditeurActorOptions.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end justify-end">
              <button
                type="button"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                onClick={() => {
                  setAuditeurStatutFilter("TOUS");
                  setAuditeurFundingFilter("TOUS");
                  setAuditeurActorFilter("TOUS");
                  setAuditeurSearch("");
                }}
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="max-h-[320px] overflow-y-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="sticky top-0 bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Numéro</th>
              <th className="px-4 py-3">Intitulé</th>
              <th className="px-4 py-3">Type</th>
              {role === "auditeur" ? <th className="px-4 py-3">Unité</th> : null}
              <th className="px-4 py-3">Version</th>
              <th className="px-4 py-3">PTBA</th>
              <th className="px-4 py-3">Montant (USD)</th>
              {role === "auditeur" ? <th className="px-4 py-3">ANO</th> : null}
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Créé le</th>
            </tr>
          </thead>
          <tbody>
            {documentRows.length ? (
              documentRows.map((row) => (
                <tr
                  key={`${row.doc.id}-${row.versionNumber}`}
                  className={`cursor-pointer border-b last:border-b-0 transition hover:bg-slate-50 ${
                    selectedId === row.doc.id ? "bg-slate-50" : ""
                  }`}
                  onClick={() => handleDocumentRowClick(row)}
                >
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {row.doc.numero_document || `#${row.doc.id}`}
                  </td>
                  <td className="px-4 py-3">{row.doc.intitule || "—"}</td>
                  <td className="px-4 py-3">{row.doc.type_document}</td>
                  {role === "auditeur" ? (
                    <td className="px-4 py-3">{row.doc.unite_technique || "—"}</td>
                  ) : null}
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {row.versionNumber ?? 1}
                    {role === "initiateur" && row.versionNumber !== row.doc.version && (
                      <span className="ml-2 text-xs font-normal text-slate-400">
                        (hist.)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{row.doc.reference_ptba || "—"}</td>
                  <td className="px-4 py-3">{formatAmountForRow(row.doc.montant_estime_usd)}</td>
                  {role === "auditeur" ? (
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${
                          row.doc.requires_ano ? "bg-amber-50 text-amber-900 border border-amber-200" : "bg-slate-50 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {row.doc.requires_ano ? "Oui" : "Non"}
                      </span>
                    </td>
                  ) : null}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${
                        STATUS_BADGE_CLASSES[row.doc.statut] ??
                        "bg-slate-50 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {STATUT_LABEL[row.doc.statut] ?? row.doc.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatDateForRow(row.uploadedAt ?? row.doc.created_at)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-500">
                  Aucun document disponible.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const formActions = (
    <div className="flex flex-wrap gap-3 pt-4">
      {role === "initiateur" && !isHistoricalReadOnly ? (
        <button
          className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow transition hover:-translate-y-[1px] hover:bg-emerald-700 disabled:opacity-50"
          onClick={() => void saveDraft()}
          disabled={loading || finalIsReadOnly}
        >
          {activeDoc ? "Enregistrer" : "Enregistrer brouillon"}
        </button>
      ) : null}
      {role === "initiateur" ? (
        <button
          className="rounded-full border border-emerald-200 bg-emerald-50 px-6 py-2.5 text-sm font-semibold text-emerald-900 shadow-sm transition hover:-translate-y-[1px] hover:border-emerald-300 hover:bg-emerald-100 disabled:opacity-50"
          onClick={() => startNewDraft()}
          disabled={loading}
          title="Créer un nouveau brouillon vierge"
        >
          Nouveau brouillon
        </button>
      ) : null}
      <button
        className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-[1px] hover:border-slate-300 disabled:opacity-50"
        onClick={() => void refreshList()}
        disabled={loading}
      >
        Rafraîchir
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 page-enter">
      <TopHeader />
      <main className="w-full px-4 py-6 md:px-9 md:py-8">
        <div
          className="space-y-6 w-full"
          style={{ maxInlineSize: "calc(100% - 2cm)", marginInline: "auto" }}
        >
          <header className="rounded-2xl border border-slate-200 bg-white shadow-sm page-enter-up" style={{ animationDelay: "0.08s" }}>
            <div className="rounded-2xl border-t-4 border-t-emerald-600 px-5 py-4 md:px-6 md:py-5">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                    Unité de coordination des projets
                  </p>
                  <h1 className="text-2xl font-semibold text-slate-900">Termes de Référence & Spécifications Techniques</h1>
                  <p className="text-sm text-slate-600">
                    {role === "auditeur"
                      ? "Consultation des documents clôturés et de leur traçabilité complète."
                      : finalIsReadOnly
                        ? "Ce document est en cours de validation et ne peut plus être modifié."
                        : "Créez votre brouillon et soumettez-le."}
                  </p>
                  {role ? (
                    <p className="pt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {ROLE_LABEL[role]}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-5">
                <StatusStepper statut={activeDoc?.statut} />
              </div>
            </div>
          </header>

          {(error || success) && (
            <div className="fixed right-6 bottom-[20px] z-[100] space-y-2">
              {error && (
                <div
                  className="min-w-[220px] max-w-[340px] rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 font-semibold text-rose-800 shadow-lg transition-opacity duration-200 animate-saveMessageSlide"
                  style={{ animationDuration: "0.5s" }}
                >
                  Erreur : {error}
                </div>
              )}
              {success && (
                <div
                  className="min-w-[220px] max-w-[340px] rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 font-semibold text-emerald-800 shadow-lg transition-opacity duration-200 animate-saveMessageSlide"
                  style={{ animationDuration: "0.5s" }}
                >
                  Succès : {success}
                </div>
              )}
            </div>
          )}

          <div
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6 page-enter-up"
            style={{ animationDelay: "0.14s" }}
          >
            {role === "auditeur" && auditeurOverview ? (
              <DashboardIndividual overview={auditeurOverview} />
            ) : null}
            {documentTable}
            {formActions}
          </div>

          <div className="space-y-6 page-enter-up" style={{ animationDelay: "0.2s" }}>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">
                  {role === "auditeur" ? "Traçabilité (Section G)" : "Processus de validation"}
                </h2>
                {activeDoc ? (
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 transition hover:border-slate-300 hover:bg-slate-50"
                    onClick={() => setIsModalVisible(true)}
                  >
                    Voir formulaire
                  </button>
                ) : null}
              </div>

              {!activeDoc ? (
                <p className="text-sm text-slate-600">Sélectionne un document.</p>
              ) : (
                <>
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="space-y-3">
                      <div className="text-sm font-semibold text-slate-900">Historique des actions</div>
                      {activeDoc.actions_validation?.length ? (
                        <div className="space-y-2">
                          {activeDoc.actions_validation.map((a) => (
                            <div key={a.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                  {a.etape} {a.decision ? `• ${a.decision}` : ""}
                                </p>
                                <p className="text-xs text-slate-500">{new Date(a.horodatage).toLocaleString()}</p>
                              </div>
                              <p className="mt-1 text-sm text-slate-800">
                                <span className="font-semibold">{a.acteur_username}:</span>{" "}
                                {a.observations?.trim() ? a.observations : <span className="text-slate-500">—</span>}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">Aucun historique.</p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-sm font-bold text-slate-900">
                            Document PDF ({formatPdfVersionLabel(activeDoc.version)})
                          </div>
                          {activeDoc.fichier_courant?.fichier_pdf ? (
                            <a
                              href={resolveBackendUrl(activeDoc.fichier_courant.fichier_pdf) ?? "#"}
                              target="_blank"
                              className="text-xs font-bold text-emerald-600 hover:underline"
                              rel="noreferrer"
                            >
                              Visualiser le PDF actuel
                            </a>
                          ) : null}
                        </div>
                        {!activeDoc.fichier_courant?.fichier_pdf ? (
                          <p className="mt-2 text-sm text-slate-600">Aucun PDF téléversé pour ce document.</p>
                        ) : (
                          <p className="mt-2 text-xs text-slate-500">
                            {role === "auditeur"
                              ? "Document officiel — consultation uniquement."
                              : "Le PDF est la version officielle à relire/valider (lecture seule pour les validateurs)."}
                          </p>
                        )}

                        {role === "auditeur" && activeDoc.fichier_courant?.fichier_pdf ? (
                          <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Empreinte SHA-256 (PDF courant)
                              </p>
                              <p className="mt-2 break-all rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[11px] text-slate-700">
                                {activeDoc.fichier_courant.empreinte_sha256 ?? "—"}
                              </p>
                            </div>

                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Versioning</p>
                              {activeDoc.versions_fichier?.length ? (
                                <div className="mt-2 space-y-2">
                                  {[...activeDoc.versions_fichier]
                                    .sort((a, b) => (b.version ?? 0) - (a.version ?? 0))
                                    .map((v) => (
                                      <div key={v.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                                        <div className="flex items-center justify-between gap-2">
                                          <p className="text-xs font-semibold text-slate-800">
                                            {formatPdfVersionLabel(v.version)}
                                          </p>
                                          {v.fichier_pdf ? (
                                            <a
                                              href={resolveBackendUrl(v.fichier_pdf) ?? "#"}
                                              target="_blank"
                                              className="text-xs font-bold text-emerald-600 hover:underline"
                                              rel="noreferrer"
                                            >
                                              Télécharger
                                            </a>
                                          ) : null}
                                        </div>
                                        <p className="mt-1 text-xs text-slate-600" title={v.fichier_nom_original}>
                                          {v.fichier_nom_original || "—"}
                                        </p>
                                        <p className="mt-1 break-all font-mono text-[11px] text-slate-600">
                                          {v.empreinte_sha256 ?? "—"}
                                        </p>
                                      </div>
                                    ))}
                                </div>
                              ) : (
                                <p className="mt-2 text-sm text-slate-500">Aucune version disponible.</p>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>

                      {role === "auditeur" ? (
                        <div className="rounded-xl border border-violet-100 bg-violet-50 p-4 text-xs text-violet-700">
                          <button
                            type="button"
                            className="mt-3 w-full rounded-xl border border-emerald-200 bg-emerald-50 py-3 text-sm font-semibold text-emerald-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                            onClick={() => router.push("/TdrSt/dashboard")}
                            disabled={loading}
                          >
                            Voir dashboard
                          </button>
                        </div>
                      ) : role === "initiateur" ? (
                        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="text-sm font-bold text-slate-900">Téléverser un nouveau PDF</div>
                          <div
                            className={`rounded-xl border-2 border-dashed p-6 text-center ${
                              activeDoc.statut === "BROUILLON" || activeDoc.statut === "A_REVOIR"
                                ? "bg-emerald-50/30 border-emerald-200"
                                : "bg-slate-50 border-slate-200"
                            }`}
                          >
                            <input
                              type="file"
                              id="pdf-upload"
                              className="hidden"
                              accept="application/pdf"
                              onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                              disabled={
                                loading || !(activeDoc.statut === "BROUILLON" || activeDoc.statut === "A_REVOIR") || isHistoricalReadOnly
                              }
                            />
                            <label
                              htmlFor="pdf-upload"
                              className={`block cursor-pointer text-sm font-medium ${
                                activeDoc.statut === "BROUILLON" || activeDoc.statut === "A_REVOIR"
                                  ? "text-emerald-700"
                                  : "text-slate-400"
                              }`}
                            >
                              {pdfFile ? `Fichier sélectionné : ${pdfFile.name}` : "Cliquez pour choisir le fichier PDF (Max 15Mo)"}
                            </label>
                          </div>
                          <button
                            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                            onClick={() => void handleSubmitWithOptionalUpload()}
                            disabled={loading || !(activeDoc.statut === "BROUILLON" || activeDoc.statut === "A_REVOIR") || !hasPdfFile || isHistoricalReadOnly}
                          >
                            {activeDoc.statut === "BROUILLON" || activeDoc.statut === "A_REVOIR"
                              ? (hasPdfFile ? "Soumettre pour validation" : "Ajoutez un PDF pour soumettre")
                              : "Déjà soumis"}
                          </button>
                          <button
                            className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                            onClick={() => void suspendSelectedDocument()}
                            disabled={loading || !canSuspendSelectedDoc || isHistoricalReadOnly}
                            title={
                              !selected
                                ? "Sélectionne un document"
                                : canSuspendSelectedDoc
                                  ? "Suspendre définitivement le workflow"
                                  : "Le document doit être soumis pour activer cette action"
                            }
                          >
                            Suspendre le workflow
                          </button>
                          <button
                            type="button"
                            className="w-full rounded-xl border border-emerald-200 bg-emerald-50 py-3 text-sm font-semibold text-emerald-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                            onClick={() => router.push("/TdrSt/dashboard")}
                            disabled={loading}
                          >
                            Voir dashboard
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-sm font-semibold text-slate-900">Décision</div>
                          {!selected ? (
                            <p className="text-sm text-slate-600">
                              Document traité. Sélectionne un autre document dans la liste pour prendre une nouvelle décision.
                            </p>
                          ) : (
                            <>
                              <textarea
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.05)] focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/12"
                                rows={3}
                                value={decisionObs}
                                onChange={(e) => setDecisionObs(e.target.value)}
                                disabled={loading || isClosedDoc || hasTakenDecision}
                                placeholder="Observations (optionnel)"
                              />

                              {role === "verificateur_technique" ? (
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    className="rounded-full bg-emerald-600 px-4.5 py-2.5 text-sm font-semibold text-white shadow transition hover:-translate-y-[1px] hover:bg-emerald-700 disabled:opacity-50"
                                    onClick={() => void handleDecision("FAVORABLE")}
                                    disabled={loading || isClosedDoc || hasTakenDecision}
                                  >
                                    Avis favorable
                                  </button>
                                  <button
                                    className="rounded-full border border-amber-300 bg-amber-50 px-4.5 py-2.5 text-sm font-semibold text-amber-900 shadow-sm transition hover:-translate-y-[1px] hover:border-amber-400 disabled:opacity-50"
                                    onClick={() => void handleDecision("A_REVOIR")}
                                    disabled={loading || isClosedDoc || hasTakenDecision}
                                  >
                                    À revoir
                                  </button>
                                </div>
                              ) : null}

                              {role === "approbateur_final" ? (
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    className="rounded-full bg-emerald-600 px-4.5 py-2.5 text-sm font-semibold text-white shadow transition hover:-translate-y-[1px] hover:bg-emerald-700 disabled:opacity-50"
                                    onClick={() => void handleDecision("APPROUVE")}
                                    disabled={loading || isClosedDoc || hasTakenDecision}
                                  >
                                    Approuver
                                  </button>
                                  <button
                                    className="rounded-full border border-rose-300 bg-rose-50 px-4.5 py-2.5 text-sm font-semibold text-rose-900 shadow-sm transition hover:-translate-y-[1px] hover:border-rose-400 disabled:opacity-50"
                                    onClick={() => void handleDecision("REJETE")}
                                    disabled={loading || isClosedDoc || hasTakenDecision}
                                  >
                                    Rejeter
                                  </button>
                                </div>
                              ) : null}

                              {role === "bailleur" ? (
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    className="rounded-full bg-emerald-600 px-4.5 py-2.5 text-sm font-semibold text-white shadow transition hover:-translate-y-[1px] hover:bg-emerald-700 disabled:opacity-50"
                                    onClick={() => void handleDecision("ANO_ACCORDE")}
                                    disabled={loading || isClosedDoc || hasTakenDecision}
                                  >
                                    Octroyer ANO
                                  </button>
                                  <button
                                    className="rounded-full border border-rose-300 bg-rose-50 px-4.5 py-2.5 text-sm font-semibold text-rose-900 shadow-sm transition hover:-translate-y-[1px] hover:border-rose-400 disabled:opacity-50"
                                    onClick={() => void handleDecision("ANO_REFUSE")}
                                    disabled={loading || isClosedDoc || hasTakenDecision}
                                  >
                                    Refuser
                                  </button>
                                </div>
                              ) : null}
                            </>
                          )}
                          <button
                            type="button"
                            className="w-full rounded-xl border border-emerald-200 bg-emerald-50 py-3 text-sm font-semibold text-emerald-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                            onClick={() => router.push("/TdrSt/dashboard")}
                            disabled={loading}
                          >
                            Voir dashboard
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {role === "approbateur_final" && activeDoc.requires_ano ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                      <p className="text-sm font-semibold">Seuil bailleur dépassé</p>
                      <p className="mt-1 text-xs">
                        Après approbation, le document passera en <span className="font-semibold">En attente ANO</span>.
                      </p>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
          {isModalVisible && (
            <>
              <div
                className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm pointer-events-none"
                aria-hidden="true"
              />
              <div
                className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-6"
                role="dialog"
                aria-modal="true"
                aria-label="Formulaire TdR"
              >
                <div className="relative w-full max-w-5xl">
                  {formPanel}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
=======
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
        {selectedDetailDoc.statut === "A_REVOIR" ? "Corriger" : "Continuer"}
      </button>
    ) : null;

  const detailFooterSlot =
    selectedDetailDoc && role === "demandeur" && (selectedDetailDoc.statut === "BROUILLON" || selectedDetailDoc.statut === "A_REVOIR") ? (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">Le document sera transmis au circuit de validation TDR/ST.</p>
        <button
          type="button"
          onClick={() => void handleSubmitDocument()}
          disabled={actionLoading}
          className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          Envoyer en validation
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
            {role === "demandeur" && (pendingTdrLoading || pendingTdrDemandes.length > 0) && (
              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => {
                    if (!pendingTdrLoading && pendingTdrDemandes.length > 0) {
                      setPendingDemandesOpen((prev) => !prev);
                    }
                  }}
                  disabled={pendingTdrLoading || pendingTdrDemandes.length === 0}
                  className={`flex w-full items-center justify-between px-5 py-4 text-left transition-colors ${
                    pendingTdrLoading || pendingTdrDemandes.length === 0
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
                      {pendingTdrDemandes.length}
                    </span>
                    {!pendingTdrLoading && pendingTdrDemandes.length > 0 && (
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

                {(pendingTdrLoading || pendingDemandesOpen) && (
                  <div className="bg-slate-50 px-4 py-4">
                    {pendingTdrLoading ? (
                      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">
                        Chargement des dossiers à documenter...
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingTdrDemandes.map((demande) => (
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
                    )}
                  </div>
                )}
              </section>
            )}

            {/* BROUILLONS - visible seulement pour demandeur */}
            {role === "demandeur" && sections.draft.length > 0 && (
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
      <DemandeDetailModal
        demande={selectedPendingDemande}
        open={!!selectedPendingDemande}
        onClose={() => setSelectedPendingDemande(null)}
      />
    </div>
  );
}
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
