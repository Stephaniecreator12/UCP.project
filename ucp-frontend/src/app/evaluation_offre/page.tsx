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
  CheckCircle2,
  ChevronDown,
  ChevronRight,
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
} from "lucide-react";
import TopHeader from "@/app/components/TopHeader";
import {
  assignDaoEvaluators,
  fetchDaoDashboard,
  fetchDaoDetail,
  type AssignationPayload,
  type DaoDashboardItem,
  type DaoDetail,
  type ProgressionStatut,
  type StatutDao,
  type StatutDashboard,
} from "@/services/evaluationService";
import { getToken } from "@/services/auth";

type ScreenState = "loading" | "ready" | "error";
type PanelMode = "assign" | "detail";

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

const sectionConfigs: Record<StatutDao, DashboardSection> = {
  A_ASSIGNER: {
    key: "A_ASSIGNER",
    title: "À assigner",
    subtitle: "Séances validées en attente des 3 évaluateurs.",
    icon: Users,
    iconClass: "border-amber-200 bg-amber-100 text-amber-800",
    badgeClass: "border-amber-200 bg-amber-500 text-white",
    emptyText: "Aucun DAO à assigner.",
  },
  EN_EVALUATION: {
    key: "EN_EVALUATION",
    title: "En évaluation",
    subtitle: "Les évaluateurs remplissent leurs grilles offre par offre.",
    icon: Hourglass,
    iconClass: "border-sky-200 bg-sky-100 text-sky-800",
    badgeClass: "border-sky-200 bg-sky-500 text-white",
    emptyText: "Aucun DAO en cours d'évaluation.",
  },
  TERMINE: {
    key: "TERMINE",
    title: "Terminé",
    subtitle: "Toutes les offres ont été évaluées et signées.",
    icon: CheckCircle2,
    iconClass: "border-emerald-200 bg-emerald-100 text-emerald-800",
    badgeClass: "border-emerald-200 bg-emerald-600 text-white",
    emptyText: "Aucun DAO terminé.",
  },
};

const sectionOrder: StatutDao[] = ["A_ASSIGNER", "EN_EVALUATION", "TERMINE"];

const offreStatutConfig: Record<StatutDashboard, { label: string; className: string }> = {
  A_ASSIGNER: { label: "À assigner", className: "border-amber-200 bg-amber-50 text-amber-800" },
  EN_EVALUATION: { label: "En évaluation", className: "border-sky-200 bg-sky-50 text-sky-800" },
  CONSENSUS_REQUIS: { label: "Consensus", className: "border-amber-200 bg-amber-100 text-amber-900" },
  NON_CONFORME: { label: "Non conforme", className: "border-rose-200 bg-rose-50 text-rose-800" },
  ELIMINEE: { label: "Éliminée", className: "border-slate-300 bg-slate-100 text-slate-700" },
  VALIDEE: { label: "Validée", className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  REJETEE: { label: "Rejetée", className: "border-rose-200 bg-rose-100 text-rose-900" },
};

const progressionLabels: Record<ProgressionStatut, string> = {
  PAS_COMMENCE: "Pas commencée",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
};

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-50";
const disabledClass =
  "w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-500 cursor-not-allowed";
const labelClass =
  "mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500";

const emptyMembers = (): ManualMember[] => [
  { key: "1", nomPrenom: "", email: "", entite: "", poste: "", cin: "" },
  { key: "2", nomPrenom: "", email: "", entite: "", poste: "", cin: "" },
  { key: "3", nomPrenom: "", email: "", entite: "", poste: "", cin: "" },
];

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function DaoRow({
  dao,
  onAssign,
  onDetail,
  onClassement,
}: {
  dao: DaoDashboardItem;
  onAssign: () => void;
  onDetail: () => void;
  onClassement: () => void;
}) {
  const progression = `${dao.offres_terminees}/${dao.nb_offres} offres terminées`;

  return (
    <article className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="h-1 bg-gradient-to-r from-emerald-600 to-teal-500" />
      <div className="flex flex-wrap items-start justify-between gap-4 p-5">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            {dao.reference_dossier}
          </p>
          <h3 className="text-lg font-bold text-slate-900 line-clamp-2">{dao.objet_dossier}</h3>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span>{dao.nb_offres} offre{dao.nb_offres > 1 ? "s" : ""}</span>
            <span className="font-semibold text-slate-700">{progression}</span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {dao.evaluateurs_assignes}/3 évaluateurs
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {dao.statut_dao === "TERMINE" && (
            <button
              type="button"
              onClick={onClassement}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
            >
              Classement
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
          {dao.statut_dao === "A_ASSIGNER" ? (
            <button
              type="button"
              onClick={onAssign}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800"
            >
              <UserCheck className="h-4 w-4" />
              Assigner les évaluateurs
            </button>
          ) : (
            <button
              type="button"
              onClick={onDetail}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Suivi
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function EvaluationSecretairePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[linear-gradient(180deg,#f8faf9_0%,#f1f5f3_100%)]">
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
  const [state, setState] = useState<ScreenState>("loading");
  const [daos, setDaos] = useState<DaoDashboardItem[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [selectedDao, setSelectedDao] = useState<DaoDashboardItem | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<PanelMode>("detail");
  const [detail, setDetail] = useState<DaoDetail | null>(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelError, setPanelError] = useState("");
  const [panelSuccess, setPanelSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dateEvaluation, setDateEvaluation] = useState("");
  const [heureEvaluation, setHeureEvaluation] = useState("09:00");
  const [members, setMembers] = useState<ManualMember[]>(emptyMembers());
  const [offreMeta, setOffreMeta] = useState<Record<number, { lot: string; nif: string }>>({});

  const loadDaos = useCallback(async () => {
    try {
      setState("loading");
      const data = await fetchDaoDashboard();
      setDaos(data);
      setOpenSections(Object.fromEntries(sectionOrder.map((key) => [key, false])));
      setState("ready");
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setState("error");
      return [];
    }
  }, []);

  const loadDetail = useCallback(async (seanceId: number) => {
    setPanelLoading(true);
    setPanelError("");
    try {
      const data = await fetchDaoDetail(seanceId);
      setDetail(data);
      setDateEvaluation(
        data.date_evaluation?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      );
      setHeureEvaluation(data.heure_evaluation?.slice(0, 5) || "09:00");
      setOffreMeta(
        Object.fromEntries(
          data.offres.map((o) => [
            o.offre_id,
            { lot: o.lot_numero || "", nif: o.nif_stat || "" },
          ]),
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
      setPanelError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setPanelLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    void loadDaos().then((data) => {
      const seanceParam = searchParams.get("seance");
      if (!seanceParam) return;
      router.push(`/evaluation_offre/${seanceParam}/assign`);
    });
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

  const updateMember = (key: string, field: keyof Omit<ManualMember, "key">, value: string) => {
    setMembers((prev) => prev.map((m) => (m.key === key ? { ...m, [field]: value } : m)));
  };

  const canAssign =
    detail?.statut_dao === "A_ASSIGNER" || (detail?.evaluateurs.length ?? 0) < 3;

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
        setPanelError(`NIF / STAT requis pour ${offre.nom_soumissionnaire}.`);
        return;
      }
    }
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      if (!m.nomPrenom.trim() || !m.email.trim() || !m.entite.trim() || !m.poste.trim()) {
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
          nif_stat: offreMeta[o.offre_id]?.nif.trim(),
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
      setPanelError(err instanceof Error ? err.message : "Erreur lors de l'assignation");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDaos = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return daos;
    return daos.filter((dao) =>
      [dao.reference_dossier, dao.objet_dossier, dao.statut_dao].join(" ").toLowerCase().includes(q),
    );
  }, [daos, search]);

  const sections = useMemo(
    () =>
      sectionOrder.map((key) => ({
        ...sectionConfigs[key],
        rows: filteredDaos.filter((dao) => dao.statut_dao === key),
      })),
    [filteredDaos],
  );

  const showAssignForm = panelMode === "assign" && canAssign;

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f8faf9_0%,#f1f5f3_100%)]">
        <TopHeader />
        <div className="flex h-[60vh] items-center justify-center">
          <Clock className="h-8 w-8 animate-spin text-emerald-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8faf9_0%,#f1f5f3_100%)]">
      <TopHeader />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="mb-6 overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(145deg,#ffffff_0%,#f7fbf9_48%,#eff5f1_100%)] shadow-[0_30px_80px_-50px_rgba(15,23,42,0.5)]">
          <div className="h-1 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-300" />
          <div className="flex items-start gap-4 px-5 py-6 sm:px-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700">
              <ClipboardList className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-700">
                Module évaluation
              </p>
              <h1 className="mt-1 text-3xl font-bold text-slate-950">
                Suivi des évaluations par DAO
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Assignation, suivi et classement des offres par séance.
              </p>
            </div>
          </div>
        </section>

        <div className="mb-5 flex items-center gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un DAO…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>

        {state === "error" && (
          <div className="mb-5 rounded-[22px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {sections.map((section) => {
            const Icon = section.icon;
            const isOpen = openSections[section.key] ?? false;
            return (
              <section
                key={section.key}
                className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenSections((prev) => ({ ...prev, [section.key]: !isOpen }))
                  }
                  className="flex w-full items-start justify-between gap-4 px-5 py-5 text-left sm:px-6"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${section.iconClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${section.badgeClass}`}
                        >
                          {section.rows.length}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{section.subtitle}</p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`mt-1 h-5 w-5 text-slate-400 transition ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="space-y-3 border-t border-slate-100 px-5 pb-5 pt-4 sm:px-6">
                    {section.rows.length === 0 ? (
                      <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                        {section.emptyText}
                      </p>
                    ) : (
                      section.rows.map((dao) => (
                        <DaoRow
                          key={dao.seance_id}
                          dao={dao}
                          onAssign={() =>
                            router.push(`/evaluation_offre/${dao.seance_id}/assign`)
                          }
                          onDetail={() => openPanel(dao, "detail")}
                          onClassement={() =>
                            router.push(`/evaluation/classement/${dao.seance_id}`)
                          }
                        />
                      ))
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>

      {panelOpen && selectedDao && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-2 backdrop-blur-sm sm:p-4"
          onMouseDown={(e) => e.target === e.currentTarget && closePanel()}
        >
          <div className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  {showAssignForm ? "Assignation évaluateurs" : "Suivi du DAO"}
                </p>
                <h2 className="text-xl font-bold text-slate-900">{selectedDao.reference_dossier}</h2>
                <p className="text-sm text-slate-600 line-clamp-2">{selectedDao.objet_dossier}</p>
              </div>
              <button
                type="button"
                onClick={closePanel}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200/70 text-slate-600 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-5">
              {panelLoading && (
                <div className="flex justify-center py-10">
                  <Loader className="h-7 w-7 animate-spin text-emerald-600" />
                </div>
              )}
              {panelError && (
                <div className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  {panelError}
                </div>
              )}
              {panelSuccess && (
                <div className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  {panelSuccess}
                </div>
              )}

              {!panelLoading && detail && showAssignForm && (
                <>
                  <section className="rounded-2xl border border-slate-200 p-4 space-y-3">
                    <h3 className="text-sm font-bold text-slate-800">Identification du DAO</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label>
                        <span className={labelClass}>N° AO/DP</span>
                        <input disabled className={disabledClass} value={detail.reference_dossier} />
                      </label>
                      <label>
                        <span className={labelClass}>Intitulé du marché</span>
                        <input disabled className={disabledClass} value={detail.objet_dossier} />
                      </label>
                      <label>
                        <span className={labelClass}>Date limite de dépôt des offres</span>
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
                          value="Paul Budget (hashlah940@gmail.com)"
                        />
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <label>
                          <span className={labelClass}>Date d&apos;évaluation *</span>
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
                    <p className="text-xs text-slate-500">
                      Les emails partent à cette date/heure — début de l&apos;évaluation.
                    </p>
                  </section>

                  <section className="rounded-2xl border border-slate-200 p-4 space-y-3">
                    <h3 className="text-sm font-bold text-slate-800">
                      Offres — Lot et NIF/STAT (par soumissionnaire)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Le NIF/STAT est propre à chaque offre (identité fiscale du soumissionnaire).
                    </p>
                    <div className="space-y-3">
                      {detail.offres.map((offre) => (
                        <div
                          key={offre.offre_id}
                          className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 space-y-2"
                        >
                          <p className="text-sm font-bold text-slate-800">
                            Offre {offre.ordre_passage} — {offre.nom_soumissionnaire}
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <label>
                              <span className={labelClass}>Lot n° *</span>
                              <input
                                className={fieldClass}
                                value={offreMeta[offre.offre_id]?.lot ?? ""}
                                onChange={(e) =>
                                  setOffreMeta((p) => ({
                                    ...p,
                                    [offre.offre_id]: {
                                      ...p[offre.offre_id],
                                      lot: e.target.value,
                                      nif: p[offre.offre_id]?.nif ?? "",
                                    },
                                  }))
                                }
                              />
                            </label>
                            <label>
                              <span className={labelClass}>NIF / STAT *</span>
                              <input
                                className={fieldClass}
                                value={offreMeta[offre.offre_id]?.nif ?? ""}
                                onChange={(e) =>
                                  setOffreMeta((p) => ({
                                    ...p,
                                    [offre.offre_id]: {
                                      lot: p[offre.offre_id]?.lot ?? "",
                                      nif: e.target.value,
                                    },
                                  }))
                                }
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-3">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      <UserCheck className="h-4 w-4 text-emerald-600" />
                      3 évaluateurs
                    </h3>
                    <div className="space-y-3">
                      {members.map((member, idx) => (
                        <div
                          key={member.key}
                          className="grid gap-2 rounded-xl border border-white bg-white p-3 sm:grid-cols-2"
                        >
                          <p className="sm:col-span-2 text-xs font-bold text-slate-500">
                            Évaluateur {idx + 1}
                          </p>
                          <input
                            placeholder="Nom et prénom *"
                            className={fieldClass}
                            value={member.nomPrenom}
                            onChange={(e) =>
                              updateMember(member.key, "nomPrenom", e.target.value)
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
                            placeholder="Entité *"
                            className={fieldClass}
                            value={member.entite}
                            onChange={(e) => updateMember(member.key, "entite", e.target.value)}
                          />
                          <input
                            placeholder="Poste *"
                            className={fieldClass}
                            value={member.poste}
                            onChange={(e) => updateMember(member.key, "poste", e.target.value)}
                          />
                          <input
                            type="email"
                            placeholder="Email *"
                            className={`${fieldClass} sm:col-span-2`}
                            value={member.email}
                            onChange={(e) => updateMember(member.key, "email", e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void handleAssign()}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
                    >
                      {submitting ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Envoyer les accès
                    </button>
                  </section>
                </>
              )}

              {!panelLoading && detail && !showAssignForm && (
                <>
                  {detail.evaluateurs.length > 0 && (
                    <div className="grid gap-2 sm:grid-cols-3">
                      {detail.evaluateurs.map((ev) => (
                        <div
                          key={ev.id}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"
                        >
                          <p className="font-bold text-slate-800">{ev.nom}</p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            <Mail className="h-3 w-3" />
                            {ev.email}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
                    {detail.offres.map((offre) => {
                      const statutKey = offre.statut_synthese;
                      const statutCfg = statutKey ? offreStatutConfig[statutKey] : null;
                      return (
                        <div
                          key={offre.offre_id}
                          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                        >
                          <div>
                            <p className="font-semibold text-slate-800">
                              {offre.ordre_passage}. {offre.nom_soumissionnaire}
                            </p>
                            <p className="text-xs text-slate-500">
                              {Number(offre.montant_global).toLocaleString("fr-FR")} MGA
                            </p>
                          </div>
                          {statutCfg ? (
                            <span
                              className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${statutCfg.className}`}
                            >
                              {statutCfg.label}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">
                              {offre.progression
                                ? progressionLabels[offre.progression]
                                : "En cours"}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {detail.statut_dao === "TERMINE" && (
                    <button
                      type="button"
                      onClick={() => {
                        closePanel();
                        router.push(`/evaluation/classement/${detail.seance_id}`);
                      }}
                      className="rounded-full border border-emerald-200 px-5 py-2.5 text-sm font-bold text-emerald-800 hover:bg-emerald-50"
                    >
                      Voir le classement
                    </button>
                  )}
                </>
              )}
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
      <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
        isError
          ? "border-rose-500/30 bg-rose-500/20 text-rose-700"
          : "border-emerald-500/30 bg-emerald-500/20 text-emerald-700"
      }`}>
        {isError ? (
          <AlertCircle className="h-5 w-5 animate-pulse" />
        ) : (
          <CheckCircle2 className="h-5 w-5 animate-bounce" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-[15px] font-black tracking-tight ${isError ? "text-rose-950" : "text-emerald-950"}`}>
          {isError ? "Action impossible" : "Action enregistrée"}
        </p>
        <p className={`mt-1 text-[13px] font-medium leading-relaxed ${isError ? "text-rose-900/90" : "text-emerald-900/90"}`}>
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
