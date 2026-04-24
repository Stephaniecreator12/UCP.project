"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { getToken } from "@/services/auth";
import { FRENCH_DATE_INPUT_PROPS } from "@/lib/date";

type DocumentType = "TDR" | "ST";
type Statut =
  | "BROUILLON"
  | "SOUMIS"
  | "EN_VALIDATION"
  | "VALIDE"
  | "REJETE"
  | "SUSPENDU";

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
};

const API_PREFIX = "/api/TdR_ST";

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

export default function TdRStPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [documents, setDocuments] = useState<TdrStDocument[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selected = useMemo(
    () => (selectedId ? documents.find((d) => d.id === selectedId) || null : null),
    [documents, selectedId],
  );

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

  const refreshMyDocs = useCallback(async () => {
    const data = await fetchJson<TdrStDocument[]>(`${API_PREFIX}/documents/me/`, { method: "GET" });
    setDocuments(data);
  }, []);

  useEffect(() => {
    setError(null);
    setSuccess(null);
    void refreshMyDocs().catch((e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    });
  }, [refreshMyDocs]);

  const toggleFunding = (source: FundingSource) => {
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
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await fetchJson<TdrStDocument>(`${API_PREFIX}/documents/`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      setDocuments((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setSuccess("Brouillon créé.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const submitSelected = async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await fetchJson<TdrStDocument>(`${API_PREFIX}/documents/${selected.id}/submit/`, {
        method: "POST",
      });
      setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setSuccess("Document soumis.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const uploadPdf = async () => {
    if (!selected) return;
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
        await refreshMyDocs();
      }
      setSuccess("PDF téléversé.");
      setPdfFile(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold">TdR / ST — Téléversement & validation</h1>
          <p className="text-sm text-gray-600">
            Création du brouillon, soumission, et téléversement PDF (max 15 Mo).
          </p>
        </div>

        <div className="min-w-[260px]">
          <label className="block text-sm font-medium mb-1">Mes documents</label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">—</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.numero_document || `#${d.id}`} — {d.statut}
              </option>
            ))}
          </select>
          {selected ? (
            <div className="mt-2 text-xs text-gray-600">
              <div>Type: {selected.type_document}</div>
              <div>Version: {selected.version}</div>
              <div>Intitulé: {selected.intitule}</div>
            </div>
          ) : null}
        </div>
      </div>

      {error ? <div className="ucp-inline-notice ucp-inline-notice--error">{error}</div> : null}
      {success ? (
        <div className="ucp-inline-notice ucp-inline-notice--success">{success}</div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-lg p-5 space-y-4">
          <h2 className="text-lg font-semibold">Nouveau brouillon</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium">Unité technique *</span>
              <input
                className="mt-1 w-full border rounded-md px-3 py-2"
                value={form.unite_technique}
                onChange={(e) => setForm((p) => ({ ...p, unite_technique: e.target.value }))}
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium">Type de document *</span>
              <select
                className="mt-1 w-full border rounded-md px-3 py-2"
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
                className="mt-1 w-full border rounded-md px-3 py-2"
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
                className="mt-1 w-full border rounded-md px-3 py-2"
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
              className="mt-1 w-full border rounded-md px-3 py-2"
              value={form.intitule}
              onChange={(e) => setForm((p) => ({ ...p, intitule: e.target.value }))}
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium">Référence PTBA *</span>
              <input
                className="mt-1 w-full border rounded-md px-3 py-2"
                value={form.reference_ptba}
                onChange={(e) => setForm((p) => ({ ...p, reference_ptba: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium">Ligne budgétaire *</span>
              <input
                className="mt-1 w-full border rounded-md px-3 py-2"
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
                {...FRENCH_DATE_INPUT_PROPS}
                className="mt-1 w-full border rounded-md px-3 py-2"
                value={form.periode_debut}
                onChange={(e) => setForm((p) => ({ ...p, periode_debut: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium">Période (fin) *</span>
              <input
                type="date"
                {...FRENCH_DATE_INPUT_PROPS}
                className="mt-1 w-full border rounded-md px-3 py-2"
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
                className="mt-1 w-full border rounded-md px-3 py-2"
                value={form.duree_estimee_valeur}
                onChange={(e) => setForm((p) => ({ ...p, duree_estimee_valeur: Number(e.target.value) }))}
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium">Unité *</span>
              <select
                className="mt-1 w-full border rounded-md px-3 py-2"
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
              className="mt-1 w-full border rounded-md px-3 py-2"
              value={form.montant_estime_usd}
              onChange={(e) => setForm((p) => ({ ...p, montant_estime_usd: e.target.value }))}
            />
          </label>

          <div className="space-y-2">
            <div className="text-sm font-medium">Sources de financement *</div>
            <div className="flex flex-wrap gap-4">
              {(["Fonds mondial", "Banque mondiale", "Alliance GAVI"] as const).map((s) => (
                <label key={s} className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
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
              className="mt-1 w-full border rounded-md px-3 py-2"
              value={form.numero_subvention}
              onChange={(e) => setForm((p) => ({ ...p, numero_subvention: e.target.value }))}
            />
          </label>

          <div className="flex gap-3">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
              onClick={() => void saveDraft()}
              disabled={loading}
            >
              Enregistrer brouillon
            </button>
            <button
              className="border px-4 py-2 rounded-md disabled:opacity-50"
              onClick={() => void refreshMyDocs()}
              disabled={loading}
            >
              Rafraîchir liste
            </button>
          </div>
        </div>

        <div className="border rounded-lg p-5 space-y-4">
          <h2 className="text-lg font-semibold">Actions sur document</h2>

          <div className="text-sm text-gray-600">
            Sélectionne un document dans “Mes documents” pour soumettre ou téléverser un PDF.
          </div>

          <div className="flex gap-3">
            <button
              className="bg-emerald-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
              onClick={() => void submitSelected()}
              disabled={loading || !selected}
            >
              Soumettre
            </button>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="text-sm font-medium">Téléversement PDF</div>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
              disabled={!selected || loading}
            />
            <button
              className="bg-indigo-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
              onClick={() => void uploadPdf()}
              disabled={loading || !selected}
            >
              Téléverser
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
