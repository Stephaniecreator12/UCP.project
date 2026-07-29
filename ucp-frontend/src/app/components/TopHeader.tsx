"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, type MouseEvent } from "react";
import Cookies from "js-cookie";
import { logout, getLandingRouteForUser } from "@/services/auth";
import Menu from "@/app/components/menu";
const DEFAULT_AFTER_LOGOUT_ROUTE = "/auth/login";

export default function TopHeader() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement | null>(null);

  const handleLogout = () => {
    logout();
    setTimeout(() => {
      if (typeof window !== "undefined" && window.location.pathname !== `${DEFAULT_AFTER_LOGOUT_ROUTE}`) {
        window.location.replace(`${DEFAULT_AFTER_LOGOUT_ROUTE}`);
      }
    }, 120);
  };

  const showAuthenticatedActions = pathname !== `${DEFAULT_AFTER_LOGOUT_ROUTE}`;
  const isEvaluatorRoute =
    pathname.startsWith("/personnel/evaluation/") ||
    pathname === "/personnel/evaluation/login";
  const showMenu = showAuthenticatedActions && !isEvaluatorRoute;
  const logoHref = isEvaluatorRoute
    ? "/personnel/evaluation/login"
    : showAuthenticatedActions
      ? (() => {
          const groups: string[] = JSON.parse(Cookies.get("groups") ?? "[]");
          return getLandingRouteForUser({ id: "", email: "", groups });
        })()
      : "/auth/login";

  const handleHeaderMove = (event: MouseEvent<HTMLElement>) => {
    const header = headerRef.current;
    if (!header) return;
    const rect = header.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    header.style.setProperty("--mx", `${x}px`);
    header.style.setProperty("--my", `${y}px`);
  };

  const resetHeaderGlow = () => {
    const header = headerRef.current;
    if (!header) return;
    header.style.setProperty("--mx", "50%");
    header.style.setProperty("--my", "50%");
  };

  return (
    <div className="sticky top-0 z-40">
      <header
        ref={headerRef}
        onMouseMove={handleHeaderMove}
        onMouseLeave={resetHeaderGlow}
        style={{ "--mx": "50%", "--my": "50%" } as React.CSSProperties}
        className="relative h-[2cm] overflow-hidden border-b border-slate-200/60 bg-white/90 backdrop-blur-md before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(420px_circle_at_var(--mx)_var(--my),rgba(34,197,94,0.16),transparent_60%)]"
      >
        {/* Ligne de couleur en haut */}
        <div
          className="h-[3px] bg-gradient-to-r from-[#22c55e] via-[#1fcf78] to-[#22c55e]"
          aria-hidden="true"
        />

        {/* Orbes décoratives */}
        <div
          className="pointer-events-none absolute -top-[52px] -left-[34px] h-[130px] w-[130px] rounded-full bg-[#22c55e]/35 opacity-45 blur-[28px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -top-[68px] -right-[42px] h-[150px] w-[150px] rounded-full bg-[#7ed7ff]/30 opacity-45 blur-[28px]"
          aria-hidden="true"
        />

        <div className="relative z-10 grid h-[calc(2cm-3px)] w-full grid-cols-1 items-center gap-4 px-4 py-0 md:grid-cols-[auto_1fr_auto]">
          {/* Logo & Brand */}
          <Link
            href={logoHref}
            className="inline-flex items-center gap-3 no-underline text-inherit"
          >
            <Image
              src="/ucp-sante-logo-color.png"
              alt="Logo UCP"
              width={48}
              height={48}
              className="rounded-xl border border-slate-200 bg-white object-contain"
              style={{ width: "auto", height: "auto" }}
              priority
            />
            <div className="grid gap-0.5">
              <strong className="text-[0.96rem] font-bold uppercase tracking-[0.04em] text-slate-800">
                unité de coordination des projets
              </strong>
              <span className="text-[0.74rem] text-slate-500 tracking-[0.03em]">
                e-Procurement
              </span>
            </div>
          </Link>

          {/* Actions - Déconnexion */}
          <div className="justify-self-end">
            {showAuthenticatedActions && !isEvaluatorRoute && (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-600 shadow-[0_8px_20px_-12px_rgba(244,63,94,0.3)] transition-all hover:bg-rose-100 hover:text-rose-700 hover:border-rose-300 hover:-translate-y-0.5 active:translate-y-0"
              >
                Déconnexion
              </button>
            )}
          </div>
        </div>
      </header>

      {showMenu && (
        <div className="-mt-px">
          <div className="w-full px-1 py-1">
            <div className="inline-flex">
              <Menu key={pathname} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
