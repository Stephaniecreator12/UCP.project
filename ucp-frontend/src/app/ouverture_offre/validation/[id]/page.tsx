"use client";

import Image from "next/image";
import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Eye,
  EyeOff,
  Mail,
  UserCheck,
  Lock,
  ShieldCheck,
  X,
} from "lucide-react";

import SeanceOverviewDetails from "@/app/ouverture_offre/components/SeanceOverviewDetails";
import {
  clearPublicValidationSession,
  openPublicValidationSession,
  readPublicValidationSession,
  savePublicValidationSession,
  submitPublicValidationDecision,
} from "@/services/ouvertureOffre";
import { listMarkets } from "@/services/procurement";
import type {
  PublicValidationContext,
  PublicValidationDecision,
  PublicValidationRole,
} from "@/types/ouvertureOffre";
import type { ProcurementMarket } from "@/types/procurement";

type StoredCommissionMember = {
  nomPrenom?: string;
  email?: string;
  cin?: string;
  poste?: string;
  entite?: string;
};

const parseStoredCommissionMembers = (
  stored: string | null,
): StoredCommissionMember[] => {
  if (!stored) return [];

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (member): member is Record<string, unknown> =>
          typeof member === "object" && member !== null,
      )
      .map((member) => ({
        nomPrenom:
          typeof member.nomPrenom === "string" ? member.nomPrenom : undefined,
        email: typeof member.email === "string" ? member.email : undefined,
        cin: typeof member.cin === "string" ? member.cin : undefined,
        poste: typeof member.poste === "string" ? member.poste : undefined,
        entite: typeof member.entite === "string" ? member.entite : undefined,
      }));
  } catch {
    return [];
  }
};

const mapStoredMemberToSeanceMember = (
  member: StoredCommissionMember,
  index: number,
): PublicValidationContext["seance"]["membres"][number] => ({
  id: -(index + 1),
  utilisateur: -(index + 1),
  utilisateur_detail: {
    id: -(index + 1),
    username:
      member.email?.trim() || member.nomPrenom?.trim() || `membre-${index + 1}`,
    email: member.email?.trim() || "",
    first_name: "",
    last_name: "",
    full_name:
      member.nomPrenom?.trim() || member.email?.trim() || `Membre ${index + 1}`,
  },
  nom_prenom: member.nomPrenom?.trim() || "",
  numero_carte: member.cin?.trim() || "",
  intitule: member.entite?.trim() || "",
  poste: member.poste?.trim() || "",
  est_present: true,
  a_valide: false,
  decision: "EN_ATTENTE",
  commentaire: "",
  date_validation: null,
});

const mergeCommissionMembers = (
  backendMembers: PublicValidationContext["seance"]["membres"],
  storedMembers: PublicValidationContext["seance"]["membres"],
): PublicValidationContext["seance"]["membres"] => {
  if (backendMembers.length === 0) return storedMembers;
  if (storedMembers.length === 0) return backendMembers;

  const merged = backendMembers.map((backendMember) => {
    const backendEmail = backendMember.utilisateur_detail.email
      .trim()
      .toLowerCase();
    const backendName = (
      backendMember.nom_prenom || backendMember.utilisateur_detail.full_name
    )
      .trim()
      .toLowerCase();

    const storedMember = storedMembers.find((member) => {
      const storedEmail = member.utilisateur_detail.email.trim().toLowerCase();
      const storedName = (
        member.nom_prenom || member.utilisateur_detail.full_name
      )
        .trim()
        .toLowerCase();
      return (
        (backendEmail && storedEmail && backendEmail === storedEmail) ||
        (!backendEmail && storedName && backendName === storedName)
      );
    });

    if (!storedMember) return backendMember;

    return {
      ...backendMember,
      numero_carte: backendMember.numero_carte || storedMember.numero_carte,
      intitule: backendMember.intitule || storedMember.intitule,
      poste: backendMember.poste || storedMember.poste,
    };
  });

  const mergedEmails = new Set(
    merged.map((member) =>
      member.utilisateur_detail.email.trim().toLowerCase(),
    ),
  );
  const mergedNames = new Set(
    merged.map((member) =>
      (member.nom_prenom || member.utilisateur_detail.full_name)
        .trim()
        .toLowerCase(),
    ),
  );

  const extras = storedMembers.filter((storedMember) => {
    const storedEmail = storedMember.utilisateur_detail.email
      .trim()
      .toLowerCase();
    const storedName = (
      storedMember.nom_prenom || storedMember.utilisateur_detail.full_name
    )
      .trim()
      .toLowerCase();
    return (
      (!storedEmail || !mergedEmails.has(storedEmail)) &&
      (!storedName || !mergedNames.has(storedName))
    );
  });

  return [...merged, ...extras];
};

function ValidationFallback() {
  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,#f5f6f6_0%,#eef1f0_100%)] p-6">
      <div className="mx-auto h-96 max-w-md animate-pulse rounded-[30px] border border-slate-200/80 bg-white/80 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.34)]" />
    </main>
  );
}

export default function PublicOuvertureValidationPage() {
  return (
    <Suspense fallback={<ValidationFallback />}>
      <PublicOuvertureValidationContent />
    </Suspense>
  );
}

function PublicOuvertureValidationContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const seanceId = Number(params?.id);
  const initialRole = getRole(getQueryParam(searchParams, "role"));
  const initialEmail = getQueryParam(searchParams, "email") || "";
  const [selectedRole, setSelectedRole] = useState<PublicValidationRole>(
    initialRole ?? "membre",
  );
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [context, setContext] = useState<PublicValidationContext | null>(null);
  const [commentaire, setCommentaire] = useState("");
  const [dateReport, setDateReport] = useState("");
  const [pendingDecision, setPendingDecision] =
    useState<PublicValidationDecision | null>(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkedMarket, setLinkedMarket] = useState<ProcurementMarket | null>(
    null,
  );

  const mergedMembers = useMemo(() => {
    if (!context) return [];
    if (typeof window === "undefined") return context.seance.membres;

    const storedMembers = parseStoredCommissionMembers(
      window.localStorage.getItem(
        `ucp_commission_membres_${context.seance.reference_dossier}`,
      ),
    ).map((member, index) => mapStoredMemberToSeanceMember(member, index));

    return mergeCommissionMembers(context.seance.membres, storedMembers);
  }, [context]);

  const hasValidSeanceId = Number.isInteger(seanceId) && seanceId > 0;
  const currentRole = context?.role ?? selectedRole;
  const roleLabel =
    currentRole === "president"
      ? "Président de séance"
      : "Membre de commission";
  const title =
    context?.seance.objet_dossier || "Validation de séance d'ouverture";

  useEffect(() => {
    if (!hasValidSeanceId || context) return;

    const storedSession = readPublicValidationSession(seanceId);
    if (!storedSession) return;

    let cancelled = false;

    void Promise.resolve().then(async () => {
      try {
        const nextContext = await openPublicValidationSession(seanceId, {
          role: storedSession.role,
          email: storedSession.email,
          password: storedSession.password,
        });
        if (cancelled) return;
        setSelectedRole(nextContext.role);
        setEmail(nextContext.participant.email);
        setContext(nextContext);
        setPassword("");
      } catch (err) {
        if (cancelled) return;
        clearPublicValidationSession();
        setError(
          err instanceof Error ? err.message : "Accès validation impossible.",
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [context, email, hasValidSeanceId, router, seanceId, selectedRole]);

  useEffect(() => {
    if (context?.market) {
      setLinkedMarket(context.market);
      return;
    }

    if (!context?.seance?.reference_dossier) {
      setLinkedMarket(null);
      return;
    }

    let cancelled = false;

    void Promise.resolve().then(async () => {
      try {
        const markets = await listMarkets();
        if (cancelled) return;
        setLinkedMarket(
          markets.find(
            (market) =>
              market.reference_number === context.seance.reference_dossier,
          ) ?? null,
        );
      } catch {
        if (!cancelled) {
          setLinkedMarket(null);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [context?.seance?.reference_dossier, context?.market]);

  const actionButtons = useMemo(() => {
    if (!context) return [];
    if (context.role === "membre") {
      return [
        { decision: "VALIDER" as const, label: "Valider", tone: "success" },
        { decision: "REJETER" as const, label: "Rejeter", tone: "danger" },
      ];
    }

    return [
      { decision: "APPROUVER" as const, label: "Approuver", tone: "success" },
      { decision: "REPORTER" as const, label: "Reporter", tone: "warning" },
      { decision: "REJETER" as const, label: "Rejeter", tone: "danger" },
    ];
  }, [context]);

  const handleAccess = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hasValidSeanceId || isLoading) return;

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    if (!cleanEmail || !cleanPassword) {
      setError("Saisissez l'email et le mot de passe reçus par mail.");
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      const nextContext = await openPublicValidationSession(seanceId, {
        role: selectedRole,
        email: cleanEmail,
        password: cleanPassword,
      });
      setSelectedRole(nextContext.role);
      setEmail(nextContext.participant.email);
      setContext(nextContext);
      savePublicValidationSession({
        seanceId,
        role: nextContext.role,
        email: nextContext.participant.email,
        password: cleanPassword,
        createdAt: Date.now(),
      });
      setPassword("");
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      return;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Accès validation impossible.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const requestDecision = (decision: PublicValidationDecision) => {
    if (decision === "REJETER" && !commentaire.trim()) {
      setError("Le commentaire est obligatoire pour un rejet.");
      return;
    }
    if (decision === "REPORTER" && (!commentaire.trim() || !dateReport)) {
      setError(
        "La date de report et le commentaire sont obligatoires pour reporter.",
      );
      return;
    }
    setError("");
    setConfirmPassword("");
    setPendingDecision(decision);
  };

  const confirmDecision = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!context || !pendingDecision || isSubmitting) return;
    const cleanPassword = confirmPassword.trim();
    if (!cleanPassword) {
      setError("Confirmez le mot de passe reçu par mail.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      const response = await submitPublicValidationDecision(seanceId, {
        role: context.role,
        email: context.participant.email,
        password: cleanPassword,
        decision: pendingDecision,
        commentaire,
        date_report: pendingDecision === "REPORTER" ? dateReport : null,
      });
      setSuccess(response.detail);
      setPendingDecision(null);
      setConfirmPassword("");
      if (response.seance) {
        setContext((current) =>
          current
            ? {
                ...current,
                seance: response.seance as PublicValidationContext["seance"],
                market: response.market
                  ? (response.market as ProcurementMarket)
                  : current.market,
              }
            : current,
        );
      }
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Decision impossible.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasValidSeanceId) {
    return (
      <ValidationShell>
        <ValidationCard>
          <ValidationBrand
            eyebrow="Validation sécurisée"
            title="Lien invalide"
            subtitle="Le lien de validation ne contient pas de séance valide."
          />
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Vérifiez le lien complet reçu par email.</span>
            </div>
          </div>
        </ValidationCard>
      </ValidationShell>
    );
  }

  return (
    <ValidationShell wide={!!context}>
      <section className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,250,249,0.93)_100%)] shadow-[0_28px_70px_-42px_rgba(15,23,42,0.34)] backdrop-blur-sm">
        <div className="login-line-glow h-1 bg-[linear-gradient(90deg,rgba(34,197,94,0)_0%,rgba(34,197,94,0.88)_18%,rgba(21,128,61,0.94)_50%,rgba(34,197,94,0.88)_82%,rgba(34,197,94,0)_100%)]" />
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/ucp-sante-logo-color.png"
              alt="Logo UCP"
              width={48}
              height={48}
              className="rounded-2xl border border-slate-200 bg-white object-contain p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
              style={{ width: "auto", height: "auto" }}
            />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700">
                Accès validation DAO
              </p>
              <h1 className="truncate text-lg font-black text-slate-950">
                {title}
              </h1>
              <p className="text-xs font-bold text-slate-500">{roleLabel}</p>
            </div>
          </div>
        </div>

        {!context ? (
          <form onSubmit={handleAccess} className="space-y-5 p-5 sm:p-7">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#f8faf9_0%,#f1f5f3_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <ShieldCheck className="h-9 w-9 text-emerald-700" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">
                e-Procurement Platform
              </p>
              <h2 className="mt-3 text-2xl font-bold text-slate-900">
                Validation sécurisée
              </h2>
              <div className="login-line-glow mx-auto mt-3 h-px w-24 bg-[linear-gradient(90deg,rgba(34,197,94,0),rgba(34,197,94,0.8),rgba(34,197,94,0))]" />
            </div>

            {error && <InlineError message={error} />}

            <div>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Rôle
              </span>
              <div className="grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
                {(["membre", "president"] as const).map((roleOption) => {
                  const isActive = selectedRole === roleOption;
                  return (
                    <button
                      key={roleOption}
                      type="button"
                      disabled={!!initialRole}
                      onClick={() => setSelectedRole(roleOption)}
                      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-black transition ${
                        isActive
                          ? "bg-white text-emerald-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <UserCheck className="h-4 w-4" />
                      {roleOption === "president" ? "Président" : "Membre"}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-700">Email</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-11 text-sm font-bold text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                  placeholder="Email reçu dans l'invitation"
                />
              </div>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-700">
                Mot de passe de validation
              </span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-11 pr-12 text-sm font-bold tracking-wider text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                  placeholder="Saisir le mot de passe reçu par email"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label={showPassword ? "Masquer" : "Afficher"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#166534] px-5 text-sm font-bold tracking-wide text-white shadow-[0_16px_30px_-20px_rgba(22,101,52,0.65)] transition hover:bg-[#14532d] disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <Lock className="h-4 w-4" />
              {isLoading ? "Vérification..." : "Accéder à la validation"}
            </button>

            <div className="border-t border-slate-100 pt-4 text-center text-xs font-semibold text-slate-500">
              Unité de Coordination des Projets
            </div>
          </form>
        ) : (
          <div className="space-y-5 p-5 sm:p-6">
            {error && <InlineError message={error} />}
            {success && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                {success} Le détail reste affiché ci-dessous.
              </div>
            )}

            <section className="rounded-3xl border border-white/40 bg-white/75 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.05)] backdrop-blur-md">
              <SeanceOverviewDetails
                seance={context.seance}
                market={linkedMarket}
                members={mergedMembers}
                presidentLabel={
                  context.seance.president_detail?.full_name ||
                  context.seance.president_detail?.username
                }
                compact
              />
            </section>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                Observation
              </span>
              <textarea
                value={commentaire}
                onChange={(event) => setCommentaire(event.target.value)}
                rows={3}
                placeholder="Obligatoire pour un rejet ou un report."
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            {context.role === "president" && (
              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Date de report
                </span>
                <input
                  type="date"
                  value={dateReport}
                  onChange={(event) => setDateReport(event.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
              </label>
            )}

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              {actionButtons.map((action) => (
                <button
                  key={action.decision}
                  type="button"
                  onClick={() => requestDecision(action.decision)}
                  disabled={!!success}
                  className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-black text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${getActionClass(action.tone)}`}
                >
                  {action.decision === "REPORTER" ? (
                    <CalendarClock className="h-4 w-4" />
                  ) : action.tone === "success" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="text-center">
        <button
          type="button"
          onClick={() => router.replace("/login")}
          className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la connexion
        </button>
      </div>

      {pendingDecision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
          <form
            onSubmit={confirmDecision}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Confirmation
              </p>
              <h2 className="mt-1 text-lg font-black text-slate-950">
                Confirmer : {getDecisionLabel(pendingDecision)}
              </h2>
            </div>
            <div className="space-y-4 px-5 py-4">
              <p className="text-sm font-semibold text-slate-600">
                Saisissez à nouveau le mot de passe reçu par mail pour signer
                cette décision.
              </p>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Saisir le mot de passe reçu par email"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold tracking-wider text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                autoFocus
              />
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPendingDecision(null)}
                disabled={isSubmitting}
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 rounded-xl bg-slate-950 px-4 text-sm font-black text-white disabled:opacity-60"
              >
                {isSubmitting ? "Signature..." : "Confirmer"}
              </button>
            </div>
          </form>
        </div>
      )}
    </ValidationShell>
  );
}

function ValidationShell({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <main className="min-h-dvh w-full overflow-x-hidden overflow-y-auto text-slate-800">
      <div
        className={`relative flex min-h-dvh justify-center overflow-x-hidden bg-[linear-gradient(180deg,#f5f6f6_0%,#eef1f0_100%)] px-4 py-8 ${wide ? "items-start" : "items-center"}`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(247,247,248,0.72),transparent_28%)]" />
        <div className="pointer-events-none absolute -top-24 -left-16 h-[280px] w-[240px] rotate-[-17deg] rounded-[42px] bg-[linear-gradient(140deg,#a2f3b5_0%,#41f37c_62%,#a2f8be_100%)] shadow-[0_45px_80px_-30px_rgba(33,83,46,0.6)] login-float-soft" />
        <div className="pointer-events-none absolute left-[9%] top-[10%] h-[180px] w-[200px] rotate-[-32deg] rounded-[34px] bg-[linear-gradient(125deg,rgba(58,69,82,0.44)_0%,rgba(15,20,27,0.14)_100%)] login-float-soft [animation-delay:1200ms]" />
        <div className="pointer-events-none absolute bottom-[8%] right-[6%] h-[210px] w-[250px] rotate-[-13deg] rounded-[28px] bg-[linear-gradient(125deg,rgba(131,138,146,0.42)_0%,rgba(15,20,27,0.12)_100%)] opacity-90 login-float-soft [animation-delay:2200ms]" />
        <div className="pointer-events-none absolute right-[12%] top-[18%] hidden h-28 w-28 rounded-[28px] border border-emerald-200/80 opacity-70 sm:block" />
        <div
          className={`relative z-10 w-full ${wide ? "max-w-[1180px]" : "max-w-md"}`}
        >
          {children}
        </div>
      </div>
    </main>
  );
}

function ValidationCard({ children }: { children: ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,250,249,0.93)_100%)] p-7 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.34)] backdrop-blur-sm sm:p-8">
      <div className="login-line-glow pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,rgba(34,197,94,0)_0%,rgba(34,197,94,0.88)_18%,rgba(21,128,61,0.94)_50%,rgba(34,197,94,0.88)_82%,rgba(34,197,94,0)_100%)]" />
      {children}
    </section>
  );
}

function ValidationBrand({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#f8faf9_0%,#f1f5f3_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:h-28 sm:w-28">
        <Image
          src="/ucp-sante-logo-color.png"
          alt="Logo UCP"
          width={78}
          height={78}
          className="object-contain"
          style={{ width: "auto", height: "auto" }}
        />
      </div>
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-bold text-slate-900">{title}</h1>
      <p className="mt-2 text-sm font-semibold text-slate-500">{subtitle}</p>
      <div className="login-line-glow mx-auto mt-3 h-px w-24 bg-[linear-gradient(90deg,rgba(34,197,94,0),rgba(34,197,94,0.8),rgba(34,197,94,0))]" />
    </div>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

const getRole = (value: string | null): PublicValidationRole | null =>
  value === "membre" || value === "president" ? value : null;

const getQueryParam = (
  searchParams: ReturnType<typeof useSearchParams>,
  key: string,
) => searchParams.get(key) ?? searchParams.get(`amp;${key}`);

const getActionClass = (tone: string) => {
  if (tone === "success") return "bg-emerald-600 hover:bg-emerald-700";
  if (tone === "warning") return "bg-amber-600 hover:bg-amber-700";
  return "bg-rose-600 hover:bg-rose-700";
};

const getDecisionLabel = (decision: PublicValidationDecision) => {
  if (decision === "APPROUVER") return "Approuver";
  if (decision === "VALIDER") return "Valider";
  if (decision === "REPORTER") return "Reporter";
  return "Rejeter";
};
