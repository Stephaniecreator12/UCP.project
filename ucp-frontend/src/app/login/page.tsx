"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  getLandingRouteForUser,
  getCurrentUser,
  getToken,
  login,
  logout,
} from "@/services/auth";
import {
  openPublicValidationSession,
  savePublicValidationSession,
} from "@/services/ouvertureOffre";
import { accessEvaluationByCode } from "@/services/evaluationService";
import type { PublicValidationRole } from "@/types/ouvertureOffre";

function LoginPageFallback() {
  return (
    <div className="min-h-dvh w-full overflow-x-hidden overflow-y-auto">
      <div className="relative flex min-h-dvh items-center justify-center overflow-x-hidden bg-[linear-gradient(180deg,#f5f6f6_0%,#eef1f0_100%)] px-4 py-8">
        <div className="h-96 w-full max-w-md animate-pulse rounded-[30px] border border-slate-200/80 bg-white/80 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.34)]" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialValidationRequest =
    getValidationRequest(searchParams) ??
    (typeof window !== "undefined"
      ? getValidationRequestFromSearchParams(
          new URLSearchParams(window.location.search),
        )
      : null);
  const [fallbackValidationRequest, setFallbackValidationRequest] =
    useState<ValidationLoginRequest | null>(initialValidationRequest);

  const validationRequest =
    getValidationRequest(searchParams) ?? fallbackValidationRequest;
  const validationSeanceId = validationRequest?.seanceId ?? null;
  const validationRole = validationRequest?.role ?? null;
  const validationEmail = validationRequest?.email ?? "";
  const isValidationLogin = validationSeanceId !== null;

  const evaluationRequest = getEvaluationRequest(searchParams);
  const evaluationOffreId = evaluationRequest?.offreId ?? null;
  const evaluationEmail = evaluationRequest?.email ?? "";
  const isEvaluationLogin = evaluationOffreId !== null;

  const nextPath = getSafeNextPath(searchParams.get("next"));
  const [username, setUsername] = useState(
    isEvaluationLogin ? evaluationEmail : validationEmail,
  );
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<PublicValidationRole>(
    validationRole ?? "membre",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isValidationLogin || isEvaluationLogin) {
      logout();
      return;
    }

    if (getToken()) {
      const currentUser = getCurrentUser();
      // Reuse the same landing rule after page refresh so the login page
      // does not stay visible once a session already exists.
      redirectTo(router, nextPath ?? getLandingRouteForUser(currentUser));
    }
  }, [nextPath, router, isValidationLogin, isEvaluationLogin]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (getValidationRequest(searchParams)) return;

    const urlSearch = new URLSearchParams(window.location.search);
    const request = getValidationRequestFromSearchParams(urlSearch);
    if (request) {
      setFallbackValidationRequest(request);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!validationRequest) return;
    setSelectedRole(validationRequest.role ?? "membre");
    if (validationRequest.email) {
      setUsername(validationRequest.email);
    }
  }, [validationRequest]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (isValidationLogin && validationSeanceId !== null) {
      if (!cleanUsername || !cleanPassword) {
        setError("Saisissez l'email et le mot de passe reçus par mail.");
        setIsSubmitting(false);
        return;
      }

      try {
        const context = await openPublicValidationSession(validationSeanceId, {
          role: selectedRole,
          email: cleanUsername,
          password: cleanPassword,
        });
        savePublicValidationSession({
          seanceId: validationSeanceId,
          role: context.role,
          email: context.participant.email,
          password: cleanPassword,
          createdAt: Date.now(),
        });

        const params = new URLSearchParams({
          role: context.role,
          email: context.participant.email,
        });
        redirectTo(
          router,
          `/ouverture_offre/validation/${validationSeanceId}?${params.toString()}`,
        );
        return;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Accès validation impossible.";
        console.error(
          "Validation login failed:",
          errorMsg,
          "seanceId:",
          validationSeanceId,
          "role:",
          selectedRole,
          "error:",
          err,
        );
        setError(errorMsg);
        setIsSubmitting(false);
        return;
      }
    }

    if (isEvaluationLogin && evaluationOffreId !== null) {
      if (!cleanUsername || !cleanPassword) {
        setError("Saisissez l'email et le code d'accès reçus par mail.");
        setIsSubmitting(false);
        return;
      }

      try {
        await accessEvaluationByCode(
          evaluationOffreId,
          cleanUsername,
          cleanPassword,
        );

        redirectTo(
          router,
          `/evaluation_offre/${evaluationOffreId}/evaluate?email=${encodeURIComponent(cleanUsername)}&code=${encodeURIComponent(cleanPassword)}`,
        );
        return;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Code d'accès ou email invalide.",
        );
        setIsSubmitting(false);
        return;
      }
    }

    const result = await login(cleanUsername, password);

    if (!result.success) {
      setError(result.error || "Une erreur est survenue");
      setIsSubmitting(false);
      return;
    }

    const currentUser = getCurrentUser();
    // The destination is decided from the fetched user profile.
    redirectTo(router, nextPath ?? getLandingRouteForUser(currentUser));
  };

  return (
    <div className="min-h-dvh w-full overflow-x-hidden overflow-y-auto">
      <div className="relative flex min-h-dvh items-center justify-center overflow-x-hidden bg-[linear-gradient(180deg,#f5f6f6_0%,#eef1f0_100%)] px-4 py-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(247,247,248,0.72),transparent_28%)]" />
        <div className="pointer-events-none absolute -top-24 -left-16 h-[280px] w-[240px] rotate-[-17deg] rounded-[42px] bg-[linear-gradient(140deg,#a2f3b5_0%,#41f37c_62%,#a2f8be_100%)] shadow-[0_45px_80px_-30px_rgba(33,83,46,0.6)] login-float-soft" />
        <div className="pointer-events-none absolute left-[9%] top-[10%] h-[180px] w-[200px] rotate-[-32deg] rounded-[34px] bg-[linear-gradient(125deg,rgba(58,69,82,0.44)_0%,rgba(15,20,27,0.14)_100%)] login-float-soft [animation-delay:1200ms]" />
        <div className="pointer-events-none absolute bottom-[8%] right-[6%] h-[210px] w-[250px] rotate-[-13deg] rounded-[28px] bg-[linear-gradient(125deg,rgba(131,138,146,0.42)_0%,rgba(15,20,27,0.12)_100%)] opacity-90 login-float-soft [animation-delay:2200ms]" />
        <div className="pointer-events-none absolute right-[12%] top-[18%] hidden h-28 w-28 rounded-[28px] border border-emerald-200/80 opacity-70 sm:block" />
        <div className="relative w-full max-w-md overflow-hidden rounded-[30px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,250,249,0.93)_100%)] p-7 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.34)] backdrop-blur-sm sm:p-8">
          <div className="login-line-glow pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,rgba(34,197,94,0)_0%,rgba(34,197,94,0.88)_18%,rgba(21,128,61,0.94)_50%,rgba(34,197,94,0.88)_82%,rgba(34,197,94,0)_100%)]" />
          <div className="pointer-events-none absolute right-5 top-5 hidden sm:block">
            <div className="flex items-center gap-1.5 opacity-75">
              <span className="h-px w-10 bg-emerald-300" />
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 login-float-soft" />
              <span className="h-px w-6 bg-slate-300" />
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-5 left-6 hidden items-center gap-2 opacity-65 sm:flex">
            <span className="h-px w-8 bg-slate-300" />
            <span className="h-px w-14 bg-emerald-300" />
          </div>

          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#f8faf9_0%,#f1f5f3_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:h-28 sm:w-28">
              <Image
                src="/ucp-sante-logo-color.png"
                alt="Logo UCP"
                width={78}
                height={78}
                className="object-contain"
              />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">
              {isValidationLogin
                ? "Accès validateur DAO"
                : isEvaluationLogin
                  ? "Évaluation d'Offre"
                  : "e-Procurement Platform"}
            </p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">
              {isValidationLogin
                ? "Validation DAO"
                : isEvaluationLogin
                  ? "Évaluation d'Offre"
                  : "Connexion"}
            </h1>
            <div className="login-line-glow mx-auto mt-3 h-px w-24 bg-[linear-gradient(90deg,rgba(34,197,94,0),rgba(34,197,94,0.8),rgba(34,197,94,0))]" />
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
              {error}
            </div>
          )}

          {searchParams.get("validation_done") === "1" && (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              Votre décision a été enregistrée avec succès.
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {isValidationLogin && (
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Rôle
                </label>
                <select
                  value={selectedRole}
                  disabled={isSubmitting || !!validationRole}
                  onChange={(e) =>
                    setSelectedRole(e.target.value as PublicValidationRole)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                >
                  <option value="membre">Membre</option>
                  <option value="president">Président</option>
                </select>
                <p className="mt-2 text-xs text-slate-500">
                  {validationRole
                    ? "Rôle déterminé par le lien de validation."
                    : "Choisissez votre rôle si le lien ne l’a pas fourni."}
                </p>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                {isValidationLogin || isEvaluationLogin
                  ? "Email"
                  : "Nom d'utilisateur"}
              </label>
              <input
                type={isValidationLogin || isEvaluationLogin ? "email" : "text"}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-400"
                value={username}
                disabled={isSubmitting}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={
                  isValidationLogin || isEvaluationLogin
                    ? "Saisir l'email reçu dans le mail"
                    : "Saisir votre nom d'utilisateur"
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                {isValidationLogin
                  ? "Mot de passe reçu par mail"
                  : isEvaluationLogin
                    ? "Code d'accès reçu par mail"
                    : "Mot de passe"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-400"
                  value={password}
                  disabled={isSubmitting}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    isValidationLogin
                      ? "Saisir le mot de passe du mail"
                      : isEvaluationLogin
                        ? "Saisir le code d'accès du mail"
                        : "Saisir votre mot de passe"
                  }
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                      <path
                        d="M3 3l18 18"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      <path
                        d="M10.7 10.7a2 2 0 102.6 2.6"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      <path
                        d="M9.5 5.2A11.4 11.4 0 0112 4c5.5 0 9.5 4 10 8a10.5 10.5 0 01-3 5.2"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M6.2 7.1A11.6 11.4 0 002 12c.2 1.8 1.4 3.6 3.1 5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                      <path
                        d="M2 12c.5-4 4.5-8 10-8s9.5 4 10 8c-.5 4-4.5 8-10 8S2.5 16 2 12z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-[#166534] px-4 py-3 text-sm font-bold tracking-wide text-white shadow-[0_16px_30px_-20px_rgba(22,101,52,0.65)] transition hover:bg-[#14532d] disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting
                ? isValidationLogin || isEvaluationLogin
                  ? "Vérification..."
                  : "Connexion..."
                : isValidationLogin
                  ? "Accéder à la validation"
                  : isEvaluationLogin
                    ? "Accéder à l'évaluation"
                    : "Se connecter"}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
            Unité de Coordination des Projets
          </div>
        </div>
      </div>
    </div>
  );
}

type EvaluationLoginRequest = {
  offreId: number;
  email: string;
};

const getEvaluationRequest = (
  searchParams: ReturnType<typeof useSearchParams>,
): EvaluationLoginRequest | null => {
  if (getQueryParam(searchParams, "validation") !== "evaluation") return null;

  const offre = getQueryParam(searchParams, "offre");
  const email = getQueryParam(searchParams, "email") ?? "";
  const offreId = Number(offre);

  if (!offre || !Number.isInteger(offreId) || offreId <= 0) {
    return null;
  }

  return {
    offreId,
    email,
  };
};

const getSafeNextPath = (value: string | null) => {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  const pathOnly = value.split(/[?#]/, 1)[0];
  if (pathOnly === "/login") return null;
  return value;
};

type ValidationLoginRequest = {
  seanceId: number;
  role?: PublicValidationRole;
  email: string;
};

const getValidationRequest = (
  searchParams: ReturnType<typeof useSearchParams>,
): ValidationLoginRequest | null => {
  const validation = getQueryParam(searchParams, "validation")
    ?.trim()
    .toLowerCase();
  if (validation !== "ouverture") return null;

  const seance =
    getQueryParam(searchParams, "seance") ??
    getQueryParam(searchParams, "seance_id");
  const roleParam =
    getQueryParam(searchParams, "role") ??
    getQueryParam(searchParams, "role_key");
  const email =
    getQueryParam(searchParams, "email") ??
    getQueryParam(searchParams, "courriel") ??
    "";
  const seanceId = Number(seance);
  const role = getRole(roleParam);

  if (!seance || !Number.isInteger(seanceId) || seanceId <= 0) {
    return null;
  }

  return {
    seanceId,
    role,
    email,
  };
};

const getQueryParam = (
  searchParams: ReturnType<typeof useSearchParams>,
  key: string,
) => searchParams.get(key) ?? searchParams.get(`amp;${key}`);

const getRole = (value: string | null): PublicValidationRole | null => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return normalized === "membre" || normalized === "president"
    ? normalized
    : null;
};

const getValidationRequestFromSearchParams = (
  searchParams: URLSearchParams,
): ValidationLoginRequest | null => {
  const validation = searchParams.get("validation")?.trim().toLowerCase();
  if (validation !== "ouverture") return null;

  const seance = searchParams.get("seance") ?? searchParams.get("seance_id");
  const roleParam = searchParams.get("role") ?? searchParams.get("role_key");
  const email = searchParams.get("email") ?? searchParams.get("courriel") ?? "";
  const seanceId = Number(seance);
  const role = getRole(roleParam);

  if (!seance || !Number.isInteger(seanceId) || seanceId <= 0) {
    return null;
  }

  return {
    seanceId,
    role,
    email,
  };
};

const redirectTo = (
  router: ReturnType<typeof useRouter>,
  destination: string,
) => {
  router.replace(destination);

  if (typeof window === "undefined") return;

  window.setTimeout(() => {
    if (window.location.pathname === "/login") {
      window.location.replace(destination);
    }
  }, 500);
};
