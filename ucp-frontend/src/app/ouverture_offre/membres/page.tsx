"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ElementType,
} from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  Eye,
  Lock,
  ArrowLeft,
  Briefcase,
  UserCheck,
  UserX,
  ShieldAlert,
  ChevronDown,
} from "lucide-react";

import TopHeader from "@/app/components/TopHeader";
import { fetchCurrentUser, getToken, isSecretaireUser } from "@/services/auth";
import { getSeances } from "@/services/ouvertureOffre";
import { listMarkets } from "@/services/procurement";
import type { SeanceOuverture } from "@/types/ouvertureOffre";
import type { ProcurementMarket } from "@/types/procurement";

// Ces clés gardent la commission côté navigateur tant que le backend n'a pas encore son écran dédié.
const STORAGE_PREFIX = "ucp_commission_membres_";
const STATUS_PREFIX = "ucp_commission_membres_status_";

interface ManualMember {
  id: string;
  nomPrenom: string;
  email: string;
  cin: string;
  poste: string;
  entite: string;
}

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

const getEmailTypoSuggestion = (email: string) => {
  const value = email.trim();
  const parts = value.split("@");
  if (parts.length !== 2) return "";

  const [localPart, domain] = parts;
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

  if (!suggestedDomain || suggestedDomain.toLowerCase() === normalizedDomain) {
    return "";
  }

  return `${localPart}@${suggestedDomain}`;
};

const getStoredCompleteMemberCount = (reference: string) => {
  if (typeof window === "undefined") return 0;

  const stored = window.localStorage.getItem(`${STORAGE_PREFIX}${reference}`);
  if (!stored) return 0;

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return 0;

    return parsed.filter((member) => {
      if (typeof member !== "object" || member === null) return false;
      const item = member as Record<string, unknown>;
      const hasRequiredFields = ["nomPrenom", "email", "poste", "entite"].every(
        (field) => {
          const value = item[field];
          return typeof value === "string" && value.trim() !== "";
        },
      );
      const hasValidCin =
        typeof item.cin === "string" && /^\d{12}$/.test(item.cin.trim());
      const email = typeof item.email === "string" ? item.email.trim() : "";

      return hasRequiredFields && hasValidCin && !getEmailTypoSuggestion(email);
    }).length;
  } catch {
    return 0;
  }
};

const mapSeanceMembersToManualMembers = (
  seance: SeanceOuverture,
): ManualMember[] =>
  seance.membres.map((member) => ({
    id: `membre-${member.id}`,
    nomPrenom:
      member.nom_prenom?.trim() ||
      member.utilisateur_detail.full_name?.trim() ||
      member.utilisateur_detail.username ||
      "",
    email: member.utilisateur_detail.email || "",
    cin: member.numero_carte || "",
    poste: member.poste || "",
    entite: member.intitule || "",
  }));

type ScreenState = "loading" | "ready" | "forbidden" | "error";

interface GroupedSection {
  key: "none" | "draft" | "final";
  title: string;
  subtitle: string;
  icon: ElementType;
  iconClass: string;
  badgeClass: string;
  emptyText: string;
  rows: Array<{
    market: ProcurementMarket;
    seance: SeanceOuverture | null;
    isLocked: boolean;
    statusText: string;
    membersStatus: "draft" | "final" | "none";
  }>;
}

export default function MembresCommissionsPage() {
  const router = useRouter();
  const [markets, setMarkets] = useState<ProcurementMarket[]>([]);
  const [seances, setSeances] = useState<SeanceOuverture[]>([]);
  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [error, setError] = useState("");

  // Recherche + panneaux: on garde les dossiers rangés en trois familles faciles à lire.
  const [searchQuery, setSearchQuery] = useState("");
  const [activePanels, setActivePanels] = useState<Record<string, boolean>>({
    none: false,
    draft: false,
    final: false,
  });

  // Etat du popup de saisie des membres.
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] =
    useState<ProcurementMarket | null>(null);
  const [selectedSeance, setSelectedSeance] = useState<SeanceOuverture | null>(null);
  const [modalMembers, setModalMembers] = useState<ManualMember[]>([]);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const [invalidCinIds, setInvalidCinIds] = useState<string[]>([]);
  const [targetReference, setTargetReference] = useState<string | null>(null);
  const [autoOpenedReference, setAutoOpenedReference] = useState<string | null>(
    null,
  );

  // Quand on arrive depuis le popup "Compléter", on ouvre directement le bon dossier.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setTargetReference(params.get("dossier"));
  }, []);

  // Données nécessaires pour croiser les DAO avec leurs séances d'ouverture.
  const loadData = async () => {
    try {
      const [marketData, seanceData] = await Promise.all([
        listMarkets(),
        getSeances(),
      ]);
      setMarkets(marketData);
      setSeances(seanceData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const initData = async () => {
      if (!getToken()) {
        router.replace("/login");
        return;
      }

      try {
        const user = await fetchCurrentUser();
        if (!isSecretaireUser(user)) {
          setScreenState("forbidden");
          return;
        }

        await loadData();
        setScreenState("ready");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger les données des dossiers.",
        );
        setScreenState("error");
      }
    };

    void initData();
  }, [router]);

  // On rapproche chaque DAO de sa séance et de l'état manuel de sa commission.
  const processedRows = useMemo(() => {
    return markets.map((market) => {
      const seance =
        seances.find((s) => s.reference_dossier === market.reference_number) ??
        null;

      const statusKey = `${STATUS_PREFIX}${market.reference_number}`;
      const hasBackendCommission =
        (seance?.membres.filter((member) => member.est_present).length ?? 0) >=
        3;

      let membersStatus: "draft" | "final" | "none" = "none";

      if (typeof window !== "undefined") {
        const storedStatus = localStorage.getItem(statusKey);
        const storedCompleteCount = getStoredCompleteMemberCount(
          market.reference_number,
        );

        if (
          hasBackendCommission ||
          (storedStatus === "final" && storedCompleteCount >= 3)
        ) {
          membersStatus = "final";
        } else if (storedStatus === "draft" || storedStatus === "final") {
          membersStatus = "draft";
        }
      } else if (hasBackendCommission) {
        membersStatus = "final";
      }

      // Une séance envoyée en validation ne doit plus laisser modifier sa commission.
      const isLocked = seance
        ? [
            "EN_VALIDATION_MEMBRES",
            "EN_VALIDATION_PRESIDENT",
            "VALIDEE",
          ].includes(seance.statut)
        : false;

      return {
        market,
        seance,
        isLocked,
        statusText: seance ? seance.statut : "NON_CREEE",
        membersStatus,
      };
    });
  }, [markets, seances]);

  // Filtre simple par référence ou objet du DAO.
  const searchedRows = useMemo(() => {
    if (!searchQuery.trim()) return processedRows;
    const q = searchQuery.toLowerCase();
    return processedRows.filter(
      (r) =>
        r.market.reference_number.toLowerCase().includes(q) ||
        r.market.title.toLowerCase().includes(q),
    );
  }, [processedRows, searchQuery]);

  // Les trois groupes correspondent exactement au workflow métier.
  const sections = useMemo<GroupedSection[]>(() => {
    const noneRows = searchedRows.filter((r) => r.membersStatus === "none");
    const draftRows = searchedRows.filter((r) => r.membersStatus === "draft");
    const finalRows = searchedRows.filter((r) => r.membersStatus === "final");

    return [
      {
        key: "none",
        title: "À mettre membre de commission",
        subtitle: "Dossiers d'appel d'offres en attente d'ajout de membres",
        icon: UserX,
        iconClass: "border-slate-200 bg-slate-50 text-slate-700",
        badgeClass:
          "border-slate-200 bg-slate-500 text-white shadow-sm shadow-slate-500/10",
        emptyText: "Aucun dossier en attente d'initialisation de comité.",
        rows: noneRows,
      },
      {
        key: "draft",
        title: "Commissions en brouillon",
        subtitle:
          "Compositions en cours ou incomplètes (sauvegardées temporairement)",
        icon: Briefcase,
        iconClass: "border-amber-200 bg-amber-50 text-amber-800",
        badgeClass:
          "border-amber-200 bg-amber-500 text-white shadow-sm shadow-amber-500/10",
        emptyText: "Aucune commission enregistrée en brouillon.",
        rows: draftRows,
      },
      {
        key: "final",
        title: "Membres déjà mis complets",
        subtitle: "Comités d'ouverture de plis validés avec au moins 3 membres",
        icon: UserCheck,
        iconClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
        badgeClass:
          "border-emerald-200 bg-emerald-500 text-white shadow-sm shadow-emerald-500/10",
        emptyText: "Aucun comité n'a été enregistré au complet pour le moment.",
        rows: finalRows,
      },
    ];
  }, [searchedRows]);

  // Petits compteurs du haut de page.
  const stats = useMemo(() => {
    const total = processedRows.length;
    const completed = processedRows.filter(
      (r) => r.membersStatus === "final",
    ).length;
    const draft = processedRows.filter(
      (r) => r.membersStatus === "draft",
    ).length;
    const none = processedRows.filter((r) => r.membersStatus === "none").length;
    return { total, completed, draft, none };
  }, [processedRows]);

  // Ouvre/ferme une famille de dossiers.
  const togglePanel = (key: string) => {
    setActivePanels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Ouvre le popup et recharge les membres
  const handleOpenMembersModal = useCallback(
    (
      market: ProcurementMarket,
      seance: SeanceOuverture | null,
      isLocked: boolean,
    ) => {
      setSelectedMarket(market);
      setSelectedSeance(seance);
      setIsReadOnly(isLocked);
      setModalError("");
      setModalSuccess("");
      setInvalidCinIds([]);

      const localKey = `${STORAGE_PREFIX}${market.reference_number}`;
      const stored = localStorage.getItem(localKey);

      if (stored) {
        try {
          setModalMembers(JSON.parse(stored) as ManualMember[]);
        } catch {
          setModalMembers([]);
        }
      } else if (seance?.membres.length) {
        setModalMembers(mapSeanceMembersToManualMembers(seance));
      } else {
        // Première saisie: on prépare quelques lignes vides pour aller vite.
        const initial: ManualMember[] = [];
        if (seance) {
          if (seance.secretaire_detail) {
            const sec = seance.secretaire_detail;
            initial.push({
              id: `sec-${Date.now()}`,
              nomPrenom:
                `${sec.first_name} ${sec.last_name}`.trim() || sec.username,
              email: sec.email || "",
              cin: "",
              poste: "",
              entite: "",
            });
          }
        }

        if (initial.length === 0) {
          initial.push({
            id: `member-1-${Date.now()}`,
            nomPrenom: "",
            email: "",
            cin: "",
            poste: "",
            entite: "",
          });
        }

        initial.push({
          id: `member-2-${Date.now()}`,
          nomPrenom: "",
          email: "",
          cin: "",
          poste: "",
          entite: "",
        });

        initial.push({
          id: `member-3-${Date.now()}`,
          nomPrenom: "",
          email: "",
          cin: "",
          poste: "",
          entite: "",
        });

        setModalMembers(initial);
      }

      setIsModalOpen(true);
    },
    [],
  );

  // Le paramètre ?dossier=REF sert au bouton "Compléter" depuis le dashboard d'ouverture.
  useEffect(() => {
    if (
      screenState !== "ready" ||
      !targetReference ||
      autoOpenedReference === targetReference
    ) {
      return;
    }

    const market = markets.find(
      (item) => item.reference_number === targetReference,
    );
    if (!market) return;

    const seance =
      seances.find(
        (item) => item.reference_dossier === market.reference_number,
      ) ?? null;
    const isLocked = seance
      ? [
          "EN_VALIDATION_MEMBRES",
          "EN_VALIDATION_PRESIDENT",
          "VALIDEE",
        ].includes(seance.statut)
      : false;

    setSearchQuery(market.reference_number);
    setActivePanels((current) => ({
      ...current,
      none: true,
      draft: true,
      final: true,
    }));
    setAutoOpenedReference(targetReference);
    handleOpenMembersModal(market, seance, isLocked);
  }, [
    autoOpenedReference,
    handleOpenMembersModal,
    markets,
    screenState,
    seances,
    targetReference,
  ]);

  // Ajoute une ligne de membre dans le popup.
  const handleAddMemberRow = () => {
    if (isReadOnly) return;
    setModalMembers((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}-${Math.random()}`,
        nomPrenom: "",
        email: "",
        cin: "",
        poste: "",
        entite: "",
      },
    ]);
  };

  // Supprime une ligne tant que la commission n'est pas verrouillée.
  const handleRemoveMemberRow = (id: string) => {
    if (isReadOnly) return;
    setModalMembers((prev) => prev.filter((m) => m.id !== id));
    setInvalidCinIds((prev) => prev.filter((memberId) => memberId !== id));
  };

  // Met à jour un champ sans toucher aux autres lignes.
  const handleUpdateMemberField = (
    id: string,
    field: keyof ManualMember,
    value: string,
  ) => {
    if (isReadOnly) return;
    const nextValue =
      field === "cin" ? value.replace(/\D/g, "").slice(0, 12) : value;
    if (field === "cin" && nextValue.length === 12) {
      setInvalidCinIds((prev) => prev.filter((memberId) => memberId !== id));
    }
    setModalMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: nextValue } : m)),
    );
  };

  // Brouillon = libre. Final = strict, car c'est lui qui autorise l'ouverture.
  const handleSaveMembers = async (mode: "draft" | "final") => {
    if (isReadOnly || !selectedMarket) return;
    setModalError("");
    setModalSuccess("");
    setInvalidCinIds([]);

    // Les lignes totalement vides sont ignorées, elles servent juste de confort de saisie.
    const activeMembers = modalMembers.filter(
      (m) =>
        m.nomPrenom.trim() !== "" ||
        m.email.trim() !== "" ||
        m.cin.trim() !== "" ||
        m.poste.trim() !== "" ||
        m.entite.trim() !== "",
    );

    const localKey = `${STORAGE_PREFIX}${selectedMarket.reference_number}`;
    const statusKey = `${STATUS_PREFIX}${selectedMarket.reference_number}`;
    const invalidCinMembers = activeMembers.filter(
      (member) => !/^\d{12}$/.test(member.cin.trim()),
    );

    if (mode === "draft") {
      // En brouillon, on laisse sauvegarder même si la commission est incomplète.
      setInvalidCinIds([]);
      localStorage.setItem(localKey, JSON.stringify(activeMembers));
      localStorage.setItem(statusKey, "draft");

      setModalSuccess("Enregistré avec succès en brouillon.");
      setTimeout(() => {
        setIsModalOpen(false);
        void loadData();
      }, 1000);
      return;
    }

    // En final, au moins trois membres complets sont obligatoires.
    if (activeMembers.length < 3) {
      setInvalidCinIds(invalidCinMembers.map((member) => member.id));
      setModalError(
        "Erreur : La commission doit être composée de 3 membres au minimum (supérieur ou égal à 3) pour être enregistrée au complet.",
      );
      return;
    }



    // Chaque membre final doit être exploitable pour le PV et les validations.
    if (invalidCinMembers.length > 0) {
      setInvalidCinIds(invalidCinMembers.map((member) => member.id));
      setModalError(
        "Erreur : chaque CIN doit contenir exactement 12 chiffres.",
      );
      return;
    }

    for (const m of activeMembers) {
      if (!m.nomPrenom.trim()) {
        setModalError(
          "Erreur : Tous les membres doivent avoir un Nom & Prénom renseigné.",
        );
        return;
      }
      if (!m.email.trim()) {
        setModalError(
          `Erreur : L'adresse e-mail est obligatoire pour ${m.nomPrenom}.`,
        );
        return;
      }
      const suggestedEmail = getEmailTypoSuggestion(m.email);
      if (suggestedEmail) {
        setModalError(
          `Erreur : l'adresse e-mail de ${m.nomPrenom} semble mal saisie (${m.email}). Voulez-vous dire ${suggestedEmail} ? Les domaines autres que Gmail restent acceptés.`,
        );
        return;
      }
      if (!m.poste.trim()) {
        setModalError(
          `Erreur : Le rôle/poste est obligatoire pour ${m.nomPrenom}.`,
        );
        return;
      }
      if (!m.entite.trim()) {
        setModalError(`Erreur : L'entité est obligatoire pour ${m.nomPrenom}.`);
        return;
      }
    }

    // Le statut final est ce que le dashboard vérifie avant d'ouvrir la séance.
    setInvalidCinIds([]);
    localStorage.setItem(localKey, JSON.stringify(activeMembers));
    localStorage.setItem(statusKey, "final");

    setModalSuccess("Membres enregistrés avec succès au complet !");
    setTimeout(() => {
      setIsModalOpen(false);
      void loadData();
    }, 1000);
  };

  const getSeanceStatusBadge = (status: string) => {
    switch (status) {
      case "NON_CREEE":
        return (
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
            Séance non créée
          </span>
        );
      case "BROUILLON":
      case "EN_SAISIE":
        return (
          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
            Brouillon
          </span>
        );
      case "EN_VALIDATION_MEMBRES":
        return (
          <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
            Validation membres
          </span>
        );
      case "EN_VALIDATION_PRESIDENT":
        return (
          <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
            Validation président
          </span>
        );
      case "VALIDEE":
        return (
          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            Validée
          </span>
        );
      default:
        return (
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            {status}
          </span>
        );
    }
  };

  if (screenState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">
            Chargement du tableau de bord...
          </p>
        </div>
      </div>
    );
  }

  if (screenState === "forbidden") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <div className="rounded-2xl border border-rose-100 bg-white p-8 shadow-sm max-w-md">
          <ShieldAlert className="mx-auto h-12 w-12 text-rose-500" />
          <h2 className="mt-4 text-xl font-bold text-slate-900">
            Accès Refusé
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Seul le secrétaire de la commission d'ouverture des offres est
            autorisé à accéder à cet espace de gestion des membres.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" /> Retour au Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#f6faf8_0%,transparent_25%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] pb-24 text-slate-800 antialiased selection:bg-emerald-200">
      <TopHeader />

      <div className="zoom-content">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-5 px-4 pb-12 pt-6 md:px-6 lg:pt-8">
          {/* En-tête de la page */}
          <div className="relative flex w-full flex-col justify-between gap-4 overflow-hidden rounded-3xl border border-slate-100 bg-white px-5 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] md:flex-row md:items-center">
            <div className="pointer-events-none absolute right-0 top-0 h-32 w-56 rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 opacity-45 blur-3xl" />
            <div className="relative z-10 flex min-w-0 items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-black tracking-tight text-slate-800 sm:text-xl">
                  MEMBRES DES COMMISSIONS
                </h1>
                <div className="mt-1 flex items-center gap-2">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <p className="truncate text-[10px] font-black uppercase tracking-widest text-slate-500 sm:text-[11px]">
                    Saisie manuelle des comités d'ouverture des plis
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push("/ouverture_offre")}
              className="z-10 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" /> Retour aux Offres
            </button>
          </div>

          {/* Résumé rapide des dossiers */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total dossiers
                </span>
                <Briefcase className="h-4 w-4 text-slate-400" />
              </div>
              <p className="mt-1 text-2xl font-extrabold text-slate-800">
                {stats.total}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  À mettre membre
                </span>
                <UserX className="h-4 w-4 text-slate-400" />
              </div>
              <p className="mt-1 text-2xl font-extrabold text-slate-700">
                {stats.none}
              </p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/20 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                  En brouillon
                </span>
                <Briefcase className="h-4 w-4 text-amber-500" />
              </div>
              <p className="mt-1 text-2xl font-extrabold text-amber-700">
                {stats.draft}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                  Déjà mis complets
                </span>
                <UserCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-1 text-2xl font-extrabold text-emerald-700">
                {stats.completed}
              </p>
            </div>
          </div>

          {/* Recherche dans les dossiers */}
          <div className="relative w-full max-w-md self-start">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro ou objet de dossier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none shadow-sm"
            />
          </div>

          {/* Dossiers rangés selon l'avancement de la commission */}
          <div className="space-y-4">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activePanels[section.key];
              const hasRows = section.rows.length > 0;

              return (
                <div
                  key={section.key}
                  className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-colors ${
                    isActive
                      ? "border-slate-300"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* Titre du groupe */}
                  <button
                    type="button"
                    onClick={() => togglePanel(section.key)}
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
                        <h3 className="text-sm font-bold text-slate-900">
                          {section.title}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {section.subtitle}
                        </p>
                      </div>
                      <span
                        className={`ml-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                          hasRows
                            ? section.badgeClass
                            : "border-slate-200 bg-slate-100 text-slate-400"
                        }`}
                      >
                        {section.rows.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>{isActive ? "Masquer" : "Afficher"}</span>
                      <div
                        className={`rounded-lg bg-slate-100 p-1 text-slate-400 transition-transform ${
                          isActive ? "rotate-180" : ""
                        }`}
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </button>

                  {/* Dossiers du groupe */}
                  {isActive && (
                    <div className="p-0">
                      {!hasRows ? (
                        <div className="px-5 py-8 text-center text-xs text-slate-400 font-semibold italic">
                          {section.emptyText}
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-100 bg-slate-50/20 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                <th className="px-5 py-3">Dossier / DAO</th>
                                <th className="px-5 py-3">
                                  Séance d'ouverture
                                </th>
                                <th className="px-5 py-3">Statut séance</th>
                                <th className="px-5 py-3">État commission</th>
                                <th className="px-5 py-3 text-right">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                              {section.rows.map((row) => (
                                <tr
                                  key={row.market.id}
                                  className="hover:bg-slate-50/40"
                                >
                                  {/* Référence et objet du DAO */}
                                  <td className="px-5 py-3.5">
                                    <p className="font-bold text-slate-800">
                                      {row.market.reference_number}
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500 max-w-md truncate">
                                      {row.market.title}
                                    </p>
                                  </td>

                                  {/* Date prévue pour la séance */}
                                  <td className="px-5 py-3.5 font-semibold text-slate-600">
                                    {row.seance && row.seance.date_seance ? (
                                      <span>
                                        Le {row.seance.date_seance} à{" "}
                                        {row.seance.heure_seance ||
                                          "Non précisée"}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 italic">
                                        Non programmée
                                      </span>
                                    )}
                                  </td>

                                  {/* Statut de la séance */}
                                  <td className="px-5 py-3.5">
                                    {getSeanceStatusBadge(row.statusText)}
                                  </td>

                                  {/* Etat de la commission */}
                                  <td className="px-5 py-3.5">
                                    {row.membersStatus === "final" ? (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-100">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        Déjà mis complets
                                      </span>
                                    ) : row.membersStatus === "draft" ? (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700 border border-amber-100">
                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                        En Brouillon
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-600 border border-slate-200">
                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                                        À mettre membre
                                      </span>
                                    )}
                                  </td>

                                  {/* Action possible sur ce dossier */}
                                  <td className="px-5 py-3.5 text-right">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleOpenMembersModal(
                                          row.market,
                                          row.seance,
                                          row.isLocked,
                                        )
                                      }
                                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-black uppercase tracking-wider shadow-sm transition-all ${
                                        row.isLocked
                                          ? "border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                                          : row.membersStatus === "final"
                                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                            : "border border-transparent bg-slate-900 text-white hover:bg-slate-800"
                                      }`}
                                    >
                                      {row.isLocked ? (
                                        <>
                                          <Eye className="h-3.5 w-3.5" />
                                          Consulter
                                        </>
                                      ) : (
                                        <>
                                          <Edit2 className="h-3.5 w-3.5" />
                                          {row.membersStatus !== "none"
                                            ? "Modifier"
                                            : "Saisir"}
                                        </>
                                      )}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Popup de saisie des membres */}
      {isModalOpen && selectedMarket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-6xl h-[85vh] max-h-[85vh] flex flex-col rounded-3xl border border-slate-100 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* En-tête du popup */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4.5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900">
                    Comité de Séance : {selectedMarket.reference_number}
                  </h3>
                  {isReadOnly && (
                    <span className="inline-flex items-center gap-1 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-black uppercase text-slate-600">
                      <Lock className="h-2.5 w-2.5" /> Lecture seule
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-500 line-clamp-1">
                  DAO : {selectedMarket.title}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contenu du popup */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Message d'aide ou de verrouillage */}
              {isReadOnly ? (
                <div className="mb-4 flex gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-xs font-semibold text-slate-600">
                  <Lock className="h-5 w-5 text-slate-400 shrink-0" />
                  <p>
                    Cette séance a été soumise pour validation ou validée. Les
                    membres de la commission ne peuvent plus être modifiés.
                  </p>
                </div>
              ) : (
                <div className="mb-4 flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/20 p-4 text-xs font-semibold text-emerald-700">
                  <AlertCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                  <p>
                    Renseignez manuellement les membres de la commission. Pour
                    enregistrer définitivement la liste au complet, vous devez
                    renseigner
                    <strong className="text-emerald-800">
                      {" "}
                      au moins 3 membres complets
                    </strong>{" "}
                    (Nom, Email, CIN, Rôle et Entité).
                  </p>
                </div>
              )}

              {modalError && (
                <div className="mb-4 flex items-center gap-2.5 rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3.5 text-xs font-bold text-rose-700 animate-shake">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <p>{modalError}</p>
                </div>
              )}

              {modalSuccess && (
                <div className="mb-4 flex items-center gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3.5 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                  <p>{modalSuccess}</p>
                </div>
              )}

              {/* Tableau de saisie des membres */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-left border-collapse table-auto">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="px-4 py-3.5 w-1/4">Nom & Prénom</th>
                      <th className="px-4 py-3.5 w-1/4">Adresse e-mail</th>
                      <th className="px-4 py-3.5 w-1/5">
                        N° Carte d'identité (CIN)
                      </th>
                      <th className="px-4 py-3.5 w-1/6">Poste / Rôle</th>
                      <th className="px-4 py-3.5 w-1/6">Entité</th>
                      {!isReadOnly && (
                        <th className="px-4 py-3.5 w-16 text-right">Action</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {modalMembers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={isReadOnly ? 5 : 6}
                          className="px-4 py-12 text-center text-slate-400 font-semibold italic"
                        >
                          Aucun membre n'a été ajouté. Cliquez sur "+ Ajouter
                          une ligne".
                        </td>
                      </tr>
                    ) : (
                      modalMembers.map((member) => {
                        const isCinInvalid = invalidCinIds.includes(member.id);

                        return (
                          <tr key={member.id} className="hover:bg-slate-50/30">
                            {/* Nom complet */}
                            <td className="px-3 py-3">
                              <input
                                type="text"
                                value={member.nomPrenom}
                                onChange={(e) =>
                                  handleUpdateMemberField(
                                    member.id,
                                    "nomPrenom",
                                    e.target.value,
                                  )
                                }
                                disabled={isReadOnly}
                                placeholder="Nom complet"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none disabled:bg-slate-50"
                              />
                            </td>

                            {/* Email */}
                            <td className="px-3 py-3">
                              <input
                                type="email"
                                value={member.email}
                                onChange={(e) =>
                                  handleUpdateMemberField(
                                    member.id,
                                    "email",
                                    e.target.value,
                                  )
                                }
                                disabled={isReadOnly}
                                placeholder="exemple@mail.com"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none disabled:bg-slate-50"
                              />
                            </td>

                            {/* CIN */}
                            <td className="px-3 py-3">
                              <input
                                type="text"
                                value={member.cin}
                                onChange={(e) =>
                                  handleUpdateMemberField(
                                    member.id,
                                    "cin",
                                    e.target.value,
                                  )
                                }
                                disabled={isReadOnly}
                                inputMode="numeric"
                                pattern="[0-9]{12}"
                                maxLength={12}
                                placeholder="12 chiffres"
                                aria-invalid={isCinInvalid}
                                className={`w-full rounded-xl border bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none disabled:bg-slate-50 ${
                                  isCinInvalid
                                    ? "border-rose-400 ring-2 ring-rose-100 focus:border-rose-500"
                                    : "border-slate-200 focus:border-emerald-500"
                                }`}
                              />
                              {isCinInvalid && (
                                <p className="mt-1 text-[10px] font-bold text-rose-600">
                                  CIN obligatoire : 12 chiffres exacts.
                                </p>
                              )}
                            </td>

                            {/* Rôle */}
                            <td className="px-3 py-3">
                              <input
                                type="text"
                                value={member.poste}
                                onChange={(e) =>
                                  handleUpdateMemberField(
                                    member.id,
                                    "poste",
                                    e.target.value,
                                  )
                                }
                                disabled={isReadOnly}
                                placeholder="Ex: Membre, Rapporteur..."
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none disabled:bg-slate-50"
                              />
                            </td>

                            {/* Entité */}
                            <td className="px-3 py-3">
                              <input
                                type="text"
                                value={member.entite}
                                onChange={(e) =>
                                  handleUpdateMemberField(
                                    member.id,
                                    "entite",
                                    e.target.value,
                                  )
                                }
                                disabled={isReadOnly}
                                placeholder="Ex: UCP / Ministère"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none disabled:bg-slate-50"
                              />
                            </td>

                            {/* Suppression de la ligne */}
                            {!isReadOnly && (
                              <td className="px-3 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveMemberRow(member.id)
                                  }
                                  className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                >
                                  <Trash2 className="h-4.5 w-4.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleAddMemberRow}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" /> Ajouter une ligne
                </button>
              )}
            </div>

            {/* Actions du popup */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4.5">
              <div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  {isReadOnly ? "Fermer" : "Annuler"}
                </button>
              </div>

              {!isReadOnly && (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => void handleSaveMembers("draft")}
                    className="rounded-xl border border-amber-200 bg-amber-50 px-4.5 py-2 text-xs font-bold text-amber-700 shadow-sm hover:bg-amber-100/70"
                  >
                    Enregistrer en brouillon
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveMembers("final")}
                    className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800"
                  >
                    Enregistrer membres
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
