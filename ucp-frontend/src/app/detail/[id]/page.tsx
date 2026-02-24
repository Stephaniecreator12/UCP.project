/**
 * Page pour voir les détails d'un procurement
 */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProcurementById } from "@/services/api";
import type { Procurement } from "@/services/api";
import Link from "next/link";
import TopHeader from "@/app/components/TopHeader";
import { getToken } from "@/services/auth";

export default function DetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [procurement, setProcurement] = useState<Procurement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!getToken()) return;

    const loadProcurement = async () => {
      const data = await getProcurementById(parseInt(id));
      setProcurement(data);
      setLoading(false);
    };

    loadProcurement();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100">
        <TopHeader />
        <div className="max-w-4xl mx-auto p-6 text-center text-slate-500">
          Chargement...
        </div>
      </main>
    );
  }

  if (!procurement) {
    return (
      <main className="min-h-screen bg-slate-100">
        <TopHeader />
        <div className="max-w-4xl mx-auto p-6 text-center">
          <p className="text-red-600">Procurement non trouvé</p>
          <Link href="/dashboard">
            <button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition">
              Retour à la liste
            </button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <TopHeader />

      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Link href="/dashboard">
            <button className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-lg transition">
              ← Retour
            </button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">
            {procurement.title}
          </h1>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-1">
                Réf N°
              </h3>
              <p className="text-lg text-gray-900">{procurement.ref_number}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-1">
                Code Suivi
              </h3>
              <p className="text-lg text-gray-900">
                {procurement.tracking_code || "-"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-1">
                Montant Estimé
              </h3>
              <p className="text-lg text-gray-900">
                {procurement.estimated_amount
                  ? `$${procurement.estimated_amount.toFixed(2)}`
                  : "-"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-1">
                Statut
              </h3>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  procurement.status === "draft"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {procurement.status}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-1">
                Méthode
              </h3>
              <p className="text-lg text-gray-900">{procurement.method}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-1">
                Approche
              </h3>
              <p className="text-lg text-gray-900">{procurement.approach}</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">
              Notes de Revue
            </h3>
            <p className="text-gray-900 whitespace-pre-wrap">
              {procurement.review_notes || "-"}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-1">
                Date Invitation
              </h3>
              <p className="text-gray-900">
                {procurement.date_invitation || "-"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-1">
                Ouverture Plis (Tech)
              </h3>
              <p className="text-gray-900">
                {procurement.date_opening_submissions || "-"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-1">
                Ouverture Plis Fin
              </h3>
              <p className="text-gray-900">
                {procurement.date_opening_financial || "-"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-1">
                Signature Contrat
              </h3>
              <p className="text-gray-900">
                {procurement.date_contract_signed || "-"}
              </p>
            </div>
          </div>

          <div className="mt-6 space-x-2">
            <span
                className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                procurement.ami
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-200 text-slate-800"
              }`}
            >
              {procurement.ami ? "✓ AMI" : "✗ Pas d'AMI"}
            </span>
            <span
              className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                procurement.restricted_list
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-200 text-slate-800"
              }`}
            >
              {procurement.restricted_list
                ? "✓ Liste Restreinte"
                : "✗ Pas de liste restreinte"}
            </span>
            <span
              className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                procurement.request_for_proposal
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-200 text-slate-800"
              }`}
            >
              {procurement.request_for_proposal ? "✓ RFP" : "✗ Pas de RFP"}
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
