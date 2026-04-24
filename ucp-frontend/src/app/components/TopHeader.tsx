"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, type MouseEvent } from "react";
import { logout } from "@/services/auth";
import Menu from "@/app/components/menu";

export default function TopHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const headerRef = useRef<HTMLElement | null>(null);

  const handleLogout = () => {
    logout();
    router.replace("/login");
    router.refresh();
    setTimeout(() => {
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }, 120);
  };

  const showAuthenticatedActions = pathname !== "/login";

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
    <div className="sticky top-0 z-50">
      <header
        ref={headerRef}
        onMouseMove={handleHeaderMove}
        onMouseLeave={resetHeaderGlow}
        className="relative h-[1.8cm] overflow-hidden border-b border-[var(--line)] bg-[var(--surface)] shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
      >
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_var(--mx,50%)_var(--my,50%),rgba(16,185,129,0.08)_0%,transparent_25%)] transition-all duration-300 ease-out"
          aria-hidden="true"
        />
        {/* Ligne de couleur en haut */}
        <div
          className="h-[3px] bg-emerald-500"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto flex h-[calc(1.8cm-3px)] max-w-[1480px] items-center justify-between gap-3 px-6">
          {/* Logo & Brand */}
          <Link
            href={showAuthenticatedActions ? "/formulaire" : "/login"}
            className="inline-flex min-w-0 items-center gap-3 no-underline text-inherit"
          >
            <Image
              src="/ucp-sante-logo-color.png"
              alt="Logo UCP"
              width={48}
              height={48}
              className="rounded-xl border border-slate-200 bg-white object-contain"
              priority
            />
            <div className="grid min-w-0 gap-0">
              <strong className="truncate text-[0.85rem] font-black uppercase tracking-widest text-[var(--text)]">
                unité de coordination des projets
              </strong>
              <span className="hidden text-[0.7rem] font-bold uppercase tracking-widest text-[var(--muted)] sm:block">
                e-Procurement Platform
              </span>
            </div>
          </Link>

          {/* Actions - Déconnexion */}
          <div className="shrink-0 flex items-center gap-4">
            {showAuthenticatedActions && (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-[11px] font-black uppercase tracking-widest text-[var(--text)] shadow-sm transition-all hover:bg-[var(--panel)] hover:border-[var(--line-strong)]"
              >
                Déconnexion
              </button>
            )}
          </div>
        </div>
      </header>

      {showAuthenticatedActions && (
        <div className="-mt-px">
          <div className="mx-auto max-w-[1480px] px-4 py-1 sm:px-6">
            <div className="inline-flex max-w-full">
              <Menu key={pathname} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
