"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/services/auth"; // <--- On appelle notre nouveau portier

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sessionMessage, setSessionMessage] = useState(""); // Pour la notification de session expirée
  const router = useRouter(); // <--- C'est le GPS pour changer de page

  // Effet pour vérifier si la session a expiré
  useEffect(() => {
    // Vérifier dans localStorage si la session a expiré
    const sessionExpired = localStorage.getItem('session_expired');
    const params = new URLSearchParams(window.location.search);
    const hasParam = params.get('message') === 'session_expiree';

    if (sessionExpired === 'true' || hasParam) {
      setSessionMessage("Session expirée. Connecte-toi puis réessaie.");
      
      // Nettoyer après 2 secondes
      setTimeout(() => {
        setSessionMessage("");
        localStorage.removeItem('session_expired');
      }, 2000);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Empêche la page de se recharger toute seule
    setError(""); // On efface les vieilles erreurs

    // On appelle notre service auth.ts
    const result = await login(username, password);

    if (result.success) {
      // ✅ SUCCÈS : Le tableau de bord est la page racine
      router.push("/");
    } else {
      // ❌ ERREUR : On affiche le message
      setError(result.error || "Une erreur est survenue");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      {/* Notification de session expirée */}
      {sessionMessage && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 animate-slideDown">
          <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg font-medium">
            {sessionMessage}
          </div>
        </div>
      )}

      <form onSubmit={handleLogin} className="p-8 bg-white shadow-md rounded-lg w-96 relative">
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
            placeholder="Ex: stephanie"
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
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition duration-200"
        >
          Se connecter
        </button>
      </form>

      {/* Ajout de l'animation CSS dans le composant */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            top: -100px;
            opacity: 0;
          }
          to {
            top: 20px;
            opacity: 1;
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease;
        }
      `}</style>
    </div>
  );
}