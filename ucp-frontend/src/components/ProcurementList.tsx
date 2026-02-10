/**
 * Composant pour afficher la liste des procurements
 */
"use client";

import { useEffect, useState } from "react";
import { getAllProcurements, deleteProcurement } from "@/services/api";
import type { Procurement } from "@/services/api";
import Link from "next/link";

export default function ProcurementList() {
  const [procurements, setProcurements] = useState<Procurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    loadProcurements();
  }, []);

  const loadProcurements = async () => {
    setLoading(true);
    const data = await getAllProcurements();
    setProcurements(data);
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce procurement?")) {
      return;
    }

    setDeleting(id);
    const success = await deleteProcurement(id);
    setDeleting(null);

    if (success) {
      await loadProcurements();
    } else {
      alert("Erreur lors de la suppression");
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Liste des Procurements
        </h1>
        <Link href="/create">
          <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition">
            + Nouveau
          </button>
        </Link>
      </div>

      {procurements.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <p>Aucun procurement trouvé.</p>
          <Link href="/create">
            <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition">
              Créer un nouveau
            </button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto shadow rounded-lg">
          <table className="w-full bg-white">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Réf N°
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Titre
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {procurements.map((proc) => (
                <tr key={proc.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {proc.ref_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {proc.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {proc.estimated_amount
                      ? `$${proc.estimated_amount.toFixed(2)}`
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        proc.status === "draft"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {proc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <Link href={`/detail/${proc.id}`}>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded transition text-xs">
                        Voir
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(proc.id!)}
                      disabled={deleting === proc.id}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-1 px-3 rounded transition text-xs"
                    >
                      {deleting === proc.id ? "Suppression..." : "Supprimer"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
