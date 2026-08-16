"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  ClipboardList,
  FileCheck2,
  LayoutDashboard,
  ShoppingBasket,
  ChevronDown,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { fetchCurrentUser, getCurrentUser } from "@/services/auth";

type MenuLink = {
  label: string;
  href: string;
  match: (pathname: string) => boolean;
};

// Menus structurés par groupe Django
const DEFAULT_LINKS: MenuLink[] = [
  {
    label: "Formulaire PPM",
    href: "/personnel/formulaire",
    match: (p) => p.startsWith("/personnel/formulaire"),
  },
  {
    label: "Dashboard",
    href: "/personnel/dashboard",
    match: (p) => p === "/personnel/dashboard",
  },
  {
    label: "État de besoins",
    href: "/personnel/demande-achat/dashboard",
    match: (p) =>
      p.startsWith("/personnel/demande-achat") &&
      !p.startsWith("/personnel/demande-achat/new"),
  },
  {
    label: "DAO",
    href: "/procurement",
    match: (p) => p.startsWith("/procurement"),
  },
  {
    label: "TDR-ST",
    href: "/personnel/TdrSt",
    match: (p) => p.startsWith("/personnel/TdrSt"),
  },
];

const VALIDATOR_LINKS: MenuLink[] = [
  {
    label: "Validation",
    href: "/personnel/validation",
    match: (p) => p.startsWith("/personnel/validation"),
  },
  {
    label: "TDR-ST",
    href: "/personnel/TdrSt",
    match: (p) => p.startsWith("/personnel/TdrSt"),
  },
];

const COMPOSITION_VALIDATOR_LINKS: MenuLink[] = [
  {
    label: "Validation membres",
    href: "/personnel/ouverture_offre/validation-membres",
    match: (p) => p.startsWith("/personnel/ouverture_offre/validation-membres"),
  },
  {
    label: "TDR-ST",
    href: "/personnel/TdrSt",
    match: (p) => p.startsWith("/personnel/TdrSt"),
  },
];

const AGENT_ACHAT_LINKS: MenuLink[] = [
  {
    label: "Passation",
    href: "/personnel/passation",
    match: (p) => p.startsWith("/personnel/passation"),
  },
];

const MARKET_LINKS: MenuLink[] = [
  {
    label: "Marché",
    href: "/personnel/marche",
    match: (p) =>
      p.startsWith("/personnel/marche") ||
      p.startsWith("/personnel/logistique"),
  },
];

const SECRETAIRE_CONTRACTUALISATION_LINK: MenuLink = {
  label: "Contractualisation",
  href: "/personnel/contractualisation",
  match: (p) => p.startsWith("/personnel/contractualisation"),
};

const SECRETAIRE_BASE_LINKS: MenuLink[] = [
  {
    label: "Ouverture des offres",
    href: "/personnel/ouverture_offre",
    match: (p) =>
      p === "/personnel/ouverture_offre" ||
      p.startsWith("/personnel/ouverture_offre/"),
  },
  {
    label: "Membres des commissions",
    href: "/personnel/ouverture_offre/membres",
    match: (p) => p.startsWith("/personnel/ouverture_offre/membres"),
  },
  {
    label: "Évaluation des offres",
    href: "/personnel/evaluation_offre",
    match: (p) => p.startsWith("/personnel/evaluation_offre"),
  },
];

const EVALUATEUR_LINKS: MenuLink[] = [
  {
    label: "Évaluation des offres",
    href: "/personnel/evaluation_offre",
    match: (p) => p.startsWith("/personnel/evaluation_offre"),
  },
];

const PRESIDENT_LINKS: MenuLink[] = [
  {
    label: "Ouverture des offres",
    href: "/personnel/ouverture_offre",
    match: (p) =>
      p === "/personnel/ouverture_offre" ||
      p.startsWith("/personnel/ouverture_offre/"),
  },
];

const getMenuIcon = (href: string) => {
  if (href.includes("dashboard")) return LayoutDashboard;
  if (href.includes("demande-achat")) return ShoppingBasket;
  if (href.includes("TdrSt")) return FileCheck2;
  if (href.includes("passation") || href.includes("marche"))
    return BriefcaseBusiness;
  return ClipboardList;
};

/**
 * Mappe les groupes Django aux liens de menu
 * Groups disponibles: RPM, GP, CN, VALIDATEUR_HIERARCHIQUE, VALIDATEUR_TECHNIQUE, VALIDATEUR_BUDGETAIRE,
 * VALIDATEUR_PROGRAMMATIQUE, APPROBATEUR_NATIONAL, SECRETAIRE, SECRETAIRE_CONTRACTUALISATION,
 * EVALUATEUR, AGENT_ACHAT, AGENT_MARCHE, LOGISTIQUE, RAF, FINANCE, PRESIDENT
 */
const getMenuLinksForGroups = (groups: string[]): MenuLink[] => {
  // Si aucun groupe = DEMANDEUR (DEFAULT)
  if (groups.length === 0) {
    return DEFAULT_LINKS;
  }

  // Si SECRETAIRE ou ancien groupe SECRETAIRE_CONTRACTUALISATION,
  // on affiche Contractualisation + les liens classiques du secrétariat.
  if (
    groups.includes("SECRETAIRE") ||
    groups.includes("SECRETAIRE_CONTRACTUALISATION")
  ) {
    return [SECRETAIRE_CONTRACTUALISATION_LINK, ...SECRETAIRE_BASE_LINKS];
  }

  // Si EVALUATEUR (mais pas SECRETAIRE)
  if (groups.includes("EVALUATEUR")) {
    return EVALUATEUR_LINKS;
  }

  // Si PRESIDENT (mais pas SECRETAIRE)
  if (groups.includes("PRESIDENT")) {
    return PRESIDENT_LINKS;
  }

  // Si AGENT_ACHAT
  if (groups.includes("AGENT_ACHAT")) {
    return AGENT_ACHAT_LINKS;
  }

  // Si AGENT_MARCHE ou LOGISTIQUE
  if (groups.includes("AGENT_MARCHE") || groups.includes("LOGISTIQUE")) {
    return MARKET_LINKS;
  }

  // Si n'importe quel VALIDATEUR ou APPROBATEUR ou FINANCE ou RAF
  const compositionValidator = groups.some((group) =>
    [
      "RPM",
      "GP",
      "CN",
      "APPROBATEUR_NATIONAL",
      "VALIDATEUR_TECHNIQUE",
      "VALIDATEUR_PROGRAMMATIQUE",
    ].includes(group),
  );

  if (
    compositionValidator ||
    groups.some((g) => g.startsWith("VALIDATEUR_")) ||
    groups.includes("APPROBATEUR_NATIONAL") ||
    groups.includes("FINANCE") ||
    groups.includes("RAF")
  ) {
    if (compositionValidator && !groups.some((group) => ["FINANCE", "RAF", "VALIDATEUR_BUDGETAIRE"].includes(group))) {
      return COMPOSITION_VALIDATOR_LINKS;
    }
    return VALIDATOR_LINKS;
  }

  // Par défaut
  return DEFAULT_LINKS;
};

export default function Menu({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const buttonId = useId();
  const menuId = `${buttonId}-menu`;
  const showAuthenticatedActions = !pathname.startsWith("/auth");

  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [userGroups, setUserGroups] = useState<string[]>(
    () => getCurrentUser()?.groups || [],
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!showAuthenticatedActions) return;

    const currentUser = getCurrentUser();
    if (currentUser) return;

    void fetchCurrentUser()
      .then((user) => setUserGroups(user?.groups || []))
      .catch(() => setUserGroups([]));
  }, [showAuthenticatedActions]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown, { capture: true });
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, {
        capture: true,
      });
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const links = getMenuLinksForGroups(userGroups);

  if (!showAuthenticatedActions || !isMounted) return null;

  const handleToggleMenu = () => {
    setOpen((prev) => !prev);
  };

  return (
    <div ref={rootRef} className={`relative inline-block ${className}`}>
      {/* 1. Le Bouton Déclencheur */}
      <button
        id={buttonId}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={handleToggleMenu}
        className="group relative inline-flex h-10 cursor-pointer items-center justify-start rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold tracking-wider text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-emerald-700 hover:border-slate-300"
      >
        <span className="flex items-center gap-2.5 leading-none">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]" />
          Menu
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? "rotate-180 text-emerald-600" : ""}`}
          />
        </span>
      </button>

      {/* 2. Le Panneau Sidebar Unifié (Taille dynamique et flexible) */}
      <div
        id={menuId}
        role="menu"
        aria-labelledby={buttonId}
        className={`absolute top-full left-0 z-50 mt-2 w-[280px] overflow-hidden rounded-2xl border border-slate-300 bg-slate-200 p-4 shadow-xl transition-all duration-200 origin-top-left flex flex-col ${open
          ? "visible opacity-100 scale-100 translate-y-0"
          : "invisible opacity-0 scale-95 -translate-y-1"
          }`}
        style={{
          // Suppression du 60vh. Le menu fait désormais la taille exacte de son contenu.
          // max-height empêche le menu de casser l'écran s'il y a trop d'éléments.
          maxHeight: open ? "80vh" : "auto",
        }}
      >
        {/* Conteneur Flex vertical prenant toute la hauteur disponible */}
        <div className="flex flex-col h-full flex-1">
          <div>
            {/* Ligne décorative haute */}
            <div className="mb-4 px-1">
              <div
                className="h-[3px] w-12 rounded-full bg-gradient-to-r from-emerald-500 to-green-400"
                aria-hidden="true"
              />
            </div>

            {/* Menu de navigation principal */}
            <nav className="flex flex-col gap-1.5 overflow-y-auto border-l border-slate-400/80 pl-2.5 ml-1">
              {links.length > 0 ? (
                links.map((item) => {
                  const isActive = item.match(pathname);
                  const Icon = getMenuIcon(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      className={`group/item flex items-center gap-3 rounded-xl py-2 px-3 text-left text-sm font-semibold transition-all duration-150 outline-none ${isActive
                        ? "bg-white text-emerald-700 font-bold shadow-sm border border-slate-200/80"
                        : "text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-sm"
                        }`}
                      onClick={() => setOpen(false)}
                    >
                      <Icon
                        size={17}
                        className={`transition-colors ${isActive
                          ? "text-emerald-600"
                          : "text-slate-400 group-hover/item:text-slate-600"
                          }`}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-center text-xs text-slate-500 italic">
                  Aucun lien disponible pour cet espace.
                </div>
              )}
            </nav>
          </div>

          {/* Pied du menu : mt-auto pousse ce bloc tout en bas si le contenu est petit */}
          <div className="mt-auto pt-6 px-1">
            <div className="border-t border-slate-200 pt-3">
              <div className="rounded-xl bg-slate-250 px-2.5 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-550">
                E-procurement UCP
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
