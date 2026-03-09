"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { logout } from "@/services/auth";

type TopHeaderProps = {
  variant?: "default" | "compact";
};

export default function TopHeader({ variant = "default" }: TopHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const headerRef = useRef<HTMLElement | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
    return "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

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
  const isCompact = variant === "compact";

  const handleHeaderMove = (event: MouseEvent<HTMLElement>) => {
    if (isCompact) return;
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
      className={
        isCompact
          ? "sticky top-0 z-40 border-b border-border/80 bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/85"
          : "app-top-header modern-header"
      }
      onMouseMove={handleHeaderMove}
      onMouseLeave={resetHeaderGlow}
    >
      {!isCompact && <div className="app-topline" aria-hidden="true" />}
      {!isCompact && <div className="modern-header-orb modern-header-orb-left" aria-hidden="true" />}
      {!isCompact && <div className="modern-header-orb modern-header-orb-right" aria-hidden="true" />}
      <div
        className={
          isCompact
            ? "mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6"
            : "app-top-header-inner"
        }
      >
        <Link
          href={showAuthenticatedActions ? "/formulaire" : "/login"}
          className={isCompact ? "flex items-center gap-3" : "app-brand"}
        >
          <Image
            src="/ucp-sante-logo-color.png"
            alt="Logo UCP"
            width={62}
            height={62}
            className="app-brand-logo"
            priority
          />
          <div className={isCompact ? "flex flex-col" : "app-brand-text"}>
            <strong>UCP e-Proc</strong>
            <span className={isCompact ? "text-sm text-muted-foreground" : ""}>
              Coordination & Passation
            </span>
          </div>
        </Link>

        <div className={isCompact ? "hidden items-center gap-2 md:flex" : "app-quick-links modern-nav"}>
          {showAuthenticatedActions && (
            <Link
              href="/demande-achat"
              className={
                isCompact
                  ? `rounded-full px-3 py-2 text-sm font-medium transition ${
                      pathname === "/demande-achat"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`
                  : `quick-link-btn modern-pill ${pathname === "/demande-achat" ? "active-page" : ""}`
              }
            >
              Demande d&apos;Achat
            </Link>
          )}
          {showAuthenticatedActions && (
            <Link
              href="/formulaire"
              className={
                isCompact
                  ? `rounded-full px-3 py-2 text-sm font-medium transition ${
                      pathname === "/formulaire"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`
                  : `quick-link-btn modern-pill ${pathname === "/formulaire" ? "active-page" : ""}`
              }
            >
              PPM
            </Link>
          )}
          {showAuthenticatedActions && (
            <Link
              href="/dashboard"
              className={
                isCompact
                  ? `rounded-full px-3 py-2 text-sm font-medium transition ${
                      pathname === "/dashboard"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`
                  : `quick-link-btn modern-pill ${pathname === "/dashboard" ? "active-page" : ""}`
              }
            >
              Dashboard
            </Link>
          )}
        </div>

        <div className={isCompact ? "flex items-center gap-2" : "app-top-actions"}>
          <button
            type="button"
            className={
              isCompact
                ? "rounded-full border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                : "theme-toggle-btn"
            }
            onClick={toggleTheme}
            aria-label="Basculer le thème"
            title="Basculer le thème"
          >
            Theme
          </button>
          {showAuthenticatedActions && (
            <button
              type="button"
              className={
                isCompact
                  ? "rounded-full border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                  : "logout-btn"
              }
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
