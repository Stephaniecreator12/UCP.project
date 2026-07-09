"use client";

import { useEffect, useMemo, useState, type ElementType } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  ClipboardList,
  FileText,
  Hourglass,
  Layers,
  Lock,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import TopHeader from "@/app/components/TopHeader";
import SeanceOverviewModal from "./components/SeanceOverviewModal";
import { consumeOpeningFlashMessage } from "./utils/flashMessage";
import {
  fetchCurrentUser,
  getToken,
  isSecretaireUser,
  type UserProfile,
} from "@/services/auth";
import {
  createSeance,
  getSeances,
  updateSeance,
  downloadPV,
  resendOpeningInvitations,
} from "@/services/ouvertureOffre";
import { getMarkets } from "@/services/procurement";
import type {
  CommissionMemberPayload,
  SeanceOuverture,
} from "@/types/ouvertureOffre";
import type { ProcurementMarket } from "@/types/procurement";

type ScreenState = "loading" | "ready" | "forbidden" | "error";
type OpeningState =
  | "DRAFT"
  | "ONGOING"
  | "READY"
  | "VALIDATION_MEMBERS"
  | "VALIDATION_PRESIDENT"
  | "VALIDATED"
  | "REJECTED"
  | "CANCELLED";

type OpeningRow = {
  market: ProcurementMarket;
  seance: SeanceOuverture | null;
  state: OpeningState;
};

type StatusSection = {
  key: OpeningState;
  title: string;
  subtitle: string;
  icon: ElementType;
  iconClass: string;
  badgeClass: string;
  emptyText: string;
  rows: OpeningRow[];
};

type ReviewRow = {
  market: ProcurementMarket;
  seance: SeanceOuverture | null;
  state: OpeningState;
  roleLabel: string;
  helperText: string;
  canValidate: boolean;
  canAct: boolean;
  blocked: boolean;
  hasValidated: boolean;
  hasRejected: boolean;
  assignedToCurrentUser: boolean;
};

type ReviewSection = {
  key: OpeningState;
  title: string;
  subtitle: string;
  icon: ElementType;
  iconClass: string;
  badgeClass: string;
  emptyText: string;
  rows: ReviewRow[];
};

const PROCEDURE_LABELS: Record<string, string> = {
  AOI: "AOI",
  AON: "AON",
  DC: "DC",
  GRE_A_GRE: "Gré à gré",
};

const CATEGORY_LABELS: Record<string, string> = {
  BIENS: "Biens",
  SERVICES: "Services",
  INFRA: "Travaux",
};

const COMMISSION_STORAGE_PREFIX = "ucp_commission_membres_";
const COMMISSION_STATUS_PREFIX = "ucp_commission_membres_status_";
const MIN_COMMISSION_MEMBERS = 3;

const COMMON_EMAIL_DOMAIN_FIXES: Record<string, string> = {
  "gmai.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gmail.con": "gmail.com",
  "yaho.com": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "hotmai.com": "hotmail.com",
  "hotmial.com": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "outlok.com": "outlook.com",
  "outllook.com": "outlook.com",
  "outlook.con": "outlook.com",
  "icloud.con": "icloud.com",
};

const COMMON_COM_TLD_TYPOS = [".con", ".cim", ".cpm", ".copm", ".comm"];

// Le dashboard et le formulaire membres doivent partager exactement la même règle.
type CommissionBlock = {
  reference: string;
  title: string;
  memberCount: number;
};

const stateLabels: Record<OpeningState, string> = {
  DRAFT: "Brouillon",
  ONGOING: "Dépôt en cours",
  READY: "En attente d'ouverture",
  VALIDATION_MEMBERS: "Validation membres",
  VALIDATION_PRESIDENT: "Validation président",
  VALIDATED: "Validée",
  REJECTED: "Rejetée",
  CANCELLED: "Annulé",
};

const stateClasses: Record<OpeningState, string> = {
  DRAFT: "border-amber-200 bg-amber-50 text-amber-700",
  ONGOING: "border-sky-200 bg-sky-50 text-sky-700",
  READY: "border-amber-200 bg-amber-50 text-amber-700",
  VALIDATION_MEMBERS: "border-indigo-200 bg-indigo-50 text-indigo-700",
  VALIDATION_PRESIDENT: "border-violet-200 bg-violet-50 text-violet-700",
  VALIDATED: "border-slate-200 bg-slate-100 text-slate-700",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-700",
};

const sectionConfigs: Record<
  OpeningState,
  Omit<StatusSection, "key" | "rows">
> = {
  DRAFT: {
    title: "Brouillons",
    subtitle:
      "Séances déjà créées, à reprendre avant transmission pour validation.",
    icon: ClipboardList,
    iconClass: "border-amber-200 bg-amber-100 text-amber-800",
    badgeClass: "border-amber-200 bg-amber-500 text-white",
    emptyText: "Aucun brouillon disponible.",
  },
  READY: {
    title: "En attente d'ouverture",
    subtitle:
      "Le délai de dépôt est atteint. Ouvrez la séance pour démarrer la préparation.",
    icon: ClipboardList,
    iconClass: "border-amber-200 bg-amber-100 text-amber-800",
    badgeClass: "border-amber-200 bg-amber-500 text-white",
    emptyText: "Aucun DAO en attente d'ouverture.",
  },
  VALIDATION_MEMBERS: {
    title: "Validation membres",
    subtitle: "Les membres présents doivent contrôler et valider la saisie.",
    icon: Hourglass,
    iconClass: "border-indigo-200 bg-indigo-100 text-indigo-800",
    badgeClass: "border-indigo-200 bg-indigo-500 text-white",
    emptyText: "Aucune séance en validation membres.",
  },
  VALIDATION_PRESIDENT: {
    title: "Validation président",
    subtitle: "Tous les membres ont validé. La décision finale est attendue.",
    icon: ShieldCheck,
    iconClass: "border-violet-200 bg-violet-100 text-violet-800",
    badgeClass: "border-violet-200 bg-violet-500 text-white",
    emptyText: "Aucune séance en validation président.",
  },
  ONGOING: {
    title: "Dépôt en cours",
    subtitle: "La date limite n'est pas encore passée.",
    icon: Hourglass,
    iconClass: "border-sky-200 bg-sky-100 text-sky-800",
    badgeClass: "border-sky-200 bg-sky-500 text-white",
    emptyText: "Aucun dépôt en cours.",
  },
  VALIDATED: {
    title: "Validées",
    subtitle: "Les séances finalisées restent consultables.",
    icon: CheckCircle2,
    iconClass: "border-slate-300 bg-slate-100 text-slate-700",
    badgeClass: "border-slate-300 bg-slate-100 text-slate-700",
    emptyText: "Aucun PV validé.",
  },
  REJECTED: {
    title: "Rejetées",
    subtitle: "Séances rejetées après contrôle ou décision finale.",
    icon: AlertCircle,
    iconClass: "border-rose-200 bg-rose-100 text-rose-800",
    badgeClass: "border-rose-200 bg-rose-500 text-white",
    emptyText: "Aucune séance rejetée.",
  },
  CANCELLED: {
    title: "Annulés",
    subtitle: "DAO annulés, sans ouverture possible.",
    icon: Lock,
    iconClass: "border-rose-200 bg-rose-100 text-rose-800",
    badgeClass: "border-rose-200 bg-rose-500 text-white",
    emptyText: "Aucun DAO annulé.",
  },
};

const sectionOrder: OpeningState[] = [
  "DRAFT",
  "READY",
  "VALIDATION_MEMBERS",
  "VALIDATION_PRESIDENT",
  "ONGOING",
  "VALIDATED",
  "REJECTED",
  "CANCELLED",
];

const globalReviewSectionOrder: OpeningState[] = sectionOrder.filter(
  (key) => key !== "DRAFT",
);

const formatDateTime = (value?: string | null) => {
  if (!value) return "Non définie";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const isDeadlineReached = (market: ProcurementMarket) => {
  const deadline = new Date(market.deadline);
  return !Number.isNaN(deadline.getTime()) && deadline.getTime() <= Date.now();
};

const buildFallbackMarket = (seance: SeanceOuverture): ProcurementMarket => ({
  id: -seance.id,
  reference_number: seance.reference_dossier,
  title: seance.objet_dossier,
  procedure_type: "",
  category: "",
  financing_sources: [],
  publication_date: "",
  deadline: seance.date_seance || seance.created_at,
  status: "PUBLISHED",
  technical_documents: [],
  annexes: [],
  dates_atelier: [],
  dates_atelier_details: [],
});

const getOpeningState = (
  market: ProcurementMarket,
  seance: SeanceOuverture | null,
): OpeningState => {
  if (market.status === "CANCELLED") return "CANCELLED";

  if (seance) {
    if (seance.statut === "VALIDEE") return "VALIDATED";
    if (seance.statut === "REJETEE") return "REJECTED";
    if (seance.statut === "EN_VALIDATION_PRESIDENT")
      return "VALIDATION_PRESIDENT";
    if (seance.statut === "A_VALIDER") {
      const presentMembers = seance.membres.filter(
        (member) => member.est_present,
      );
      const membersDecided =
        presentMembers.length > 0 &&
        presentMembers.every((member) => member.decision !== "EN_ATTENTE");
      return membersDecided ? "VALIDATION_PRESIDENT" : "VALIDATION_MEMBERS";
    }
    if (seance.statut === "EN_VALIDATION_MEMBRES") return "VALIDATION_MEMBERS";
    if (seance.statut === "BROUILLON" || seance.statut === "EN_SAISIE")
      return "DRAFT";
    return "DRAFT";
  }

  if (market.status === "CLOSED" || isDeadlineReached(market)) return "READY";

  return "ONGOING";
};

const getSearchText = (row: OpeningRow) =>
  [
    row.market.reference_number,
    row.market.title,
    row.market.project_code,
    PROCEDURE_LABELS[row.market.procedure_type],
    CATEGORY_LABELS[row.market.category],
    stateLabels[row.state],
  ]
    .join(" ")
    .toLowerCase();

const getStoredCommissionMemberCount = (reference: string) => {
  return getStoredCommissionMembers(reference).length;
};

const getEmailTypoSuggestion = (email: string) => {
  const value = email.trim();
  const parts = value.split("@");
  if (parts.length !== 2) return "";

  const [, domain] = parts;
  const normalizedDomain = domain.toLowerCase();
  let suggestedDomain = COMMON_EMAIL_DOMAIN_FIXES[normalizedDomain] || "";

  if (!suggestedDomain) {
    const typo = COMMON_COM_TLD_TYPOS.find((suffix) =>
      normalizedDomain.endsWith(suffix),
    );
    if (typo) {
      suggestedDomain = `${domain.slice(0, -typo.length)}.com`;
    }
  }

  return suggestedDomain && suggestedDomain.toLowerCase() !== normalizedDomain
    ? suggestedDomain
    : "";
};

const getStoredCommissionMembers = (
  reference: string,
): CommissionMemberPayload[] => {
  if (typeof window === "undefined") return [];

  const stored = window.localStorage.getItem(
    `${COMMISSION_STORAGE_PREFIX}${reference}`,
  );
  if (!stored) return [];

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    // Ici on compte seulement les lignes vraiment complètes, pas les brouillons à moitié remplis.
    return parsed.flatMap((member) => {
      if (typeof member !== "object" || member === null) return [];
      const item = member as Record<string, unknown>;
      const hasRequiredIdentity = [
        "nomPrenom",
        "email",
        "poste",
        "entite",
      ].every((field) => {
        const value = item[field];
        return typeof value === "string" && value.trim() !== "";
      });
      const hasValidCin =
        typeof item.cin === "string" && /^\d{12}$/.test(item.cin.trim());
      const email = typeof item.email === "string" ? item.email.trim() : "";
      const hasEmailTypo = Boolean(getEmailTypoSuggestion(email));

      if (!hasRequiredIdentity || !hasValidCin || hasEmailTypo) return [];

      return [
        {
          nomPrenom: String(item.nomPrenom).trim(),
          email,
          cin: String(item.cin).trim(),
          poste: String(item.poste).trim(),
          entite: String(item.entite).trim(),
        },
      ];
    });
  } catch {
    return [];
  }
};

const isCommissionComplete = (reference: string) => {
  if (typeof window === "undefined") return false;

  const status = window.localStorage.getItem(
    `${COMMISSION_STATUS_PREFIX}${reference}`,
  );
  return (
    status === "final" &&
    getStoredCommissionMemberCount(reference) >= MIN_COMMISSION_MEMBERS
  );
};

export default function OuvertureOffrePage() {
  const router = useRouter();
  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [markets, setMarkets] = useState<ProcurementMarket[]>([]);
  const [seances, setSeances] = useState<SeanceOuverture[]>([]);
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState<OpeningState | null>(null);
  const [activeReviewSection, setActiveReviewSection] =
    useState<OpeningState | null>(null);
  const [openingMarketId, setOpeningMarketId] = useState<number | null>(null);
  const [resendingSeanceId, setResendingSeanceId] = useState<number | null>(null);
  const [detailRow, setDetailRow] = useState<OpeningRow | null>(null);
  const [commissionBlock, setCommissionBlock] =
    useState<CommissionBlock | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState(() =>
    consumeOpeningFlashMessage("/ouverture_offre"),
  );
  const isSecretaire = isSecretaireUser(currentUser);

  useEffect(() => {
    const bootstrap = async () => {
      if (!getToken()) {
        router.replace("/auth/login");
        return;
      }

      try {
        const user = await fetchCurrentUser();

        if (!isSecretaireUser(user)) {
          setCurrentUser(user);
          setMarkets([]);
          setSeances([]);
          setScreenState("forbidden");
          return;
        }

        const [marketData, seanceData] = await Promise.all([
          getMarkets("1"),
          getSeances(),
        ]);

        setCurrentUser(user);
        setMarkets(marketData.results);
        setSeances(seanceData);
        setScreenState("ready");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger le module.",
        );
        setScreenState("error");
      }
    };

    void bootstrap();
  }, [router]);

  const openingRows = useMemo<OpeningRow[]>(() => {
    const marketRows = markets.map((market) => {
      const seance =
        seances.find(
          (item) => item.reference_dossier === market.reference_number,
        ) ?? null;

      return {
        market,
        seance,
        state: getOpeningState(market, seance),
      };
    });

    const orphanRows = seances
      .filter(
        (seance) =>
          !markets.some(
            (market) => market.reference_number === seance.reference_dossier,
          ),
      )
      .map((seance) => {
        const fallbackMarket = buildFallbackMarket(seance);
        return {
          market: fallbackMarket,
          seance,
          state: getOpeningState(fallbackMarket, seance),
        };
      });

    return [...marketRows, ...orphanRows];
  }, [markets, seances]);

  const reviewRows = useMemo<ReviewRow[]>(() => {
    if (!currentUser || isSecretaire) return [];

    return openingRows.flatMap((row) => {
      const seance = row.seance;

      const currentMember =
        seance?.membres.find(
          (member) => member.utilisateur === currentUser.id,
        ) ?? null;
      const isPresident = seance?.president === currentUser.id;
      const assignedToCurrentUser = Boolean(currentMember || isPresident);

      const presentMembers =
        seance?.membres.filter((member) => member.est_present) ?? [];
      const allPresentMembersDecided =
        presentMembers.length > 0 &&
        presentMembers.every((member) => member.decision !== "EN_ATTENTE");
      const canValidateAsMember =
        row.state === "VALIDATION_MEMBERS" &&
        !!currentMember &&
        currentMember.est_present &&
        currentMember.decision === "EN_ATTENTE";
      const canRejectAsMember = canValidateAsMember;
      const canValidateAsPresident =
        row.state === "VALIDATION_PRESIDENT" &&
        !!seance &&
        isPresident &&
        allPresentMembersDecided &&
        seance.president_decision === "EN_ATTENTE";
      const canRejectAsPresident =
        row.state === "VALIDATION_PRESIDENT" &&
        !!seance &&
        isPresident &&
        seance.president_decision === "EN_ATTENTE";
      const blockedPresident =
        row.state === "VALIDATION_MEMBERS" &&
        !!seance &&
        isPresident &&
        seance.president_decision === "EN_ATTENTE" &&
        !allPresentMembersDecided;
      const hasValidated =
        currentMember?.decision === "VALIDEE" ||
        (isPresident && seance?.president_decision === "VALIDEE");
      const hasRejected =
        currentMember?.decision === "REJETEE" ||
        (isPresident && seance?.president_decision === "REJETEE");

      const roleLabel = isPresident
        ? "Président de séance"
        : currentMember
          ? currentMember.est_present
            ? "Membre de commission"
            : "Membre marqué absent"
          : "Consultation";

      let helperText = "Consultation uniquement.";
      if (!seance) {
        helperText =
          row.state === "READY"
            ? "Séance non ouverte."
            : row.state === "ONGOING"
              ? "Dépôt en cours."
              : row.state === "CANCELLED"
                ? "Dossier annulé."
                : "Aucune séance disponible.";
      } else if (canValidateAsPresident) {
        helperText = "Validation finale disponible.";
      } else if (blockedPresident) {
        helperText = "En attente des validations des membres présents.";
      } else if (canValidateAsMember) {
        helperText = "Votre validation est attendue.";
      } else if (hasValidated) {
        helperText = "Validation enregistrée.";
      } else if (hasRejected || row.state === "REJECTED") {
        helperText = "Séance rejetée.";
      } else if (row.state === "VALIDATED") {
        helperText = "Séance clôturée.";
      } else if (row.state === "DRAFT") {
        helperText = "Séance en préparation.";
      } else if (row.state === "READY") {
        helperText = "Ouverture en attente.";
      }

      const reviewState = row.state;

      return [
        {
          market: row.market,
          seance,
          state: reviewState,
          roleLabel,
          helperText,
          canValidate: canValidateAsMember || canValidateAsPresident,
          canAct:
            canValidateAsMember ||
            canValidateAsPresident ||
            canRejectAsMember ||
            canRejectAsPresident,
          blocked: blockedPresident,
          hasValidated,
          hasRejected,
          assignedToCurrentUser,
        },
      ];
    });
  }, [currentUser, isSecretaire, openingRows]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return openingRows.filter((row) => {
      return !normalizedQuery || getSearchText(row).includes(normalizedQuery);
    });
  }, [query, openingRows]);

  const sections = useMemo<StatusSection[]>(() => {
    return sectionOrder.map((key) => ({
      key,
      ...sectionConfigs[key],
      rows: filteredRows.filter((row) => row.state === key),
    }));
  }, [filteredRows]);

  const filteredReviewRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return reviewRows;

    return reviewRows.filter((row) =>
      [
        getSearchText(row),
        row.seance?.objet_dossier,
        row.roleLabel,
        row.helperText,
        stateLabels[row.state],
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, reviewRows]);

  const visibleSections = sections;

  const reviewSections = useMemo<ReviewSection[]>(() => {
    return globalReviewSectionOrder.map((key) => ({
      key,
      ...sectionConfigs[key],
      rows: filteredReviewRows.filter((row) => row.state === key),
    }));
  }, [filteredReviewRows]);

  const handleOpenSeance = async (row: OpeningRow) => {
    const commissionMembers = getStoredCommissionMembers(
      row.market.reference_number,
    );
    const hasBackendCommission =
      (row.seance?.membres.filter((member) => member.est_present).length ??
        0) >= MIN_COMMISSION_MEMBERS;

    // Avant d'ouvrir, on vérifie la commission: sans 3 membres complets, pas de séance.
    if (
      isSecretaire &&
      !hasBackendCommission &&
      !isCommissionComplete(row.market.reference_number)
    ) {
      setCommissionBlock({
        reference: row.market.reference_number,
        title: row.market.title,
        memberCount: commissionMembers.length,
      });
      return;
    }

    if (row.seance) {
      try {
        if (
          (row.seance.statut === "BROUILLON" ||
            row.seance.statut === "EN_SAISIE") &&
          row.seance.membres.length < MIN_COMMISSION_MEMBERS
        ) {
          // Si une ancienne séance brouillon existe sans membres, on la répare avant d'entrer.
          await updateSeance(row.seance.id, {
            commission_members: commissionMembers,
          });
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de synchroniser les membres.",
        );
        return;
      }
      router.push(`/personnel/ouverture_offre/${row.seance.id}`);
      return;
    }

    if (row.state !== "READY") return;

    try {
      setError("");
      setOpeningMarketId(row.market.id);

      const seance = await createSeance({
        reference_dossier: row.market.reference_number,
        objet_dossier: row.market.title,
        statut: "BROUILLON",
        commission_members: commissionMembers,
      });

      const detailPath = `/personnel/ouverture_offre/${seance.id}`;
      router.push(detailPath);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible d'ouvrir la séance.",
      );
      setOpeningMarketId(null);
    }
  };

  const handleDownloadPV = async (
    seanceId: number,
    referenceDossier: string,
  ) => {
    try {
      setError("");
      await downloadPV(seanceId, referenceDossier);
      setSuccessMessage("Téléchargement du PV lancé avec succès.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de télécharger le PV.",
      );
    }
  };

  const handleResendInvitations = async (seanceId: number) => {
    try {
      setError("");
      setSuccessMessage("");
      setResendingSeanceId(seanceId);

      const result = await resendOpeningInvitations(seanceId);
      const refreshedSeances = await getSeances();
      setSeances(refreshedSeances);

      setDetailRow((current) => {
        if (!current || current.seance?.id !== seanceId) return current;

        const refreshedSeance =
          refreshedSeances.find((item) => item.id === seanceId) ??
          current.seance;

        return {
          ...current,
          seance: refreshedSeance,
          state: getOpeningState(current.market, refreshedSeance),
        };
      });

      setSuccessMessage(result.detail);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Renvoi des invitations impossible.",
      );
    } finally {
      setResendingSeanceId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#f6faf8_0%,transparent_25%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] pb-24 text-slate-800 antialiased selection:bg-emerald-200">
      <TopHeader />

      <div className="zoom-content">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-5 px-4 pb-12 pt-6 md:px-6 lg:pt-8">
          {screenState === "ready" && (
            <div className="relative flex w-full flex-col justify-between gap-4 overflow-hidden rounded-3xl border border-slate-100 bg-white px-5 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] md:flex-row md:items-center">
              <div className="pointer-events-none absolute right-0 top-0 h-32 w-56 rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 opacity-45 blur-3xl" />

              <div className="relative z-10 flex min-w-0 items-center gap-4">
                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <Sparkles className="absolute -right-1.5 -top-1.5 h-3.5 w-3.5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-black tracking-tight text-slate-800 sm:text-xl">
                    {isSecretaire
                      ? "OUVERTURE DES OFFRES"
                      : "VALIDATION DES OUVERTURES"}
                  </h1>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <p className="truncate text-[10px] font-black uppercase tracking-widest text-slate-500 sm:text-[11px]">
                      {isSecretaire
                        ? "DAO publiés et séances publiques"
                        : "Séances affectées à votre validation"}
                    </p>
                  </div>
                </div>
              </div>

              {currentUser && (
                <div className="relative z-10 w-fit rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600">
                  {isSecretaire ? "Secrétaire" : "Utilisateur"} :{" "}
                  <span className="text-slate-900">
                    {`${currentUser.first_name} ${currentUser.last_name}`.trim() ||
                      currentUser.username}
                  </span>
                </div>
              )}
            </div>
          )}

          {screenState === "loading" && (
            <div className="space-y-4 animate-pulse">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="h-28 rounded-3xl border border-white/40 bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.05)]"
                />
              ))}
            </div>
          )}

          {screenState === "forbidden" && (
            <section className="rounded-3xl border border-rose-200 bg-white p-8 shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
              <h2 className="text-lg font-black text-slate-900">
                Accès non autorisé
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Cette interface est réservée au secrétaire de commission. Les
                membres et présidents valident chaque DAO avec le lien et le mot
                de passe reçus par mail.
              </p>
              <button
                type="button"
                onClick={() => router.push("/personnel/dashboard")}
                className="mt-5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white"
              >
                Retour au dashboard
              </button>
            </section>
          )}

          {screenState === "error" && (
            <section className="rounded-3xl border border-rose-200 bg-white p-8 shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
              <h2 className="text-lg font-black text-slate-900">
                Erreur de chargement
              </h2>
              <p className="mt-2 text-sm text-rose-700">{error}</p>
            </section>
          )}

          {screenState === "ready" && (
            <>
              <section className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.05)] backdrop-blur-md transition-all duration-500 hover:shadow-[0_12px_48px_rgba(0,0,0,0.08)]">
                <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 bg-[length:200%_100%] animate-gradient" />
                <div className="p-6">
                  <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <h2 className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-800">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-600 shadow-sm backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                        <Layers className="h-5 w-5" />
                      </div>
                      {isSecretaire
                        ? "1. Dossiers DAO / DC à suivre"
                        : "1. Vue des séances d'ouverture"}
                    </h2>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="relative min-w-[280px]">
                        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder={
                            isSecretaire
                              ? "Rechercher un DAO..."
                              : "Rechercher un dossier ou une séance..."
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 pl-10 pr-10 text-[13px] font-semibold text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                        />
                        {query && (
                          <button
                            type="button"
                            onClick={() => setQuery("")}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {(
                    isSecretaire
                      ? filteredRows.length === 0 && Boolean(query.trim())
                      : false
                  ) ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-8 text-center">
                      <p className="text-[13px] font-semibold text-slate-500">
                        {isSecretaire
                          ? "Aucun DAO ne correspond à cette vue."
                          : "Aucune séance ne correspond à cette vue."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {isSecretaire
                        ? visibleSections.map((section) => (
                            <OpeningStatusSection
                              key={section.key}
                              section={section}
                              isActive={activeSection === section.key}
                              onToggle={() =>
                                setActiveSection(
                                  activeSection === section.key
                                    ? null
                                    : section.key,
                                )
                              }
                              openingMarketId={openingMarketId}
                              onOpenDetail={(row) => setDetailRow(row)}
                              onOpenSeance={handleOpenSeance}
                              onDownloadPV={handleDownloadPV}
                            />
                          ))
                        : reviewSections.map((section) => (
                            <ReviewStatusSection
                              key={section.key}
                              section={section}
                              isActive={activeReviewSection === section.key}
                              onToggle={() =>
                                setActiveReviewSection(
                                  activeReviewSection === section.key
                                    ? null
                                    : section.key,
                                )
                              }
                              onOpenDetail={(row) => setDetailRow(row)}
                              onOpenValidation={(row) => {
                                if (!row.seance || !currentUser) return;
                                const validationRole =
                                  row.seance.president === currentUser.id
                                    ? "president"
                                    : "membre";
                                const params = new URLSearchParams({
                                  role: validationRole,
                                  email:
                                    currentUser.email || currentUser.username,
                                });
                                router.push(
                                  `/ouverture_offre/validation/${row.seance.id}?${params.toString()}`,
                                );
                              }}
                              onDownloadPV={handleDownloadPV}
                            />
                          ))}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>

      <SeanceOverviewModal
        open={!!detailRow}
        onClose={() => setDetailRow(null)}
        seance={detailRow?.seance ?? null}
        market={detailRow?.market ?? null}
        stateLabel={detailRow ? stateLabels[detailRow.state] : ""}
        onDownloadPV={handleDownloadPV}
        onResendInvitations={handleResendInvitations}
        canResendInvitations={Boolean(
          detailRow?.seance &&
            currentUser &&
            detailRow.seance.secretaire === currentUser.id &&
            (detailRow.seance.statut === "EN_VALIDATION_MEMBRES" ||
              detailRow.seance.statut === "EN_VALIDATION_PRESIDENT"),
        )}
        resendInvitationsLoading={
          !!detailRow?.seance && resendingSeanceId === detailRow.seance.id
        }
      />
      {successMessage && (
        <NotificationPopup
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage("")}
        />
      )}
      {error && screenState === "ready" && (
        <NotificationPopup
          type="error"
          message={error}
          onClose={() => setError("")}
        />
      )}
      {commissionBlock && (
        <CommissionIncompleteModal
          block={commissionBlock}
          onClose={() => setCommissionBlock(null)}
          onComplete={() => {
            const target = `/personnel/ouverture_offre/membres?dossier=${encodeURIComponent(
              commissionBlock.reference,
            )}`;
            setCommissionBlock(null);
            router.push(target);
          }}
        />
      )}
    </main>
  );
}

// Popup volontairement bloquant: il guide le secrétaire vers le bon formulaire.
function CommissionIncompleteModal({
  block,
  onClose,
  onComplete,
}: {
  block: CommissionBlock;
  onClose: () => void;
  onComplete: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="commission-incomplete-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-2xl ring-1 ring-black/5">
        <div className="flex items-start gap-3 border-b border-amber-100 bg-amber-50 px-5 py-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
              Commission incomplète
            </p>
            <h2
              id="commission-incomplete-title"
              className="mt-1 text-base font-black text-slate-950"
            >
              Membres de commission pas encore complétés
            </h2>
            <p className="mt-1 text-sm font-medium leading-relaxed text-slate-600">
              Le dossier {block.reference} ne peut pas être ouvert tant que la
              commission n&apos;est pas finalisée avec au moins{" "}
              {MIN_COMMISSION_MEMBERS} membres.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-slate-700"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Dossier
            </p>
            <p className="mt-1 text-sm font-black text-slate-900">
              {block.reference}
            </p>
            <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-500">
              {block.title}
            </p>
          </div>
          <p className="text-sm font-semibold leading-relaxed text-slate-600">
            Membres complets actuellement :{" "}
            <span className="font-black text-slate-900">
              {block.memberCount}
            </span>{" "}
            / {MIN_COMMISSION_MEMBERS}. Complète puis enregistre définitivement
            la liste dans le formulaire des membres.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onComplete}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-700"
          >
            <ClipboardList className="h-4 w-4" />
            Compléter
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationPopup({
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

function OpeningStatusSection({
  section,
  isActive,
  onToggle,
  openingMarketId,
  onOpenDetail,
  onOpenSeance,
  onDownloadPV,
}: {
  section: StatusSection;
  isActive: boolean;
  onToggle: () => void;
  openingMarketId: number | null;
  onOpenDetail: (row: OpeningRow) => void;
  onOpenSeance: (row: OpeningRow) => void;
  onDownloadPV: (seanceId: number, referenceDossier: string) => void;
}) {
  const Icon = section.icon;
  const hasRows = section.rows.length > 0;

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-colors ${
        isActive
          ? "border-slate-300"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between px-5 py-4 text-left transition-colors ${
          isActive
            ? "border-b border-slate-200 bg-slate-50"
            : "bg-white hover:bg-slate-50"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl border ${section.iconClass}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {section.title}
            </h3>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              {section.subtitle}
            </p>
          </div>
          <span
            className={`ml-1 rounded-full border px-3 py-1 text-xs font-semibold ${
              hasRows
                ? section.badgeClass
                : "border-slate-200 bg-slate-100 text-slate-400"
            }`}
          >
            {section.rows.length}
          </span>
        </div>

        <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          <span className={isActive ? "text-slate-700" : ""}>
            {isActive ? "Masquer" : "Afficher"}
          </span>
          <div
            className={`rounded-lg bg-slate-100 p-1 text-slate-400 transition-transform ${
              isActive ? "rotate-180" : ""
            }`}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </div>
        </div>
      </button>

      {isActive && (
        <div className="space-y-3 bg-slate-50 px-4 py-4">
          {hasRows ? (
            section.rows.map((row, index) => (
              <OpeningDaoRow
                key={row.market.id}
                row={row}
                index={index}
                opening={openingMarketId === row.market.id}
                onOpenDetail={() => onOpenDetail(row)}
                onOpen={() => onOpenSeance(row)}
                onDownloadPV={onDownloadPV}
              />
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white/80 px-4 py-5 text-sm font-semibold text-slate-500">
              {section.emptyText}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OpeningDaoRow({
  row,
  index,
  opening,
  onOpenDetail,
  onOpen,
  onDownloadPV,
}: {
  row: OpeningRow;
  index: number;
  opening: boolean;
  onOpenDetail: () => void;
  onOpen: () => void;
  onDownloadPV: (seanceId: number, referenceDossier: string) => void;
}) {
  const { market, seance, state } = row;
  const isDraft = state === "DRAFT";
  const isReady = state === "READY";
  const hasSeance = !!seance;
  const isDisabled = state === "ONGOING" || state === "CANCELLED";
  const shouldShowDetailAction =
    hasSeance &&
    (state === "VALIDATION_MEMBERS" ||
      state === "VALIDATION_PRESIDENT" ||
      state === "VALIDATED" ||
      state === "REJECTED");

  return (
    <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-emerald-300 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-600">
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              {market.reference_number}
            </span>
            <span
              className={`rounded border px-2 py-0.5 text-[10px] font-bold ${stateClasses[state]}`}
            >
              {stateLabels[state]}
            </span>
            <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500">
              {PROCEDURE_LABELS[market.procedure_type] || market.procedure_type}
            </span>
          </div>

          <p className="text-[14px] font-black leading-tight text-slate-800">
            {market.title}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-600">
              Limite : {formatDateTime(market.deadline)}
            </span>
            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
              {CATEGORY_LABELS[market.category] ||
                market.category ||
                "Catégorie non définie"}
            </span>
            {market.project_code && (
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-500">
                Projet : {market.project_code}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex w-full shrink-0 gap-2 border-t border-slate-100 pt-3 sm:w-auto sm:border-t-0 sm:pt-0">
        {shouldShowDetailAction ? (
          <>
            {state === "VALIDATED" && seance && (
              <button
                type="button"
                onClick={() => {
                  onDownloadPV(seance.id, seance.reference_dossier);
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-emerald-700 transition-all hover:-translate-y-0.5 hover:bg-emerald-100 sm:flex-none"
              >
                <FileText className="h-4 w-4" />
                PV PDF
              </button>
            )}
            <button
              type="button"
              onClick={onOpenDetail}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 sm:flex-none"
            >
              Voir
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        ) : hasSeance ? (
          <button
            type="button"
            onClick={onOpen}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800 sm:flex-none"
          >
            {isDraft ? "Ouvrir" : "Reprendre"}
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpen}
            disabled={isDisabled || opening}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all sm:flex-none ${
              isReady
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 hover:bg-emerald-700"
                : "cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-400"
            }`}
          >
            {opening ? (
              "Création..."
            ) : isReady ? (
              <>
                <Plus className="h-4 w-4" />
                Ouvrir
              </>
            ) : state === "CANCELLED" ? (
              <>
                <Lock className="h-4 w-4" />
                Annulé
              </>
            ) : (
              <>
                <Hourglass className="h-4 w-4" />
                Dépôt en cours
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function ReviewStatusSection({
  section,
  isActive,
  onToggle,
  onOpenDetail,
  onOpenValidation,
  onDownloadPV,
}: {
  section: ReviewSection;
  isActive: boolean;
  onToggle: () => void;
  onOpenDetail: (row: ReviewRow) => void;
  onOpenValidation: (row: ReviewRow) => void;
  onDownloadPV: (seanceId: number, referenceDossier: string) => void;
}) {
  const Icon = section.icon;
  const hasRows = section.rows.length > 0;

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-colors ${
        isActive
          ? "border-slate-300"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between px-5 py-4 text-left transition-colors ${
          isActive
            ? "border-b border-slate-200 bg-slate-50"
            : "bg-white hover:bg-slate-50"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl border ${section.iconClass}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {section.title}
            </h3>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              {section.subtitle}
            </p>
          </div>
          <span
            className={`ml-1 rounded-full border px-3 py-1 text-xs font-semibold ${
              hasRows
                ? section.badgeClass
                : "border-slate-200 bg-slate-100 text-slate-400"
            }`}
          >
            {section.rows.length}
          </span>
        </div>

        <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          <span className={isActive ? "text-slate-700" : ""}>
            {isActive ? "Masquer" : "Afficher"}
          </span>
          <div
            className={`rounded-lg bg-slate-100 p-1 text-slate-400 transition-transform ${
              isActive ? "rotate-180" : ""
            }`}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </div>
        </div>
      </button>

      {isActive && (
        <div className="space-y-3 bg-slate-50 px-4 py-4">
          {hasRows ? (
            section.rows.map((row, index) => (
              <ReviewSeanceRow
                key={`${row.market.id}-${row.seance?.id ?? "market"}`}
                row={row}
                index={index}
                onOpenDetail={() => onOpenDetail(row)}
                onOpenValidation={() => onOpenValidation(row)}
                onDownloadPV={onDownloadPV}
              />
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white/80 px-4 py-5 text-sm font-semibold text-slate-500">
              {section.emptyText}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReviewSeanceRow({
  row,
  index,
  onOpenDetail,
  onOpenValidation,
  onDownloadPV,
}: {
  row: ReviewRow;
  index: number;
  onOpenDetail: () => void;
  onOpenValidation: () => void;
  onDownloadPV: (seanceId: number, referenceDossier: string) => void;
}) {
  const displayDate = row.seance?.date_seance || row.market.deadline || null;
  const title = row.seance?.objet_dossier || row.market.title;

  return (
    <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-emerald-300 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-600">
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              {row.market.reference_number}
            </span>
            <span
              className={`rounded border px-2 py-0.5 text-[10px] font-bold ${stateClasses[row.state]}`}
            >
              {stateLabels[row.state]}
            </span>
            <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500">
              {row.roleLabel}
            </span>
            {row.hasValidated && (
              <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                Validation enregistrée
              </span>
            )}
            {row.hasRejected && (
              <span className="rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                Rejet enregistré
              </span>
            )}
          </div>

          <p className="text-[14px] font-black leading-tight text-slate-800">
            {title}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-600">
              {row.seance ? "Séance" : "Échéance"} :{" "}
              {displayDate
                ? formatDateTime(displayDate)
                : "Date non renseignée"}
            </span>
            {row.market.procedure_type && (
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
                {PROCEDURE_LABELS[row.market.procedure_type] ||
                  row.market.procedure_type}
              </span>
            )}
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-500">
              {row.helperText}
            </span>
          </div>
        </div>
      </div>

      <div className="flex w-full shrink-0 gap-2 border-t border-slate-100 pt-3 sm:w-auto sm:border-t-0 sm:pt-0">
        {row.state === "VALIDATED" && row.seance && (
          <button
            type="button"
            onClick={() => {
              if (row.seance) {
                onDownloadPV(row.seance.id, row.seance.reference_dossier);
              }
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-emerald-700 transition-all hover:-translate-y-0.5 hover:bg-emerald-100 sm:flex-none"
          >
            <FileText className="h-4 w-4" />
            PV PDF
          </button>
        )}
        <button
          type="button"
          onClick={onOpenDetail}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 sm:flex-none"
        >
          Voir
          <ArrowRight className="h-4 w-4" />
        </button>

        {row.seance && row.canAct && (
          <button
            type="button"
            onClick={onOpenValidation}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800 sm:flex-none"
          >
            Action
          </button>
        )}
      </div>
    </div>
  );
}
