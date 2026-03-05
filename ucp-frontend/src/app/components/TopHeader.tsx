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
      className="app-top-header modern-header"
      onMouseMove={handleHeaderMove}
      onMouseLeave={resetHeaderGlow}
    >
      <div className="app-topline" aria-hidden="true" />
      <div className="modern-header-orb modern-header-orb-left" aria-hidden="true" />
      <div className="modern-header-orb modern-header-orb-right" aria-hidden="true" />
      <div className="app-top-header-inner">
        <Link href={showAuthenticatedActions ? "/formulaire" : "/login"} className="app-brand">
          <Image
            src="/ucp-sante-logo-color.png"
            alt="Logo UCP"
            width={62}
            height={62}
            className="app-brand-logo"
            priority
          />
          <div >
            <strong className="login-title">unité de coordination des projets</strong>
            <span className="app-brand-text">e-Procurement</span>
          </div>
        </Link>

        <div className="app-quick-links modern-nav">
          {showAuthenticatedActions && (
            <Link
              href="/formulaire"
              className={`quick-link-btn modern-pill ${pathname === "/formulaire" ? "active-page" : ""}`}
            >
              PPM
            </Link>
          )}
          {showAuthenticatedActions && (
            <Link
              href="/dashboard"
              className={`quick-link-btn modern-pill ${pathname === "/dashboard" ? "active-page" : ""}`}
            >
              Dashboard
            </Link>
          )}
        </div>

        <div className="app-top-actions">
          {showAuthenticatedActions && (
            <button
              type="button"
              className="logout-btn"
              onClick={handleLogout}
              title="Se déconnecter"
            >
              Déconnexion
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
