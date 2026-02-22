"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/services/auth";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    localStorage.clear();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    const result = await login(username, password);

    if (result.success) {
      router.push("/");
      window.location.href = "/";
    } else {
      setError(result.error || "Nom d'utilisateur ou mot de passe incorrect");
    }
  };

  return (
    <div className="login-page">
      <form onSubmit={handleLogin} className="login-card">
        <h1 className="login-title">e-Proc UCP</h1>
        <p className="login-subtitle">Connexion a la plateforme de suivi des marches</p>

        {error && <div className="login-error">{error}</div>}

        <div className="mb-4">
          <label className="login-label">Utilisateur</label>
          <input
            type="text"
            className="login-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ex: votre_nom_utilisateur"
            required
          />
        </div>

        <div className="mb-6">
          <label className="login-label">Mot de passe</label>
          <input
            type="password"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            required
          />
        </div>

        <button type="submit" className="login-button">
          Se connecter
        </button>
      </form>
    </div>
  );
}
