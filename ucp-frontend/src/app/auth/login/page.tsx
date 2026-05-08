"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getToken, login} from "@/services/auth";

const DEFAULT_PUBLIC_REGISTER_ROUTE = "/auth/public/register";
const DEFAULT_PUBLIC_ROUTE = "/public/dao-dc";
const DEFAULT_PRIVATE_ROUTE = "/private/dao-dc"
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [access, setAccess] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_type') || "public";
    }
    return "public";
  });
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (token) {
      if(access == "private"){
        router.push(`${DEFAULT_PRIVATE_ROUTE}`);
      }
      router.push(`${DEFAULT_PUBLIC_ROUTE}`);
    }
  }, [access, router]);

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setMessage("")
  setLoading(true);
  setMessage("chargement...");

  const result = await login(email, password);

  if (result.success) {
    if(access == "private"){
      router.push(`${DEFAULT_PRIVATE_ROUTE}`);
    }
    router.push(`${DEFAULT_PUBLIC_ROUTE}`);
    return;
  }
  else if(result.message == "identifiants publique introuvable"){
    setLoading(false);
    setMessage("Redirection vers l'espace public...");
    setTimeout(() => {
      router.push(`${DEFAULT_PUBLIC_REGISTER_ROUTE}`);
      setLoading(false);
    }, 2000);
    return;
  }
  else{
    setMessage(result.message || "Une erreur est survenue");
    setLoading(false);
  }
  
};


  return (
    <div className="min-h-screen w-full overflow-hidden">
      {/* login-scene */}
      <div className="relative flex items-center justify-center overflow-hidden px-4 py-8 min-h-[calc(100vh-78px)] bg-[radial-gradient(circle_at_80%_10%,rgba(247,247,248,0.685),transparent_30%)]">
        
        {/* login-decor-primary */}
        <div className="pointer-events-none absolute -top-24 -left-16 h-[280px] w-[240px] rotate-[-17deg] rounded-[42px] bg-[linear-gradient(140deg,#a2f3b5_0%,#41f37c_62%,#a2f8be_100%)] shadow-[0_45px_80px_-30px_rgba(33,83,46,0.6)]" />
        
        {/* login-decor-secondary */}
        <div className="pointer-events-none absolute left-[9%] top-[10%] h-[180px] w-[200px] rotate-[-32deg] rounded-[34px] bg-[linear-gradient(125deg,rgba(58,69,82,0.5)_0%,rgba(15,20,27,0.15)_100%)]" />
        
        {/* login-decor-bottom */}
        <div className="pointer-events-none absolute -bottom-[60px] -right-[48px] h-[240px] w-[280px] rotate-[-15deg] rounded-[26px] bg-[linear-gradient(125deg,rgba(100,107,114,0.5)_0%,rgba(15,20,27,0.15)_100%)]" />

        {/* login-card */}
        <div className="relative w-full max-w-md rounded-3xl overflow-hidden border border-slate-400/25 p-8 md:p-10 backdrop-blur-md bg-[#e0f5d6b9] shadow-[0_35px_85px_-28px_rgba(238,231,231,0.9)]">
          
          {/* login-card-accent */}
          <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#67ff87_0%,#5b7764c0_50%,#67ff87_100%)]" />
          
          <div className="max-w-sm mx-auto">
            {/* Logo container */}
            <div className="flex items-center justify-center mb-5">
              <Image
                src="/ucp-sante-logo-color.png"
                alt="Logo UCP"
                width={80}
                height={80}
                className="rounded-xl bg-white/95 border border-slate-400/60 shadow-[0_0_26px_rgba(166,168,166,0.726)]"
              />
            </div>

            {/* Header */}
            <div className="text-center mb-4">
              <p className="font-bold uppercase tracking-wide text-[medium] text-[#0e0d0dce]">
                Unité de coordination des projets 
              </p>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed tracking-[0.1em]">Bienvenue</p>
            </div>

            {message && (
              <div className="mt-5 bg-red-500/10 border border-red-400/40 text-black px-4 py-3 rounded-lg text-sm">
                {message}
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              {/* Email */}
              <div>
                <label className="block text-slate-200 text-sm font-semibold mb-2 tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full p-3 rounded-xl text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all focus:ring-emerald-400/60 focus:border-emerald-300 border border-[#ced1d1] bg-slate-800/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre email"
                />
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-slate-200 text-sm font-semibold mb-2 tracking-wide">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full p-3 pr-11 rounded-xl text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all focus:ring-emerald-400/60 focus:border-emerald-300 border border-[#ced1d1] bg-slate-800/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Votre mot de passe"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#ced1d1] transition hover:bg-slate-600/45"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-[#77e289]">
                        <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M10.7 10.7a2 2 0 102.6 2.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M9.5 5.2A11.4 11.4 0 0112 4c5.5 0 9.5 4 10 8a10.5 10.5 0 01-3 5.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M6.2 7.1A11.6 11.6 0 002 12c.2 1.8 1.4 3.6 3.1 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-[#77e289]">
                        <path d="M2 12c.5-4 4.5-8 10-8s9.5 4 10 8c-.5 4-4.5 8-10 8S2.5 16 2 12z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type={`${loading? "button": "submit"}`}
                className="w-full mt-2 bg-[linear-gradient(96deg,#68ff8a_0%,#31d767_42%,#14943e_100%)] text-[#154b30eb] font-bold tracking-wide py-3 px-4 rounded-xl hover:brightness-110 transition duration-200 shadow-[0_16px_26px_-14px_rgba(46,218,102,0.88)]"
              >
                Se connecter
              </button>
            </form>
            
            <div className="mt-14 flex items-center justify-center gap-2 text-xs tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
              <p className="text-slate-300">UCP</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}