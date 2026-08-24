"use client";
import Link from "next/link";
import Cookies from "js-cookie";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import {
  BriefcaseBusiness,
  ClipboardList,
  FileCheck2,
  LayoutDashboard,
  ShoppingBasket,
  ChevronDown,
} from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

type MenuLink = {
  label: string;
  href: string;
  groups: string[];
  match: (pathname: string) => boolean;
  allGroups?: boolean;
};

const MENU_LINKS: MenuLink[] = [
  {
    label: "Procurement",
    href: "/procurement",
    groups: ["PUBLIC"],
    match: (p) => p.startsWith("/procurement"),
    allGroups: true,
  },
  {
    label: "Suivi Procurement",
    href: "/personnel/log-dashboard",
    groups: ["ADMIN", "DEMANDEUR"],
    match: (p) => p.startsWith("/personnel/log-dashboard"),
  },
  {
    label: "Demande d'achat",
    href: "/personnel/demande-achat",
    groups: ["ADMIN", "DEMANDEUR"],
    match: (p) => p.startsWith("/personnel/demande-achat"),
  },
  {
    label: "Validation",
    href: "/personnel/validation",
    groups: [
      "ADMIN",
      "VALIDATEUR_HIERARCHIQUE",
      "VALIDATEUR_TECHNIQUE",
      "VALIDATEUR_PROGRAMMATIQUE",
      "APPROBATEUR_NATIONAL",
      "FINANCE",
      "RAF",
      "VALIDATEUR_BUDGETAIRE",
    ],
    match: (p) => p.startsWith("/personnel/validation"),
  },
  {
    label: "TDR",
    href: "/personnel/TdrSt",
    groups: [
      "ADMIN",
      "VALIDATEUR_HIERARCHIQUE",
      "VALIDATEUR_TECHNIQUE",
      "VALIDATEUR_PROGRAMMATIQUE",
      "APPROBATEUR_NATIONAL",
      "FINANCE",
      "RAF",
      "VALIDATEUR_BUDGETAIRE",
      "DEMANDEUR",
      "AUDITEUR",
    ],
    match: (p) => p.startsWith("/personnel/TdrSt"),
  },
  {
    label: "Passation",
    href: "/personnel/passation",
    groups: ["ADMIN", "AGENT_ACHAT"],
    match: (p) => p.startsWith("/personnel/passation"),
  },
  {
    label: "Marché",
    href: "/personnel/marche",
    groups: ["ADMIN", "AGENT_MARCHE", "MARCHES", "LOGISTIQUE"],
    match: (p) =>
      p.startsWith("/personnel/marche") ||
      p.startsWith("/personnel/logistique"),
  },
  {
    label: "Contractualisation",
    href: "/personnel/contractualisation",
    groups: ["ADMIN", "SECRETAIRE_CONTRACTUALISATION"],
    match: (p) => p.startsWith("/personnel/contractualisation"),
  },
  {
    label: "Validation Ouverture",
    href: "/personnel/validation-ouverture",
    groups: ["ADMIN", "SECRETAIRE", "EVALUATEUR", "PRESIDENT", "AUDITEUR", "DEMANDEUR"],
    match: (p) => p.startsWith("/personnel/validation-ouverture"),
  },
  {
    label: "Évaluation des offres",
    href: "/personnel/evaluation_offre",
    groups: ["ADMIN", "AUDITEUR", "EVALUATEUR", "PRESIDENT"],
    match: (p) => p.startsWith("/personnel/evaluation_offre"),
  },
];

const getMenuIcon = (href: string) => {
  if (href === "/procurement") return ClipboardList;
  if (href === "/personnel/log-dashboard" || href === "/personnel/demande-achat") return LayoutDashboard;
  if (href === "/personnel/validation" || href === "/personnel/TdrSt") return FileCheck2;
  if (href === "/personnel/passation" || href === "/personnel/marche" || href === "/personnel/logistique") return BriefcaseBusiness;
  if (href === "/personnel/contractualisation") return FileCheck2;
  if (href === "/personnel/evaluation_offre") return FileCheck2;
  if (href === "/personnel/validation-ouverture") return FileCheck2;
  return ClipboardList;
};

export default function Menu({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const buttonId = useId();
  const menuId = `${buttonId}-sidebar`;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const emptySubscribe = () => () => { };

  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const showAuthenticatedActions = pathname !== "/auth/login";

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
      document.removeEventListener("pointerdown", onPointerDown, { capture: true });
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const groups: string[] = JSON.parse(Cookies.get("groups") ?? "[]");

  const links = MENU_LINKS.filter(link =>
    link.allGroups ||
    link.groups.some(group => groups.includes(group))
  );

  if (!showAuthenticatedActions) return null;
  const handleToggleMenu = () => {
    setOpen((prev) => !prev);
  };
  if (!isMounted) {
    return <div className="min-h-[40px]" />;
  }

  return (
    <div
      ref={rootRef}
      className={`relative inline-block ${className}`}
    >
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
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? "rotate-180 text-emerald-600" : ""}`} />
        </span>
      </button>

      {/* 2. Le Panneau Sidebar Unifié */}
      <div
        id={menuId}
        role="menu"
        aria-labelledby={buttonId}
        className={`absolute top-full left-0 z-50 mt-2 w-[240px] rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl transition-all duration-200 origin-top-left flex flex-col ${
          open
            ? "visible opacity-100 scale-100 translate-y-0"
            : "invisible opacity-0 scale-95 -translate-y-1"
        }`}
        style={{
          maxHeight: "75vh", // Limite la hauteur globale du menu
        }}
      >
        {/* Conteneur Flex principal avec min-h-0 pour forcer le comportement de scroll flex */}
        <div className="flex flex-col h-full min-h-0">
          
          {/* En-tête fixe (ne défile pas) */}
          <div className="flex-shrink-0 mb-2 px-1">
            <div className="h-[3px] w-12 rounded-full bg-gradient-to-r from-emerald-500 to-green-400" aria-hidden="true" />
          </div>

          {/* Menu de navigation avec scrollbar active */}
          <nav className="flex flex-col gap-1.5 overflow-y-auto ml-1 custom-scrollbar">
            {links.length > 0 ? (
              links.map((item) => {
                const isActive = item.match(pathname);
                const Icon = getMenuIcon(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    className={`group/item flex items-center gap-3 rounded-xl py-2.5 px-3.5 text-left text-sm font-medium transition-all duration-150 outline-none ${
                      isActive
                        ? "bg-emerald-50/80 text-emerald-700 font-semibold shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    <Icon
                      size={18}
                      className={`transition-colors ${
                        isActive ? "text-emerald-600" : "text-slate-400 group-hover/item:text-slate-600"
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

          {/* Pied du menu fixe (ne défile pas) */}
          <div className="flex-shrink-0 mt-3 pt-3 px-1 border-t border-slate-200">
            <div className="rounded-xl bg-slate-100 px-2.5 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
              E-procurement UCP
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}