"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TopHeader from "@/app/components/TopHeader";

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
  | "bailleur";

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
  sources_financement: FundingSource[];
  numero_subvention: string;
  ligne_budgetaire: string;
  montant_estime_usd: string;
  procedure_envisagee: Procedure;
  requires_ano?: boolean;
  actions_validation?: ValidationAction[];
  fichier_courant?: {
    fichier_pdf?: string;
    // Ajoutez d'autres propriétés si nécessaire
  };
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
  sources_financement: FundingSource[];
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

const ROLE_LABEL: Record<UserRole, string> = {
  initiateur: "Initiateur (Cadre technique)",
  verificateur_technique: "Vérificateur technique (Chef de projet / Point focal)",
  approbateur_final: "Approbateur final (Coordonnateur UCP)",
  bailleur: "Bailleur (ANO)",
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
  sources_financement: [],
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

  const badgeText = statut ? STATUT_LABEL[statut] : "â€”";
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
          <div className={`h-full ${c.bar}`} style={{ width: `${pct}%` }} />
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
  );
}

export default function TdRStPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const router = useRouter();

  const [documents, setDocuments] = useState<TdrStDocument[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // Pour les validateurs (tech/final/bailleur) : après une décision, le document sort souvent
  // de la liste "pending". On conserve donc une copie pour continuer d'afficher l'historique.
  const [focusedDoc, setFocusedDoc] = useState<TdrStDocument | null>(null);
  const [decisionObs, setDecisionObs] = useState("");

  const selected = useMemo(
    () => (selectedId ? documents.find((d) => d.id === selectedId) || null : null),
    [documents, selectedId],
  );
  const activeDoc = useMemo(() => focusedDoc ?? selected, [focusedDoc, selected]);

  // Verrouillage UI:
  // - initiateur peut éditer seulement BROUILLON / A_REVOIR
  // - autres rôles: toujours lecture seule sur le formulaire
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

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const notificationTimeoutRef = useRef<number | null>(null);

  const startNewDraft = useCallback(() => {
    if (role !== "initiateur") return;
    setError(null);
    setSuccess(null);
    setDecisionObs("");
    setPdfFile(null);
    setFocusedDoc(null);
    setSelectedId(null);
    setForm(makeEmptyForm());
    setIsModalVisible(true);
  }, [role]);

  const refreshDocs = useCallback(
    async (r: UserRole, opts?: { keepSelectedId?: number | null }) => {
      const url =
        r === "initiateur"
          ? `${API_PREFIX}/documents/me/`
          : r === "verificateur_technique"
            ? `${API_PREFIX}/validations/tech/pending/`
            : r === "approbateur_final"
              ? `${API_PREFIX}/validations/final/pending/`
              : `${API_PREFIX}/bailleur/documents/`;

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
    setError(null);
    setSuccess(null);

    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    void (async () => {
      const me = await fetchJson<{ role?: UserRole }>(`/api/users/me/`, { method: "GET" });
      const r = me.role ?? null;
      if (!r) throw new Error("Rôle utilisateur introuvable.");
      setRole(r);
      await refreshDocs(r);
    })().catch((e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    });
  }, [refreshDocs, router]);

  // Synchroniser le formulaire quand on sélectionne un document existant
  useEffect(() => {
    if (activeDoc) {
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
        sources_financement: activeDoc.sources_financement || [],
        numero_subvention: activeDoc.numero_subvention || "",
        ligne_budgetaire: activeDoc.ligne_budgetaire || "",
        montant_estime_usd: activeDoc.montant_estime_usd?.toString() || "",
        procedure_envisagee: activeDoc.procedure_envisagee || "DC",
      });
    }
  }, [activeDoc]);

  const toggleFunding = (source: FundingSource) => {
    if (isReadOnly) return;
    setForm((prev) => {
      const exists = prev.sources_financement.includes(source);
      return {
        ...prev,
        sources_financement: exists
          ? prev.sources_financement.filter((s) => s !== source)
          : [...prev.sources_financement, source],
      };
    });
  };

  useEffect(() => {
    if (!error && !success) return;
    if (notificationTimeoutRef.current) {
      window.clearTimeout(notificationTimeoutRef.current);
    }
    notificationTimeoutRef.current = window.setTimeout(() => {
      setError(null);
      setSuccess(null);
      notificationTimeoutRef.current = null;
    }, 1800);
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
        body: JSON.stringify(form),
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
      setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
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

  const uploadPdf = async () => {
    if (role !== "initiateur") return;
    if (!selected) return;
    if (!(selected.statut === "BROUILLON" || selected.statut === "A_REVOIR")) return;
    if (!pdfFile) {
      setError("Sélectionne un fichier PDF.");
      return;
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

        // Vérifier si Django a renvoyé { document: {...} } OU directement le document {...}
        const updatedDoc = data.document || (data.id ? data : null);

        if (updatedDoc) {
          // On fusionne l'objet pour préserver les autres infos si besoin
          setDocuments((prev) => 
            prev.map((d) => (d.id === updatedDoc.id ? { ...d, ...updatedDoc } : d))
          );
        } else {
          if (role) await refreshDocs(role, { keepSelectedId: selected?.id ?? null });
        }

        setSuccess("Fichier PDF téléversé avec succès.");
        setPdfFile(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
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
    if (role === "initiateur") return;

    const url =
      role === "verificateur_technique"
        ? `${API_PREFIX}/validations/tech/${selected.id}/decision/`
        : role === "approbateur_final"
          ? `${API_PREFIX}/validations/final/${selected.id}/decision/`
          : `${API_PREFIX}/bailleur/${selected.id}/decision/`;

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await fetchJson<TdrStDocument>(url, {
        method: "POST",
        body: JSON.stringify({ decision, observations: decisionObs }),
      });
      setDecisionObs("");
      setFocusedDoc(updated);
      setSelectedId(updated.id);
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

  const formPanel = (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 ${isReadOnly ? "opacity-75" : ""}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{activeDoc ? "Modifier le document" : "Nouveau brouillon"}</h2>
        <div className="flex items-center gap-2">
          {isReadOnly && (
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full border">Lecture seule</span>
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
            disabled={isReadOnly}
            className="mt-1 w-full border rounded-md px-3 py-2 disabled:bg-slate-50 disabled:text-slate-500"
            value={form.unite_technique}
            onChange={(e) => setForm((p) => ({ ...p, unite_technique: e.target.value }))}
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium">Type de document *</span>
          <select
            disabled={isReadOnly}
            className="mt-1 w-full border rounded-md px-3 py-2 disabled:bg-slate-50"
            value={form.type_document}
            onChange={(e) => setForm((p) => ({ ...p, type_document: e.target.value as DocumentType }))}
          >
            <option value="TDR">TDR</option>
            <option value="ST">ST</option>
          </select>
        </label>

        <label className="block">
          <span className="block text-sm font-medium">Catégorie d’activité *</span>
          <select
            disabled={isReadOnly}
            className="mt-1 w-full border rounded-md px-3 py-2 disabled:bg-slate-50"
            value={form.categorie_activite}
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
            disabled={isReadOnly}
            className="mt-1 w-full border rounded-md px-3 py-2 disabled:bg-slate-50"
            value={form.procedure_envisagee}
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
          disabled={isReadOnly}
          className="mt-1 w-full border rounded-md px-3 py-2 disabled:bg-slate-50"
          value={form.intitule}
          onChange={(e) => setForm((p) => ({ ...p, intitule: e.target.value }))}
        />
      </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-sm font-medium">Référence PTBA *</span>
          <input
            disabled={isReadOnly}
            className="mt-1 w-full border rounded-md px-3 py-2 disabled:bg-slate-50"
            value={form.reference_ptba}
            onChange={(e) => setForm((p) => ({ ...p, reference_ptba: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium">Ligne budgétaire *</span>
          <input
            disabled={isReadOnly}
            className="mt-1 w-full border rounded-md px-3 py-2 disabled:bg-slate-50"
            value={form.ligne_budgetaire}
            onChange={(e) => setForm((p) => ({ ...p, ligne_budgetaire: e.target.value }))}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-sm font-medium">Période (début) *</span>
          <input
            type="date"
            disabled={isReadOnly}
            className="mt-1 w-full border rounded-md px-3 py-2 disabled:bg-slate-50"
            value={form.periode_debut}
            onChange={(e) => setForm((p) => ({ ...p, periode_debut: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium">Période (fin) *</span>
          <input
            type="date"
            disabled={isReadOnly}
            className="mt-1 w-full border rounded-md px-3 py-2 disabled:bg-slate-50"
            value={form.periode_fin}
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
            disabled={isReadOnly}
            className="mt-1 w-full border rounded-md px-3 py-2 disabled:bg-slate-50"
            value={form.duree_estimee_valeur}
            onChange={(e) => setForm((p) => ({ ...p, duree_estimee_valeur: Number(e.target.value) }))}
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium">Unité *</span>
          <select
            disabled={isReadOnly}
            className="mt-1 w-full border rounded-md px-3 py-2 disabled:bg-slate-50"
            value={form.duree_estimee_unite}
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
          disabled={isReadOnly}
          className={`mt-1 w-full border rounded-md px-3 py-2 disabled:bg-slate-50 ${Number(form.montant_estime_usd) > 50000 ? "border-orange-400 ring-2 ring-orange-100" : ""}`}
          value={form.montant_estime_usd}
          onChange={(e) => setForm((p) => ({ ...p, montant_estime_usd: e.target.value }))}
        />
        {Number(form.montant_estime_usd) > 50000 && (
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
              className={`inline-flex items-center gap-2 text-sm ${isReadOnly ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
            >
              <input
                type="checkbox"
                disabled={isReadOnly}
                checked={form.sources_financement.includes(s)}
                onChange={() => toggleFunding(s)}
              />
              {s}
            </label>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="block text-sm font-medium">Numéro de subvention (si bailleur)</span>
        <input
          disabled={isReadOnly}
          className="mt-1 w-full border rounded-md px-3 py-2 disabled:bg-slate-50"
          value={form.numero_subvention}
          onChange={(e) => setForm((p) => ({ ...p, numero_subvention: e.target.value }))}
        />
      </label>

      <div className="flex justify-end pt-4">
        <button
          type="button"
          className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-700 disabled:opacity-50"
          onClick={() => handleModalClose(true)}
          disabled={loading || isReadOnly}
        >
          OK
        </button>
      </div>
    </div>
  );

  const handleDocumentRowClick = (doc: TdrStDocument) => {
    setFocusedDoc(null);
    setSelectedId(doc.id);
    setIsModalVisible(true);
  };

  const documentTable = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">
            Documents
          </p>
          <h3 className="text-lg font-semibold text-slate-900">Toutes les demandes</h3>
        </div>
        <p className="text-sm font-semibold text-slate-600">
          {documents.length} document{documents.length > 1 ? "s" : ""}
        </p>
      </div>

      <div className="max-h-[320px] overflow-y-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="sticky top-0 bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Numéro</th>
              <th className="px-4 py-3">Intitulé</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Version</th>
              <th className="px-4 py-3">PTBA</th>
              <th className="px-4 py-3">Montant (MGA)</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Créé le</th>
            </tr>
          </thead>
          <tbody>
            {documents.length ? (
              documents.map((doc) => (
                <tr
                  key={doc.id}
                  className={`cursor-pointer border-b last:border-b-0 transition hover:bg-slate-50 ${
                    selectedId === doc.id ? "bg-slate-50" : ""
                  }`}
                  onClick={() => handleDocumentRowClick(doc)}
                >
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {doc.numero_document || `#${doc.id}`}
                  </td>
                  <td className="px-4 py-3">{doc.intitule || "—"}</td>
                  <td className="px-4 py-3">{doc.type_document}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {doc.version ?? 1}
                  </td>
                  <td className="px-4 py-3">{doc.reference_ptba || "—"}</td>
                  <td className="px-4 py-3">{formatAmountForRow(doc.montant_estime_usd)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${
                        STATUS_BADGE_CLASSES[doc.statut] ?? "bg-slate-50 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {STATUT_LABEL[doc.statut] ?? doc.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatDateForRow(doc.created_at)}</td>
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
      {role === "initiateur" ? (
        <button
          className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow transition hover:-translate-y-[1px] hover:bg-emerald-700 disabled:opacity-50"
          onClick={() => void saveDraft()}
          disabled={loading || isReadOnly}
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
    <div className="min-h-screen bg-slate-50">
      <TopHeader />
      <main className="w-full px-4 py-6 md:px-9 md:py-8">
        <div
          className="space-y-6 w-full"
          style={{ maxInlineSize: "calc(100% - 2cm)", marginInline: "auto" }}
        >
        <header className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="rounded-2xl border-t-4 border-t-emerald-600 px-5 py-4 md:px-6 md:py-5">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                  Unité de coordination des projets
                </p>
                <h1 className="text-2xl font-semibold text-slate-900">Termes de Référence & Spécifications Techniques</h1>
                <p className="text-sm text-slate-600">
                  Gestion des documents techniques. {isReadOnly ? "Ce document est en cours de validation et ne peut plus être modifié." : "Créez votre brouillon et soumettez-le."}
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
                className="min-w-[220px] max-w-[340px] rounded-[10px] border px-[0.8rem] py-[0.65rem] font-semibold shadow-lg text-[#8d2525] bg-[#fde9e9] border-[#f6c8c8] transition-opacity duration-200 animate-saveMessageSlide"
                style={{ animationDuration: "0.5s" }}
              >
                Erreur : {error}
              </div>
            )}
            {success && (
              <div
                className="min-w-[220px] max-w-[340px] rounded-[10px] border px-[0.8rem] py-[0.65rem] font-semibold shadow-lg text-[#0c6f3d] bg-[#e6f8ef] border-[#bce9cd] transition-opacity duration-200 animate-saveMessageSlide"
                style={{ animationDuration: "0.5s" }}
              >
                Succès : {success}
              </div>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          {documentTable}
          {formActions}
        </div>

        <div className="space-y-6">

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Processus de validation</h2>
              {activeDoc ? (
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {STATUT_LABEL[activeDoc.statut] ?? activeDoc.statut}
                </span>
              ) : null}
            </div>

            {!activeDoc ? (
              <p className="text-sm text-slate-600">Sélectionne un document.</p>
            ) : (
              <>
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-slate-900">Historique</div>
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
                          Document PDF (Version {activeDoc.version || 1})
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
                          Le PDF est la version officielle à relire/valider (lecture seule pour les validateurs).
                        </p>
                      )}
                    </div>
                    {role === "initiateur" ? (
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
                              loading || !(activeDoc.statut === "BROUILLON" || activeDoc.statut === "A_REVOIR")
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
                          className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                          onClick={() => { void uploadPdf(); void submitSelected(); }}
                          disabled={loading || !(activeDoc.statut === "BROUILLON" || activeDoc.statut === "A_REVOIR")}
                        >
                          {activeDoc.statut === "BROUILLON" || activeDoc.statut === "A_REVOIR"
                            ? "Soumettre pour validation"
                            : "Déjà soumis"}
                        </button>
                        <button
                          className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                          onClick={() => void suspendSelectedDocument()}
                          disabled={loading || !canSuspendSelectedDoc}
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
                              placeholder="Observations (optionnel)"
                            />

                            {role === "verificateur_technique" ? (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  className="rounded-full bg-emerald-600 px-4.5 py-2.5 text-sm font-semibold text-white shadow transition hover:-translate-y-[1px] hover:bg-emerald-700 disabled:opacity-50"
                                  onClick={() => void handleDecision("FAVORABLE")}
                                  disabled={loading}
                                >
                                  Avis favorable
                                </button>
                                <button
                                  className="rounded-full border border-amber-300 bg-amber-50 px-4.5 py-2.5 text-sm font-semibold text-amber-900 shadow-sm transition hover:-translate-y-[1px] hover:border-amber-400 disabled:opacity-50"
                                  onClick={() => void handleDecision("A_REVOIR")}
                                  disabled={loading}
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
                                  disabled={loading}
                                >
                                  Approuver
                                </button>
                                <button
                                  className="rounded-full border border-rose-300 bg-rose-50 px-4.5 py-2.5 text-sm font-semibold text-rose-900 shadow-sm transition hover:-translate-y-[1px] hover:border-rose-400 disabled:opacity-50"
                                  onClick={() => void handleDecision("REJETE")}
                                  disabled={loading}
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
                                  disabled={loading}
                                >
                                  Octroyer ANO
                                </button>
                                <button
                                  className="rounded-full border border-rose-300 bg-rose-50 px-4.5 py-2.5 text-sm font-semibold text-rose-900 shadow-sm transition hover:-translate-y-[1px] hover:border-rose-400 disabled:opacity-50"
                                  onClick={() => void handleDecision("ANO_REFUSE")}
                                  disabled={loading}
                                >
                                  Refuser
                                </button>
                              </div>
                            ) : null}
                          </>
                        )}
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
