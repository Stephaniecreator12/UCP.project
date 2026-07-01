"use client";

import type { ElementType } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";

import type { ProcurementMarket } from "@/types/procurement";
import type { SeanceOuverture } from "@/types/ouvertureOffre";

type SeanceOverviewDetailsProps = {
  seance: SeanceOuverture;
  market: ProcurementMarket | null;
  members?: MemberItem[];
  presidentLabel?: string;
  compact?: boolean;
};

type OfferItem = SeanceOuverture["offres"][number];
type MemberItem = SeanceOuverture["membres"][number];

const procedureLabels: Record<string, string> = {
  AOI: "AOI",
  AON: "AON",
  DC: "DC",
  GRE_A_GRE: "Gré à gré",
};

const categoryLabels: Record<string, string> = {
  BIENS: "Biens",
  SERVICES: "Services",
  INFRA: "Travaux",
};

const openingStepLabels: Record<SeanceOuverture["etape_ouverture"], string> = {
  COMPLETE: "Ouverture complète",
  ADMIN_TECH: "Administrative et technique",
};

const sealedStateLabels: Record<string, string> = {
  INTACT: "Scellé intact",
  ALTERE: "Scellé altéré",
  ABSENT: "Scellé absent",
};

const envelopeLabels: Record<string, string> = {
  DEPOSEE: "Déposée",
  MANQUANTE: "Manquante",
  RECU: "Reçu",
  INTEGRE: "Intègre",
  MANQUANT: "Manquant",
};

const formatDate = (value?: string | null) => {
  if (!value) return "Non renseignée";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(parsed);
};

const formatTime = (value?: string | null) => {
  if (!value) return "Non renseignée";
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("fr-FR", {
    timeStyle: "short",
  }).format(parsed);
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "Non renseignée";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};

const formatMoney = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "")
    return "Non renseigné";

  const amount = Number(value);
  if (!Number.isFinite(amount)) return String(value);

  return `${amount.toLocaleString("fr-FR")} Ar`;
};

const getProgressSummary = (members: MemberItem[]) => {
  const presentMembers = members.filter((member) => member.est_present);
  const decidedMembers = presentMembers.filter(
    (member) => member.decision !== "EN_ATTENTE",
  );

  return {
    presentCount: presentMembers.length,
    decidedCount: decidedMembers.length,
    totalCount: members.length,
  };
};

const getMemberName = (member: MemberItem) =>
  member.nom_prenom?.trim() ||
  member.utilisateur_detail.full_name?.trim() ||
  member.utilisateur_detail.username ||
  "Nom non renseigné";

const getMemberDecisionLabel = (member: MemberItem) => {
  if (member.decision === "VALIDEE") return "Validé";
  if (member.decision === "REJETEE") return "Rejeté";
  return "En attente";
};

const getPresidentDecisionLabel = (
  decision: SeanceOuverture["president_decision"],
) => {
  if (decision === "VALIDEE") return "Validation enregistrée";
  if (decision === "REJETEE") return "Rejet enregistré";
  if (decision === "REPORTEE") return "Report enregistré";
  return "En attente";
};

const getPresidentDecisionClasses = (
  decision: SeanceOuverture["president_decision"],
) => {
  if (decision === "VALIDEE") {
    return {
      box: "border-emerald-100 bg-emerald-50",
      label: "text-emerald-500",
      value: "text-emerald-900",
    };
  }

  if (decision === "REJETEE") {
    return {
      box: "border-rose-100 bg-rose-50",
      label: "text-rose-500",
      value: "text-rose-900",
    };
  }

  return {
    box: "border-amber-100 bg-amber-50",
    label: "text-amber-500",
    value: "text-amber-900",
  };
};

function InfoCard({
  icon: Icon,
  label,
  value,
  compact = false,
}: {
  icon: ElementType;
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${compact ? "px-3 py-2.5" : "px-4 py-3"}`}
    >
      <div
        className={`flex items-center gap-2 text-slate-500 ${compact ? "mb-1.5" : "mb-2"}`}
      >
        <Icon className="h-4 w-4" />
        <span className="text-[10px] font-black uppercase tracking-widest">
          {label}
        </span>
      </div>
      <p
        className={`${compact ? "text-[13px]" : "text-sm"} font-bold text-slate-900`}
      >
        {value}
      </p>
    </div>
  );
}

const formatOfferReception = (offre: OfferItem) => {
  if (offre.date_reception_pli && offre.heure_reception_pli) {
    return `Réception : ${formatDate(offre.date_reception_pli)} à ${formatTime(offre.heure_reception_pli)}`;
  }
  if (offre.date_reception_pli) {
    return `Réception : ${formatDate(offre.date_reception_pli)}`;
  }
  if (offre.heure_reception_pli) {
    return `Réception : ${formatTime(offre.heure_reception_pli)}`;
  }
  return "Réception non renseignée";
};

const getEnvelopeBadge = (value: string, notApplicable = false) => {
  if (notApplicable && !value) {
    return {
      label: "Non concernée",
      className: "border-slate-200 bg-slate-100 text-slate-500",
    };
  }
  if (value === "DEPOSEE" || value === "RECU" || value === "INTEGRE") {
    return {
      label: envelopeLabels[value] || value,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }
  if (value === "MANQUANTE" || value === "MANQUANT") {
    return {
      label: envelopeLabels[value] || value,
      className: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }

  return {
    label: "Non précisée",
    className: "border-slate-200 bg-slate-50 text-slate-500",
  };
};

const getOfferObservation = (offre: OfferItem) => {
  return offre.observations || "Aucune observation";
};

function EnvelopeBadge({
  value,
  notApplicable = false,
}: {
  value: string;
  notApplicable?: boolean;
}) {
  const badge = getEnvelopeBadge(value, notApplicable);

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}

export default function SeanceOverviewDetails({
  seance,
  market,
  members,
  presidentLabel,
  compact = false,
}: SeanceOverviewDetailsProps) {
  const showMontantColumn = seance.etape_ouverture === "COMPLETE";
  const displayMembers = members ?? seance.membres;
  const progress = getProgressSummary(displayMembers);
  const sessionObservation = seance.observations?.trim();
  const presidentComment = seance.president_commentaire?.trim();
  const ratureComment =
    seance.presence_rature && seance.description_rature?.trim()
      ? seance.description_rature.trim()
      : "";
  const hasUsefulComments = Boolean(sessionObservation || ratureComment);
  const secretaryLabel =
    seance.secretaire_detail?.full_name?.trim() ||
    seance.secretaire_detail?.username ||
    "Non renseigné";
  const resolvedPresidentLabel =
    presidentLabel?.trim() ||
    seance.president_detail?.full_name?.trim() ||
    seance.president_detail?.username ||
    "Non désigné";
  const presidentDecisionClasses = getPresidentDecisionClasses(
    seance.president_decision,
  );
  const presidentStatusClass = presidentDecisionClasses.box;
  const presidentStatusTextClass = presidentDecisionClasses.label;
  const presidentStatusValueClass = presidentDecisionClasses.value;
  const presidentStatusLabel = getPresidentDecisionLabel(
    seance.president_decision,
  );
  const wrapperSpaceClass = compact ? "space-y-3" : "space-y-5";
  const infoGridClass = compact
    ? "grid gap-2 md:grid-cols-2 xl:grid-cols-4"
    : "grid gap-3 lg:grid-cols-4";
  const overviewProgressGridClass = compact
    ? "grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(250px,320px)]"
    : "grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]";
  const splitGridClass = hasUsefulComments
    ? compact
      ? "grid gap-3 xl:grid-cols-[1.15fr_0.85fr]"
      : "grid gap-4 xl:grid-cols-[1fr_1fr]"
    : compact
      ? "grid gap-3 xl:grid-cols-1"
      : "grid gap-4 xl:grid-cols-1";
  const primarySectionClass = compact
    ? "rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
    : "rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm";
  const cardSectionClass = compact
    ? "rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
    : "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm";
  const progressGridClass = compact
    ? "grid gap-2 sm:grid-cols-3 xl:grid-cols-1"
    : "grid gap-3 sm:grid-cols-3 xl:grid-cols-1";
  const tablePaddingClass = compact ? "px-2.5 py-2.5" : "px-3 py-3";
  const referenceLabel = seance.reference_dossier?.trim() || "Non renseignée";
  const objectLabel = seance.objet_dossier?.trim() || "Non renseigné";
  const commissionRows = displayMembers.map((member, index) => ({
    key: member.id,
    name: getMemberName(member),
    email:
      member.utilisateur_detail.email?.trim() ||
      member.utilisateur_detail.username?.trim() ||
      "-",
    numeroCarte: member.numero_carte || "-",
    intitule: member.intitule || "-",
    poste: member.poste || "-",
    presenceLabel: member.est_present ? "Présent" : "Absent",
    presenceClass: member.est_present
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-slate-200 bg-slate-100 text-slate-500",
    decisionLabel: getMemberDecisionLabel(member),
    decisionClasses: {
      box:
        member.decision === "VALIDEE"
          ? "border-indigo-200 bg-indigo-50"
          : member.decision === "REJETEE"
            ? "border-rose-200 bg-rose-50"
            : "border-amber-200 bg-amber-50",
      label:
        member.decision === "VALIDEE"
          ? "text-indigo-500"
          : member.decision === "REJETEE"
            ? "text-rose-500"
            : "text-amber-500",
      value:
        member.decision === "VALIDEE"
          ? "text-indigo-900"
          : member.decision === "REJETEE"
            ? "text-rose-900"
            : "text-amber-900",
    },
    dateLabel: member.date_validation
      ? formatDateTime(member.date_validation)
      : "Date/heure non renseignée",
    commentaire: member.commentaire?.trim() || "Aucun commentaire",
    index: index + 1,
  }));

  return (
    <div className={wrapperSpaceClass}>
      <section
        className={
          compact ? "grid gap-2 md:grid-cols-2" : "grid gap-3 md:grid-cols-2"
        }
      >
        <InfoCard
          icon={FileText}
          label="Référence du dossier"
          value={referenceLabel}
          compact={compact}
        />
        <InfoCard
          icon={FileText}
          label="Objet du dossier"
          value={objectLabel}
          compact={compact}
        />
      </section>

      <section className={infoGridClass}>
        <InfoCard
          icon={CalendarDays}
          label="Date de séance"
          value={formatDate(seance.date_seance)}
          compact={compact}
        />
        <InfoCard
          icon={Clock3}
          label="Heure de séance"
          value={formatTime(seance.heure_seance)}
          compact={compact}
        />
        <InfoCard
          icon={MapPin}
          label="Lieu"
          value={seance.lieu || "Non renseigné"}
          compact={compact}
        />
        <InfoCard
          icon={FileText}
          label="Étape d'ouverture"
          value={openingStepLabels[seance.etape_ouverture]}
          compact={compact}
        />
      </section>

      <section className={overviewProgressGridClass}>
        <div className={primarySectionClass}>
          <div
            className={`flex items-center gap-2 ${compact ? "mb-3" : "mb-4"}`}
          >
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-black text-slate-900">
              Vue d&apos;ensemble de la séance
            </h3>
          </div>

          <div className={`grid md:grid-cols-2 ${compact ? "gap-2" : "gap-3"}`}>
            <div
              className={`rounded-2xl border border-slate-200 bg-white ${compact ? "p-3" : "p-4"}`}
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Secrétaire
              </p>
              <p className="mt-2 text-sm font-bold text-slate-900">
                {secretaryLabel}
              </p>
            </div>
            <div
              className={`rounded-2xl border border-slate-200 bg-white ${compact ? "p-3" : "p-4"}`}
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Président
              </p>
              <p className="mt-2 text-sm font-bold text-slate-900">
                {resolvedPresidentLabel}
              </p>
            </div>
            <div
              className={`rounded-2xl border border-slate-200 bg-white ${compact ? "p-3" : "p-4"}`}
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Scellé
              </p>
              <p className="mt-2 text-sm font-bold text-slate-900">
                {sealedStateLabels[seance.etat_scelle] || "Non renseigné"}
              </p>
            </div>
            <div
              className={`rounded-2xl border border-slate-200 bg-white ${compact ? "p-3" : "p-4"}`}
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Document de substitution
              </p>
              <p className="mt-2 text-sm font-bold text-slate-900">
                {seance.document_substitution_present
                  ? "Présent"
                  : "Non signalé"}
              </p>
            </div>
          </div>

          {(market?.procedure_type || market?.category || market?.deadline) && (
            <div
              className={`rounded-2xl border border-slate-200 bg-white ${compact ? "mt-3 p-3" : "mt-4 p-4"}`}
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Références DAO
              </p>
              <div
                className={`${compact ? "mt-2.5" : "mt-3"} flex flex-wrap gap-2`}
              >
                {market?.procedure_type && (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    Procédure :{" "}
                    {procedureLabels[market.procedure_type] ||
                      market.procedure_type}
                  </span>
                )}
                {market?.category && (
                  <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Catégorie :{" "}
                    {categoryLabels[market.category] || market.category}
                  </span>
                )}
                {market?.deadline && (
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                    Limite dépôt : {formatDate(market.deadline)} à{" "}
                    {formatTime(market.deadline)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={`${cardSectionClass} xl:self-start`}>
          <div
            className={`flex items-center gap-2 ${compact ? "mb-3" : "mb-4"}`}
          >
            <Users className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-black text-slate-900">
              Progression de validation
            </h3>
          </div>

          <div className={progressGridClass}>
            <div
              className={`rounded-2xl border border-indigo-100 bg-indigo-50 ${compact ? "p-3" : "p-4"}`}
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
                Membres présents
              </p>
              <p className="mt-2 text-2xl font-black text-indigo-900">
                {progress.presentCount}
                <span className="ml-1 text-sm font-bold text-indigo-500">
                  membre{progress.presentCount > 1 ? "s" : ""} présent
                  {progress.presentCount > 1 ? "s" : ""}
                </span>
              </p>
              <p className="mt-1 text-xs font-semibold text-indigo-500">
                {progress.totalCount > 0
                  ? `sur ${progress.totalCount} membre${progress.totalCount > 1 ? "s" : ""} enregistré${progress.totalCount > 1 ? "s" : ""}`
                  : "Aucun membre enregistré"}
              </p>
            </div>
            <div
              className={`rounded-2xl border border-emerald-100 bg-emerald-50 ${compact ? "p-3" : "p-4"}`}
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                Avis membres
              </p>
              <p className="mt-2 text-2xl font-black text-emerald-900">
                {progress.decidedCount}
                <span className="ml-1 text-sm font-bold text-emerald-500">
                  avis reçus
                </span>
              </p>
              <p className="mt-1 text-xs font-semibold text-emerald-500">
                {progress.presentCount > 0
                  ? `sur ${progress.presentCount} présent${progress.presentCount > 1 ? "s" : ""}`
                  : "Aucun membre présent"}
              </p>
            </div>
            <div
              className={`rounded-2xl border ${compact ? "p-3" : "p-4"} ${presidentStatusClass}`}
            >
              <p
                className={`text-[10px] font-black uppercase tracking-widest ${presidentStatusTextClass}`}
              >
                Décision président
              </p>
              <p
                className={`mt-2 text-sm font-black ${presidentStatusValueClass}`}
              >
                {presidentStatusLabel}
              </p>
              {seance.date_validation_president && (
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {formatDate(seance.date_validation_president)} à{" "}
                  {formatTime(seance.date_validation_president)}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className={splitGridClass}>
        <div className={cardSectionClass}>
          <div
            className={`flex items-center gap-2 ${compact ? "mb-3" : "mb-4"}`}
          >
            <UserCheck className="h-5 w-5 text-sky-600" />
            <h3 className="text-base font-black text-slate-900">
              Détails de validation
            </h3>
          </div>

          <div className={compact ? "space-y-2" : "space-y-3"}>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                Membres de commission
              </p>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full min-w-[720px] table-auto text-left">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    <th className={`w-12 ${tablePaddingClass}`}>#</th>
                    <th className={tablePaddingClass}>Nom & prénom</th>
                    <th className={tablePaddingClass}>Email</th>
                    <th className={tablePaddingClass}>Présence</th>
                    <th className={tablePaddingClass}>N° carte</th>
                    <th className={tablePaddingClass}>Intitulé</th>
                    <th className={tablePaddingClass}>Poste</th>
                    <th className={tablePaddingClass}>Validation</th>
                    <th className={tablePaddingClass}>Commentaire</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {commissionRows.length > 0 ? (
                    commissionRows.map((row) => (
                      <tr
                        key={row.key}
                        className="border-b border-slate-100 align-top text-sm text-slate-700 last:border-b-0"
                      >
                        <td className={tablePaddingClass}>
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                            {row.index}
                          </span>
                        </td>
                        <td className={tablePaddingClass}>
                          <p className="font-bold text-slate-900">{row.name}</p>
                        </td>
                        <td className={tablePaddingClass}>
                          <p className="text-xs font-medium text-slate-500 break-words">
                            {row.email}
                          </p>
                        </td>
                        <td className={tablePaddingClass}>
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${row.presenceClass}`}
                          >
                            {row.presenceLabel}
                          </span>
                        </td>
                        <td className={tablePaddingClass}>
                          <p className="text-sm font-semibold leading-relaxed text-slate-700">
                            {row.numeroCarte}
                          </p>
                        </td>
                        <td className={tablePaddingClass}>
                          <p className="text-sm font-semibold leading-relaxed text-slate-700">
                            {row.intitule}
                          </p>
                        </td>
                        <td className={tablePaddingClass}>
                          <p className="text-sm font-semibold leading-relaxed text-slate-700">
                            {row.poste}
                          </p>
                        </td>
                        <td className={tablePaddingClass}>
                          <div className="flex flex-wrap gap-1.5">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${row.decisionClasses.box}`}
                            >
                              {row.decisionLabel}
                            </span>
                          </div>
                          <p
                            className={`mt-2 text-xs font-semibold ${row.decisionClasses.value}`}
                          >
                            {row.dateLabel}
                          </p>
                        </td>
                        <td className={tablePaddingClass}>
                          <p className="text-sm leading-relaxed text-slate-700">
                            {row.commentaire}
                          </p>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={9}
                        className={`${tablePaddingClass} text-center text-sm font-semibold text-slate-500`}
                      >
                        Aucun membre de commission configuré pour cette séance.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Décision du président
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Président
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {resolvedPresidentLabel}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {seance.president_detail?.email?.trim() ||
                      seance.president_detail?.username ||
                      "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Statut
                  </p>
                  <span
                    className={`mt-1 inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${presidentStatusClass}`}
                  >
                    {presidentStatusLabel}
                  </span>
                  {seance.date_validation_president && (
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      {formatDate(seance.date_validation_president)} à{" "}
                      {formatTime(seance.date_validation_president)}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                  Commentaire président
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  {presidentComment || "Aucune observation"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {hasUsefulComments && (
          <div className={cardSectionClass}>
            <div
              className={`flex items-center gap-2 ${compact ? "mb-3" : "mb-4"}`}
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <h3 className="text-base font-black text-slate-900">
                Observations
              </h3>
            </div>

            <div className={compact ? "space-y-2" : "space-y-3"}>
              {sessionObservation && (
                <div
                  className={`rounded-2xl border border-slate-200 bg-slate-50/70 ${compact ? "p-3" : "p-4"}`}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Observation de séance
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">
                    {sessionObservation}
                  </p>
                </div>
              )}
              {ratureComment && (
                <div
                  className={`rounded-2xl border border-amber-200 bg-amber-50 ${compact ? "p-3" : "p-4"}`}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                    Mention particulière
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-amber-900">
                    {ratureComment}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <section className={cardSectionClass}>
        <div className={`flex items-center gap-2 ${compact ? "mb-3" : "mb-4"}`}>
          <FileText className="h-5 w-5 text-violet-600" />
          <h3 className="text-base font-black text-slate-900">
            Offres enregistrées
          </h3>
        </div>

        <div className="space-y-3">
          {seance.offres.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full w-full table-auto text-left">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200 text-center text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                    <th className={`w-12 ${tablePaddingClass}`}>#</th>
                    <th className={`w-44 ${tablePaddingClass}`}>
                      Soumissionnaire
                    </th>
                    <th className={`w-56 ${tablePaddingClass}`}>
                      Date/Heure de réception
                    </th>
                    <th className={`w-32 ${tablePaddingClass}`}>Env. admin.</th>
                    <th className={`w-32 ${tablePaddingClass}`}>Env. tech.</th>
                    <th className={`w-32 ${tablePaddingClass}`}>Env. fin.</th>
                    {showMontantColumn && (
                      <th className={`w-32 ${tablePaddingClass}`}>Montant</th>
                    )}
                    <th className={tablePaddingClass}>Observation</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {seance.offres.map((offre, index) => (
                    <tr
                      key={offre.id}
                      className="border-b align-top text-sm text-slate-700 last:border-b-0 border-slate-100"
                    >
                      <td className={tablePaddingClass}>
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                          {offre.ordre_passage || index + 1}
                        </span>
                      </td>
                      <td className={tablePaddingClass}>
                        <p className="font-bold text-slate-900">
                          {offre.nom_soumissionnaire ||
                            "Soumissionnaire non renseigné"}
                        </p>
                      </td>
                      <td className={tablePaddingClass}>
                        <p className="text-xs font-semibold leading-relaxed text-slate-700">
                          {formatOfferReception(offre)}
                        </p>
                      </td>
                      <td className={`${tablePaddingClass} text-center`}>
                        <EnvelopeBadge value={offre.enveloppe_administrative} />
                      </td>
                      <td className={`${tablePaddingClass} text-center`}>
                        <EnvelopeBadge value={offre.enveloppe_technique} />
                      </td>
                      <td className={`${tablePaddingClass} text-center`}>
                        <EnvelopeBadge
                          value={offre.enveloppe_financiere}
                          notApplicable={
                            seance.etape_ouverture === "ADMIN_TECH"
                          }
                        />
                      </td>
                      {showMontantColumn && (
                        <td className={tablePaddingClass}>
                          <p className="font-semibold text-slate-900">
                            {formatMoney(offre.montant_global)}
                          </p>
                        </td>
                      )}
                      <td className={tablePaddingClass}>
                        <p className="text-sm leading-relaxed text-slate-700">
                          {getOfferObservation(offre)}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
              Aucune offre n&apos;est encore saisie pour cette séance.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
