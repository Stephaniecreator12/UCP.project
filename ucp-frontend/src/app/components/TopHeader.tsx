"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, type MouseEvent } from "react";
import { logout } from "@/services/auth";
import Menu from "@/app/components/menu";
const DEFAULT_AFTER_LOGOUT_ROUTE = "/auth/login";

export default function TopHeader() {
  const pathname = usePathname();
  const router = useRouter();
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
      className="h-[2cm] overflow-hidden border-b border-slate-200/60 bg-white/90 backdrop-blur-md relative
                 before:content-[''] before:absolute before:inset-0 
                 before:bg-[radial-gradient(420px_circle_at_var(--mx)_var(--my),rgba(34,197,94,0.16),transparent_60%)] 
                 before:pointer-events-none"
      >
      {/* Ligne de couleur en haut */}
      <div className="h-[3px] bg-gradient-to-r from-[#22c55e] via-[#1fcf78] to-[#22c55e]" aria-hidden="true" />
      
      {/* Orbes décoratives */}
      <div className="absolute -top-[52px] -left-[34px] w-[130px] h-[130px] rounded-full blur-[28px] pointer-events-none opacity-45 bg-[#22c55e]/35" aria-hidden="true" />
      <div className="absolute -top-[68px] -right-[42px] w-[150px] h-[150px] rounded-full blur-[28px] pointer-events-none opacity-45 bg-[#7ed7ff]/30" aria-hidden="true" />

      <div className="relative z-10 max-w-[1480px] mx-auto h-[calc(2cm-3px)] px-4 py-0 grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-center gap-4">
        
        {/* Logo & Brand */}
        <Link href={showAuthenticatedActions ? "/formulaire" : "/login"} className="inline-flex items-center gap-3 no-underline text-inherit">
          <Image
            src="/ucp-sante-logo-color.png"
            alt="Logo UCP"
            width={48}
            height={48}
            className="rounded-xl border border-slate-200 bg-white object-contain"
            priority
          />
          <div className="grid gap-0.5">
            <strong className="text-[0.96rem] font-bold uppercase tracking-[0.04em] text-slate-800">
              unité de coordination des projets
            </strong>
            <span className="text-[0.74rem] text-slate-500 tracking-[0.03em]">e-Procurement</span>
          </div>
        </Link>

        {/* Actions - Déconnexion */}
        <div className="justify-self-end">
          {showAuthenticatedActions && (
            <button
              type="button"
              onClick={handleLogout}
              className="px-[0.95rem] py-[0.46rem] rounded-full border border-slate-300 bg-white text-[#2f3d4c] text-[0.8rem] font-bold transition-all hover:bg-slate-50 shadow-[0_10px_20px_-16px_rgba(6,20,34,0.65)]"
            >
              Déconnexion
            </button>
          )}
        </div>
      </div>

    </header>

      {showAuthenticatedActions && (
        <div className="-mt-px">
          <div className="max-w-[1480px] mx-auto px-1 py-1 ">
            <div className="inline-flex">
              <Menu key={pathname} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
