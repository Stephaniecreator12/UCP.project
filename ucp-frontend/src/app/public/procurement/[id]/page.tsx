"use client"
import { getMarketById } from "@/services/procurement";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProcurementMarket } from "@/types/procurement";
import TopHeader from "@/app/components/TopHeader";
import { useRouter } from 'next/navigation';
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
    const handleBackRedirection=()=>{
        route.back();
    }

    const statusColors: Record<string, string> = {
        published: "bg-green-50 text-green-700 border-green-200",
        draft: "bg-gray-100 text-gray-700 border-gray-200",
        closed: "bg-red-50 text-red-700 border-red-200",
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6 bg-gray-50 min-h-screen justify-center items-center">
            <TopHeader></TopHeader>
            <div>
                <button 
                onClick={()=>handleBackRedirection()}
                className=""
                >
                    retour
                </button>
            </div>
            {
                market ? (
                    <div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColors[market.status] || "bg-blue-50 text-blue-700"}`}>
                                    {market.status.toUpperCase()}
                                </span>
                                <span className="text-sm text-gray-500 font-mono">Réf: {market.reference_number}</span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                                {market.title}
                            </h1>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        📋 Caractéristiques du Marché
                                    </h2>
                                    <div className="flex flex-col divide-y divide-gray-100 gap-5">
                                        <InfoRow label="Type de procédure" value={market.procedure_type} />
                                        <InfoRow label="Catégorie" value={market.category} />
                                        <InfoRow label="Code Projet" value={market.project_code} />
                                        <InfoRow label="Modèle de soumission" value={market.submission_model} />
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4">💰 Financement</h2>
                                    <div className="divide-y divide-gray-100">
                                        <InfoRow
                                            label="Sources de financement"
                                            value={
                                                <div className="flex flex-wrap gap-1.5 justify-end">
                                                    {market.financing_sources.map((source, idx) => (
                                                        <span key={idx} className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded font-medium">
                                                            {source}
                                                        </span>
                                                    ))}
                                                </div>
                                            }
                                        />
                                        {market.reference_bailleur && (
                                            <InfoRow label="Référence Bailleur" value={market.reference_bailleur} />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm ring-1 ring-orange-500/10">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        ⏳ Calendrier
                                    </h2>

                                    <div className="space-y-4">
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-xs text-gray-500 font-medium">Date de publication</p>
                                            <p className="text-sm font-semibold text-gray-800">
                                                {new Date(market.publication_date).toLocaleDateString('fr-FR')}
                                            </p>
                                        </div>

                                        <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                                            <p className="text-xs text-orange-600 font-bold">Date limite de dépôt</p>
                                            <p className="text-base font-bold text-orange-900">
                                                {new Date(market.deadline).toLocaleDateString('fr-FR')}
                                            </p>
                                        </div>

                                        {market.dates_atelier && market.dates_atelier.length > 0 && (
                                            <div className="pt-2">
                                                <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">📅 Événements & Ateliers</p>
                                                <ul className="space-y-2">
                                                    {market.dates_atelier.map((atelier, idx) => (
                                                        <li key={idx} className="text-xs text-gray-600 flex justify-between bg-gray-50 p-2 rounded">
                                                            <span className="font-mono text-gray-900">{new Date(atelier.dates_atelier).toLocaleDateString('fr-FR')}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                📎 Pièces Jointes & Documents
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Documents Techniques</h3>
                                    {market.technical_documents.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic">Aucun document technique.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {market.technical_documents.map((doc, idx) => (
                                                <a key={idx} href={doc.file} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50/50 rounded-lg border border-gray-100 transition-colors group">
                                                    <span className="break-all text-sm text-gray-700 group-hover:text-blue-600 truncate font-medium">📄{doc.file}</span>
                                                    <span className="break-all text-xs text-gray-400 font-mono">Télécharger</span>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Annexes</h3>
                                    {market.annexes.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic">Aucune annexe.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {market.annexes.map((annexe, idx) => (
                                                <a key={idx} href={annexe.file} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50/50 rounded-lg border border-gray-100 transition-colors group">
                                                    <span className="break-all text-sm text-gray-700 group-hover:text-blue-600 truncate font-medium">📎{annexe.file}</span>
                                                    <span className="break-all text-xs text-gray-400 font-mono">Télécharger</span>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        {error ?
                            (<div className="max-w-md bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm">
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
                                    className="px-4 py-2 bg-white border border-red-300 text-red-700 hover:bg-red-50 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                                >
                                    Réessayer
                                </button>
                            </div>) :
                            (<div className="flex flex-col items-center space-y-4">
                                <div className="relative w-12 h-12">
                                    <div className="w-12 h-12 rounded-full border-4 border-gray-200"></div>
                                    <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                                </div>
                                <div>
                                    <p className="text-base font-semibold text-gray-900">Chargement du marché...</p>
                                    <p className="text-sm text-gray-500">Veuillez patienter quelques instants.</p>
                                </div>
                            </div>)

                        }
                    </div>
                )
            }

        </div>
    );
}
const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
        <span className="text-sm font-medium text-gray-500 break-all">{label}</span>
        <span className="text-sm font-semibold text-gray-900 break-all">{value || "—"}</span>
    </div>
);