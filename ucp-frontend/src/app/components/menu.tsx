"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  fetchCurrentUser,
  getCurrentUser,
  isAgentAchatUser,
  isAgentMarcheUser,
  isFinanceUser,
  isValidatorUser,
  isSecretaireUser,
} from "@/services/auth";
import { getSeances } from "@/services/ouvertureOffre";
import type { SeanceOuverture } from "@/types/ouvertureOffre";

type MenuLink = {
  label: string;
  href: string;
  match: (pathname: string) => boolean;
};

const getUserMode = (user: ReturnType<typeof getCurrentUser>) => {
  if (isSecretaireUser(user)) return "secretaire" as const;
  if (isFinanceUser(user)) return "finance" as const;
  if (isValidatorUser(user)) return "validator" as const;
  if (isAgentAchatUser(user)) return "agent" as const;
  if (isAgentMarcheUser(user)) return "marche" as const;
  return "default" as const;
};

const isOpeningParticipant = (
  user: ReturnType<typeof getCurrentUser>,
  seances: SeanceOuverture[],
) =>
  !!user &&
  seances.some(
    (seance) =>
      seance.president === user.id ||
      seance.membres.some((member) => member.utilisateur === user.id),
  );

const OPENING_LINK: MenuLink = {
  label: "ouverture des offres",
  href: "/ouverture_offre",
  match: (pathname) =>
    pathname === "/ouverture_offre" ||
    pathname.startsWith("/ouverture_offre/"),
};

const DEFAULT_LINKS: MenuLink[] = [
  {
    label: "PPM",
    href: "/formulaire",
    match: (pathname) => pathname === "/formulaire",
  },
  {
    label: "dashboard",
    href: "/dashboard",
    match: (pathname) => pathname === "/dashboard",
  },
  {
    label: "état de besoins",
    href: "/demande-achat",
    match: (pathname) =>
      pathname === "/demande-achat" || pathname.startsWith("/demande-achat/"),
  },
  {
    label: "DAO / DC",
    href: "/dao-dc",
    match: (pathname) => pathname === "/dao-dc" || pathname.startsWith("/dao-dc/"),
  },
  {
    label: "TDR",
    href: "/TdrSt",
    match: (pathname) =>
      pathname === "/TdrSt" || pathname.startsWith("/TdrSt/"),
  },
];

const VALIDATOR_LINKS: MenuLink[] = [
  {
    label: "validation",
    href: "/validation",
    match: (pathname) =>
      pathname === "/validation" || pathname.startsWith("/validation/"),
  },
  {
    label: "TDR",
    href: "/TdrSt",
    match: (pathname) =>
      pathname === "/TdrSt" || pathname.startsWith("/TdrSt/"),
  },
];

const AGENT_ACHAT_LINKS: MenuLink[] = [
  {
    label: "passation",
    href: "/passation",
    match: (pathname) =>
      pathname === "/passation" || pathname.startsWith("/passation/"),
  },
];

const MARKET_LINKS: MenuLink[] = [
  {
    label: "marché",
    href: "/marche",
    match: (pathname) =>
      pathname === "/marche" ||
      pathname.startsWith("/marche/") ||
      pathname === "/logistique" ||
      pathname.startsWith("/logistique/"),
  },
];

const SECRETAIRE_LINKS: MenuLink[] = [
  OPENING_LINK,
  {
    label: "Membres des commissions",
    href: "/ouverture_offre/membres",
    match: (pathname) =>
      pathname === "/ouverture_offre/membres" ||
      pathname.startsWith("/ouverture_offre/membres/"),
  },
];

export default function Menu({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const buttonId = useId();
  const menuId = `${buttonId}-menu`;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ left: number; top: number } | null>(
    null,
  );
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [userMode, setUserMode] = useState<
    "default" | "validator" | "finance" | "agent" | "marche" | "secretaire"
  >(() => getUserMode(getCurrentUser()));
  const [hasOpeningAccess, setHasOpeningAccess] = useState(() =>
    isSecretaireUser(getCurrentUser()),
  );

  const showAuthenticatedActions = pathname !== "/login";
  const canPortal = typeof document !== "undefined";

  const measureMenuPosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const menuWidth = 200;
    setMenuPos({
      left: Math.max(8, Math.min(rect.left, window.innerWidth - menuWidth - 8)),
      top: rect.bottom,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    measureMenuPosition();
  }, [open, measureMenuPosition]);

  useEffect(() => {
    if (!showAuthenticatedActions) return;

    let cancelled = false;
    void fetchCurrentUser()
      .then((user) => {
        if (cancelled) return;

        setUserMode(getUserMode(user));

        if (isSecretaireUser(user)) {
          setHasOpeningAccess(true);
          return;
        }

        void getSeances()
          .then((seances) => {
            if (!cancelled) {
              setHasOpeningAccess(isOpeningParticipant(user, seances));
            }
          })
          .catch(() => {
            if (!cancelled) setHasOpeningAccess(false);
          });
      })
      .catch(() => {
        if (!cancelled) {
          setUserMode("default");
          setHasOpeningAccess(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [showAuthenticatedActions]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      const root = rootRef.current;
      const menu = menuRef.current;
      const clickedInsideRoot = !!root && root.contains(event.target);
      const clickedInsideMenu = !!menu && menu.contains(event.target);
      if (!clickedInsideRoot && !clickedInsideMenu) setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const onReposition = () => measureMenuPosition();

    document.addEventListener("pointerdown", onPointerDown, { capture: true });
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, {
        capture: true,
      });
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, measureMenuPosition]);

  const baseLinks =
    userMode === "secretaire"
      ? SECRETAIRE_LINKS
      : userMode === "finance" || userMode === "validator"
      ? VALIDATOR_LINKS
      : userMode === "agent"
        ? AGENT_ACHAT_LINKS
        : userMode === "marche"
          ? MARKET_LINKS
          : DEFAULT_LINKS;
  const links =
    userMode === "secretaire" || !hasOpeningAccess
      ? baseLinks
      : [...baseLinks, OPENING_LINK];

  const handleMouseEnter = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setOpen(false);
    }, 200);
    setHoverTimeout(timeout);
  };

  const handleMenuMouseEnter = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
  };

  const handleMenuMouseLeave = () => {
    setOpen(false);
  };

  if (!showAuthenticatedActions) return null;

  return (
    <div
      ref={rootRef}
      className={`relative inline-flex ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        id={buttonId}
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        className="group relative inline-flex h-[32px] items-center justify-start bg-transparent px-0 text-[11px] font-black uppercase tracking-widest text-[var(--muted)] transition-all hover:text-[var(--text)]"
      >
        <span className="relative z-10 leading-none flex items-center gap-2">
          Menu
          <svg
            className={`w-3 h-3 text-[var(--muted)] transition-transform duration-300 ${open ? "" : "rotate-180"}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </button>

      {open &&
        canPortal &&
        menuPos &&
        createPortal(
          <div
            id={menuId}
            ref={menuRef}
            role="menu"
            aria-labelledby={buttonId}
            onMouseEnter={handleMenuMouseEnter}
            onMouseLeave={handleMenuMouseLeave}
            className="fixed w-[200px] max-w-[calc(100vw-1rem)] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-200"
            style={{ left: menuPos.left, top: menuPos.top + 8 }}
          >
            <div className="max-h-[min(22rem,calc(100dvh-5rem))] overflow-y-auto py-1">
              {links.map((item) => {
                const isActive = item.match(pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    className={`block px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all ${
                      isActive
                        ? "bg-[var(--panel)] text-[var(--text)]"
                        : "text-[var(--muted)] hover:bg-[var(--panel)] hover:text-[var(--text)]"
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
