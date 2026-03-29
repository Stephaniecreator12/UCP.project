"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

const API_PREFIX = "/api/TdrSt";

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

function StatusStepper({ statut }: { statut?: Statut }) {
  const { pct, tone } = getProgress(statut);
  const idx = getStepIndex(statut);
  const steps = ["Brouillon", "Soumis", "En validation", "DÃ©cision"];

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
                ? "Progression basÃ©e sur l'Ã©tat actuel."
                : "SÃ©lectionne un document pour voir sa progression."}
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
  const [decisionObs, setDecisionObs] = useState("");

  const selected = useMemo(
    () => (selectedId ? documents.find((d) => d.id === selectedId) || null : null),
    [documents, selectedId],
  );

  // Verrouillage UI:
  // - initiateur peut éditer seulement BROUILLON / A_REVOIR
  // - autres rôles: toujours lecture seule sur le formulaire
  const isReadOnly = useMemo(() => {
    if (role !== "initiateur") return true;
    if (!selected) return false;
    return !(selected.statut === "BROUILLON" || selected.statut === "A_REVOIR");
  }, [role, selected]);

  const [form, setForm] = useState({
    unite_technique: "",
    type_document: "TDR" as DocumentType,
    categorie_activite: "FORMATION" as CategorieActivite,
    intitule: "",
    reference_ptba: "",
    periode_debut: "",
    periode_fin: "",
    duree_estimee_valeur: 1,
    duree_estimee_unite: "JOURS" as DureeUnite,
    sources_financement: [] as FundingSource[],
    numero_subvention: "",
    ligne_budgetaire: "",
    montant_estime_usd: "",
    procedure_envisagee: "DC" as Procedure,
  });

  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const refreshDocs = useCallback(
    async (r: UserRole) => {
      const url =
        r === "initiateur"
          ? `${API_PREFIX}/documents/me/`
          : r === "verificateur_technique"
            ? `${API_PREFIX}/validations/tech/pending/`
            : r === "approbateur_final"
              ? `${API_PREFIX}/validations/final/pending/`
              : `${API_PREFIX}/bailleur/documents/`;

      const data = await fetchJson<TdrStDocument[]>(url, { method: "GET" });
      setDocuments(data);
      setSelectedId(data[0]?.id ?? null);
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
    if (selected) {
      setForm({
        unite_technique: selected.unite_technique || "",
        type_document: selected.type_document,
        categorie_activite: selected.categorie_activite,
        intitule: selected.intitule || "",
        reference_ptba: selected.reference_ptba || "",
        periode_debut: selected.periode_debut || "",
        periode_fin: selected.periode_fin || "",
        duree_estimee_valeur: selected.duree_estimee_valeur || 1,
        duree_estimee_unite: selected.duree_estimee_unite || "JOURS",
        sources_financement: selected.sources_financement || [],
        numero_subvention: selected.numero_subvention || "",
        ligne_budgetaire: selected.ligne_budgetaire || "",
        montant_estime_usd: selected.montant_estime_usd?.toString() || "",
        procedure_envisagee: selected.procedure_envisagee || "DC",
      });
    }
  }, [selected]);

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

  const saveDraft = async () => {
    if (role !== "initiateur") return;
    if (isReadOnly) return;
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
        setDocuments((prev) => prev.map((d) => (d.id === res.id ? res : d)));
      } else {
        setDocuments((prev) => [res, ...prev]);
        setSelectedId(res.id);
      }
      setSuccess(selected ? "Brouillon mis à jour." : "Brouillon créé.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
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
      });
      if (!res.ok) throw new Error(await toErrorMessage(res));

      const data = (await res.json()) as { document?: TdrStDocument };
      if (data.document) {
        setDocuments((prev) => prev.map((d) => (d.id === data.document!.id ? data.document! : d)));
      } else {
        if (role) await refreshDocs(role);
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
      await refreshDocs(role);
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
      await fetchJson<TdrStDocument>(url, {
        method: "POST",
        body: JSON.stringify({ decision, observations: decisionObs }),
      });
      setDecisionObs("");
      setSuccess("Décision enregistrée.");
      await refreshDocs(role);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-7 md:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
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

              <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">
                  {role === "initiateur"
                    ? "Mes documents"
                    : role === "verificateur_technique"
                      ? "File technique"
                      : role === "approbateur_final"
                        ? "File approbation"
                        : "File ANO"}
                </label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.05)] focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/12"
                  value={selectedId ?? ""}
                  onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">{role === "initiateur" ? "— Nouveau document —" : "—"}</option>
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.numero_document || `#${d.id}`} — {STATUT_LABEL[d.statut] ?? d.statut}
                    </option>
                  ))}
                </select>
                {selected ? (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-600">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Type</p>
                      <p className="font-medium text-slate-800">{selected.type_document}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Version</p>
                      <p className="font-medium text-slate-800">{selected.version}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Statut</p>
                      <p className="truncate font-medium text-emerald-700">{STATUT_LABEL[selected.statut]}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-5">
              <StatusStepper statut={selected?.statut} />
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-900 shadow-sm flex items-center gap-2">
            <span className="font-bold">Erreur:</span> {error}
          </div>
        )}
        {success && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 shadow-sm flex items-center gap-2">
            <span className="font-bold">Succès:</span> {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 ${isReadOnly ? "opacity-75" : ""}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{selected ? "Modifier le document" : "Nouveau brouillon"}</h2>
              {isReadOnly && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full border">Lecture seule</span>}
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
                    <option key={v} value={v}>{label}</option>
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
                <p className="mt-1 text-xs font-bold text-orange-600 italic">⚠️ Seuil critique : Validation du bailleur requise ( {'>'} 50k USD)</p>
              )}
            </label>

            <div className="space-y-2">
              <div className="text-sm font-medium">Sources de financement *</div>
              <div className="flex flex-wrap gap-4">
                {(["Fonds mondial", "Banque mondiale", "Alliance GAVI"] as const).map((s) => (
                  <label key={s} className={`inline-flex items-center gap-2 text-sm ${isReadOnly ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}>
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

            <div className="flex flex-wrap gap-3 pt-4">
              {role === "initiateur" ? (
                <button
                  className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow transition hover:-translate-y-[1px] hover:bg-emerald-700 disabled:opacity-50"
                  onClick={() => void saveDraft()}
                  disabled={loading || isReadOnly}
                >
                  {selected ? "Enregistrer" : "Enregistrer brouillon"}
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
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Section F</h2>
              {selected ? (
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {STATUT_LABEL[selected.statut] ?? selected.statut}
                </span>
              ) : null}
            </div>

            {!selected ? (
              <p className="text-sm text-slate-600">Sélectionne un document.</p>
            ) : (
              <>
                {role === "approbateur_final" && selected.requires_ano ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                    <p className="text-sm font-semibold">Seuil bailleur dépassé</p>
                    <p className="mt-1 text-xs">
                      Après approbation, le document passera en <span className="font-semibold">En attente ANO</span>.
                    </p>
                  </div>
                ) : null}

                {role === "initiateur" ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <h3 className="text-sm font-bold text-blue-900 mb-1 italic">Circuit de validation</h3>
                      <p className="text-xs text-blue-800 leading-relaxed">
                        {selected.statut === "BROUILLON" || selected.statut === "A_REVOIR"
                          ? "Enregistrer, téléverser le PDF puis soumettre pour lancer la vérification technique."
                          : "Formulaire en lecture seule. Consulte l'historique pour voir les commentaires."}
                      </p>
                    </div>

                    <button
                      className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                      onClick={() => void submitSelected()}
                      disabled={loading || !(selected.statut === "BROUILLON" || selected.statut === "A_REVOIR")}
                    >
                      {selected.statut === "BROUILLON" || selected.statut === "A_REVOIR"
                        ? "Soumettre pour validation"
                        : "Déjà soumis"}
                    </button>

                    <div className="border-t pt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-slate-900">Document PDF (Version {selected.version || 1})</div>
                        {selected.fichier_courant?.fichier_pdf ? (
                          <a
                            href={selected.fichier_courant.fichier_pdf}
                            target="_blank"
                            className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                            rel="noreferrer"
                          >
                            Visualiser le PDF actuel
                          </a>
                        ) : null}
                      </div>

                      <div
                        className={`rounded-xl border-2 border-dashed p-6 text-center ${
                          selected.statut === "BROUILLON" || selected.statut === "A_REVOIR"
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
                            loading || !(selected.statut === "BROUILLON" || selected.statut === "A_REVOIR")
                          }
                        />
                        <label
                          htmlFor="pdf-upload"
                          className={`block cursor-pointer text-sm font-medium ${
                            selected.statut === "BROUILLON" || selected.statut === "A_REVOIR"
                              ? "text-emerald-700"
                              : "text-slate-400"
                          }`}
                        >
                          {pdfFile ? `Fichier sélectionné : ${pdfFile.name}` : "Cliquez pour choisir le fichier PDF (Max 15Mo)"}
                        </label>
                      </div>

                      <button
                        className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 disabled:opacity-50"
                        onClick={() => void uploadPdf()}
                        disabled={
                          loading ||
                          !pdfFile ||
                          !(selected.statut === "BROUILLON" || selected.statut === "A_REVOIR")
                        }
                      >
                        Téléverser PDF
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-slate-900">Décision</div>
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
                  </div>
                )}

                <div className="border-t pt-6 space-y-3">
                  <div className="text-sm font-semibold text-slate-900">Historique</div>
                  {selected.actions_validation?.length ? (
                    <div className="space-y-2">
                      {selected.actions_validation.map((a) => (
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
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
