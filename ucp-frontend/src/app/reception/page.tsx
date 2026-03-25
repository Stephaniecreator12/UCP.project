"use client";

import { useState } from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";

type CommandeItem = {
  id: number;
  designation: string;
  qte_cmd: number;
};

type Commande = {
  numero_bc: string;
  fournisseur: string;
  items: CommandeItem[];
};

type LigneReception = CommandeItem & {
  qte_reçue: number;
  etat: "Conforme" | "Écart détecté";
};

const MOCK_COMMANDE: Commande = {
  numero_bc: "UCP/BC/2026/0089",
  fournisseur: "OFFICE PLUS SARL",
  items: [
    { id: 1, designation: "Souris sans fil Logitech", qte_cmd: 10 },
    { id: 2, designation: "Câbles HDMI 2m", qte_cmd: 8 },
  ],
};

export default function ReceptionPage() {
  const [commande] = useState<Commande>(MOCK_COMMANDE);
  const [lignes, setLignes] = useState<LigneReception[]>(() =>
    MOCK_COMMANDE.items.map((item) => ({ ...item, qte_reçue: item.qte_cmd, etat: "Conforme" }))
  );

  const handleQtyChange = (id: number, val: number) => {
    setLignes((prev) => prev.map((l) => (l.id === id ? { ...l, qte_reçue: val } : l)));
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Réception Provisoire</h1>
      
      {/* En-tête (Section 13.2) */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6 border flex justify-between">
        <div>
          <p className="text-sm text-gray-500">Référence commande</p>
          <p className="font-mono font-bold">{commande?.numero_bc}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Fournisseur</p>
          <p className="font-bold">{commande?.fournisseur}</p>
        </div>
      </div>

      {/* Tableau de pointage (Section 9.2) */}
      <div className="border rounded-xl overflow-hidden bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-4">Désignation</th>
              <th className="p-4">Cmdé</th>
              <th className="p-4 w-32">Reçu</th>
              <th className="p-4">État</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="p-4 font-medium">{item.designation}</td>
                <td className="p-4 text-gray-600">{item.qte_cmd}</td>
                <td className="p-4">
                  <input 
                    type="number" 
                    value={item.qte_reçue}
                    onChange={(e) => handleQtyChange(item.id, parseInt(e.target.value))}
                    className={`w-20 p-2 border rounded ${item.qte_reçue < item.qte_cmd ? 'border-orange-500 bg-orange-50' : 'border-gray-300'}`}
                  />
                </td>
                <td className="p-4">
                  {item.qte_reçue < item.qte_cmd ? (
                    <span className="flex items-center text-orange-600 text-sm font-bold">
                      <AlertTriangle className="w-4 h-4 mr-1" /> Écart détecté
                    </span>
                  ) : (
                    <span className="flex items-center text-green-600 text-sm font-bold">
                      <CheckCircle className="w-4 h-4 mr-1" /> Conforme
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions (Section 10) */}
      <div className="mt-8 flex justify-between items-center">
        <div className="flex flex-col">
           <label className="text-sm font-medium mb-1">Bon de Livraison (PDF)</label>
           <input type="file" className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        </div>
        <div className="space-x-4">
          <button className="px-6 py-2 border rounded-lg hover:bg-gray-50">Enregistrer partiel</button>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Valider réception complète</button>
        </div>
      </div>
    </div>
  );
}
