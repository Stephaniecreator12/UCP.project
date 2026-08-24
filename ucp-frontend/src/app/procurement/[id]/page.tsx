"use client"
import { getMarketById } from "@/services/procurement";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProcurementMarket } from "@/types/procurement";
import TopHeader from "@/app/components/TopHeader";
import { UpdateMarketButton } from "../components/updateButton";
import { getServerFileName } from "@/lib/utils";
import { FileText, Calendar, Download, ArrowLeft, Layers } from "lucide-react";

export default function ProcurementDetailPage() {
    const { id } = useParams();
    const [error, setError] = useState("");
    const [market, setMarket] = useState<ProcurementMarket>();
    useEffect(() => {
        const fetchMarketDetail = async () => {
            if (!id) return;

            try {
                const result = await getMarketById(id.toString());

                if (result.error) {
                    setError(typeof result.message === 'string' ? result.message : "An error occurred");
                    return;
                }

                setMarket(result.data);
                setError("");
            } catch (e) {
                console.error(e);
                setError("Impossible de charger les données.");
            }
        };

        fetchMarketDetail();

    }, [id]);

    const statusClasses: Record<string, string> = {
        PUBLISHED: "border-emerald-200 bg-emerald-50 text-emerald-700",
        CLOSED: "border-slate-200 bg-slate-100 text-slate-600",
        CANCELLED: "border-rose-200 bg-rose-50 text-rose-700",
    };

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#f6faf8_0%,transparent_25%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] pb-24 text-slate-800 antialiased selection:bg-emerald-200">
            <TopHeader />
            <div className="mx-auto flex max-w-[1680px] flex-col gap-5 px-4 pb-12 pt-6 md:px-6 lg:pt-8">
                {market ? (
                    <div className="space-y-5">
                        {/* Header */}
                        <div className="group relative flex w-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_8px_24px_rgb(0,0,0,0.035)] md:flex-row md:items-center">
                            <div className="absolute right-0 top-0 -z-10 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 opacity-50 blur-3xl transition-transform duration-700 group-hover:scale-110" />

                            <div className="relative z-10 flex min-w-0 items-center gap-3">
                                <div className="relative">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <span
                                            className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${
                                                statusClasses[market.status] || "border-slate-200 bg-slate-100 text-slate-600"
                                            }`}
                                        >
                                            {market.status === "CLOSED" ? "Clôturé" : market.status === "CANCELLED" ? "Annulé" : "Publié"}
                                        </span>
                                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                                            Réf: {market.reference_number}
                                        </span>
                                    </div>
                                    <h1 className="text-lg font-black tracking-tight text-slate-800 leading-tight">
                                        {market.title}
                                    </h1>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-4 md:mt-0">
                                <UpdateMarketButton marketId={market ? market.id.toString() : "-1"} />
                            </div>
                        </div>

                        {/* Main Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                            {/* Left Column */}
                            <div className="lg:col-span-2 space-y-5">
                                {/* Caractéristiques */}
                                <section className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md">
                                    <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />
                                    <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-2 mb-4 pt-1">
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white">
                                            1
                                        </div>
                                        Caractéristiques du Marché
                                    </h2>
                                    <div className="bg-white rounded-xl border border-slate-100 p-2 divide-y divide-slate-100">
                                        <InfoRow label="Type de procédure" value={market.procedure_type} />
                                        <InfoRow label="Catégorie" value={market.category} />
                                        <InfoRow label="Code Projet" value={market.project_code} />
                                        <InfoRow label="Modèle de soumission" value={getServerFileName(market.submission_model || "")} />
                                    </div>
                                </section>

                                {/* Financement */}
                                <section className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md">
                                    <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />
                                    <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-2 mb-4 pt-1">
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white">
                                            2
                                        </div>
                                        Financement
                                    </h2>
                                    <div className="bg-white rounded-xl border border-slate-100 p-2 divide-y divide-slate-100">
                                        <InfoRow
                                            label="Sources de financement"
                                            value={
                                                <div className="flex flex-wrap gap-1.5 justify-end">
                                                    {market.financing_sources.map((source, idx) => (
                                                        <span key={idx} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded font-semibold">
                                                            {source}
                                                        </span>
                                                    ))}
                                                </div>
                                            }
                                        />
                                        {market.reference_bailleur && (
                                            <InfoRow label="Référence Bailleur" value={<span className="font-mono">{market.reference_bailleur}</span>} />
                                        )}
                                    </div>
                                </section>
                            </div>

                            {/* Right Column - Calendrier */}
                            <div className="space-y-5">
                                <section className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md">
                                    <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />
                                    <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-2 mb-4 pt-1">
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white">
                                            3
                                        </div>
                                        Calendrier
                                    </h2>

                                    <div className="space-y-3">
                                        <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 mb-0.5">Date de publication</p>
                                            <p className="text-sm font-bold text-slate-800">
                                                {new Date(market.publication_date).toLocaleDateString('fr-FR')}
                                            </p>
                                        </div>

                                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-600 mb-0.5">Date limite de dépôt</p>
                                            <p className="text-base font-black text-amber-800">
                                                {new Date(market.deadline).toLocaleDateString('fr-FR')}
                                            </p>
                                        </div>

                                        {market.dates_atelier_details && market.dates_atelier_details.length > 0 && (
                                            <div className="pt-2">
                                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 mb-2">Événements & Ateliers</p>
                                                <ul className="space-y-2">
                                                    {market.dates_atelier_details.map((atelier, idx) => (
                                                        <li key={idx} className="text-xs text-slate-600 flex justify-between bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                                                            <span className="font-semibold text-slate-700">• Atelier prévisionnel</span>
                                                            <span className="font-mono font-bold text-slate-800">{new Date(atelier.dates_atelier).toLocaleDateString('fr-FR')}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>

                        {/* Documents */}
                        <section className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md">
                            <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />
                            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-2 mb-5 pt-1">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white">
                                    4
                                </div>
                                Pièces Jointes & Documents
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 mb-3">Documents Techniques</h3>
                                    {market.technical_documents.length === 0 ? (
                                        <p className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">Aucun document technique.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {market.technical_documents.map((doc, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50/50 hover:bg-emerald-50/50 rounded-xl border border-slate-100 transition duration-200 group">
                                                    <span className="break-all text-xs font-semibold text-slate-700 group-hover:text-emerald-800 truncate max-w-[70%]">
                                                        <FileText className="inline h-3.5 w-3.5 mr-1.5 text-slate-400 group-hover:text-emerald-500" />
                                                        {doc.file.split("/").pop()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 mb-3">Annexes</h3>
                                    {market.annexes.length === 0 ? (
                                        <p className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">Aucune annexe.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {market.annexes.map((annexe, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50/50 hover:bg-emerald-50/50 rounded-xl border border-slate-100 transition duration-200 group">
                                                    <span className="break-all text-xs font-semibold text-slate-700 group-hover:text-emerald-800 truncate max-w-[70%]">
                                                        <Download className="inline h-3.5 w-3.5 mr-1.5 text-slate-400 group-hover:text-emerald-500" />
                                                        {annexe.file.split("/").pop()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>
                ) : (
                    <div className="flex justify-center items-center py-12">
                        {error ? (
                            <div className="rounded-2xl border border-rose-200 bg-white p-8 shadow-sm text-center max-w-md w-full">
                                <p className="text-sm font-semibold text-rose-700 mb-4">{error}</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
                                >
                                    Réessayer
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center space-y-4 bg-white p-8 rounded-3xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md w-full max-w-sm text-center">
                                <div className="relative w-12 h-12">
                                    <div className="w-12 h-12 rounded-full border-4 border-slate-100"></div>
                                    <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">Chargement du marché...</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Veuillez patienter quelques instants.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>

        </main>
    );
}

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="py-3.5 px-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 transition hover:bg-slate-50/40">
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</span>
        <span className="text-sm font-bold text-slate-800 break-all sm:text-right">{value || "—"}</span>
    </div>
);