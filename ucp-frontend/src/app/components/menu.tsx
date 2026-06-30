"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  ClipboardList,
  FileCheck2,
  LayoutDashboard,
  ShoppingBasket,
} from "lucide-react";
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
} from "@/services/auth";

type MenuLink = {
  label: string;
  href: string;
  match: (pathname: string) => boolean;
};

const getMenuIcon = (href: string) => {
  if (href === "/dashboard") return LayoutDashboard;
  if (href === "/demande-achat") return ShoppingBasket;
  if (href === "/TdrSt") return FileCheck2;
  if (href === "/validation") return FileCheck2;
  if (href === "/passation") return BriefcaseBusiness;
  if (href === "/marche") return BriefcaseBusiness;
  return ClipboardList;
};

const getUserMode = (user: ReturnType<typeof getCurrentUser>) => {
  if (isFinanceUser(user)) return "finance" as const;
  if (isValidatorUser(user)) return "validator" as const;
  if (isAgentAchatUser(user)) return "agent" as const;
  if (isAgentMarcheUser(user)) return "marche" as const;
  return "default" as const;
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
    match: (pathname) => pathname === "/demande-achat" || pathname.startsWith("/demande-achat/"),
  },
  {
    label: "TDR",
    href: "/TdrSt",
    match: (pathname) => pathname === "/TdrSt" || pathname.startsWith("/TdrSt/"),
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
    match: (pathname) => pathname === "/TdrSt" || pathname.startsWith("/TdrSt/"),
  },
];


const AGENT_ACHAT_LINKS: MenuLink[] = [
  {
    label: "passation",
    href: "/passation",
    match: (pathname) => pathname === "/passation" || pathname.startsWith("/passation/"),
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
  const [userMode, setUserMode] = useState<"default" | "validator" | "finance" | "agent" | "marche">(
    () => getUserMode(getCurrentUser()),
  );

  const showAuthenticatedActions = pathname !== "/login";
  const canPortal = typeof document !== "undefined";

  const measureMenuPosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    setMenuPos({
      left: rect.left,
      top: rect.bottom,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    measureMenuPosition();
  }, [open, measureMenuPosition]);

  useEffect(() => {
    if (!showAuthenticatedActions) return;

    const currentUser = getCurrentUser();
    if (currentUser) return;

    void fetchCurrentUser()
      .then((user) => setUserMode(getUserMode(user)))
      .catch(() => setUserMode("default"));
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

  const links =
    userMode === "finance" || userMode === "validator"
      ? VALIDATOR_LINKS
      : userMode === "agent"
        ? AGENT_ACHAT_LINKS
        : userMode === "marche"
          ? MARKET_LINKS
          : DEFAULT_LINKS;

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
        className="group relative inline-flex h-9 items-center justify-start rounded-xl border border-slate-200 bg-white px-3 text-xs font-black uppercase tracking-widest text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900"
      >
        <span className="relative z-10 flex items-center gap-2 leading-none">
          <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.14)]" />
          Menu
          <svg
            className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-300 ${open ? "rotate-90" : "-rotate-90"}`}
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
          <>
            <style>{`
              @keyframes ucpMenuSlideIn {
                from { opacity: 0.78; transform: translateX(-100%); }
                to { opacity: 1; transform: translateX(0); }
              }
            `}</style>
            <div
              id={menuId}
              ref={menuRef}
              role="menu"
              aria-labelledby={buttonId}
              onMouseEnter={handleMenuMouseEnter}
              onMouseLeave={handleMenuMouseLeave}
              className="fixed bottom-0 left-0 z-[80] w-64 overflow-hidden border-r border-slate-200 bg-white/85 shadow-[24px_0_60px_-42px_rgba(15,23,42,0.7)] backdrop-blur-sm"
              style={{
                animation: "ucpMenuSlideIn 220ms ease-out both",
                top: menuPos.top + 25,
              }}
            >
              <div className="flex h-full flex-col">
                <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
                  {links.map((item) => {
                    const isActive = item.match(pathname);
                    const Icon = getMenuIcon(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.9625rem] font-medium transition-all ${
                          isActive
                            ? "pointer-events-none bg-green-50 text-green-700"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                        onClick={() => setOpen(false)}
                      >
                        <Icon
                          size={20}
                          className={isActive ? "text-green-600" : "text-slate-400"}
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="shrink-0 border-t border-slate-100 p-4">
                  <div className="rounded-xl bg-slate-50/85 px-3 py-2.5 text-[0.825rem] font-semibold text-slate-500">
                    Navigation UCP
                  </div>
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}