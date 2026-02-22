"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/services/auth";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  // Sécurité supplémentaire : On vide les restes de session au chargement de la page de login
  useEffect(() => {
    localStorage.clear();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 1. Nettoyage préventif avant la nouvelle connexion
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    // 2. Tentative de connexion avec vos identifiants
    const result = await login(username, password);

    if (result.success) {
      // ✅ SUCCÈS : Redirection vers le tableau de bord avec vos propres jetons
      router.push("/");
      // Optionnel : Forcer un rechargement pour s'assurer que l'état global est propre
      window.location.href = "/";
    } else {
      // ❌ ERREUR : Affichage du message d'erreur
      setError(result.error || "Nom d'utilisateur ou mot de passe incorrect");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="p-8 bg-white shadow-md rounded-lg w-96">
        <h1 className="text-2xl font-bold mb-6 text-center text-black">
          e-Proc UCP Connexion
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Utilisateur</label>
          <input
            type="text"
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ex: votre_nom_utilisateur"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">Mot de passe</label>
          <input
            type="password"
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition duration-200"
        >
          Se connecter
        </button>
      </form>
    </div>
  );
}