"use client";

import { useEffect, useState } from "react";

interface Demande {
  id: number;
  numero_demande: string;
  intitule_demande: string;
  service_demandeur: string;
  date_demande: string;
  statut: string;
}

export default function DemandesPage() {
  const [demandes, setDemandes] = useState<Demande[]>([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/achats/")
      .then((res) => res.json())
      .then((data) => setDemandes(data));
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Demandes d'achat</h1>

        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
          Nouvelle demande
        </button>
      </div>

      {demandes.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          Aucune demande d'achat
        </div>
      ) : (
        <table className="w-full border rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">N°</th>
              <th className="p-3 text-left">Objet</th>
              <th className="p-3 text-left">Service</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Statut</th>
            </tr>
          </thead>

          <tbody>
            {demandes.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="p-3">{d.numero_demande}</td>

                <td className="p-3">{d.intitule_demande}</td>

                <td className="p-3">{d.service_demandeur}</td>

                <td className="p-3">{d.date_demande}</td>

                <td className="p-3">{d.statut}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
