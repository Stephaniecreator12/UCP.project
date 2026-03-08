"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, type MouseEvent } from "react";
import { logout } from "@/services/auth";

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
  const pillBaseClass =
    "rounded-full border border-[var(--line-strong)] bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-[0_10px_20px_-16px_rgba(6,20,34,0.65)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_24px_-16px_rgba(6,20,34,0.65)]";
  const activePillClass =
    "border-[color-mix(in_srgb,var(--green-strong)_60%,white)] bg-[linear-gradient(180deg,#15ba66,var(--green-strong))] text-white shadow-[0_8px_16px_-11px_rgba(5,123,64,0.8)]";

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
    <header
      ref={headerRef}
      className="sticky top-0 z-40 overflow-hidden border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] backdrop-blur-md"
      onMouseMove={handleHeaderMove}
      onMouseLeave={resetHeaderGlow}
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(420px circle at var(--mx) var(--my), color-mix(in srgb, var(--green) 16%, transparent), transparent 60%)",
        }}
      />
      <div
        className="h-[3px] bg-[linear-gradient(90deg,var(--green),#1fcf78,var(--green))]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-8 -top-12 h-32 w-32 rounded-full opacity-45 blur-[28px]"
        aria-hidden="true"
        style={{ background: "color-mix(in srgb, var(--green) 35%, transparent)" }}
      />
      <div
        className="pointer-events-none absolute -right-10 -top-16 h-36 w-36 rounded-full opacity-45 blur-[28px]"
        aria-hidden="true"
        style={{ background: "color-mix(in srgb, #7ed7ff 30%, transparent)" }}
      />
      <div className="relative z-[1] mx-auto grid max-w-[1480px] grid-cols-1 items-center gap-4 px-4 py-3 md:grid-cols-[auto_1fr_auto]">
        <Link
          href={showAuthenticatedActions ? "/formulaire" : "/login"}
          className="inline-flex items-center gap-3 text-inherit no-underline"
        >
          <Image
            src="/ucp-sante-logo-color.png"
            alt="Logo UCP"
            width={62}
            height={62}
            className="h-12 w-12 rounded-xl border border-[var(--line)] bg-white"
            priority
          />
          <div className="grid gap-1">
            <strong className="text-[0.96rem] font-bold uppercase tracking-[0.04em] text-[rgba(14,13,13,0.808)]">
              unitÃ© de coordination des projets
            </strong>
            <span className="text-xs tracking-[0.04em] text-gray-500">e-Procurement</span>
          </div>
        </Link>

        <div className="inline-flex items-center justify-center gap-2 md:justify-self-center">
          {showAuthenticatedActions && (
            <Link
              href="/formulaire"
              className={`${pillBaseClass} ${pathname === "/formulaire" ? activePillClass : ""}`}
            >
              PPM
            </Link>
          )}
          {showAuthenticatedActions && (
            <Link
              href="/dashboard"
              className={`${pillBaseClass} ${pathname === "/dashboard" ? activePillClass : ""}`}
            >
              Dashboard
            </Link>
          )}
        </div>

        <div className="md:justify-self-end">
          {showAuthenticatedActions && (
            <button
              type="button"
              className={`${pillBaseClass} text-[0.8rem]`}
              onClick={handleLogout}
              title="Se dÃ©connecter"
            >
              DÃ©connexion
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
