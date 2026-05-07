"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FilePlus2, Loader2, Save, SendHorizontal, Upload } from "lucide-react";

import TopHeader from "@/app/components/TopHeader";
import {
  FINANCE_FAMILY_OPTIONS,
  findFinanceCatalogEntry,
  getFinanceCatalogByFamily,
  getFinanceCatalogByOptionKey,
} from "@/lib/financeCatalog";
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
  role?: string;
};

const CATEGORY_OPTIONS = [
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
] as const;

const PROCEDURE_OPTIONS = [
  ["DC", "DC"],
  ["AOI", "AOI"],
  ["AON", "AON"],
  ["GRE_A_GRE", "Gré à gré"],
] as const;

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

export default function TdrStNewPage() {
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
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const saving = savingAction !== null;

  const isEditable = !activeDoc || EDITABLE_STATUSES.has(activeDoc.statut);
  const isLinkedToDemande = Boolean(activeDoc?.demande_achat_id || linkedDemande?.id || demandeId);
  const hasUploadedPdf = Boolean(activeDoc?.fichier_courant?.fichier_pdf);
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
      router.replace("/login");
      return;
    }

    const loadPage = async () => {
      setLoading(true);
      setError(null);
      try {
        const me = await fetchJson<MeResponse>("/api/users/me/", { method: "GET" });
        const currentRole = me.role ?? null;
        setRole(currentRole);

        if (currentRole && currentRole !== "demandeur" && currentRole !== "initiateur") {
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
    router.push("/TdrSt/formulaire");
  };

  const handleChange = <K extends keyof TdrStFormState>(key: K, value: TdrStFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = (mode: "draft" | "submit") => {
    if (!form.unite_technique.trim()) return "Le champ unité technique est obligatoire.";
    if (!form.type_document) return "Le type de document est obligatoire.";
    if (!form.categorie_activite) return "Choisissez la catégorie d'activité.";
    if (!form.intitule.trim()) return "Le champ intitulé est obligatoire.";
    if (!form.reference_ptba.trim()) return "Le champ référence PTBA est obligatoire.";
    if (!form.periode_debut) return "La date de début est obligatoire.";
    if (!form.periode_fin) return "La date de fin est obligatoire.";
    if (mode === "submit" && !form.sources_financement.trim()) return "La source de financement est obligatoire.";
    if (mode === "submit" && !form.ligne_budgetaire.trim()) return "La ligne budgétaire est obligatoire.";
    if (!form.montant_estime_usd.trim()) return "Le montant estimé est obligatoire.";
    return null;
  };

  const buildPayload = () => ({
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
  });

  const saveDraftDocument = async () => {
    const validationError = validateForm("draft");
    if (validationError) {
      throw new Error(validationError);
    }

    return await fetchJson<TdrStDocument>(
      isEditMode ? `/api/TdrSt/documents/${documentId}/` : "/api/TdrSt/documents/",
      {
        method: isEditMode ? "PATCH" : "POST",
        body: JSON.stringify(buildPayload()),
      },
    );
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
      const savedDoc = await saveDraftDocument();

      if (mode === "submit" && !savedDoc.fichier_courant?.fichier_pdf) {
        throw new Error("Televerse un PDF avant d'envoyer le document en validation.");
      }

      const finalDoc =
        mode === "submit"
          ? await fetchJson<TdrStDocument>(`/api/TdrSt/documents/${savedDoc.id}/submit/`, {
              method: "POST",
            })
          : savedDoc;

      router.replace(`/TdrSt/formulaire?focus=${finalDoc.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingAction(null);
    }
  };

  const MAX_PDF_SIZE_MB = 15;
  const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024;

  const uploadPdfForDocument = async (docId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const token = getToken();
    
    const response = await fetch(`/api/TdrSt/documents/${docId}/upload/`, {
      method: "POST",
      headers: token ? {
        'Authorization': `Bearer ${token}`,
      } : {},
      body: formData,
    });

    if (!response.ok) {
      // Ne pas essayer de parser le corps, juste lancer une erreur simple
      throw new Error(`Erreur lors de l'upload: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data?.document) {
      throw new Error("Réponse invalide du serveur");
    }
    
    return data.document;
  };

  const handlePdfFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Seuls les fichiers PDF sont acceptes.");
      return;
    }
    
    if (file.size > MAX_PDF_SIZE_BYTES) {
      setError(`Le fichier est trop volumineux. Taille maximale: ${MAX_PDF_SIZE_MB} Mo.`);
      return;
    }

    if (isEditMode && !isEditable) {
      setError("Ce document n'est plus modifiable.");
      return;
    }

    setUploadingPdf(true);
    setError(null);
    
    try {
      let docToUpload = activeDoc;
      
      if (!docToUpload) {
        const validationError = validateForm("draft");
        if (validationError) {
          throw new Error(validationError);
        }
        
        docToUpload = await fetchJson<TdrStDocument>("/api/TdrSt/documents/", {
          method: "POST",
          body: JSON.stringify(buildPayload()),
        });
        setActiveDoc(docToUpload);
      }
      
      // Upload du PDF
      const uploadedDoc = await uploadPdfForDocument(docToUpload.id, file);
      
      // 🔥 MISE À JOUR IMMÉDIATE DE L'ÉTAT LOCAL
      setActiveDoc(uploadedDoc);
      
      setError(null);

    } catch (e: unknown) {
      console.error("Upload error details:", e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploadingPdf(false);
    }
  };

  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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

        {showError && error && (
          <div
            className={`fixed bottom-[20px] right-6 z-[100] min-w-[220px] max-w-[340px] rounded-[10px] border px-[0.8rem] py-[0.65rem] font-semibold shadow-lg transition-opacity duration-200 animate-saveMessageSlide bg-[#fde9e9] border-[#f6c8c8] text-[#8d2525]`}
            style={{ animationDuration: "0.5s" }}
          >
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
                    <option value="TDR">TDR</option>
                    <option value="ST">ST</option>
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
                    {CATEGORY_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
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
                    {PROCEDURE_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
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
                    <option value="JOURS">Jours</option>
                    <option value="MOIS">Mois</option>
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
                      setSelectedSourceFamily(e.target.value);
                      handleChange("sources_financement", "");
                      handleChange("ligne_budgetaire", "");
                      handleChange("numero_subvention", "");
                    }}
                    disabled={saving || !isEditable}
                    className={inputClassName}
                  >
                    <option value="" disabled>
                      Sélectionner une source de financement
                    </option>
                    {FINANCE_FAMILY_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
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
                <Field label="Montant estimé (MGA) *">
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

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Document PDF</h2>
                  <p className="text-sm text-slate-500">
                    Le PDF est obligatoire avant l'envoi en validation. Taille maximale: {MAX_PDF_SIZE_MB} Mo.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {hasUploadedPdf ? (
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL || ''}${activeDoc?.fichier_courant?.fichier_pdf}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Voir le PDF (Finale)
                    </a>
                  ) : (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                      PDF manquant
                    </span>
                  )}
                  
                  {/* Afficher la version antérieure si elle existe */}
                  {activeDoc?.versions_fichier && activeDoc.versions_fichier.length > 1 && (
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL || ''}${activeDoc.versions_fichier[1]?.fichier_pdf}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Voir la version antérieure
                    </a>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => pdfInputRef.current?.click()}
                    disabled={saving || uploadingPdf || loading || !isEditable}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {hasUploadedPdf ? "Remplacer le PDF (nouvelle version finale)" : "Téléverser un PDF"}
                  </button>
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handlePdfFileChange}
                    className="hidden"
                  />
                </div>
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
                disabled={saving || loading || uploadingPdf || !isEditable || !hasUploadedPdf}
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
