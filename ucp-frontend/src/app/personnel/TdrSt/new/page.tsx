"use client";

import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FilePlus2, Loader2, Save, SendHorizontal } from "lucide-react";

import TopHeader from "@/app/components/TopHeader";
import {
  findFinanceCatalogEntry,
  getFinanceCatalogByFamily,
  getFinanceCatalogByOptionKey,
} from "@/lib/financeCatalog";
import { useReferenceChoices } from "@/hooks/useReferenceChoices";
import { buildTdrDraftPayloadFromDemande } from "@/lib/tdrDraftFromDemande";
import { getToken } from "@/services/auth";
import { getDemandeAchat, type DemandeAchat } from "@/services/achats";
import {
  fetchJson,
  makeEmptyForm,
  type TdrStDocument,
  type TdrStFormState,
} from "../formulaire/hooks/useTdrStData";

type MeResponse = {
  data?: {
    role?: string;
  };
};

const CATEGORY_OPTIONS_FALLBACK = [
  { code: "FORMATION", label: "Formation" },
  { code: "ATELIER", label: "Atelier" },
  { code: "REUNION", label: "Réunion" },
  { code: "REVUE", label: "Revue" },
  { code: "SUPERVISION", label: "Supervision" },
  { code: "ETUDE", label: "Étude" },
  { code: "CONSULTANT", label: "Consultant" },
  { code: "CABINET", label: "Cabinet" },
  { code: "BUREAU_ETUDES", label: "Bureau d'études" },
  { code: "ENTREPRISE", label: "Entreprise" },
  { code: "BIENS", label: "Biens" },
  { code: "TRAVAUX", label: "Travaux" },
];

const PROCEDURE_OPTIONS_FALLBACK = [
  { code: "DC", label: "DC" },
  { code: "AOI", label: "AOI" },
  { code: "AON", label: "AON" },
  { code: "GRE_A_GRE", label: "Gré à gré" },
];

const FINANCING_SOURCE_FALLBACK = [
  { code: "FM", label: "Fonds mondial" },
  { code: "GAVI", label: "Alliance GAVI" },
  { code: "BM", label: "Banque mondiale" },
];

const TYPE_DOCUMENT_TDR_ST_FALLBACK = [
  { code: "TDR", label: "TDR" },
  { code: "ST", label: "ST" },
];

const DUREE_UNITE_FALLBACK = [
  { code: "JOURS", label: "Jours" },
  { code: "MOIS", label: "Mois" },
];

const EDITABLE_STATUSES = new Set(["BROUILLON", "A_REVOIR"]);

const normalizeFundingSource = (value: unknown): string => {
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === "string" && item.trim());
    return typeof first === "string" ? first : "";
  }
  return typeof value === "string" ? value : "";
};

const toFormState = (doc: TdrStDocument): TdrStFormState => ({
  unite_technique: doc.unite_technique || "",
  type_document: doc.type_document,
  categorie_activite: doc.categorie_activite,
  intitule: doc.intitule || "",
  reference_ptba: doc.reference_ptba || "",
  periode_debut: doc.periode_debut || "",
  periode_fin: doc.periode_fin || "",
  duree_estimee_valeur: doc.duree_estimee_valeur || 1,
  duree_estimee_unite: doc.duree_estimee_unite || "MOIS",
  sources_financement: normalizeFundingSource(doc.sources_financement),
  numero_subvention: doc.numero_subvention || "",
  ligne_budgetaire: doc.ligne_budgetaire || "",
  montant_estime_usd: doc.montant_estime_usd?.toString() || "",
  procedure_envisagee: doc.procedure_envisagee || "DC",
});

function TdrStNewPageFallback() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <TopHeader />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-12 w-64 rounded-2xl bg-white shadow-sm" />
          <div className="h-96 rounded-3xl border border-slate-200 bg-white shadow-sm" />
        </div>
      </div>
    </main>
  );
}

export default function TdrStNewPage() {
  return (
    <Suspense fallback={<TdrStNewPageFallback />}>
      <TdrStNewPageContent />
    </Suspense>
  );
}

function TdrStNewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputClassName =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";
  const documentId = useMemo(() => {
    const raw = searchParams.get("id");
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, [searchParams]);
  const demandeId = useMemo(() => {
    const raw = searchParams.get("demandeId");
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, [searchParams]);
  const requestedDocumentType = useMemo(() => {
    const raw = (searchParams.get("docType") || "").trim().toUpperCase();
    return raw === "ST" || raw === "TDR" ? raw : null;
  }, [searchParams]);

  const isEditMode = documentId !== null;
  const [form, setForm] = useState<TdrStFormState>(() => makeEmptyForm());
  const [activeDoc, setActiveDoc] = useState<TdrStDocument | null>(null);
  const [linkedDemande, setLinkedDemande] = useState<DemandeAchat | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingAction, setSavingAction] = useState<"draft" | "submit" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [selectedSourceFamily, setSelectedSourceFamily] = useState("");
  const saving = savingAction !== null;
  const categoryOptions = useReferenceChoices("CATEGORIE_ACTIVITE", CATEGORY_OPTIONS_FALLBACK);
  const procedureTypes = useReferenceChoices("PROCEDURE_TYPE", PROCEDURE_OPTIONS_FALLBACK);
  const financingSources = useReferenceChoices("FINANCING_SOURCE", FINANCING_SOURCE_FALLBACK);
  const typeDocumentChoices = useReferenceChoices("TYPE_DOCUMENT_TDR_ST", TYPE_DOCUMENT_TDR_ST_FALLBACK);
  const dureeUniteChoices = useReferenceChoices("DUREE_UNITE", DUREE_UNITE_FALLBACK);

  const isEditable = !activeDoc || EDITABLE_STATUSES.has(activeDoc.statut);
  const isLinkedToDemande = Boolean(activeDoc?.demande_achat_id || linkedDemande?.id || demandeId);
  const selectedFinanceCatalog = useMemo(
    () =>
      findFinanceCatalogEntry(
        form.sources_financement,
        form.numero_subvention,
        form.ligne_budgetaire,
      ),
    [form.ligne_budgetaire, form.numero_subvention, form.sources_financement],
  );
  const financeLineOptions = useMemo(
    () => getFinanceCatalogByFamily(selectedSourceFamily),
    [selectedSourceFamily],
  );

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    const loadPage = async () => {
      setLoading(true);
      setError(null);
      try {
        const me = await fetchJson<MeResponse>("/api/users/me/", { method: "GET" });
        const currentRole = me?.data?.role ?? null;
        setRole(currentRole);

        if (currentRole && currentRole !== "demandeur" && currentRole !== "initiateur" && currentRole !== "admin") {
          throw new Error("Seul le demandeur peut créer ou modifier un brouillon TDR/ST.");
        }

        if (documentId) {
          const doc = await fetchJson<TdrStDocument>(`/api/TdrSt/documents/${documentId}/`, {
            method: "GET",
            cache: "no-store",
          });
          setActiveDoc(doc);
          setForm(toFormState(doc));
          setSelectedSourceFamily(
            findFinanceCatalogEntry(
              normalizeFundingSource(doc.sources_financement),
              doc.numero_subvention || "",
              doc.ligne_budgetaire || "",
            )?.family || "",
          );
          return;
        }

        if (!demandeId) throw new Error("Le TDR/ST doit être ouvert depuis un dossier état de besoin.");

        const demande = await getDemandeAchat(demandeId);
        setLinkedDemande(demande);

        if (demande.tdr_document_id) {
          const existingDoc = await fetchJson<TdrStDocument>(`/api/TdrSt/documents/${demande.tdr_document_id}/`, {
            method: "GET",
            cache: "no-store",
          });
          setActiveDoc(existingDoc);
          setForm(toFormState(existingDoc));
          setSelectedSourceFamily(
            findFinanceCatalogEntry(
              normalizeFundingSource(existingDoc.sources_financement),
              existingDoc.numero_subvention || "",
              existingDoc.ligne_budgetaire || "",
            )?.family || "",
          );
          setError("Un brouillon TDR/ST existe déjà pour ce dossier. Tu peux le reprendre ci-dessous.");
          return;
        }

        const draftPayload = buildTdrDraftPayloadFromDemande(demande);
        setForm({
          unite_technique: draftPayload.unite_technique,
          type_document:
            (requestedDocumentType as TdrStFormState["type_document"] | null) || draftPayload.type_document,
          categorie_activite: draftPayload.categorie_activite,
          intitule: draftPayload.intitule,
          reference_ptba: draftPayload.reference_ptba,
          periode_debut: draftPayload.periode_debut,
          periode_fin: draftPayload.periode_fin,
          duree_estimee_valeur: draftPayload.duree_estimee_valeur,
          duree_estimee_unite: draftPayload.duree_estimee_unite,
          sources_financement: draftPayload.sources_financement[0] ?? "",
          numero_subvention: draftPayload.numero_subvention ?? "",
          ligne_budgetaire: draftPayload.ligne_budgetaire,
          montant_estime_usd: draftPayload.montant_estime_usd,
          procedure_envisagee: draftPayload.procedure_envisagee,
        });
        setSelectedSourceFamily(
          findFinanceCatalogEntry(
            draftPayload.sources_financement[0] ?? "",
            draftPayload.numero_subvention ?? "",
            draftPayload.ligne_budgetaire,
          )?.family || "",
        );
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };

    void loadPage();
  }, [demandeId, documentId, requestedDocumentType, router]);

  const handleBack = () => {
    router.push("/personnel/TdrSt/formulaire");
  };

  const handleChange = <K extends keyof TdrStFormState>(key: K, value: TdrStFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (!activeDoc || financingSources.length === 0) return;
    const raw = normalizeFundingSource(form.sources_financement);
    if (!raw || selectedSourceFamily === raw) return;
    if (findFinanceCatalogEntry(raw, form.numero_subvention, form.ligne_budgetaire)) return;
    if (financingSources.some((source) => source.code === raw)) {
      setSelectedSourceFamily(raw);
    }
  }, [financingSources, activeDoc, form.sources_financement, form.numero_subvention, form.ligne_budgetaire, selectedSourceFamily]);

  const validateForm = (mode: "draft" | "submit") => {
    if (!form.unite_technique.trim()) return "Le champ unité technique est obligatoire.";
    if (!form.type_document) return "Le type de document est obligatoire.";
    if (!form.categorie_activite) return "Choisissez la catégorie d'activité.";
    if (!form.intitule.trim()) return "Le champ intitulé est obligatoire.";
    if (!form.reference_ptba.trim()) return "Le champ référence PTBA est obligatoire.";
    if (!form.periode_debut) return "La date de début est obligatoire.";
    if (!form.periode_fin) return "La date de fin est obligatoire.";
    if (mode === "submit" && !form.sources_financement.trim()) return "La source de financement est obligatoire.";
    if (mode === "submit" && financeLineOptions.length > 0 && !form.ligne_budgetaire.trim())
      return "La ligne budgétaire est obligatoire.";
    if (!form.montant_estime_usd.trim()) return "Le montant estimé est obligatoire.";
    return null;
  };

  const handleSave = async (mode: "draft" | "submit") => {
    const validationError = validateForm(mode);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (isEditMode && !isEditable) {
      setError("Ce document n'est plus modifiable.");
      return;
    }

    setSavingAction(mode);
    setError(null);
    try {
      const payload = {
        ...form,
        demande_achat_id: activeDoc?.demande_achat_id ?? linkedDemande?.id ?? undefined,
        unite_technique: form.unite_technique.trim(),
        intitule: form.intitule.trim(),
        reference_ptba: form.reference_ptba.trim(),
        ligne_budgetaire: form.ligne_budgetaire.trim(),
        numero_subvention: form.numero_subvention.trim(),
        montant_estime_usd: form.montant_estime_usd.trim(),
        duree_estimee_valeur: Number(form.duree_estimee_valeur) || 1,
        sources_financement: form.sources_financement ? [form.sources_financement] : [],
      };

      const savedDoc = await fetchJson<TdrStDocument>(
        isEditMode ? `/api/TdrSt/documents/${documentId}/` : "/api/TdrSt/documents/",
        {
          method: isEditMode ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );

      const finalDoc =
        mode === "submit"
          ? await fetchJson<TdrStDocument>(`/api/TdrSt/documents/${savedDoc.id}/submit/`, {
              method: "POST",
            })
          : savedDoc;

      router.replace(`/personnel/TdrSt/formulaire?focus=${finalDoc.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopHeader />
      <main className="mx-auto max-w-[1560px] px-4 py-6 sm:px-6 lg:px-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour au tableau
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <FilePlus2 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-[1.9rem] font-bold tracking-tight text-slate-900">
                  {isEditMode ? "Modifier le document TDR/ST" : "Nouveau document TDR/ST"}
                </h1>
                <p className="text-sm text-slate-500">Complétez le document puis enregistrez-le en brouillon ou envoyez-le en validation.</p>
              </div>
            </div>
          </div>

          {role && (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              {role}
            </span>
          )}
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-16 shadow-sm">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {!isEditable && activeDoc ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Ce document est au statut <strong>{activeDoc.statut}</strong> et n&apos;est plus modifiable.
              </div>
            ) : null}

            {isLinkedToDemande ? (
              <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                Document lié au dossier <strong>{activeDoc?.demande_achat_numero || linkedDemande?.numero_demande || "état de besoin"}</strong>.
                Les informations administratives reprises du dossier restent préremplies.
              </div>
            ) : null}

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Informations générales</h2>
                  <p className="text-sm text-slate-500">Les champs marqués d&apos;une étoile sont obligatoires.</p>
                </div>
                {activeDoc?.numero_document ? (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    {activeDoc.numero_document}
                  </span>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Unité technique *">
                  <input
                    value={form.unite_technique}
                    onChange={(e) => handleChange("unite_technique", e.target.value)}
                    disabled={saving || !isEditable || isLinkedToDemande}
                    className={inputClassName}
                  />
                </Field>

                <Field label="Type de document *">
                  <select
                    value={form.type_document}
                    onChange={(e) => handleChange("type_document", e.target.value as TdrStFormState["type_document"])}
                    disabled={saving || !isEditable}
                    className={inputClassName}
                  >
                    {typeDocumentChoices.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Catégorie d'activité *">
                  <select
                    value={form.categorie_activite}
                    onChange={(e) =>
                      handleChange("categorie_activite", e.target.value as TdrStFormState["categorie_activite"])
                    }
                    disabled={saving || !isEditable}
                    className={inputClassName}
                  >
                    <option value="" disabled>
                      Sélectionner une catégorie
                    </option>
                    {categoryOptions.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Procédure envisagée *">
                  <select
                    value={form.procedure_envisagee}
                    onChange={(e) =>
                      handleChange("procedure_envisagee", e.target.value as TdrStFormState["procedure_envisagee"])
                    }
                    disabled={saving || !isEditable}
                    className={inputClassName}
                  >
                    {procedureTypes.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
              <div className="grid grid-cols-1 gap-5">
                <Field label="Intitulé du document *">
                  <textarea
                    rows={4}
                    value={form.intitule}
                    onChange={(e) => handleChange("intitule", e.target.value)}
                    disabled={saving || !isEditable || isLinkedToDemande}
                    className={`${inputClassName} min-h-[110px] resize-y`}
                  />
                  {isLinkedToDemande ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Repris automatiquement de l&apos;objet de l&apos;état de besoins.
                    </p>
                  ) : null}
                </Field>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Référence PTBA *">
                  <input
                    value={form.reference_ptba}
                    onChange={(e) => handleChange("reference_ptba", e.target.value)}
                    disabled={saving || !isEditable || isLinkedToDemande}
                    className={inputClassName}
                  />
                </Field>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Période début *">
                  <input
                    type="date"
                    value={form.periode_debut}
                    onChange={(e) => handleChange("periode_debut", e.target.value)}
                    disabled={saving || !isEditable}
                    className={inputClassName}
                  />
                </Field>

                <Field label="Période fin *">
                  <input
                    type="date"
                    value={form.periode_fin}
                    onChange={(e) => handleChange("periode_fin", e.target.value)}
                    disabled={saving || !isEditable}
                    className={inputClassName}
                  />
                </Field>

                <Field label="Durée estimée *">
                  <input
                    type="number"
                    min={1}
                    value={form.duree_estimee_valeur}
                    onChange={(e) => handleChange("duree_estimee_valeur", Number(e.target.value) || 1)}
                    disabled={saving || !isEditable}
                    className={inputClassName}
                  />
                </Field>

                <Field label="Unité de durée *">
                  <select
                    value={form.duree_estimee_unite}
                    onChange={(e) =>
                      handleChange("duree_estimee_unite", e.target.value as TdrStFormState["duree_estimee_unite"])
                    }
                    disabled={saving || !isEditable}
                    className={inputClassName}
                  >
                    {dureeUniteChoices.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Source de financement *">
                  <select
                    value={selectedSourceFamily}
                    onChange={(e) => {
                      const family = e.target.value;
                      setSelectedSourceFamily(family);
                      handleChange("sources_financement", "");
                      handleChange("ligne_budgetaire", "");
                      handleChange("numero_subvention", "");
                      if (family && getFinanceCatalogByFamily(family).length === 0) {
                        handleChange("sources_financement", family);
                      }
                    }}
                    disabled={saving || !isEditable}
                    className={inputClassName}
                  >
                    <option value="" disabled>
                      Sélectionner une source de financement
                    </option>
                    {financingSources.map((source) => (
                      <option key={source.code} value={source.code}>
                        {source.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Ligne budgétaire *">
                  <select
                    value={selectedFinanceCatalog?.optionKey || ""}
                    onChange={(e) => {
                      const nextCatalog = getFinanceCatalogByOptionKey(e.target.value);
                      handleChange("sources_financement", nextCatalog?.value || "");
                      handleChange("ligne_budgetaire", nextCatalog?.budgetLabel || "");
                      handleChange("numero_subvention", nextCatalog?.subvention || "");
                    }}
                    disabled={saving || !isEditable || !selectedSourceFamily}
                    className={inputClassName}
                  >
                    <option value="" disabled>
                      {selectedSourceFamily
                        ? "Sélectionner une ligne budgétaire"
                        : "Choisissez d'abord la source de financement"}
                    </option>
                    {financeLineOptions.map((item) => (
                      <option key={item.optionKey} value={item.optionKey}>
                        {item.budgetLabel}
                        {financeLineOptions.filter((line) => line.budgetLabel === item.budgetLabel).length > 1
                          ? ` - ${item.subvention}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Montant estimé (USD) *">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.montant_estime_usd}
                    onChange={(e) => handleChange("montant_estime_usd", e.target.value)}
                    disabled={saving || !isEditable || isLinkedToDemande}
                    className={inputClassName}
                  />
                </Field>

                <Field label="Numéro de subvention">
                  <input
                    value={form.numero_subvention}
                    readOnly
                    disabled
                    className={inputClassName}
                  />
                </Field>
              </div>
            </section>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void handleSave("draft")}
                disabled={saving || loading || !isEditable}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingAction === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isEditMode ? "Enregistrer le brouillon" : "Créer le brouillon"}
              </button>
              <button
                type="button"
                onClick={() => void handleSave("submit")}
                disabled={saving || loading || !isEditable}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingAction === "submit" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SendHorizontal className="h-4 w-4" />
                )}
                Enregistrer et envoyer
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
