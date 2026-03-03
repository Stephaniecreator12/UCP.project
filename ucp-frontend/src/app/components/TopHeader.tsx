"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken, logout } from "@/services/auth";

export default function TopHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark";
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
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

  const isAuthenticated = Boolean(getToken());
  const showAuthenticatedActions = isAuthenticated && pathname !== "/login";

  return (
    <header className="app-top-header">
      <div className="app-topline" aria-hidden="true" />
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
          <div className="app-brand-text">
            <strong>UCP e-Proc</strong>
            <span>Coordination & Passation</span>
          </div>
        </Link>

        <div className="app-quick-links">
          {showAuthenticatedActions && (
            <Link
              href="/formulaire"
              className={`quick-link-btn ${pathname === "/formulaire" ? "active-page" : ""}`}
            >
              PPM
            </Link>
          )}
          {showAuthenticatedActions && (
            <Link
              href="/dashboard"
              className={`quick-link-btn ${pathname === "/dashboard" ? "active-page" : ""}`}
            >
              Dashboard
            </Link>
          )}
        </div>

        <div className="app-top-actions">
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Changer le thème"
            title={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
          >
            {theme === "dark" ? "Clair" : "Sombre"}
          </button>
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
