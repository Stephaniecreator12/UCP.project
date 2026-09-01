"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ElementType,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  Hourglass,
  Loader,
  Mail,
  Search,
  Send,
  UserCheck,
  Users,
  X,
  Sparkles,
  Layers,
  ArrowRight,
  User,
} from "lucide-react";
import TopHeader from "@/app/components/TopHeader";
import {
  assignDaoEvaluators,
  fetchDaoDashboard,
  fetchDaoDetail,
  resendDaoEvaluatorInvitations,
  fetchClassement,
  type AssignationPayload,
  type DaoDashboardItem,
  type DaoDetail,
  type ProgressionStatut,
  type StatutDao,
  type StatutDashboard,
  type ClassementLigne,
} from "@/services/evaluationService";
import { fetchCurrentUser, getToken, type UserProfile } from "@/services/auth";
import { createContrat } from "@/services/contractualisation";

type ScreenState = "loading" | "ready" | "error";
type PanelMode = "assign" | "detail";
type AppRouter = ReturnType<typeof useRouter>;

type DashboardSection = {
  key: StatutDao;
  title: string;
  subtitle: string;
  icon: ElementType;
  iconClass: string;
  badgeClass: string;
  emptyText: string;
};

interface ManualMember {
  key: string;
  nomPrenom: string;
  email: string;
  entite: string;
  poste: string;
  cin: string;
}

const sectionConfigs: Record<StatutDao, Omit<DashboardSection, "key">> = {
  A_ASSIGNER: {
    title: "À assigner",
    subtitle: "Séances validées en attente de la nomination des 3 évaluateurs.",
    icon: Users,
    iconClass: "border-amber-200 bg-amber-100 text-amber-800",
    badgeClass: "border-amber-200 bg-amber-500 text-white",
    emptyText: "Aucun DAO en attente d'assignation.",
  },
  EN_EVALUATION: {
    title: "En évaluation",
    subtitle:
      "Les évaluateurs remplissent individuellement leurs grilles de notation.",
    icon: Hourglass,
    iconClass: "border-blue-200 bg-blue-100 text-blue-800",
    badgeClass: "border-blue-200 bg-blue-500 text-white",
    emptyText: "Aucun DAO en cours d'évaluation.",
  },
  TERMINE: {
    title: "Terminés",
    subtitle: "Toutes les offres ont été évaluées, notées et signées.",
    icon: CheckCircle2,
    iconClass: "border-emerald-200 bg-emerald-100 text-emerald-800",
    badgeClass: "border-emerald-200 bg-emerald-500 text-white",
    emptyText: "Aucun DAO terminé.",
  },
  ARCHIVE: {
    title: "Archivés",
    subtitle: "Dossiers d'évaluation clos et archivés (contrat en cours).",
    icon: Archive,
    iconClass: "border-slate-205 bg-slate-100 text-slate-800",
    badgeClass: "border-slate-250 bg-slate-500 text-white",
    emptyText: "Aucun DAO archivé.",
  },
};

const sectionOrder: StatutDao[] = [
  "A_ASSIGNER",
  "EN_EVALUATION",
  "TERMINE",
  "ARCHIVE",
];

const statusClassMap: Record<string, string> = {
  A_ASSIGNER: "border-amber-200 bg-amber-50 text-amber-700",
  EN_EVALUATION: "border-blue-200 bg-blue-50 text-blue-700",
  TERMINE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ARCHIVE: "border-slate-250 bg-slate-50 text-slate-700",
};

const offreStatutConfig: Record<
  StatutDashboard,
  { label: string; className: string }
> = {
  A_ASSIGNER: {
    label: "À assigner",
    className: "border-amber-205 bg-amber-50 text-amber-800",
  },
  EN_EVALUATION: {
    label: "En évaluation",
    className: "border-sky-200 bg-sky-50 text-sky-800",
  },
  CONSENSUS_REQUIS: {
    label: "Consensus",
    className: "border-amber-200 bg-amber-100 text-amber-900",
  },
  NON_CONFORME: {
    label: "Non conforme",
    className: "border-rose-200 bg-rose-50 text-rose-800",
  },
  ELIMINEE: {
    label: "Éliminée",
    className: "border-slate-350 bg-slate-100 text-slate-700",
  },
  VALIDEE: {
    label: "Validée",
    className: "border-emerald-202 bg-emerald-50 text-emerald-800",
  },
  REJETEE: {
    label: "Rejetée",
    className: "border-rose-200 bg-rose-100 text-rose-900",
  },
};

const progressionLabels: Record<ProgressionStatut, string> = {
  PAS_COMMENCE: "Pas commencée",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
};

const contratStatusLabels: Record<string, string> = {
  BROUILLON: "À contractualiser",
  ATTENTE_SIGNATURE: "En attente signature",
  EXECUTION: "En exécution",
  TERMINE: "Terminé",
  SUSPENDU: "Suspendu",
  ANNULE: "Annulé",
};

const fieldClass =
  "w-full rounded-xl border border-slate-250 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 transition-all placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 focus:outline-none";
const disabledClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-500 cursor-not-allowed";
const labelClass =
  "mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-450";

const emptyMembers = (): ManualMember[] => [
  { key: "1", nomPrenom: "", email: "", entite: "", poste: "", cin: "" },
  { key: "2", nomPrenom: "", email: "", entite: "", poste: "", cin: "" },
  { key: "3", nomPrenom: "", email: "", entite: "", poste: "", cin: "" },
];

function splitNifStat(value?: string) {
  const raw = (value ?? "").trim();
  if (!raw) {
    return { nif: "", stat: "" };
  }
  const [nif, ...rest] = raw.split("/");
  return { nif: nif.trim(), stat: rest.join("/").trim() };
}

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

export default function EvaluationSecretairePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-55 text-slate-800">
          <TopHeader />
          <div className="flex h-[60vh] items-center justify-center">
            <Clock className="h-8 w-8 animate-spin text-emerald-700" />
          </div>
        </div>
      }
    >
      <EvaluationSecretaireContent />
    </Suspense>
  );
}

function EvaluationSecretaireContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [daos, setDaos] = useState<DaoDashboardItem[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const [selectedDao, setSelectedDao] = useState<DaoDashboardItem | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<PanelMode>("detail");
  const [detail, setDetail] = useState<DaoDetail | null>(null);
  const [classementLignes, setClassementLignes] = useState<
    ClassementLigne[] | null
  >(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelError, setPanelError] = useState("");
  const [panelSuccess, setPanelSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendSubmitting, setResendSubmitting] = useState(false);
  const [dispoLoading, setDispoLoading] = useState<Record<number, boolean>>({});
  const [dateEvaluation, setDateEvaluation] = useState("");
  const [heureEvaluation, setHeureEvaluation] = useState("09:00");
  const [members, setMembers] = useState<ManualMember[]>(emptyMembers());
  const [offreMeta, setOffreMeta] = useState<
    Record<number, { lot: string; nif: string; stat: string }>
  >({});

  const loadDaos = useCallback(async () => {
    try {
      setScreenState("loading");
      const data = await fetchDaoDashboard();
      setDaos(data);

      // Auto-expand first non-empty section
      const firstActive = sectionOrder.find((key) =>
        data.some((d) => d.statut_dao === key),
      );
      if (firstActive) {
        setActiveSection(firstActive);
      } else {
        setActiveSection("A_ASSIGNER");
      }

      setScreenState("ready");
      return data;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la récupération des dossiers",
      );
      setScreenState("error");
      return [];
    }
  }, []);

  const loadDetail = useCallback(async (seanceId: number) => {
    setPanelLoading(true);
    setPanelError("");
    try {
      const data = await fetchDaoDetail(seanceId);
      setDetail(data);

      if (data.statut_dao === "TERMINE" || data.statut_dao === "ARCHIVE") {
        fetchClassement(seanceId)
          .then((c) => setClassementLignes(c.lignes || []))
          .catch(() => setClassementLignes([]));
      } else {
        setClassementLignes(null);
      }

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
      if (data.evaluateurs.length > 0) {
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
      setPanelError(
        err instanceof Error ? err.message : "Erreur de chargement",
      );
    } finally {
      setPanelLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getToken()) {
      router.push("/auth/login");
      return;
    }

    const bootstrap = async () => {
      try {
        const user = await fetchCurrentUser();
        setCurrentUser(user);
      } catch {
        // Ignored
      }
      void loadDaos().then(() => {
        const seanceParam = searchParams.get("seance");
        if (!seanceParam) return;
        router.push(`/personnel/evaluation_offre/${seanceParam}/assign`);
      });
    };

    void bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!panelOpen || !selectedDao) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closePanel();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [panelOpen, selectedDao]);

  const openPanel = (dao: DaoDashboardItem, mode: PanelMode) => {
    setSelectedDao(dao);
    setPanelMode(mode);
    setPanelOpen(true);
    setPanelSuccess("");
    void loadDetail(dao.seance_id);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setSelectedDao(null);
    setDetail(null);
  };

  const updateMember = (
    key: string,
    field: keyof Omit<ManualMember, "key">,
    value: string,
  ) => {
    setMembers((prev) =>
      prev.map((m) => (m.key === key ? { ...m, [field]: value } : m)),
    );
  };

  const canAssign =
    detail?.statut_dao === "A_ASSIGNER" ||
    (detail?.evaluateurs.length ?? 0) < 3;

  const handleAssign = async () => {
    if (!selectedDao || !detail || !canAssign) return;
    setPanelError("");
    setPanelSuccess("");

    if (!dateEvaluation) {
      setPanelError("Indiquez la date de début d'évaluation.");
      return;
    }
    if (!heureEvaluation) {
      setPanelError("Indiquez l'heure de début d'évaluation.");
      return;
    }
    for (const offre of detail.offres) {
      const meta = offreMeta[offre.offre_id];
      if (!meta?.lot.trim()) {
        setPanelError(`Lot n° requis pour ${offre.nom_soumissionnaire}.`);
        return;
      }
      if (!meta?.nif.trim()) {
        setPanelError(`NIF requis pour ${offre.nom_soumissionnaire}.`);
        return;
      }
      if (!meta?.stat.trim()) {
        setPanelError(`STAT requis pour ${offre.nom_soumissionnaire}.`);
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
        setPanelError(`Complétez l'évaluateur ${i + 1}.`);
        return;
      }
      if (!m.cin.trim() || m.cin.length !== 12) {
        setPanelError(`CIN invalide pour l'évaluateur ${i + 1}.`);
        return;
      }
    }
    const emails = members.map((m) => m.email.trim().toLowerCase());
    if (new Set(emails).size !== 3) {
      setPanelError("Les emails doivent être distincts.");
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
      const result = await assignDaoEvaluators(selectedDao.seance_id, payload);
      setPanelSuccess(result.detail);
      await loadDetail(selectedDao.seance_id);
      await loadDaos();
      setPanelMode("detail");
    } catch (err) {
      setPanelError(
        err instanceof Error ? err.message : "Erreur lors de l'assignation",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendInvitations = async () => {
    if (!selectedDao || !detail || detail.evaluateurs.length === 0) return;

    try {
      setPanelError("");
      setPanelSuccess("");
      setResendSubmitting(true);
      const result = await resendDaoEvaluatorInvitations(selectedDao.seance_id);
      setPanelSuccess(result.detail);
      await loadDetail(selectedDao.seance_id);
      await loadDaos();
    } catch (err) {
      setPanelError(
        err instanceof Error
          ? err.message
          : "Renvoi des invitations impossible",
      );
    } finally {
      setResendSubmitting(false);
    }
  };

  const handleMakeDispoContrat = async (seanceId: number) => {
    try {
      setDispoLoading((prev) => ({ ...prev, [seanceId]: true }));
      setPanelError("");
      setPanelSuccess("");
      setError("");

      const classement = await fetchClassement(seanceId);
      if (!classement || !classement.lignes || classement.lignes.length === 0) {
        throw new Error("Impossible de récupérer le classement de la séance.");
      }
      const moinsDisante = classement.lignes.find(
        (l) => l.est_moins_disante === true,
      );
      const targetLine =
        moinsDisante ?? classement.lignes.find((l) => l.rang === 1);
      if (!targetLine) {
        throw new Error(
          "Aucune offre éligible à l'attribution n'a été trouvée pour cette séance.",
        );
      }

      const contrat = await createContrat(seanceId, targetLine.offre_id);
      const statutContrat =
        contrat.statut_label ||
        contratStatusLabels[contrat.statut] ||
        "statut contrat à vérifier";
      setPanelSuccess(
        `Dossier disponible dans contractualisation (${statutContrat}).`,
      );
      await loadDaos();
    } catch (err) {
      const errMsg =
        err instanceof Error
          ? err.message
          : "Erreur lors de la mise à disposition pour le contrat";
      setPanelError(errMsg);
      setError(errMsg);
    } finally {
      setDispoLoading((prev) => ({ ...prev, [seanceId]: false }));
    }
  };

  const filteredDaos = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return daos;
    return daos.filter((dao) =>
      [dao.reference_dossier, dao.objet_dossier, dao.statut_dao]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [daos, search]);

  const countStatut = (statut: StatutDao) =>
    daos.filter((d) => d.statut_dao === statut).length;

  const sections = useMemo(() => {
    return sectionOrder.map((key) => ({
      key,
      ...sectionConfigs[key],
      rows: filteredDaos.filter((dao) => dao.statut_dao === key),
    }));
  }, [filteredDaos]);

  const showAssignForm = panelMode === "assign" && canAssign;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#f6faf8_0%,transparent_25%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] pb-24 text-slate-800 antialiased selection:bg-emerald-200">
      <TopHeader />

      <div className="zoom-content">
        <div className="mx-auto flex max-w-[1680px] flex-col gap-5 px-4 pb-12 pt-6 md:px-6 lg:pt-8">
          {/* Header Card */}
          {screenState === "ready" && (
            <div className="relative flex w-full flex-col justify-between gap-4 overflow-hidden rounded-3xl border border-slate-100 bg-white px-5 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] md:flex-row md:items-center">
              <div className="pointer-events-none absolute right-0 top-0 h-32 w-56 rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 opacity-45 blur-3xl" />

              <div className="relative z-10 flex min-w-0 items-center gap-4">
                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <Sparkles className="absolute -right-1.5 -top-1.5 h-3.5 w-3.5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-black tracking-tight text-slate-800 sm:text-xl">
                    ÉVALUATION DES OFFRES
                  </h1>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="truncate text-[10px] font-black uppercase tracking-widest text-slate-500 sm:text-[11px]">
                      Module Évaluation — Assignation, suivi et classement des
                      offres par séance
                    </p>
                  </div>
                </div>
              </div>

              {currentUser && (
                <div className="relative z-10 w-fit rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600">
                  Secrétaire :{" "}
                  <span className="text-slate-900">
                    {`${currentUser.first_name} ${currentUser.last_name}`.trim() ||
                      currentUser.username}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
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

          {/* Error State */}
          {screenState === "error" && (
            <section className="rounded-3xl border border-rose-200 bg-white p-8 shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
              <h2 className="text-lg font-black text-slate-900">
                Erreur de chargement
              </h2>
              <p className="mt-2 text-sm text-rose-700">{error}</p>
            </section>
          )}

          {/* Main Dashboard Section */}
          {screenState === "ready" && (
            <>
              {/* Statistics Panel */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
                  <div className="text-xs uppercase tracking-[0.24em] font-bold text-slate-500">
                    À assigner
                  </div>
                  <div className="mt-4 text-4xl font-black text-amber-600">
                    {countStatut("A_ASSIGNER")}
                  </div>
                  <div className="mt-2 text-xs font-medium text-slate-500">
                    Séances en attente des évaluateurs
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
                  <div className="text-xs uppercase tracking-[0.24em] font-bold text-slate-500">
                    En évaluation
                  </div>
                  <div className="mt-4 text-4xl font-black text-sky-600">
                    {countStatut("EN_EVALUATION")}
                  </div>
                  <div className="mt-2 text-xs font-medium text-slate-500">
                    DAO en cours d&apos;évaluation
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
                  <div className="text-xs uppercase tracking-[0.24em] font-bold text-slate-500">
                    Terminés
                  </div>
                  <div className="mt-4 text-4xl font-black text-emerald-600">
                    {countStatut("TERMINE")}
                  </div>
                  <div className="mt-2 text-xs font-medium text-slate-500">
                    Dossiers d&apos;évaluation clos
                  </div>
                </div>
              </div>

              {/* Collapsible Accordions Card */}
              <section className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.05)] backdrop-blur-md transition-all duration-500 hover:shadow-[0_12px_48px_rgba(0,0,0,0.08)]">
                <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 bg-[length:200%_100%] animate-gradient" />
                <div className="p-6">
                  {/* Search Bar */}
                  <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <h2 className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-800">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-600 shadow-sm backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                        <Layers className="h-5 w-5" />
                      </div>
                      Suivi des évaluations de dossier
                    </h2>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="relative min-w-[280px]">
                        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Rechercher un dossier, mot clé..."
                          className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 pl-10 pr-10 text-[13px] font-semibold text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                        />
                        {search && (
                          <button
                            type="button"
                            onClick={() => setSearch("")}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Accordion Lists */}
                  {filteredDaos.length === 0 && Boolean(search.trim()) ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-8 text-center">
                      <p className="text-[13px] font-semibold text-slate-500">
                        Aucun DAO ne correspond à cette recherche.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sections.map((section) => (
                        <EvaluationStatusSection
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
                          router={router}
                          openPanel={openPanel}
                          onMakeDispoContrat={handleMakeDispoContrat}
                          dispoLoading={dispoLoading}
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

      {/* Detail/Assign Side Panel Modal */}
      {panelOpen && selectedDao && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-2 backdrop-blur-sm sm:p-4"
          onMouseDown={(e) => e.target === e.currentTarget && closePanel()}
        >
          <div className="flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="relative flex items-start justify-between gap-4 border-b border-slate-150 bg-slate-50 px-6 py-5">
              <div className="pointer-events-none absolute right-0 top-0 h-24 w-48 rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 opacity-40 blur-2xl" />
              <div className="relative z-10 min-w-0">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
                  {showAssignForm ? "Assignation évaluateurs" : "Suivi du DAO"}
                </span>
                <h2 className="text-lg font-black text-slate-850 mt-1">
                  {selectedDao.reference_dossier}
                </h2>
                <p className="text-xs font-semibold text-slate-500 line-clamp-1 mt-0.5">
                  {selectedDao.objet_dossier}
                </p>
              </div>
              <button
                type="button"
                onClick={closePanel}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200/70 text-slate-650 hover:bg-slate-200 transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-slate-50/50">
              {panelLoading && (
                <div className="flex justify-center py-10">
                  <Loader className="h-7 w-7 animate-spin text-emerald-600" />
                </div>
              )}
              {panelError && (
                <div className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                  <div>{panelError}</div>
                </div>
              )}
              {panelSuccess && (
                <div className="flex gap-2 rounded-xl border border-emerald-250 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                  <div>{panelSuccess}</div>
                </div>
              )}

              {!panelLoading && detail && showAssignForm && (
                <>
                  {/* Identification du DAO */}
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Identification du DAO
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label>
                        <span className={labelClass}>N° AO/DP</span>
                        <input
                          disabled
                          className={disabledClass}
                          value={detail.reference_dossier}
                        />
                      </label>
                      <label>
                        <span className={labelClass}>Intitulé du marché</span>
                        <input
                          disabled
                          className={disabledClass}
                          value={detail.objet_dossier}
                        />
                      </label>
                      <label>
                        <span className={labelClass}>Date limite de dépôt</span>
                        <input
                          disabled
                          className={disabledClass}
                          value={formatDateTime(detail.date_limite_soumission)}
                        />
                      </label>
                      <label>
                        <span className={labelClass}>Représentant Budget</span>
                        <input
                          disabled
                          className={disabledClass}
                          value="À définir"
                        />
                      </label>
                      <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                        <label>
                          <span className={labelClass}>
                            Date d&apos;évaluation *
                          </span>
                          <input
                            type="date"
                            className={fieldClass}
                            value={dateEvaluation}
                            onChange={(e) => setDateEvaluation(e.target.value)}
                          />
                        </label>
                        <label>
                          <span className={labelClass}>Heure *</span>
                          <input
                            type="time"
                            className={fieldClass}
                            value={heureEvaluation}
                            onChange={(e) => setHeureEvaluation(e.target.value)}
                          />
                        </label>
                      </div>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-400">
                      Les invitations emails seront envoyées automatiquement aux
                      évaluateurs à la date et heure configurées.
                    </p>
                  </section>

                  {/* Offres — Lot et NIF/STAT */}
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Offres — Lot et NIF/STAT (par soumissionnaire)
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-450 mt-1">
                      Renseignez le numéro de lot et les identifiants fiscaux
                      requis pour chaque soumissionnaire.
                    </p>
                    <div className="space-y-3">
                      {detail.offres.map((offre) => (
                        <div
                          key={offre.offre_id}
                          className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3"
                        >
                          <p className="text-xs font-black text-slate-800">
                            Offre {offre.ordre_passage} —{" "}
                            {offre.nom_soumissionnaire}
                          </p>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <label>
                              <span className={labelClass}>Lot n° *</span>
                              <input
                                className={fieldClass}
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
                                className={fieldClass}
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
                                className={fieldClass}
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
                  </section>

                  {/* 3 evaluateurs */}
                  <section className="rounded-2xl border border-emerald-100 bg-emerald-50/20 p-5 space-y-4 shadow-sm">
                    <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800">
                      <UserCheck className="h-4.5 w-4.5 text-emerald-600" />
                      Configuration des 3 évaluateurs commissionnés
                    </h3>
                    <div className="space-y-4">
                      {members.map((member, idx) => (
                        <div
                          key={member.key}
                          className="grid gap-3 rounded-xl border border-slate-150 bg-white p-4 sm:grid-cols-2"
                        >
                          <p className="sm:col-span-2 text-xs font-black text-slate-400">
                            Évaluateur {idx + 1}
                          </p>
                          <input
                            placeholder="Nom et prénom *"
                            className={fieldClass}
                            value={member.nomPrenom}
                            onChange={(e) =>
                              updateMember(
                                member.key,
                                "nomPrenom",
                                e.target.value,
                              )
                            }
                          />
                          <input
                            placeholder="CIN (12 chiffres) *"
                            className={fieldClass}
                            value={member.cin}
                            onChange={(e) =>
                              updateMember(
                                member.key,
                                "cin",
                                e.target.value.replace(/\D/g, "").slice(0, 12),
                              )
                            }
                          />
                          <input
                            placeholder="Entité / Ministère *"
                            className={fieldClass}
                            value={member.entite}
                            onChange={(e) =>
                              updateMember(member.key, "entite", e.target.value)
                            }
                          />
                          <input
                            placeholder="Poste occupé *"
                            className={fieldClass}
                            value={member.poste}
                            onChange={(e) =>
                              updateMember(member.key, "poste", e.target.value)
                            }
                          />
                          <input
                            type="email"
                            placeholder="Adresse Email *"
                            className={`${fieldClass} sm:col-span-2`}
                            value={member.email}
                            onChange={(e) =>
                              updateMember(member.key, "email", e.target.value)
                            }
                          />
                        </div>
                      ))}
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => void handleAssign()}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-60"
                      >
                        {submitting ? (
                          <Loader className="h-4.5 w-4.5 animate-spin" />
                        ) : (
                          <Send className="h-4.5 w-4.5" />
                        )}
                        Envoyer les accès évaluateurs
                      </button>
                    </div>
                  </section>
                </>
              )}

              {!panelLoading && detail && !showAssignForm && (
                <>
                  {/* Évaluateurs assignés */}
                  {detail.evaluateurs.length > 0 && (
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                        Évaluateurs assignés
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {detail.evaluateurs.map((ev) => (
                          <div
                            key={ev.id}
                            className="rounded-xl border border-slate-150 bg-slate-50/50 p-4 text-xs"
                          >
                            <p className="font-black text-slate-800 flex items-center gap-1.5">
                              <User className="h-4 w-4 text-slate-450" />
                              {ev.nom}
                            </p>
                            <p className="mt-2 flex items-center gap-1.5 font-semibold text-slate-500 font-mono">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              {ev.email}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => void handleResendInvitations()}
                          disabled={resendSubmitting}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 text-xs font-black uppercase tracking-widest text-emerald-700 transition-all hover:-translate-y-0.5 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Send className="h-4 w-4" />
                          {resendSubmitting
                            ? "Renvoi..."
                            : "Renvoyer invitations"}
                        </button>
                      </div>
                    </section>
                  )}

                  {/* Offres et Statuts */}
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Avancement de l&apos;évaluation des offres
                    </h3>
                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-150 bg-white overflow-hidden">
                      {detail.offres.map((offre) => {
                        const statutKey = offre.statut_synthese;
                        const statutCfg = statutKey
                          ? offreStatutConfig[statutKey]
                          : null;
                        return (
                          <div
                            key={offre.offre_id}
                            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 hover:bg-slate-50/50"
                          >
                            <div>
                              <p className="font-bold text-sm text-slate-800">
                                {offre.ordre_passage}.{" "}
                                {offre.nom_soumissionnaire}
                              </p>
                              <p className="text-xs font-bold text-emerald-700 mt-0.5">
                                {Number(offre.montant_global).toLocaleString(
                                  "fr-FR",
                                )}{" "}
                                MGA
                              </p>
                            </div>
                            {statutCfg ? (
                              <span
                                className={`rounded border px-2.5 py-0.5 text-[10px] font-bold ${statutCfg.className}`}
                              >
                                {statutCfg.label}
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full border border-slate-250 bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold text-slate-500">
                                {offre.progression
                                  ? progressionLabels[offre.progression]
                                  : "En cours"}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Classement direct */}
                  {(detail.statut_dao === "TERMINE" ||
                    detail.statut_dao === "ARCHIVE") &&
                    classementLignes && (
                      <section className="rounded-2xl border border-emerald-200 bg-white p-5 space-y-4 shadow-sm">
                        <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800">
                          Classement Final Officiel
                        </h3>
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                          <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                              <tr>
                                <th className="px-4 py-3">Rang</th>
                                <th className="px-4 py-3">Soumissionnaire</th>
                                <th className="px-4 py-3 text-center">
                                  Score Total
                                </th>
                                <th className="px-4 py-3 text-center">
                                  Technique
                                </th>
                                <th className="px-4 py-3 text-center">
                                  Financier
                                </th>
                                <th className="px-4 py-3 text-center">
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {classementLignes.map((ligne) => (
                                <tr
                                  key={ligne.offre_id}
                                  className={`border-t border-slate-100 ${
                                    ligne.est_moins_disante
                                      ? "bg-emerald-50/60"
                                      : ""
                                  }`}
                                >
                                  <td className="px-4 py-4 font-bold text-slate-900">
                                    {ligne.rang ?? "—"}
                                  </td>
                                  <td className="px-4 py-4 font-semibold text-slate-800">
                                    {ligne.nom_soumissionnaire}
                                    {ligne.est_moins_disante && (
                                      <span className="ml-2 inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Moins disante
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-4 text-center font-bold text-emerald-800">
                                    {ligne.score_total != null
                                      ? `${ligne.score_total.toFixed(2)}/100`
                                      : "—"}
                                  </td>
                                  <td className="px-4 py-4 text-center text-slate-600">
                                    {ligne.score_technique?.toFixed(2) ?? "—"}
                                  </td>
                                  <td className="px-4 py-4 text-center text-slate-600">
                                    {ligne.score_financier?.toFixed(2) ?? "—"}
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    {ligne.rang === 1 ||
                                    ligne.est_moins_disante ? (
                                      <button
                                        type="button"
                                        disabled={
                                          dispoLoading[detail.seance_id] ||
                                          false
                                        }
                                        onClick={() =>
                                          void handleMakeDispoContrat(
                                            detail.seance_id,
                                          )
                                        }
                                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60"
                                      >
                                        {dispoLoading[detail.seance_id] && (
                                          <Loader className="h-4 w-4 animate-spin" />
                                        )}
                                        Attribuer
                                      </button>
                                    ) : (
                                      <span className="text-xs font-semibold text-slate-400">
                                        —
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    )}
                </>
              )}
            </div>
            {/* Modal Footer */}
            <div className="flex items-center justify-end border-t border-slate-150 bg-slate-50 px-6 py-4 shrink-0">
              <button
                type="button"
                onClick={closePanel}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-700 transition hover:bg-slate-50 hover:shadow-sm"
              >
                Quitter
              </button>
            </div>
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
      {panelError && (
        <GlassNotificationPopup
          type="error"
          message={panelError}
          onClose={() => setPanelError("")}
        />
      )}
      {panelSuccess && (
        <GlassNotificationPopup
          type="success"
          message={panelSuccess}
          onClose={() => setPanelSuccess("")}
        />
      )}
    </main>
  );
}

function EvaluationStatusSection({
  section,
  isActive,
  onToggle,
  router,
  openPanel,
  onMakeDispoContrat,
  dispoLoading,
}: {
  section: DashboardSection & { rows: DaoDashboardItem[] };
  isActive: boolean;
  onToggle: () => void;
  router: AppRouter;
  openPanel: (dao: DaoDashboardItem, mode: PanelMode) => void;
  onMakeDispoContrat: (seanceId: number) => void;
  dispoLoading: Record<number, boolean>;
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
            className={`rounded-lg bg-slate-100 p-1 text-slate-400 transition-transform ${isActive ? "rotate-180" : ""}`}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </div>
        </div>
      </button>

      {isActive && (
        <div className="space-y-3 bg-slate-50 px-4 py-4">
          {hasRows ? (
            section.rows.map((dao, index) => (
              <EvaluationDashboardRow
                key={dao.seance_id}
                dao={dao}
                index={index}
                router={router}
                openPanel={openPanel}
                onMakeDispoContrat={onMakeDispoContrat}
                dispoLoading={dispoLoading}
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

function EvaluationDashboardRow({
  dao,
  index,
  router,
  openPanel,
  onMakeDispoContrat,
  dispoLoading,
}: {
  dao: DaoDashboardItem;
  index: number;
  router: AppRouter;
  openPanel: (dao: DaoDashboardItem, mode: PanelMode) => void;
  onMakeDispoContrat: (seanceId: number) => void;
  dispoLoading: Record<number, boolean>;
}) {
  const progression = `${dao.offres_terminees}/${dao.nb_offres} offres terminées`;
  const isPending = dispoLoading[dao.seance_id] || false;
  const contratStatus =
    dao.contrat_statut_label ||
    (dao.contrat_statut ? contratStatusLabels[dao.contrat_statut] : null);

  return (
    <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-emerald-300 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-600">
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              {dao.reference_dossier}
            </span>
            <span
              className={`rounded border px-2 py-0.5 text-[10px] font-bold ${statusClassMap[dao.statut_dao] || "border-slate-200 bg-slate-50 text-slate-700"}`}
            >
              {dao.statut_dao === "A_ASSIGNER"
                ? "À assigner"
                : dao.statut_dao === "EN_EVALUATION"
                  ? "En évaluation"
                  : dao.statut_dao === "ARCHIVE"
                    ? "Archivé"
                    : "Terminé"}
            </span>
          </div>

          <p className="text-[14px] font-black leading-tight text-slate-800">
            {dao.objet_dossier || "Objet du dossier non spécifié"}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-650">
              Offres : {dao.nb_offres}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-600 flex items-center gap-1">
              <Users className="h-3 w-3 text-slate-400" />
              Évaluateurs : {dao.evaluateurs_assignes}/3
            </span>
            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
              Progression : {progression}
            </span>
            {contratStatus && (
              <span className="rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 font-semibold text-violet-700">
                Contrat : {contratStatus}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-wrap gap-2 border-t border-slate-100 pt-3 sm:w-auto sm:border-t-0 sm:pt-0">
        {dao.statut_dao === "TERMINE" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => void onMakeDispoContrat(dao.seance_id)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60 sm:flex-none"
          >
            {isPending && <Loader className="h-4 w-4 animate-spin" />}
            Dispo pour contrat
          </button>
        )}

        {dao.statut_dao === "ARCHIVE" && dao.contrat_id ? (
          <>
            <button
              type="button"
              onClick={() =>
                router.push(`/personnel/contractualisation/${dao.contrat_id}`)
              }
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:-translate-y-0.5 hover:bg-emerald-800 sm:flex-none"
            >
              Voir contrat
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => openPanel(dao, "detail")}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-250 bg-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-all hover:-translate-y-0.5 hover:bg-slate-50 sm:flex-none"
            >
              Suivi
            </button>
          </>
        ) : dao.statut_dao === "A_ASSIGNER" ? (
          <button
            type="button"
            onClick={() =>
              router.push(`/personnel/evaluation_offre/${dao.seance_id}/assign`)
            }
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800 sm:flex-none"
          >
            <UserCheck className="h-4 w-4" />
            Assigner les évaluateurs
          </button>
        ) : (
          <button
            type="button"
            onClick={() => openPanel(dao, "detail")}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800 sm:flex-none"
          >
            Suivi
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
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
