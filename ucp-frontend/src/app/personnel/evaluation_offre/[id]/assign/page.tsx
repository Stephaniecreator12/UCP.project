"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Loader,
  Send,
  UserCheck,
  ArrowLeft,
  FileText,
  User,
  Calendar,
  X,
} from "lucide-react";
import TopHeader from "@/app/components/TopHeader";
import {
  assignDaoEvaluators,
  fetchDaoDetail,
  resendDaoEvaluatorInvitations,
  type AssignationPayload,
  type DaoDetail,
} from "@/services/evaluationService";
import { getToken } from "@/services/auth";

interface ManualMember {
  key: string;
  nomPrenom: string;
  email: string;
  entite: string;
  poste: string;
  cin: string;
}

const emptyMembers = (): ManualMember[] => [
  { key: "1", nomPrenom: "", email: "", entite: "", poste: "", cin: "" },
  { key: "2", nomPrenom: "", email: "", entite: "", poste: "", cin: "" },
  { key: "3", nomPrenom: "", email: "", entite: "", poste: "", cin: "" },
];

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDeadline(detail: DaoDetail) {
  return formatDateTime(
    detail.date_limite_soumission ?? detail.date_seance ?? null,
  );
}

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-50 transition";
const disabledClass =
  "w-full rounded-xl border border-slate-200 bg-slate-100/75 px-3 py-2.5 text-sm font-semibold text-slate-500 cursor-not-allowed";
const labelClass =
  "mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500";

function splitNifStat(value?: string) {
  const raw = (value ?? "").trim();
  if (!raw) {
    return { nif: "", stat: "" };
  }
  const [nif, ...rest] = raw.split("/");
  return { nif: nif.trim(), stat: rest.join("/").trim() };
}

export default function AssignEvaluatorsPage() {
  const params = useParams();
  const router = useRouter();
  const seanceId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendSubmitting, setResendSubmitting] = useState(false);
  const [detail, setDetail] = useState<DaoDetail | null>(null);

  const [dateEvaluation, setDateEvaluation] = useState("");
  const [heureEvaluation, setHeureEvaluation] = useState("09:00");
  const [members, setMembers] = useState<ManualMember[]>(emptyMembers());
  const [offreMeta, setOffreMeta] = useState<
    Record<number, { lot: string; nif: string; stat: string }>
  >({});

  const loadDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchDaoDetail(seanceId);
      setDetail(data);

      setDateEvaluation(
        data.date_evaluation?.slice(0, 10) ||
          new Date().toISOString().slice(0, 10),
      );
      setHeureEvaluation(data.heure_evaluation?.slice(0, 5) || "09:00");

      setOffreMeta(
        Object.fromEntries(
          data.offres.map((o) => {
            const parsed = splitNifStat(o.nif_stat);
            return [
              o.offre_id,
              {
                lot: o.lot_numero || "",
                nif: o.nif || parsed.nif,
                stat: o.stat || parsed.stat,
              },
            ];
          }),
        ),
      );

      if (data.evaluateurs && data.evaluateurs.length > 0) {
        setMembers(
          data.evaluateurs.map((ev, i) => ({
            key: String(i + 1),
            nomPrenom: ev.nom,
            email: ev.email,
            entite: ev.entite,
            poste: ev.poste,
            cin: "",
          })),
        );
      } else {
        setMembers(emptyMembers());
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des détails du DAO",
      );
    } finally {
      setLoading(false);
    }
  }, [seanceId]);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    void loadDetail();
  }, [loadDetail, router]);

  const updateMember = (
    key: string,
    field: keyof Omit<ManualMember, "key">,
    value: string,
  ) => {
    setMembers((prev) =>
      prev.map((m) => (m.key === key ? { ...m, [field]: value } : m)),
    );
  };

  const handleAssign = async () => {
    if (!detail) return;
    setError("");
    setSuccess("");

    if (!dateEvaluation) {
      setError("Indiquez la date de début d'évaluation.");
      return;
    }
    if (!heureEvaluation) {
      setError("Indiquez l'heure de début d'évaluation.");
      return;
    }

    for (const offre of detail.offres) {
      const meta = offreMeta[offre.offre_id];
      if (!meta?.lot.trim()) {
        setError(`Lot n° requis pour ${offre.nom_soumissionnaire}.`);
        return;
      }
      if (!meta?.nif.trim()) {
        setError(`NIF requis pour ${offre.nom_soumissionnaire}.`);
        return;
      }
      if (!meta?.stat.trim()) {
        setError(`STAT requis pour ${offre.nom_soumissionnaire}.`);
        return;
      }
    }

    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      if (
        !m.nomPrenom.trim() ||
        !m.email.trim() ||
        !m.entite.trim() ||
        !m.poste.trim()
      ) {
        setError(`Complétez l'évaluateur ${i + 1}.`);
        return;
      }
      if (!m.cin.trim() || m.cin.length !== 12) {
        setError(
          `CIN invalide pour l'évaluateur ${i + 1}. (12 chiffres requis)`,
        );
        return;
      }
    }

    const emails = members.map((m) => m.email.trim().toLowerCase());
    if (new Set(emails).size !== 3) {
      setError("Les emails des évaluateurs doivent être distincts.");
      return;
    }

    try {
      setSubmitting(true);
      const payload: AssignationPayload = {
        date_evaluation: dateEvaluation,
        heure_evaluation: heureEvaluation,
        offres: detail.offres.map((o) => ({
          offre_id: o.offre_id,
          lot_numero: offreMeta[o.offre_id]?.lot.trim(),
          nif: offreMeta[o.offre_id]?.nif.trim(),
          stat: offreMeta[o.offre_id]?.stat.trim(),
        })),
        commission_members: members.map((m) => ({
          nomPrenom: m.nomPrenom.trim(),
          email: m.email.trim(),
          entite: m.entite.trim(),
          poste: m.poste.trim(),
          cin: m.cin.trim(),
        })),
      };

      const result = await assignDaoEvaluators(seanceId, payload);
      setSuccess(result.detail);
      setTimeout(() => {
        router.push("/personnel/evaluation_offre");
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'assignation",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const canAssign =
    detail?.statut_dao === "A_ASSIGNER" ||
    (detail?.evaluateurs.length ?? 0) < 3;

  const canResendInvitations = (detail?.evaluateurs.length ?? 0) > 0;

  const handleResendInvitations = async () => {
    if (!detail || !canResendInvitations) return;

    try {
      setError("");
      setSuccess("");
      setResendSubmitting(true);
      const result = await resendDaoEvaluatorInvitations(seanceId);
      setSuccess(result.detail);
      await loadDetail();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors du renvoi des invitations",
      );
    } finally {
      setResendSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f8faf9_0%,#f1f5f3_100%)]">
        <TopHeader />
        <div className="flex h-[60vh] items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-emerald-700" />
        </div>
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f8faf9_0%,#f1f5f3_100%)]">
        <TopHeader />
        <div className="mx-auto max-w-4xl px-4 py-8">
          <button
            type="button"
            onClick={() => router.push("/personnel/evaluation_offre")}
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au tableau de bord
          </button>
          <div className="rounded-[22px] border border-rose-200 bg-rose-50 p-6 shadow-sm">
            <div className="flex gap-3 text-rose-800">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold">Erreur de chargement</h3>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8faf9_0%,#f1faf9_100%)]">
      <TopHeader />
      <main className="mx-auto max-w-[1680px] px-6 py-8 sm:px-8">
        {/* Navigation & Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => router.push("/personnel/evaluation_offre")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
            <UserCheck className="h-3.5 w-3.5" />
            Assignation évaluateurs
          </span>
        </div>

        <section className="mb-8 overflow-hidden rounded-[30px] border border-white bg-[linear-gradient(145deg,#ffffff_0%,#f9fbf9_50%,#f1f6f2_100%)] shadow-sm">
          <div className="h-1 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400" />
          <div className="p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Assignation des évaluateurs
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Configurez le calendrier, complétez les informations des offres et
              désignez les 3 membres de la commission d&apos;évaluation.
            </p>
          </div>
        </section>

        {detail && (
          <div className="space-y-6">
            {/* DAO ID, Scheduling & Offer Details */}
            <div className="space-y-6">
              {/* 1. Identification du DAO (Read-only) */}
              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    Identification du DAO
                  </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className={labelClass}>N° AO/DP</span>
                    <div className={disabledClass}>
                      {detail.reference_dossier}
                    </div>
                  </div>
                  <div>
                    <span className={labelClass}>Intitulé du marché</span>
                    <div className={disabledClass}>{detail.objet_dossier}</div>
                  </div>
                  <div>
                    <span className={labelClass}>
                      Date limite de dépôt des offres
                    </span>
                    <div className={disabledClass}>
                      {formatDeadline(detail)}
                    </div>
                  </div>
                  <div>
                    <span className={labelClass}>Représentant Budget</span>
                    <div className={disabledClass}>À définir</div>
                  </div>
                </div>
              </article>

              {/* 2. Planification de l'évaluation */}
              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    Planification de l&apos;évaluation
                  </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className={labelClass}>Date d&apos;évaluation *</span>
                    <input
                      type="date"
                      disabled={!canAssign}
                      className={canAssign ? fieldClass : disabledClass}
                      value={dateEvaluation}
                      onChange={(e) => setDateEvaluation(e.target.value)}
                    />
                  </div>
                  <div>
                    <span className={labelClass}>Heure de début *</span>
                    <input
                      type="time"
                      disabled={!canAssign}
                      className={canAssign ? fieldClass : disabledClass}
                      value={heureEvaluation}
                      onChange={(e) => setHeureEvaluation(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Les invitations et codes d&apos;accès sont envoyés dès la
                  confirmation.
                </p>
              </article>

              {/* 3. Détails des Offres (Lot et NIF/STAT par Soumissionnaire) */}
              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    Offres — Lot et NIF/STAT (par soumissionnaire)
                  </h2>
                </div>
                <div className="grid gap-4">
                  {detail.offres.map((offre) => (
                    <div
                      key={offre.offre_id}
                      className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3"
                    >
                      <p className="text-sm font-bold text-slate-800">
                        Offre {offre.ordre_passage} —{" "}
                        {offre.nom_soumissionnaire}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <label>
                          <span className={labelClass}>Lot n° *</span>
                          <input
                            disabled={!canAssign}
                            className={canAssign ? fieldClass : disabledClass}
                            value={offreMeta[offre.offre_id]?.lot ?? ""}
                            onChange={(e) =>
                              setOffreMeta((p) => ({
                                ...p,
                                [offre.offre_id]: {
                                  lot: e.target.value,
                                  nif: p[offre.offre_id]?.nif ?? "",
                                  stat: p[offre.offre_id]?.stat ?? "",
                                },
                              }))
                            }
                            placeholder="Ex: Lot 1, Global, etc."
                          />
                        </label>
                        <label>
                          <span className={labelClass}>NIF *</span>
                          <input
                            disabled={!canAssign}
                            className={canAssign ? fieldClass : disabledClass}
                            value={offreMeta[offre.offre_id]?.nif ?? ""}
                            onChange={(e) =>
                              setOffreMeta((p) => ({
                                ...p,
                                [offre.offre_id]: {
                                  lot: p[offre.offre_id]?.lot ?? "",
                                  nif: e.target.value,
                                  stat: p[offre.offre_id]?.stat ?? "",
                                },
                              }))
                            }
                            placeholder="NIF du soumissionnaire"
                          />
                        </label>
                        <label>
                          <span className={labelClass}>STAT *</span>
                          <input
                            disabled={!canAssign}
                            className={canAssign ? fieldClass : disabledClass}
                            value={offreMeta[offre.offre_id]?.stat ?? ""}
                            onChange={(e) =>
                              setOffreMeta((p) => ({
                                ...p,
                                [offre.offre_id]: {
                                  lot: p[offre.offre_id]?.lot ?? "",
                                  nif: p[offre.offre_id]?.nif ?? "",
                                  stat: e.target.value,
                                },
                              }))
                            }
                            placeholder="Identifiant STAT du soumissionnaire"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            {/* Evaluators & Actions */}
            <div className="space-y-6">
              {/* 4. 3 Évaluateurs de la Commission */}
              <article className="rounded-3xl border border-emerald-100 bg-emerald-50/20 p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2 border-b border-emerald-100 pb-3">
                  <User className="h-5 w-5 text-emerald-700" />
                  <h2 className="text-base font-bold text-emerald-800">
                    Désignation des 3 évaluateurs
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-emerald-100 text-left text-emerald-900">
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">
                          N°
                        </th>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">
                          Nom et prénom
                        </th>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">
                          CIN
                        </th>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">
                          Entité
                        </th>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">
                          Poste
                        </th>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">
                          Email
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {members.map((member, idx) => (
                        <tr key={member.key} className="bg-white">
                          <td className="px-3 py-3 text-slate-600">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-3">
                            <input
                              disabled={!canAssign}
                              placeholder="Nom et prénom"
                              className={canAssign ? fieldClass : disabledClass}
                              value={member.nomPrenom}
                              onChange={(e) =>
                                updateMember(
                                  member.key,
                                  "nomPrenom",
                                  e.target.value,
                                )
                              }
                            />
                          </td>
                          <td className="px-3 py-3">
                            <input
                              disabled={!canAssign}
                              placeholder="CIN"
                              className={canAssign ? fieldClass : disabledClass}
                              value={member.cin}
                              onChange={(e) =>
                                updateMember(
                                  member.key,
                                  "cin",
                                  e.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 12),
                                )
                              }
                            />
                          </td>
                          <td className="px-3 py-3">
                            <input
                              disabled={!canAssign}
                              placeholder="Entité"
                              className={canAssign ? fieldClass : disabledClass}
                              value={member.entite}
                              onChange={(e) =>
                                updateMember(
                                  member.key,
                                  "entite",
                                  e.target.value,
                                )
                              }
                            />
                          </td>
                          <td className="px-3 py-3">
                            <input
                              disabled={!canAssign}
                              placeholder="Poste"
                              className={canAssign ? fieldClass : disabledClass}
                              value={member.poste}
                              onChange={(e) =>
                                updateMember(
                                  member.key,
                                  "poste",
                                  e.target.value,
                                )
                              }
                            />
                          </td>
                          <td className="px-3 py-3">
                            <input
                              type="email"
                              disabled={!canAssign}
                              placeholder="Email"
                              className={canAssign ? fieldClass : disabledClass}
                              value={member.email}
                              onChange={(e) =>
                                updateMember(
                                  member.key,
                                  "email",
                                  e.target.value,
                                )
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>

              {canResendInvitations && (
                <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-emerald-950">
                      Invitations évaluateurs
                    </p>
                    <p className="text-xs font-semibold text-emerald-700">
                      Le renvoi remplace les anciens mots de passe.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={resendSubmitting}
                    onClick={() => void handleResendInvitations()}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {resendSubmitting ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {resendSubmitting ? "Renvoi..." : "Renvoyer invitations"}
                  </button>
                </div>
              )}

              {/* Actions */}
              {canAssign && (
                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleAssign}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-800 disabled:opacity-60 transition"
                  >
                    {submitting ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Confirmer et envoyer les accès
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <GlassNotificationPopup
            type="error"
            message={error}
            onClose={() => setError("")}
          />
        )}
        {success && (
          <GlassNotificationPopup
            type="success"
            message={success}
            onClose={() => setSuccess("")}
          />
        )}
      </main>
    </div>
  );
}

function GlassNotificationPopup({
  type,
  message,
  onClose,
}: {
  type: "error" | "success";
  message: string;
  onClose: () => void;
}) {
  const isError = type === "error";

  useEffect(() => {
    const timeout = window.setTimeout(onClose, 5000);
    return () => window.clearTimeout(timeout);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-[150] flex w-[min(92vw,31rem)] items-start gap-4 rounded-[24px] border p-5 backdrop-blur-xl shadow-[0_30px_60px_-15px_rgba(15,23,42,0.3)] transition-all duration-300 animate-in slide-in-from-bottom-5 ${
        isError
          ? "border-rose-500/30 bg-rose-500/10 text-rose-900 shadow-rose-950/5 ring-1 ring-rose-500/25"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 shadow-emerald-950/5 ring-1 ring-emerald-500/25"
      }`}
      role="status"
    >
      <div
        className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
          isError
            ? "border-rose-500/30 bg-rose-500/20 text-rose-700"
            : "border-emerald-500/30 bg-emerald-500/20 text-emerald-700"
        }`}
      >
        {isError ? (
          <AlertCircle className="h-5 w-5 animate-pulse" />
        ) : (
          <CheckCircle2 className="h-5 w-5 animate-bounce" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`text-[15px] font-black tracking-tight ${isError ? "text-rose-950" : "text-emerald-950"}`}
        >
          {isError ? "Action impossible" : "Action enregistrée"}
        </p>
        <p
          className={`mt-1 text-[13px] font-medium leading-relaxed ${isError ? "text-rose-900/90" : "text-emerald-900/90"}`}
        >
          {message}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className={`rounded-xl p-2 transition-colors ${
          isError
            ? "text-rose-700 hover:bg-rose-500/25 hover:text-rose-950"
            : "text-emerald-700 hover:bg-emerald-500/25 hover:text-emerald-950"
        }`}
        aria-label="Fermer la notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
