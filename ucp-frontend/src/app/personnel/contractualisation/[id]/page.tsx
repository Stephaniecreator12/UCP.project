"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  DollarSign,
  Download,
  FileText,
  Lock,
  Mail,
  Phone,
  SendHorizontal,
  ShieldCheck,
  Sparkles,
  User,
  Activity,
  Upload,
  Trash,
  Check
} from "lucide-react";
import {
  getContrat,
  sendContrat,
  downloadDocument,
  updateContrat,
  addEcheancier,
  uploadDocument,
} from "@/services/contractualisation";
import { Contrat } from "@/types/contractualisation";
import TopHeader from "@/app/components/TopHeader";

interface DetailPageProps {
  params: { id: string };
}

const statusClassMap: Record<string, string> = {
  BROUILLON: "border-slate-200 bg-slate-50 text-slate-700",
  ATTENTE_SIGNATURE: "border-amber-200 bg-amber-50 text-amber-700",
  EXECUTION: "border-emerald-200 bg-emerald-50 text-emerald-700",
  TERMINE: "border-emerald-200 bg-emerald-100 text-emerald-800",
  SUSPENDU: "border-rose-200 bg-rose-50 text-rose-700",
  ANNULE: "border-rose-300 bg-rose-100 text-rose-800",
};

const labelClass =
  "text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 block mb-1.5";

export default function ContratDetailPage({ params }: DetailPageProps) {
  const router = useRouter();
  const [contrat, setContrat] = useState<Contrat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<
    "formulaire" | "email" | "workflow" | "audit"
  >("formulaire");

  // Form State
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [representant, setRepresentant] = useState("");
  const [dureeExecution, setDureeExecution] = useState("");
  const [clausesParticulieres, setClausesParticulieres] = useState("");
  const [dateSignature, setDateSignature] = useState("");

  // Échéancier Form State
  const [echeancierMontant, setEcheancierMontant] = useState("");
  const [echeancierPourcentage, setEcheancierPourcentage] = useState("");
  const [echeancierEtape, setEcheancierEtape] = useState("");
  const [echeancierDate, setEcheancierDate] = useState("");
  const [addingEcheancier, setAddingEcheancier] = useState(false);

  // Document Upload State
  const [fichier, setFichier] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadContrat();
  }, [params.id]);

  const loadContrat = async () => {
    try {
      setLoading(true);
      const data = await getContrat(parseInt(params.id));
      setContrat(data);
      // Prefill edit state
      setEmail(data.email_prestataire || "");
      setTelephone(data.telephone_prestataire || "");
      setRepresentant(data.representant_signataire || "");
      setDureeExecution(data.duree_execution || "");
      setClausesParticulieres(data.clauses_particulieres || "");
      setDateSignature(data.date_signature || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!contrat) return;
    try {
      setSavingDraft(true);
      setError(null);
      setSuccess(null);
      const updated = await updateContrat(contrat.id, {
        email_prestataire: email,
        telephone_prestataire: telephone,
        representant_signataire: representant,
        duree_execution: dureeExecution,
        clauses_particulieres: clausesParticulieres,
        date_signature: dateSignature || undefined,
      });
      setContrat(updated);
      setSuccess("Brouillon sauvegardé avec succès !");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSendContrat = async () => {
    if (!contrat) return;
    try {
      setSending(true);
      setError(null);
      setSuccess(null);
      const updated = await sendContrat(contrat.id);
      setContrat(updated);
      setSuccess("Contrat validé et envoyé au prestataire avec succès !");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer le contrat");
    } finally {
      setSending(false);
    }
  };

  const handleDownload = async (docId: number) => {
    if (!contrat) return;
    try {
      await downloadDocument(contrat.id, docId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de téléchargement");
    }
  };

  const handleAddEcheancier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contrat) return;
    try {
      setAddingEcheancier(true);
      setError(null);
      setSuccess(null);
      await addEcheancier(contrat.id, {
        montant: echeancierMontant,
        pourcentage: parseInt(echeancierPourcentage),
        etape: echeancierEtape,
        date_prevue: echeancierDate,
      });
      // reload contract details to get updated list
      const updated = await getContrat(contrat.id);
      setContrat(updated);
      // Clear fields
      setEcheancierMontant("");
      setEcheancierPourcentage("");
      setEcheancierEtape("");
      setEcheancierDate("");
      setSuccess("Ligne d'échéancier ajoutée !");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'ajout");
    } finally {
      setAddingEcheancier(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!contrat || !fichier) return;
    try {
      setUploading(true);
      setError(null);
      setSuccess(null);
      await uploadDocument(contrat.id, fichier);
      const updated = await getContrat(contrat.id);
      setContrat(updated);
      setFichier(null);
      setSuccess("Document importé avec succès !");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800">
        <TopHeader />
        <div className="mx-auto max-w-[1680px] px-4 py-6 sm:px-6 lg:px-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
            Chargement du contrat...
          </div>
        </div>
      </main>
    );
  }

  if (!contrat) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800">
        <TopHeader />
        <div className="mx-auto max-w-[1680px] px-4 py-6 sm:px-6 lg:px-10">
          <div className="rounded-2xl border border-rose-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-bold text-slate-900">Contrat indisponible</h1>
            <p className="mt-2 text-sm text-slate-600">Le contrat n&apos;a pas pu être trouvé.</p>
            <button
              onClick={() => router.back()}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </button>
          </div>
        </div>
      </main>
    );
  }

  const isDraft = contrat.statut === "BROUILLON";

  // Calculate échéancier sums
  const totalEcheancier = contrat.echeancier.reduce(
    (sum, item) => sum + parseFloat(item.montant),
    0
  );
  const totalPourcentage = contrat.echeancier.reduce(
    (sum, item) => sum + item.pourcentage,
    0
  );
  const totalTTC = parseFloat(contrat.montant_ttc);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#f6faf8_0%,transparent_25%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] pb-12 text-slate-800 antialiased selection:bg-emerald-200">
      <TopHeader />

      <div className="zoom-content mx-auto mt-2 max-w-[1680px] px-4 pb-12 pt-6">
        {/* Header Block */}
        <div className="group relative flex w-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_8px_24px_rgb(0,0,0,0.035)] md:flex-row md:items-center mb-6">
          <div className="absolute right-0 top-0 -z-10 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 opacity-50 blur-3xl transition-transform duration-700 group-hover:scale-110" />

          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  Dossier Contractuel NOTI5
                </span>
                <span
                  className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${
                    statusClassMap[contrat.statut] || "border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                >
                  {contrat.statut_label}
                </span>
              </div>
              <h1 className="mt-0.5 text-lg font-black tracking-tight text-slate-800">
                {contrat.numero_marche}
              </h1>
              <p className="text-[12px] font-semibold text-slate-500">
                Marché attribué à : {contrat.nom_prestataire || contrat.offre_soumissionnaire}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <button
              onClick={() => router.push("/personnel/contractualisation")}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour au Dashboard
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-800 mb-6 text-sm flex items-center gap-2 shadow-sm animate-pulse">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <div>{error}</div>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-800 mb-6 text-sm flex items-center gap-2 shadow-sm animate-fade-in">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>{success}</div>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex gap-2 border-b border-slate-200 mb-6 pb-px overflow-x-auto">
          {(["formulaire", "email", "workflow", "audit"] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                  isActive
                    ? "border-emerald-600 text-emerald-700 font-black"
                    : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                {tab === "formulaire" && "Formulaire NOTI5"}
                {tab === "email" && "Email prestataire"}
                {tab === "workflow" && "Workflow"}
                {tab === "audit" && "Audit Trail"}
              </button>
            );
          })}
        </div>

        {/* TAB: FORMULAIRE (TOUT-EN-UN) */}
        {activeTab === "formulaire" && (
          <div className="flex flex-col gap-6">
            {/* Section 1: En-tête (Locked) */}
            <section className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm">
              <div className="absolute left-0 top-0 h-1.5 w-full bg-slate-300" />
              <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-6">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-black text-slate-600">
                  1
                </span>
                En-tête — informations verrouillées (Issues de l&apos;évaluation)
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className={labelClass}>Numéro de marché</span>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600">
                    <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {contrat.numero_marche}
                  </div>
                </div>
                <div>
                  <span className={labelClass}>Type de procédure</span>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600">
                    <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    AOI — Appel d&apos;offres international
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <span className={labelClass}>Objet du marché</span>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600">
                    <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {contrat.seance_objet}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Parties prenantes (Editable if Draft) */}
            <section className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md p-6">
              <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />
              <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-2 mb-6">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white">
                  2
                </span>
                Parties prenantes
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <span className={labelClass}>Nom du prestataire</span>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600">
                    <Lock className="h-3.5 w-3.5 text-slate-450 shrink-0" />
                    {contrat.nom_prestataire}
                  </div>
                </div>
                <div>
                  <span className={labelClass}>NIF / STAT</span>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600">
                    <Lock className="h-3.5 w-3.5 text-slate-450 shrink-0" />
                    {contrat.nif_prestataire || "—"} / {contrat.stat_prestataire || "—"}
                  </div>
                </div>
                <div>
                  <span className={labelClass}>Email prestataire</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isDraft}
                    placeholder="Ex: contact@prestataire.mg"
                    className="w-full rounded-xl border border-slate-250 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
                <div>
                  <span className={labelClass}>Téléphone prestataire</span>
                  <input
                    type="tel"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    disabled={!isDraft}
                    placeholder="Ex: +261 34 00 000 00"
                    className="w-full rounded-xl border border-slate-255 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
                <div>
                  <span className={labelClass}>Représentant signataire</span>
                  <input
                    type="text"
                    value={representant}
                    onChange={(e) => setRepresentant(e.target.value)}
                    disabled={!isDraft}
                    placeholder="Ex: M. RAKOTO Jean"
                    className="w-full rounded-xl border border-slate-255 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
              </div>
            </section>

            {/* Section 3: Informations contractuelles */}
            <section className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md p-6">
              <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />
              <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-2 mb-6">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white">
                  3
                </span>
                Informations contractuelles
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className={labelClass}>Montant TTC contractuel (MGA)</span>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-650">
                    <Lock className="h-3.5 w-3.5 text-slate-450 shrink-0" />
                    {totalTTC.toLocaleString("fr-FR")} MGA
                  </div>
                </div>
                <div>
                  <span className={labelClass}>Date de signature</span>
                  <input
                    type="date"
                    value={dateSignature}
                    onChange={(e) => setDateSignature(e.target.value)}
                    disabled={!isDraft}
                    className="w-full rounded-xl border border-slate-255 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
                <div>
                  <span className={labelClass}>Durée d&apos;exécution</span>
                  <input
                    type="text"
                    value={dureeExecution}
                    onChange={(e) => setDureeExecution(e.target.value)}
                    disabled={!isDraft}
                    placeholder="Ex: 3 mois"
                    className="w-full rounded-xl border border-slate-255 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <span className={labelClass}>Clauses particulières</span>
                  <textarea
                    value={clausesParticulieres}
                    onChange={(e) => setClausesParticulieres(e.target.value)}
                    disabled={!isDraft}
                    rows={4}
                    placeholder="Saisissez les clauses spécifiques du contrat de marché..."
                    className="w-full rounded-xl border border-slate-255 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
              </div>
            </section>

            {/* Section 4: Échéancier de paiement */}
            <section className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md p-6">
              <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />
              <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-2 mb-4">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white">
                  4
                </span>
                Échéancier de paiement
              </h2>

              <div className="mb-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
                <span>Total Marché : <strong className="text-slate-850">{totalTTC.toLocaleString("fr-FR")} MGA</strong></span>
                <span>Planifié : <strong className="text-emerald-700">{totalEcheancier.toLocaleString("fr-FR")} MGA ({totalPourcentage}%)</strong></span>
                {totalPourcentage !== 100 && (
                  <span className="text-amber-600 animate-pulse">
                    ⚠ Le total de l&apos;échéancier doit être égal à 100% (actuel : {totalPourcentage}%)
                  </span>
                )}
              </div>

              {/* Payments Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-150 bg-white mb-6">
                <table className="w-full text-left table-auto">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 text-center">
                      <th className="px-4 py-3 text-left">Étape / Jalons</th>
                      <th className="px-4 py-3 text-right">Montant (MGA)</th>
                      <th className="px-4 py-3 text-right">Pourcentage</th>
                      <th className="px-4 py-3 text-center">Date prévue</th>
                      <th className="px-4 py-3 text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contrat.echeancier.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-xs font-semibold text-slate-400 italic">
                          Aucun versement n&apos;est programmé.
                        </td>
                      </tr>
                    ) : (
                      contrat.echeancier.map((e) => (
                        <tr key={e.id} className="border-b last:border-b-0 align-middle text-sm text-slate-700 border-slate-100 hover:bg-slate-50/40">
                          <td className="px-4 py-3.5 font-bold text-slate-800">{e.etape}</td>
                          <td className="px-4 py-3.5 text-right font-black text-slate-800">
                            {parseFloat(e.montant).toLocaleString("fr-FR")} MGA
                          </td>
                          <td className="px-4 py-3.5 text-right font-bold text-slate-500">{e.pourcentage}%</td>
                          <td className="px-4 py-3.5 text-center font-semibold text-slate-500">
                            {new Date(e.date_prevue).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                              {e.statut}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add New Echeancier Line if Draft */}
              {isDraft && (
                <form onSubmit={handleAddEcheancier} className="bg-slate-50/60 border border-slate-200/60 rounded-2xl p-4">
                  <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">Ajouter une ligne d&apos;échéancier</h3>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block mb-1">Libellé de l&apos;étape</span>
                      <input
                        type="text"
                        required
                        value={echeancierEtape}
                        onChange={(e) => setEcheancierEtape(e.target.value)}
                        placeholder="Ex: Réception provisoire"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block mb-1">Montant (MGA)</span>
                      <input
                        type="number"
                        required
                        step="0.01"
                        value={echeancierMontant}
                        onChange={(e) => setEcheancierMontant(e.target.value)}
                        placeholder="Ex: 5000000"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block mb-1">Pourcentage (%)</span>
                      <input
                        type="number"
                        required
                        min="1"
                        max="100"
                        value={echeancierPourcentage}
                        onChange={(e) => setEcheancierPourcentage(e.target.value)}
                        placeholder="Ex: 20"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block mb-1">Date d&apos;échéance</span>
                      <input
                        type="date"
                        required
                        value={echeancierDate}
                        onChange={(e) => setEcheancierDate(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={addingEcheancier}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow hover:bg-slate-800 transition-all"
                  >
                    {addingEcheancier ? "Ajout..." : "+ Ajouter la ligne"}
                  </button>
                </form>
              )}
            </section>

            {/* Section 5: Upload du contrat signé */}
            <section className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md p-6">
              <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />
              <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-2 mb-6">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white">
                  5
                </span>
                Dossier de documents joints (PDF)
              </h2>

              {isDraft && (
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center mb-6 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFichier(e.target.files?.[0] || null)}
                    className="hidden"
                    id="doc-upload-file"
                  />
                  <label htmlFor="doc-upload-file" className="cursor-pointer flex flex-col items-center">
                    <Upload className="h-8 w-8 text-slate-400 mb-2" />
                    <div className="text-slate-600">
                      {fichier ? (
                        <>
                          <div className="font-bold text-emerald-600">✓ {fichier.name}</div>
                          <div className="text-xs">({(fichier.size / 1024 / 1024).toFixed(2)} MB)</div>
                        </>
                      ) : (
                        <>
                          <div className="font-bold mb-1">Glissez-déposer le document contractuel PDF ici</div>
                          <div className="text-xs text-slate-450">Fichier PDF obligatoire · Max 50 Mo</div>
                        </>
                      )}
                    </div>
                  </label>

                  {fichier && (
                    <button
                      onClick={handleUploadDocument}
                      disabled={uploading}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-xs font-black uppercase tracking-widest text-white shadow-md hover:bg-slate-800 transition"
                    >
                      {uploading ? "Importation..." : "📤 Importer le document"}
                    </button>
                  )}
                </div>
              )}

              {/* Uploaded Documents List */}
              {contrat.documents.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Documents versés au dossier</h3>
                  {contrat.documents.map((doc) => (
                    <div key={doc.id} className="flex flex-col gap-3 justify-between items-start p-4 bg-white border border-slate-200 rounded-2xl shadow-sm sm:flex-row sm:items-center hover:border-emerald-250 transition-colors">
                      <div className="min-w-0">
                        <div className="font-black text-sm text-slate-800 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-emerald-650 shrink-0" />
                          {doc.type_document === "CONTRAT_SIGNE" ? "Contrat Initial" : "Avenant"}
                        </div>
                        <div className="text-[10px] font-semibold text-slate-400 mt-1 font-mono truncate max-w-md">
                          SHA-256: {doc.hash_sha256}
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 mt-0.5">
                          Versé le : {new Date(doc.date_upload).toLocaleDateString("fr-FR", { dateStyle: "medium" })}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDownload(doc.id)}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-xs font-black uppercase tracking-widest text-emerald-700 hover:bg-emerald-100 shrink-0 w-full sm:w-auto"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Télécharger PDF
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Bottom Actions Bar */}
            {isDraft && (
              <div className="flex flex-wrap justify-between items-center gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 mt-4">
                <button
                  onClick={handleSaveDraft}
                  disabled={savingDraft}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-xs font-black uppercase tracking-widest text-slate-700 shadow-sm transition-all hover:bg-slate-50"
                >
                  {savingDraft ? "Sauvegarde..." : "Sauvegarder brouillon"}
                </button>

                <button
                  onClick={handleSendContrat}
                  disabled={
                    sending ||
                    !email ||
                    contrat.documents.length === 0 ||
                    totalPourcentage !== 100
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <SendHorizontal className="h-4 w-4" />
                  {sending ? "Envoi..." : "Envoyer au prestataire"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB: EMAIL PREVIEW */}
        {activeTab === "email" && (
          <section className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.05)] p-6">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-800 mb-2">
              Aperçu de la notification mail
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Ce message sera envoyé automatiquement au prestataire avec le lien de signature sécurisé.
            </p>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 mb-4 text-xs font-medium text-slate-600 space-y-2">
              <div>
                <strong>De :</strong> noreply@ucp.mg
              </div>
              <div>
                <strong>À :</strong> {email || <span className="text-rose-500 italic">Adresse e-mail manquante</span>}
              </div>
              <div>
                <strong>Objet :</strong> [UCP Contractualisation] Contrat marché {contrat.numero_marche} — À signer
              </div>
            </div>

            {/* Simulated Email Page */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="bg-[#064E3B] p-5 text-white">
                <span className="text-[9px] font-black tracking-widest uppercase opacity-70">Unité de Coordination des Projets</span>
                <h3 className="text-lg font-black mt-1">Notification d&apos;attribution et signature de contrat</h3>
              </div>
              <div className="p-6 text-sm text-slate-700 space-y-4">
                <p>
                  Bonjour <strong>{representant || "M. le Représentant"}</strong>,
                </p>
                <p className="leading-relaxed">
                  Nous avons le plaisir de vous informer que l&apos;offre de votre entreprise{" "}
                  <strong>{contrat.nom_prestataire}</strong> a été retenue pour l&apos;attribution du marché de travaux / fournitures désigné ci-dessous :
                </p>

                {/* Market Summary Table */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                    <span className="text-slate-400">Référence</span>
                    <span className="text-slate-800 font-mono">{contrat.numero_marche}</span>
                    <span className="text-slate-400">Objet du Marché</span>
                    <span className="text-slate-800">{contrat.seance_objet}</span>
                    <span className="text-slate-400">Montant Global Contractuel</span>
                    <span className="text-emerald-700 font-bold">{totalTTC.toLocaleString("fr-FR")} MGA</span>
                    <span className="text-slate-400">Durée d&apos;exécution</span>
                    <span className="text-slate-800">{dureeExecution || "—"}</span>
                  </div>
                </div>

                <p className="leading-relaxed">
                  Veuillez télécharger le document du contrat préparé, apposer votre signature dûment habilitée, et le retourner sur notre portail e-Procurement.
                </p>

                <div className="pt-2">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (contrat.documents.length > 0) {
                        handleDownload(contrat.documents[0].id);
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-700 transition"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger le document du contrat
                  </a>
                </div>
              </div>
              <div className="bg-slate-50 border-t border-slate-100 p-4 text-[10px] text-center text-slate-400">
                Message généré automatiquement par le système e-Procurement UCP. Merci de ne pas y répondre directement.
              </div>
            </div>
          </section>
        )}

        {/* TAB: WORKFLOW STEPS */}
        {activeTab === "workflow" && (
          <section className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.05)] p-6">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-800 mb-2">
              Workflow Contractuel (NOTI5)
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Suivi des jalons de signature et d&apos;exécution du contrat.
            </p>

            <div className="relative border-l-2 border-slate-200 ml-4 pl-8 space-y-6">
              {/* Step 1 */}
              <div className="relative">
                <span className="absolute -left-11 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-[11px] font-black shadow-sm">
                  ✓
                </span>
                <h3 className="text-sm font-bold text-slate-800">Évaluation & Attribution</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Séance clôturée, le prestataire a été désigné vainqueur de l&apos;offre.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <span className="absolute -left-11 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-[11px] font-black shadow-sm">
                  ✓
                </span>
                <h3 className="text-sm font-bold text-slate-800">Ouverture du NOTI5</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Création du dossier en brouillon par la secrétaire.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <span
                  className={`absolute -left-11 top-0 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black shadow-sm ${
                    email && contrat.documents.length > 0
                      ? "bg-emerald-500 text-white"
                      : "bg-amber-500 text-white"
                  }`}
                >
                  {email && contrat.documents.length > 0 ? "✓" : "3"}
                </span>
                <h3 className="text-sm font-bold text-slate-800">Compléter les sections</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enregistrement des parties prenantes, clauses, échéancier et versement du PDF.
                </p>
              </div>

              {/* Step 4 */}
              <div className="relative">
                <span
                  className={`absolute -left-11 top-0 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black shadow-sm ${
                    contrat.statut !== "BROUILLON" ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {contrat.statut !== "BROUILLON" ? "✓" : "4"}
                </span>
                <h3 className="text-sm font-bold text-slate-800">Envoyer au prestataire</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Validation du dossier et envoi automatique de la notification mail avec lien sécurisé.
                </p>
              </div>

              {/* Step 5 */}
              <div className="relative">
                <span
                  className={`absolute -left-11 top-0 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black shadow-sm ${
                    contrat.statut === "EXECUTION" || contrat.statut === "TERMINE"
                      ? "bg-emerald-500 text-white"
                      : contrat.statut === "ATTENTE_SIGNATURE"
                      ? "bg-amber-500 text-white animate-pulse"
                      : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {contrat.statut === "EXECUTION" || contrat.statut === "TERMINE" ? "✓" : "5"}
                </span>
                <h3 className="text-sm font-bold text-slate-800">Réception & Signature du Prestataire</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Le prestataire télécharge, signe et retourne le document contractuel revêtu de sa signature.
                </p>
              </div>

              {/* Step 6 */}
              <div className="relative">
                <span
                  className={`absolute -left-11 top-0 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black shadow-sm ${
                    contrat.statut === "EXECUTION" || contrat.statut === "TERMINE"
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-400"
                  }`}
                >
                  6
                </span>
                <h3 className="text-sm font-bold text-slate-800">En Exécution</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Le contrat signé est enregistré, le statut est verrouillé en exécution.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* TAB: AUDIT TRAIL */}
        {activeTab === "audit" && (
          <section className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.05)] p-6">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-2 mb-6">
              <Activity className="h-4 w-4 text-slate-500" />
              Journal d&apos;audit du contrat
            </h2>

            {contrat.audit_trail.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                Aucune entrée d&apos;audit répertoriée.
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
                {contrat.audit_trail.map((entry) => (
                  <div key={entry.id} className="relative pl-12">
                    <div className="absolute left-4 top-1.5 h-4.5 w-4.5 -translate-x-1/2 rounded-full border-4 border-white bg-emerald-500 shadow-sm" />

                    <div className="p-4 bg-white border border-slate-200/60 rounded-2xl shadow-sm">
                      <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                        <div className="font-bold text-sm text-slate-800">{entry.action_label}</div>
                        <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(entry.timestamp).toLocaleString("fr-FR")}
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-slate-500 mb-2">
                        Par : <span className="font-bold text-slate-700">{entry.utilisateur_nom}</span>
                      </div>
                      {entry.description && (
                        <div className="text-xs text-slate-600 bg-slate-50 rounded-xl p-2.5 mb-2">
                          {entry.description}
                        </div>
                      )}
                      {entry.champ_modifie && (
                        <div className="text-[10px] bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-mono mt-2">
                          <div className="text-slate-500 font-semibold mb-1">
                            Champ : {entry.champ_modifie}
                          </div>
                          <div className="text-rose-600">- {entry.ancienne_valeur}</div>
                          <div className="text-emerald-700">+ {entry.nouvelle_valeur}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
