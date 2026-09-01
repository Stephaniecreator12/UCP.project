"use client";

import { useEffect, useState } from "react";

import { soumissionnaireService, type Soumissionnaire } from "../../../services/evaluations/Index";

export default function SoumissionnairePicker({
  value,
  onChange,
}: {
  value: Soumissionnaire | null;
  onChange: (soumissionnaire: Soumissionnaire | null) => void;
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Soumissionnaire[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newNom, setNewNom] = useState("");
  const [newNif, setNewNif] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      soumissionnaireService
        .list({ search })
        .then((data) => setResults(data.results))
        .catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  if (value) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
        <div>
          <p className="text-sm font-semibold text-green-900">{value.nom}</p>
          {value.nif_stat && <p className="text-xs text-green-700">NIF/STAT : {value.nif_stat}</p>}
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs font-semibold text-green-700 hover:text-green-900"
        >
          Changer
        </button>
      </div>
    );
  }

  async function handleCreate() {
    if (!newNom.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const created = await soumissionnaireService.create({
        nom: newNom.trim(),
        nif_stat: newNif.trim() || null,
      });
      onChange(created);
      setShowCreate(false);
      setNewNom("");
      setNewNif("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder="Rechercher un soumissionnaire par nom…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 text-gray-800 transition"
      />

      {results.length > 0 && (
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
          {results.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange(s)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition"
            >
              <span className="font-medium text-gray-800">{s.nom}</span>
              {s.nif_stat && <span className="text-gray-400 text-xs ml-2">{s.nif_stat}</span>}
            </button>
          ))}
        </div>
      )}

      {!showCreate ? (
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="text-xs font-semibold text-green-700 hover:text-green-900"
        >
          + Ce soumissionnaire n&apos;existe pas encore, l&apos;ajouter
        </button>
      ) : (
        <div className="bg-slate-50 border border-gray-200 rounded-lg p-3 space-y-2">
          <input
            type="text"
            placeholder="Nom du soumissionnaire"
            value={newNom}
            onChange={(e) => setNewNom(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 text-gray-800 transition"
          />
          <input
            type="text"
            placeholder="NIF / STAT (optionnel)"
            value={newNif}
            onChange={(e) => setNewNif(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 text-gray-800 transition"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating || !newNom.trim()}
              className="px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white text-xs font-semibold rounded-md transition disabled:opacity-60"
            >
              {creating ? "Création…" : "Créer et sélectionner"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
