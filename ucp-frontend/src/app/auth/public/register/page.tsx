"use client";

import { useState,useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { publicRegister } from "../../../../services/auth";
import ResendEmailButton from "@/app/components/ResendEmailButton";
import { useReferenceChoices } from "@/hooks/useReferenceChoices";
export default function RegisterPage() {
  const typeEntiteChoices = useReferenceChoices("TYPE_ENTITE", [
    { code: "ENTREPRISE", label: "Entreprise" },
    { code: "BUREAU_ETUDES", label: "Bureau d'études" },
    { code: "ONG", label: "ONG" },
    { code: "PARTICULIER", label: "Particulier" },
    { code: "CONSULTANT", label: "Consultant" },
  ]);
  const [full_name, setFull_name] = useState("");
  const [email, setEmail] = useState("");
  const [isMessage, setIsMessage] = useState(false);
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [type_entite, setType_entite] = useState("");
  const [nif, setNif] = useState("");
  const [password, setPassword] = useState("");
  const [isRegisterValid, setIsRegisterValid] = useState(false)
  const [loading, setLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const router = useRouter();

  const handleBackAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsMessage(false);
    router.push("/auth/login");
  };
  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsMessage(false);
    setLoading(true);

    if (confirmPassword != password) {
      setLoading(false);
      setMessage("Le mot de passe ne correspond pas");
      setIsMessage(true);
      return;
    }
    try {
      const result = await publicRegister(full_name, email, phone, type_entite, nif, password);
      if (!result.success) {
        setLoading(false);
        setIsRegistered(false);
        setIsMessage(true)
        setMessage(result.message);
        return;
      }
      setIsRegisterValid(result.success);
      setLoading(false)
      setIsRegistered(true);
    } catch (error) {
      console.error(error);
      setLoading(false);
      setMessage("Erreur lors de l'inscription");
      setIsRegisterValid(false);
      setIsMessage(true);
    }
  };
  useEffect(() => {
      if (!message) return;
      const timer = setTimeout(() => {
        setIsMessage(false);
        setMessage("");
      }, 5000);
  
      return () => clearTimeout(timer);
    }, [message]);

  return (
    <div className="min-h-dvh w-full overflow-x-hidden overflow-y-auto">
      <div className="relative flex min-h-dvh items-center justify-center overflow-x-hidden bg-[linear-gradient(180deg,#f5f6f6_0%,#eef1f0_100%)] px-4 py-8">

        {/* Background & Decor */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(247,247,248,0.72),transparent_28%)]" />
        <div className="pointer-events-none absolute -top-24 -left-16 h-[280px] w-[240px] rotate-[-17deg] rounded-[42px] bg-[linear-gradient(140deg,#a2f3b5_0%,#41f37c_62%,#a2f8be_100%)] shadow-[0_45px_80px_-30px_rgba(33,83,46,0.6)] login-float-soft" />
        <div className="pointer-events-none absolute left-[9%] top-[10%] h-[180px] w-[200px] rotate-[-32deg] rounded-[34px] bg-[linear-gradient(125deg,rgba(58,69,82,0.44)_0%,rgba(15,20,27,0.14)_100%)] login-float-soft [animation-delay:1200ms]" />
        <div className="pointer-events-none absolute bottom-[8%] right-[6%] h-[210px] w-[250px] rotate-[-13deg] rounded-[28px] bg-[linear-gradient(125deg,rgba(131,138,146,0.42)_0%,rgba(15,20,27,0.12)_100%)] opacity-90 login-float-soft [animation-delay:2200ms]" />
        <div className="pointer-events-none absolute right-[12%] top-[18%] hidden h-28 w-28 rounded-[28px] border border-emerald-200/80 opacity-70 sm:block" />

        {/* UNIQUE Card Container */}
        <div className="relative w-full max-w-md overflow-hidden rounded-[30px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,250,249,0.93)_100%)] p-6 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.34)] backdrop-blur-sm sm:p-8">

          <div className="login-line-glow pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,rgba(34,197,94,0)_0%,rgba(34,197,94,0.88)_18%,rgba(21,128,61,0.94)_50%,rgba(34,197,94,0.88)_82%,rgba(34,197,94,0)_100%)]" />

          {!isRegistered ? (
            <>
              {/* Top Header Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button
                  type="button"
                  onClick={handleBackAction}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  Retour
                </button>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  Inscription libre
                </span>
              </div>

              {/* Logo & Identity */}
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#f8faf9_0%,#f1f5f3_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                  <Image
                    src="/ucp-sante-logo-color.png"
                    alt="Logo UCP"
                    width={52}
                    height={52}
                    className="object-contain"
                  />
                </div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-800/90">
                  Unité de Coordination des Projets
                </p>
                <h1 className="mt-1 text-xl font-extrabold text-slate-900 tracking-tight">
                  Créer un compte
                </h1>
              </div>

              {/* Alert Messages */}
              {isMessage && (
                <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-medium transition-all ${isRegisterValid
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-rose-200 bg-rose-50 text-rose-800'
                  }`}>
                  {message}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleRegistration} className="space-y-4">
                {/* Nom complet */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={full_name}
                    onChange={(e) => setFull_name(e.target.value)}
                    placeholder="Ex: Jean Dupont"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-400"
                  />
                </div>

                {/* Email & Téléphone */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="adresse@mail.com"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
                      Téléphone
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+261 -- -- --- --"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Type d'entité */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
                    Type d&apos;entité
                  </label>
                  <div className="relative">
                    <select
                      value={type_entite}
                      onChange={(e) => setType_entite(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 cursor-pointer pr-10"
                    >
                      <option value="" disabled className="text-slate-400">
                        Sélectionner...
                      </option>
                      {typeEntiteChoices.map((opt) => (
                        <option key={opt.code} value={opt.code}>{opt.label}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* NIF */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
                    Numéro d&apos;Identification Fiscale (NIF)
                  </label>
                  <input
                    type="text"
                    value={nif}
                    onChange={(e) => setNif(e.target.value)}
                    placeholder="Saisir votre NIF"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-400"
                  />
                </div>

                {/* Mots de passe */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
                      Confirmation
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type={loading ? "button" : "submit"}
                  disabled={loading}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[#166534] px-4 py-3 text-sm font-bold tracking-wide text-white shadow-[0_10px_25px_-10px_rgba(22,101,52,0.55)] transition hover:bg-[#14532d] active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Traitement en cours...
                    </span>
                  ) : (
                    "Créer mon compte UCP"
                  )}
                </button>
              </form>

              {/* Footer Formulaire */}
              <div className="mt-6 border-t border-slate-100 pt-4 text-center text-[11px] font-medium text-slate-400 tracking-wide">
                © {new Date().getFullYear()} Unité de Coordination des Projets
              </div>
            </>
          ) : (
            /* --- NOUVEL ÉCRAN : VÉRIFICATION DE L'EMAIL --- */
            <div className="flex flex-col items-center text-center py-4 animate-fade-in">

              {/* Icône d'enveloppe animée stylisée */}
              <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-10 w-10">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0l-7.5-4.615a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                </span>
              </div>

              {/* Titres */}
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Vérifiez votre boîte mail
              </h1>
              <p className="mt-2 text-sm text-slate-600 px-2">
                Un lien d&apos;activation vient d&apos;être envoyé à l&apos;adresse <span className="font-semibold text-slate-800">{email}</span>.
              </p>

              {/* Note d'information */}
              <div className="mt-5 w-full rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-left text-xs text-slate-500 space-y-2">
                <p className="font-medium text-slate-700">Prochaines étapes :</p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Cliquez sur le lien contenu dans le mail (valable 24h).</li>
                  <li>Si vous ne trouvez pas le mail, regardez dans vos <strong>spams</strong>.</li>
                </ul>
              </div>
              <ResendEmailButton email={email} />

              {/* Bouton pour retourner à la connexion */}
              <button
                type="button"
                onClick={handleBackAction}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] cursor-pointer"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4 text-slate-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                Retour à la page de connexion
              </button>

              {/* Footer Écran Succès */}
              <div className="mt-6 border-t border-slate-100 w-full pt-4 text-center text-[11px] font-medium text-slate-400 tracking-wide">
                © {new Date().getFullYear()} Unité de Coordination des Projets
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}