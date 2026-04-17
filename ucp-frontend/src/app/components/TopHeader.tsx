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
    <div className="sticky top-0 z-40">
      <header
        ref={headerRef}
        className="relative h-[2cm] overflow-hidden border-b border-slate-200 bg-white shadow-sm"
      >
        {/* Ligne de couleur en haut */}
        <div
          className="h-[3px] bg-emerald-500"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto flex h-[calc(2cm-3px)] max-w-[1480px] items-center justify-between gap-3 px-4 sm:px-6">
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
            <div className="grid min-w-0 gap-0.5">
              <strong className="truncate text-[0.78rem] font-bold uppercase tracking-[0.04em] text-slate-800 sm:text-[0.96rem]">
                unité de coordination des projets
              </strong>
              <span className="hidden text-[0.74rem] tracking-[0.03em] text-slate-500 sm:block">
                e-Procurement
              </span>
            </div>
          </Link>

          {/* Actions - Déconnexion */}
          <div className="shrink-0">
            {showAuthenticatedActions && (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-slate-300 bg-white px-[0.95rem] py-[0.46rem] text-[0.8rem] font-bold text-[#2f3d4c] shadow-[0_10px_20px_-16px_rgba(6,20,34,0.65)] transition-all hover:bg-slate-50"
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
