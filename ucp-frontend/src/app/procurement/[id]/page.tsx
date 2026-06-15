"use client"
import { getMarketById } from "@/services/procurement";
import { useParams } from "next/navigation";
import { useEffect, useState} from "react";
import { ProcurementMarket } from "@/types/procurement";
import TopHeader from "@/app/components/TopHeader";
import { useRouter } from 'next/navigation';
import { DeleteMarketButton } from "../components/deleteButton";
import { UpdateMarketButton } from "../components/updateButton";
import { getServerFileName } from "@/lib/utils";
export default function ProcurementDetailPage() {
    const { id } = useParams();
    const [error, setError] = useState("");
    const [market, setMarket] = useState<ProcurementMarket>();
    const route = useRouter();
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
    const handleBackRedirection = () => {
        route.back();
    }

    const statusColors: Record<string, string> = {
        published: "bg-green-50 text-green-700 border-green-200",
        draft: "bg-gray-100 text-gray-700 border-gray-200",
        closed: "bg-red-50 text-red-700 border-red-200",
    };

    return (
    <div className="mx-auto p-6 space-y-6 bg-gray-50 min-h-screen">
        <TopHeader />
        
        <div>
            <button
                onClick={() => handleBackRedirection()}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-900 transition shadow-2xs"
            >
                ← Retour à la liste
            </button>
        </div>

        {market ? (
            <div className="space-y-6">
                {/* En-tête principal mis en avant (Même style que la liste) */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 border-l-4 border-l-green-600 shadow-md">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors[market.status] || "bg-blue-50 text-blue-700 border-blue-100"}`}>
                            {market.status.toUpperCase()}
                        </span>
                        <span className="text-xs font-mono bg-green-50 text-green-800 px-2.5 py-1 rounded-md font-semibold border border-green-100">
                            Réf: {market.reference_number}
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                        {market.title}
                    </h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-slate-50 p-6 rounded-xl border border-gray-200 shadow-2xs">
                          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wider text-xs text-gray-400">
                              📋 Caractéristiques du Marché
                          </h2>
                          <div className="bg-white rounded-xl border border-gray-100 p-2 divide-y divide-gray-100 shadow-2xs">
                              <InfoRow label="Type de procédure" value={market.procedure_type} />
                              <InfoRow label="Catégorie" value={market.category} />
                              <InfoRow label="Code Projet" value={market.project_code} />
                              <InfoRow label="Modèle de soumission" value={getServerFileName(market.submission_model || "")} />
                          </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-xl border border-gray-200 shadow-2xs">
                            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wider text-xs text-gray-400">
                              💰 Financement
                            </h2>
                            <div className="bg-white rounded-xl border border-gray-100 p-2 divide-y divide-gray-100 shadow-2xs">
                                <InfoRow
                                    label="Sources de financement"
                                    value={
                                        <div className="flex flex-wrap gap-1.5 justify-end">
                                            {market.financing_sources.map((source, idx) => (
                                                <span key={idx} className="bg-gray-100 border border-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded font-medium shadow-3xs">
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
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md ring-1 ring-orange-500/5">
                            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wider text-xs text-gray-400">
                                ⏳ Calendrier
                            </h2>

                            <div className="space-y-4">
                                <div className="bg-gray-50/80 border border-gray-100 p-3 rounded-lg shadow-3xs">
                                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Date de publication</p>
                                    <p className="text-sm font-bold text-gray-800">
                                        {new Date(market.publication_date).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>

                                <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg shadow-3xs">
                                    <p className="text-xs text-orange-700 font-bold uppercase tracking-wider mb-0.5">Date limite de dépôt</p>
                                    <p className="text-base font-extrabold text-orange-900">
                                        {new Date(market.deadline).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>

                                {market.dates_atelier_details && market.dates_atelier_details.length > 0 && (
                                    <div className="pt-2">
                                        <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">📅 Événements & Ateliers</p>
                                        <ul className="space-y-2">
                                            {market.dates_atelier_details.map((atelier, idx) => (
                                                <li key={idx} className="text-xs text-gray-600 flex justify-between bg-gray-50 border border-gray-100 p-2.5 rounded-lg">
                                                    <span className="font-semibold text-gray-700">• Atelier prévisionnel</span>
                                                    <span className="font-mono font-bold text-gray-900">{new Date(atelier.dates_atelier).toLocaleDateString('fr-FR')}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md">
                    <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2 uppercase tracking-wider text-xs text-gray-400">
                        📎 Pièces Jointes & Documents
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Documents Techniques</h3>
                            {market.technical_documents.length === 0 ? (
                                <p className="text-sm text-gray-400 italic bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200">Aucun document technique.</p>
                            ) : (
                                <div className="space-y-2">
                                    {market.technical_documents.map((doc, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-green-50/50 rounded-xl border border-gray-100 transition duration-200 group cursor-pointer">
                                            <span className="break-all text-xs font-medium text-gray-700 group-hover:text-green-800 truncate max-w-[70%]">📄 {doc.file.split("/").pop()}</span>
                                            <span className="text-xs font-bold text-green-700 underline opacity-80 group-hover:opacity-100">Télécharger</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Annexes</h3>
                            {market.annexes.length === 0 ? (
                                <p className="text-sm text-gray-400 italic bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200">Aucune annexe.</p>
                            ) : (
                                <div className="space-y-2">
                                    {market.annexes.map((annexe, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-green-50/50 rounded-xl border border-gray-100 transition duration-200 group cursor-pointer">
                                            <span className="break-all text-xs font-medium text-gray-700 group-hover:text-green-800 truncate max-w-[70%]">📎 {annexe.file.split("/").pop()}</span>
                                            <span className="text-xs font-bold text-green-700 underline opacity-80 group-hover:opacity-100">Télécharger</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <div className="flex justify-center items-center py-12">
                {error ? (
                    <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm text-center">
                        <div className="flex justify-center mb-3">
                            <div className="p-3 bg-red-100 text-red-600 rounded-full">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-base font-bold text-red-900 mb-1">Une erreur est survenue</h3>
                        <p className="text-sm text-red-700 font-medium mb-4">{error}</p>

                        <button
                            onClick={() => window.location.reload()}
                            className="px-5 py-2.5 bg-white border border-red-300 text-red-700 hover:bg-red-50 rounded-lg text-sm font-semibold transition-colors shadow-2xs"
                        >
                            Réessayer
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center space-y-4 bg-white p-8 rounded-xl border border-gray-200 shadow-sm w-full max-w-sm text-center">
                        <div className="relative w-12 h-12">
                            <div className="w-12 h-12 rounded-full border-4 border-gray-100"></div>
                            <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-green-700 border-t-transparent animate-spin"></div>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">Chargement du marché...</p>
                            <p className="text-xs text-gray-400 mt-0.5">Veuillez patienter quelques instants.</p>
                        </div>
                    </div>
                )}
            </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200/60 justify-end">
            <DeleteMarketButton marketId={market ? market.id.toString() : "-1"} marketTitle={market ? market.title : "aucun"} />
            <UpdateMarketButton marketId={market ? market.id.toString() : "-1"} />
        </div>
    </div>
);
}

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="py-3.5 px-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 transition hover:bg-gray-50/40">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
        <span className="text-sm font-bold text-gray-800 break-all sm:text-right">{value || "—"}</span>
    </div>
);