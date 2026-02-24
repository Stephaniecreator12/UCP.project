"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Accueil" },
  { href: "/login", label: "Login" },
  { href: "/formulaire", label: "Formulaire" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function TopHeader() {
  const pathname = usePathname();
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

  return (
    <header className="app-top-header">
      <div className="app-topline" aria-hidden="true" />
      <div className="app-top-header-inner">
        <Link href="/" className="app-brand">
          <Image
            src="/ucp-sante-logo.svg"
            alt="Logo UCP"
            width={44}
            height={44}
            className="app-brand-logo"
            priority
          />
          <div className="app-brand-text">
            <strong>UCP e-Proc</strong>
            <span>Coordination & Passation</span>
          </div>
        </Link>

        <div className="app-top-nav-wrap">
          <nav className="app-top-nav" aria-label="Navigation principale">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`app-top-nav-link ${isActive ? "active" : ""}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
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
        </div>
      </div>
    </header>
  );
}
