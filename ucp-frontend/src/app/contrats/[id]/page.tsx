"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AlertCircle, FileText, Download } from "lucide-react";
import { getPublicContrat, downloadPublicDocument } from "@/services/contractualisation";
import { Contrat } from "@/types/contractualisation";

export default function PublicContratPage() {
  const params = useParams();
  const [contrat, setContrat] = useState<Contrat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const contratId = Number(params?.id);

  useEffect(() => {
    if (!contratId) return;
    loadPublicContrat(contratId);
  }, [contratId]);

  const loadPublicContrat = async (id: number) => {
    try {
      setLoading(true);
      const data = await getPublicContrat(id);
      setContrat(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors du chargement du contrat"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (docId: number) => {
    if (!contrat) return;
    try {
      await downloadPublicDocument(contrat.id, docId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de télécharger le document"
      );
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-500">Chargement du contrat...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 shadow-xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-4">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 mb-2">Erreur</h1>
          <p className="text-sm text-slate-650 mb-6">{error}</p>
          <button
            onClick={() => {
              if (contratId) {
                setError(null);
                loadPublicContrat(contratId);
              }
            }}
            className="w-full inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow hover:bg-slate-800 transition"
          >
            Réessayer
          </button>
        </div>
      </main>
    );
  }

  if (!contrat) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-105 text-slate-600 mb-4">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 mb-2">Contrat non trouvé</h1>
          <p className="text-sm text-slate-650">Ce contrat n&apos;existe pas ou n&apos;est pas disponible au téléchargement.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#f6faf8_0%,transparent_25%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] pb-12 text-slate-800 antialiased">
      {/* Top Banner / Navbar */}
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block leading-none">
                UCP e-Procurement
              </span>
              <span className="text-sm font-bold text-slate-850">Portail Prestataire</span>
            </div>
          </div>
          <span className="rounded-full border border-emerald-250 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {contrat.statut_label || contrat.statut}
          </span>
        </div>
      </header>

      {/* Main content */}
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/40 bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md p-6 sm:p-8 space-y-8 animate-fade-in">
          
          {/* Header section */}
          <div>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Référence du marché
            </span>
            <h1 className="mt-2 text-2xl font-black text-slate-800 tracking-tight">
              {contrat.numero_marche}
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Titulaire : {contrat.nom_prestataire}
            </p>
          </div>

          <hr className="border-slate-150" />

          {/* Details list */}
          <section className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
              Détails du dossier
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Objet du marché
                </span>
                <p className="text-sm font-semibold text-slate-700">
                  {contrat.seance_objet || "—"}
                </p>
              </div>

              <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Montant global (TTC)
                </span>
                <p className="text-base font-bold text-slate-800">
                  {parseFloat(contrat.montant_ttc).toLocaleString("fr-FR")} MGA
                </p>
              </div>

              <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Durée d&apos;exécution
                </span>
                <p className="text-sm font-semibold text-slate-700">
                  {contrat.duree_execution || "—"}
                </p>
              </div>

              {contrat.date_signature && (
                <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Date de signature
                  </span>
                  <p className="text-sm font-semibold text-slate-700">
                    {new Date(contrat.date_signature).toLocaleDateString("fr-FR", {
                      dateStyle: "long",
                    })}
                  </p>
                </div>
              )}

              {contrat.representant_signataire && (
                <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Signataire habilité
                  </span>
                  <p className="text-sm font-semibold text-slate-700">
                    {contrat.representant_signataire}
                  </p>
                </div>
              )}
            </div>
          </section>

          {contrat.clauses_particulieres && (
            <section className="space-y-2">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
                Clauses particulières
              </h2>
              <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4">
                <p className="text-sm text-slate-650 font-semibold whitespace-pre-line leading-relaxed">
                  {contrat.clauses_particulieres}
                </p>
              </div>
            </section>
          )}

          {/* Documents Section */}
          <section className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
              Documents contractuels à télécharger
            </h2>
            {contrat.documents.length === 0 ? (
              <p className="text-sm text-slate-500 italic">
                Aucun document n&apos;est joint à ce dossier.
              </p>
            ) : (
              <div className="space-y-3">
                {contrat.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-col gap-3 justify-between items-start p-4 bg-white border border-slate-200 rounded-2xl shadow-sm sm:flex-row sm:items-center hover:border-emerald-250 transition-colors animate-scale-in"
                  >
                    <div className="min-w-0">
                      <div className="font-black text-sm text-slate-800 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-emerald-650 shrink-0" />
                        {doc.type_document === "CONTRAT_SIGNE"
                          ? "Contrat Initial"
                          : "Avenant"}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 mt-1">
                        Versé le :{" "}
                        {new Date(doc.date_upload).toLocaleDateString("fr-FR", {
                          dateStyle: "medium",
                        })}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownload(doc.id)}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-slate-800 shrink-0 w-full sm:w-auto shadow-md transition-all hover:-translate-y-0.5"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Télécharger PDF
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
