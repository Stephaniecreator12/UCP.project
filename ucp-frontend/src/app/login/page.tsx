"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getToken, login } from "@/services/auth";
import TopHeader from "@/app/components/TopHeader";

const DEFAULT_AFTER_LOGIN_ROUTE = "/formulaire";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (getToken()) {
      router.replace(DEFAULT_AFTER_LOGIN_ROUTE);
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await login(username, password);

    if (result.success) {
      // Redirection immédiate vers le formulaire après connexion réussie
      router.push("/formulaire");
    } else {
      setError(result.error || "Une erreur est survenue");
    }
  };

  return (
    <div className="app-shell">
      <div className="login-scene">
       <div className="login-decor-overlay" />
        <div className="login-decor-primary" />
        <div className="login-decor-secondary" />
        <div className="login-decor-bottom" />

        <div className="login-card">
        <div className="login-card-accent" />
        <div className="login-card-inner-border" />
    
       <div className="login-content-wrapper">
          <div className="login-logo-container">
              <Image
                src="/ucp-sante-logo-color.png"
                alt="Logo UCP"
                width={80}
                height={80}
                className="login-logo-image"
              />
            </div>

            <div className="login-header">
              <p className="login-title">
                 Unité de coordination des projets 
               </p>
               <p className="login-kicker">Bienvenue</p>
               
            </div>

            {error && (
              <div className="login-error mt-5 bg-red-500/12 border border-red-400/40 text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="login-form">
             <div>
              <label className="login-field-label">
                   Utilisateur
              </label>
                  <input
                    type="text"
                    className="login-input-field"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Votre nom d'utilisateur"
                  />
              </div>

              <div>
                <label className="login-field-label">
                  Mot de passe
               </label>
                  <div className="login-input-wrapper">
                       <input
                         type={showPassword ? "text" : "password"}
                        className="login-input-password"
                        value={password}
                          onChange={(e) => setPassword(e.target.value)}
                       placeholder="Votre mot de passe"
                         />
                     <button
                         type="button"
                         className="login-toggle-password"
                         onClick={() => setShowPassword((prev) => !prev)}
                         aria-label={showPassword ? "Masquer" : "Afficher"}
                       >
                       {showPassword ? (
                       <svg viewBox="0 0 24 24" fill="none" className="login-eye-icon">
                       <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                       <path d="M10.7 10.7a2 2 0 102.6 2.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                       <path d="M9.5 5.2A11.4 11.4 0 0112 4c5.5 0 9.5 4 10 8a10.5 10.5 0 01-3 5.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                       <path d="M6.2 7.1A11.6 11.6 0 002 12c.2 1.8 1.4 3.6 3.1 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                       ) : (
                       <svg viewBox="0 0 24 24" fill="none" className="login-eye-icon">
                       <path d="M2 12c.5-4 4.5-8 10-8s9.5 4 10 8c-.5 4-4.5 8-10 8S2.5 16 2 12z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                       <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                       </svg>
                           )}
                      </button>
                   </div>
                  </div>

              <button
                  type="submit"
                  className="w-full mt-2 bg-[linear-gradient(96deg,#68ff8a_0%,#31d767_42%,#14943e_100%)] text-[#154b30eb] font-bold tracking-wide py-3 px-4 rounded-xl hover:brightness-110 transition duration-200 shadow-[0_16px_26px_-14px_rgba(46,218,102,0.88)]"
                >
                  Se connecter
              </button>
            </form><br /><br />

           <div className="login-footer">
              <span className="login-footer-dot" />
              <p className="login-footer-text">UCP</p>
           </div>
          </div>
        </div>
      </div>
    </div>
  );
}
