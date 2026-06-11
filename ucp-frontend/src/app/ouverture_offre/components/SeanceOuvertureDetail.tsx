"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  ListPlus,
  Lock,
  Save,
  Search,
  SendHorizontal,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";

import TopHeader from "@/app/components/TopHeader";
import SeanceOverviewDetails from "@/app/ouverture_offre/components/SeanceOverviewDetails";
import {
  consumeOpeningFlashMessage,
  setOpeningFlashMessage,
} from "@/app/ouverture_offre/utils/flashMessage";
import {
  fetchCurrentUser,
  getToken,
  isSecretaireUser,
  logout,
  type UserProfile,
} from "@/services/auth";
import {
  getAvailableUsers,
  getSeanceById,
  rejectMember,
  rejectPresident,
  updateSeance,
  validateMember,
  validatePresident,
  downloadPV,
} from "@/services/ouvertureOffre";
import { listMarkets } from "@/services/procurement";
import { listFournisseurs, type Fournisseur } from "@/services/achats";
import type {
  OffreOuverture,
  OuvertureUser,
  SeanceOuverture,
  UpdateSeancePayload,
  CommissionMemberPayload,
} from "@/types/ouvertureOffre";
import type { ProcurementMarket, ProcedureType } from "@/types/procurement";

type ScreenState = "loading" | "ready" | "error";
type SaveMode =
  | "draft"
  | "submit"
  | "member"
  | "president"
  | "reject-member"
  | "reject-president";
type RejectMode = "member" | "president";
type EnvelopeState =
  | ""
  | "DEPOSEE"
  | "MANQUANTE"
  | "RECU"
  | "INTEGRE"
  | "MANQUANT";

type EditableOffre = {
  localId: string;
  nom_soumissionnaire: string;
  pli_existe: boolean;
  motif_absence_pli: string;
  date_reception_pli: string;
  heure_reception_pli: string;
  enveloppe_administrative: EnvelopeState;
  enveloppe_technique: EnvelopeState;
  enveloppe_financiere: EnvelopeState;
  montant_global: string;
  observations: string;
};

type CommissionMember = {
  nomPrenom?: string;
  email?: string;
  cin?: string;
  poste?: string;
  entite?: string;
  decision?: SeanceOuverture["membres"][number]["decision"];
  dateValidation?: string | null;
  commentaire?: string;
};

type DetailFormState = {
  reference_dossier: string;
  objet_dossier: string;
  president: string;
  date_seance: string;
  heure_seance: string;
  lieu: string;
  observations: string;
  etape_ouverture: SeanceOuverture["etape_ouverture"];
  etat_scelle: SeanceOuverture["etat_scelle"];
  presence_rature: boolean;
  description_rature: string;
  document_substitution_present: boolean;
  membre_ids: number[];
  offres: EditableOffre[];
};

type ValidationIssue = {
  field: string;
  message: string;
};

const statusLabelMap: Record<SeanceOuverture["statut"], string> = {
  BROUILLON: "Brouillon",
  EN_SAISIE: "En saisie",
  A_VALIDER: "Validation membres",
  EN_VALIDATION_MEMBRES: "Validation membres",
  EN_VALIDATION_PRESIDENT: "Validation président",
  VALIDEE: "Validée",
  REJETEE: "Rejetée",
};

const statusClassMap: Record<SeanceOuverture["statut"], string> = {
  BROUILLON: "border-amber-200 bg-amber-50 text-amber-700",
  EN_SAISIE: "border-sky-200 bg-sky-50 text-sky-700",
  A_VALIDER: "border-indigo-200 bg-indigo-50 text-indigo-700",
  EN_VALIDATION_MEMBRES: "border-indigo-200 bg-indigo-50 text-indigo-700",
  EN_VALIDATION_PRESIDENT: "border-violet-200 bg-violet-50 text-violet-700",
  VALIDEE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJETEE: "border-rose-200 bg-rose-50 text-rose-700",
};

const inputClass =
  "h-10 rounded-xl border border-slate-200 bg-white/70 px-3 text-[13px] font-semibold text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";
const selectClass =
  "h-10 rounded-xl border border-slate-200 bg-white/70 px-3 text-[13px] font-semibold text-slate-800 shadow-sm outline-none transition-all focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";
const textareaClass =
  "rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-[13px] font-semibold text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const parseCommissionMembers = (stored: string | null): CommissionMember[] => {
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

const mapSeanceMembersToCommissionMembers = (
  seance: SeanceOuverture,
): CommissionMember[] =>
  seance.membres.map((member) => ({
    nomPrenom:
      member.nom_prenom?.trim() ||
      member.utilisateur_detail.full_name?.trim() ||
      member.utilisateur_detail.username,
    email:
      member.utilisateur_detail.email || member.utilisateur_detail.username,
    cin: member.numero_carte || "",
    poste: member.poste || "",
    entite: member.intitule || "",
    decision: member.decision,
    dateValidation: member.date_validation,
    commentaire: member.commentaire || "",
  }));

const mergeCommissionMembers = (
  backendMembers: CommissionMember[],
  storedMembers: CommissionMember[],
): CommissionMember[] => {
  if (backendMembers.length === 0) return storedMembers;
  if (storedMembers.length === 0) return backendMembers;

  return backendMembers.map((backendMember) => {
    const storedMember = storedMembers.find(
      (member) =>
        member.email &&
        backendMember.email &&
        member.email.toLowerCase() === backendMember.email.toLowerCase(),
    );

    if (!storedMember) return backendMember;

    return {
      ...backendMember,
      cin: backendMember.cin || storedMember.cin,
      poste: backendMember.poste || storedMember.poste,
      entite: backendMember.entite || storedMember.entite,
      nomPrenom: backendMember.nomPrenom || storedMember.nomPrenom,
    };
  });
};
const compactInputClass =
  "h-9 rounded-lg border border-slate-200 bg-white/75 px-2.5 text-[12px] font-semibold text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";
const compactSelectClass =
  "h-9 rounded-lg border border-slate-200 bg-white/75 px-2.5 text-[12px] font-semibold text-slate-800 shadow-sm outline-none transition-all focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";
const compactTextareaClass =
  "rounded-lg border border-slate-200 bg-white/75 px-2.5 py-1.5 text-[12px] font-semibold text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";
const labelClass =
  "text-[10px] font-black uppercase tracking-[0.16em] text-slate-500";

const procedureLabels: Record<ProcedureType, string> = {
  AOI: "AOI - Appel d'offres international",
  AON: "AON - Appel d'offres national",
  DC: "DC - Demande de cotation",
  GRE_A_GRE: "Gré à gré",
};

const toInputDate = (value?: string | null) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toInputTime = (value?: string | null) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "Non renseignée dans le DAO";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};

const formatValidationDateTime = (value?: string | null) => {
  if (!value) return "Non renseignée";
  return formatDateTime(value);
};

const getCommissionDecisionLabel = (
  decision?: CommissionMember["decision"],
) => {
  if (decision === "VALIDEE") return "Validé";
  if (decision === "REJETEE") return "Rejeté";
  return "En attente";
};

const createLocalId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `offre-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const createEmptyOffre = (): EditableOffre => ({
  localId: createLocalId(),
  nom_soumissionnaire: "",
  pli_existe: true,
  motif_absence_pli: "",
  date_reception_pli: "",
  heure_reception_pli: "",
  enveloppe_administrative: "",
  enveloppe_technique: "",
  enveloppe_financiere: "",
  montant_global: "",
  observations: "",
});

const mapOffreToEditable = (offre: OffreOuverture): EditableOffre => ({
  localId: createLocalId(),
  nom_soumissionnaire: offre.nom_soumissionnaire,
  pli_existe: offre.pli_existe,
  motif_absence_pli: offre.motif_absence_pli,
  date_reception_pli: offre.date_reception_pli ?? "",
  heure_reception_pli: offre.heure_reception_pli ?? "",
  enveloppe_administrative: offre.enveloppe_administrative,
  enveloppe_technique: offre.enveloppe_technique,
  enveloppe_financiere: offre.enveloppe_financiere,
  montant_global:
    offre.montant_global === null || offre.montant_global === undefined
      ? ""
      : String(offre.montant_global),
  observations: offre.observations,
});

const buildFormState = (seance: SeanceOuverture): DetailFormState => ({
  reference_dossier: seance.reference_dossier,
  objet_dossier: seance.objet_dossier,
  president: seance.president ? String(seance.president) : "",
  date_seance: seance.date_seance ?? "",
  heure_seance: seance.heure_seance ?? "",
  lieu: seance.lieu,
  observations: seance.observations,
  etape_ouverture: seance.etape_ouverture,
  etat_scelle: seance.etat_scelle,
  presence_rature: seance.presence_rature,
  description_rature: seance.description_rature,
  document_substitution_present: seance.document_substitution_present,
  membre_ids: seance.membres.map((membre) => membre.utilisateur),
  offres:
    seance.offres.length > 0
      ? seance.offres.map(mapOffreToEditable)
      : [createEmptyOffre()],
});

const getUserLabel = (user: OuvertureUser) =>
  user.full_name?.trim() ||
  `${user.first_name} ${user.last_name}`.trim() ||
  user.username;

export default function SeanceOuvertureDetail() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const rawParamId = params?.id;
  const normalizedParamId = Array.isArray(rawParamId)
    ? rawParamId[0]
    : rawParamId;
  const currentDetailPath = normalizedParamId
    ? `/ouverture_offre/${normalizedParamId}`
    : "/ouverture_offre";
  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [seance, setSeance] = useState<SeanceOuverture | null>(null);
  const [linkedMarket, setLinkedMarket] = useState<ProcurementMarket | null>(
    null,
  );
  const [availableUsers, setAvailableUsers] = useState<OuvertureUser[]>([]);
  const [formData, setFormData] = useState<DetailFormState | null>(null);
  const [error, setError] = useState("");
  const [membersIncomplete, setMembersIncomplete] = useState(false);
  const [successMessage, setSuccessMessage] = useState(() =>
    consumeOpeningFlashMessage(currentDetailPath),
  );
  const [suppliers, setSuppliers] = useState<Fournisseur[]>([]);
  const [saveMode, setSaveMode] = useState<SaveMode | null>(null);
  const [validationComment, setValidationComment] = useState("");
  const [validationTarget, setValidationTarget] = useState("");
  const [pendingRejectMode, setPendingRejectMode] = useState<RejectMode | null>(
    null,
  );
  const [pendingValidateMode, setPendingValidateMode] = useState<
    "member" | "president" | null
  >(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [draftMemberIds, setDraftMemberIds] = useState<number[]>([]);
  const [memberModalError, setMemberModalError] = useState("");
  const [commissionMembers, setCommissionMembers] = useState<
    CommissionMember[]
  >([]);
  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      const rawId = params?.id;
      const normalizedId = Array.isArray(rawId) ? rawId[0] : rawId;

      if (!getToken()) {
        const nextPath = normalizedId
          ? `/ouverture_offre/${normalizedId}`
          : "/ouverture_offre";
        router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
        return;
      }

      const seanceId = Number(normalizedId);

      if (!normalizedId || Number.isNaN(seanceId)) {
        setError("Identifiant de séance invalide.");
        setScreenState("error");
        return;
      }

      try {
        const user = await fetchCurrentUser();
        if (!isSecretaireUser(user)) {
          logout();
          router.replace("/login");
          return;
        }
        setCurrentUser(user);

        const [seanceData, users, markets, suppliersData] = await Promise.all([
          getSeanceById(seanceId),
          getAvailableUsers(),
          listMarkets(),
          listFournisseurs().catch(() => []),
        ]);

        setSeance(seanceData);
        setLinkedMarket(
          markets.find(
            (market) =>
              market.reference_number === seanceData.reference_dossier,
          ) ?? null,
        );
        setAvailableUsers(users);
        setSuppliers(suppliersData);

        // Load manual commission members from localStorage
        const localKey = `ucp_commission_membres_${seanceData.reference_dossier}`;
        const loadedMembers = parseCommissionMembers(
          localStorage.getItem(localKey),
        );
        const backendMembers = mapSeanceMembersToCommissionMembers(seanceData);
        setCommissionMembers(
          mergeCommissionMembers(backendMembers, loadedMembers),
        );

        // Bridge manual members to DB user accounts (by email)
        const matchedIds: number[] = [];
        if (Array.isArray(loadedMembers)) {
          loadedMembers.forEach((m) => {
            if (!m.email) return;

            const found = users.find(
              (u: OuvertureUser) =>
                u.email?.toLowerCase() === m.email?.toLowerCase(),
            );
            if (found) {
              matchedIds.push(found.id);
            }
          });
        }

        const initialFormState = buildFormState(seanceData);
        if (matchedIds.length > 0) {
          initialFormState.membre_ids = matchedIds;
        }
        setFormData(initialFormState);

        // Check if commission members are complete (status "final" in localStorage)
        const localStatus = localStorage.getItem(
          `ucp_commission_membres_status_${seanceData.reference_dossier}`,
        );
        const isSecretaire = isSecretaireUser(user);
        if (
          isSecretaire &&
          localStatus !== "final" &&
          seanceData.membres.length < 3
        ) {
          setMembersIncomplete(true);
        }

        setScreenState("ready");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger la séance d'ouverture.",
        );
        setScreenState("error");
      }
    };

    void bootstrap();
  }, [params, router]);

  const isLocked =
    !!seance && seance.statut !== "BROUILLON" && seance.statut !== "EN_SAISIE";
  const canEdit =
    !!seance &&
    !!currentUser &&
    isSecretaireUser(currentUser) &&
    seance.secretaire === currentUser.id &&
    !isLocked;
  const showMontantColumn = formData?.etape_ouverture === "COMPLETE";
  const selectedPresidentId = formData?.president
    ? Number(formData.president)
    : null;
  const selectedPresident = selectedPresidentId
    ? (availableUsers.find((user) => user.id === selectedPresidentId) ?? null)
    : null;
  const deadlineDate = toInputDate(linkedMarket?.deadline);
  const deadlineTime = toInputTime(linkedMarket?.deadline);

  const modalMemberOptions = useMemo(() => {
    const normalizedSearch = memberSearch.trim().toLowerCase();

    return availableUsers.filter((user) => {
      if (user.id === selectedPresidentId) return false;
      if (!normalizedSearch) return true;

      const searchable = [
        user.username,
        user.email,
        user.first_name,
        user.last_name,
        user.full_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    });
  }, [availableUsers, memberSearch, selectedPresidentId]);

  const currentMember = seance?.membres.find(
    (membre) => membre.utilisateur === currentUser?.id,
  );
  const presentMembers =
    seance?.membres.filter((membre) => membre.est_present) ?? [];
  const allPresentMembersDecided =
    presentMembers.length > 0 &&
    presentMembers.every((membre) => membre.decision !== "EN_ATTENTE");
  const canValidateAsMember =
    !!seance &&
    (seance.statut === "EN_VALIDATION_MEMBRES" ||
      seance.statut === "A_VALIDER") &&
    !!currentMember &&
    currentMember.est_present &&
    currentMember.decision === "EN_ATTENTE";
  const canRejectAsMember = canValidateAsMember;
  const canValidateAsPresident =
    !!seance &&
    !!currentUser &&
    (seance.statut === "EN_VALIDATION_PRESIDENT" ||
      seance.statut === "A_VALIDER") &&
    seance.president === currentUser.id &&
    allPresentMembersDecided &&
    seance.president_decision === "EN_ATTENTE";
  const isPresidentViewer =
    !!seance && !!currentUser && seance.president === currentUser.id;
  const canRejectAsPresident =
    !!seance &&
    isPresidentViewer &&
    (seance.statut === "EN_VALIDATION_PRESIDENT" ||
      seance.statut === "A_VALIDER") &&
    seance.president_decision === "EN_ATTENTE";
  const hasValidatedAsMember = currentMember?.decision === "VALIDEE";
  const hasRejectedAsMember = currentMember?.decision === "REJETEE";
  const hasValidatedAsPresident =
    isPresidentViewer && seance?.president_decision === "VALIDEE";
  const hasRejectedAsPresident =
    isPresidentViewer && seance?.president_decision === "REJETEE";
  const hasProcessedByCurrentUser =
    hasValidatedAsMember ||
    hasRejectedAsMember ||
    hasValidatedAsPresident ||
    hasRejectedAsPresident;
  const isAbsentMemberViewer = !!currentMember && !currentMember.est_present;
  const presidentValidationBlocked =
    !!seance &&
    isPresidentViewer &&
    (seance.statut === "EN_VALIDATION_MEMBRES" ||
      seance.statut === "A_VALIDER") &&
    seance.president_decision === "EN_ATTENTE" &&
    !allPresentMembersDecided;
  const canTakeDecision =
    canValidateAsMember ||
    canValidateAsPresident ||
    canRejectAsMember ||
    canRejectAsPresident;
  const pageModeLabel = canEdit
    ? "Formulaire d'ouverture"
    : canTakeDecision || presidentValidationBlocked
      ? "Validation de séance"
      : "Détail de séance";
  const overviewCommissionMembers = commissionMembers.map((member, index) => ({
    id: index + 1,
    utilisateur: index + 1,
    utilisateur_detail: {
      id: index + 1,
      username: member.email || member.nomPrenom || `membre-${index + 1}`,
      email: member.email || "",
      first_name: "",
      last_name: "",
      full_name: member.nomPrenom || member.email || `Membre ${index + 1}`,
    },
    nom_prenom: member.nomPrenom || "",
    numero_carte: member.cin || "",
    intitule: member.entite || "",
    poste: member.poste || "",
    est_present: true,
    a_valide: !!member.decision && member.decision !== "EN_ATTENTE",
    decision: member.decision || "EN_ATTENTE",
    commentaire: member.commentaire || "",
    date_validation: member.dateValidation || null,
  })) as SeanceOuverture["membres"];

  const setField = <K extends keyof DetailFormState>(
    field: K,
    value: DetailFormState[K],
  ) => {
    if (validationTarget === field) setValidationTarget("");
    setFormData((current) =>
      current ? { ...current, [field]: value } : current,
    );
  };

  const getValidationFieldClass = (field: string) =>
    validationTarget === field
      ? "rounded-xl border border-rose-300 bg-rose-50/70 p-1 ring-4 ring-rose-100"
      : "";

  const reportValidationIssue = ({ field, message }: ValidationIssue) => {
    setError(message);
    setValidationTarget(field);

    window.setTimeout(() => {
      const target = document.querySelector<HTMLElement>(
        `[data-validation-field="${field}"]`,
      );
      if (!target) return;

      target.scrollIntoView({ behavior: "smooth", block: "center" });
      const focusTarget = target.querySelector<HTMLElement>(
        "input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])",
      );
      focusTarget?.focus({ preventScroll: true });
    }, 0);
  };

  const handleMemberSelect = (values: number[]) => {
    if (validationTarget === "membre_ids") setValidationTarget("");
    setFormData((current) =>
      current
        ? {
            ...current,
            membre_ids: values.filter((id) =>
              selectedPresidentId ? id !== selectedPresidentId : true,
            ),
          }
        : current,
    );
  };

  const toggleDraftMember = (memberId: number) => {
    setMemberModalError("");
    setDraftMemberIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId],
    );
  };

  const saveMemberModal = () => {
    if (draftMemberIds.length < 3) {
      setMemberModalError(
        "La commission doit contenir au minimum 3 membres présents hors président.",
      );
      return;
    }

    handleMemberSelect(draftMemberIds);
    setMemberModalError("");
    setIsMemberModalOpen(false);
  };

  const handlePresidentChange = (value: string) => {
    if (validationTarget === "president") setValidationTarget("");
    setFormData((current) => {
      if (!current) return current;
      const presidentId = value ? Number(value) : null;

      return {
        ...current,
        president: value,
        membre_ids: presidentId
          ? current.membre_ids.filter((memberId) => memberId !== presidentId)
          : current.membre_ids,
      };
    });

    setDraftMemberIds((current) => {
      const presidentId = value ? Number(value) : null;
      return presidentId
        ? current.filter((memberId) => memberId !== presidentId)
        : current;
    });
  };

  const updateOffreRow = (localId: string, patch: Partial<EditableOffre>) => {
    if (validationTarget.startsWith(`offre-${localId}-`)) {
      setValidationTarget("");
    }
    setFormData((current) =>
      current
        ? {
            ...current,
            offres: current.offres.map((offre) =>
              offre.localId === localId ? { ...offre, ...patch } : offre,
            ),
          }
        : current,
    );
  };

  const setPliState = (offre: EditableOffre, pliExiste: boolean) => {
    updateOffreRow(offre.localId, {
      pli_existe: pliExiste,
      motif_absence_pli: pliExiste ? "" : offre.motif_absence_pli,
      enveloppe_administrative: pliExiste ? offre.enveloppe_administrative : "",
      enveloppe_technique: pliExiste ? offre.enveloppe_technique : "",
      enveloppe_financiere: pliExiste ? offre.enveloppe_financiere : "",
      montant_global: pliExiste ? offre.montant_global : "",
    });
  };

  const addOffreRow = () => {
    setFormData((current) =>
      current
        ? {
            ...current,
            offres: [...current.offres, createEmptyOffre()],
          }
        : current,
    );
  };

  const removeOffreRow = (localId: string) => {
    setFormData((current) => {
      if (!current) return current;
      const nextOffres = current.offres.filter(
        (offre) => offre.localId !== localId,
      );

      return {
        ...current,
        offres: nextOffres.length > 0 ? nextOffres : [createEmptyOffre()],
      };
    });
  };

  const buildPayload = (
    currentForm: DetailFormState,
    nextStatus: SeanceOuverture["statut"],
  ): UpdateSeancePayload => {
    const presidentId = currentForm.president
      ? Number(currentForm.president)
      : null;
    const membreIds = Array.from(
      new Set(
        currentForm.membre_ids.filter((memberId) =>
          presidentId ? memberId !== presidentId : true,
        ),
      ),
    );

    const offres: UpdateSeancePayload["offres"] = currentForm.offres
      .map((offre, index) => ({
        ordre_passage: index + 1,
        nom_soumissionnaire: offre.nom_soumissionnaire.trim(),
        pli_existe: true,
        motif_absence_pli: "",
        date_reception_pli: offre.date_reception_pli || null,
        heure_reception_pli: offre.heure_reception_pli || null,
        enveloppe_administrative: offre.enveloppe_administrative,
        enveloppe_technique: offre.enveloppe_technique,
        enveloppe_financiere: offre.enveloppe_financiere,
        montant_global:
          currentForm.etape_ouverture === "COMPLETE" &&
          offre.montant_global.trim()
            ? offre.montant_global.trim()
            : null,
        observations: offre.observations.trim(),
      }))
      .filter((offre) =>
        Boolean(
          offre.nom_soumissionnaire ||
          offre.date_reception_pli ||
          offre.heure_reception_pli ||
          offre.enveloppe_administrative ||
          offre.enveloppe_technique ||
          offre.enveloppe_financiere ||
          offre.montant_global ||
          offre.observations,
        ),
      );

    const commissionPayload: CommissionMemberPayload[] = commissionMembers.map((m) => ({
      nomPrenom: m.nomPrenom || "",
      email: m.email || "",
      cin: m.cin || "",
      poste: m.poste || "",
      entite: m.entite || "",
    }));

    return {
      reference_dossier: currentForm.reference_dossier.trim(),
      objet_dossier: currentForm.objet_dossier.trim(),
      president: presidentId,
      date_seance: currentForm.date_seance || null,
      heure_seance: currentForm.heure_seance || null,
      lieu: currentForm.lieu.trim(),
      observations: currentForm.observations.trim(),
      etape_ouverture: currentForm.etape_ouverture,
      etat_scelle: currentForm.etat_scelle,
      presence_rature: currentForm.presence_rature,
      description_rature: currentForm.presence_rature
        ? currentForm.description_rature.trim()
        : "",
      document_substitution_present: currentForm.document_substitution_present,
      membre_ids: membreIds,
      commission_members: commissionPayload,
      offres,
      statut: nextStatus,
    };
  };

  const getFirstValidationIssue = (
    currentForm: DetailFormState,
    nextStatus: SeanceOuverture["statut"],
  ): ValidationIssue | null => {
    if (commissionMembers.length < 3) {
      return {
        field: "president",
        message: "La commission doit contenir au moins 3 membres.",
      };
    }

    if (nextStatus === "EN_VALIDATION_MEMBRES" || nextStatus === "A_VALIDER") {
      if (!currentForm.president) {
        return { field: "president", message: "Choisis un président." };
      }
      if (!currentForm.date_seance) {
        return {
          field: "date_seance",
          message: "Renseigne la date de séance.",
        };
      }
      if (!currentForm.heure_seance) {
        return {
          field: "heure_seance",
          message: "Renseigne l'heure de séance.",
        };
      }
      if (!currentForm.lieu.trim()) {
        return { field: "lieu", message: "Renseigne le lieu de séance." };
      }
      if (!currentForm.etat_scelle) {
        return { field: "etat_scelle", message: "Renseigne l'état du scellé." };
      }
      if (
        currentForm.presence_rature &&
        !currentForm.description_rature.trim()
      ) {
        return {
          field: "description_rature",
          message: "Décris la rature ou la manipulation constatée.",
        };
      }
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (currentForm.date_seance && currentForm.date_seance < todayStr) {
      return {
        field: "date_seance",
        message: "La date de séance ne peut pas être antérieure à aujourd'hui.",
      };
    }

    for (const offre of currentForm.offres) {
      const hasPartialData = Boolean(
        offre.nom_soumissionnaire.trim() ||
        offre.date_reception_pli ||
        offre.heure_reception_pli ||
        offre.enveloppe_administrative ||
        offre.enveloppe_technique ||
        offre.enveloppe_financiere ||
        offre.montant_global.trim() ||
        offre.observations.trim(),
      );

      if (hasPartialData && !offre.nom_soumissionnaire.trim()) {
        return {
          field: `offre-${offre.localId}-nom`,
          message: "Renseigne le nom du soumissionnaire.",
        };
      }

      if (
        deadlineDate &&
        offre.date_reception_pli &&
        (offre.date_reception_pli > deadlineDate ||
          (offre.date_reception_pli === deadlineDate &&
            deadlineTime &&
            offre.heure_reception_pli &&
            offre.heure_reception_pli > deadlineTime))
      ) {
        return {
          field: `offre-${offre.localId}-reception`,
          message:
            "La date et l'heure de réception d'un pli doivent être inférieures ou égales à la date limite de dépôt.",
        };
      }
    }

    return null;
  };

  const handleSave = async (nextStatus: SeanceOuverture["statut"]) => {
    if (!formData || !seance || !canEdit) return;

    const validationIssue = getFirstValidationIssue(formData, nextStatus);
    if (validationIssue) {
      reportValidationIssue(validationIssue);
      return;
    }

    try {
      setError("");
      setValidationTarget("");
      setSuccessMessage("");
      setSaveMode(nextStatus === "EN_VALIDATION_MEMBRES" ? "submit" : "draft");

      await updateSeance(seance.id, buildPayload(formData, nextStatus));
      setOpeningFlashMessage(
        nextStatus === "EN_VALIDATION_MEMBRES"
          ? "La séance a été mise à valider avec succès."
          : "Le brouillon a été enregistré avec succès.",
        "/ouverture_offre",
      );
      router.replace("/ouverture_offre");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Enregistrement impossible.",
      );
    } finally {
      setSaveMode(null);
    }
  };

  const handleMemberValidation = async (password: string) => {
    if (!seance || !canValidateAsMember) return;

    try {
      setError("");
      setSaveMode("member");
      await validateMember(seance.id, {
        commentaire: validationComment.trim(),
        password,
      });
      setPendingValidateMode(null);
      setOpeningFlashMessage(
        "Validation membre enregistrée avec succès.",
        "/ouverture_offre",
      );
      router.replace("/ouverture_offre");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Validation membre impossible.",
      );
    } finally {
      setSaveMode(null);
    }
  };

  const handlePresidentValidation = async (password: string) => {
    if (!seance || !canValidateAsPresident) return;

    try {
      setError("");
      setSaveMode("president");
      await validatePresident(seance.id, {
        commentaire: validationComment.trim(),
        password,
      });
      setPendingValidateMode(null);
      setOpeningFlashMessage(
        "Validation président enregistrée avec succès.",
        "/ouverture_offre",
      );
      router.replace("/ouverture_offre");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Validation président impossible.",
      );
    } finally {
      setSaveMode(null);
    }
  };

  const requestReject = (mode: RejectMode) => {
    const canReject =
      mode === "president" ? canRejectAsPresident : canRejectAsMember;

    if (!seance || !canReject) return;
    if (!validationComment.trim()) {
      setError("Une observation est obligatoire pour rejeter cette séance.");
      return;
    }

    setError("");
    setPendingRejectMode(mode);
  };

  const handleMemberReject = async (password: string) => {
    if (!seance || !canRejectAsMember) return;
    if (!validationComment.trim()) {
      setError("Une observation est obligatoire pour rejeter cette séance.");
      return;
    }

    try {
      setError("");
      setPendingRejectMode(null);
      setSaveMode("reject-member");
      await rejectMember(seance.id, {
        commentaire: validationComment.trim(),
        password,
      });
      setOpeningFlashMessage(
        "Rejet membre enregistré avec succès.",
        "/ouverture_offre",
      );
      router.replace("/ouverture_offre");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rejet membre impossible.");
    } finally {
      setSaveMode(null);
    }
  };

  const handlePresidentReject = async (password: string) => {
    if (!seance || !canRejectAsPresident) return;
    if (!validationComment.trim()) {
      setError("Une observation est obligatoire pour rejeter cette séance.");
      return;
    }

    try {
      setError("");
      setPendingRejectMode(null);
      setSaveMode("reject-president");
      await rejectPresident(seance.id, {
        commentaire: validationComment.trim(),
        password,
      });
      setOpeningFlashMessage(
        "Rejet président enregistré avec succès.",
        "/ouverture_offre",
      );
      router.replace("/ouverture_offre");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Rejet président impossible.",
      );
    } finally {
      setSaveMode(null);
    }
  };

  const confirmPendingReject = (password: string) => {
    if (pendingRejectMode === "president") {
      void handlePresidentReject(password);
      return;
    }

    if (pendingRejectMode === "member") {
      void handleMemberReject(password);
    }
  };

  const requestValidate = (mode: "member" | "president") => {
    if (!seance) return;
    setError("");
    setPendingValidateMode(mode);
  };

  const confirmPendingValidate = (password: string) => {
    if (pendingValidateMode === "president") {
      void handlePresidentValidation(password);
      return;
    }

    if (pendingValidateMode === "member") {
      void handleMemberValidation(password);
    }
  };

  const handleDownloadPV = async () => {
    if (!seance) return;

    try {
      setError("");
      await downloadPV(seance.id, seance.reference_dossier);
      setSuccessMessage("Téléchargement du PV lancé avec succès.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de télécharger le PV.",
      );
    }
  };

  if (screenState === "loading") {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800">
        <TopHeader />
        <div className="mx-auto max-w-[1560px] px-4 py-6 sm:px-6 lg:px-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
            Chargement de la séance...
          </div>
        </div>
      </main>
    );
  }

  if (membersIncomplete) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#f6faf8_0%,transparent_25%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] pb-24 text-slate-800 antialiased selection:bg-emerald-200">
        <TopHeader />
        <div className="zoom-content">
          <div className="mx-auto max-w-xl px-4 pt-16 text-center">
            <div className="rounded-3xl border border-rose-100 bg-white p-8 shadow-xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 shadow-md">
                <Users className="h-7 w-7" />
              </div>
              <h2 className="mt-6 text-xl font-black text-slate-900">
                Commission incomplète
              </h2>
              <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                Les membres de la commission pour le dossier{" "}
                <strong className="text-slate-800">
                  {seance?.reference_dossier || "de cette séance"}
                </strong>{" "}
                ne sont pas encore au complet ou enregistrés définitivement.
                <br />
                <span className="mt-2 block font-semibold text-rose-600">
                  Au moins 3 membres complets doivent être enregistrés
                  définitivement avant de pouvoir ouvrir le dossier
                  d&apos;offres.
                </span>
              </p>
              <div className="mt-8 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/ouverture_offre/membres")}
                  className="inline-flex justify-center items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all"
                >
                  <Users className="h-4 w-4" /> Configurer les membres de
                  commission
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/ouverture_offre")}
                  className="inline-flex justify-center items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Retour à la liste
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (screenState === "error" || !seance || !formData) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800">
        <TopHeader />
        <div className="mx-auto max-w-[1560px] px-4 py-6 sm:px-6 lg:px-10">
          <div className="rounded-2xl border border-rose-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-bold text-slate-900">
              Séance indisponible
            </h1>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
            <Link
              href="/ouverture_offre"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#f6faf8_0%,transparent_25%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] pb-8 text-slate-800 antialiased selection:bg-emerald-200">
      <TopHeader />

      <div className="zoom-content mx-auto mt-2 max-w-[1880px] px-2 pb-6 sm:px-3 lg:px-4">
        <div
          className={`group relative flex w-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_24px_rgb(0,0,0,0.035)] md:flex-row md:items-center ${
            canEdit ? "mb-3 gap-3 p-3" : "mb-2 gap-2 p-3"
          }`}
        >
          <div className="absolute right-0 top-0 -z-10 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 opacity-50 blur-3xl transition-transform duration-700 group-hover:scale-110" />
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className={`flex rotate-3 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 group-hover:rotate-6 ${
                  canEdit ? "h-9 w-9" : "h-8 w-8"
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
              </div>
              {canEdit && (
                <Sparkles className="absolute -right-1 -top-1 h-3 w-3 text-amber-400" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  {pageModeLabel}
                </span>
                <span
                  className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${statusClassMap[seance.statut]}`}
                >
                  {statusLabelMap[seance.statut]}
                </span>
                {!canEdit && (
                  <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                    <Lock className="h-3 w-3" />
                    Lecture seule
                  </span>
                )}
              </div>
              <h1
                className={`mt-0.5 font-black tracking-tight text-slate-800 ${canEdit ? "text-lg" : "text-base"}`}
              >
                {formData.reference_dossier || "Ouverture des offres"}
              </h1>
              <p
                className={`font-semibold text-slate-500 ${canEdit ? "text-[12px]" : "text-[11px]"}`}
              >
                {formData.objet_dossier || "Objet du DAO à renseigner"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {seance.pv_document && (
              <button
                type="button"
                onClick={() => void handleDownloadPV()}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                <FileText className="h-4 w-4" />
                Télécharger le PV PDF
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsCommissionModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <Users className="h-4 w-4 text-emerald-500" />
              Voir les membres de la commission
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={() => router.push(`/ouverture_offre/membres?dossier=${encodeURIComponent(seance.reference_dossier)}`)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
              >
                <Users className="h-4 w-4 text-sky-500" />
                Gérer les membres
              </button>
            )}
            <Link
              href="/ouverture_offre"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Annuler
            </Link>
          </div>
        </div>

        <div className={canEdit ? "space-y-3" : "space-y-2"}>
          {canEdit ? (
            <>
              <section className="group relative overflow-hidden rounded-2xl border border-white/40 bg-white/70 shadow-[0_6px_24px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all duration-500 hover:shadow-[0_10px_36px_rgba(0,0,0,0.06)]">
                <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 bg-[length:200%_100%] animate-gradient" />
                <div className="p-3">
                  <h2 className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-800">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100/80 text-emerald-600 shadow-sm backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                      <FileText className="h-4 w-4" />
                    </div>
                    1. En-tête de la séance
                  </h2>

                  <div className="grid gap-2 lg:grid-cols-12">
                    <label className="grid gap-1 lg:col-span-3">
                      <span className={labelClass}>Référence</span>
                      <input
                        value={formData.reference_dossier}
                        disabled
                        className={compactInputClass}
                      />
                    </label>

                    <label className="grid gap-1 lg:col-span-5">
                      <span className={labelClass}>Intitulé</span>
                      <input
                        value={formData.objet_dossier}
                        disabled
                        className={compactInputClass}
                      />
                    </label>

                    <label className="grid gap-1 lg:col-span-4">
                      <span className={labelClass}>Type de procédure</span>
                      <input
                        value={
                          linkedMarket?.procedure_type
                            ? procedureLabels[linkedMarket.procedure_type]
                            : "Non renseigné dans le DAO"
                        }
                        disabled
                        className={compactInputClass}
                      />
                    </label>

                    <label className="grid gap-1 lg:col-span-4">
                      <span className={labelClass}>Date limite de dépôt</span>
                      <input
                        value={formatDateTime(linkedMarket?.deadline)}
                        disabled
                        className={compactInputClass}
                      />
                    </label>

                    <label className="grid gap-1 lg:col-span-4">
                      <span className={labelClass}>Étape</span>
                      <select
                        value={formData.etape_ouverture}
                        onChange={(event) =>
                          setField(
                            "etape_ouverture",
                            event.target
                              .value as DetailFormState["etape_ouverture"],
                          )
                        }
                        disabled={!canEdit}
                        className={compactSelectClass}
                      >
                        <option value="COMPLETE">Ouverture complète</option>
                        <option value="ADMIN_TECH">
                          Administrative et technique
                        </option>
                      </select>
                    </label>

                    <label
                      data-validation-field="date_seance"
                      className={`grid gap-1 lg:col-span-3 ${getValidationFieldClass("date_seance")}`}
                    >
                      <span className={labelClass}>Date ouverture</span>
                      <input
                        type="date"
                        value={formData.date_seance}
                        onChange={(event) =>
                          setField("date_seance", event.target.value)
                        }
                        disabled={!canEdit}
                        min={new Date().toISOString().slice(0, 10)}
                        className={compactInputClass}
                      />
                    </label>

                    <label
                      data-validation-field="heure_seance"
                      className={`grid gap-1 lg:col-span-2 ${getValidationFieldClass("heure_seance")}`}
                    >
                      <span className={labelClass}>Heure</span>
                      <input
                        type="time"
                        value={formData.heure_seance}
                        onChange={(event) =>
                          setField("heure_seance", event.target.value)
                        }
                        disabled={!canEdit}
                        className={compactInputClass}
                      />
                    </label>

                    <label
                      data-validation-field="lieu"
                      className={`grid gap-1 lg:col-span-7 ${getValidationFieldClass("lieu")}`}
                    >
                      <span className={labelClass}>Lieu</span>
                      <input
                        value={formData.lieu}
                        onChange={(event) =>
                          setField("lieu", event.target.value)
                        }
                        disabled={!canEdit}
                        placeholder="Ex. Salle 3, UCP"
                        className={compactInputClass}
                      />
                    </label>

                    <label
                      data-validation-field="president"
                      className={`grid gap-1 lg:col-span-4 ${getValidationFieldClass("president")}`}
                    >
                      <span className={labelClass}>Président</span>
                      <select
                        value={formData.president}
                        onChange={(event) =>
                          handlePresidentChange(event.target.value)
                        }
                        disabled={!canEdit}
                        className={compactSelectClass}
                      >
                        <option value="" disabled>
                          Choisir un président
                        </option>
                        {availableUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {getUserLabel(user)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              </section>

              <section className="group relative overflow-hidden rounded-2xl border border-white/40 bg-white/70 shadow-[0_6px_24px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all duration-500 hover:shadow-[0_10px_36px_rgba(0,0,0,0.06)]">
                <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-emerald-500 via-sky-400 to-emerald-500 bg-[length:200%_100%] animate-gradient" />
                <div className="p-3">
                  <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-800">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100/80 text-emerald-600 shadow-sm backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                      <ListPlus className="h-4 w-4" />
                    </div>
                    2. Soumissionnaires et offres reçues
                  </h2>
                </div>

                {!showMontantColumn && (
                  <div className="border-b border-sky-100 bg-sky-50/80 px-4 py-2 text-sm font-semibold text-sky-800">
                    Aucun montant à saisir pour une ouverture administrative et
                    technique.
                  </div>
                )}

                <div className="overflow-x-auto 2xl:overflow-visible">
                  <table className="w-full table-auto text-left">
                    <thead className="bg-white">
                      <tr className="border-b border-slate-200 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        <th className="w-10 px-3 py-3">#</th>
                        <th className="w-40 px-2 py-3">Soumissionnaire</th>
                        <th className="w-64 px-2 py-3">
                          Date & Heure de réception
                        </th>
                        <th className="w-28 px-2 py-3">
                          Enveloppe administrative
                        </th>
                        <th className="w-28 px-2 py-3">Enveloppe technique</th>
                        <th className="w-28 px-2 py-3">Enveloppe financière</th>
                        {showMontantColumn && (
                          <th className="w-28 px-2 py-3">Montant</th>
                        )}
                        <th className="w-56 px-2 py-3">Observation</th>
                        <th className="w-14 px-2 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.offres.map((offre, index) => {
                        const disableOfferFields = !canEdit;

                        return (
                          <tr
                            key={offre.localId}
                            className="border-b align-top text-sm text-slate-700 last:border-b-0 border-slate-100"
                          >
                            <td className="px-3 py-3">
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                                {index + 1}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <div
                                data-validation-field={`offre-${offre.localId}-nom`}
                                className={getValidationFieldClass(
                                  `offre-${offre.localId}-nom`,
                                )}
                              >
                                <input
                                  value={offre.nom_soumissionnaire}
                                  onChange={(event) =>
                                    updateOffreRow(offre.localId, {
                                      nom_soumissionnaire: event.target.value,
                                    })
                                  }
                                  disabled={!canEdit}
                                  placeholder="Entreprise"
                                  className={`${inputClass} w-full`}
                                />
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <div className="grid w-full gap-2">
                                <div
                                  data-validation-field={`offre-${offre.localId}-reception`}
                                  className={`grid grid-cols-[minmax(170px,1fr)_112px] gap-2 ${getValidationFieldClass(`offre-${offre.localId}-reception`)}`}
                                >
                                  <input
                                    type="date"
                                    value={offre.date_reception_pli}
                                    onChange={(event) =>
                                      updateOffreRow(offre.localId, {
                                        date_reception_pli: event.target.value,
                                      })
                                    }
                                    disabled={disableOfferFields}
                                    max={deadlineDate || undefined}
                                    className={`${inputClass} px-2 text-[12px]`}
                                  />
                                  <input
                                    type="time"
                                    value={offre.heure_reception_pli}
                                    onChange={(event) =>
                                      updateOffreRow(offre.localId, {
                                        heure_reception_pli: event.target.value,
                                      })
                                    }
                                    disabled={disableOfferFields}
                                    max={
                                      deadlineDate &&
                                      offre.date_reception_pli === deadlineDate
                                        ? deadlineTime || undefined
                                        : undefined
                                    }
                                    className={`${inputClass} px-2 text-[12px]`}
                                  />
                                </div>
                              </div>
                            </td>
                            <EnvelopeCell
                              value={offre.enveloppe_administrative}
                              disabled={disableOfferFields}
                              options={[
                                { value: "RECU", label: "Reçu" },
                                { value: "INTEGRE", label: "Intègre" },
                                { value: "MANQUANT", label: "Manquant" },
                              ]}
                              onChange={(value) =>
                                updateOffreRow(offre.localId, {
                                  enveloppe_administrative: value,
                                })
                              }
                            />
                            <EnvelopeCell
                              value={offre.enveloppe_technique}
                              disabled={disableOfferFields}
                              options={[
                                { value: "RECU", label: "Reçu" },
                                { value: "MANQUANTE", label: "Manquante" },
                              ]}
                              onChange={(value) =>
                                updateOffreRow(offre.localId, {
                                  enveloppe_technique: value,
                                })
                              }
                            />
                            <EnvelopeCell
                              value={offre.enveloppe_financiere}
                              disabled={disableOfferFields}
                              options={[
                                { value: "RECU", label: "Reçu" },
                                { value: "INTEGRE", label: "Intègre" },
                                { value: "MANQUANTE", label: "Manquante" },
                              ]}
                              onChange={(value) =>
                                updateOffreRow(offre.localId, {
                                  enveloppe_financiere: value,
                                })
                              }
                            />
                            {showMontantColumn && (
                              <td className="px-3 py-3">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={offre.montant_global}
                                  onChange={(event) =>
                                    updateOffreRow(offre.localId, {
                                      montant_global: event.target.value,
                                    })
                                  }
                                  disabled={disableOfferFields}
                                  placeholder="0"
                                  className={`${inputClass} w-full`}
                                />
                              </td>
                            )}
                            <td className="px-3 py-3">
                              <input
                                value={offre.observations}
                                onChange={(event) =>
                                  updateOffreRow(offre.localId, {
                                    observations: event.target.value,
                                  })
                                }
                                disabled={!canEdit}
                                placeholder="RAS"
                                className={`${inputClass} w-full`}
                              />
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  title="Retirer"
                                  onClick={() => removeOffreRow(offre.localId)}
                                  disabled={!canEdit}
                                  className="rounded-lg border border-rose-200 bg-white p-2 text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end border-t border-slate-100 bg-white/60 px-4 py-3">
                  <button
                    type="button"
                    onClick={addOffreRow}
                    disabled={!canEdit}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    <ListPlus className="h-4 w-4" />
                    Ajouter soumissionnaire
                  </button>
                </div>
              </section>

              <section className="group relative overflow-hidden rounded-2xl border border-white/40 bg-white/70 shadow-[0_6px_24px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all duration-500 hover:shadow-[0_10px_36px_rgba(0,0,0,0.06)]">
                <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-emerald-500 via-amber-300 to-emerald-500 bg-[length:200%_100%] animate-gradient" />
                <div className="p-3">
                  <h2 className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-800">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100/80 text-emerald-600 shadow-sm backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    3. Scellés et incidents
                  </h2>

                  <div className="grid gap-2 lg:grid-cols-12">
                    <label
                      data-validation-field="etat_scelle"
                      className={`grid gap-1 lg:col-span-4 ${getValidationFieldClass("etat_scelle")}`}
                    >
                      <span className={labelClass}>État du scellé</span>
                      <select
                        value={formData.etat_scelle}
                        onChange={(event) =>
                          setField(
                            "etat_scelle",
                            event.target
                              .value as DetailFormState["etat_scelle"],
                          )
                        }
                        disabled={!canEdit}
                        className={compactSelectClass}
                      >
                        <option value="" disabled>
                          Choisir
                        </option>
                        <option value="INTACT">Intact</option>
                        <option value="ALTERE">Altéré</option>
                        <option value="ABSENT">Absent</option>
                      </select>
                    </label>

                    <div className="grid gap-1 lg:col-span-4">
                      <span className={labelClass}>Rature / surcharge</span>
                      <BinaryChoice
                        trueLabel="Oui"
                        falseLabel="Non"
                        checked={formData.presence_rature}
                        disabled={!canEdit}
                        trueTone="danger"
                        onChange={(checked) =>
                          setField("presence_rature", checked)
                        }
                      />
                    </div>

                    <div className="grid gap-1 lg:col-span-4">
                      <span className={labelClass}>
                        Document de substitution
                      </span>
                      <BinaryChoice
                        trueLabel="Oui"
                        falseLabel="Non"
                        checked={formData.document_substitution_present}
                        disabled={!canEdit}
                        onChange={(checked) =>
                          setField("document_substitution_present", checked)
                        }
                      />
                    </div>

                    {formData.presence_rature && (
                      <label
                        data-validation-field="description_rature"
                        className={`grid gap-1 lg:col-span-12 ${getValidationFieldClass("description_rature")}`}
                      >
                        <span className={labelClass}>Description rature</span>
                        <textarea
                          rows={3}
                          value={formData.description_rature}
                          onChange={(event) =>
                            setField("description_rature", event.target.value)
                          }
                          disabled={!canEdit}
                          className={`${compactTextareaClass} w-full border-rose-200 bg-gradient-to-br from-rose-50/80 to-amber-50/50 text-rose-950 placeholder:text-rose-300 focus:border-rose-300 focus:ring-rose-50`}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </section>

              {canEdit && (
                <section className="flex flex-col gap-2 rounded-2xl border border-white/40 bg-white/80 p-2.5 shadow-[0_6px_24px_rgba(0,0,0,0.04)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={() => void handleSave("BROUILLON")}
                    disabled={!!saveMode}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {saveMode === "draft"
                      ? "Enregistrement..."
                      : "Enregistrer brouillon"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSave("EN_VALIDATION_MEMBRES")}
                    disabled={!!saveMode}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <SendHorizontal className="h-4 w-4" />
                    {saveMode === "submit"
                      ? "Transmission..."
                      : "Mettre à valider"}
                  </button>
                </section>
              )}

              {canTakeDecision && (
                <section className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.05)] backdrop-blur-md transition-all duration-500 hover:shadow-[0_12px_48px_rgba(0,0,0,0.08)]">
                  <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 bg-[length:200%_100%] animate-gradient" />
                  <div className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
                    <div>
                      <h2 className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-800">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-600 shadow-sm backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        4. Décision
                      </h2>
                      {presidentValidationBlocked && (
                        <p className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                          La validation finale sera disponible après validation
                          de tous les membres présents.
                        </p>
                      )}
                      <textarea
                        value={validationComment}
                        onChange={(event) =>
                          setValidationComment(event.target.value)
                        }
                        rows={3}
                        placeholder="Observation obligatoire pour un rejet, facultative pour une validation."
                        className={`${textareaClass} w-full`}
                      />
                    </div>

                    <div className="flex flex-col gap-3 lg:justify-end">
                      {(canRejectAsMember || canRejectAsPresident) && (
                        <button
                          type="button"
                          onClick={() =>
                            requestReject(
                              canRejectAsPresident ? "president" : "member",
                            )
                          }
                          disabled={!!saveMode}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 transition-all hover:-translate-y-0.5 hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                        >
                          <X className="h-4 w-4" />
                          {saveMode === "reject-member" ||
                          saveMode === "reject-president"
                            ? "Rejet..."
                            : "Rejeter"}
                        </button>
                      )}
                      {(canValidateAsMember || canValidateAsPresident) && (
                        <button
                          type="button"
                          onClick={() =>
                            requestValidate(
                              canValidateAsPresident ? "president" : "member",
                            )
                          }
                          disabled={!!saveMode}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {saveMode === "member" || saveMode === "president"
                            ? "Validation..."
                            : "Valider"}
                        </button>
                      )}
                    </div>
                  </div>
                </section>
              )}
            </>
          ) : (
            <>
              {seance.pv_document && (
                <section className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.03)] backdrop-blur-md">
                  <div className="absolute right-0 top-0 -z-10 h-32 w-32 rounded-full bg-emerald-100 opacity-60 blur-2xl" />
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-sm font-black text-slate-900">
                          PROCÈS-VERBAL CLÔTURÉ ET SÉCURISÉ
                        </h2>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Version {seance.pv_document.version} • Signatures
                          numériques validées • Empreinte SHA-256 de contrôle :
                        </p>
                        <code className="mt-1.5 block max-w-full overflow-x-auto rounded bg-slate-100 px-2 py-1 text-[10px] font-mono text-slate-700 select-all">
                          {seance.pv_document.hash_document}
                        </code>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDownloadPV()}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 cursor-pointer"
                    >
                      <FileText className="h-4 w-4" />
                      Télécharger le PV
                    </button>
                  </div>
                </section>
              )}

              <section className="rounded-3xl border border-white/40 bg-white/75 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.05)] backdrop-blur-md">
                <SeanceOverviewDetails
                  seance={seance}
                  market={linkedMarket}
                  members={overviewCommissionMembers}
                  presidentLabel={
                    selectedPresident ? getUserLabel(selectedPresident) : ""
                  }
                  compact
                />
              </section>

              <section className="rounded-3xl border border-white/40 bg-white/80 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.05)] backdrop-blur-md">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-black text-slate-900">
                      Validation
                    </h2>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {canTakeDecision ? (
                    <>
                      <label className="grid gap-2">
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                          Observation
                        </span>
                        <textarea
                          value={validationComment}
                          onChange={(event) =>
                            setValidationComment(event.target.value)
                          }
                          rows={3}
                          placeholder="Observation obligatoire pour un rejet, facultative pour une validation."
                          className={`${textareaClass} w-full`}
                        />
                      </label>
                      {presidentValidationBlocked && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                          La validation finale sera disponible après validation
                          de tous les membres présents.
                        </div>
                      )}
                      <div className="flex flex-wrap justify-end gap-3">
                        {(canRejectAsMember || canRejectAsPresident) && (
                          <button
                            type="button"
                            onClick={() =>
                              requestReject(
                                canRejectAsPresident ? "president" : "member",
                              )
                            }
                            disabled={!!saveMode}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 transition-all hover:-translate-y-0.5 hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                          >
                            <X className="h-4 w-4" />
                            {saveMode === "reject-member" ||
                            saveMode === "reject-president"
                              ? "Rejet..."
                              : "Rejeter"}
                          </button>
                        )}
                        {(canValidateAsMember || canValidateAsPresident) && (
                          <button
                            type="button"
                            onClick={() =>
                              requestValidate(
                                canValidateAsPresident ? "president" : "member",
                              )
                            }
                            disabled={!!saveMode}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            {saveMode === "member" || saveMode === "president"
                              ? "Validation..."
                              : "Valider la séance"}
                          </button>
                        )}
                      </div>
                    </>
                  ) : hasProcessedByCurrentUser ? (
                    <div
                      className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                        hasRejectedAsMember || hasRejectedAsPresident
                          ? "border-rose-200 bg-rose-50 text-rose-800"
                          : "border-emerald-200 bg-emerald-50 text-emerald-800"
                      }`}
                    >
                      {hasRejectedAsMember || hasRejectedAsPresident
                        ? "Rejet déjà enregistré."
                        : "Validation déjà enregistrée."}
                    </div>
                  ) : isAbsentMemberViewer ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                      Aucune action requise.
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                      Consultation uniquement.
                    </div>
                  )}

                  {(hasValidatedAsMember || hasRejectedAsMember) &&
                    currentMember?.commentaire && (
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {hasRejectedAsMember
                            ? "Votre motif enregistré"
                            : "Votre observation enregistrée"}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-slate-700">
                          {currentMember.commentaire}
                        </p>
                      </div>
                    )}

                  {(hasValidatedAsPresident || hasRejectedAsPresident) &&
                    seance.president_commentaire && (
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {hasRejectedAsPresident
                            ? "Motif final enregistré"
                            : "Observation finale enregistrée"}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-slate-700">
                          {seance.president_commentaire}
                        </p>
                      </div>
                    )}
                </div>
              </section>
            </>
          )}
        </div>

        {isMemberModalOpen && (
          <MemberSelectionModal
            users={modalMemberOptions}
            selectedIds={draftMemberIds}
            selectedPresidentLabel={
              selectedPresident ? getUserLabel(selectedPresident) : ""
            }
            search={memberSearch}
            error={memberModalError}
            onSearchChange={setMemberSearch}
            onToggle={toggleDraftMember}
            onClose={() => setIsMemberModalOpen(false)}
            onSave={saveMemberModal}
          />
        )}

        {isCommissionModalOpen && (
          <CommissionMembersModal
            members={commissionMembers}
            reference={seance.reference_dossier}
            onClose={() => setIsCommissionModalOpen(false)}
          />
        )}

        {pendingRejectMode && (
          <RejectConfirmModal
            roleLabel={
              pendingRejectMode === "president"
                ? "président de séance"
                : "membre de commission"
            }
            reference={seance.reference_dossier}
            observation={validationComment.trim()}
            loading={
              saveMode === "reject-member" || saveMode === "reject-president"
            }
            onCancel={() => setPendingRejectMode(null)}
            onConfirm={confirmPendingReject}
          />
        )}

        {pendingValidateMode && (
          <ValidationConfirmModal
            roleLabel={
              pendingValidateMode === "president"
                ? "président de séance"
                : "membre de commission"
            }
            reference={seance.reference_dossier}
            loading={saveMode === "member" || saveMode === "president"}
            onCancel={() => setPendingValidateMode(null)}
            onConfirm={confirmPendingValidate}
          />
        )}

        {error && (
          <NotificationPopup
            type="error"
            message={error}
            onClose={() => setError("")}
          />
        )}
        {successMessage && (
          <NotificationPopup
            type="success"
            message={successMessage}
            onClose={() => setSuccessMessage("")}
          />
        )}
      </div>
    </main>
  );
}

function CommissionMembersModal({
  members,
  reference,
  onClose,
}: {
  members: CommissionMember[];
  reference: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/45 px-4 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="commission-members-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
              Commission
            </p>
            <h2
              id="commission-members-title"
              className="mt-1 text-lg font-black text-slate-950"
            >
              Membres de la commission
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {reference || "Séance d'ouverture"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-auto p-6">
          {members.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <Users className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-600">
                Aucun membre configuré pour cette commission.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full table-auto text-left">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    <th className="w-14 px-4 py-3">#</th>
                    <th className="px-4 py-3">Nom & prénom</th>
                    <th className="px-4 py-3">N° carte</th>
                    <th className="px-4 py-3">Intitulé</th>
                    <th className="px-4 py-3">Poste</th>
                    <th className="px-4 py-3">Validation</th>
                    <th className="px-4 py-3">Commentaire</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member, index) => (
                    <tr
                      key={`${member.email || member.nomPrenom || "member"}-${index}`}
                      className="border-b border-slate-100 text-sm font-semibold text-slate-700 last:border-b-0"
                    >
                      <td className="px-4 py-3 text-xs font-black text-slate-400">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 font-black text-slate-900">
                        <p>{member.nomPrenom || "Nom non renseigné"}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {member.email || "-"}
                        </p>
                      </td>
                      <td className="px-4 py-3">{member.cin || "-"}</td>
                      <td className="px-4 py-3">{member.entite || "-"}</td>
                      <td className="px-4 py-3">
                        {member.poste ? (
                          <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                            {member.poste}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${
                            member.decision === "VALIDEE"
                              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                              : member.decision === "REJETEE"
                                ? "border-rose-100 bg-rose-50 text-rose-700"
                                : "border-amber-100 bg-amber-50 text-amber-700"
                          }`}
                        >
                          {getCommissionDecisionLabel(member.decision)}
                        </span>
                        <p className="mt-1.5 text-xs font-semibold text-slate-500">
                          {formatValidationDateTime(member.dateValidation)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {member.commentaire?.trim() || "Aucun commentaire"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RejectConfirmModal({
  roleLabel,
  reference,
  observation,
  loading,
  onCancel,
  onConfirm,
}: {
  roleLabel: string;
  reference: string;
  observation: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: (password: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Le mot de passe est obligatoire pour rejeter la séance.");
      return;
    }
    setError("");
    onConfirm(password);
  };

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-confirm-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onCancel();
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-2xl ring-1 ring-black/5 animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3 border-b border-rose-100 bg-gradient-to-br from-rose-50 to-white px-5 py-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-500">
              Confirmation requise
            </p>
            <h2
              id="reject-confirm-title"
              className="mt-1 text-base font-black text-slate-950"
            >
              Rejeter cette séance ?
            </h2>
            <p className="mt-1 text-sm font-medium leading-relaxed text-slate-600">
              Cette action sera enregistrée pour votre rôle de {roleLabel}.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-3 px-5 py-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Dossier
              </p>
              <p className="mt-1 text-sm font-black text-slate-900">
                {reference || "Séance d'ouverture"}
              </p>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-rose-50/70 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">
                Motif qui sera envoyé
              </p>
              <p className="mt-2 max-h-28 overflow-auto text-sm leading-relaxed text-rose-950">
                {observation}
              </p>
            </div>

            <label className="grid gap-1.5">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                Confirmez votre mot de passe pour rejeter
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 text-sm font-semibold outline-none transition-all placeholder:text-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                disabled={loading}
                autoFocus
              />
            </label>
            {error && (
              <p className="text-[11px] font-semibold text-rose-600">{error}</p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-black text-white shadow-lg shadow-rose-500/20 transition-all hover:-translate-y-0.5 hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              <AlertCircle className="h-4 w-4" />
              {loading ? "Rejet en cours..." : "Oui, rejeter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ValidationConfirmModal({
  roleLabel,
  reference,
  loading,
  onCancel,
  onConfirm,
}: {
  roleLabel: string;
  reference: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: (password: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Le mot de passe est obligatoire pour signer la séance.");
      return;
    }
    setError("");
    onConfirm(password);
  };

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="validation-confirm-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onCancel();
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-2xl ring-1 ring-black/5 animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3 border-b border-emerald-100 bg-gradient-to-br from-emerald-50 to-white px-5 py-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
              Signature de la séance
            </p>
            <h2
              id="validation-confirm-title"
              className="mt-1 text-base font-black text-slate-950"
            >
              Valider cette séance ?
            </h2>
            <p className="mt-1 text-sm font-medium leading-relaxed text-slate-600">
              Cette validation vaut signature officielle pour votre rôle de{" "}
              {roleLabel}.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-3 px-5 py-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Dossier
              </p>
              <p className="mt-1 text-sm font-black text-slate-900">
                {reference || "Séance d'ouverture"}
              </p>
            </div>

            <label className="grid gap-1.5">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                Saisissez votre mot de passe pour confirmer
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 text-sm font-semibold outline-none transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                disabled={loading}
                autoFocus
              />
            </label>
            {error && (
              <p className="text-[11px] font-semibold text-rose-600">{error}</p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              <CheckCircle2 className="h-4 w-4" />
              {loading ? "Signature..." : "Oui, valider"}
            </button>
          </div>
        </form>
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
      className={`fixed bottom-6 right-6 z-[90] flex w-[min(92vw,31rem)] items-start gap-4 rounded-[22px] border px-5 py-4 shadow-[0_24px_70px_rgba(15,23,42,0.28)] ${
        isError
          ? "border-rose-300 bg-[linear-gradient(135deg,#be123c_0%,#e11d48_100%)] text-white"
          : "border-emerald-300 bg-[linear-gradient(135deg,#047857_0%,#10b981_100%)] text-white"
      }`}
      role="status"
    >
      <div
        className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
          isError
            ? "border-rose-200/30 bg-white/12 text-white"
            : "border-emerald-200/30 bg-white/12 text-white"
        }`}
      >
        {isError ? (
          <AlertCircle className="h-5 w-5" />
        ) : (
          <CheckCircle2 className="h-5 w-5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-black tracking-tight text-white">
          {isError ? "Informations à compléter" : "Action enregistrée"}
        </p>
        <p className="mt-1 text-[14px] font-medium leading-relaxed text-white/92">
          {message}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-xl p-2 text-white/80 transition-colors hover:bg-white/12 hover:text-white"
        aria-label="Fermer la notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

type EnvelopeOption = { value: EnvelopeState; label: string };

function EnvelopeCell({
  value,
  disabled,
  options,
  onChange,
}: {
  value: EnvelopeState;
  disabled: boolean;
  options: EnvelopeOption[];
  onChange: (value: EnvelopeState) => void;
}) {
  return (
    <td className="px-3 py-3">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as EnvelopeState)}
        disabled={disabled}
        className={`${selectClass} w-full`}
      >
        <option value="" disabled>
          Choisir
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </td>
  );
}

function BinaryChoice({
  trueLabel,
  falseLabel,
  checked,
  disabled,
  trueTone = "neutral",
  falseTone = "neutral",
  onChange,
}: {
  trueLabel: string;
  falseLabel: string;
  checked: boolean;
  disabled: boolean;
  trueTone?: "neutral" | "danger";
  falseTone?: "neutral" | "danger";
  onChange: (checked: boolean) => void;
}) {
  const getButtonClass = (active: boolean, tone: "neutral" | "danger") => {
    if (!active) {
      return "border-transparent bg-transparent text-slate-500 hover:bg-white/70";
    }

    if (tone === "danger") {
      return "border-rose-200 bg-rose-50 text-rose-700 shadow-sm";
    }

    return "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm";
  };

  return (
    <div className="grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-50/80 p-1">
      <button
        type="button"
        onClick={() => onChange(true)}
        disabled={disabled}
        className={`h-9 rounded-lg border px-3 text-[12px] font-black transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${getButtonClass(
          checked,
          trueTone,
        )}`}
      >
        {trueLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        disabled={disabled}
        className={`h-9 rounded-lg border px-3 text-[12px] font-black transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${getButtonClass(
          !checked,
          falseTone,
        )}`}
      >
        {falseLabel}
      </button>
    </div>
  );
}

function MemberSelectionModal({
  users,
  selectedIds,
  selectedPresidentLabel,
  search,
  error,
  onSearchChange,
  onToggle,
  onClose,
  onSave,
}: {
  users: OuvertureUser[];
  selectedIds: number[];
  selectedPresidentLabel: string;
  search: string;
  error: string;
  onSearchChange: (value: string) => void;
  onToggle: (userId: number) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/35 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Ajouter les membres hors président
            </h2>
            <p className="mt-1 max-w-xl text-xs font-semibold text-slate-500">
              Le président est géré séparément. Ici, sélectionne les membres
              présents qui valideront la séance avant lui.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {selectedPresidentLabel && (
            <div className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                Président sélectionné :{" "}
                <strong className="font-black">{selectedPresidentLabel}</strong>
                . Il n’apparaît pas dans cette liste pour éviter le double rôle.
              </span>
            </div>
          )}

          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Rechercher par nom, email ou username..."
              className={`${inputClass} w-full pl-10`}
              autoFocus
            />
          </label>

          {error && (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-4 max-h-[380px] space-y-2 overflow-y-auto pr-1">
            {users.length > 0 ? (
              users.map((user) => {
                const isSelected = selectedIds.includes(user.id);

                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => onToggle(user.id)}
                    className={`flex w-full items-center justify-between gap-4 rounded-2xl border p-3 text-left transition-colors ${
                      isSelected
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900">
                        {getUserLabel(user)}
                      </p>
                      <p className="truncate text-xs font-semibold text-slate-500">
                        {user.email || user.username}
                      </p>
                    </div>
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${
                        isSelected
                          ? "border-emerald-300 bg-emerald-600 text-white"
                          : "border-slate-300 bg-white text-transparent"
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
                Aucun utilisateur trouvé.
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onSave}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-700"
          >
            Enregistrer la sélection
          </button>
        </div>
      </div>
    </div>
  );
}
