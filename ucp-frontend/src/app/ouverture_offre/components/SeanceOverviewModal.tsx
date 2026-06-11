"use client";

import { useEffect, useMemo } from "react";
import { CalendarDays, CircleSlash, FileText, Layers3, X } from "lucide-react";

import SeanceOverviewDetails from "@/app/ouverture_offre/components/SeanceOverviewDetails";
import type { ProcurementMarket } from "@/types/procurement";
import type { SeanceOuverture } from "@/types/ouvertureOffre";
type SeanceOverviewModalProps = {
  open: boolean;
  onClose: () => void;
  seance: SeanceOuverture | null;
  market: ProcurementMarket | null;
  stateLabel: string;
  onDownloadPV?: (seanceId: number, referenceDossier: string) => void;
};

type StoredCommissionMember = {
  nomPrenom?: string;
  email?: string;
  cin?: string;
  poste?: string;
  entite?: string;
};

const statusLabels: Record<SeanceOuverture["statut"], string> = {
  BROUILLON: "Brouillon",
  EN_SAISIE: "En saisie",
  A_VALIDER: "Validation membres",
  EN_VALIDATION_MEMBRES: "Validation membres",
  EN_VALIDATION_PRESIDENT: "Validation président",
  VALIDEE: "Validée",
  REJETEE: "Rejetée",
};

const statusClasses: Record<SeanceOuverture["statut"], string> = {
  BROUILLON: "border-amber-200 bg-amber-50 text-amber-800",
  EN_SAISIE: "border-sky-200 bg-sky-50 text-sky-800",
  A_VALIDER: "border-indigo-200 bg-indigo-50 text-indigo-800",
  EN_VALIDATION_MEMBRES: "border-indigo-200 bg-indigo-50 text-indigo-800",
  EN_VALIDATION_PRESIDENT: "border-violet-200 bg-violet-50 text-violet-800",
  VALIDEE: "border-emerald-200 bg-emerald-50 text-emerald-800",
  REJETEE: "border-rose-200 bg-rose-50 text-rose-800",
};

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

const marketStatusLabels: Record<ProcurementMarket["status"], string> = {
  PUBLISHED: "Publié",
  CLOSED: "Clôturé",
  CANCELLED: "Annulé",
};

const marketStatusClasses: Record<ProcurementMarket["status"], string> = {
  PUBLISHED: "border-sky-200 bg-sky-50 text-sky-700",
  CLOSED: "border-slate-200 bg-slate-100 text-slate-700",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-700",
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

const COMMISSION_STORAGE_PREFIX = "ucp_commission_membres_";

const parseStoredCommissionMembers = (
  stored: string | null,
): StoredCommissionMember[] => {
  if (!stored) return [];

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((member): member is Record<string, unknown> =>
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

const normalizeEmail = (value?: string | null) => value?.trim().toLowerCase() || "";

const mapStoredMemberToSeanceMember = (
  member: StoredCommissionMember,
  index: number,
): SeanceOuverture["membres"][number] => {
  const label = member.nomPrenom?.trim() || member.email?.trim() || `Membre ${index + 1}`;

  return {
    id: -(index + 1),
    utilisateur: -(index + 1),
    utilisateur_detail: {
      id: -(index + 1),
      username: member.email?.trim() || label,
      email: member.email?.trim() || "",
      first_name: "",
      last_name: "",
      full_name: label,
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
  };
};

const mergeCommissionMembers = (
  backendMembers: SeanceOuverture["membres"],
  storedMembers: SeanceOuverture["membres"],
): SeanceOuverture["membres"] => {
  if (backendMembers.length === 0) return storedMembers;
  if (storedMembers.length === 0) return backendMembers;

  const merged = backendMembers.map((backendMember) => {
    const backendEmail = normalizeEmail(backendMember.utilisateur_detail.email);
    const backendName = normalizeEmail(backendMember.nom_prenom || backendMember.utilisateur_detail.full_name);

    const storedMember = storedMembers.find((member) => {
      const storedEmail = normalizeEmail(member.utilisateur_detail.email);
      const storedName = normalizeEmail(member.nom_prenom || member.utilisateur_detail.full_name);
      return (
        (backendEmail && storedEmail && backendEmail === storedEmail) ||
        (!backendEmail && backendName && storedName && backendName === storedName)
      );
    });

    if (!storedMember) return backendMember;

    return {
      ...backendMember,
      nom_prenom: backendMember.nom_prenom || storedMember.nom_prenom,
      numero_carte: backendMember.numero_carte || storedMember.numero_carte,
      intitule: backendMember.intitule || storedMember.intitule,
      poste: backendMember.poste || storedMember.poste,
    };
  });

  const mergedEmails = new Set(
    merged.map((member) => normalizeEmail(member.utilisateur_detail.email)),
  );
  const mergedNames = new Set(
    merged.map((member) =>
      normalizeEmail(member.nom_prenom || member.utilisateur_detail.full_name),
    ),
  );

  const extras = storedMembers.filter((storedMember) => {
    const storedEmail = normalizeEmail(storedMember.utilisateur_detail.email);
    const storedName = normalizeEmail(
      storedMember.nom_prenom || storedMember.utilisateur_detail.full_name,
    );
    return (
      (!storedEmail || !mergedEmails.has(storedEmail)) &&
      (!storedName || !mergedNames.has(storedName))
    );
  });

  return [...merged, ...extras];
};

function MarketOverviewDetails({ market }: { market: ProcurementMarket }) {
  return (
    <div className="space-y-5">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <CalendarDays className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Publication</span>
          </div>
          <p className="text-sm font-bold text-slate-900">{formatDateTime(market.publication_date)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <CalendarDays className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Limite de dépôt</span>
          </div>
          <p className="text-sm font-bold text-slate-900">{formatDateTime(market.deadline)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <FileText className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Procédure</span>
          </div>
          <p className="text-sm font-bold text-slate-900">
            {procedureLabels[market.procedure_type] || market.procedure_type || "Non renseignée"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <Layers3 className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Catégorie</span>
          </div>
          <p className="text-sm font-bold text-slate-900">
            {categoryLabels[market.category] || market.category || "Non renseignée"}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <CircleSlash className="h-5 w-5 text-slate-600" />
          <h3 className="text-base font-black text-slate-900">État du dossier</h3>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Statut publication
            </p>
            <div className="mt-2">
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${marketStatusClasses[market.status]}`}>
                {marketStatusLabels[market.status]}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Séance d&apos;ouverture
            </p>
            <p className="mt-2 text-sm font-bold text-slate-900">
              Aucune séance créée pour ce dossier.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 md:col-span-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Références
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
              {market.project_code && (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                  Projet : {market.project_code}
                </span>
              )}
              {market.financing_sources.length > 0 && (
                <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-emerald-700">
                  Financements : {market.financing_sources.join(", ")}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function SeanceOverviewModal({
  open,
  onClose,
  seance,
  market,
  stateLabel,
  onDownloadPV,
}: SeanceOverviewModalProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  const overviewMembers = useMemo(() => {
    if (!seance) return null;
    if (typeof window === "undefined") return seance.membres;

    const storedMembers = parseStoredCommissionMembers(
      window.localStorage.getItem(
        `${COMMISSION_STORAGE_PREFIX}${seance.reference_dossier}`,
      ),
    ).map((member, index) => mapStoredMemberToSeanceMember(member, index));

    return mergeCommissionMembers(seance.membres, storedMembers);
  }, [seance]);

  if (!open || (!seance && !market)) return null;

  const referenceLabel = seance?.reference_dossier || market?.reference_number || "N/A";
  const title = seance?.objet_dossier || market?.title || "Dossier d'ouverture";

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/65 p-2 backdrop-blur-sm animate-in fade-in duration-200 sm:p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ouverture-seance-detail-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[96vh] w-full max-w-[96rem] flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-5">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                {referenceLabel}
              </span>
              {seance ? (
                <span
                  className={`rounded border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${
                    statusClasses[seance.statut]
                  }`}
                >
                  {statusLabels[seance.statut]}
                </span>
              ) : market ? (
                <span
                  className={`rounded border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${
                    marketStatusClasses[market.status]
                  }`}
                >
                  {marketStatusLabels[market.status]}
                </span>
              ) : null}
              <span className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600">
                {stateLabel}
              </span>
            </div>
            <h2
              id="ouverture-seance-detail-title"
              className="truncate text-xl font-black tracking-tight text-slate-900"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {seance
                ? "Consultation détaillée de la séance."
                : "Consultation détaillée du dossier avant ouverture."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200/70 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-white px-5 py-5 sm:px-6">
          {seance ? (
            <SeanceOverviewDetails
              seance={seance}
              market={market}
              members={overviewMembers ?? seance.membres}
            />
          ) : market ? (
            <MarketOverviewDetails market={market} />
          ) : null}
        </div>

        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4 gap-3">
          {seance?.pv_document && (
            <button
              type="button"
              onClick={() => {
                if (seance) {
                  onDownloadPV?.(seance.id, seance.reference_dossier);
                }
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 cursor-pointer"
            >
              <FileText className="h-4 w-4" />
              Télécharger le PV
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
